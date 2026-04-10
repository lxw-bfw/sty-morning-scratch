<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    scratchPercent?: number
    imageUrl?: string
    maskColor?: string
    fillStyle?: string
    font?: string
    text?: string
    radius?: number
    scratchRadius?: number
    /** 文案模式：渐变字 + 横向扫光（需离屏缓冲刮层，与 imageUrl 互斥） */
    animatedHintText?: boolean
  }>(),
  {
    scratchPercent: 80,
    maskColor: '#cccccc',
    fillStyle: '#000000',
    font: '18px Arial',
    text: '刮一刮',
    radius: 0,
    scratchRadius: 10,
    animatedHintText: false,
  },
)

const emit = defineEmits<{
  scratchStart: []
  scratchEnd: []
  scratchAll: []
}>()

const ctx = ref<CanvasRenderingContext2D | null>(null)
const slotRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const width = ref(0)
const height = ref(0)
const isScratching = ref(false)
const maskHidden = ref(false)
const scratchBufferCanvas = ref<HTMLCanvasElement | null>(null)
const scratchCtxRef = ref<CanvasRenderingContext2D | null>(null)
const prefersReducedMotion = ref(false)
let eventsAbort: AbortController | null = null
let autoRaf = 0
let hintAnimRaf = 0

/**
 * 计算画布上透明像素占比（用于判断是否达到刮开阈值）
 */
function getClearedRatio(context: CanvasRenderingContext2D, w: number, h: number): number {
  const img = context.getImageData(0, 0, w, h)
  let transparent = 0
  const total = img.data.length / 4
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0) {
      transparent++
    }
  }
  return transparent / total
}

/**
 * 是否使用离屏画布累积刮痕（与动效文案合成）
 */
function useScratchBuffer(): boolean {
  return Boolean(props.animatedHintText && !props.imageUrl)
}

function stopHintAnimation(): void {
  cancelAnimationFrame(hintAnimRaf)
  hintAnimRaf = 0
}

/**
 * 将离屏刮层与渐变文案、横向扫光合成到展示画布（source-atop 限制字与光仅在遮罩不透明处）
 * @param now - performance.now()，驱动扫光相位
 */
function paintHintFrame(now: number): void {
  const main = ctx.value
  const buf = scratchBufferCanvas.value
  const sc = scratchCtxRef.value
  if (!main || !buf || !sc || maskHidden.value) {
    return
  }
  const w = width.value
  const h = height.value
  main.globalCompositeOperation = 'source-over'
  main.clearRect(0, 0, w, h)
  main.drawImage(buf, 0, 0)

  const t = props.text
  main.font = props.font
  main.textAlign = 'center'
  main.textBaseline = 'middle'
  const cx = w / 2
  const cy = h / 2 + 6
  const tw = main.measureText(t).width

  const baseGrad = main.createLinearGradient(cx - tw * 0.6, cy, cx + tw * 0.6, cy)
  baseGrad.addColorStop(0, '#db2777')
  baseGrad.addColorStop(0.28, '#c026d3')
  baseGrad.addColorStop(0.52, '#6366f1')
  baseGrad.addColorStop(0.78, '#0ea5e9')
  baseGrad.addColorStop(1, '#14b8a6')
  main.fillStyle = baseGrad
  main.globalCompositeOperation = 'source-atop'
  main.fillText(t, cx, cy)

  if (!prefersReducedMotion.value) {
    const periodMs = 2400
    const u = (now % periodMs) / periodMs
    /** 扫光条宽度；高亮峰约在 band 的中点 */
    const shineBand = 72
    const peakOffset = shineBand * 0.5
    const textLeft = cx - tw * 0.5
    const textRight = cx + tw * 0.5
    /** 峰从文案左缘稍外进入，到文案右缘外少许即结束，避免扫到空白区过久 */
    const sweepLeftStart = textLeft - 28 - peakOffset
    const sweepLeftEnd = textRight + 18 - peakOffset
    const sweepLeft = sweepLeftStart + u * (sweepLeftEnd - sweepLeftStart)
    const shine = main.createLinearGradient(sweepLeft, 0, sweepLeft + shineBand, 0)
    shine.addColorStop(0, 'rgba(255,255,255,0)')
    shine.addColorStop(0.42, 'rgba(255,255,255,0)')
    shine.addColorStop(0.5, 'rgba(255,255,255,0.9)')
    shine.addColorStop(0.58, 'rgba(255,255,255,0)')
    shine.addColorStop(1, 'rgba(255,255,255,0)')
    main.fillStyle = shine
    const padY = 20
    main.fillRect(cx - tw * 0.5 - 48, cy - padY, tw + 96, padY * 2)
  }

  main.globalCompositeOperation = 'source-over'
}

/**
 * 启动扫光 rAF；系统偏好减少动效时只绘制一帧
 */
