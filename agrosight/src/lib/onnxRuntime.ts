/**
 * Browser ONNX Runtime for Colab-exported sklearn RandomForest models.
 * Falls back silently when artifacts missing.
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

function parseProbs(raw: unknown, nClasses: number): number[] {
  const probs = new Array(nClasses).fill(0)
  if (Array.isArray(raw) && raw.length > 0) {
    const row = raw[0]
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      for (const [k, v] of Object.entries(row as Record<string, number>)) {
        const idx = Number(k)
        if (!Number.isNaN(idx) && idx >= 0 && idx < nClasses) {
          probs[idx] = Number(v) || 0
        }
      }
      return probs
    }
    if (Array.isArray(row)) {
      for (let i = 0; i < Math.min(nClasses, row.length); i++) {
        probs[i] = Number(row[i]) || 0
      }
      return probs
    }
  }
  if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
    const data = Array.from((raw as { data: ArrayLike<number> }).data)
    for (let i = 0; i < Math.min(nClasses, data.length); i++) {
      probs[i] = Number(data[i]) || 0
    }
  }
  return probs
}

function parseLabel(raw: unknown): number {
  if (typeof raw === 'number') return raw
  if (Array.isArray(raw)) return Number(raw[0]) || 0
  if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
    return Number((raw as { data: ArrayLike<number> }).data[0]) || 0
  }
  return 0
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

  const inputName = bundle.session.inputNames[0] ?? 'float_input'
  const tensor = new ort.Tensor(
    'float32',
    Float32Array.from(features),
    [1, features.length],
  )
  const feeds: Record<string, ort.Tensor> = { [inputName]: tensor }
  const out = await bundle.session.run(feeds)

  const labelKey =
    (bundle.session.outputNames as string[]).find((n) =>
      n.includes('label'),
    ) ?? bundle.session.outputNames[0]!
  const probKey = (bundle.session.outputNames as string[]).find((n) =>
    n.includes('prob'),
  )

  const classIndex = parseLabel(out[labelKey])
  const n = bundle.meta.classes.length
  let probabilities = probKey ? parseProbs(out[probKey], n) : []
  if (!probabilities.length || probabilities.every((p) => p === 0)) {
    probabilities = new Array(n).fill(0)
    if (classIndex >= 0 && classIndex < n) probabilities[classIndex] = 1
  }
  const confidence = probabilities[classIndex] ?? 1
  const className = bundle.meta.classes[classIndex] ?? String(classIndex)

  return {
    classIndex,
    className,
    confidence,
    probabilities,
    meta: bundle.meta,
  }
}

export const CROP_REC_ONNX = `${_root}models/crop_rec.onnx`
export const CROP_REC_META = `${_root}models/crop_rec_meta.json`
export const FERT_ONNX = `${_root}models/fertilizer.onnx`
export const FERT_META = `${_root}models/fertilizer_meta.json`

export function clearOnnxSessionCache() {
  cache.clear()
}
