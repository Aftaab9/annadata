import { getSupabase, getSupabaseEnv } from '@/lib/supabase'
import type {
  CollectivePool,
  FairPriceBreakdown,
  MarketBackend,
  MarketFilters,
  MarketGrade,
  MarketListing,
} from './types'

const STORAGE_KEY = 'agrosight-market-listings'
const INTEREST_KEY = 'agrosight-market-interests'
export const BULK_THRESHOLD_Q = 500

type ListingRow = {
  id: string
  farmer_name: string
  crop: string
  grade: string
  quantity_quintals: number
  district: string
  state: string
  price_per_quintal: number
  mandi_modal: number | null
  grade_card_id: string | null
  contact: string | null
  interests: number | null
  created_at: string
}

export function getMarketBackend(): MarketBackend {
  return getSupabaseEnv().configured ? 'supabase' : 'localStorage'
}

function rowToListing(row: ListingRow): MarketListing {
  return {
    id: row.id,
    farmer_name: row.farmer_name,
    crop: row.crop,
    grade: row.grade as MarketGrade,
    quantity_quintals: Number(row.quantity_quintals),
    district: row.district,
    state: row.state,
    price_per_quintal: Number(row.price_per_quintal),
    mandi_modal: row.mandi_modal != null ? Number(row.mandi_modal) : undefined,
    grade_card_id: row.grade_card_id ?? undefined,
    contact: row.contact ?? undefined,
    interests: row.interests ?? 0,
    created_at: new Date(row.created_at).getTime(),
  }
}

function readAll(): MarketListing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MarketListing[]) : []
  } catch {
    return []
  }
}

function writeAll(listings: MarketListing[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings))
}

const SEED: MarketListing[] = [
  {
    id: 'seed-1',
    farmer_name: 'Ramesh Patil',
    crop: 'Tomato',
    grade: 'A',
    quantity_quintals: 40,
    district: 'Nashik',
    state: 'Maharashtra',
    price_per_quintal: 2145,
    mandi_modal: 1950,
    grade_card_id: 'gc-demo-tomato-a',
    contact: 'ramesh@annadata.demo',
    interests: 3,
    created_at: Date.now() - 86400000,
  },
  {
    id: 'seed-2',
    farmer_name: 'Sunita Devi',
    crop: 'Maize',
    grade: 'B',
    quantity_quintals: 120,
    district: 'Pune',
    state: 'Maharashtra',
    price_per_quintal: 1950,
    mandi_modal: 1950,
    grade_card_id: 'gc-demo-maize-b',
    contact: 'sunita@annadata.demo',
    interests: 1,
    created_at: Date.now() - 172800000,
  },
  {
    id: 'seed-3',
    farmer_name: 'FPC Solapur Collective',
    crop: 'Onion',
    grade: 'A',
    quantity_quintals: 280,
    district: 'Solapur',
    state: 'Maharashtra',
    price_per_quintal: 2090,
    mandi_modal: 1900,
    grade_card_id: 'gc-demo-onion-a',
    contact: 'fpc@annadata.demo',
    interests: 5,
    created_at: Date.now() - 43200000,
  },
  {
    id: 'seed-4',
    farmer_name: 'Kiran Jadhav',
    crop: 'Potato',
    grade: 'C',
    quantity_quintals: 60,
    district: 'Pune',
    state: 'Maharashtra',
    price_per_quintal: 920,
    mandi_modal: 1150,
    contact: 'kiran@annadata.demo',
    interests: 0,
    created_at: Date.now() - 259200000,
  },
  {
    id: 'seed-5',
    farmer_name: 'Lakshmi Farms',
    crop: 'Tomato',
    grade: 'B',
    quantity_quintals: 90,
    district: 'Bengaluru',
    state: 'Karnataka',
    price_per_quintal: 2050,
    mandi_modal: 2050,
    grade_card_id: 'gc-demo-tomato-b',
    contact: 'lakshmi@annadata.demo',
    interests: 2,
    created_at: Date.now() - 7200000,
  },
]

function ensureSeed(): void {
  if (readAll().length === 0) writeAll(SEED)
}

