<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: number;
  liveDb: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

const threshold = computed({
  get: () => props.modelValue,
  set: (v: number) => emit("update:modelValue", v),
});

const barHeight = computed(() => {
  const pct = Math.min(100, Math.max(0, (props.liveDb / 120) * 100));
  return `${pct}%`;
});
</script>

<template>
  <div
    class="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-inner md:p-5"
  >
    <div class="flex items-end justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-slate-800 md:text-base">
          朗读达标音量阈值
        </p>
        <p class="text-xs text-slate-500 md:text-sm">
          0–120（相对刻度，便于课堂对比）
        </p>
      </div>
      <div
        class="flex h-16 w-8 items-end justify-center rounded-full bg-slate-200/80 p-1 shadow-inner md:h-20 md:w-9"
        aria-hidden="true"
      >
        <div
          class="w-full rounded-full bg-gradient-to-t from-sky-400 to-emerald-400 transition-[height] duration-150"
          :style="{ height: barHeight }"
        />
      </div>
    </div>
    <div class="mt-4 flex items-center gap-3">
      <input
        v-model.number="threshold"
        type="range"
        min="0"
        max="120"
        class="h-11 w-full cursor-pointer accent-fuchsia-500"
        aria-label="朗读达标音量阈值"
      />
      <span
        class="w-12 text-right text-sm font-bold text-slate-800 md:text-base"
        >{{ threshold }}</span
      >
    </div>
    <p class="mt-2 text-xs text-slate-600 md:text-sm">
      检测到当前环境音量约为：{{ liveDb }}
    </p>
  </div>
</template>
