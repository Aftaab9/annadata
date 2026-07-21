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

function gradePrice(modal: number, grade: MarketGrade): number {
  const m = grade === 'A' ? 1.1 : grade === 'C' ? 0.8 : 1
  return Math.round(modal * m)
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

function listingToInsert(l: MarketListing) {
  return {
    id: l.id,
    farmer_name: l.farmer_name,
    crop: l.crop,
    grade: l.grade,
    quantity_quintals: l.quantity_quintals,
    district: l.district,
    state: l.state,
    price_per_quintal: l.price_per_quintal,
    mandi_modal: l.mandi_modal ?? null,
    grade_card_id: l.grade_card_id ?? null,
    grade_card_json: l.grade_card_id
      ? {
          id: l.grade_card_id,
          grade: l.grade,
          crop: l.crop,
          sourceMode: 'produce',
          demo: true,
        }
      : null,
    contact: l.contact ?? null,
    interests: l.interests ?? 0,
    farmer_id: 'seed-demo',
    created_at: new Date(l.created_at).toISOString(),
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

/**
 * Demo marketplace inventory — prices anchored to Jul 2026 Agmarknet
 * Maharashtra modals (Tomato~1733, Maize~2182, Potato~1433, Onion~1963,
 * Soyabean~7167; Apple~15893). Fair price = modal × (A +10% / B / C −20%).
 * Fixed UUIDs so Supabase upsert is idempotent.
 */
export const MARKET_SEED: MarketListing[] = [
  {
    id: 'a0000001-0000-4000-8000-000000000001',
    farmer_name: 'Ramesh Patil',
    crop: 'Tomato',
    grade: 'A',
    quantity_quintals: 85,
    district: 'Nashik',
    state: 'Maharashtra',
    mandi_modal: 1733,
    price_per_quintal: gradePrice(1733, 'A'),
    grade_card_id: 'gc-demo-tomato-a',
    contact: 'ramesh@annadata.demo',
    interests: 4,
    created_at: Date.now() - 86400000,
  },
  {
    id: 'a0000001-0000-4000-8000-000000000002',
    farmer_name: 'Sunita Devi',
    crop: 'Maize',
    grade: 'B',
    quantity_quintals: 140,
    district: 'Pune',
    state: 'Maharashtra',
    mandi_modal: 2182,
    price_per_quintal: gradePrice(2182, 'B'),
    grade_card_id: 'gc-demo-maize-b',
    contact: 'sunita@annadata.demo',
    interests: 2,
    created_at: Date.now() - 172800000,
  },
  {
    id: 'a0000001-0000-4000-8000-000000000003',
    farmer_name: 'FPC Solapur Collective',
    crop: 'Onion',
    grade: 'A',
    quantity_quintals: 220,
    district: 'Solapur',
    state: 'Maharashtra',
    mandi_modal: 1963,
    price_per_quintal: gradePrice(1963, 'A'),
    grade_card_id: 'gc-demo-onion-a',
    contact: 'fpc@annadata.demo',
    interests: 6,
    created_at: Date.now() - 43200000,
  },
  {
    id: 'a0000001-0000-4000-8000-000000000004',
    farmer_name: 'Kiran Jadhav',
    crop: 'Potato',
    grade: 'C',
    quantity_quintals: 70,
    district: 'Pune',
    state: 'Maharashtra',
    mandi_modal: 1433,
    price_per_quintal: gradePrice(1433, 'C'),
    contact: 'kiran@annadata.demo',
    interests: 1,
    created_at: Date.now() - 259200000,
  },
  {
    id: 'a0000001-0000-4000-8000-000000000005',
    farmer_name: 'Lakshmi Farms',
    crop: 'Tomato',
    grade: 'B',
    quantity_quintals: 95,
    district: 'Bengaluru',
    state: 'Karnataka',
    mandi_modal: 1733,
    price_per_quintal: gradePrice(1733, 'B'),
    grade_card_id: 'gc-demo-tomato-b',
    contact: 'lakshmi@annadata.demo',
    interests: 3,
    created_at: Date.now() - 7200000,
  },
  {
    id: 'a0000001-0000-4000-8000-000000000006',
    farmer_name: 'Anjali More',
    crop: 'Tomato',
    grade: 'A',
    quantity_quintals: 120,
    district: 'Ahmednagar',
    state: 'Maharashtra',
    mandi_modal: 1733,
    price_per_quintal: gradePrice(1733, 'A'),
    grade_card_id: 'gc-demo-tomato-a2',
    contact: 'anjali@annadata.demo',
    interests: 5,
    created_at: Date.now() - 3600000,
  },
  {
    id: 'a0000001-0000-4000-8000-000000000007',
    farmer_name: 'Green Valley FPC',
    crop: 'Tomato',
    grade: 'A',
    quantity_quintals: 180,
    district: 'Nashik',
    state: 'Maharashtra',
    mandi_modal: 1733,
    price_per_quintal: gradePrice(1733, 'A'),
    grade_card_id: 'gc-demo-tomato-a3',
    contact: 'greenvalley@annadata.demo',
    interests: 8,
    created_at: Date.now() - 1800000,
  },
  {
    id: 'a0000001-0000-4000-8000-000000000008',
    farmer_name: 'Vikram Singh',
    crop: 'Apple',
    grade: 'A',
    quantity_quintals: 35,
    district: 'Nashik',
    state: 'Maharashtra',
    mandi_modal: 15893,
    price_per_quintal: gradePrice(15893, 'A'),
    grade_card_id: 'gc-demo-apple-a',
    contact: 'vikram@annadata.demo',
    interests: 7,
    created_at: Date.now() - 5400000,
  },
  {
    id: 'a0000001-0000-4000-8000-000000000009',
    farmer_name: 'Meena Cooperative',
    crop: 'Soybean',
    grade: 'B',
    quantity_quintals: 200,
    district: 'Latur',
    state: 'Maharashtra',
    mandi_modal: 7167,
    price_per_quintal: gradePrice(7167, 'B'),
    grade_card_id: 'gc-demo-soy-b',
    contact: 'meena@annadata.demo',
    interests: 2,
    created_at: Date.now() - 9600000,
  },
  {
    id: 'a0000001-0000-4000-8000-00000000000a',
    farmer_name: 'Prakash Kale',
    crop: 'Pepper',
    grade: 'A',
    quantity_quintals: 28,
    district: 'Kolhapur',
    state: 'Maharashtra',
    mandi_modal: 4200,
    price_per_quintal: gradePrice(4200, 'A'),
    grade_card_id: 'gc-demo-pepper-a',
    contact: 'prakash@annadata.demo',
    interests: 3,
    created_at: Date.now() - 12000000,
  },
  {
    id: 'a0000001-0000-4000-8000-00000000000b',
    farmer_name: 'Sai Potato Growers',
    crop: 'Potato',
    grade: 'B',
    quantity_quintals: 110,
    district: 'Satara',
    state: 'Maharashtra',
    mandi_modal: 1433,
    price_per_quintal: gradePrice(1433, 'B'),
    grade_card_id: 'gc-demo-potato-b',
    contact: 'sai@annadata.demo',
    interests: 1,
    created_at: Date.now() - 20000000,
  },
  {
    id: 'a0000001-0000-4000-8000-00000000000c',
    farmer_name: 'Nashik Tomato Hub',
    crop: 'Tomato',
    grade: 'A',
    quantity_quintals: 150,
    district: 'Nashik',
    state: 'Maharashtra',
    mandi_modal: 1733,
    price_per_quintal: gradePrice(1733, 'A'),
    grade_card_id: 'gc-demo-tomato-a4',
    contact: 'hub@annadata.demo',
    interests: 9,
    created_at: Date.now() - 900000,
  },
]

function ensureSeed(): void {
  const existing = readAll()
  if (existing.length === 0) {
    writeAll(MARKET_SEED)
    return
  }
  // Upgrade older tiny seeds so Buyer never looks empty after refresh
  if (existing.length < 6 && existing.every((l) => l.id.startsWith('seed-'))) {
    writeAll(MARKET_SEED)
  }
}

/** Upsert demo rows when Supabase table is empty (idempotent fixed UUIDs). */
async function ensureSupabaseSeed(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
): Promise<MarketListing[]> {
  const { count, error: countErr } = await sb
    .from('listings')
    .select('id', { count: 'exact', head: true })

  if (countErr) throw countErr
  if ((count ?? 0) > 0) {
    const { data, error } = await sb
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as ListingRow[] | null)?.map(rowToListing) ?? []
  }

  const payload = MARKET_SEED.map(listingToInsert)
  const { error: upsertErr } = await sb.from('listings').upsert(payload, {
    onConflict: 'id',
  })
  if (upsertErr) throw upsertErr

  const { data, error } = await sb
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as ListingRow[] | null)?.map(rowToListing) ?? MARKET_SEED
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
    const listings = await ensureSupabaseSeed(sb)
    return { listings, backend: 'supabase' }
  } catch (e) {
    console.warn('[market] Supabase list/seed failed → localStorage', e)
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
  // Local-only ids (legacy seed- / m-) stay in localStorage
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
