import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClassificationResult } from '@/lib/inference'
import type { CropSku, Language, YieldParams } from '@/lib/constants'
import { CROPS, DEFAULT_YIELD_PARAMS } from '@/lib/constants'
import type { YieldPrediction } from '@/lib/yieldEngine'
import {
  DEFAULT_LOCATION,
  type CropRecInputs,
  type FertilizerInputs,
  type LocationSelection,
} from '@/services/types'
import { DEFAULT_CROP_REC_INPUTS } from '@/services/cropRecService'
import { DEFAULT_FERTILIZER_INPUTS } from '@/services/fertilizerService'
import type { GradeCardData } from '@/lib/gradeCard'

export interface InspectionRecord {
  id: string
  timestamp: number
  crop: string
  result: ClassificationResult
  thumbnail?: string
}

export interface YieldScenarioPoint {
  id: string
  timestamp: number
  yield_pct: number
  efficiency_score: number
  throughput_kg_per_hr: number
  label?: string
}

interface AppState {
  language: Language
  setLanguage: (lang: Language) => void

  selectedCrop: CropSku
  setSelectedCrop: (crop: CropSku) => void

  location: LocationSelection
  setLocation: (loc: Partial<LocationSelection>) => void

  priceModal: number
  setPriceModal: (n: number) => void

  cvResult: ClassificationResult | null
  setCvResult: (result: ClassificationResult | null) => void

  defectRateAutoFilled: boolean
  setDefectRateAutoFilled: (v: boolean) => void

  yieldParams: YieldParams
  setYieldParams: (params: Partial<YieldParams>) => void
  resetYieldParams: () => void

  cropRecInputs: CropRecInputs
  setCropRecInputs: (params: Partial<CropRecInputs>) => void

  fertilizerInputs: FertilizerInputs
  setFertilizerInputs: (params: Partial<FertilizerInputs>) => void

  inspectionHistory: InspectionRecord[]
  addInspection: (record: InspectionRecord) => void
  clearHistory: () => void

  assistantOpen: boolean
  setAssistantOpen: (open: boolean) => void

  assistantPrompt: string | null
  setAssistantPrompt: (prompt: string | null) => void

  yieldPrediction: YieldPrediction | null
  setYieldPrediction: (p: YieldPrediction | null) => void

  yieldScenarioHistory: YieldScenarioPoint[]
  pushYieldScenario: (point: YieldScenarioPoint) => void
  clearYieldScenarios: () => void

  gradeCard: GradeCardData | null
  setGradeCard: (card: GradeCardData | null) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),

      selectedCrop: CROPS[0]!,
      setSelectedCrop: (selectedCrop) => set({ selectedCrop }),

      location: { ...DEFAULT_LOCATION },
      setLocation: (loc) =>
        set((s) => ({ location: { ...s.location, ...loc } })),

      priceModal: 1950,
      setPriceModal: (priceModal) => set({ priceModal }),

      cvResult: null,
      setCvResult: (cvResult) => set({ cvResult }),

      defectRateAutoFilled: false,
      setDefectRateAutoFilled: (defectRateAutoFilled) => set({ defectRateAutoFilled }),

      yieldParams: { ...DEFAULT_YIELD_PARAMS },
      setYieldParams: (params) =>
        set((s) => ({ yieldParams: { ...s.yieldParams, ...params } })),
      resetYieldParams: () =>
        set({ yieldParams: { ...DEFAULT_YIELD_PARAMS }, defectRateAutoFilled: false }),

      cropRecInputs: { ...DEFAULT_CROP_REC_INPUTS },
      setCropRecInputs: (params) =>
        set((s) => ({ cropRecInputs: { ...s.cropRecInputs, ...params } })),

      fertilizerInputs: { ...DEFAULT_FERTILIZER_INPUTS },
      setFertilizerInputs: (params) =>
        set((s) => ({
          fertilizerInputs: { ...s.fertilizerInputs, ...params },
        })),

      inspectionHistory: [],
      addInspection: (record) =>
        set((s) => ({
          inspectionHistory: [record, ...s.inspectionHistory].slice(0, 50),
        })),
      clearHistory: () => set({ inspectionHistory: [] }),

      assistantOpen: false,
      setAssistantOpen: (assistantOpen) => set({ assistantOpen }),

      assistantPrompt: null,
      setAssistantPrompt: (assistantPrompt) => set({ assistantPrompt }),

      yieldPrediction: null,
      setYieldPrediction: (yieldPrediction) => set({ yieldPrediction }),

      yieldScenarioHistory: [],
      pushYieldScenario: (point) =>
        set((s) => {
          const last = s.yieldScenarioHistory[0]
          // Dedupe near-identical consecutive points (slider debounce)
          if (
            last &&
            Math.abs(last.yield_pct - point.yield_pct) < 0.05 &&
            Math.abs(last.throughput_kg_per_hr - point.throughput_kg_per_hr) < 0.05
          ) {
            return s
          }
          return {
            yieldScenarioHistory: [point, ...s.yieldScenarioHistory].slice(0, 40),
          }
        }),
      clearYieldScenarios: () => set({ yieldScenarioHistory: [] }),

      gradeCard: null,
      setGradeCard: (gradeCard) => set({ gradeCard }),
    }),
    {
      name: 'agrosight-store',
      partialize: (s) => ({
        language: s.language,
        inspectionHistory: s.inspectionHistory,
        yieldScenarioHistory: s.yieldScenarioHistory,
        location: s.location,
      }),
    },
  ),
)
