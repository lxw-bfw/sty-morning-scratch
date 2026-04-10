<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <div
    class="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-gradient-to-br from-[var(--color-candy-mint)] via-[var(--color-candy-sky)] to-[var(--color-candy-lilac)] px-4 py-3 md:px-6 md:py-4 xl:px-10 xl:py-5"
  >
    <div
      class="pointer-events-none absolute inset-0 opacity-40"
      style="
        background-image: radial-gradient(
            circle at 20% 20%,
            rgba(255, 255, 255, 0.35),
            transparent 45%
          ),
          radial-gradient(
            circle at 80% 10%,
            rgba(255, 233, 168, 0.5),
            transparent 40%
          ),
          radial-gradient(
            circle at 50% 90%,
            rgba(255, 143, 171, 0.35),
            transparent 45%
          );
      "
    />
    <div
      class="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 md:gap-3 xl:gap-4"
    >
      <header class="shrink-0 text-center">
        <h1
          class="font-sans text-xl font-extrabold tracking-tight text-slate-800 drop-shadow-sm md:text-3xl xl:text-4xl"
        >
          {{ title ?? "晨读刮刮乐" }}
        </h1>
        <p
          class="mt-0.5 text-xs font-semibold text-indigo-950 drop-shadow-sm md:text-sm xl:text-base"
        >
          跟着XXX老师大声朗读，一起攒满进度，解锁班级奖励！
        </p>
      </header>
      <div class="flex min-h-0 flex-1 flex-col">
        <slot />
      </div>
    </div>
  </div>
</template>
