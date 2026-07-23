/**
 * Browser ONNX Runtime for Colab-exported sklearn RandomForest models.
 * Models must expose dense float probability tensors (zipmap=False / ZipMap stripped).
 */
// @ts-expect-error onnxruntime-web package exports typings oddly under bundler resolution
import * as ort from 'onnxruntime-web'

const _base = import.meta.env.BASE_URL || '/'
const _root = _base.endsWith('/') ? _base : `${_base}/`

ort.env.wasm.wasmPaths =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/'

export type OnnxMeta = {
  features: string[]
  classes: string[]
  accuracy?: number
  soil_classes?: string[]
  crop_classes?: string[]
}

type SessionBundle = {
  session: ort.InferenceSession
  meta: OnnxMeta
}

const cache = new Map<string, SessionBundle | null>()

async function loadBundle(
  modelPath: string,
  metaPath: string,
): Promise<SessionBundle | null> {
  const key = modelPath
  if (cache.has(key)) return cache.get(key) ?? null
  try {
    const [modelRes, metaRes] = await Promise.all([
      fetch(modelPath, { cache: 'no-store' }),
      fetch(metaPath, { cache: 'no-store' }),
    ])
    if (!modelRes.ok || !metaRes.ok) {
      cache.set(key, null)
      return null
    }
    const [buf, meta] = await Promise.all([
      modelRes.arrayBuffer(),
      metaRes.json() as Promise<OnnxMeta>,
    ])
    const session = await ort.InferenceSession.create(buf, {
      executionProviders: ['wasm'],
    })
    const bundle = { session, meta }
    cache.set(key, bundle)
    return bundle
  } catch (e) {
    console.warn('[onnx] load failed', modelPath, e)
    cache.set(key, null)
    return null
  }
}

function parseLabel(raw: unknown): number {
  if (typeof raw === 'number') return raw
  if (typeof raw === 'bigint') return Number(raw)
  if (typeof raw === 'string') {
    const n = Number(raw)
    return Number.isNaN(n) ? 0 : n
  }
  if (Array.isArray(raw)) return parseLabel(raw[0])
  if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
    return parseLabel((raw as { data: ArrayLike<unknown> }).data[0])
  }
  return 0
}

/** Dense float probs from TreeEnsembleClassifier — shape [1, n_classes] or flat. */
function parseDenseProbs(raw: unknown, nClasses: number): number[] {
  const probs = new Array(nClasses).fill(0)
  let data: number[] = []

  if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
    data = Array.from((raw as { data: ArrayLike<number> }).data).map(Number)
  } else if (Array.isArray(raw)) {
    const row = raw[0]
    if (Array.isArray(row)) data = row.map(Number)
    else if (typeof row === 'number') data = raw.map(Number)
  }

  for (let i = 0; i < Math.min(nClasses, data.length); i++) {
    probs[i] = data[i] ?? 0
  }
  return probs
}

export async function runClassifierOnnx(
  modelUrl: string,
  metaUrl: string,
  features: number[],
): Promise<{
  classIndex: number
  className: string
  confidence: number
  probabilities: number[]
  meta: OnnxMeta
} | null> {
  const bundle = await loadBundle(modelUrl, metaUrl)
  if (!bundle) return null

  try {
    const inputName = bundle.session.inputNames[0] ?? 'float_input'
    const tensor = new ort.Tensor(
      'float32',
      Float32Array.from(features),
      [1, features.length],
    )
    const feeds: Record<string, ort.Tensor> = { [inputName]: tensor }

    const names = bundle.session.outputNames as string[]
    const labelKey =
      names.find((n) => n.toLowerCase().includes('label')) ?? names[0]!
    const probKey = names.find((n) => n.toLowerCase().includes('prob'))

    const out = await bundle.session.run(feeds)
    const n = bundle.meta.classes.length

    let probabilities = probKey ? parseDenseProbs(out[probKey], n) : []
    let classIndex = parseLabel(out[labelKey])

    if (!probabilities.length || probabilities.every((p) => p === 0)) {
      probabilities = new Array(n).fill(0)
      if (classIndex >= 0 && classIndex < n) probabilities[classIndex] = 1
    } else {
      // Prefer argmax of real RF votes over label tensor (keeps UI in sync with probs)
      let best = 0
      for (let i = 1; i < probabilities.length; i++) {
        if ((probabilities[i] ?? 0) > (probabilities[best] ?? 0)) best = i
      }
      classIndex = best
    }

    const confidence = probabilities[classIndex] ?? 0
    const className = bundle.meta.classes[classIndex] ?? String(classIndex)

    return {
      classIndex,
      className,
      confidence,
      probabilities,
      meta: bundle.meta,
    }
  } catch (e) {
    console.warn('[onnx] inference failed', modelUrl, e)
    return null
  }
}

export const CROP_REC_ONNX = `${_root}models/crop_rec.onnx`
export const CROP_REC_META = `${_root}models/crop_rec_meta.json`
export const FERT_ONNX = `${_root}models/fertilizer.onnx`
export const FERT_META = `${_root}models/fertilizer_meta.json`

export function clearOnnxSessionCache() {
  cache.clear()
}
