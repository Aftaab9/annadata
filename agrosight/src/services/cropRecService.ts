import type { CropRecInputs, CropRecResult } from './types'

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

/** KNN lookup on Kaggle Crop Recommendation centroids (Phase 3 — no browser training) */
export async function recommendCrop(inputs: CropRecInputs): Promise<CropRecResult> {
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
    reason: best.c.reason,
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
