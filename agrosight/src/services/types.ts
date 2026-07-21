export interface PriceTrendPoint {
  date: string
  label: string
  modal_price: number
}

export interface PriceTrendSeries {
  days: 7 | 30
  points: PriceTrendPoint[]
  change_pct: number
}

export interface MandiPriceRecord {
  state: string
  district: string
  market: string
  commodity: string
  variety: string
  grade: string
  arrival_date: string
  min_price: number
  max_price: number
  modal_price: number
}

export interface PriceQuery {
  state: string
  commodity: string
  district?: string
  limit?: number
}

export interface PriceResult {
  records: MandiPriceRecord[]
  modal_price: number
  source: 'live' | 'cache' | 'snapshot'
  fetched_at: string
}

export interface CropRecInputs {
  N: number
  P: number
  K: number
  temperature: number
  humidity: number
  ph: number
  rainfall: number
}

export interface CropRecResult {
  crop: string
  label: string
  confidence: number
  source: 'mock' | 'model'
  reason: string
  alternatives?: { crop: string; label: string; confidence: number }[]
}

export interface FertilizerInputs {
  crop: string
  soil: string
  N: number
  P: number
  K: number
  temperature: number
  humidity: number
  moisture: number
}

export interface FertilizerResult {
  fertilizer: string
  reason: string
  source: 'mock' | 'model'
}

export interface WeatherDay {
  date: string
  temp_max: number
  temp_min: number
  precipitation_mm: number
  weather_code: number
}

export interface WeatherResult {
  days: WeatherDay[]
  harvest_advice: string
  source: 'live' | 'snapshot'
}

export interface ForecastSignal {
  signal: 'sell_now' | 'hold' | 'neutral'
  explanation: string
  predicted_change_pct: number
}

export type MarketGrade = 'A' | 'B' | 'C'

export interface MarketListing {
  id: string
  farmer_name: string
  crop: string
  grade: MarketGrade
  quantity_quintals: number
  district: string
  state: string
  price_per_quintal: number
  mandi_modal?: number
  grade_card_id?: string
  contact?: string
  interests?: number
  created_at: number
}

export interface MarketFilters {
  crop?: string
  grade?: MarketGrade | 'all'
  state?: string
  district?: string
}

export interface FairPriceBreakdown {
  mandi_modal: number
  grade: MarketGrade
  premium_pct: number
  fair_price: number
  explanation: string
}

export interface CollectivePool {
  crop: string
  grade: MarketGrade
  total_quintals: number
  regions: string[]
  listing_count: number
  threshold: number
  progress_pct: number
  bulk_notified: boolean
}

export type MarketBackend = 'localStorage' | 'supabase'

export interface LocationSelection {
  state: string
  district: string
  commodity: string
}

export const DEFAULT_LOCATION: LocationSelection = {
  state: 'Maharashtra',
  district: 'Pune',
  commodity: 'Tomato',
}

/** Approximate coords for harvest weather advisory */
export const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  Pune: { lat: 18.52, lon: 73.86 },
  Mumbai: { lat: 19.08, lon: 72.88 },
  Nashik: { lat: 19.99, lon: 73.79 },
  Nagpur: { lat: 21.15, lon: 79.09 },
  Solapur: { lat: 17.68, lon: 75.92 },
  Bengaluru: { lat: 12.97, lon: 77.59 },
  Hubballi: { lat: 15.36, lon: 75.12 },
  Mysuru: { lat: 12.3, lon: 76.65 },
  Belagavi: { lat: 15.85, lon: 74.5 },
  Ahmedabad: { lat: 23.02, lon: 72.57 },
  Surat: { lat: 21.17, lon: 72.83 },
  Rajkot: { lat: 22.3, lon: 70.8 },
  Vadodara: { lat: 22.31, lon: 73.18 },
  Ludhiana: { lat: 30.9, lon: 75.85 },
  Amritsar: { lat: 31.63, lon: 74.87 },
  Jalandhar: { lat: 31.33, lon: 75.58 },
  Patiala: { lat: 30.34, lon: 76.39 },
  Lucknow: { lat: 26.85, lon: 80.95 },
  Kanpur: { lat: 26.45, lon: 80.33 },
  Agra: { lat: 27.18, lon: 78.01 },
  Varanasi: { lat: 25.32, lon: 82.97 },
}

export const DISTRICTS_BY_STATE: Record<string, string[]> = {
  Maharashtra: ['Pune', 'Mumbai', 'Nashik', 'Nagpur', 'Solapur'],
  Karnataka: ['Bengaluru', 'Hubballi', 'Mysuru', 'Belagavi'],
  Gujarat: ['Ahmedabad', 'Surat', 'Rajkot', 'Vadodara'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi'],
}

export const INDIAN_STATES = [
  'Maharashtra',
  'Karnataka',
  'Gujarat',
  'Punjab',
  'Uttar Pradesh',
] as const

export const MANDI_COMMODITIES = [
  'Tomato',
  'Potato',
  'Onion',
  'Maize',
  'Soybean',
  'Wheat',
] as const
