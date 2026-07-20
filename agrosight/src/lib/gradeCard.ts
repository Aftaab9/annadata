import type { ClassificationResult } from '@/lib/inference'
import type { CropSku, DefectClass } from '@/lib/constants'
import { DEFECT_LABELS, DEFECT_TO_RATE } from '@/lib/constants'
import type { MarketGrade } from '@/services/types'

export interface GradeCardData {
  id: string
  crop: string
  sku: string
  category: string
  defectClass: DefectClass | string
  defectLabel: string
  defectRatePct: number
  grade: MarketGrade
  stars: number
  confidence: number
  confidencePct: number
  issuedAt: string
  verifyUrl: string
  hitlRequired: boolean
  mock: boolean
  /** leaf = disease advice; produce = market grade from freshness model */
  sourceMode: 'leaf' | 'produce'
}

export function defectToMarketGrade(cls: DefectClass): MarketGrade {
  if (cls === 'HEALTHY') return 'A'
  if (cls === 'SURFACE_DEFECT') return 'B'
  return 'C'
}

/** 1–5 stars from quality class + model confidence */
export function qualityStars(result: ClassificationResult): number {
  const base = { HEALTHY: 4, SURFACE_DEFECT: 2, BLIGHT_MOLD: 1 }[result.class]
  const boost =
    result.confidence >= 0.92 ? 1 : result.confidence >= 0.75 ? 0 : -1
  return Math.min(5, Math.max(1, base + boost))
}

export function buildGradeCard(
  result: ClassificationResult,
  crop: CropSku,
  inspectionId: string,
  issuedAt = new Date().toISOString(),
): GradeCardData {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const confidencePct = Math.round(result.confidence * 100)

  return {
    id: inspectionId,
    crop: crop.label,
    sku: crop.sku,
    category: crop.category,
    defectClass: result.class,
    defectLabel: DEFECT_LABELS[result.class],
    defectRatePct: DEFECT_TO_RATE[result.class],
    grade: defectToMarketGrade(result.class),
    stars: qualityStars(result),
    confidence: result.confidence,
    confidencePct,
    issuedAt,
    verifyUrl: `${origin}/inspect?verify=${inspectionId}`,
    hitlRequired: result.confidence < 0.7,
    mock: result.mock,
    sourceMode: 'leaf',
  }
}

export function buildProduceGradeCard(
  result: {
    class: string
    confidence: number
    grade: MarketGrade
    defectRatePct: number
    mock: boolean
  },
  crop: CropSku,
  inspectionId: string,
  label: string,
  issuedAt = new Date().toISOString(),
): GradeCardData {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const confidencePct = Math.round(result.confidence * 100)
  const baseStars = { A: 5, B: 3, C: 1 }[result.grade]
  const boost = result.confidence >= 0.85 ? 0 : -1

  return {
    id: inspectionId,
    crop: crop.label,
    sku: crop.sku,
    category: crop.category,
    defectClass: result.class,
    defectLabel: label,
    defectRatePct: result.defectRatePct,
    grade: result.grade,
    stars: Math.min(5, Math.max(1, baseStars + boost)),
    confidence: result.confidence,
    confidencePct,
    issuedAt,
    verifyUrl: `${origin}/inspect?verify=${inspectionId}`,
    hitlRequired: result.confidence < 0.7,
    mock: result.mock,
    sourceMode: 'produce',
  }
}

export function gradeCardPayload(card: GradeCardData): string {
  return JSON.stringify({
    v: 1,
    id: card.id,
    crop: card.crop,
    grade: card.grade,
    defect: card.defectLabel,
    defect_pct: card.defectRatePct,
    confidence: card.confidencePct,
    issued: card.issuedAt,
    verify: card.verifyUrl,
  })
}

export function spokenVerdict(
  card: GradeCardData,
  language: 'en' | 'hi',
): string {
  if (language === 'hi') {
    if (card.hitlRequired) {
      return `${card.crop} बैच: ${card.defectLabel}. विश्वास ${card.confidencePct} प्रतिशत. पर्यवेक्षक समीक्षा आवश्यक.`
    }
    return `${card.crop} बैच ग्रेड ${card.grade}: ${card.defectLabel}, ${card.confidencePct} प्रतिशत विश्वास.`
  }
  if (card.hitlRequired) {
    return `${card.crop} batch: ${card.defectLabel}. Confidence ${card.confidencePct} percent. Supervisor review required.`
  }
  return `${card.crop} batch graded ${card.grade}: ${card.defectLabel}, ${card.confidencePct} percent confidence.`
}
