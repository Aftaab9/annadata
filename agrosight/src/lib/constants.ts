export type DefectClass = 'HEALTHY' | 'SURFACE_DEFECT' | 'BLIGHT_MOLD'

export type Language = 'en' | 'hi'

export interface CropSku {
  crop_key: string
  sku: string
  category: string
  icon: string
  label: string
}

export const DEFECT_CLASSES: DefectClass[] = [
  'HEALTHY',
  'SURFACE_DEFECT',
  'BLIGHT_MOLD',
]

export const DEFECT_LABELS: Record<DefectClass, string> = {
  HEALTHY: 'Healthy',
  SURFACE_DEFECT: 'Surface Defect',
  BLIGHT_MOLD: 'Blight & Mold',
}

/** Maps CV result → yield simulator defect_rate_pct */
export const DEFECT_TO_RATE: Record<DefectClass, number> = {
  HEALTHY: 2,
  SURFACE_DEFECT: 10,
  BLIGHT_MOLD: 25,
}

export const HITL_THRESHOLD = 0.7

export const DEFECT_ACTIONS: Record<DefectClass, string> = {
  HEALTHY: '✓ Batch passes quality check. Proceed to packaging.',
  SURFACE_DEFECT: '⚠ Minor defects detected. Flag for supervisor review.',
  BLIGHT_MOLD: '✕ Contamination risk. Reject and quarantine this batch.',
}

export const HITL_LOW_CONFIDENCE_MSG =
  'AI confidence is low. A human supervisor must inspect this batch.'

export const CROPS: CropSku[] = [
  { crop_key: 'Corn_(maize)', sku: 'MAIZE_GRAIN', category: 'Grains', icon: 'corn', label: 'Maize' },
  { crop_key: 'Soybean', sku: 'SOYBEAN_PULSE', category: 'Pulses', icon: 'soybean', label: 'Soybean' },
  { crop_key: 'Pepper,_bell', sku: 'PEPPER_SPICE', category: 'Spices', icon: 'pepper', label: 'Pepper' },
  { crop_key: 'Tomato', sku: 'TOMATO_VEG', category: 'Vegetables', icon: 'tomato', label: 'Tomato' },
  { crop_key: 'Potato', sku: 'POTATO_VEG', category: 'Vegetables', icon: 'potato', label: 'Potato' },
  { crop_key: 'Apple', sku: 'APPLE_FRUIT', category: 'Fruits', icon: 'apple', label: 'Apple' },
]

export const YIELD_PARAM_RANGES = {
  moisture_pct: { min: 8, max: 25, step: 1, label: 'Moisture %' },
  batch_weight_kg: { min: 10, max: 500, step: 10, label: 'Batch Weight (kg)' },
  ambient_temp_celsius: { min: 18, max: 42, step: 1, label: 'Ambient Temp (°C)' },
  processing_duration_min: { min: 15, max: 180, step: 5, label: 'Duration (min)' },
  machine_speed_rpm: { min: 200, max: 1200, step: 50, label: 'Machine Speed (RPM)' },
  raw_material_grade: { min: 1, max: 5, step: 1, label: 'Material Grade' },
  defect_rate_pct: { min: 0, max: 30, step: 1, label: 'Defect Rate %' },
} as const

export type YieldParams = {
  moisture_pct: number
  batch_weight_kg: number
  ambient_temp_celsius: number
  processing_duration_min: number
  machine_speed_rpm: number
  raw_material_grade: number
  defect_rate_pct: number
}

export const DEFAULT_YIELD_PARAMS: YieldParams = {
  moisture_pct: 10,
  batch_weight_kg: 50,
  ambient_temp_celsius: 28,
  processing_duration_min: 90,
  machine_speed_rpm: 400,
  raw_material_grade: 3,
  defect_rate_pct: 5,
}

export const HERO_STATS = [
  { value: 97.4, suffix: '%', label: 'CV Accuracy' },
  { value: 6, suffix: '', label: 'Crop SKUs' },
  { value: 2500, prefix: '₹', suffix: '/mo', label: 'Deployment Cost' },
] as const
