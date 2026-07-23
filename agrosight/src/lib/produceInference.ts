import * as tf from '@tensorflow/tfjs'
import {
  getTfliteRuntime,
  resetTfliteRuntime,
  type TfliteGlobal,
} from './tfliteRuntime'

const IMG_SIZE = 224

const _base = import.meta.env.BASE_URL || '/'
const _root = _base.endsWith('/') ? _base : `${_base}/`
export const PRODUCE_MODEL_PATH = `${_root}models/agrosight_produce.tflite`

export type ProduceClass = 'FRESH' | 'BORDERLINE' | 'ROTTEN'

export interface ProduceResult {
  class: ProduceClass
  confidence: number
  probabilities: Record<ProduceClass, number>
  grade: 'A' | 'B' | 'C'
  defectRatePct: number
  inferenceMs: number
  mock: boolean
  source: 'tflite' | 'mock'
}

export const PRODUCE_LABELS: Record<ProduceClass, string> = {
  FRESH: 'Fresh / Market-ready',
  BORDERLINE: 'Borderline / Sort',
  ROTTEN: 'Spoiled / Reject',
}

type TfliteRunner = Awaited<ReturnType<TfliteGlobal['loadTFLiteModel']>>

let produceModel: TfliteRunner | null = null
let produceReady = false
let produceMock = true
let produceError: string | null = null

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

export function subscribeProduceState(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function isProduceModelReady() {
  return produceReady
}

export function isProduceUsingMock() {
  return produceMock
}

export function getProduceLoadError() {
  return produceError
}

export async function loadProduceModel(force = false): Promise<boolean> {
  if (produceReady && !force) return !produceMock
  if (force) {
    produceModel = null
    produceReady = false
    produceMock = true
    produceError = null
  }

  try {
    const res = await fetch(`${PRODUCE_MODEL_PATH}?bin=1`, { cache: 'no-store' })
    if (!res.ok) {
      produceError = `Produce TFLite missing (${res.status})`
      produceReady = true
      produceMock = true
      notify()
      return false
    }
    const buf = await res.arrayBuffer()
    const tflite = await getTfliteRuntime()
    produceModel = await tflite.loadTFLiteModel(buf, { numThreads: 1 })
    produceMock = false
    produceReady = true
    produceError = null
    console.info('[AgroSight] Produce binary TFLite loaded (P(Rotten) sigmoid)')
    notify()
    return true
  } catch (e) {
    produceError = e instanceof Error ? e.message : String(e)
    produceReady = true
    produceMock = true
    notify()
    return false
  }
}

function mapToGrade(
  cls: ProduceClass,
  confidence: number,
): { grade: 'A' | 'B' | 'C'; defectRatePct: number } {
  if (cls === 'FRESH' && confidence >= 0.75) {
    return { grade: 'A', defectRatePct: 2 }
  }
  if (cls === 'FRESH' || cls === 'BORDERLINE') {
    return { grade: 'B', defectRatePct: 10 }
  }
  return { grade: 'C', defectRatePct: 28 }
}

/** Same as Colab: bilinear 224 crop, RGB float / 255 */
function imageToProduceTensor(
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
): tf.Tensor4D {
  const canvas = document.createElement('canvas')
  canvas.width = IMG_SIZE
  canvas.height = IMG_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D unavailable')

  const w = (source as HTMLImageElement).width || IMG_SIZE
  const h = (source as HTMLImageElement).height || IMG_SIZE
  const side = Math.min(w, h)
  const sx = (w - side) / 2
  const sy = (h - side) / 2
  ctx.drawImage(source as CanvasImageSource, sx, sy, side, side, 0, 0, IMG_SIZE, IMG_SIZE)

  const { data } = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE)
  const floats = new Float32Array(IMG_SIZE * IMG_SIZE * 3)
  let j = 0
  for (let i = 0; i < data.length; i += 4) {
    floats[j++] = data[i]! / 255
    floats[j++] = data[i + 1]! / 255
    floats[j++] = data[i + 2]! / 255
  }
  return tf.tensor4d(floats, [1, IMG_SIZE, IMG_SIZE, 3])
}

/**
 * Model output is P(Rotten) in [0,1] from the trained Dense+Sigmoid head.
 * Decision thresholds: <0.4 Fresh, >0.6 Rotten, else Borderline.
 * Display probs are a soft 3-way split that ALWAYS sums to 1.0 (faculty-readable).
 */
