/** Quiet deck noises, generated once. Unlock on the click that starts them. */

export type DeckSound = 'sleeve' | 'drop' | 'needleDown' | 'needleUp'

type SoundBuffers = Record<DeckSound, AudioBuffer>

const MASTER_GAIN = 0.2

const VOLUME: Record<DeckSound, number> = {
  sleeve: 0.7,
  drop: 0.85,
  needleDown: 0.55,
  needleUp: 0.55,
}

let audioContext: AudioContext | null = null
let buffers: SoundBuffers | null = null

const mixBrownNoise = (white: number, previousBrown: number) =>
  (previousBrown + 0.02 * white) / 1.02

const amplitudeEnvelope = (progress: number, attack: number, release: number) => {
  if (progress < attack) return progress / attack
  return Math.exp(-(progress - attack) / Math.max(0.001, release))
}

const sine = (frequencyHz: number, sampleIndex: number, sampleRate: number) =>
  Math.sin((2 * Math.PI * frequencyHz * sampleIndex) / sampleRate)

const renderBuffer = (
  context: AudioContext,
  durationSec: number,
  sample: (args: {
    sampleIndex: number
    progress: number
    noise: number
    sampleRate: number
  }) => number,
): AudioBuffer => {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSec))
  const buffer = context.createBuffer(1, frameCount, context.sampleRate)
  const channel = buffer.getChannelData(0)
  let brown = 0

  for (let sampleIndex = 0; sampleIndex < frameCount; sampleIndex += 1) {
    const white = Math.random() * 2 - 1
    brown = mixBrownNoise(white, brown)
    const noise = white * 0.55 + brown * 0.45
    channel[sampleIndex] = sample({
      sampleIndex,
      progress: sampleIndex / frameCount,
      noise,
      sampleRate: context.sampleRate,
    })
  }

  return buffer
}

const buildBuffers = (context: AudioContext): SoundBuffers => ({
  sleeve: renderBuffer(context, 0.28, ({ progress, noise }) => {
    const paperFlutter = 0.72 + Math.sin(progress * 86) * 0.28
    return noise * amplitudeEnvelope(progress, 0.012, 0.09) * paperFlutter * 0.55
  }),
  drop: renderBuffer(context, 0.22, ({ sampleIndex, progress, noise, sampleRate }) => {
    const thud =
      sine(78, sampleIndex, sampleRate) * amplitudeEnvelope(progress, 0.004, 0.07) * 0.7 +
      sine(156, sampleIndex, sampleRate) * amplitudeEnvelope(progress, 0.003, 0.045) * 0.28
    const feltSlap = noise * amplitudeEnvelope(progress, 0.002, 0.018) * 0.22
    return thud + feltSlap
  }),
  needleDown: renderBuffer(context, 0.14, ({ sampleIndex, progress, noise, sampleRate }) => {
    const tick = sine(2400, sampleIndex, sampleRate) * amplitudeEnvelope(progress, 0.001, 0.012) * 0.35
    const body = sine(420, sampleIndex, sampleRate) * amplitudeEnvelope(progress, 0.002, 0.03) * 0.18
    const crackle = noise * amplitudeEnvelope(progress, 0.001, 0.04) * 0.12
    return tick + body + crackle
  }),
  needleUp: renderBuffer(context, 0.1, ({ sampleIndex, progress, noise, sampleRate }) => {
    const tick = sine(1650, sampleIndex, sampleRate) * amplitudeEnvelope(progress, 0.001, 0.018) * 0.22
    return tick + noise * amplitudeEnvelope(progress, 0.001, 0.03) * 0.08
  }),
})

const getDeckAudio = (): { context: AudioContext; buffers: SoundBuffers } | null => {
  try {
    if (!audioContext) audioContext = new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
    if (!buffers) buffers = buildBuffers(audioContext)
    return { context: audioContext, buffers }
  } catch {
    return null
  }
}

export const unlockDeckFoley = (): void => {
  getDeckAudio()
}

export const playFoley = (sound: DeckSound): void => {
  const deck = getDeckAudio()
  if (!deck) return
  const source = deck.context.createBufferSource()
  const gain = deck.context.createGain()
  source.buffer = deck.buffers[sound]
  gain.gain.value = MASTER_GAIN * VOLUME[sound]
  source.connect(gain)
  gain.connect(deck.context.destination)
  source.start()
}
