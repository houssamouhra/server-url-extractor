<template>
  <div class="flex justify-center gap-1 items-center">
    <!-- TRUE Button -->
    <button
      @click="toggle('true')"
      v-tooltip="`Show ${label} (Yes)`"
      :class="[
        'p-1 rounded-full border transition-all duration-200',
        model === 'true'
          ? activeTrueClass
          : inactiveClass + ' hover:' + hoverTrueTextColor,
      ]"
    >
      <Icon :icon="iconTrue" width="18" height="18" />
    </button>

    <!-- FALSE Button -->
    <button
      @click="toggle('false')"
      v-tooltip="`Show ${label} (No)`"
      :class="[
        'p-1 rounded-full border transition-all duration-200',
        model === 'false'
          ? activeFalseClass
          : inactiveClass + ' hover:' + hoverFalseTextColor,
      ]"
    >
      <Icon :icon="iconFalse" width="18" height="18" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

const model = defineModel<"" | "true" | "false" | null | undefined>(
  "modelValue"
);

const props = defineProps<{
  label: string;
  iconTrue?: string;
  iconFalse?: string;
  activeTrueClass?: string;
  activeFalseClass?: string;
  inactiveClass?: string;
  hoverTrueTextColor?: string;
  hoverFalseTextColor?: string;
}>();

// Default values
const iconTrue = props.iconTrue ?? "solar:check-circle-bold-duotone";
const iconFalse = props.iconFalse ?? "solar:close-circle-bold-duotone";
const activeTrueClass =
  props.activeTrueClass ?? "bg-green-100 border-green-400 text-green-700";
const activeFalseClass =
  props.activeFalseClass ?? "bg-red-100 border-red-400 text-[#f87171]";
const inactiveClass =
  props.inactiveClass ?? "bg-white border-gray-200 text-gray-400";
const hoverTrueTextColor = props.hoverTrueTextColor ?? "text-green-600";
const hoverFalseTextColor = props.hoverFalseTextColor ?? "text-[#f87171]";

// Toggle logic
function toggle(value: "true" | "false") {
  // ✅ Narrow model.value before assignment
  const current = model.value as "" | "true" | "false" | null | undefined;
  model.value = current === value ? "" : value;
}
</script>
