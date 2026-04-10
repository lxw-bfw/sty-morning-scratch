<script setup lang="ts">
import type { RewardItem } from '@/types'

const props = defineProps<{
  rewards: RewardItem[]
}>()

const emit = defineEmits<{
  'update:rewards': [value: RewardItem[]]
}>()

function updateAt(index: number, patch: Partial<RewardItem>): void {
  const next = props.rewards.map((r, i) => (i === index ? { ...r, ...patch } : r))
  emit('update:rewards', next)
}

function removeAt(index: number): void {
  const next = props.rewards.filter((_, i) => i !== index)
  emit('update:rewards', next)
}

function addReward(): void {
  const next: RewardItem[] = [
    { id: crypto.randomUUID(), name: '新奖励', weight: 1 },
    ...props.rewards,
  ]
  emit('update:rewards', next)
}

/**
 * 按步进调整某项权重，结果不低于 0
 * @param index - 奖池项下标
 * @param delta - 增减量（通常为 ±1）
 */
function adjustWeight(index: number, delta: number): void {
  const item = props.rewards[index]
  if (!item) {
    return
  }
  updateAt(index, { weight: Math.max(0, item.weight + delta) })
}
</script>

<template>
  <div class="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-inner md:p-5">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm font-semibold text-slate-800 md:text-base">奖池与权重</p>
      <button
        type="button"
        class="min-h-11 shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white md:text-sm"
        @click="addReward"
      >
        ＋ 新增奖励
      </button>
    </div>
    <ul class="mt-4 flex max-h-[50vh] flex-col gap-3 overflow-y-auto pr-1">
      <li
        v-for="(item, index) in rewards"
        :key="item.id"
        class="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3"
      >
        <div class="flex min-w-0 flex-col gap-1.5">
          <label
            class="text-xs font-medium text-slate-500 md:text-sm"
            :for="`reward-name-${item.id}`"
          >
            奖励名称
          </label>
          <input
            :id="`reward-name-${item.id}`"
            :value="item.name"
            type="text"
            class="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm md:text-base"
            @input="updateAt(index, { name: ($event.target as HTMLInputElement).value })"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            class="text-xs font-medium text-slate-500 md:text-sm"
            :for="`reward-w-${item.id}`"
          >
            权重
          </label>
          <div
            class="flex h-11 w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            role="group"
            aria-label="调整权重"
          >
            <button
              type="button"
              class="flex min-h-11 min-w-11 shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 text-lg font-semibold text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200"
              aria-label="权重减一"
              @click="adjustWeight(index, -1)"
            >
              −
            </button>
            <input
              :id="`reward-w-${item.id}`"
              :value="item.weight"
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
              class="min-h-11 min-w-[4rem] flex-1 border-0 bg-white px-1 text-center text-sm tabular-nums text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fuchsia-400/60 md:text-base [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              @input="
                updateAt(index, {
                  weight: Math.max(0, Number(($event.target as HTMLInputElement).value) || 0),
                })
              "
            />
            <button
              type="button"
              class="flex min-h-11 min-w-11 shrink-0 items-center justify-center border-l border-slate-200 bg-slate-50 text-lg font-semibold text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200"
              aria-label="权重加一"
              @click="adjustWeight(index, 1)"
            >
              +
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <span
            :id="`reward-del-lbl-${item.id}`"
            class="text-xs font-medium text-slate-500 md:text-sm"
          >
            删除
          </span>
          <button
            type="button"
            class="flex min-h-11 min-w-11 items-center justify-center self-start rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 active:scale-[0.98]"
            :aria-labelledby="`reward-del-lbl-${item.id}`"
            @click="removeAt(index)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
