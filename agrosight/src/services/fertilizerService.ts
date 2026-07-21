import type { FertilizerInputs, FertilizerResult } from './types'
import {
  FERT_META,
  FERT_ONNX,
  runClassifierOnnx,
} from '@/lib/onnxRuntime'

export type { FertilizerResult }

interface FertilizerSnapshot {
  crops: Record<string, { N: number; P: number; K: number }>
  products: Record<string, { fertilizer: string; template: string }>
}

let snapshotPromise: Promise<FertilizerSnapshot> | null = null
let metaPromise: Promise<{
  soil_classes: string[]
  crop_classes: string[]
  classes: string[]
} | null> | null = null

async function loadSnapshot(): Promise<FertilizerSnapshot> {
  if (!snapshotPromise) {
    snapshotPromise = fetch('/data/fertilizer_snapshot.json')
      .then((r) => {
        if (!r.ok) throw new Error('fertilizer snapshot missing')
        return r.json() as Promise<FertilizerSnapshot>
      })
      .catch((err) => {
        console.warn('[fertilizerService] snapshot failed:', err)
        snapshotPromise = null
        return FALLBACK_SNAPSHOT
      })
  }
  return snapshotPromise
}

async function loadFertMeta() {
  if (!metaPromise) {
    metaPromise = fetch('/models/fertilizer_meta.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
  }
  return metaPromise
}

function fillTemplate(
  template: string,
  crop: string,
  N: number,
  P: number,
  K: number,
  target?: number,
): string {
  return template
    .replace(/\{crop\}/g, crop)
    .replace(/\{N\}/g, String(N))
    .replace(/\{P\}/g, String(P))
    .replace(/\{K\}/g, String(K))
    .replace(/\{target\}/g, String(target ?? ''))
}

function encodeClass(classes: string[], value: string, fallback = 0): number {
  const exact = classes.findIndex((c) => c.toLowerCase() === value.toLowerCase())
  if (exact >= 0) return exact
  const partial = classes.findIndex(
    (c) =>
      c.toLowerCase().includes(value.toLowerCase()) ||
      value.toLowerCase().includes(c.toLowerCase()),
  )
  return partial >= 0 ? partial : fallback
}

function fertilizerBlurb(name: string): string {
  const map: Record<string, string> = {
    Urea: 'High nitrogen — good when leaf growth is pale/yellow.',
    DAP: 'Diammonium phosphate — boosts P for rooting and early growth.',
    '20-20': 'Balanced NPK starter for maintenance.',
    '28-28': 'Higher N+P blend for vegetative push.',
    '17-17-17': 'Even NPK maintenance blend.',
    '14-35-14': 'Phosphorus-forward for flowering/fruit set.',
    '10-26-26': 'P+K heavy — fruit quality and stress tolerance.',
  }
  return map[name] ?? 'Apply per local agronomist / soil-test guidance.'
}

/** Prefer Colab RF ONNX; fall back to NPK threshold lookup. */
export async function recommendFertilizer(
  inputs: FertilizerInputs,
): Promise<FertilizerResult> {
  const meta = await loadFertMeta()
  if (meta?.soil_classes && meta?.crop_classes) {
    const soilIdx = encodeClass(meta.soil_classes, inputs.soil)
    const cropIdx = encodeClass(meta.crop_classes, inputs.crop)
    const features = [
      inputs.temperature,
      inputs.humidity,
      inputs.moisture,
      inputs.N,
      inputs.P,
      inputs.K,
      soilIdx,
      cropIdx,
    ]
    const onnx = await runClassifierOnnx(FERT_ONNX, FERT_META, features)
    if (onnx) {
      const acc = onnx.meta.accuracy
      return {
        fertilizer: onnx.className,
        reason: `RandomForest ONNX (${acc != null ? `${acc}% hold-out` : 'Colab'}) recommends ${onnx.className} for ${inputs.crop} on ${inputs.soil} soil (conf ${(onnx.confidence * 100).toFixed(0)}%). ${fertilizerBlurb(onnx.className)}`,
        source: 'model',
      }
    }
  }

  const snap = await loadSnapshot()
  const { N, P, K, crop } = inputs
  const thresholds =
    snap.crops[crop] ?? snap.crops.default ?? { N: 50, P: 35, K: 40 }

  if (N < thresholds.N) {
    const p = snap.products.low_N!
    return {
      fertilizer: p.fertilizer,
      reason: `${fillTemplate(p.template, crop, N, P, K, thresholds.N)} (lookup — ONNX unavailable)`,
      source: 'model',
    }
  }
  if (P < thresholds.P) {
    const p = snap.products.low_P!
    return {
      fertilizer: p.fertilizer,
      reason: `${fillTemplate(p.template, crop, N, P, K, thresholds.P)} (lookup — ONNX unavailable)`,
      source: 'model',
    }
  }
  if (K < thresholds.K) {
    const p = snap.products.low_K!
    return {
      fertilizer: p.fertilizer,
      reason: `${fillTemplate(p.template, crop, N, P, K, thresholds.K)} (lookup — ONNX unavailable)`,
      source: 'model',
    }
  }

  const p = snap.products.balanced!
  return {
    fertilizer: p.fertilizer,
    reason: `${fillTemplate(p.template, crop, N, P, K)} (lookup — ONNX unavailable)`,
    source: 'model',
  }
}

export const DEFAULT_FERTILIZER_INPUTS: FertilizerInputs = {
  crop: 'Maize',
  soil: 'Loamy',
  N: 38,
  P: 42,
  K: 45,
  temperature: 26,
  humidity: 65,
  moisture: 40,
}

export const FERTILIZER_SOIL_OPTIONS = [
  'Black',
  'Clayey',
  'Loamy',
  'Red',
  'Sandy',
] as const

export const FERTILIZER_CROP_OPTIONS = [
  'Barley',
  'Cotton',
  'Ground Nuts',
  'Maize',
  'Millets',
  'Oil seeds',
  'Paddy',
  'Pulses',
  'Sugarcane',
  'Tobacco',
  'Wheat',
] as const

const FALLBACK_SNAPSHOT: FertilizerSnapshot = {
  crops: { default: { N: 50, P: 35, K: 40 } },
  products: {
    low_N: {
      fertilizer: 'Urea (46% N)',
      template:
        'Nitrogen is low ({N} vs ~{target} target) for {crop} — apply urea-based fertilizer.',
    },
    low_P: {
      fertilizer: 'DAP (18-46-0)',
      template: 'Phosphorus is low ({P}) for {crop} — DAP supports root development.',
    },
    low_K: {
      fertilizer: 'MOP (0-0-60)',
      template: 'Potassium is low ({K}) for {crop} — MOP improves fruit quality.',
    },
    balanced: {
      fertilizer: 'NPK 20-20-0 (maintenance)',
      template: 'NPK levels look balanced for {crop}. Re-test soil after 4 weeks.',
    },
  },
}