/** Sync local-only list (fallback / offline). Prefer listMarketingsAsync. */
export function listMarketings(): MarketListing[] {
  ensureSeed()
  return readAll().sort((a, b) => b.created_at - a.created_at)
}

export async function listMarketingsAsync(): Promise<{
  listings: MarketListing[]
  backend: MarketBackend
  error?: string
}> {
  const sb = getSupabase()
  if (!sb) {
    return { listings: listMarketings(), backend: 'localStorage' }
  }

  try {
    const { data, error } = await sb
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    const listings = (data as ListingRow[] | null)?.map(rowToListing) ?? []
    return { listings, backend: 'supabase' }
  } catch (e) {
    console.warn('[market] Supabase list failed → localStorage', e)
    return {
      listings: listMarketings(),
      backend: 'localStorage',
      error: e instanceof Error ? e.message : 'Supabase unavailable',
    }
  }
}

export function filterListings(
  listings: MarketListing[],
  filters: MarketFilters,
): MarketListing[] {
  return listings.filter((l) => {
    if (filters.crop && filters.crop !== 'all' && l.crop !== filters.crop) {
      return false
    }
    if (
      filters.grade &&
      filters.grade !== 'all' &&
      l.grade !== filters.grade
    ) {
      return false
    }
    if (filters.state && filters.state !== 'all' && l.state !== filters.state) {
      return false
    }
    if (
      filters.district &&
      filters.district !== 'all' &&
      l.district !== filters.district
    ) {
      return false
    }
    return true
  })
}

export function publishListing(
  listing: Omit<MarketListing, 'id' | 'created_at' | 'interests'>,
): MarketListing {
  ensureSeed()
  const entry: MarketListing = {
    ...listing,
    interests: 0,
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: Date.now(),
  }
  writeAll([entry, ...readAll()])
  return entry
}

export async function publishListingAsync(
  listing: Omit<MarketListing, 'id' | 'created_at' | 'interests'>,
  gradeCardJson?: Record<string, unknown> | null,
): Promise<{ listing: MarketListing; backend: MarketBackend; error?: string }> {
  const sb = getSupabase()
  if (!sb) {
    return { listing: publishListing(listing), backend: 'localStorage' }
  }

  try {
    const { data, error } = await sb
      .from('listings')
      .insert({
        farmer_name: listing.farmer_name,
        crop: listing.crop,
        grade: listing.grade,
        quantity_quintals: listing.quantity_quintals,
        district: listing.district,
        state: listing.state,
        price_per_quintal: listing.price_per_quintal,
        mandi_modal: listing.mandi_modal ?? null,
        grade_card_id: listing.grade_card_id ?? null,
        grade_card_json: gradeCardJson ?? null,
        contact: listing.contact ?? null,
        interests: 0,
        farmer_id: 'anon-demo',
      })
      .select('*')
      .single()

    if (error) throw error
    return { listing: rowToListing(data as ListingRow), backend: 'supabase' }
  } catch (e) {
    console.warn('[market] Supabase publish failed → localStorage', e)
    return {
      listing: publishListing(listing),
      backend: 'localStorage',
      error: e instanceof Error ? e.message : 'Supabase publish failed',
    }
  }
}

export function removeListing(id: string): void {
  writeAll(readAll().filter((l) => l.id !== id))
}

export function expressInterest(listingId: string): MarketListing | null {
  const all = readAll()
  const idx = all.findIndex((l) => l.id === listingId)
  if (idx < 0) return null

  const myInterests = getMyInterests()
  if (myInterests.includes(listingId)) return all[idx]!

  const updated: MarketListing = {
    ...all[idx]!,
    interests: (all[idx]!.interests ?? 0) + 1,
  }
  all[idx] = updated
  writeAll(all)
  localStorage.setItem(
    INTEREST_KEY,
    JSON.stringify([...myInterests, listingId]),
  )
  return updated
}

