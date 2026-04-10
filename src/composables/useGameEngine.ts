import { onUnmounted, watch, type Ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

/**
 * 根据实时分贝驱动朗读进度；使用 rAF 累加 delta，避免 setInterval 漂移
 * @param currentDb - 当前展示分贝
 * @param isRecording - 是否处于收音累加阶段
 */
export function useGameEngine(currentDb: Ref<number>, isRecording: Ref<boolean>) {
  const store = useGameStore()
  let rafId = 0
  let lastTs = 0

  const tick = (now: number): void => {
    rafId = requestAnimationFrame(tick)

    if (!isRecording.value || store.runtimeState.status !== 'recording') {
      lastTs = 0
      return
    }

    if (store.runtimeState.progress >= 100) {
      return
    }

    if (!lastTs) {
      lastTs = now
      return
    }

    const deltaSec = (now - lastTs) / 1000
    lastTs = now

    const { targetDb, targetDurationSeconds } = store.config
    const duration = Math.max(1, targetDurationSeconds)

    if (currentDb.value >= targetDb) {
      const deltaProgress = (deltaSec / duration) * 100
      const next = Math.min(100, store.runtimeState.progress + deltaProgress)
      store.runtimeState.progress = next

      if (next >= 100) {
        store.calculateWinner()
        store.runtimeState.progress = 100
        store.runtimeState.status = 'finished'
      }
    }
  }

  rafId = requestAnimationFrame(tick)

  watch(isRecording, (on) => {
    if (on) {
      lastTs = 0
    }
  })

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
  })
}
