import { onUnmounted, ref } from 'vue'

/**
 * 将 AnalyserNode 时域数据映射为 0–120 的展示用「分贝」刻度（相对值，便于与阈值对比）
 * @param analyser - Web Audio 分析节点
 * @returns 0–120 的整数
 */
function measureDisplayDb(analyser: AnalyserNode): number {
  const bufferLength = analyser.fftSize
  const data = new Uint8Array(bufferLength)
  analyser.getByteTimeDomainData(data)
  let sumSquares = 0
  for (let i = 0; i < bufferLength; i++) {
    const normalized = (data[i] - 128) / 128
    sumSquares += normalized * normalized
  }
  const rms = Math.sqrt(sumSquares / bufferLength)
  const scaled = Math.round(Math.min(120, rms * 420))
  return scaled
}

/**
 * 麦克风采集与音量分析；须在用户手势后调用 start
 */
export function useAudioAnalyzer() {
  const currentDb = ref(0)
  let audioContext: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let analyser: AnalyserNode | null = null
  let rafId = 0

  const tick = (): void => {
    if (analyser) {
      currentDb.value = measureDisplayDb(analyser)
    }
    rafId = requestAnimationFrame(tick)
  }

  /**
   * 请求麦克风并开始分析循环
   */
  const start = async (): Promise<void> => {
    await stop()
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(mediaStream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    source.connect(analyser)
    rafId = requestAnimationFrame(tick)
  }

  /**
   * 释放音频资源，避免内存泄漏与麦克风占用
   */
  const stop = async (): Promise<void> => {
    cancelAnimationFrame(rafId)
    rafId = 0
    mediaStream?.getTracks().forEach((t) => t.stop())
    mediaStream = null
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close()
    }
    audioContext = null
    analyser = null
    currentDb.value = 0
  }

  onUnmounted(() => {
    void stop()
  })

  return { currentDb, start, stop }
}