export async function expressInterestAsync(
  listingId: string,
): Promise<{ listing: MarketListing | null; backend: MarketBackend }> {
  const myInterests = getMyInterests()
  if (myInterests.includes(listingId)) {
    const listings = await listMarketingsAsync()
    return {
      listing: listings.listings.find((l) => l.id === listingId) ?? null,
      backend: listings.backend,
    }
  }

  const sb = getSupabase()
  if (!sb || listingId.startsWith('seed-') || listingId.startsWith('m-')) {
    return { listing: expressInterest(listingId), backend: 'localStorage' }
  }

  try {
    const { data: current, error: readErr } = await sb
      .from('listings')
      .select('interests')
      .eq('id', listingId)
      .single()
    if (readErr) throw readErr

    const next = (current?.interests ?? 0) + 1
    const { data, error } = await sb
      .from('listings')
      .update({ interests: next })
      .eq('id', listingId)
      .select('*')
      .single()
    if (error) throw error

    localStorage.setItem(
      INTEREST_KEY,
      JSON.stringify([...myInterests, listingId]),
    )
    return { listing: rowToListing(data as ListingRow), backend: 'supabase' }
  } catch (e) {
    console.warn('[market] Supabase interest failed → local', e)
    return { listing: expressInterest(listingId), backend: 'localStorage' }
  }
}

export function getMyInterests(): string[] {
  try {
    const raw = localStorage.getItem(INTEREST_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function hasExpressedInterest(listingId: string): boolean {
  return getMyInterests().includes(listingId)
}

/** Subscribe to live listing changes when on Supabase. Returns unsubscribe. */
export function subscribeListings(
  onChange: (listings: MarketListing[]) => void,
): () => void {
  const sb = getSupabase()
  if (!sb) return () => {}

  const channel = sb
    .channel('annadata-listings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'listings' },
      () => {
        void listMarketingsAsync().then((r) => onChange(r.listings))
      },
    )
    .subscribe()

  return () => {
    void sb.removeChannel(channel)
  }
}

export function collectiveSummary(
  listings: MarketListing[],
  threshold = BULK_THRESHOLD_Q,
): CollectivePool[] {
  const map = new Map<
    string,
    {
      crop: string
      grade: MarketGrade
      total: number
      regions: Set<string>
      count: number
    }
  >()
  for (const l of listings) {
    const key = `${l.crop}:${l.grade}`
    const cur = map.get(key) ?? {
      crop: l.crop,
      grade: l.grade,
      total: 0,
      regions: new Set<string>(),
      count: 0,
    }
    cur.total += l.quantity_quintals
    cur.regions.add(l.district)
    cur.count += 1
    map.set(key, cur)
  }
  return [...map.values()]
    .map((v) => ({
      crop: v.crop,
      grade: v.grade,
      total_quintals: v.total,
      regions: [...v.regions],
      listing_count: v.count,
      threshold,
      progress_pct: Math.min(100, Math.round((v.total / threshold) * 100)),
      bulk_notified: v.total >= threshold,
    }))
    .sort((a, b) => b.total_quintals - a.total_quintals)
}

const GRADE_PREMIUM: Record<MarketGrade, number> = {
  A: 0.1,
  B: 0,
  C: -0.2,
}

export function suggestFairPrice(
  mandiModal: number,
  grade: MarketGrade,
): number {
  return Math.round(mandiModal * (1 + GRADE_PREMIUM[grade]))
}

export function fairPriceBreakdown(
  mandiModal: number,
  grade: MarketGrade,
): FairPriceBreakdown {
  const premium_pct = Math.round(GRADE_PREMIUM[grade] * 100)
  const fair_price = suggestFairPrice(mandiModal, grade)
  const explanation =
    grade === 'A'
      ? `Grade A premium: +${premium_pct}% over mandi modal (₹${mandiModal.toLocaleString('en-IN')}/q).`
      : grade === 'C'
        ? `Grade C discount: ${premium_pct}% vs mandi modal (₹${mandiModal.toLocaleString('en-IN')}/q).`
        : `Grade B tracks mandi modal (₹${mandiModal.toLocaleString('en-IN')}/q) — no premium.`

  return {
    mandi_modal: mandiModal,
    grade,
    premium_pct,
    fair_price,
    explanation,
  }
}

export function listingCrops(listings: MarketListing[]): string[] {
  return [...new Set(listings.map((l) => l.crop))].sort()
}

export function listingStates(listings: MarketListing[]): string[] {
  return [...new Set(listings.map((l) => l.state))].sort()
}
