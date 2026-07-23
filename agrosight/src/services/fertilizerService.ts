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
    Urea: 'Urea is almost all nitrogen (46-0-0) — use when soil N is low / leaves look pale.',
    DAP: 'DAP is diammonium phosphate (~18-46-0) — use when soil phosphorus is low.',
    '20-20': '20-20 is an N–P blend (20% N, 20% P, 0% K) for early growth.',
    '28-28': '28-28 is a stronger N–P blend for leafy / vegetative push.',
    '17-17-17': '17-17-17 means equal parts N, P, and K (17% each) — balanced maintenance.',
    '14-35-14': '14-35-14 is phosphorus-heavy (good for flowering / fruit set).',
    '10-26-26': '10-26-26 means 10% N, 26% P, 26% K — P+K heavy for fruit quality / stress.',
  }
  return map[name] ?? 'Apply per local agronomist / soil-test guidance.'
}

/** Plain-language bag label for demo / faculty. */
export function fertilizerDisplayName(code: string): string {
  const map: Record<string, string> = {
    Urea: 'Urea (46-0-0) — nitrogen',
    DAP: 'DAP (18-46-0) — phosphorus',
    '20-20': 'NPK 20-20-0 — N+P starter',
    '28-28': 'NPK 28-28-0 — strong N+P',
    '17-17-17': 'NPK 17-17-17 — balanced',
    '14-35-14': 'NPK 14-35-14 — high phosphorus',
    '10-26-26': 'NPK 10-26-26 — high P+K',
  }
  return map[code] ?? code
}

export function fertilizerGradeHint(code: string): string {
  if (code === 'Urea') return 'Grade = % Nitrogen – Phosphorus – Potassium on the bag'
  if (code === 'DAP') return 'Grade ≈ 18-46-0 (N-P-K %)'
  if (/^\d/.test(code)) {
    const parts = code.split('-')
    if (parts.length === 2) return `Bag grade ${code}-0 → ${parts[0]}% N, ${parts[1]}% P, 0% K`
    if (parts.length === 3)
      return `Bag grade ${code} → ${parts[0]}% N, ${parts[1]}% P, ${parts[2]}% K`
  }
  return 'Numbers on the bag are % Nitrogen – Phosphorus – Potassium'
}

async function lookupFertilizer(inputs: FertilizerInputs): Promise<FertilizerResult> {
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

/** Prefer Colab RF ONNX; fall back to NPK threshold lookup. */
export async function recommendFertilizer(
  inputs: FertilizerInputs,
): Promise<FertilizerResult> {
  try {
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
        const ranked = onnx.probabilities
          .map((p, i) => ({ i, p }))
          .sort((a, b) => b.p - a.p)
        const top = ranked.filter((t) => t.p > 0.01).slice(0, 4)
        return {
          fertilizer: onnx.className,
          confidence: Math.round(onnx.confidence * 1000) / 1000,
          reason: `RandomForest ONNX (${acc != null ? `${acc}% hold-out` : 'Colab'}) votes ${(onnx.confidence * 100).toFixed(0)}% for ${onnx.className} given ${inputs.crop} on ${inputs.soil} soil + these NPK/climate values. ${fertilizerBlurb(onnx.className)}`,
          source: 'model',
          alternatives: top.slice(1).map((t) => ({
            fertilizer: onnx.meta.classes[t.i] ?? String(t.i),
            confidence: Math.round(t.p * 1000) / 1000,
          })),
        }
      }
    }
  } catch (e) {
    console.warn('[fertilizerService] ONNX path failed, using lookup:', e)
  }

  return lookupFertilizer(inputs)
}

export const DEFAULT_FERTILIZER_INPUTS: FertilizerInputs = {
  crop: 'Maize',
  soil: 'Loamy',
  N: 25,
  P: 20,
  K: 18,
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

/** Annadata product SKUs only — matches fertilizer.onnx crop_classes */
export const FERTILIZER_CROP_OPTIONS = [
  'Apple',
  'Maize',
  'Pepper',
  'Potato',
  'Soybean',
  'Tomato',
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
