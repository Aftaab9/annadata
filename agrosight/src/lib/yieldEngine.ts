import type { YieldParams } from './constants'

export interface YieldLookupRow extends YieldParams {
  yield_pct: number
  yield_kg: number
  bottleneck: boolean
  efficiency_score: number
  throughput_kg_per_hr: number
}

export interface YieldPrediction {
  yield_pct: number
  yield_kg: number
  bottleneck: boolean
  efficiency_score: number
  /** Usable output per processing hour (kg/h) — drops under bottleneck */
  throughput_kg_per_hr: number
  matched: YieldLookupRow
}

/** Coefficients from `models/agrosight_yield_model.pkl` (LinearRegression on synthetic data) */
const INTERCEPT = 84.79669950438449

const COEF: Record<keyof YieldParams, number> = {
  moisture_pct: -0.7954108704385198,
  batch_weight_kg: -0.0001270726819707739,
  ambient_temp_celsius: -0.0029899684464159883,
  processing_duration_min: 0.009686455983915206,
  machine_speed_rpm: 0.00005986283462778609,
  raw_material_grade: 2.466090846841303,
  defect_rate_pct: -0.39794951281351293,
}

/** Absolute |coef| — which sliders actually move yield (for UI hints) */
export const YIELD_PARAM_IMPACT: Record<
  keyof YieldParams,
  'high' | 'medium' | 'low'
> = {
  moisture_pct: 'high',
  raw_material_grade: 'high',
  defect_rate_pct: 'high',
  processing_duration_min: 'medium',
  ambient_temp_celsius: 'low',
  machine_speed_rpm: 'low',
  batch_weight_kg: 'low',
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function evaluateRegression(params: YieldParams): number {
  let y = INTERCEPT
  for (const key of Object.keys(COEF) as (keyof YieldParams)[]) {
    y += COEF[key] * params[key]
  }
  return Math.min(98, Math.max(40, y))
}

/** Bottleneck = unsafe / lossy operating region (ops heuristic, not from the pkl) */
export function detectBottleneck(params: YieldParams): boolean {
  return (
    (params.machine_speed_rpm > 900 && params.moisture_pct > 18) ||
    params.moisture_pct > 22 ||
    params.defect_rate_pct > 18 ||
    params.raw_material_grade <= 2 ||
    Math.abs(params.ambient_temp_celsius - 28) > 10
  )
}

function toMatchedRow(
  params: YieldParams,
  prediction: Omit<YieldPrediction, 'matched'>,
): YieldLookupRow {
  return { ...params, ...prediction }
}

/** On-device yield regression — all 7 sliders (incl. CV defect rate) affect output */
export async function predictYield(params: YieldParams): Promise<YieldPrediction> {
  const yield_pct = round2(evaluateRegression(params))
  const bottleneck = detectBottleneck(params)
  const efficiency_score = round2(
    Math.min(100, yield_pct * (1 - params.defect_rate_pct / 100)),
  )
  const yield_kg = round2((params.batch_weight_kg * yield_pct) / 100)

  const hours = Math.max(params.processing_duration_min, 1) / 60
  let throughput_kg_per_hr = round2(yield_kg / hours)
  // Speed above safe band wastes capacity when moisture is high
  if (params.machine_speed_rpm > 900 && params.moisture_pct > 18) {
    throughput_kg_per_hr = round2(throughput_kg_per_hr * 0.72)
  } else if (bottleneck) {
    throughput_kg_per_hr = round2(throughput_kg_per_hr * 0.88)
  }

  const core = {
    yield_pct,
    yield_kg,
    bottleneck,
    efficiency_score,
    throughput_kg_per_hr,
  }
  return { ...core, matched: toMatchedRow(params, core) }
}

/** Sync helper for presets / tests */
export function predictYieldSync(params: YieldParams): YieldPrediction {
  const yield_pct = round2(evaluateRegression(params))
  const bottleneck = detectBottleneck(params)
  const efficiency_score = round2(
    Math.min(100, yield_pct * (1 - params.defect_rate_pct / 100)),
  )
  const yield_kg = round2((params.batch_weight_kg * yield_pct) / 100)
  const hours = Math.max(params.processing_duration_min, 1) / 60
  let throughput_kg_per_hr = round2(yield_kg / hours)
  if (params.machine_speed_rpm > 900 && params.moisture_pct > 18) {
    throughput_kg_per_hr = round2(throughput_kg_per_hr * 0.72)
  } else if (bottleneck) {
    throughput_kg_per_hr = round2(throughput_kg_per_hr * 0.88)
  }
  const core = {
    yield_pct,
    yield_kg,
    bottleneck,
    efficiency_score,
    throughput_kg_per_hr,
  }
  return { ...core, matched: toMatchedRow(params, core) }
}

/** @deprecated Lookup table had fixed defect_rate=5 — kept for tests only */
export async function loadYieldLookup(): Promise<YieldLookupRow[]> {
  const res = await fetch('/data/yield_lookup.json')
  if (!res.ok) throw new Error('Failed to load yield_lookup.json')
  return (await res.json()) as YieldLookupRow[]
}
