<template>
  <weblet-layout
    ref="layout"
    :cpu="solution?.cpu"
    :memory="solution?.memory"
    :disk="solution?.disk + rootFilesystemSize"
    :ipv4="ipv4"
    :certified="certified"
    :dedicated="dedicated"
    title-image="images/icons/mattermost.png"
  >
    <template #title>Deploy a Mattermost Instance </template>

    <d-tabs
      :tabs="[
        { title: 'Base', value: 'base' },
        { title: 'SMTP Server', value: 'smtp' },
      ]"
      ref="tabs"
    >
      <template #base>
        <input-validator
          :value="name"
          :rules="[
            validators.required('Name is required.'),
            validators.isLowercase('Name should consist of lowercase letters only.'),
            validators.isAlphanumeric('Name should consist of letters and numbers only.'),
            name => validators.isAlpha('Name must start with alphabet char.')(name[0]),
            validators.minLength('Name must be at least 2 characters.', 2),
            validators.maxLength('Name cannot exceed 15 characters.', 15),
          ]"
          #="{ props }"
        >
          <input-tooltip tooltip="Instance name.">
            <v-text-field label="Name" v-model="name" v-bind="props" />
          </input-tooltip>
        </input-validator>

        <SelectSolutionFlavor
          v-model="solution"
          :standard="{ cpu: 2, memory: 1024 * 4, disk: 50 }"
          :recommended="{ cpu: 4, memory: 1024 * 4, disk: 100 }"
          :disabled="loadingFarm"
        />
        <!-- <Networks v-model:ipv4="ipv4" /> -->
        <FarmGatewayManager>
          <input-tooltip
            inline
            tooltip="Click to know more about dedicated nodes."
            href="https://manual.grid.tf/dashboard/portal/dashboard_portal_dedicated_nodes.html"
          >
            <v-switch
              color="primary"
              inset
              label="Dedicated"
              v-model="dedicated"
              :disabled="loadingFarm"
              hide-details
            />
          </input-tooltip>
          <input-tooltip inline tooltip="Renting capacity on certified nodes is charged 25% extra.">
            <v-switch
              color="primary"
              inset
              label="Certified"
              v-model="certified"
              :disabled="loadingFarm"
              hide-details
            />
          </input-tooltip>

          <SelectFarmManager>
            <SelectFarm
              :filters="{
                cpu: solution?.cpu,
                memory: solution?.memory,
                ssd: (solution?.disk ?? 0) + rootFilesystemSize,
                publicIp: ipv4,
                rentedBy: dedicated ? profileManager.profile?.twinId : undefined,
                certified: certified,
              }"
              v-model="farm"
              v-model:loading="loadingFarm"
            />

            <SelectNode
              v-model="selectedNode"
              :filters="{
                farmId: farm?.farmID,
                cpu: solution?.cpu,
                memory: solution?.memory,
                diskSizes: [solution?.disk],
                rentedBy: dedicated ? profileManager.profile?.twinId : undefined,
                certified: certified,
              }"
              :root-file-system-size="rootFilesystemSize"
            />
          </SelectFarmManager>

          <DomainName :hasIPv4="ipv4" ref="domainNameCmp" />
        </FarmGatewayManager>
      </template>

      <template #smtp>
        <SmtpServer v-model="smtp" />
      </template>
    </d-tabs>

    <template #footer-actions>
      <v-btn
        color="primary"
        variant="tonal"
        @click="deploy(domainNameCmp?.domain, domainNameCmp?.customDomain)"
        :disabled="tabs?.invalid"
      >
        Deploy
      </v-btn>
    </template>
  </weblet-layout>
</template>

<script lang="ts" setup>
import type { GridClient } from "@threefold/grid_client";
import { computed, type Ref, ref } from "vue";

import { useLayout } from "../components/weblet_layout.vue";
import { useProfileManager } from "../stores";
import type { Farm, Flist, GatewayNode, solutionFlavor as SolutionFlavor } from "../types";
import { ProjectName } from "../types";
import { deployVM } from "../utils/deploy_vm";
import { deployGatewayName, getSubdomain, rollbackDeployment } from "../utils/gateway";
import { getGrid } from "../utils/grid";
import { generateName, generatePassword } from "../utils/strings";

const layout = useLayout();
const tabs = ref();
const profileManager = useProfileManager();

