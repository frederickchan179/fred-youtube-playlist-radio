import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { VisualizerMode } from '@radio/shared'

type Props = {
  audioRef: RefObject<HTMLAudioElement | null>
  mode: VisualizerMode
  playing: boolean
  className?: string
}

type Graph = {
  audioCtx: AudioContext
  analyser: AnalyserNode
  data: Uint8Array<ArrayBuffer>
}

const graphs = new WeakMap<HTMLAudioElement, Graph>()

const readCss = (name: string, fallback: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  fallback

const createData = (length: number): Uint8Array<ArrayBuffer> =>
  new Uint8Array(new ArrayBuffer(length))

const configureAnalyser = (analyser: AnalyserNode, mode: VisualizerMode) => {
  switch (mode) {
    case 'rings':
    case 'pulse':
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      break
    case 'waves':
    case 'ribbons':
    case 'softline':
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.9
      break
    case 'spikes':
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.45
      break
    case 'meter':
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.82
      break
    default:
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.72
  }
}

const getGraph = (audio: HTMLAudioElement, mode: VisualizerMode): Graph => {
  const existing = graphs.get(audio)
  if (existing) {
    configureAnalyser(existing.analyser, mode)
    existing.data = createData(existing.analyser.frequencyBinCount)
    return existing
  }

  const audioCtx = new AudioContext()
  const analyser = audioCtx.createAnalyser()
  configureAnalyser(analyser, mode)

  const source = audioCtx.createMediaElementSource(audio)
  source.connect(analyser)
  analyser.connect(audioCtx.destination)

  const graph: Graph = {
    audioCtx,
    analyser,
    data: createData(analyser.frequencyBinCount),
  }
  graphs.set(audio, graph)
  return graph
}

export const Visualizer = ({ audioRef, mode, playing, className }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const audio = audioRef.current
    const canvas = canvasRef.current
    if (!audio || !canvas) return

    let cancelled = false
    const graph = getGraph(audio, mode)

    const draw = async () => {
      if (cancelled) return
      const canvasEl = canvasRef.current
      if (!canvasEl) return

      if (graph.audioCtx.state === 'suspended' && playing) {
        await graph.audioCtx.resume()
      }
      if (cancelled) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = canvasEl.clientWidth
      const height = canvasEl.clientHeight
      const needW = Math.floor(width * dpr)
      const needH = Math.floor(height * dpr)
      if (canvasEl.width !== needW || canvasEl.height !== needH) {
        canvasEl.width = needW
        canvasEl.height = needH
      }

      const c = canvasEl.getContext('2d')
      if (!c) return
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, width, height)

      graph.analyser.getByteFrequencyData(graph.data)
      const colorA = readCss('--viz-a', '#7eb6ff')
      const colorB = readCss('--viz-b', '#c4a1ff')

      switch (mode) {
        case 'waves':
          drawWaves(c, graph.data, width, height, colorA, colorB, playing)
          break
        case 'bars':
          drawBars(c, graph.data, width, height, colorA, colorB, playing)
          break
        case 'rings':
          drawRings(c, graph.data, width, height, colorA, colorB, playing)
          break
        case 'ribbons':
          drawRibbons(c, graph.data, width, height, colorA, colorB, playing)
          break
        case 'pulse':
          drawPulse(c, graph.data, width, height, colorA, colorB, playing)
          break
        case 'spikes':
          drawSpikes(c, graph.data, width, height, colorA, colorB, playing)
          break
        case 'softline':
          drawSoftline(c, graph.data, width, height, colorA, colorB, playing)
          break
        case 'meter':
          drawMeter(c, graph.data, width, height, colorA, colorB, playing)
          break
      }

      rafRef.current = requestAnimationFrame(() => {
        void draw()
      })
    }

    void draw()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [audioRef, mode, playing])

  return <canvas ref={canvasRef} className={className} aria-hidden />
}

const avg = (data: Uint8Array<ArrayBuffer>, from: number, to: number): number => {
  let sum = 0
  const end = Math.min(to, data.length)
  const start = Math.max(0, from)
  if (end <= start) return 0
  for (let i = start; i < end; i += 1) sum += data[i] ?? 0
  return sum / (end - start)
}

