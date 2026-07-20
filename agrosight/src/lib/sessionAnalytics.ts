import type { InspectionRecord } from '@/store/useStore'
import type { DefectClass } from './constants'
import { DEFECT_CLASSES, DEFECT_TO_RATE, HITL_THRESHOLD } from './constants'

export interface SessionTimePoint {
  index: number
  time: string
  defectRate: number
  verdict: DefectClass
  crop: string
  confidence: number
}

export interface ClassSlice {
  name: string
  value: number
  fill: string
}

export interface SessionSummary {
  total: number
  passCount: number
  failCount: number
  hitlCount: number
  avgDefectRate: number
  avgConfidence: number
  passRate: number
}

const CLASS_COLORS: Record<DefectClass, string> = {
  HEALTHY: '#10b981',
  SURFACE_DEFECT: '#f59e0b',
  BLIGHT_MOLD: '#ef4444',
}

const CLASS_LABELS: Record<DefectClass, string> = {
  HEALTHY: 'Healthy',
  SURFACE_DEFECT: 'Surface Defect',
  BLIGHT_MOLD: 'Blight & Mold',
}

export function getClassColor(cls: DefectClass): string {
  return CLASS_COLORS[cls]
}

export function buildTimeSeries(history: InspectionRecord[]): SessionTimePoint[] {
  const ordered = [...history].reverse()
  return ordered.map((r, i) => ({
    index: i + 1,
    time: new Date(r.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    defectRate: DEFECT_TO_RATE[r.result.class],
    verdict: r.result.class,
    crop: r.crop,
    confidence: r.result.confidence,
  }))
}

export function buildClassDistribution(history: InspectionRecord[]): ClassSlice[] {
  const counts: Record<DefectClass, number> = {
    HEALTHY: 0,
    SURFACE_DEFECT: 0,
    BLIGHT_MOLD: 0,
  }
  for (const r of history) {
    counts[r.result.class] += 1
  }
  return DEFECT_CLASSES.map((cls) => ({
    name: CLASS_LABELS[cls],
    value: counts[cls],
    fill: CLASS_COLORS[cls],
  })).filter((s) => s.value > 0)
}

export function summarizeSession(history: InspectionRecord[]): SessionSummary {
  if (history.length === 0) {
    return {
      total: 0,
      passCount: 0,
      failCount: 0,
      hitlCount: 0,
      avgDefectRate: 0,
      avgConfidence: 0,
      passRate: 0,
    }
  }

  let passCount = 0
  let failCount = 0
  let hitlCount = 0
  let defectSum = 0
  let confSum = 0

  for (const r of history) {
    const rate = DEFECT_TO_RATE[r.result.class]
    defectSum += rate
    confSum += r.result.confidence
    if (r.result.confidence < HITL_THRESHOLD) hitlCount += 1
    if (r.result.class === 'HEALTHY' && r.result.confidence >= HITL_THRESHOLD) {
      passCount += 1
    } else {
      failCount += 1
    }
  }

  const total = history.length
  return {
    total,
    passCount,
    failCount,
    hitlCount,
    avgDefectRate: Math.round((defectSum / total) * 10) / 10,
    avgConfidence: Math.round((confSum / total) * 100),
    passRate: Math.round((passCount / total) * 100),
  }
}

export function exportSessionReport(
  history: InspectionRecord[],
  yieldPrediction?: { yield_pct: number; yield_kg: number } | null,
): void {
  const summary = summarizeSession(history)
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'AgroSight',
    session: summary,
    inspections: history.map((r) => ({
      id: r.id,
      timestamp: new Date(r.timestamp).toISOString(),
      crop: r.crop,
      verdict: r.result.class,
      confidence: Math.round(r.result.confidence * 1000) / 1000,
      defectRatePct: DEFECT_TO_RATE[r.result.class],
      mock: r.result.mock,
      probabilities: r.result.probabilities,
    })),
    lastYieldScenario: yieldPrediction ?? null,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `agrosight-session-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
