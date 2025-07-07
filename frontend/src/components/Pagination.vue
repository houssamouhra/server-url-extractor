<!-- prettier-ignore -->
<template>
  <div v-if="hasResults" class="relative overflow-visible">
    <div class="flex flex-col items-center sm:flex-row sm:justify-between mt-6 px-4">
      <!-- Help text -->
      <div class="text-sm text-gray-700 flex flex-wrap items-center gap-1.5">
        Showing
        <span class="text-sm text-gray-600">{{ startIndex }}</span>
        to
        <span class="text-sm text-gray-600">{{ endIndex }}</span>
        of
        <span class="text-sm text-gray-600">{{ totalItems }}</span>
        entries —

        <span class="text-gray-700">show</span>

        <div class="relative w-[100px] z-10 overflow-visible">
          <Listbox v-model="model">
            <div>
              <ListboxButton class="min-w-[100px] cursor-pointer rounded-lg bg-white py-1.5 pl-3 pr-10 text-left text-sm shadow-sm focus:outline-none hover:border-slate-400">
                <span class="block truncate">{{ rowsPerPage }}</span>
                <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <Icon
                    icon="heroicons:chevron-up-down-solid"
                    class="text-gray-400"
                    width="20"
                    height="20"
                  />
                </span>
              </ListboxButton>

              <transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-out"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <ListboxOptions class="absolute bottom-full mb-1 w-[100px] max-h-60 overflow-auto rounded-md bg-white py-1 text-sm ring-1 ring-black/5 focus:outline-none">
                  <ListboxOption
                    v-for="option in rowsOptions"
                    :key="option"
                    :value="option"
                    v-slot="{ active, selected }">
                    <li
                      :class="[
                        active ? 'bg-rose-100 text-rose-900' : 'text-gray-900',
                        'relative cursor-pointer select-none py-2 pl-10 pr-4',
                      ]">
                      <span
                        :class="[
                          selected ? 'font-semibold' : 'font-normal',
                          'block truncate',
                        ]">
                        {{ option }}
                      </span>
                      <span
                        v-if="selected"
                        class="absolute inset-y-0 left-0 flex items-center pl-3 text-red-900"
                      >
                        <Icon icon="mdi-light:check" width="20" height="20" />
                      </span>
                    </li>
                  </ListboxOption>
                </ListboxOptions>
              </transition>
            </div>
          </Listbox>
        </div>

        <span class="text-sm">per page</span>
      </div>

      <!-- Prev/Next buttons -->
      <div class="inline-flex shadow-sm rounded-md overflow-hidden">
        <button
          @click="handleLeftClick"
          :disabled="isLeftDisabled"
          class="group flex items-center gap-1 px-4 h-10 text-sm font-medium text-white bg-[#82181a] hover:bg-[#661415] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition">
          <Icon
            icon="solar:arrow-left-bold-duotone"
            width="20"
            height="20"
            class="transition-transform duration-200"
            :class="[
              !isLeftDisabled &&
                'group-hover:-translate-x-[2px] group-hover:scale-110',
            ]"/>
          Prev
        </button>

        <button
          @click="handleRightClick"
          :disabled="isRightDisabled"
          class="group flex items-center gap-1 px-4 h-10 text-sm font-medium text-white bg-[#82181a] hover:bg-[#661415] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition">
          Next
          <Icon
            icon="solar:arrow-right-bold-duotone"
            width="20"
            height="20"
            class="transition-transform duration-200"
            :class="[
              !isRightDisabled &&
                'group-hover:translate-x-[2px] group-hover:scale-110',
            ]"/>
        </button>
      </div>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { toast } from "vue-sonner";

const jumpPage = ref<string | number>("");
const shakeInput = ref(false);

const props = defineProps<{
  data: any[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  rowsPerPage: number;
}>();

const emit = defineEmits<{
  (e: "prev"): void;
  (e: "next"): void;
  (e: "update:currentPage", value: number): void;
  (e: "update:rowsPerPage", value: number): void;
}>();

const model = computed({
  get: () => props.rowsPerPage,
  set: (val) => emit("update:rowsPerPage", val),
});

import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";

const rowsOptions = [30, 50, 100];

const handleLeftClick = () => {
  if (props.currentPage > 1) emit("prev");
};

const handleRightClick = () => {
  if (props.currentPage < props.totalPages) emit("next");
};

const startIndex = computed(
  () => (props.currentPage - 1) * props.rowsPerPage + 1
);

const endIndex = computed(() =>
  Math.min(props.currentPage * props.rowsPerPage, props.totalItems)
);

const isLeftDisabled = computed(() => props.currentPage === 1);

const isRightDisabled = computed(() => props.currentPage === props.totalPages);

const handleJump = () => {
  const page = Number(jumpPage.value);

  if (!page || page < 1 || page > props.totalPages) {
    shakeInput.value = true;
    setTimeout(() => {
      shakeInput.value = false;
    }, 500);

    toast.error(`Please enter a number between 1 and ${props.totalPages}.`);
    return;
  }

  emit("update:currentPage", page);
  jumpPage.value = "";
};

const localRowsPerPage = ref(props.rowsPerPage);

const hasResults = computed(() => props.totalItems > 0);

watch(
  () => props.rowsPerPage,
  (val) => {
    localRowsPerPage.value = val;
  }
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
