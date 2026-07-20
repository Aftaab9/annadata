import * as tf from '@tensorflow/tfjs'
import {
  DEFECT_CLASSES,
  type DefectClass,
} from './constants'
import { imageToInputTensor } from './imageTensor'
import {
  getTfliteRuntime,
  resetTfliteRuntime,
  type TfliteGlobal,
} from './tfliteRuntime'

const _base = import.meta.env.BASE_URL || '/'
const _root = _base.endsWith('/') ? _base : `${_base}/`
export const MODEL_PATH = `${_root}models/agrosight_plantvillage.tflite`

export interface ClassificationResult {
  class: DefectClass
  confidence: number
  probabilities: Record<DefectClass, number>
  inferenceMs: number
  mock: boolean
}

export type InferenceMode = 'loading' | 'tflite' | 'mock'
export type MockReason = 'missing_file' | 'load_failed' | 'wrong_origin' | null

type TfliteRunner = Awaited<ReturnType<TfliteGlobal['loadTFLiteModel']>>

let tfliteModel: TfliteRunner | null = null
let modelLoaded = false
let useMock = true
let loadError: string | null = null
let mockReason: MockReason = null
let inferenceMode: InferenceMode = 'loading'
let loadInFlight: Promise<boolean> | null = null

const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((fn) => fn())
}

export function subscribeInferenceState(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isModelReady(): boolean {
  return modelLoaded
}

export function isUsingMock(): boolean {
  return useMock
}

export function getInferenceMode(): InferenceMode {
  return inferenceMode
}

export function getModelLoadError(): string | null {
  return loadError
}

export function getMockReason(): MockReason {
  return mockReason
}

function resetLoadState(): void {
  tfliteModel = null
  modelLoaded = false
  useMock = true
  loadError = null
  mockReason = null
  inferenceMode = 'loading'
  loadInFlight = null
  notify()
}

function failMock(reason: MockReason, message: string): false {
  useMock = true
  modelLoaded = true
  inferenceMode = 'mock'
  mockReason = reason
  loadError = message
  notify()
  return false
}

async function fetchModelBuffer(): Promise<ArrayBuffer> {
  const res = await fetch(MODEL_PATH, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Model HTTP ${res.status} for ${MODEL_PATH}`)
  }
  return res.arrayBuffer()
}

export async function loadModel(force = false): Promise<boolean> {
  if (loadInFlight && !force) return loadInFlight
  if (modelLoaded && !force) return !useMock

  if (force) {
    resetTfliteRuntime()
    resetLoadState()
  }

  inferenceMode = 'loading'
  notify()

  if (window.location.protocol === 'file:') {
    return failMock(
      'wrong_origin',
      'Open via http://localhost:5173 — TFLite cannot load from file://',
    )
  }

  loadInFlight = (async () => {
    try {
      const [modelBuffer, tflite] = await Promise.all([
        fetchModelBuffer(),
        getTfliteRuntime(),
      ])

      tfliteModel = await tflite.loadTFLiteModel(modelBuffer, { numThreads: 1 })
      useMock = false
      modelLoaded = true
      inferenceMode = 'tflite'
      mockReason = null
      loadError = null
      console.info(
        '[AgroSight] TFLite model loaded',
        `(${(modelBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`,
      )
      notify()
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[AgroSight] TFLite load failed:', err)

      if (msg.includes('404') || msg.includes('HTTP 404')) {
        return failMock(
          'missing_file',
          'agrosight_plantvillage.tflite not found — run: cd agrosight && npm run copy-model',
        )
      }

      return failMock('load_failed', msg)
    } finally {
      loadInFlight = null
    }
  })()

  return loadInFlight
}

function parseProbabilities(raw: ArrayLike<number>): number[] {
  const probs = Array.from(raw).slice(0, DEFECT_CLASSES.length)
  const sum = probs.reduce((a, b) => a + b, 0)

  if (sum === 0 || probs.every((p) => p === 0)) {
    throw new Error(
      'TFLite returned zero probabilities. Run: npm run export-fp32-model',
    )
  }

  // Model ends with softmax — outputs already sum to ~1
  if (sum > 0.95 && sum < 1.05) {
    return probs
  }

  // Logits fallback
  const max = Math.max(...probs)
  const exps = probs.map((p) => Math.exp(p - max))
  const expSum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / expSum)
}

export async function classifyImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
): Promise<ClassificationResult> {
  const start = performance.now()

  if (!modelLoaded) {
    await loadModel()
  }

  if (useMock || !tfliteModel) {
    return classifyMock(imageSource, start)
  }

  const input = imageToInputTensor(imageSource)
  try {
    const rawOut = tfliteModel.predict(input)
    const output = (Array.isArray(rawOut) ? rawOut[0] : rawOut) as tf.Tensor
    const raw = await output.data()
    const normalized = parseProbabilities(raw)

    input.dispose()
    output.dispose()

    const maxIdx = normalized.reduce(
      (best, p, i) => (p > (normalized[best] ?? 0) ? i : best),
      0,
    )
    const className = DEFECT_CLASSES[maxIdx] ?? 'HEALTHY'

    return {
      class: className,
      confidence: normalized[maxIdx] ?? 0,
      probabilities: {
        HEALTHY: normalized[0] ?? 0,
        SURFACE_DEFECT: normalized[1] ?? 0,
        BLIGHT_MOLD: normalized[2] ?? 0,
      },
      inferenceMs: Math.round(performance.now() - start),
      mock: false,
    }
  } catch (err) {
    input.dispose()
    console.error('[AgroSight] Inference failed:', err)
    throw err
  }
}

async function classifyMock(
  imageSource: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  start: number,
): Promise<ClassificationResult> {
  const seed = await hashImage(imageSource)
  const probs = mockProbabilities(seed)
  const maxIdx = probs.indexOf(Math.max(...probs))
  const className = DEFECT_CLASSES[maxIdx] ?? 'HEALTHY'

  return {
    class: className,
    confidence: probs[maxIdx] ?? 0,
    probabilities: {
      HEALTHY: probs[0] ?? 0,
      SURFACE_DEFECT: probs[1] ?? 0,
      BLIGHT_MOLD: probs[2] ?? 0,
    },
    inferenceMs: Math.round(performance.now() - start + 180 + (seed % 120)),
    mock: true,
  }
}

async function hashImage(
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
): Promise<number> {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (!ctx) return 42

  ctx.drawImage(source, 0, 0, 32, 32)
  const data = ctx.getImageData(0, 0, 32, 32).data
  let hash = 0
  for (let i = 0; i < data.length; i += 4) {
    hash = (hash * 31 + data[i]!) % 10000
  }
  return hash
}

function mockProbabilities(seed: number): number[] {
  const r = (n: number) => ((seed * n * 9301 + 49297) % 233280) / 233280
  const raw = [r(1) + 0.3, r(2) + 0.15, r(3) + 0.1]
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((v) => Math.round((v / sum) * 1000) / 1000)
}
