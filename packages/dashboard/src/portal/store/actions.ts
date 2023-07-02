import { web3AccountsSubscribe, web3Enable } from "@polkadot/extension-dapp";
import type { ActionContext } from "vuex";

import { getProposals } from "../lib/dao";
import { getFarm } from "../lib/farms";
import { PortalState } from "./state";

export enum ActionTypes {
  REQUEST_DEDICATED_NODES = "requestDedicatedNodes",
}

export default {
  async subscribeAccounts({ commit }: ActionContext<PortalState, PortalState>) {
    await web3Enable("TF Chain UI");
    await web3AccountsSubscribe(injectedAccounts => {
      commit("setAccounts", { accounts: injectedAccounts });
    });
  },

  async requestDedicatedNodes({ state, commit }: ActionContext<PortalState, PortalState>) {
    let url = `${window.configs.APP_GRIDPROXY_URL}/nodes?ret_count=true&rentable=true`;
    url += `&size=${state.dedicatedNodesTablePageSize}`;
    url += `&page=${state.dedicatedNodesTablePageNumber}`;

    for (const key in state.dedicatedNodesFilter) {
      let value = state.dedicatedNodesFilter[key];

      if (key == "free_hru" || key == "free_mru" || key == "free_sru" || key == "free_cru") {
        value *= 1024 * 1024 * 1024; // convert from gb to b
      }

      // don't break the call for the null values
      if (value == null || value == undefined) value = "";

      url += `&${key}=${value}`;
    }
    // console.log('url => ', url);
  },

  async unsubscribeAccounts({ commit }: ActionContext<PortalState, PortalState>) {
    const unsubscribe = await web3AccountsSubscribe(() => {
      console.log(`unsubscribing`);
    });
    unsubscribe && unsubscribe();
    commit("removeAccounts");
  },
  async getProposal({ commit, state }: ActionContext<PortalState, PortalState>, twin: number) {
    const active = (await getProposals(state.api)).active;
    if (!active.length) return;
    const farms = await getFarm(state.api, parseFloat(`${twin}`));

    // only users who own a farm should get the notification
    if (!farms.length) {
      commit("setProposals", { proposals: 0 });
      return;
    }
    const farmIds = farms.map(function (value) {
      return value.id;
    });

    const voted: number[] = [];
    active.forEach((proposal, index) => {
      let inYes = false;
      proposal.ayes.forEach(({ farmId }) => {
        if (farmIds.includes(farmId)) {
          inYes = true;
          voted.push(index);
          return;
        }
      });
      if (inYes) return;
      proposal.nayes.forEach(({ farmId }) => {
        if (farmIds.includes(farmId)) {
          voted.push(index);
          return;
        }
      });
    });
    voted.forEach(index => {
      active.splice(index, 1);
    });
    commit("setProposals", { proposals: active.length });
  },
};
