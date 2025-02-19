<template>
  <div>
    <!--loading-->
    <v-sheet color="transparent" height="82vh" v-if="loading" class="d-flex align-center justify-center">
      <v-container class="text-center d-block">
        <v-progress-circular size="40" indeterminate />
        <p class="pt-4 font-weight-bold">Loading Statistics</p>
      </v-container>
    </v-sheet>

    <!--error-->
    <v-sheet color="transparent" height="82vh" v-else-if="failed" class="d-flex align-center w-100 justify-center">
      <v-container class="text-center">
        <v-icon color="error" size="x-large">mdi-close-circle-outline</v-icon>
        <v-container class="text-error">
          Failed to get stats data, Please check you internet connection or try again later</v-container
        >
        <v-btn class="text-capitalize" @click="getStatsData(true)" color="secondary">Try again </v-btn>
      </v-container>
    </v-sheet>

    <v-container fluid class="py-0 pt-4 ml-2 d-flex justify-center" v-else>
      <v-row class="w-100 py-0">
        <v-col xl="8" lg="8" md="12" cols="12" class="mt-2 pb-0 px-0">
          <v-col xl="12" lg="12" cols="12" class="mx-auto pb-0">
            <tf-map r="125" g="227" b="200" :nodes="nodesDistribution" />
          </v-col>
        </v-col>

        <v-col v-if="Istats.length !== 0" class="d-flex flex-wrap justify-center pt-6 pb-0 px-0">
          <v-col
            v-for="item of Istats"
            :key="item.title"
            xl="5"
            lg="5"
            md="3"
            sm="9"
            xs="9"
            cols="9"
            class="text-center pt-1 pb-0"
          >
            <StatisticsCard :item="item" />
          </v-col>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { Network } from "@threefold/gridproxy_client";
import { computed, type Ref, ref, watch } from "vue";

import type { IStatistics, NetworkStats } from "../types/index";
import { formatData, getStats } from "../utils/stats";
import toTeraOrGigaOrPeta from "../utils/toTeraOrGegaOrPeta";
import StatisticsCard from "./statistics_card.vue";

const props = defineProps({
  networks: {
    type: Object,
    require: true,
  },
});

const loading = ref(true);
const failed = ref(false);

const networkStats: Ref<NetworkStats> = ref({
  dev: undefined,
  main: undefined,
  test: undefined,
});

const formattedStats = computed(() => {
  return formatData(props.networks as Network[], networkStats.value);
});
const nodesDistribution = computed(() => JSON.stringify(formattedStats.value.nodesDistribution));
const Istats = computed((): IStatistics[] => {
  {
    return [
      { data: formattedStats.value.nodes, title: "Nodes Online", icon: "mdi-laptop" },
      { data: formattedStats.value.farms, title: "Farms", icon: "mdi-tractor" },
      { data: formattedStats.value.countries, title: "Countries", icon: "mdi-earth" },
      { data: formattedStats.value.totalCru, title: "CPUs", icon: "mdi-cpu-64-bit" },
      { data: toTeraOrGigaOrPeta(formattedStats.value.totalSru.toString()), title: "SSD Storage", icon: "mdi-nas" },
      {
        data: toTeraOrGigaOrPeta(formattedStats.value.totalHru.toString()),
        title: "HDD Storage",
        icon: "mdi-harddisk",
      },
      { data: toTeraOrGigaOrPeta(formattedStats.value.totalMru.toString()), title: "RAM", icon: "mdi-memory" },
      { data: formattedStats.value.accessNodes, title: "Access Nodes", icon: "mdi-gate" },
      { data: formattedStats.value.gateways, title: "Gateways", icon: "mdi-boom-gate-outline" },
      { data: formattedStats.value.twins, title: "Twins", icon: "mdi-brain" },
      { data: formattedStats.value.publicIps, title: "Public IPs", icon: "mdi-access-point" },
      { data: formattedStats.value.contracts, title: "Contracts", icon: "mdi-file-document-edit-outline" },
    ];
  }
});
async function getStatsData(refresh = false) {
  props.networks!.forEach(async (network: Network) => {
    if (!networkStats.value[network] || refresh)
      try {
        failed.value = false;
        loading.value = true;
        networkStats.value[network] = await getStats(network.toLowerCase() as Network);
      } catch (error) {
        failed.value = true;
      } finally {
        loading.value = false;
      }
  });
}
watch(
  () => props.networks,
  async () => await getStatsData(),
  { deep: true },
);

defineExpose({ loading, getStatsData });
</script>
<script lang="ts">
export default {
  name: "StatsTable",
};
</script>
