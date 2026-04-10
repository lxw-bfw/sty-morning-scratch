<script setup lang="ts">
import { useResizeObserver } from "@vueuse/core";
import { computed, nextTick, onMounted, ref, useId, watch } from "vue";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  start: [];
}>();

const btnRef = ref<HTMLButtonElement | null>(null);
const boxW = ref(0);
const boxH = ref(0);
const traceId = useId().replace(/:/g, "-");

/** 流动描边线宽（与药丸轮廓对齐，非中心旋转光锥） */
const TRACE_STROKE = 5;

/**
 * 根据按钮布局尺寸刷新描边 SVG 的几何参数
 */
function measureButtonBox(): void {
  const el = btnRef.value;
  if (!el) {
    return;
  }
  boxW.value = el.offsetWidth;
  boxH.value = el.offsetHeight;
}

useResizeObserver(btnRef, () => {
  measureButtonBox();
});

onMounted(() => {
  measureButtonBox();
});

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick();
      measureButtonBox();
    }
  }
);

const halfStroke = computed(() => TRACE_STROKE / 2);

const innerW = computed(() => Math.max(0, boxW.value - TRACE_STROKE));
const innerH = computed(() => Math.max(0, boxH.value - TRACE_STROKE));

/** 药丸形圆角半径：取长边为直边、短边为直径的胶囊 */
const pillRx = computed(() => {
  const w = innerW.value;
  const h = innerH.value;
  if (w <= 0 || h <= 0) {
    return 0;
  }
  return Math.min(h / 2, w / 2);
});

const showTrace = computed(() => boxW.value > 0 && boxH.value > 0);

const strokeGradientId = computed(() => `welcome-v2-stroke-grad-${traceId}`);
const strokeFilterId = computed(() => `welcome-v2-stroke-glow-${traceId}`);
const strokePaint = computed(() => `url(#${strokeGradientId.value})`);
const filterPaint = computed(() => `url(#${strokeFilterId.value})`);
</script>

<template>
  <Teleport to="body">
    <Transition name="welcome-v2-fade">
      <div
        v-if="open"
        class="welcome-v2-root fixed inset-0 z-199 flex items-center justify-center bg-amber-950/45 px-4 py-6 backdrop-blur-xl sm:px-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-v2-title"
      >
        <div
          class="welcome-v2-panel flex w-full max-w-[min(96rem,calc(100vw-2rem))] flex-col items-center gap-10 sm:gap-12 md:gap-16"
        >
          <h2
            id="welcome-v2-title"
            class="welcome-v2-title text-center text-[clamp(1.85rem,calc(5.5vw+1rem),5.75rem)] font-extrabold leading-[1.12] tracking-tight"
          >
            👏 有请代表抽取今日奖励 👏
          </h2>

          <div class="welcome-v2-btn-wrap group relative inline-flex shrink-0">
            <span
              class="welcome-v2-border-glow pointer-events-none absolute -inset-[6px] rounded-full opacity-90 blur-md sm:-inset-[8px]"
              aria-hidden="true"
            />
            <svg
              v-if="showTrace"
              class="welcome-v2-trace-svg pointer-events-none absolute left-0 top-0 z-1 overflow-visible"
              :width="boxW"
              :height="boxH"
              :viewBox="`0 0 ${boxW} ${boxH}`"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  :id="strokeGradientId"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stop-color="#fffbeb" stop-opacity="0.35" />
                  <stop offset="35%" stop-color="#fde047" />
                  <stop offset="65%" stop-color="#fbbf24" />
                  <stop offset="100%" stop-color="#f59e0b" />
                </linearGradient>
                <filter
                  :id="strokeFilterId"
                  x="-80%"
                  y="-80%"
                  width="260%"
                  height="260%"
                >
                  <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation="1.8"
                    result="b"
                  />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect
                class="welcome-v2-border-trace"
                pathLength="100"
                :x="halfStroke"
                :y="halfStroke"
                :width="innerW"
                :height="innerH"
                :rx="pillRx"
                :ry="pillRx"
                fill="none"
                :stroke="strokePaint"
                :stroke-width="TRACE_STROKE"
                stroke-linecap="round"
                :filter="filterPaint"
              />
            </svg>
            <button
              ref="btnRef"
              type="button"
              class="welcome-v2-cta cursor-pointer relative z-10 min-h-[100px] min-w-[min(100%,20rem)] rounded-full px-10 py-6 text-[clamp(1.35rem,4.2vw,3rem)] font-bold leading-none text-white shadow-[0_12px_40px_rgba(234,88,12,0.55)] transition-transform duration-200 touch-manipulation hover:scale-105 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 sm:min-h-[112px] sm:px-16 sm:py-7 md:min-h-[120px] md:px-20"
              @click="emit('start')"
            >
              点击抽取今日奖励 👈
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.welcome-v2-fade-enter-active,
.welcome-v2-fade-leave-active {
  transition: opacity 0.28s ease;
}

.welcome-v2-fade-enter-from,
.welcome-v2-fade-leave-to {
  opacity: 0;
}

/* 内容区弹性入场（大屏触控场景） */
.welcome-v2-panel {
  animation: welcome-v2-pop-spring 0.7s cubic-bezier(0.34, 1.45, 0.64, 1) both;
}

.welcome-v2-title {
  background: linear-gradient(180deg, #fff9c4 0%, #fde047 35%, #ea580c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 0 #7c2d12) drop-shadow(0 3px 0 #9a3412)
    drop-shadow(0 6px 18px rgba(124, 45, 18, 0.75))
    drop-shadow(0 0 28px rgba(251, 191, 36, 0.45));
}

.welcome-v2-cta {
  background: linear-gradient(180deg, #ffe100 0%, #ff7a1a 55%, #ff5500 100%);
  text-shadow: 0 2px 0 #0f172a, 0 3px 0 #020617, 0 0 12px rgba(15, 23, 42, 0.65);
  border: 3px solid rgba(255, 255, 255, 0.35);
}

.welcome-v2-border-glow {
  box-shadow: 0 0 22px #fbbf24, 0 0 48px rgba(251, 191, 36, 0.55);
  background: radial-gradient(
    circle at 50% 50%,
    rgba(253, 224, 71, 0.35),
    transparent 65%
  );
}

/**
 * 沿圆角矩形（药丸）周长行进的高光：pathLength 归一化后，dash 仅覆盖轮廓的一小段
 */
.welcome-v2-border-trace {
  stroke-dasharray: 14 86;
  stroke-dashoffset: 0;
  animation: welcome-v2-trace-loop 2.6s linear infinite;
}

.welcome-v2-btn-wrap:hover .welcome-v2-border-trace {
  animation-duration: 1s;
}

@keyframes welcome-v2-pop-spring {
  0% {
    transform: scale(0.88);
    opacity: 0;
  }
  68% {
    transform: scale(1.03);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes welcome-v2-trace-loop {
  to {
    stroke-dashoffset: -100;
  }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-v2-panel {
    animation: none;
  }

  .welcome-v2-border-trace {
    animation: none;
  }

  .welcome-v2-btn-wrap:hover .welcome-v2-border-trace {
    animation: none;
  }
}
</style>
