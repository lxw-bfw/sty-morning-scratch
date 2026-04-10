<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import StratchCard from "@/components/StratchCard.vue";
import type { RewardItem } from "@/types";

const props = defineProps<{
  finished: boolean;
  winningReward: RewardItem | null;
}>();

const emit = defineEmits<{
  revealed: [];
}>();

const cardRef = ref<InstanceType<typeof StratchCard> | null>(null);

watch(
  () => props.finished,
  async (done) => {
    if (!done) {
      return;
    }
    await nextTick();
    cardRef.value?.autoReveal(2000);
  }
);

function onScratchAll(): void {
  emit("revealed");
}
</script>

<template>
  <div
    class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/45 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.1)] backdrop-blur-md md:rounded-3xl md:p-4"
  >
    <p
      class="mb-1 shrink-0 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 md:text-xs"
    >
      刮刮乐模式
    </p>
    <div class="flex min-h-0 min-w-0 flex-1 items-stretch justify-center">
      <StratchCard
        ref="cardRef"
        class="h-full max-h-full min-h-0 w-full max-w-full min-w-0 md:max-w-3xl"
        mask-color="#a5b4fc"
        animated-hint-text
        text="大声朗读，即将刮开奖励 ✨"
        fill-style="#1e293b"
        font="bold clamp(14px,2.5vw,22px) Nunito, system-ui, sans-serif"
        :radius="20"
        :scratch-radius="22"
        :scratch-percent="78"
        @scratch-all="onScratchAll"
      >
        <div
          class="flex min-h-[5rem] w-full max-w-full flex-1 items-center justify-center bg-gradient-to-br from-[var(--color-candy-peach)] to-[var(--color-candy-butter)] px-3 py-3 text-center font-sans text-lg font-extrabold text-slate-900 md:min-h-0 md:py-4 md:text-2xl xl:text-3xl"
        >
          {{ winningReward?.name ?? "???" }}
        </div>
      </StratchCard>
    </div>
  </div>
</template>