const name = ref(generateName({ prefix: "mm" }));
const solution = ref() as Ref<SolutionFlavor>;
const farm = ref() as Ref<Farm>;
const loadingFarm = ref(false);
const flist: Flist = {
  value: "https://hub.grid.tf/tf-official-apps/mattermost-latest.flist",
  entryPoint: "/sbin/zinit init",
};
const dedicated = ref(false);
const certified = ref(false);
const selectedNode = ref() as Ref<INode>;
const ipv4 = ref(false);
const domainNameCmp = ref();
const smtp = ref(createSMTPServer());
const rootFilesystemSize = computed(() => rootFs(solution.value?.cpu ?? 0, solution.value?.memory ?? 0));
function finalize(deployment: any) {
  layout.value.reloadDeploymentsList();
  layout.value.setStatus("success", "Successfully deployed a mattermost instance.");
  layout.value.openDialog(deployment, deploymentListEnvironments.mattermost);
}

async function deploy(gatewayName: GatewayNode, customDomain: boolean) {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.Mattermost.toLowerCase() + "/" + name.value;

  const subdomain = getSubdomain({
    deploymentName: name.value,
    projectName,
    twinId: profileManager.profile!.twinId,
  });
  const domain = customDomain ? gatewayName.domain : subdomain + "." + gatewayName.domain;

  let grid: GridClient | null;
  let vm: any;

  try {
    layout.value?.validateSSH();
    grid = await getGrid(profileManager.profile!, projectName);

    await layout.value.validateBalance(grid!);

    vm = await deployVM(grid!, {
      name: name.value,
      network: {
        accessNodeId: gatewayName.id,
        addAccess: !!gatewayName.id,
      },
      machines: [
        {
          name: name.value,
          cpu: solution.value.cpu,
          memory: solution.value.memory,
          disks: [
            {
              size: solution.value.disk,
              mountPoint: "/var/lib/docker",
            },
          ],
          flist: flist.value,
          entryPoint: flist.entryPoint,
          rootFilesystemSize: rootFilesystemSize.value,
          farmId: farm.value.farmID,
          farmName: farm.value.name,
          publicIpv4: ipv4.value,
          country: farm.value.country,
          planetary: true,
          envs: [
            { key: "SSH_KEY", value: profileManager.profile!.ssh },
            { key: "DB_PASSWORD", value: generatePassword() },
            { key: "SITE_URL", value: "https://" + domain },
            { key: "MATTERMOST_DOMAIN", value: domain },
            ...(smtp.value.enabled
              ? [
                  { key: "SMTPUsername", value: smtp.value.username },
                  { key: "SMTPPassword", value: smtp.value.password },
                  { key: "SMTPServer", value: smtp.value.hostname },
                  { key: "SMTPPort", value: smtp.value.port.toString() },
                ]
              : []),
          ],
          nodeId: selectedNode.value.nodeId,
          rentedBy: dedicated.value ? grid!.twinId : undefined,
          certified: certified.value,
        },
      ],
    });
  } catch (e) {
    return layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a mattermost instance."));
  }
  if (customDomain && ipv4.value) {
    vm[0].customDomain = gatewayName.domain;
    finalize(vm);
    return;
  }
  try {
    layout.value.setStatus("deploy", "Preparing to deploy gateway...");
    await deployGatewayName(grid!, {
      name: subdomain,
      nodeId: gatewayName.id!,
      ip: vm[0].interfaces[0].ip,
      port: 8000,
      networkName: vm[0].interfaces[0].network,
      fqdn: gatewayName?.useFQDN ? gatewayName.domain : undefined,
    });

    finalize(vm);
  } catch (e) {
    layout.value.setStatus("deploy", "Rollbacking back due to fail to deploy gateway...");
    await rollbackDeployment(grid!, name.value);
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a mattermost instance."));
  }
}
</script>

<script lang="ts">
import DomainName from "../components/domain_name.vue";
import FarmGatewayManager from "../components/farm_gateway_manager.vue";
// import Networks from "../components/networks.vue";
import SelectFarm from "../components/select_farm.vue";
import SelectFarmManager from "../components/select_farm_manager.vue";
import SelectNode from "../components/select_node.vue";
import SelectSolutionFlavor from "../components/select_solution_flavor.vue";
import SmtpServer, { createSMTPServer } from "../components/smtp_server.vue";
import { deploymentListEnvironments } from "../constants";
import type { INode } from "../utils/filter_nodes";
import { normalizeError } from "../utils/helpers";
import rootFs from "../utils/root_fs";

export default {
  name: "TfMattermost",
  components: {
    SmtpServer,
    SelectSolutionFlavor,
    SelectFarm,
    SelectNode,
    // Networks,
    DomainName,
    FarmGatewayManager,
    SelectFarmManager,
  },
};
</script>
