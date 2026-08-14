import { useEffect, useRef, type RefObject } from 'react'

type Graph = {
  audioCtx: AudioContext
  analyser: AnalyserNode
  data: Uint8Array<ArrayBuffer>
}

const graphs = new WeakMap<HTMLAudioElement, Graph>()

const createData = (length: number): Uint8Array<ArrayBuffer> =>
  new Uint8Array(new ArrayBuffer(length))

const getGraph = (audio: HTMLAudioElement): Graph | null => {
  const existing = graphs.get(audio)
  if (existing) return existing

  try {
    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.78

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
  } catch {
    return null
  }
}

const bandLevel = (data: Uint8Array, from: number, to: number): number => {
  let sum = 0
  let n = 0
  const end = Math.min(to, data.length)
  for (let i = from; i < end; i += 1) {
    sum += data[i] ?? 0
    n += 1
  }
  if (n === 0) return 0
  return Math.min(1, sum / n / 220)
}

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
      if (graph.audioCtx.state === 'suspended' && playing) {
        await graph.audioCtx.resume()
      }
      if (cancelled) return

      graph.analyser.getByteFrequencyData(graph.data)
      const targetL = playing ? bandLevel(graph.data, 1, 10) : 0
      const targetR = playing ? bandLevel(graph.data, 18, 48) : 0
      leftLevel.current += (targetL - leftLevel.current) * 0.18
      rightLevel.current += (targetR - rightLevel.current) * 0.18

      const toNeedle = (level: number) => -48 + level * 96
      const left = leftRef.current
      const right = rightRef.current
      if (left) left.setAttribute('transform', `rotate(${toNeedle(leftLevel.current)} 50 58)`)
      if (right) right.setAttribute('transform', `rotate(${toNeedle(rightLevel.current)} 50 58)`)

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
    <div className="grid grid-cols-2 gap-3">
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
    <svg viewBox="0 0 100 68" className="h-14 w-full" aria-hidden>
      <path
        d="M12 58 A 38 38 0 0 1 88 58"
        fill="none"
        stroke="#6a6662"
        strokeWidth="1"
      />
      <path
        d="M70 22 A 38 38 0 0 1 88 58"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.4"
      />
      <line
        ref={needleRef}
        x1="50"
        y1="58"
        x2="50"
        y2="18"
        stroke="#e8c48a"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform="rotate(-48 50 58)"
      />
      <circle cx="50" cy="58" r="3" fill="#cfd3d5" />
    </svg>
  </div>
)
