import type { RewardItem } from '@/types'

/** PRD 默认奖池（权重为文档建议值） */
export const DEFAULT_REWARDS: RewardItem[] = [
  { id: 'r1', name: '零食一份', weight: 5 },
  { id: 'r2', name: '看电影', weight: 2 },
  { id: 'r3', name: '自选同桌一天', weight: 10 },
  { id: 'r4', name: '值周班委体验券', weight: 5 },
  { id: 'r5', name: '免罚金牌', weight: 3 },
  { id: 'r6', name: '免作业券', weight: 2 },
  { id: 'r7', name: '免值日一次', weight: 5 },
  { id: 'r8', name: '文具一份', weight: 10 },
  { id: 'r9', name: '优先打饭一周', weight: 5 },
  { id: 'r10', name: '公开表扬信', weight: 20 },
  { id: 'r11', name: '与老师合影券', weight: 5 },
  { id: 'r12', name: '周测+5分', weight: 1 },
]
