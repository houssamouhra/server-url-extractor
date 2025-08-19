<!-- prettier-ignore -->
<template>
  <div v-if="hasResults" class="relative overflow-visible">
    <div class="flex flex-col items-center sm:flex-row sm:justify-between mt-6 px-4">
      <!-- extracted dropdown + text -->
      <PaginationHelpText
        :startIndex="startIndex"
        :endIndex="endIndex"
        :totalItems="props.totalItems"
        v-model:rowsPerPage="model"
      />    
    <!-- extracted Prev/Next buttons -->
      <PaginationControls
        :disabledPrev="isLeftDisabled"
        :disabledNext="isRightDisabled"
        @prev="handleLeftClick"
        @next="handleRightClick"
      />
    <!-- extracted jump input field -->
      <JumpToPageInput
        :currentPage="props.currentPage"
        :totalPages="props.totalPages"
        @jump="(page) => emit('update:currentPage', page)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import PaginationHelpText from "./PaginationHelpText.vue";
import PaginationControls from "./PaginationControls.vue";
import JumpToPageInput from "./JumpToPageInput.vue";

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

const localRowsPerPage = ref(props.rowsPerPage);

const hasResults = computed(() => props.totalItems > 0);

watch(
  () => props.rowsPerPage,
  (val) => {
    localRowsPerPage.value = val;
  }
);
</script>
