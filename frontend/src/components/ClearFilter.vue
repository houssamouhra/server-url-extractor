<template>
  <button
    v-tooltip="'Clear All Filters'"
    label="Button"
    class="relative group bg-yellow-200/40 p-2 max-w-9 min-h-6 rounded-t-xl"
    @click="handleClick"
  >
    <Icon
      icon="hugeicons:filter-reset"
      class="cursor-pointer text-[#625a42] hover:text-[#312d21] transition-transform group-hover:scale-105"
      width="24"
      height="24"
    />
  </button>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

// Emits a custom event for external control
const emit = defineEmits<{
  (e: "clear"): void;
}>();

const handleClick = () => {
  emit("clear");
};
</script>
