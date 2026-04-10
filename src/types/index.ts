/** 奖励项 */
export interface RewardItem {
  id: string
  name: string
  weight: number
}

/** 游戏配置（持久化） */
export interface GameConfig {
  mode: 'slot' | 'scratch'
  targetDb: number
  targetDurationSeconds: number
  rewards: RewardItem[]
}

/** 运行时状态（不持久化） */
export interface GameState {
  currentDb: number
  progress: number
  status: 'idle' | 'recording' | 'finished' | 'celebrating'
  winningReward: RewardItem | null
}
