<template>
  <div class="relative">
    <input
      v-model="localValue"
      :ref="col.keyName === 'dropId' ? 'dropIdInput' : undefined"
      :type="col.keyName === 'batchId' ? 'text' : col.type || 'text'"
      :placeholder="`Filter ${col.label}`"
      class="w-full pr-6 px-2 py-2 text-xs border-gray-200 border bg-white/80 rounded-xl hover:shadow-sm placeholder:font-normal focus:outline-none"
      :class="{
        'focus:ring-2 focus:ring-red-900/60 hover:bg-white transition-all duration-200': true,
        'ring-1 ring-amber-500': localValue !== '',
      }"
      @keydown="handleKeyDown"
      @paste="handlePaste"
    />

    <!-- Clear Icon -->
    <Icon
      v-if="
        localValue &&
        !['status', 'included', 'redirection'].includes(col.keyName)
      "
      icon="solar:close-circle-bold-duotone"
      width="18"
      height="18"
      class="absolute right-1.5 top-2 cursor-pointer hover:scale-110 transition"
      style="color: #888"
      @click="clear"
      v-tooltip="'Clear the filter'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps<{
  modelValue: string | Date | null;
  col: { keyName: string; label?: string; type?: string };
}>();
const emit = defineEmits(["update:modelValue"]);

// local ref to allow v-model
const localValue = ref(props.modelValue);

// sync localValue -> parent via emit
watch(localValue, (val) => {
  emit("update:modelValue", val);
});

// sync prop changes -> localValue
watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val;
  }
);

function clear() {
  localValue.value = "";
}

function handleKeyDown(e: KeyboardEvent) {
  if (props.col.keyName !== "batchId") return;
  const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete"];
  if (e.ctrlKey || e.metaKey || allowedKeys.includes(e.key)) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
}

function handlePaste(e: ClipboardEvent) {
  if (props.col.keyName !== "batchId") return;
  const pasted = e.clipboardData?.getData("text")?.trim() ?? "";
  if (!/^\d+$/.test(pasted)) e.preventDefault();
}
</script>
