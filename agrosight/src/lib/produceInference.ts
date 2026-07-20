import * as tf from '@tensorflow/tfjs'
import { imageToInputTensor } from './imageTensor'
import {
  getTfliteRuntime,
  resetTfliteRuntime,
  type TfliteGlobal,
} from './tfliteRuntime'

const _base = import.meta.env.BASE_URL || '/'
const _root = _base.endsWith('/') ? _base : `${_base}/`
export const PRODUCE_MODEL_PATH = `${_root}models/agrosight_produce.tflite`

/** Produce quality classes (Healthy vs Rotten style) */
export type ProduceClass = 'FRESH' | 'BORDERLINE' | 'ROTTEN'

export interface ProduceResult {
  class: ProduceClass
  confidence: number
  probabilities: Record<ProduceClass, number>
  /** Market grade mapped from produce quality */
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
    const res = await fetch(PRODUCE_MODEL_PATH, { cache: 'no-store' })
    if (!res.ok) {
      produceError = `Produce TFLite missing (${res.status}). Run Colab notebook & drop agrosight_produce.tflite into public/models/`
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
    console.info('[AgroSight] Produce TFLite loaded')
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

function parseProduceProbs(raw: ArrayLike<number>): number[] {
  const probs = Array.from(raw).slice(0, 3)
  const sum = probs.reduce((a, b) => a + b, 0)
  if (sum === 0 || probs.every((p) => p === 0)) {
    throw new Error('Produce TFLite returned zeros — re-export fp32 model')
  }
  if (sum > 0.95 && sum < 1.05) return probs
  const max = Math.max(...probs)
  const exps = probs.map((p) => Math.exp(p - max))
  const expSum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / expSum)
}

/** Heuristic mock until Colab produce model is dropped in */
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
  const r = (n: number) => ((hash * n * 9301 + 49297) % 233280) / 233280
  const raw = [r(1) + 0.35, r(2) + 0.2, r(3) + 0.15]
  const sum = raw.reduce((a, b) => a + b, 0)
  const probs = raw.map((v) => v / sum)
  const maxIdx = probs.indexOf(Math.max(...probs))
  const classes: ProduceClass[] = ['FRESH', 'BORDERLINE', 'ROTTEN']
  const cls = classes[maxIdx] ?? 'FRESH'
  const confidence = probs[maxIdx] ?? 0.5
  const { grade, defectRatePct } = mapToGrade(cls, confidence)
  return {
    class: cls,
    confidence,
    probabilities: {
      FRESH: probs[0] ?? 0,
      BORDERLINE: probs[1] ?? 0,
      ROTTEN: probs[2] ?? 0,
    },
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

  const input = imageToInputTensor(imageSource)
  try {
    const rawOut = produceModel.predict(input)
    const output = (Array.isArray(rawOut) ? rawOut[0] : rawOut) as tf.Tensor
    const raw = await output.data()
    const normalized = parseProduceProbs(raw)
    input.dispose()
    output.dispose()

    const maxIdx = normalized.reduce(
      (best, p, i) => (p > (normalized[best] ?? 0) ? i : best),
      0,
    )
    const classes: ProduceClass[] = ['FRESH', 'BORDERLINE', 'ROTTEN']
    const cls = classes[maxIdx] ?? 'FRESH'
    const confidence = normalized[maxIdx] ?? 0
    const { grade, defectRatePct } = mapToGrade(cls, confidence)

    return {
      class: cls,
      confidence,
      probabilities: {
        FRESH: normalized[0] ?? 0,
        BORDERLINE: normalized[1] ?? 0,
        ROTTEN: normalized[2] ?? 0,
      },
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
