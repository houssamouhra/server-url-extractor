<template>
  <!-- Prev/Next buttons -->
  <div class="inline-flex shadow-sm rounded-md overflow-hidden">
    <button
      @click="$emit('prev')"
      :disabled="disabledPrev"
      class="group flex items-center gap-1 px-4 h-10 text-sm font-medium text-white bg-[#82181a] hover:bg-[#661415] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition"
    >
      <Icon
        icon="solar:arrow-left-bold-duotone"
        width="20"
        height="20"
        class="transition-transform duration-200"
        :class="[
          !disabledPrev &&
            'group-hover:-translate-x-[2px] group-hover:scale-110',
        ]"
      />
      Prev
    </button>

    <button
      @click="$emit('next')"
      :disabled="disabledNext"
      class="group flex items-center gap-1 px-4 h-10 text-sm font-medium text-white bg-[#82181a] hover:bg-[#661415] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition"
    >
      Next
      <Icon
        icon="solar:arrow-right-bold-duotone"
        width="20"
        height="20"
        class="transition-transform duration-200"
        :class="[
          !disabledNext &&
            'group-hover:translate-x-[2px] group-hover:scale-110',
        ]"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{
  disabledPrev: boolean;
  disabledNext: boolean;
}>();

defineEmits<{ (e: "prev"): void; (e: "next"): void }>();
</script>

<style lang="scss" scoped></style>
