/** Synthesized deck noises. Short buffers, no network, no decode hitch. */

export type DeckSound = 'sleeve' | 'drop' | 'needleDown' | 'needleUp'

type Kit = Record<DeckSound, AudioBuffer>

const MASTER = 0.2

let ctx: AudioContext | null = null
let kit: Kit | null = null

const fillNoise = (data: Float32Array, fn: (i: number, t: number, white: number) => number) => {
  let brown = 0
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1
    brown = (brown + 0.02 * white) / 1.02
    data[i] = fn(i, i / data.length, white * 0.55 + brown * 0.45)
  }
}

const makeBuffer = (
  audio: AudioContext,
  seconds: number,
  fn: (i: number, t: number, white: number) => number,
): AudioBuffer => {
  const length = Math.max(1, Math.floor(audio.sampleRate * seconds))
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  fillNoise(buffer.getChannelData(0), fn)
  return buffer
}

const env = (t: number, attack: number, release: number) => {
  if (t < attack) return t / attack
  return Math.exp((- (t - attack)) / Math.max(0.001, release))
}

const buildKit = (audio: AudioContext): Kit => {
  const sleeve = makeBuffer(audio, 0.28, (_i, t, n) => {
    const flutter = 0.72 + Math.sin(t * 86) * 0.28
    return n * env(t, 0.012, 0.09) * flutter * 0.55
  })

  const drop = makeBuffer(audio, 0.22, (i, t, n) => {
    const sr = audio.sampleRate
    const thud =
      Math.sin((2 * Math.PI * 78 * i) / sr) * env(t, 0.004, 0.07) * 0.7 +
      Math.sin((2 * Math.PI * 156 * i) / sr) * env(t, 0.003, 0.045) * 0.28
    const slap = n * env(t, 0.002, 0.018) * 0.22
    return thud + slap
  })

  const needleDown = makeBuffer(audio, 0.14, (i, t, n) => {
    const sr = audio.sampleRate
    const tick = Math.sin((2 * Math.PI * 2400 * i) / sr) * env(t, 0.001, 0.012) * 0.35
    const body = Math.sin((2 * Math.PI * 420 * i) / sr) * env(t, 0.002, 0.03) * 0.18
    const crackle = n * env(t, 0.001, 0.04) * 0.12
    return tick + body + crackle
  })

  const needleUp = makeBuffer(audio, 0.1, (i, t, n) => {
    const sr = audio.sampleRate
    const tick = Math.sin((2 * Math.PI * 1650 * i) / sr) * env(t, 0.001, 0.018) * 0.22
    return tick + n * env(t, 0.001, 0.03) * 0.08
  })

  return { sleeve, drop, needleDown, needleUp }
}

const ensure = async (): Promise<{ audio: AudioContext; kit: Kit } | null> => {
  try {
    if (!ctx) {
      ctx = new AudioContext()
    }
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    if (!kit) {
      kit = buildKit(ctx)
    }
    return { audio: ctx, kit }
  } catch {
    return null
  }
}

export const unlockDeckFoley = (): void => {
  void ensure()
}

export const playFoley = (sound: DeckSound): void => {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    if (!kit) kit = buildKit(ctx)
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    const trim =
      sound === 'needleDown' || sound === 'needleUp' ? 0.55 : sound === 'drop' ? 0.85 : 0.7
    source.buffer = kit[sound]
    gain.gain.value = MASTER * trim
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  } catch {
    /* Web Audio unavailable */
  }
}

export const playDeckFoley = playFoley
