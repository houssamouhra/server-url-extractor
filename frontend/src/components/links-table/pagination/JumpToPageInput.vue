<template>
  <!-- “Jump to page” input -->
  <div class="flex items-center gap-2 text-sm text-gray-700">
    <span class="text-sm text-gray-700">
      Page
      <span class="text-sm text-gray-900">{{ currentPage }}</span> of
      <span class="text-sm text-gray-900">{{ totalPages }} —</span>
    </span>
    <label for="jump-page-input" class="whitespace-nowrap">Jump to page:</label>

    <input
      id="jump-page-input"
      v-model.number="jumpPage"
      @keyup.enter="handleJump"
      type="number"
      min="1"
      :max="totalPages"
      :class="[
        'w-16 px-2 py-1.5 rounded-lg shadow-sm text-sm bg-white text-gray-700  placeholder:text-slate-400',
        'focus:outline-none focus:shadow-lg transition duration-150 ease-in-out',
        shakeInput ? 'shake border-red-400 ring-2 ring-red-300' : '',
        'appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
      ]"
      placeholder="e.g. 4"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { toast } from "vue-sonner";

const props = defineProps<{
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  (e: "jump", page: number): void;
}>();

const jumpPage = ref<number | null>(null);
const shakeInput = ref(false);

function handleJump() {
  if (
    jumpPage.value &&
    jumpPage.value >= 1 &&
    jumpPage.value <= props.totalPages
  ) {
    emit("jump", jumpPage.value);
    shakeInput.value = false;
  } else {
    // invalid input → shake animation
    shakeInput.value = true;
    setTimeout(() => {
      shakeInput.value = false;
    }, 500);

    toast.error(`Please enter a number between 1 and ${props.totalPages}.`);
  }
}

// Reset input if currentPage changes externally
watch(
  () => props.currentPage,
  (newPage) => {
    jumpPage.value = newPage;
  },
  { immediate: true }
);
</script>

<style>
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-4px);
  }
  40%,
  80% {
    transform: translateX(4px);
  }
}

.shake {
  animation: shake 0.4s ease-in-out;
}
</style>
