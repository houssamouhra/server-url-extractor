<!-- prettier-ignore -->
<template>
  <tr class="bg-amber-100/60 h-10 align-top">
    <th
      v-for="col in columns"
      :key="col.key"
      :class="[col.hideOnMobile ? 'hidden sm:table-cell' : '']"
    >
      <component
        :is="getFilterComponent(col)"
        v-model="filters[col.key]"
        :col="{ keyName: col.key, label: col.label, type: col.type }"
        :status-options="statusOptions"
      />
    </th>
  </tr>
</template>

<script setup lang="ts">
import { onMounted, defineProps } from "vue";
import TextInputFilter from "./TextInputFilter.vue";
import ToggleFilter from "./ToggleFilter.vue";
import DateFilter from "./DateFilter.vue";
import StatusFilter from "./StatusFilter.vue";

const props = defineProps<{
  columns: {
    key: string;
    label?: string;
    type?: string;
    hideOnMobile?: boolean;
  }[];
  filters: Record<string, string | Date | null>;
}>();

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

const getFilterComponent = (col: (typeof props.columns)[0]) => {
  if (col.key === "included" || col.key === "redirection") return ToggleFilter;
  if (col.key === "status") return StatusFilter;
  if (col.type === "date") return DateFilter;
  return TextInputFilter;
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