function startHintAnimationLoop(): void {
  stopHintAnimation()
  if (prefersReducedMotion.value) {
    paintHintFrame(performance.now())
    return
  }
  const loop = (ts: number): void => {
    if (maskHidden.value || !useScratchBuffer()) {
      return
    }
    paintHintFrame(ts)
    hintAnimRaf = requestAnimationFrame(loop)
  }
  hintAnimRaf = requestAnimationFrame(loop)
}

/**
 * 在指定坐标以橡皮擦方式刮开一块圆形区域
 */
function eraseAt(x: number, y: number): void {
  const c = useScratchBuffer() ? scratchCtxRef.value : ctx.value
  if (!c) {
    return
  }
  c.globalCompositeOperation = 'destination-out'
  c.beginPath()
  c.fillStyle = 'white'
  c.arc(x, y, props.scratchRadius, 0, Math.PI * 2)
  c.fill()
  if (useScratchBuffer() && prefersReducedMotion.value) {
    paintHintFrame(performance.now())
  }
}

/**
 * 完全揭开遮罩并触发完成事件（与手动刮满阈值行为一致）
 */
function finishReveal(): void {
  if (maskHidden.value) {
    return
  }
  stopHintAnimation()
  maskHidden.value = true
  emit('scratchEnd')
  emit('scratchAll')
}

/**
 * 构建 Z 字形路径采样点（从左上 → 右上 → 左下 → 右下）
 */
function buildZPath(w: number, h: number, pad: number): Array<{ x: number; y: number }> {
  const p1 = { x: pad, y: pad }
  const p2 = { x: w - pad, y: pad }
  const p3 = { x: pad, y: h - pad }
  const p4 = { x: w - pad, y: h - pad }
  const segments: Array<[typeof p1, typeof p1]> = [
    [p1, p2],
    [p2, p3],
    [p3, p4],
  ]
  const points: Array<{ x: number; y: number }> = []
  const step = Math.max(4, Math.floor(props.scratchRadius * 0.85))
  for (const [a, b] of segments) {
    const dist = Math.hypot(b.x - a.x, b.y - a.y)
    const n = Math.max(1, Math.ceil(dist / step))
    for (let j = 0; j <= n; j++) {
      const t = j / n
      points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  return points
}

function bindEvents(): void {
  const canvas = canvasRef.value
  if (!canvas || maskHidden.value) {
    return
  }
  eventsAbort?.abort()
  eventsAbort = new AbortController()
  const { signal } = eventsAbort

  const onDown = (e: MouseEvent | TouchEvent): void => {
    isScratching.value = true
    emit('scratchStart')
    drawFromEvent(e)
  }

  const onMove = (e: MouseEvent | TouchEvent): void => {
    if (!isScratching.value) {
      return
    }
    drawFromEvent(e)
  }

  const onUp = (): void => {
    if (!isScratching.value) {
      return
    }
    isScratching.value = false
    emit('scratchEnd')
    calcArea()
  }

  canvas.addEventListener('mousedown', onDown, { signal })
  canvas.addEventListener('mousemove', onMove, { signal })
  canvas.addEventListener('mouseup', onUp, { signal })
  canvas.addEventListener('mouseleave', onUp, { signal })

  canvas.addEventListener('touchstart', onDown, { signal, passive: true })
  canvas.addEventListener('touchmove', onMove, { signal, passive: true })
  canvas.addEventListener('touchend', onUp, { signal })
  canvas.addEventListener('touchcancel', onUp, { signal })
}

/**
 * 将鼠标/触摸事件转为画布坐标并刮开
 */
function drawFromEvent(e: MouseEvent | TouchEvent): void {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context || maskHidden.value) {
    return
  }
  const rect = canvas.getBoundingClientRect()
  let clientX: number
  let clientY: number
  if (e instanceof MouseEvent) {
    clientX = e.clientX
    clientY = e.clientY
  } else if (e instanceof TouchEvent && e.targetTouches[0]) {
    clientX = e.targetTouches[0].clientX
    clientY = e.targetTouches[0].clientY
  } else {
    return
  }
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (clientX - rect.left) * scaleX
  const y = (clientY - rect.top) * scaleY
  eraseAt(x, y)
}

function calcArea(): void {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context || maskHidden.value) {
    return
  }
  const layer = useScratchBuffer() ? scratchCtxRef.value : context
  if (!layer) {
    return
  }
  const ratio = getClearedRatio(layer, width.value, height.value)
  if (ratio >= props.scratchPercent / 100) {
    finishReveal()
  }
}

const initCanvasSize = (): void => {
  width.value = slotRef.value?.offsetWidth ?? 0
  height.value = slotRef.value?.offsetHeight ?? 0
}

/**
 * 初始化遮罩画布并绑定交互
 */