function fromBinaryRottenProb(pRottenRaw: number): {
  class: ProduceClass
  confidence: number
  probabilities: Record<ProduceClass, number>
} {
  const p = Math.min(1, Math.max(0, pRottenRaw))

  // Soft membership centered on Fresh / Borderline / Rotten regions
  const gauss = (center: number, width: number) =>
    Math.exp(-0.5 * ((p - center) / width) ** 2)
  let fresh = gauss(0.15, 0.16)
  let borderline = gauss(0.5, 0.12)
  let rotten = gauss(0.85, 0.16)
  const z = fresh + borderline + rotten || 1
  fresh /= z
  borderline /= z
  rotten /= z

  let cls: ProduceClass
  if (p < 0.4) cls = 'FRESH'
  else if (p > 0.6) cls = 'ROTTEN'
  else cls = 'BORDERLINE'

  const confidence =
    cls === 'FRESH' ? fresh : cls === 'BORDERLINE' ? borderline : rotten

  return {
    class: cls,
    confidence,
    probabilities: {
      FRESH: fresh,
      BORDERLINE: borderline,
      ROTTEN: rotten,
    },
  }
}

/** Legacy 3-way softmax fallback (should not be needed after binary extract). */
function fromSoftmax3(vals: number[]): ReturnType<typeof fromBinaryRottenProb> {
  let f = vals[0] ?? 0
  let b = vals[1] ?? 0
  let r = vals[2] ?? 0
  const s = f + b + r || 1
  f /= s
  b /= s
  r /= s
  // Recover underlying P(Rotten) ≈ r/(f+r) from ThreeWay math
  return fromBinaryRottenProb(r / (f + r + 1e-9))
}

async function classifyProduceMock(
  source: HTMLImageElement | HTMLCanvasElement,
  start: number,
): Promise<ProduceResult> {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  let hash = 42
  if (ctx) {
    ctx.drawImage(source, 0, 0, 32, 32)
    const data = ctx.getImageData(0, 0, 32, 32).data
    for (let i = 0; i < data.length; i += 4) {
      hash = (hash * 31 + (data[i] ?? 0)) % 10000
    }
  }
  const pRotten = ((hash * 9301 + 49297) % 233280) / 233280
  const parsed = fromBinaryRottenProb(pRotten)
  const { grade, defectRatePct } = mapToGrade(parsed.class, parsed.confidence)
  return {
    ...parsed,
    grade,
    defectRatePct,
    inferenceMs: Math.round(performance.now() - start + 120),
    mock: true,
    source: 'mock',
  }
}

export async function classifyProduce(
  imageSource: HTMLImageElement | HTMLCanvasElement,
): Promise<ProduceResult> {
  const start = performance.now()
  if (!produceReady) await loadProduceModel()

  if (produceMock || !produceModel) {
    return classifyProduceMock(imageSource, start)
  }

  const input = imageToProduceTensor(imageSource)
  try {
    const rawOut = produceModel.predict(input)
    const output = (Array.isArray(rawOut) ? rawOut[0] : rawOut) as tf.Tensor
    const raw = Array.from(await output.data())
    input.dispose()
    output.dispose()

    const parsed =
      raw.length <= 2
        ? fromBinaryRottenProb(Number(raw[0]))
        : fromSoftmax3(raw)

    console.info('[AgroSight] produce binary', {
      raw: raw.slice(0, 3).map((x) => +Number(x).toFixed(4)),
      class: parsed.class,
      confidence: +parsed.confidence.toFixed(4),
      P_Rotten: parsed.probabilities.ROTTEN,
    })

    const { grade, defectRatePct } = mapToGrade(parsed.class, parsed.confidence)
    return {
      class: parsed.class,
      confidence: parsed.confidence,
      probabilities: parsed.probabilities,
      grade,
      defectRatePct,
      inferenceMs: Math.round(performance.now() - start),
      mock: false,
      source: 'tflite',
    }
  } catch (e) {
    input.dispose()
    console.error('[AgroSight] Produce inference failed:', e)
    throw e
  }
}

export function resetProduceRuntime() {
  resetTfliteRuntime()
  produceModel = null
  produceReady = false
  produceMock = true
  produceError = null
}
