<template>
  <!-- Help text -->
  <div class="text-sm text-gray-700 flex flex-wrap items-center gap-1.5">
    Showing
    <span class="text-sm text-gray-600">{{ props.startIndex }}</span>
    to
    <span class="text-sm text-gray-600">{{ props.endIndex }}</span>
    of
    <span class="text-sm text-gray-600">{{ props.totalItems }}</span>
    entries —

    <span class="text-gray-700">show</span>

    <div class="relative w-[100px] z-10 overflow-visible">
      <Listbox v-model="rowsPerPage">
        <div>
          <ListboxButton
            class="min-w-[100px] cursor-pointer rounded-lg bg-white py-1.5 pl-3 pr-10 text-left text-sm shadow-sm focus:outline-none hover:border-slate-400"
          >
            <span class="block truncate">{{ rowsPerPage }}</span>
            <span
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
            >
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
            <ListboxOptions
              class="absolute bottom-full mb-1 w-[100px] max-h-60 overflow-auto rounded-md bg-white py-1 text-sm ring-1 ring-black/5 focus:outline-none"
            >
              <ListboxOption
                v-for="option in rowsOptions"
                :key="option"
                :value="option"
                v-slot="{ active, selected }"
              >
                <li
                  :class="[
                    active ? 'bg-rose-100 text-rose-900' : 'text-gray-900',
                    'relative cursor-pointer select-none py-2 pl-10 pr-4',
                  ]"
                >
                  <span
                    :class="[
                      selected ? 'font-semibold' : 'font-normal',
                      'block truncate',
                    ]"
                  >
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
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import { Icon } from "@iconify/vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";

// props from parent
const props = defineProps<{
  startIndex: number;
  endIndex: number;
  totalItems: number;
}>();

// v-model for rowsPerPage
const rowsPerPage = defineModel<number>("rowsPerPage");

const rowsOptions = [30, 50, 100];
</script>

<style lang="scss" scoped></style>
