<script setup lang="ts">
defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  start: [];
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="welcome-fade">
      <div
        v-if="open"
        class="pointer-events-none fixed inset-0 z-[199] flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
      >
        <div
          class="pointer-events-auto relative z-10 w-full max-w-lg origin-center scale-100 rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-md transition-transform duration-500 md:p-8"
          style="
            animation: welcome-pop-spring 0.65s
              cubic-bezier(0.34, 1.45, 0.64, 1);
          "
        >
          <p
            class="text-center text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-600 md:text-sm"
          >
            老师同学们大家好
          </p>
          <h2
            id="welcome-title"
            class="mt-3 text-center font-sans text-2xl font-black leading-tight text-transparent md:text-3xl xl:text-4xl"
            style="
              background: linear-gradient(120deg, #db2777, #7c3aed, #2563eb);
              -webkit-background-clip: text;
              background-clip: text;
              text-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
            "
          >
            欢迎使用晨读刮刮乐
          </h2>
          <p
            class="mt-3 text-center text-sm leading-relaxed text-slate-600 md:text-base"
          >
            希望同学们跟着XXX老师一起认真地大声晨读吧！
          </p>
          <div class="mt-8 flex justify-center">
            <button
              type="button"
              class="welcome-cta min-h-11 min-w-[44px] rounded-2xl bg-gradient-to-r from-[var(--color-candy-rose)] via-[var(--color-candy-lilac)] to-[var(--color-candy-peach)] px-8 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98] md:px-10 md:text-base"
              @click="emit('start')"
            >
              开启今日晨读
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.welcome-fade-enter-active,
.welcome-fade-leave-active {
  transition: opacity 0.25s ease;
}

.welcome-fade-enter-from,
.welcome-fade-leave-to {
  opacity: 0;
}

@keyframes welcome-pop-spring {
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

.welcome-cta {
  animation: welcome-cta-bounce 1.15s ease-in-out infinite;
}

@keyframes welcome-cta-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
  55% {
    transform: translateY(-4px);
  }
  70% {
    transform: translateY(-6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-cta {
    animation: none;
  }
}
</style>
