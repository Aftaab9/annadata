import type { FertilizerInputs, FertilizerResult } from './types'

interface FertilizerSnapshot {
  crops: Record<string, { N: number; P: number; K: number }>
  products: Record<
    string,
    { fertilizer: string; template: string }
  >
}

let snapshotPromise: Promise<FertilizerSnapshot> | null = null

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

/** Lookup on Kaggle Fertilizer thresholds (Phase 3 — no browser training) */
export async function recommendFertilizer(
  inputs: FertilizerInputs,
): Promise<FertilizerResult> {
  const snap = await loadSnapshot()
  const { N, P, K, crop } = inputs
  const thresholds =
    snap.crops[crop] ?? snap.crops.default ?? { N: 50, P: 35, K: 40 }

  if (N < thresholds.N) {
    const p = snap.products.low_N!
    return {
      fertilizer: p.fertilizer,
      reason: fillTemplate(p.template, crop, N, P, K, thresholds.N),
      source: 'model',
    }
  }
  if (P < thresholds.P) {
    const p = snap.products.low_P!
    return {
      fertilizer: p.fertilizer,
      reason: fillTemplate(p.template, crop, N, P, K, thresholds.P),
      source: 'model',
    }
  }
  if (K < thresholds.K) {
    const p = snap.products.low_K!
    return {
      fertilizer: p.fertilizer,
      reason: fillTemplate(p.template, crop, N, P, K, thresholds.K),
      source: 'model',
    }
  }

  const p = snap.products.balanced!
  return {
    fertilizer: p.fertilizer,
    reason: fillTemplate(p.template, crop, N, P, K),
    source: 'model',
  }
}

export const DEFAULT_FERTILIZER_INPUTS: FertilizerInputs = {
  crop: 'Tomato',
  N: 38,
  P: 42,
  K: 45,
}

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
