import { web3AccountsSubscribe, web3Enable } from "@polkadot/extension-dapp";
import type { ActionContext } from "vuex";

import { getProposals } from "../lib/dao";
import { getFarm } from "../lib/farms";
import { updateDedicatedNodes } from "../lib/nodes";
import { MutationTypes } from "./mutations";
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
    commit(MutationTypes.SET_TABLE_LOAD, true);

    let url = `${window.configs.APP_GRIDPROXY_URL}/nodes?status=up&ret_count=true&rentable=true`;
    url += `&size=${state.dedicatedNodesTablePageSize}`;
    url += `&page=${state.dedicatedNodesTablePageNumber}`;

    for (const key in state.dedicatedNodesFilter) {
      let value = state.dedicatedNodesFilter[key];
      if (key == "free_hru" || key == "free_mru" || key == "free_sru" || key == "free_cru") {
        value *= 1024 * 1024 * 1024; // convert from gb to b
      }
      // don't break the call for the null values
      if (value == null || value == undefined || value == 0) value = "";
      url += `&${key}=${value}`;
    }

    const res = await fetch(url);

    const nodesCount: any = res.headers.get("count");
    commit(MutationTypes.SET_DEDICATED_NODES_COUNT, +nodesCount);

    let nodes = await res.json();
    // Update the nodes with price and discount.
    nodes = await updateDedicatedNodes(state.api, state.address, nodes);

    commit(MutationTypes.SET_DEDICATED_NODES, { nodes });
    commit(MutationTypes.SET_TABLE_LOAD, false);
  },

  async unsubscribeAccounts({ commit }: ActionContext<PortalState, PortalState>) {
    const unsubscribe = await web3AccountsSubscribe(() => {
      console.log(`unsubscribing`);
    });
    unsubscribe && unsubscribe();
    commit("removeAccounts");
  },
  async getProposal({ commit, state }: ActionContext<PortalState, PortalState>, twin: number) {
    if (state.api) {
      console.log(state.api, "ahooooooooooooooooooooooooooooooooooo");

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
    }
  },
};
