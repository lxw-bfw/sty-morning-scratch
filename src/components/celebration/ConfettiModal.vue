<script setup lang="ts">
import { watch } from 'vue'
import { runFireworksConfetti } from '@/composables/useFireworksConfetti'

const props = defineProps<{
  open: boolean
  rewardName: string
}>()

const emit = defineEmits<{
  again: []
}>()

watch(
  () => props.open,
  (visible) => {
    if (visible) {
      runFireworksConfetti(5000)
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-title"
      >
        <div
          class="pointer-events-auto relative z-10 w-full max-w-lg origin-center scale-100 rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-md transition-transform duration-500 md:p-8"
          style="animation: pop-spring 0.65s cubic-bezier(0.34, 1.45, 0.64, 1)"
        >
          <p class="text-center text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-600 md:text-sm">
            恭喜获得
          </p>
          <h2
            id="reward-title"
            class="mt-3 text-center font-sans text-3xl font-black leading-tight text-transparent md:text-4xl xl:text-5xl"
            style="
              background: linear-gradient(120deg, #db2777, #7c3aed, #2563eb);
              -webkit-background-clip: text;
              background-clip: text;
              text-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
            "
          >
            {{ rewardName }}
          </h2>
          <p class="mt-2 text-center text-sm text-slate-600 md:text-base">
            全班一起完成的晨读挑战，太棒了！
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              class="min-h-11 min-w-[44px] rounded-2xl bg-gradient-to-r from-[var(--color-candy-rose)] to-[var(--color-candy-peach)] px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98] md:text-base"
              @click="emit('again')"
            >
              再读一遍
            </button>
            <button
              type="button"
              class="min-h-11 min-w-[44px] rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-transform active:scale-[0.98] md:text-base"
              @click="emit('again')"
            >
              关闭弹窗
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes pop-spring {
  0% {
    transform: scale(0.88);
    opacity: 0;
  }
  65% {
    transform: scale(1.03);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}
</style>
