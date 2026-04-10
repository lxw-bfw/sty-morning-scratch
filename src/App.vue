<script setup lang="ts">
import { useElementBounding, useEventListener } from "@vueuse/core";
import { computed, nextTick, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import ConfettiModal from "@/components/celebration/ConfettiModal.vue";
import WelcomeModalV2 from "@/components/celebration/WelcomeModalV2.vue";
import SettingsDrawer from "@/components/control-panel/SettingsDrawer.vue";
import ProgressBar from "@/components/game/ProgressBar.vue";
import RewardScratchMode from "@/components/game/RewardScratchMode.vue";
import RewardSlotMode from "@/components/game/RewardSlotMode.vue";
import MainContainer from "@/components/layout/MainContainer.vue";
import { useAudioAnalyzer } from "@/composables/useAudioAnalyzer";
import { useGameEngine } from "@/composables/useGameEngine";
import type { GameConfig } from "@/types";
import { useGameStore } from "@/stores/useGameStore";

const game = useGameStore();
const { config, runtimeState } = storeToRefs(game);
const { currentDb, start: startMic, stop: stopMic } = useAudioAnalyzer();

const isRecording = computed(() => runtimeState.value.status === "recording");
useGameEngine(currentDb, isRecording);

const panelOpen = ref(false);
const errorMsg = ref("");
const scratchSession = ref(0);
/** 每次进入/刷新页面先展示欢迎弹窗，确认后等同点击「开始晨读」 */
const welcomeOpen = ref(true);

const CONTROL_CENTER_TIP_KEY = "sty-morning-scratch-cc-tip-count";
const CONTROL_CENTER_TIP_MAX = 3;
const showControlCenterTip = ref(false);
const controlCenterBtnRef = ref<HTMLButtonElement | null>(null);
const {
  top: ccBtnTop,
  left: ccBtnLeft,
  width: ccBtnWidth,
  update: updateCcBtnRect,
} = useElementBounding(controlCenterBtnRef);

/**
 * 在前三次进入主界面（欢迎弹窗已关闭）时展示控制中心引导气泡
 */
function maybeShowControlCenterTip(): void {
  if (welcomeOpen.value) {
    return;
  }
  try {
    const raw = localStorage.getItem(CONTROL_CENTER_TIP_KEY);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    const safe = Number.isFinite(n) && n >= 0 ? n : 0;
    if (safe >= CONTROL_CENTER_TIP_MAX) {
      return;
    }
    showControlCenterTip.value = true;
    localStorage.setItem(CONTROL_CENTER_TIP_KEY, String(safe + 1));
    void nextTick(() => updateCcBtnRect());
  } catch (error) {
    console.warn("[maybeShowControlCenterTip] 无法读写 localStorage", {
      error,
    });
    showControlCenterTip.value = true;
    void nextTick(() => updateCcBtnRect());
  }
}

const controlCenterTipStyle = computed((): Record<string, string> => {
  if (!showControlCenterTip.value) {
    return { display: "none" };
  }
  const cx = ccBtnLeft.value + ccBtnWidth.value / 2;
  const y = ccBtnTop.value - 8;
  return {
    position: "fixed",
    left: `${cx}px`,
    top: `${y}px`,
    transform: "translate(-50%, -100%)",
    "z-index": "120",
  };
});

watch(showControlCenterTip, (show) => {
  if (show) {
    void nextTick(() => updateCcBtnRect());
  }
});

useEventListener(
  typeof window !== "undefined" ? window : null,
  "scroll",
  () => {
    if (showControlCenterTip.value) {
      updateCcBtnRect();
    }
  },
  { capture: true }
);

useEventListener(
  typeof window !== "undefined" ? window : null,
  "resize",
  () => {
    if (showControlCenterTip.value) {
      updateCcBtnRect();
    }
  }
);

watch(currentDb, (v) => {
  runtimeState.value.currentDb = v;
});

watch(welcomeOpen, (open) => {
  if (!open) {
    void nextTick(() => maybeShowControlCenterTip());
  }
});

watch(panelOpen, (open) => {
  if (open) {
    showControlCenterTip.value = false;
  }
});

watch(
  () => runtimeState.value.status,
  (s) => {
    if (s !== "recording") {
      void stopMic();
    }
  }
);

const loudEnough = computed(() => currentDb.value >= config.value.targetDb);

/**
 * 进度条彩色填充与音量提示文案：收音停止后 currentDb 会归零，但 finished/celebrating 时进度仍为 100%，需保持鲜艳样式
 */
const progressBarVibrant = computed(
  () => loudEnough.value || runtimeState.value.progress >= 100
);

const celebrationOpen = computed(
  () => runtimeState.value.status === "celebrating"
);

const rewardTitle = computed(
  () => runtimeState.value.winningReward?.name ?? "神秘奖励"
);

/**
 * 将控制中心配置写回持久化存储
 */
function onConfigUpdate(next: GameConfig): void {
  config.value = next;
}

/**
 * 开始本轮晨读收音
 */
async function onStartRound(): Promise<void> {
  errorMsg.value = "";
  try {
    await startMic();
    runtimeState.value.progress = 0;
    runtimeState.value.status = "recording";
    runtimeState.value.winningReward = null;
  } catch (error) {
    console.error("[onStartRound] 麦克风启动失败", { error });
    errorMsg.value = "无法访问麦克风，请检查浏览器权限后重试。";
  }
}

/**
 * 主操作按钮：待机时开始收音；收音中则重置进度并回到待机（状态变更会触发现有 watch 释放麦克风）
 */
function onPrimaryRoundClick(): void {
  if (runtimeState.value.status === "recording") {
    errorMsg.value = "";
    game.resetGame();
    scratchSession.value += 1;
    return;
  }
  void onStartRound();
}

function onScratchRevealed(): void {
  game.enterCelebrating();
}

function onSlotSettled(): void {
  game.enterCelebrating();
}

function onCelebrateAgain(): void {
  game.resetGame();
  scratchSession.value += 1;
}

/**
 * 欢迎弹窗确认：关闭弹窗并启动麦克风与收音（与待机态「开始晨读」一致）
 */
async function onWelcomeStart(): Promise<void> {
  welcomeOpen.value = false;
  await onStartRound();
}
</script>

<template>
  <MainContainer>
    <div class="flex min-h-0 flex-1 flex-col gap-2 md:gap-3">
      <div
        class="-mx-1 flex min-w-0 max-w-full shrink-0 flex-row flex-nowrap items-center justify-between gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:gap-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        <div
          class="flex min-w-0 shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2"
        >
          <button
            type="button"
            class="min-h-11 min-w-[44px] shrink-0 rounded-2xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white shadow-lg transition-transform active:scale-[0.98] sm:px-5 sm:py-3 sm:text-sm md:text-base"
            :disabled="
              runtimeState.status !== 'idle' &&
              runtimeState.status !== 'recording'
            "
            @click="onPrimaryRoundClick"
          >
            {{ runtimeState.status === "recording" ? "重置晨读" : "开始晨读" }}
          </button>
          <button
            ref="controlCenterBtnRef"
            type="button"
            class="min-h-11 min-w-[44px] shrink-0 rounded-2xl border border-white/70 bg-white/70 px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-sm transition-transform active:scale-[0.98] sm:px-5 sm:py-3 sm:text-sm md:text-base"
            :aria-describedby="
              showControlCenterTip ? 'control-center-tip' : undefined
            "
            @click="panelOpen = true"
          >
            控制中心
          </button>
        </div>
        <p
          class="shrink-0 whitespace-nowrap text-right text-xs font-medium text-slate-800 sm:text-sm md:text-base"
        >
          状态：
          <span class="font-extrabold text-fuchsia-800">{{
            runtimeState.status === "idle"
              ? "待机"
              : runtimeState.status === "recording"
              ? "收音中"
              : runtimeState.status === "finished"
              ? "开奖中"
              : "庆祝中"
          }}</span>
        </p>
      </div>

      <p
        v-if="errorMsg"
        class="shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
      >
        {{ errorMsg }}
      </p>

      <ProgressBar
        class="shrink-0"
        :progress="runtimeState.progress"
        :is-loud-enough="progressBarVibrant"
      />

      <section class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <RewardSlotMode
          v-if="config.mode === 'slot'"
          :active="runtimeState.status === 'recording'"
          :loud-enough="loudEnough"
          :finished="
            runtimeState.status === 'finished' ||
            runtimeState.status === 'celebrating'
          "
          :rewards="config.rewards"
          :winning-reward="runtimeState.winningReward"
          @settled="onSlotSettled"
        />
        <RewardScratchMode
          v-else
          :key="scratchSession"
          :finished="runtimeState.status === 'finished'"
          :winning-reward="runtimeState.winningReward"
          @revealed="onScratchRevealed"
        />
      </section>
    </div>

    <Teleport to="body">
      <div
        v-if="showControlCenterTip"
        id="control-center-tip"
        role="tooltip"
        :style="controlCenterTipStyle"
        class="pointer-events-none relative w-[min(18rem,calc(100vw-2.5rem))] max-w-sm rounded-xl bg-black px-3 py-2.5 text-center text-[11px] font-medium leading-snug text-white shadow-lg md:text-xs"
      >
        点击进入控制中心，可切换模式、设置达标音量阈值、朗读时长、奖励和权重
        <span
          class="pointer-events-none absolute left-1/2 top-full -mt-1 size-2.5 -translate-x-1/2 rotate-45 bg-black"
          aria-hidden="true"
        />
      </div>
    </Teleport>

    <WelcomeModalV2 :open="welcomeOpen" @start="onWelcomeStart" />

    <ConfettiModal
      :open="celebrationOpen"
      :reward-name="rewardTitle"
      @again="onCelebrateAgain"
    />

    <SettingsDrawer
      v-model:open="panelOpen"
      :model-value="config"
      :live-db="currentDb"
      @update:model-value="onConfigUpdate"
    />
  </MainContainer>
</template>
