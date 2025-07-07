<!-- prettier-ignore -->
<template>
  <div class="flex flex-col items-center justify-center absolute inset-0 rounded-2xl bg-white text-center text-gray-600">
    <Icon
      icon="streamline-pixel:entertainment-events-hobbies-horror-ghost"
      width="48"
      height="48"
      class="animate-fade-in mb-4 text-gray-400"
    />
    <p class="text-lg font-semibold">No matching results</p>
    <p class="text-sm text-gray-500">Try adjusting or clearing your filters.</p>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
</script>

<style scoped>
@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
