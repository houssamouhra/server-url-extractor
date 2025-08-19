<!-- prettier-ignore -->
<template>
  <transition name="fade" mode="out-in">
    <div class="relative min-h-screen p-6 sm:p-6 md:p-8" :key="isLoading ? 'spinner' : 'content'">
      <!-- Spinner overlay -->
      <div v-if="isLoading" key="spinner" class="fixed inset-0 z-10 flex items-center justify-center bg-white/10 backdrop-blur-xs">
        <img src="/spinner.svg" alt="Loading..." width="80" height="80" />
      </div>

      <!-- header -->
      <div v-else key="content" class="w-full max-w-screen-3xl mx-auto px-2 sm:px-4">
        <TheHeader></TheHeader>

        <!-- Clear Filter -->
        <ClearFilter @clear="resetFilters" />

        <!-- Table -->
        <table class="min-w-full relative min-h-[400px] max-h-[75vh] overflow-auto divide-y rounded-xl shadow-lg">
          <div v-if="isFiltering" class="fixed inset-0 bg-white/40 z-30 flex items-center justify-center">
            <img src="/spinner.svg" alt="Loading" class="w-12 h-12" />
          </div>
          <!-- ensure height for spinner center -->
          <thead class="sticky top-0 z-10 w-full backdrop-blur-xs border-white/10 rounded-2xl">
            <!-- Header Labels Row -->
            <tr class="text-xs font-bold py-2 h-10 align-top bg-amber-200/40  text-gray-800 uppercase rounded-2xl text-center tracking-wide">
              <AnimatedTh
                v-for="(col, index) in columns"
                :key="col.key"
                :label="col.label || col.key"
                :labelKey="col.key"
                :class="col.class"
                :activeFilterKey="activeFilterKey"
                :index="index"
                :isFirst="index === 0"
                :isLast="index === columns.length - 1"
              />
            </tr>

            <!-- Filter Inputs Row -->
            <FilterRow
              v-model:filters="filters"
              :columns="columns"
              :activeFilterKey="activeFilterKey"
            />
          </thead>

          <tbody v-if="paginatedLinks.length" class="text-[12px] divide-1">
            <tr
              v-for="(link, i) in paginatedLinks"
              :key="`${link.batchId}-${link.linkKey}`"
              :class="[
                getStripeClass(i, paginatedLinks),
                'hover:bg-yellow-50 transition-colors duration-150',
              ]"
            >
              <!-- Divider line -->
              <template v-if="i > 0 && link.batchId !== links[i - 1].batchId"></template>

              <td class="px-2 py-2 text-center font-bold">
                {{ link.batchId }}
              </td>
              <td class="px-2 py-2 text-center font-semibold">
                {{ link.date }}
              </td>
              <td class="px-2 py-2 break-all max-w-[250px] text-left">
                <div class="flex items-center gap-2">
                  <!-- Copy Icon -->
                  <Icon
                    width="18"
                    height="18"
                    :icon="
                      copied === link.original
                        ? 'solar:clipboard-check-bold-duotone'
                        : 'solar:copy-bold-duotone'
                    "
                    class="text-gray-400 hover:text-red-900/70 cursor-pointer transition-all duration-200"
                    @click="copyToClipboard(link.original)"
                  />

                  <!-- Truncated Original Link -->
                  <div class="relative group w-full max-w-[200px]">
                    <a
                      :href="link.original"
                      target="_blank"
                      class="block truncate text-blue-600 hover:text-blue-800 underline">
                      {{ link.original }}
                    </a>
                    <div class="absolute z-50 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg top-full mt-1 whitespace-pre-line w-max max-w-[400px]">
                      {{ link.original }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-3 py-2 text-center">
                <span
                  :class="['text-xs font-semibold px-2 py-1 rounded-full border',
                    getStatusClass(link.status),
                  ]">
                  {{ link.status }}
                </span>
              </td>
              <td class="px-3 py-2">
                <div class="flex justify-center">
                  <Icon
                    :icon="
                      link.redirection
                        ? 'solar:check-circle-bold-duotone'
                        : 'solar:close-circle-bold-duotone'"
                    width="24"
                    height="24"
                    :style="{color: link.redirection ? '#4dc178' : '#f87171'}"
                  />
                </div>
              </td>
              <td class="px-3 py-2 break-all max-w-[250px]">
                <template v-if="link.redirected_url">
                  <div class="flex items-center gap-2">
                    <!-- Copy Icon -->
                    <Icon
                      width="18"
                      height="18"
                      :icon="
                        copied === link.redirected_url
                          ? 'solar:clipboard-check-bold-duotone'
                          : 'solar:copy-bold-duotone'"
                      class="text-gray-400 hover:text-red-900/70 cursor-pointer transition-all duration-200"
                      @click="copyToClipboard(link.redirected_url)"/>

                    <!-- Truncated Redirected Link -->
                    <div class="relative group w-full max-w-[200px]">
                      <a
                        :href="link.redirected_url"
                        target="_blank"
                        class="block truncate text-blue-600 hover:text-blue-800 underline">
                        {{ link.redirected_url }}
                      </a>
                      <div class="absolute z-50 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg top-full mt-1 whitespace-pre-line w-max max-w-[400px]">
                        {{ link.redirected_url }}
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span class="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">No Redirect</span>
                </template>
              </td>
              <td class="px-3 py-2">
                <div class="flex justify-center">
                  <Icon
                    :icon="
                      link.included
                        ? 'solar:check-circle-bold-duotone'
                        : 'solar:close-circle-bold-duotone'"
                    width="24"
                    height="24"
                    :style="{color: link.included ? '#4dc178' : '#f87171'}"/>
                </div>
              </td>
            </tr>
          </tbody>
          <NotFoundFilter v-else />
        </table>

        <!-- Pagination -->
        <BasePagination
          v-if="filteredData.length"
          :data="filteredData"
          v-model:currentPage="currentPage"
          v-model:rowsPerPage="rowsPerPage"
          :totalPages="totalPages"
          :pageSize="rowsPerPage"
          :totalItems="filteredData.length"
          @prev="currentPage--"
          @next="currentPage++"
        />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { toast } from "vue-sonner";
