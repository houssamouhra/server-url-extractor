<!-- prettier-ignore -->
<template>
  <th
    :class="[
      'px-4 py-2 whitespace-nowrap cursor-pointer select-none',
      isLast ? 'rounded-tr-xl' : '',
    ]">
    <div class="group h-[20px] overflow-hidden">
      <div class="flex flex-col transition-transform duration-700 group-hover:-translate-y-6">
        <span class="font-bold text-sm tracking-wide">{{ label }}</span>
        <span class="font-bold text-sm tracking-wide">{{ label }}</span>
      </div>
    </div>
  </th>
</template>

<!-- prettier-ignore -->
<script setup lang="ts">
const { label, isLast } = defineProps<{
  label: string;
  labelKey: string;
  index: number;
  isLast: boolean;
  activeFilterKey: string | null;
}>();
</script>
