<!-- prettier-ignore -->
<template>
  <tr class="bg-amber-100/60 h-10 align-top">
    <th
      v-for="col in columns"
      :key="col.key"
      :class="[
        'px-2 py-1 transition-all duration-400 ',
        col.hideOnMobile ? 'hidden sm:table-cell' : '',
        'hover:scale-[1.03] hover:z-10',
      ]">
      <!-- Included toggle -->
      <div
        v-if="col.key === 'included'"
        class="flex justify-center gap-1 items-center">
        <!-- Included: Yes -->
        <button
          @click="filters.included = filters.included === 'true' ? '' : 'true'"
          v-tooltip="'Show Included links'"
          :class="[
            'p-1 rounded-full border transition-all duration-200',
            filters.included === 'true'
              ? 'bg-green-100 border-green-400 text-green-700'
              : 'bg-white border-gray-200 text-gray-400 hover:text-green-600',
          ]">
          <Icon icon="solar:check-circle-bold-duotone" width="18" height="18" />
        </button>

        <!-- Included: No -->
        <button
          @click="filters.included = filters.included === 'false' ? '' : 'false'"
          v-tooltip="'Show Not Included links'"
          :class="[
            'p-1 rounded-full border transition-all duration-200',
            filters.included === 'false'
              ? 'bg-red-100 border-red-400 text-[#f87171]'
              : 'bg-white border-gray-200 text-gray-400 hover:text-[#f87171]',
          ]">
          <Icon icon="solar:close-circle-bold-duotone" width="18" height="18" />
        </button>
      </div>

      <!-- Redirection toggle -->
      <div v-else-if="col.key === 'redirection'" class="flex justify-center gap-1 items-center">
        <!-- Redirected: Yes -->
        <button
          @click="filters.redirection = filters.redirection === 'true' ? '' : 'true'"
          v-tooltip="'Show Redirected links'"
          :class="[
            'p-1 rounded-full border transition-all duration-200',
            filters.redirection === 'true'
              ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
              : 'bg-white border-gray-200 text-gray-400 hover:text-emerald-600',
          ]">
          <Icon icon="solar:check-circle-bold-duotone" width="18" height="18" />
        </button>

        <!-- Redirected: No -->
        <button
          @click="filters.redirection = filters.redirection === 'false' ? '' : 'false'"
          v-tooltip="'Show Not Redirected links'"
          :class="[
            'p-1 rounded-full border transition-all duration-200',
            filters.redirection === 'false'
              ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
              : 'bg-white border-gray-200 text-gray-400 hover:text-yellow-600',
          ]">
          <Icon icon="solar:close-circle-bold-duotone" width="18" height="18" />
        </button>
      </div>

      <!-- Status Filter Buttons -->
      <div
        v-else-if="col.key === 'status'"
        class="scroll-hide flex gap-1 overflow-x-auto max-w-[200px] px-1 select-none"
        style="scrollbar-width: none; -ms-overflow-style: none"
        @wheel="handleWheelScroll">
        <button
          v-for="status in statusOptions"
          :key="status.code"
          @click="filters.status = filters.status === status.code ? '' : status.code"
          :class="[
            // tighten spacing
            'whitespace-nowrap px-2 py-0.5 text-[11px] font-semibold rounded-full border',
            filters.status === status.code ? status.active : status.inactive,
          ]"
          v-tooltip="status.label">
          {{ status.code }}
        </button>
      </div>

      <!-- Date Filter -->
      <DatePicker
        v-else-if="col.type === 'date'"
        v-model="getDateModel(col.key).value"
        @clear-click="() => (filters[col.key] = null)"
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
          'focus:ring-2  focus:ring-red-900/60 hover:bg-white transition-all duration-200',
          filters[col.key] ? 'ring-1 ring-amber-500' : '',
        ]"
      />

      <!-- Default input -->
      <div v-else class="relative">
        <input
          v-model="filters[col.key]"
          :ref="col.key === 'dropId' ? 'dropIdInput' : undefined"
          :id="`filter-${col.key}`"
          :name="col.key"
          autocomplete="off"
          :type="col.key === 'dropId' ? 'text' : col.type || 'text'"
          :placeholder="`Filter ${col.label}`"
          class="w-full pr-6 px-2 py-2 text-xs border-gray-200 border bg-white/80 rounded-xl hover:shadow-sm placeholder:font-normal focus:outline-none"
          @keydown="handleKeyDown($event, col.key)"
          @paste="handlePaste($event, col.key)"
          :class="[
            'focus:ring-2  focus:ring-red-900/60 hover:bg-white transition-all duration-200',
            filters[col.key] !== '' ? 'ring-1 ring-amber-500' : '',
          ]"
        />

        <!-- Clear Icon -->
        <Icon
          v-if="
            filters[col.key] &&
            !['status', 'included', 'redirection'].includes(col.key)
          "
          icon="solar:close-circle-bold-duotone"
          width="18"
          height="18"
          class="absolute right-1.5 top-2 cursor-pointer hover:scale-110 transition"
          style="color: #888"
          @click="filters[col.key] = ''"
          v-tooltip="'Clear the filter'"
        />
      </div>
    </th>
  </tr>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import DatePicker from "primevue/datepicker";