import AnimatedTh from "@/components/links-table/Header/AnimatedTh.vue";
import ClearFilter from "@/components/links-table/Header/ClearFilter.vue";
import FilterRow from "@/components/links-table/filters/BaseFilterRow.vue";
import NotFoundFilter from "@/components/links-table/NotFoundFilter.vue";
import { useColumnFilters } from "@/composables/useColumnsFilter";
import BasePagination from "@/components/links-table/pagination/BasePagination.vue";
import TheHeader from "@/components/layout/TheHeader.vue";

type LinkEntry = {
  batchId: string;
  linkKey: string;
  date: string;
  original: string;
  status: number;
  redirection: boolean;
  redirected_url: string | null;
  included: boolean;
  method: string;
  error?: string;
};

const links = ref<LinkEntry[]>([]);
const copied = ref<string | null>(null);

const {
  filters,
  paginatedData: paginatedLinks,
  isFiltering,
  totalPages,
  rowsPerPage,
  activeFilterKey,
  currentPage,
  filteredData,
} = useColumnFilters(links);

filters.value = {
  batchId: "",
  date: "",
  original: "",
  status: "",
  redirection: "true",
  redirected_url: "",
  included: "",
};

// prettier-ignore
const columns = [
  { key: "batchId", label: "Drop ID", class: "w-[140px] text-center" },
  { key: "date", type: "date",label: "Date", class: "w-[130px] text-center" },
  { key: "original", label: "Original URL"},
  { key: "status", label: "Status", class: "w-[110px] text-center" },
  { key: "redirection", label: "Redirected?", class: "w-[80px] text-center" },
  { key: "redirected_url", label: "Final URL", hideOnMobile: true },
  {key: "included", label: "Included?",class: "w-[100px] text-center",hideOnMobile: true,},
];

const isLoading = ref(true);

const resetFilters = () => {
  filters.value = Object.fromEntries(
    columns.map((col) => [col.key, ""])
  ) as typeof filters.value;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = text;

    toast.success("Link copied to clipboard!");

    setTimeout(() => {
      copied.value = null;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
    toast.error("Failed to copy");
  }
};

const getStripeClass = (index: number, linksOnPage: any[]) => {
  let groupIndex = 0;
  for (let i = 0; i < index; i++) {
    const id1 = linksOnPage[i].batchId.split("_")[0];
    const id2 = linksOnPage[i + 1]?.batchId.split("_")[0];
    if (id1 !== id2) groupIndex++;
  }

  return groupIndex % 2 === 0 ? "bg-slate-50" : "bg-white";
};

const getStatusClass = (status: string | number) => {
  const map: Record<string, string> = {
    "200": "bg-emerald-100 border-emerald-400 text-emerald-700",
    "401": "bg-yellow-100 border-yellow-400 text-yellow-700",
    "403": "bg-orange-100 border-orange-400 text-orange-700",
    "404": "bg-rose-100 border-rose-400 text-rose-700",
    "429": "bg-fuchsia-100 border-fuchsia-400 text-fuchsia-700",
    "500": "bg-red-100 border-red-400 text-red-700",
    "0": "bg-zinc-100 border-zinc-400 text-zinc-700",
  };

  return map[String(status)] || "bg-white border-gray-300 text-gray-400";
};

onMounted(async () => {
  const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));

  const fetchData = (async () => {
    try {
      const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
      const res = await fetch(`${BASE_URL}/api/validated-links`);

      const data = await res.json();

      // Sort by batchId descending (latest drops first)
      data.sort((a: any, b: any) => Number(b.batchId) - Number(a.batchId));

      links.value = data.map((item: any) => ({
        ...item,
        redirection: Boolean(item.redirection),
        included: Boolean(item.included),
        status: Number(item.status),
      }));
    } catch (err) {
      console.error("Failed to fetch links:", err);
    }
  })();

  await Promise.all([minDelay, fetchData]);
  isLoading.value = false;
});
</script>

<!-- prettier-ignore -->
<style scoped>
.glow-text {
  text-shadow:
    0 0 8px #dc2626; 
}

.fade-enter-active,
.fade-leave-active {
  transition: all 400ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  filter: blur(12px);
  transform: scale(0.8);
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  filter: blur(0);
  transform: scale(1);
}

.animate-pulse-once {
  animation: pulse 0.4s ease-in-out 1;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

button:disabled .cursor-pointer {
  pointer-events: none;
}

input[type="number"] {
  appearance: textfield; 
  -moz-appearance: textfield; 
  -webkit-appearance: none; 
}

/* Remove inner spin buttons in WebKit */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
