<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import type { RewardItem } from "@/types";

const props = defineProps<{
  active: boolean;
  loudEnough: boolean;
  finished: boolean;
  rewards: RewardItem[];
  winningReward: RewardItem | null;
}>();

const emit = defineEmits<{
  settled: [];
}>();

const displayName = ref("???");

let tick: ReturnType<typeof setInterval> | null = null;

const poolNames = computed(() =>
  props.rewards.map((r) => r.name).filter(Boolean)
);

/** 待机未开读：仅展示「准备开始中」，保持与改版前一致的深灰字色（不用渐变） */
const showNeutralIdleCopy = computed(() => !props.active && !props.finished);

function pickRandomLabel(): void {
  const names = poolNames.value;
  if (names.length === 0) {
    displayName.value = "暂无奖品";
    return;
  }
  displayName.value = names[Math.floor(Math.random() * names.length)] ?? "???";
}

watch(
  () => [props.active, props.loudEnough, props.finished] as const,
  ([active, loud, done]) => {
    if (tick) {
      clearInterval(tick);
      tick = null;
    }
    if (done) {
      if (props.winningReward) {
        displayName.value = props.winningReward.name;
      } else {
        displayName.value = "奖池为空，请去控制中心添加奖励";
      }
      window.setTimeout(
        () => emit("settled"),
        props.winningReward ? 1600 : 900
      );
      return;
    }
    if (active && loud) {
      pickRandomLabel();
      tick = setInterval(() => pickRandomLabel(), 90);
    } else if (active && !loud) {
      displayName.value = "同学们大声朗读，盲盒奖励才能滚动哦！";
    } else if (!active) {
      displayName.value = "准备开始中";
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (tick) {
    clearInterval(tick);
  }
});
</script>

<template>
  <div
    class="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/50 bg-white/55 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.1)] backdrop-blur-md md:rounded-3xl md:p-6"
  >
    <p
      class="mb-1 shrink-0 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 md:text-xs"
    >
      刮图片模式 · 老虎机
    </p>
    <div
      class="slot-reward-text-size line-clamp-3 min-h-0 w-full px-2 text-center font-sans font-black leading-tight"
      :class="[
        showNeutralIdleCopy ? 'text-slate-800' : 'slot-reward-gradient',
        finished
          ? 'animate-[slot-pop_0.7s_cubic-bezier(0.34,1.56,0.64,1)]'
          : 'blur-[1.5px]',
      ]"
    >
      {{ displayName }}
    </div>
  </div>
</template>

<style scoped>
/* 字号按视口分段；PC 段压低 vw/max（内容区常远窄于视口，避免长句换行），真·大屏再抬一档 */
.slot-reward-text-size {
  font-size: clamp(1.375rem, 3.2vw + 0.5rem, 2.75rem);
}

@media (min-width: 768px) {
  .slot-reward-text-size {
    /* 平板 / 小笔电：略压 vw，避免内容区远窄于视口时偏大 */
    font-size: clamp(1.75rem, 2.65vw + 0.5rem, 3.25rem);
  }
}

/* 常见 PC 全屏：卡片宽度常明显小于视口，若仍用大 vw + 高 max 易把长句顶换行 */
@media (min-width: 1280px) and (max-width: 1919px) {
  .slot-reward-text-size {
    font-size: clamp(1.9375rem, 1.9vw + 0.9rem, 3.125rem);
  }
}

@media (min-width: 1920px) {
  .slot-reward-text-size {
    font-size: clamp(2.5rem, 2.2vw + 0.8rem, 4.25rem);
  }
}

/* 金 / 橙 + 红色 danger 段，提高远距辨识度（滚动模糊与落定 pop 仍作用于整块） */
.slot-reward-gradient {
  background-image: linear-gradient(
    155deg,
    #fffbeb 0%,
    #fde047 16%,
    #facc15 32%,
    #fb923c 50%,
    #f97316 64%,
    #ef4444 82%,
    #dc2626 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

@keyframes slot-pop {
  0% {
    transform: scale(0.92);
  }
  60% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}
</style>
