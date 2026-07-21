import type { CropRecInputs, CropRecResult } from './types'
import {
  CROP_REC_META,
  CROP_REC_ONNX,
  runClassifierOnnx,
} from '@/lib/onnxRuntime'

interface CropCentroid extends CropRecInputs {
  crop: string
  label: string
  reason: string
}

interface CropRecSnapshot {
  centroids: CropCentroid[]
}

const FEATURE_KEYS: (keyof CropRecInputs)[] = [
  'N',
  'P',
  'K',
  'temperature',
  'humidity',
  'ph',
  'rainfall',
]

const FEATURE_SCALE: Record<keyof CropRecInputs, number> = {
  N: 120,
  P: 80,
  K: 60,
  temperature: 35,
  humidity: 100,
  ph: 8,
  rainfall: 250,
}

let snapshotPromise: Promise<CropCentroid[]> | null = null

async function loadCentroids(): Promise<CropCentroid[]> {
  if (!snapshotPromise) {
    snapshotPromise = fetch('/data/crop_rec_snapshot.json')
      .then((r) => {
        if (!r.ok) throw new Error('crop rec snapshot missing')
        return r.json() as Promise<CropRecSnapshot>
      })
      .then((json) => json.centroids ?? [])
      .catch((err) => {
        console.warn('[cropRecService] snapshot failed, using inline fallback:', err)
        snapshotPromise = null
        return FALLBACK_CENTROIDS
      })
  }
  return snapshotPromise
}

function distance(inputs: CropRecInputs, c: CropCentroid): number {
  let sum = 0
  for (const key of FEATURE_KEYS) {
    const delta = (inputs[key] - c[key]) / FEATURE_SCALE[key]
    sum += delta * delta
  }
  return Math.sqrt(sum)
}

function toConfidence(distances: number[]): number[] {
  const weights = distances.map((d) => Math.exp(-d * 2))
  const total = weights.reduce((a, b) => a + b, 0) || 1
  return weights.map((w) => w / total)
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Prefer Colab RF ONNX; fall back to centroid lookup. */
export async function recommendCrop(inputs: CropRecInputs): Promise<CropRecResult> {
  const features = FEATURE_KEYS.map((k) => inputs[k])
  const onnx = await runClassifierOnnx(CROP_REC_ONNX, CROP_REC_META, features)

  if (onnx) {
    const ranked = onnx.probabilities
      .map((p, i) => ({ i, p }))
      .sort((a, b) => b.p - a.p)
    const top = ranked.slice(0, 4)
    const bestName = onnx.className
    const acc = onnx.meta.accuracy
    return {
      crop: bestName,
      label: titleCase(bestName),
      confidence: Math.round(onnx.confidence * 100) / 100,
      source: 'model',
      reason: `RandomForest ONNX (${acc != null ? `${acc}% hold-out` : 'Colab'}) — top class ${titleCase(bestName)}.`,
      alternatives: top.slice(1).map((t) => ({
        crop: onnx.meta.classes[t.i] ?? String(t.i),
        label: titleCase(onnx.meta.classes[t.i] ?? String(t.i)),
        confidence: Math.round(t.p * 100) / 100,
      })),
    }
  }

  const centroids = await loadCentroids()
  const ranked = centroids
    .map((c) => ({ c, dist: distance(inputs, c) }))
    .sort((a, b) => a.dist - b.dist)

  const top = ranked.slice(0, 4)
  const confidences = toConfidence(top.map((t) => t.dist))
  const best = top[0]!

  return {
    crop: best.c.crop,
    label: best.c.label,
    confidence: Math.round((confidences[0] ?? 0.5) * 100) / 100,
    source: 'model',
    reason: `${best.c.reason} (centroid lookup — ONNX unavailable)`,
    alternatives: top.slice(1).map((t, i) => ({
      crop: t.c.crop,
      label: t.c.label,
      confidence: Math.round((confidences[i + 1] ?? 0) * 100) / 100,
    })),
  }
}

export const DEFAULT_CROP_REC_INPUTS: CropRecInputs = {
  N: 90,
  P: 42,
  K: 43,
  temperature: 26,
  humidity: 65,
  ph: 6.5,
  rainfall: 120,
}

const FALLBACK_CENTROIDS: CropCentroid[] = [
  {
    crop: 'maize',
    label: 'Maize',
    N: 90,
    P: 42,
    K: 43,
    temperature: 26,
    humidity: 65,
    ph: 6.5,
    rainfall: 110,
    reason: 'Warm climate with moderate rain fits maize.',
  },
  {
    crop: 'rice',
    label: 'Rice',
    N: 80,
    P: 48,
    K: 40,
    temperature: 24,
    humidity: 83,
    ph: 6.4,
    rainfall: 230,
    reason: 'High rainfall and humidity suit paddy cultivation.',
  },
]
