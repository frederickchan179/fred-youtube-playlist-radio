import { useEffect, useRef, type RefObject } from 'react'

type AnalyserGraph = {
  audioContext: AudioContext
  analyser: AnalyserNode
  frequencies: Uint8Array<ArrayBuffer>
}

const graphs = new WeakMap<HTMLAudioElement, AnalyserGraph>()

const createFrequencyBuffer = (length: number): Uint8Array<ArrayBuffer> =>
  new Uint8Array(new ArrayBuffer(length))

const getGraph = (audio: HTMLAudioElement): AnalyserGraph | null => {
  const existing = graphs.get(audio)
  if (existing) return existing

  try {
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.78

    const source = audioContext.createMediaElementSource(audio)
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    const graph: AnalyserGraph = {
      audioContext,
      analyser,
      frequencies: createFrequencyBuffer(analyser.frequencyBinCount),
    }
    graphs.set(audio, graph)
    return graph
  } catch {
    return null
  }
}

const bandLevel = (data: Uint8Array, fromBin: number, toBin: number): number => {
  let sum = 0
  let sampleCount = 0
  const end = Math.min(toBin, data.length)
  for (let index = fromBin; index < end; index += 1) {
    sum += data[index] ?? 0
    sampleCount += 1
  }
  if (sampleCount === 0) return 0
  return Math.min(1, sum / sampleCount / 220)
}

const CENTER_X = 50
const CENTER_Y = 58
const ARC_RADIUS = 36
const NEEDLE_LENGTH = 34
const SWEEP_DEG = 48
const RED_ZONE_FROM_DEG = 18

const polar = (deg: number, radius = ARC_RADIUS) => {
  const radians = (deg * Math.PI) / 180
  return {
    x: CENTER_X + radius * Math.sin(radians),
    y: CENTER_Y - radius * Math.cos(radians),
  }
}

const arcPath = (fromDeg: number, toDeg: number) => {
  const from = polar(fromDeg)
  const to = polar(toDeg)
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`
}

const SCALE_ARC = arcPath(-SWEEP_DEG, SWEEP_DEG)
const RED_ARC = arcPath(RED_ZONE_FROM_DEG, SWEEP_DEG)

type Props = {
  audioRef: RefObject<HTMLAudioElement | null>
  playing: boolean
}

export const VuMeters = ({ audioRef, playing }: Props) => {
  const leftRef = useRef<SVGLineElement | null>(null)
  const rightRef = useRef<SVGLineElement | null>(null)
  const leftLevel = useRef(0)
  const rightLevel = useRef(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    let cancelled = false
    let raf = 0
    const graph = getGraph(audio)
    if (!graph) return

    const tick = async () => {
      if (cancelled) return
      if (graph.audioContext.state === 'suspended' && playing) {
        await graph.audioContext.resume()
      }
      if (cancelled) return

      graph.analyser.getByteFrequencyData(graph.frequencies)
      const targetLeft = playing ? bandLevel(graph.frequencies, 1, 10) : 0
      const targetRight = playing ? bandLevel(graph.frequencies, 18, 48) : 0
      leftLevel.current += (targetLeft - leftLevel.current) * 0.18
      rightLevel.current += (targetRight - rightLevel.current) * 0.18

      const needleAngle = (level: number) => -SWEEP_DEG + level * SWEEP_DEG * 2
      const left = leftRef.current
      const right = rightRef.current
      if (left) {
        left.setAttribute(
          'transform',
          `rotate(${needleAngle(leftLevel.current)} ${CENTER_X} ${CENTER_Y})`,
        )
      }
      if (right) {
        right.setAttribute(
          'transform',
          `rotate(${needleAngle(rightLevel.current)} ${CENTER_X} ${CENTER_Y})`,
        )
      }

      raf = requestAnimationFrame(() => {
        void tick()
      })
    }

    void tick()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [audioRef, playing])

  return (
    <div className="vu-pair">
      <MeterFace label="L" needleRef={leftRef} />
      <MeterFace label="R" needleRef={rightRef} />
    </div>
  )
}

const MeterFace = ({
  label,
  needleRef,
}: {
  label: string
  needleRef: RefObject<SVGLineElement | null>
}) => (
  <div
    className="relative overflow-hidden px-2 pb-1 pt-2"
    style={{
      background: 'linear-gradient(180deg, #141210, #0a0908)',
      border: '1px solid color-mix(in oklab, var(--chrome) 22%, transparent)',
      boxShadow: 'inset 0 8px 16px rgba(0,0,0,0.45)',
    }}
  >
    <p
      className="absolute left-2 top-1.5 text-[0.55rem] text-[var(--muted)]"
      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
    >
      {label}
    </p>
    <svg
      viewBox="0 0 100 68"
      preserveAspectRatio="xMidYMid meet"
      className="w-full"
      style={{ aspectRatio: '100 / 68' }}
      aria-hidden
    >
      <path d={SCALE_ARC} fill="none" stroke="#6a6662" strokeWidth="1.1" />
      <path d={RED_ARC} fill="none" stroke="var(--accent)" strokeWidth="1.4" />
      <line
        ref={needleRef}
        x1={CENTER_X}
        y1={CENTER_Y}
        x2={CENTER_X}
        y2={CENTER_Y - NEEDLE_LENGTH}
        stroke="#e8c48a"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform={`rotate(${-SWEEP_DEG} ${CENTER_X} ${CENTER_Y})`}
      />
      <circle cx={CENTER_X} cy={CENTER_Y} r="2.4" fill="#cfd3d5" />
    </svg>
  </div>
)