const filters = defineModel<Record<string, string | Date | null>>("filters", {
  default: () => ({
    batchId: "",
    date: "",
    original: "",
    status: "",
    redirection: "",
    redirected_url: "",
    included: "",
  }),
});

const { columns } = defineProps<{
  columns: {
    key: string;
    label?: string;
    type?: string;
    placeholder?: string;
    class?: string;
    hideOnMobile?: boolean;
  }[];
  activeFilterKey: string | null;
}>();

const getDateModel = (key: string) =>
  computed<Date | null>({
    get: () => (filters.value[key] as Date) ?? null,
    set: (val) => (filters.value[key] = val),
  });

const statusOptions = [
  {
    code: "200",
    label: "200 OK",
    active: "bg-emerald-100 border-emerald-400 text-emerald-700",
    inactive: "bg-white border-gray-300 text-gray-500 hover:text-emerald-600",
  },
  {
    code: "401",
    label: "401 Unauthorized",
    active: "bg-yellow-100 border-yellow-400 text-yellow-700",
    inactive: "bg-white border-gray-300 text-gray-500 hover:text-yellow-600",
  },
  {
    code: "403",
    label: "403 Forbidden",
    active: "bg-orange-100 border-orange-400 text-orange-700",
    inactive: "bg-white border-gray-300 text-gray-500 hover:text-orange-600",
  },
  {
    code: "404",
    label: "404 Not Found",
    active: "bg-rose-100 border-rose-400 text-rose-700",
    inactive: "bg-white border-gray-300 text-gray-500 hover:text-rose-600",
  },
  {
    code: "429",
    label: "429 Too Many Requests",
    active: "bg-fuchsia-100 border-fuchsia-400 text-fuchsia-700",
    inactive: "bg-white border-gray-300 text-gray-500 hover:text-fuchsia-600",
  },
  {
    code: "500",
    label: "500 Server Error",
    active: "bg-red-100 border-red-400 text-red-700",
    inactive: "bg-white border-gray-300 text-gray-500 hover:text-red-600",
  },
  {
    code: "0",
    label: "0 Unknown",
    active: "bg-zinc-100 border-zinc-400 text-zinc-700",
    inactive: "bg-white border-gray-300 text-gray-500 hover:text-zinc-600",
  },
];

const handleKeyDown = (e: KeyboardEvent, key: string) => {
  if (key !== "batchId") return;

  const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete"];

  // Allow Ctrl+X, Ctrl+C, Ctrl+V
  const isCtrlCombo = e.ctrlKey || e.metaKey;
  if (isCtrlCombo) return;

  if (/^\d$/.test(e.key) || allowedKeys.includes(e.key)) return;

  e.preventDefault();
};

const handlePaste = (e: ClipboardEvent, key: string) => {
  if (key !== "batchId") return;

  const pasted = e.clipboardData?.getData("text")?.trim() ?? "";

  if (!/^\d+$/.test(pasted)) {
    e.preventDefault();
    return;
  }
};

const handleWheelScroll = (event: WheelEvent) => {
  const container = event.currentTarget as HTMLElement;
  if (event.deltaY === 0) return;

  event.preventDefault();
  container.scrollLeft += event.deltaY;
};

onMounted(() => {
  const el = document.querySelector(".scroll-hide");
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  const htmlEl = el as HTMLElement;

  if (htmlEl) {
    htmlEl.addEventListener("mousedown", (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - htmlEl.offsetLeft;
      scrollLeft = htmlEl.scrollLeft;
      htmlEl.classList.add("cursor-grabbing");
    });

    htmlEl.addEventListener("mouseleave", () => {
      isDown = false;
      htmlEl.classList.remove("cursor-grabbing");
    });

    htmlEl.addEventListener("mouseup", () => {
      isDown = false;
      htmlEl.classList.remove("cursor-grabbing");
    });

    htmlEl.addEventListener("mousemove", (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - htmlEl.offsetLeft;
      const walk = (x - startX) * 1.5;
      htmlEl.scrollLeft = scrollLeft - walk;
    });
  }
});
</script>

<style>
thead th {
  vertical-align: top;
}

thead select,
thead input {
  min-height: 32px;
}
</style>