const drawWaves = (
  c: CanvasRenderingContext2D,
  data: Uint8Array<ArrayBuffer>,
  w: number,
  h: number,
  a: string,
  b: string,
  playing: boolean,
) => {
  const mid = h * 0.55
  const amp = playing ? h * 0.28 : h * 0.08
  c.lineWidth = 2

  for (let layer = 0; layer < 3; layer += 1) {
    c.beginPath()
    c.strokeStyle = layer === 1 ? b : a
    c.globalAlpha = 0.35 + layer * 0.2
    for (let x = 0; x <= w; x += 4) {
      const idx = Math.floor((x / w) * (data.length * 0.45))
      const v = (data[idx] ?? 0) / 255
      const y =
        mid +
        Math.sin(x * 0.012 + layer * 1.2) * amp * (0.35 + v) * (1 - layer * 0.18)
      if (x === 0) c.moveTo(x, y)
      else c.lineTo(x, y)
    }
    c.stroke()
  }
  c.globalAlpha = 1
}

const drawBars = (
  c: CanvasRenderingContext2D,
  data: Uint8Array<ArrayBuffer>,
  w: number,
  h: number,
  a: string,
  b: string,
  playing: boolean,
) => {
  const bars = 48
  const gap = 3
  const barW = (w - gap * (bars - 1)) / bars
  const energy = playing ? 1 : 0.2

  for (let i = 0; i < bars; i += 1) {
    const from = Math.floor((i / bars) * data.length * 0.55)
    const to = Math.floor(((i + 1) / bars) * data.length * 0.55)
    const v = (avg(data, from, to) / 255) * energy
    const barH = Math.max(4, v * h * 0.7)
    const x = i * (barW + gap)
    const y = h - barH
    const grad = c.createLinearGradient(x, y, x, h)
    grad.addColorStop(0, a)
    grad.addColorStop(1, b)
    c.fillStyle = grad
    c.globalAlpha = 0.55 + v * 0.45
    c.fillRect(x, y, barW, barH)
  }
  c.globalAlpha = 1
}

const drawRings = (
  c: CanvasRenderingContext2D,
  data: Uint8Array<ArrayBuffer>,
  w: number,
  h: number,
  a: string,
  b: string,
  playing: boolean,
) => {
  const cx = w / 2
  const cy = h / 2
  const base = Math.min(w, h) * 0.16
  const bass = avg(data, 0, 8) / 255
  const mid = avg(data, 8, 40) / 255
  const high = avg(data, 40, 80) / 255
  const pulse = playing ? 1 : 0.35

  const rings = [
    { r: base + bass * 40 * pulse, color: a, width: 3 },
    { r: base * 1.55 + mid * 55 * pulse, color: b, width: 2 },
    { r: base * 2.2 + high * 70 * pulse, color: a, width: 1.5 },
  ]

  for (const ring of rings) {
    c.beginPath()
    c.strokeStyle = ring.color
    c.globalAlpha = 0.55
    c.lineWidth = ring.width
    c.arc(cx, cy, ring.r, 0, Math.PI * 2)
    c.stroke()
  }

  const spokes = 32
  c.globalAlpha = 0.35
  for (let i = 0; i < spokes; i += 1) {
    const idx = Math.floor((i / spokes) * data.length * 0.5)
    const v = ((data[idx] ?? 0) / 255) * pulse
    const ang = (i / spokes) * Math.PI * 2
    const r0 = base * 0.7
    const r1 = base * 2.4 + v * 80
    c.strokeStyle = i % 2 === 0 ? a : b
    c.lineWidth = 1
    c.beginPath()
    c.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0)
    c.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1)
    c.stroke()
  }
  c.globalAlpha = 1
}

/** Jazz — flowing ribbon curves */
const drawRibbons = (
  c: CanvasRenderingContext2D,
  data: Uint8Array<ArrayBuffer>,
  w: number,
  h: number,
  a: string,
  b: string,
  playing: boolean,
) => {
  const energy = playing ? 1 : 0.25
  const ribbons = 5
  for (let r = 0; r < ribbons; r += 1) {
    c.beginPath()
    c.strokeStyle = r % 2 === 0 ? a : b
    c.globalAlpha = 0.25 + r * 0.1
    c.lineWidth = 2.5 - r * 0.25
    const yBase = h * (0.25 + r * 0.12)
    for (let x = 0; x <= w; x += 6) {
      const idx = Math.floor((x / w) * data.length * 0.5)
      const v = ((data[idx] ?? 0) / 255) * energy
      const y =
        yBase +
        Math.sin(x * 0.008 + r * 1.4) * h * 0.08 * (0.4 + v) +
        Math.cos(x * 0.02 + r) * h * 0.04 * v
      if (x === 0) c.moveTo(x, y)
      else c.lineTo(x, y)
    }
    c.stroke()
  }
  c.globalAlpha = 1
}

