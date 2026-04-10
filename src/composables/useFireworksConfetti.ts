import confetti from 'canvas-confetti'

/**
 * 按 canvas-confetti 官方 Fireworks 示例，从屏幕两侧交替喷发纸屑
 * @see https://github.com/catdad/canvas-confetti
 * @param durationMs - 持续毫秒数
 */
export function runFireworksConfetti(durationMs: number): void {
  const end = Date.now() + durationMs
  const frame = (): void => {
    void confetti({
      particleCount: 7,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.35 },
      disableForReducedMotion: true,
    })
    void confetti({
      particleCount: 7,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.35 },
      disableForReducedMotion: true,
    })
    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }
  frame()
}
