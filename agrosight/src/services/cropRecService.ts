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

async function lookupCrop(inputs: CropRecInputs): Promise<CropRecResult> {
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

/** Prefer Colab RF ONNX; fall back to centroid lookup. */
export async function recommendCrop(inputs: CropRecInputs): Promise<CropRecResult> {
  try {
    const features = FEATURE_KEYS.map((k) => inputs[k])
    const onnx = await runClassifierOnnx(CROP_REC_ONNX, CROP_REC_META, features)

    if (onnx) {
      const ranked = onnx.probabilities
        .map((p, i) => ({ i, p }))
        .sort((a, b) => b.p - a.p)
      const top = ranked.filter((t) => t.p > 0.01).slice(0, 4)
      const bestName = onnx.className
      const acc = onnx.meta.accuracy
      return {
        crop: bestName,
        label: titleCase(bestName),
        confidence: Math.round(onnx.confidence * 1000) / 1000,
        source: 'model',
        reason: `RandomForest ONNX (${acc != null ? `${acc}% hold-out` : 'Colab'}) votes ${(onnx.confidence * 100).toFixed(0)}% for ${titleCase(bestName)} given these soil + climate inputs.`,
        alternatives: top.slice(1).map((t) => ({
          crop: onnx.meta.classes[t.i] ?? String(t.i),
          label: titleCase(onnx.meta.classes[t.i] ?? String(t.i)),
          confidence: Math.round(t.p * 1000) / 1000,
        })),
      }
    }
  } catch (e) {
    console.warn('[cropRecService] ONNX path failed, using lookup:', e)
  }

  return lookupCrop(inputs)
}

export const DEFAULT_CROP_REC_INPUTS: CropRecInputs = {
  N: 78,
  P: 48,
  K: 20,
  temperature: 22,
  humidity: 65,
  ph: 6.2,
  rainfall: 85,
}

const FALLBACK_CENTROIDS: CropCentroid[] = [
  {
    crop: 'maize',
    label: 'Maize',
    N: 78,
    P: 48,
    K: 20,
    temperature: 22,
    humidity: 65,
    ph: 6.2,
    rainfall: 85,
    reason: 'Warm moderate-rain profile fits maize.',
  },
  {
    crop: 'tomato',
    label: 'Tomato',
    N: 100,
    P: 50,
    K: 55,
    temperature: 24,
    humidity: 70,
    ph: 6.5,
    rainfall: 90,
    reason: 'Balanced NPK and warm humidity suit tomato.',
  },
  {
    crop: 'potato',
    label: 'Potato',
    N: 100,
    P: 65,
    K: 100,
    temperature: 17,
    humidity: 80,
    ph: 5.8,
    rainfall: 80,
    reason: 'Cool climate with high K fits potato.',
  },
  {
    crop: 'apple',
    label: 'Apple',
    N: 21,
    P: 134,
    K: 200,
    temperature: 22,
    humidity: 92,
    ph: 5.9,
    rainfall: 113,
    reason: 'High P/K and cool-humid profile fits apple.',
  },
  {
    crop: 'pepper',
    label: 'Pepper',
    N: 120,
    P: 50,
    K: 65,
    temperature: 25,
    humidity: 60,
    ph: 6.3,
    rainfall: 80,
    reason: 'High N warm profile fits bell pepper.',
  },
  {
    crop: 'soybean',
    label: 'Soybean',
    N: 40,
    P: 55,
    K: 45,
    temperature: 25,
    humidity: 65,
    ph: 6.5,
    rainfall: 75,
    reason: 'Lower N (legume) with balanced PK fits soybean.',
  },
]
