import { unref, ref, computed, watch, Ref, nextTick } from "vue";
import { useDebounceFn } from "@vueuse/core";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

export const isFiltering = ref(false);

export function useColumnFilters<T extends object>(dataInput: T[] | Ref<T[]>) {
  const filters = ref<{
    batchId: string;
    date: string | Date;
    original: string;
    status: string;
    redirection: string;
    redirected_url: string;
    included: string;
  }>({
    batchId: "",
    date: "",
    original: "",
    status: "",
    redirection: "",
    redirected_url: "",
    included: "",
  });

  const currentPage = ref(1);
  const rowsPerPage = ref(30);
  const debouncedFilters = ref({ ...filters.value });

  const resolvedData = computed(() => unref(dataInput));
  const activeFilterKey = ref<string | null>(null);

  const filteredData = computed(() => {
    return resolvedData.value.filter((row) => {
      const f = debouncedFilters.value;

      return Object.entries(f).every(([key, value]) => {
        // skip empty filters
        if (
          value === null ||
          (typeof value === "string" && value.trim() === "")
        )
          return true;

        const cellRaw = row[key];
        if (cellRaw === undefined || cellRaw === null) return false;

        // Handle boolean filters (e.g., "included", "redirection")
        if (key === "included" || key === "redirection") {
          // "All"
          if (value === "") return true;
          // Match "true" or "false"
          return String(cellRaw) === value;
        }

        // Handle status filter
        if (key === "status") {
          return String(cellRaw) === value;
        }

        // Handle date filter
        if (key === "date") {
          const v = value as string | Date;

          const parseCellDate = (raw: string) => {
            const [day, month, yearTime] = raw.split("-");
            if (!day || !month || !yearTime) return "";
            const [year] = yearTime.trim().split(" ");
            return `${year}-${month}-${day}`; // '2025-07-02'
          };

          let selectedDate: string;

          if (v instanceof Date) {
            selectedDate = [
              v.getFullYear(),
              String(v.getMonth() + 1).padStart(2, "0"),
              String(v.getDate()).padStart(2, "0"),
            ].join("-");
          } else if (typeof v === "string") {
            const [day, month, year] = v.split("-");
            if (!day || !month || !year) return false;
            selectedDate = `${year}-${month}-${day}`;
          } else {
            return false;
          }

          const cellDateFormatted = parseCellDate(cellRaw.toString());
          return cellDateFormatted === selectedDate;
        }
        const cell = cellRaw.toString().toLowerCase();
        return cell.includes(value.toString().toLowerCase());
      });
    });
  });

  // Valid time format/input
  const isValidDate = (value: string | Date): boolean => {
    if (value instanceof Date && !isNaN(value.getTime())) return true;

    if (typeof value === "string") {
      return dayjs(value, "DD-MM-YYYY", true).isValid();
    }

    return false;
  };

  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * rowsPerPage.value;
    return filteredData.value.slice(start, start + rowsPerPage.value);
  });

  const totalItems = computed(() => filteredData.value.length);

  const totalPages = computed(() =>
    Math.ceil(filteredData.value.length / rowsPerPage.value)
  );
  watch(filters, () => {
    currentPage.value = 1;
  });

  const updateDebouncedFilters = useDebounceFn(() => {
    debouncedFilters.value = { ...filters.value };
  }, 200);

  watch(
    debouncedFilters,
    async () => {
      isFiltering.value = true;

      await nextTick(); // Let spinner appear
      await new Promise((resolve) => setTimeout(resolve, 300)); // Optional: artificial delay

      isFiltering.value = false;
    },
    { deep: true }
  );

  watch(
    filters,
    () => {
      updateDebouncedFilters();
    },
    { deep: true }
  );

  return {
    debouncedFilters,
    filters,
    isFiltering,
    isValidDate,
    totalItems,
    rowsPerPage,
    currentPage,
    activeFilterKey,
    totalPages,
    filteredData,
    paginatedData,
    setFilter: (key: string, value: string) => {
      filters.value[key] = value;
    },
    clearFilter: (key: string) => {
      delete filters.value[key];
    },
  };
}
