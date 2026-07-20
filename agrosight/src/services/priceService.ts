import { getCached, setCached } from '@/lib/cache'
import type {
  MandiPriceRecord,
  PriceQuery,
  PriceResult,
  PriceTrendPoint,
  PriceTrendSeries,
} from './types'

const AGMARKNET_RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

function cacheKey(q: PriceQuery): string {
  return `prices:${q.state}:${q.commodity}:${q.district ?? 'all'}`
}

function trendCacheKey(
  state: string,
  commodity: string,
  modal: number,
  days: 7 | 30,
): string {
  return `trends:${state}:${commodity}:${modal}:${days}`
}

function hashSeed(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 100000
  }
  return h
}

function pseudoRand(seed: number, n: number): number {
  return ((seed * 9301 + 49297 + n * 17) % 233280) / 233280
}

/** Deterministic 7/30-day trend ending at today's modal (fallback until price LSTM) */
export function buildPriceTrends(
  currentModal: number,
  commodity: string,
  state: string,
  days: 7 | 30,
): PriceTrendSeries {
  const ck = trendCacheKey(state, commodity, currentModal, days)
  const cached = getCached<PriceTrendSeries>(ck, CACHE_TTL_MS)
  if (cached) return cached

  const seed = hashSeed(`${state}:${commodity}:${currentModal}:${days}`)
  const points: PriceTrendPoint[] = []
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  let walk = currentModal
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (i > 0) {
      const step = (pseudoRand(seed, i + 100) - 0.5) * currentModal * 0.035
      walk = Math.max(200, Math.round(walk - step))
    } else {
      walk = currentModal
    }
    points.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      modal_price: walk,
    })
  }

  const first = points[0]?.modal_price ?? currentModal
  const change_pct = Math.round(((currentModal - first) / first) * 1000) / 10

  const series: PriceTrendSeries = { days, points, change_pct }
  setCached(ck, series)
  return series
}

export function priceRange(records: MandiPriceRecord[]): {
  min: number
  max: number
} {
  if (records.length === 0) return { min: 0, max: 4000 }
  const mins = records.map((r) => r.min_price).filter(Boolean)
  const maxs = records.map((r) => r.max_price).filter(Boolean)
  return {
    min: Math.min(...mins, ...records.map((r) => r.modal_price)),
    max: Math.max(...maxs, ...records.map((r) => r.modal_price)),
  }
}

export function gradeAdjustedModal(
  modalPrice: number,
  grade: 'A' | 'B' | 'C',
): number {
  // Produce Grade Card premiums: A +10% / B modal / C −20%
  const premium = grade === 'A' ? 1.1 : grade === 'B' ? 1.0 : 0.8
  return Math.round(modalPrice * premium)
}

function apiKey(): string | undefined {
  return import.meta.env.VITE_DATA_GOV_API_KEY
}

async function fetchSnapshot(): Promise<MandiPriceRecord[]> {
  const res = await fetch('/data/price_snapshot.json')
  if (!res.ok) throw new Error('price snapshot missing')
  const json = (await res.json()) as { records: MandiPriceRecord[] }
  return json.records
}

function filterRecords(
  records: MandiPriceRecord[],
  q: PriceQuery,
): MandiPriceRecord[] {
  return records.filter(
    (r) =>
      r.state.toLowerCase() === q.state.toLowerCase() &&
      r.commodity.toLowerCase() === q.commodity.toLowerCase() &&
      (!q.district || r.district.toLowerCase() === q.district.toLowerCase()),
  )
}

async function fetchLive(q: PriceQuery): Promise<MandiPriceRecord[]> {
  const key = apiKey()
  if (!key) throw new Error('no API key')

  const params = new URLSearchParams({
    'api-key': key,
    format: 'json',
    limit: String(q.limit ?? 100),
    'filters[state]': q.state,
    'filters[commodity]': q.commodity,
  })
  if (q.district) params.set('filters[district]', q.district)

  const url = `https://api.data.gov.in/resource/${AGMARKNET_RESOURCE}?${params}`
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
  if (!res.ok) throw new Error(`Agmarknet HTTP ${res.status}`)

  const json = (await res.json()) as {
    records?: Record<string, string>[]
  }

  return (json.records ?? []).map((r) => ({
    state: r.state ?? q.state,
    district: r.district ?? '',
    market: r.market ?? '',
    commodity: r.commodity ?? q.commodity,
    variety: r.variety ?? '',
    grade: r.grade ?? 'FAQ',
    arrival_date: r.arrival_date ?? '',
    min_price: Number(r.min_price) || 0,
    max_price: Number(r.max_price) || 0,
    modal_price: Number(r.modal_price) || 0,
  }))
}

export async function getMandiPrices(q: PriceQuery): Promise<PriceResult> {
  const ck = cacheKey(q)
  const cached = getCached<PriceResult>(ck, CACHE_TTL_MS)
  if (cached) return { ...cached, source: 'cache' }

  try {
    const live = await fetchLive(q)
    if (live.length > 0) {
      const modal =
        live.reduce((s, r) => s + r.modal_price, 0) / live.length
      const result: PriceResult = {
        records: live,
        modal_price: Math.round(modal),
        source: 'live',
        fetched_at: new Date().toISOString(),
      }
      setCached(ck, result)
      return result
    }
  } catch (err) {
    console.warn('[priceService] live fetch failed, using snapshot:', err)
  }

  const snapshot = await fetchSnapshot()
  const filtered = filterRecords(snapshot, q)
  const records = filtered.length > 0 ? filtered : snapshot.slice(0, 5)
  const modal =
    records.reduce((s, r) => s + r.modal_price, 0) / (records.length || 1)

  return {
    records,
    modal_price: Math.round(modal),
    source: 'snapshot',
    fetched_at: new Date().toISOString(),
  }
}

export function compareMandis(records: MandiPriceRecord[]): MandiPriceRecord[] {
  return [...records].sort((a, b) => b.modal_price - a.modal_price)
}

export function pricePerKg(quintalPrice: number): number {
  return Math.round((quintalPrice / 100) * 100) / 100
}
