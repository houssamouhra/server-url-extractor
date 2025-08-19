<template>
  <DatePicker
    v-model="dateModel"
    @clear-click="dateModel = null"
    dateFormat="dd/mm/yy"
    showIcon
    name="date"
    iconDisplay="input"
    size="small"
    placeholder="dd-mm-yyyy"
    :showButtonBar="true"
    class="w-full"
    :pt="{
      input: { class: 'pl-9' },
      inputIcon: { class: 'text-gray-400 left-4 w-4 h-4' },
    }"
    :inputClass="[
      'text-xs px-2 py-[8px] bg-white/80 shadow-none rounded-xl hover:shadow-sm border border-gray-200',
      'placeholder:font-normal placeholder:text-neutral-500',
      'focus:ring-2 focus:ring-red-900/60 hover:bg-white transition-all duration-200',
      modelValue ? 'ring-1 ring-amber-500' : '',
    ]"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import DatePicker from "primevue/datepicker";

const modelValue = defineModel<string | Date | null>("modelValue");

defineProps<{
  keyName: string;
}>();

// Convert to Date object if needed
const dateModel = computed<Date | null>({
  get() {
    const val = modelValue.value;
    if (!val) return null;
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  },
  set(newVal) {
    modelValue.value =
      newVal instanceof Date && !isNaN(newVal.getTime()) ? newVal : null;
  },
});
</script>
