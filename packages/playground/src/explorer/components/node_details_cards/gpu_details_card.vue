<template>
  <card-details
    :is-list-items="true"
    :loading="loading"
    title="GPUs Details"
    :items="gpuFields"
    icon="mdi-credit-card-settings-outline"
  >
    <template #gpu-hint-message>
      <v-chip class="d-flex justify-center ma-4 mt-1" color="info">
        Select a GPU card ID from the below selection to load its data.
      </v-chip>
      <v-row class="bb-gray">
        <v-col class="ml-3 d-flex justify-start align-center">
          Card ID
          <v-chip class="ml-4" :color="selectedCard.contract ? 'warning' : 'primary'">
            {{ selectedCard.contract ? "Reserved" : "Available" }}
          </v-chip>
        </v-col>
        <v-col class="mr-3 d-flex justify-end align-center">
          <v-select chips clearable hide-details="auto" v-model="cardId" :items="cardsIds" variant="outlined" />
          <v-icon class="ml-1" :icon="'mdi-content-copy'" @click="copy(cardId)" />
        </v-col>
      </v-row>
    </template>
  </card-details>
</template>

<script lang="ts">
import type { GPUCard, GridNode } from "@threefold/gridproxy_client";
import { onMounted, type PropType, ref } from "vue";
import { watch } from "vue";

import type { NodeDetailsCard } from "@/explorer/utils/types";
import { createCustomToast, ToastType } from "@/utils/custom_toast";

import CardDetails from "./card_details.vue";

export default {
  name: "GPUDetailsCard",
  components: { CardDetails },
  props: {
    node: {
      type: Object as PropType<GridNode>,
      required: true,
    },
  },

  setup(props) {
    const loading = ref<boolean>(false);
    const gpuFields = ref<NodeDetailsCard[]>([]);
    const cardsIds = ref<string[]>([]);
    const cardId = ref<string>("");
    const selectedCard = ref<GPUCard>(props.node.cards[0]);

    watch(cardId, newCardId => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      selectedCard.value = props.node.cards.find(card => card.id === newCardId)!;
      gpuFields.value = getNodeTwinDetailsCard();
    });

    const mount = () => {
      loading.value = true;
      selectedCard.value = props.node.cards[0];
      props.node.cards.map((card: GPUCard) => {
        cardsIds.value.push(card.id);
      });
      cardId.value = cardsIds.value[0];
      gpuFields.value = getNodeTwinDetailsCard();
      loading.value = false;
    };

    onMounted(mount);

    const copy = (value: string) => {
      navigator.clipboard.writeText(value);
      createCustomToast("Copied!", ToastType.success);
    };

    const getNodeTwinDetailsCard = (): NodeDetailsCard[] => {
      return [
        {
          name: "Vendor",
          value: selectedCard.value.vendor,
          hint: selectedCard.value.vendor,
        },
        {
          name: "Device",
          value: selectedCard.value.device,
          hint: selectedCard.value.device,
        },
        {
          name: "Contract ID",
          value: selectedCard.value.contract === 0 ? "N/A" : selectedCard.value.contract.toString(),
        },
      ];
    };

    return {
      gpuFields,
      loading,
      cardsIds,
      cardId,
      selectedCard,
      copy,
    };
  },
};
</script>

<style scoped>
.bb-gray {
  border-bottom: 1px solid gray;
}
</style>
