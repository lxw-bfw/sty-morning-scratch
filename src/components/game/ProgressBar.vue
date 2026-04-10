<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  progress: number;
  isLoudEnough: boolean;
}>();

const widthPercent = computed(
  () => `${Math.min(100, Math.max(0, props.progress))}%`
);

/** 轨道内展示的整数进度 0–100 */
const progressInt = computed(() =>
  Math.round(Math.min(100, Math.max(0, props.progress)))
);

/** 进度条内完整说明文案（100% 时切换鼓励语） */
const trackLabelText = computed((): string => {
  const pct = progressInt.value;
  const tail =
    pct >= 100 ? "真棒啊👍，请领取你们的奖励！" : "同学们加油朗读啊💪";
  return `当前奖励进度为${pct}%，${tail}`;
});
</script>

<template>
  <div class="w-full">
    <div
      class="progress-flow-border relative isolate w-full rounded-full p-[2px] shadow-[0_2px_14px_rgba(15,23,42,0.06)] md:p-[2.5px] md:shadow-[0_2px_18px_rgba(15,23,42,0.07)]"
    >
      <!-- 不透明轨道：避免父级流动渐变透过半透明白底渗入内部 -->
      <div
        class="progress-track relative z-[1] h-5 w-full overflow-hidden rounded-full bg-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.08)] ring-1 ring-black/5 md:h-6 xl:h-7"
        role="progressbar"
        :aria-valuenow="progressInt"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`当前奖励进度 ${progressInt}%`"
      >
        <div
          class="absolute inset-y-0 left-0 z-0 rounded-full bg-gradient-to-r from-[var(--color-candy-rose)] via-[var(--color-candy-butter)] to-[var(--color-candy-mint)] transition-[transform,filter,width] duration-300 ease-out will-change-transform"
          :class="
            isLoudEnough
              ? 'brightness-100 saturate-100'
              : 'grayscale brightness-95 animate-pulse'
          "
          :style="{
            width: widthPercent,
            boxShadow: '0 0 18px rgba(255,255,255,0.65)',
          }"
        />
        <div
          v-if="isLoudEnough"
          class="progress-shimmer pointer-events-none absolute inset-0 z-[1] translate-x-[-60%] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70"
        />
        <div
          class="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center px-2"
        >
          <span
            class="progress-track-label max-w-full truncate text-center font-sans font-bold tracking-tight text-fuchsia-900"
            :title="trackLabelText"
          >
            {{ trackLabelText }}
          </span>
        </div>
      </div>
    </div>
    <p class="mt-1 text-center text-[11px] text-slate-700 md:text-sm">
      <span v-if="isLoudEnough" class="font-semibold text-emerald-800"
        >音量达标，进度前进中 ✨</span
      >
      <span v-else class="font-medium text-amber-900/90"
        >朗读声音还不够大哦，再大声一点吧～ Zzz…</span
      >
    </p>
  </div>
</template>

<style scoped>
/* 渐变色沿「边框环」方向流动：宽背景 + 平移 background-position */
.progress-flow-border {
  /* 仅 padding 环可见彩色；内容区由 .progress-track 纯色完全遮盖 */
  background-image: linear-gradient(
    90deg,
    var(--color-candy-rose),
    #e879f9,
    var(--color-candy-lilac),
    var(--color-candy-butter),
    var(--color-candy-sky),
    var(--color-candy-mint),
    #6ee7b7,
    var(--color-candy-rose)
  );
  background-size: 320% 100%;
  background-position: 0% 50%;
  animation: progress-border-flow 3.6s linear infinite;
}

@keyframes progress-border-flow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

@keyframes shimmer {
  100% {
    transform: translateX(220%);
  }
}

.progress-shimmer {
  animation: shimmer 2.2s linear infinite;
}

/* 轨道内文案：糖果紫字 + 浅色描边，在白色轨道与彩色填充上都能辨认 */
.progress-track-label {
  font-size: clamp(0.5625rem, 2.4vw, 0.8125rem);
  line-height: 1;
  text-shadow: 0 0 5px rgb(255 255 255 / 0.98), 0 0 10px rgb(255 255 255 / 0.85),
    0 1px 0 rgb(255 255 255 / 1);
}

@media (prefers-reduced-motion: reduce) {
  .progress-flow-border {
    animation: none;
    background-position: 40% 50%;
  }

  .progress-shimmer {
    animation: none;
  }
}
</style>