/** Indie — soft breathing orbs */
const drawPulse = (
  c: CanvasRenderingContext2D,
  data: Uint8Array<ArrayBuffer>,
  w: number,
  h: number,
  a: string,
  b: string,
  playing: boolean,
) => {
  const bass = avg(data, 0, 10) / 255
  const mid = avg(data, 10, 40) / 255
  const high = avg(data, 40, 90) / 255
  const energy = playing ? 1 : 0.35
  const orbs = [
    { x: w * 0.28, y: h * 0.45, r: 40 + bass * 70 * energy, color: a },
    { x: w * 0.55, y: h * 0.4, r: 28 + mid * 55 * energy, color: b },
    { x: w * 0.72, y: h * 0.58, r: 22 + high * 48 * energy, color: a },
  ]

  for (const orb of orbs) {
    const grad = c.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r)
    grad.addColorStop(0, orb.color)
    grad.addColorStop(1, 'transparent')
    c.globalAlpha = 0.45
    c.fillStyle = grad
    c.beginPath()
    c.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2)
    c.fill()
  }
  c.globalAlpha = 1
}

/** Industrial — mirrored hard spikes */
const drawSpikes = (
  c: CanvasRenderingContext2D,
  data: Uint8Array<ArrayBuffer>,
  w: number,
  h: number,
  a: string,
  b: string,
  playing: boolean,
) => {
  const count = 64
  const mid = h / 2
  const energy = playing ? 1 : 0.2
  const step = w / count

  c.lineWidth = 1.5
  for (let i = 0; i < count; i += 1) {
    const from = Math.floor((i / count) * data.length * 0.6)
    const to = Math.floor(((i + 1) / count) * data.length * 0.6)
    const v = (avg(data, from, to) / 255) * energy
    const spike = Math.max(2, v * h * 0.42)
    const x = i * step + step / 2
    c.strokeStyle = i % 3 === 0 ? b : a
    c.globalAlpha = 0.55 + v * 0.45
    c.beginPath()
    c.moveTo(x, mid - spike)
    c.lineTo(x, mid + spike)
    c.stroke()
  }
  c.globalAlpha = 0.35
  c.strokeStyle = a
  c.beginPath()
  c.moveTo(0, mid)
  c.lineTo(w, mid)
  c.stroke()
  c.globalAlpha = 1
}

/** Audiobook — single calm voice line, low distraction */
const drawSoftline = (
  c: CanvasRenderingContext2D,
  data: Uint8Array<ArrayBuffer>,
  w: number,
  h: number,
  a: string,
  b: string,
  playing: boolean,
) => {
  const mid = h * 0.55
  const energy = playing ? 0.55 : 0.12
  c.lineWidth = 1.75
  c.strokeStyle = a
  c.globalAlpha = 0.55
  c.beginPath()
  for (let x = 0; x <= w; x += 5) {
    const idx = Math.floor((x / w) * data.length * 0.35)
    const v = ((data[idx] ?? 0) / 255) * energy
    const y = mid + Math.sin(x * 0.01) * h * 0.04 + (v - 0.15) * h * 0.22
    if (x === 0) c.moveTo(x, y)
    else c.lineTo(x, y)
  }
  c.stroke()
  c.globalAlpha = 0.2
  c.strokeStyle = b
  c.beginPath()
  c.moveTo(0, mid)
  c.lineTo(w, mid)
  c.stroke()
  c.globalAlpha = 1
}

/** Knowledge — quiet horizontal level meters */
const drawMeter = (
  c: CanvasRenderingContext2D,
  data: Uint8Array<ArrayBuffer>,
  w: number,
  h: number,
  a: string,
  b: string,
  playing: boolean,
) => {
  const bands = 12
  const energy = playing ? 1 : 0.2
  const gap = 8
  const rowH = Math.min(10, (h - gap * (bands - 1)) / bands)

  for (let i = 0; i < bands; i += 1) {
    const from = Math.floor((i / bands) * data.length * 0.5)
    const to = Math.floor(((i + 1) / bands) * data.length * 0.5)
    const v = (avg(data, from, to) / 255) * energy
    const y = i * (rowH + gap) + (h - bands * (rowH + gap)) / 2
    const width = Math.max(8, v * w * 0.85)
    c.fillStyle = i % 2 === 0 ? a : b
    c.globalAlpha = 0.35 + v * 0.5
    c.fillRect(0, y, width, rowH)
  }
  c.globalAlpha = 1
}
