import type { YieldParams } from './constants'

export type ParamHealth = 'good' | 'warn' | 'bad'

/** Slider thumb color: green → amber → red for sub-optimal ranges */
export function getParamHealth(
  key: keyof YieldParams,
  value: number,
): ParamHealth {
  switch (key) {
    case 'moisture_pct':
      if (value <= 14) return 'good'
      if (value <= 20) return 'warn'
      return 'bad'
    case 'defect_rate_pct':
      if (value <= 5) return 'good'
      if (value <= 15) return 'warn'
      return 'bad'
    case 'ambient_temp_celsius': {
      const delta = Math.abs(value - 28)
      if (delta <= 4) return 'good'
      if (delta <= 8) return 'warn'
      return 'bad'
    }
    case 'machine_speed_rpm':
      if (value <= 700) return 'good'
      if (value <= 1000) return 'warn'
      return 'bad'
    case 'raw_material_grade':
      if (value >= 4) return 'good'
      if (value >= 2) return 'warn'
      return 'bad'
    case 'batch_weight_kg':
      if (value >= 30 && value <= 300) return 'good'
      if (value >= 10 && value <= 450) return 'warn'
      return 'bad'
    case 'processing_duration_min':
      if (value >= 45 && value <= 150) return 'good'
      if (value >= 20) return 'warn'
      return 'bad'
    default:
      return 'good'
  }
}

export const HEALTH_COLORS: Record<ParamHealth, string> = {
  good: 'var(--healthy)',
  warn: 'var(--warning)',
  bad: 'var(--danger)',
}

export function getBottleneckReasons(params: YieldParams): string[] {
  const reasons: string[] = []

  if (params.machine_speed_rpm > 900 && params.moisture_pct > 18) {
    reasons.push(
      `Machine speed (${params.machine_speed_rpm} RPM) exceeds safe throughput for moisture at ${params.moisture_pct}%.`,
    )
  }
  if (params.moisture_pct > 22) {
    reasons.push(
      `Moisture at ${params.moisture_pct}% is too high — drying required before processing.`,
    )
  }
  if (params.defect_rate_pct > 18) {
    reasons.push(
      `Defect rate at ${params.defect_rate_pct}% is limiting usable output — sort or reject upstream.`,
    )
  }
  if (params.raw_material_grade <= 2) {
    reasons.push(
      `Low raw material grade (${params.raw_material_grade}/5) caps achievable yield.`,
    )
  }
  if (Math.abs(params.ambient_temp_celsius - 28) > 10) {
    reasons.push(
      `Ambient temperature (${params.ambient_temp_celsius}°C) is outside optimal range (~28°C).`,
    )
  }

  return reasons
}

export function getBottleneckReason(params: YieldParams): string | null {
  return getBottleneckReasons(params)[0] ?? null
}

/** Concrete actions to clear bottlenecks / raise throughput (ops playbook) */
export function getOptimizationActions(params: YieldParams): string[] {
  const actions: string[] = []

  if (params.moisture_pct > 18) {
    actions.push(
      `Dry raw material to ≤14% moisture (now ${params.moisture_pct}%) before raising RPM.`,
    )
  }
  if (params.machine_speed_rpm > 900) {
    actions.push(
      `Lower machine speed to ≤700 RPM (now ${params.machine_speed_rpm}) for safe throughput.`,
    )
  }
  if (params.defect_rate_pct > 10) {
    actions.push(
      `Upstream sort / re-inspect — cut defect rate below 5% (now ${params.defect_rate_pct}%).`,
    )
  }
  if (params.raw_material_grade <= 3) {
    actions.push(
      `Prefer Grade A/B intake or blend up material grade (now ${params.raw_material_grade}/5).`,
    )
  }
  if (Math.abs(params.ambient_temp_celsius - 28) > 6) {
    actions.push(
      `Stabilize ambient near 28°C (now ${params.ambient_temp_celsius}°C).`,
    )
  }
  if (params.processing_duration_min < 45) {
    actions.push(
      `Allow longer processing window (≥45 min) — rushed cycles cut usable yield.`,
    )
  }
  if (actions.length === 0) {
    actions.push(
      'Line looks healthy — hold moisture low, grade high, defects low; raise batch size only after yield % is stable.',
    )
  }
  return actions
}

export function formatParamValue(key: keyof YieldParams, value: number): string {
  switch (key) {
    case 'batch_weight_kg':
      return `${value} kg`
    case 'ambient_temp_celsius':
      return `${value}°C`
    case 'processing_duration_min':
      return `${value} min`
    case 'machine_speed_rpm':
      return `${value} RPM`
    case 'moisture_pct':
    case 'defect_rate_pct':
      return `${value}%`
    case 'raw_material_grade':
      return `Grade ${value}`
    default:
      return String(value)
  }
}
