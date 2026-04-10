<script setup lang="ts">
import { ref, watch } from 'vue'
import RewardListEditor from '@/components/control-panel/RewardListEditor.vue'
import VolumeSlider from '@/components/control-panel/VolumeSlider.vue'
import type { GameConfig, RewardItem } from '@/types'

const props = defineProps<{
  open: boolean
  modelValue: GameConfig
  liveDb: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:modelValue': [value: GameConfig]
}>()

/**
 * 合并局部字段并同步到父级（持久化由父级 config 承担）
 */
function patch(partial: Partial<GameConfig>): void {
  emit('update:modelValue', { ...props.modelValue, ...partial })
}

function close(): void {
  emit('update:open', false)
}

function setMode(mode: GameConfig['mode']): void {
  patch({ mode })
}

function updateRewards(rewards: RewardItem[]): void {
  patch({ rewards })
}

/**
 * 朗读时长用本地草稿绑定输入框：收音时 liveDb 高频刷新会导致整树重绘，
 * 若仅用 :value 绑定 store，会在 @change 之前被 Vue 反复回填成旧值，表现为闪烁且无法修改。
 */
const durationDraft = ref(props.modelValue.targetDurationSeconds)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      durationDraft.value = props.modelValue.targetDurationSeconds
    }
  },
  { immediate: true },
)

watch(
  () => props.modelValue.targetDurationSeconds,
  (v) => {
    if (props.open) {
      durationDraft.value = v
    }
  },
)

/**
 * 将草稿按 5 秒对齐后写回配置（与 change / blur / 步进器提交一致）
 */
function commitDurationFromDraft(): void {
  const raw = Number(durationDraft.value)
  const seconds = Number.isFinite(raw) ? raw : 5
  const snapped = Math.max(5, Math.round(seconds / 5) * 5)
  durationDraft.value = snapped
  patch({ targetDurationSeconds: snapped })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[150] flex justify-end bg-slate-900/35 backdrop-blur-[2px]"
        @click.self="close"
      >
        <Transition name="drawer-slide">
          <aside
            v-if="open"
            class="flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto border-l border-white/40 bg-white/90 p-5 shadow-2xl md:p-6"
            role="dialog"
            aria-label="控制中心"
            @click.stop
          >
            <header class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-extrabold text-slate-900 md:text-xl">控制中心</h2>
                <p class="text-xs text-slate-600 md:text-sm">配置将自动保存到本机</p>
              </div>
              <button
                type="button"
                class="min-h-11 min-w-11 rounded-xl border border-slate-200 text-lg font-bold text-slate-700"
                aria-label="关闭控制中心"
                @click="close"
              >
                ×
              </button>
            </header>

            <section class="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-inner">
              <p class="text-sm font-semibold text-slate-800 md:text-base">模式</p>
              <div
                class="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100/80 p-1 text-sm font-semibold md:text-base"
              >
                <button
                  type="button"
                  class="min-h-11 rounded-xl transition-colors"
                  :class="
                    modelValue.mode === 'slot'
                      ? 'bg-white text-fuchsia-700 shadow-sm'
                      : 'text-slate-600'
                  "
                  @click="setMode('slot')"
                >
                  刮图片
                </button>
                <button
                  type="button"
                  class="min-h-11 rounded-xl transition-colors"
                  :class="
                    modelValue.mode === 'scratch'
                      ? 'bg-white text-fuchsia-700 shadow-sm'
                      : 'text-slate-600'
                  "
                  @click="setMode('scratch')"
                >
                  刮刮乐
                </button>
              </div>
            </section>

            <VolumeSlider
              :model-value="modelValue.targetDb"
              :live-db="liveDb"
              @update:model-value="patch({ targetDb: $event })"
            />

            <section class="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-inner md:p-5">
              <p class="text-sm font-semibold text-slate-800 md:text-base">目标朗读时长（秒）</p>
              <p class="mt-1 text-xs text-slate-500 md:text-sm">按 5 秒对齐，最少 5 秒</p>
              <input
                v-model.number="durationDraft"
                type="number"
                min="5"
                step="5"
                class="mt-3 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm md:text-base"
                @change="commitDurationFromDraft"
                @blur="commitDurationFromDraft"
              />
            </section>

            <RewardListEditor :rewards="modelValue.rewards" @update:rewards="updateRewards" />
          </aside>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
