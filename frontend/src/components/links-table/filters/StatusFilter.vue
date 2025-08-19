<template>
  <div
    class="scroll-hide flex gap-1 overflow-x-auto max-w-[200px] px-1 select-none"
    style="scrollbar-width: none; -ms-overflow-style: none"
    @wheel="handleWheelScroll"
    ref="scrollContainer"
  >
    <button
      v-for="status in statusOptions"
      :key="status.code"
      @click="toggle(status.code)"
      :class="[
        'whitespace-nowrap px-2 py-0.5 text-[11px] font-semibold rounded-full border',
        modelValue === status.code ? status.active : status.inactive,
      ]"
      v-tooltip="status.label"
    >
      {{ status.code }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  modelValue: string | null;
  statusOptions: {
    code: string;
    label: string;
    active: string;
    inactive: string;
  }[];
}>();
const emit = defineEmits(["update:modelValue"]);

const scrollContainer = ref<HTMLElement>();

function toggle(code: string) {
  // toggle selection
  emit("update:modelValue", props.modelValue === code ? "" : code);
}

function handleWheelScroll(event: WheelEvent) {
  const container = scrollContainer.value;
  if (!container || event.deltaY === 0) return;
  event.preventDefault();
  container.scrollLeft += event.deltaY;
}
</script>