const initDraw = (): void => {
  const canvas = canvasRef.value
  if (!canvas) {
    return
  }
  const context = canvas.getContext('2d')
  ctx.value = context
  if (!context) {
    return
  }

  stopHintAnimation()
  scratchBufferCanvas.value = null
  scratchCtxRef.value = null

  const w = width.value
  const h = height.value

  if (useScratchBuffer()) {
    const buf = document.createElement('canvas')
    buf.width = w
    buf.height = h
    const sctx = buf.getContext('2d')
    if (!sctx) {
      return
    }
    scratchBufferCanvas.value = buf
    scratchCtxRef.value = sctx
    sctx.globalCompositeOperation = 'source-over'
    sctx.fillStyle = props.maskColor
    sctx.fillRect(0, 0, w, h)
    context.clearRect(0, 0, w, h)
    startHintAnimationLoop()
    return
  }

  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
  context.fillStyle = props.maskColor
  context.fillRect(0, 0, w, h)

  if (!props.imageUrl) {
    context.fillStyle = props.fillStyle
    context.font = props.font
    const t = props.text
    const textWidth = context.measureText(t).width
    const x = w / 2 - textWidth / 2
    const y = h / 2 + 6
    context.fillText(t, x, y)
  }

  if (props.imageUrl) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = props.imageUrl
    img.onload = () => {
      context.drawImage(img, 0, 0, w, h)
    }
  }
}

const init = (): void => {
  if (maskHidden.value) {
    return
  }
  initCanvasSize()
  nextTick(() => {
    initDraw()
    bindEvents()
  })
}

const onResize = (): void => {
  if (maskHidden.value) {
    return
  }
  ctx.value = null
  eventsAbort?.abort()
  init()
}

/**
 * 重置为未刮开状态（供父组件 ref 调用）
 */
const reset = (): void => {
  cancelAnimationFrame(autoRaf)
  autoRaf = 0
  stopHintAnimation()
  eventsAbort?.abort()
  maskHidden.value = false
  width.value = 0
  height.value = 0
  ctx.value = null
  scratchBufferCanvas.value = null
  scratchCtxRef.value = null
  nextTick(() => {
    init()
  })
}

/**
 * 自动沿 Z 字路径刮开；若未达阈值则一次性擦除剩余遮罩（满足「无需手动」）
 * @param durationMs - 动画时长，默认约 1.8s
 */
const autoReveal = (durationMs = 1800): void => {
  if (maskHidden.value) {
    return
  }
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context || width.value <= 0 || height.value <= 0) {
    return
  }

  cancelAnimationFrame(autoRaf)
  emit('scratchStart')

  const pad = Math.max(props.scratchRadius * 2, 8)
  const path = buildZPath(width.value, height.value, pad)
  const start = performance.now()

  const step = (): void => {
    const now = performance.now()
    const t = Math.min(1, (now - start) / durationMs)
    const idx = Math.min(path.length - 1, Math.floor(t * (path.length - 1)))
    for (let k = 0; k < 3; k++) {
      const p = path[Math.min(path.length - 1, idx + k)]
      if (p) {
        eraseAt(p.x, p.y)
      }
    }

    if (t < 1) {
      autoRaf = requestAnimationFrame(step)
      return
    }

    const layer = useScratchBuffer() ? scratchCtxRef.value : context
    if (!layer) {
      finishReveal()
      return
    }
    const ratio = getClearedRatio(layer, width.value, height.value)
    if (ratio < props.scratchPercent / 100) {
      layer.globalCompositeOperation = 'destination-out'
      layer.fillRect(0, 0, width.value, height.value)
    }
    finishReveal()
  }

  autoRaf = requestAnimationFrame(step)
}

watch(
  () => props.imageUrl,
  () => {
    if (!maskHidden.value) {
      nextTick(() => initDraw())
    }
  },
)

watch(
  () => [props.animatedHintText, props.text, props.maskColor] as const,
  () => {
    if (!maskHidden.value) {
      nextTick(() => initDraw())
    }
  },
)

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  init()
  window.addEventListener('resize', onResize)
  // 弹性布局下首帧槽位高度可能为 0，下一帧再对齐画布尺寸
  void nextTick(() => {
    requestAnimationFrame(() => {
      const el = slotRef.value
      if (maskHidden.value || !el) {
        return
      }
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (w > 0 && h > 0 && (w !== width.value || h !== height.value)) {
        onResize()
      }
    })
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  eventsAbort?.abort()
  cancelAnimationFrame(autoRaf)
  stopHintAnimation()
})

defineExpose({
  reset,
  autoReveal,
})
</script>

<template>
  <div
    class="stratch-box min-h-0 min-w-0"
    :style="{ borderRadius: `${radius}px` }"
  >
    <div ref="slotRef" class="stratch-slot min-h-0 min-w-0">
      <slot />
    </div>
    <canvas
      v-if="!maskHidden && width > 0 && height > 0"
      ref="canvasRef"
      class="stratch-canvas"
      :width="width"
      :height="height"
    />
  </div>
</template>

<style scoped>
.stratch-box {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.stratch-slot {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.stratch-canvas {
  position: absolute;
  top: 0;
  left: 0;
  touch-action: none;
}
</style>
