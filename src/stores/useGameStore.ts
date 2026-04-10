import { defineStore } from "pinia";
import { ref } from "vue";
import { useStorage } from "@vueuse/core";
import { DEFAULT_REWARDS } from "@/constants/defaultRewards";
import type { GameConfig, GameState, RewardItem } from "@/types";

/**
 * 按权重随机选取一项奖励
 * @param pool - 奖池
 * @returns 中奖项；奖池为空时返回 null
 */
function pickWeightedReward(pool: RewardItem[]): RewardItem | null {
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0 || pool.length === 0) {
    return null;
  }
  let roll = Math.random() * totalWeight;
  for (const item of pool) {
    roll -= item.weight;
    if (roll <= 0) {
      return item;
    }
  }
  return pool[pool.length - 1] ?? null;
}

export const useGameStore = defineStore("game", () => {
  const config = useStorage<GameConfig>("chen-du-config", {
    mode: "scratch",
    targetDb: 30,
    targetDurationSeconds: 60,
    rewards: DEFAULT_REWARDS,
  });

  const runtimeState = ref<GameState>({
    currentDb: 0,
    progress: 0,
    status: "idle",
    winningReward: null,
  });

  /**
   * 在进度到达 100% 前调用，预先确定本轮中奖结果
   */
  const calculateWinner = (): void => {
    const pool = config.value.rewards;
    const picked = pickWeightedReward(pool);
    runtimeState.value.winningReward = picked;
  };

  /**
   * 回到初始待机（保留配置与奖池）
   */
  const resetGame = (): void => {
    runtimeState.value.progress = 0;
    runtimeState.value.status = "idle";
    runtimeState.value.winningReward = null;
    runtimeState.value.currentDb = 0;
  };

  /**
   * 进入奖励高光展示态
   */
  const enterCelebrating = (): void => {
    runtimeState.value.status = "celebrating";
  };

  return {
    config,
    runtimeState,
    calculateWinner,
    resetGame,
    enterCelebrating,
  };
});
