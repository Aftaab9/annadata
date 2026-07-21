import { useCallback, useEffect, useMemo, useState } from 'react'
import { Database, Loader2, RefreshCw, ShoppingBag, Store } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import {
  collectiveSummary,
  expressInterestAsync,
  fairPriceBreakdown,
  filterListings,
  getMandiPrices,
  getMarketBackend,
  getMyInterests,
  listMarketingsAsync,
  listingCrops,
  publishListingAsync,
  subscribeListings,
  suggestFairPrice,
} from '@/services'
import type {
  MarketBackend,
  MarketFilters,
  MarketGrade,
  MarketListing,
} from '@/services/types'
import { DISTRICTS_BY_STATE } from '@/services/types'
import { RevealOnScroll, SplitText } from '@/components/fx'
import { FarmerListForm } from '@/components/market/FarmerListForm'
import { BuyerBrowse } from '@/components/market/BuyerBrowse'
import { CollectivePanel } from '@/components/market/CollectivePanel'
import { cn } from '@/lib/cn'

type View = 'farmer' | 'buyer'

export default function Market() {
  const selectedCrop = useStore((s) => s.selectedCrop)
  const gradeCard = useStore((s) => s.gradeCard)
  const location = useStore((s) => s.location)
  const setLocation = useStore((s) => s.setLocation)
  const setPriceModal = useStore((s) => s.setPriceModal)
  const priceModal = useStore((s) => s.priceModal)

  const [view, setView] = useState<View>('farmer')
  const [listings, setListings] = useState<MarketListing[]>([])
  const [backend, setBackend] = useState<MarketBackend>(getMarketBackend())
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [priceSource, setPriceSource] = useState<'live' | 'cache' | 'snapshot' | null>(
    null,
  )
  const [interestedIds, setInterestedIds] = useState(() => getMyInterests())
  const [filters, setFilters] = useState<MarketFilters>({
    crop: 'all',
    grade: 'all',
    state: 'all',
  })

  const [crop, setCrop] = useState(selectedCrop.label)
  const [grade, setGrade] = useState<MarketGrade>(gradeCard?.grade ?? 'B')
  const [qty, setQty] = useState(50)
  const [farmerName, setFarmerName] = useState('You (demo)')
  const [published, setPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const mandi = priceModal || 1950
  const breakdown = useMemo(
    () => fairPriceBreakdown(mandi, grade),
    [mandi, grade],
  )
  const [price, setPrice] = useState(() => suggestFairPrice(mandi, grade))

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await listMarketingsAsync()
    setListings(result.listings)
    setBackend(result.backend)
    setSyncError(result.error ?? null)
    setInterestedIds(getMyInterests())
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Live Agmarknet modal → fair list price (data.gov.in)
  useEffect(() => {
    let cancelled = false
    const commodity =
      crop === 'Pepper' ? 'Green Chilli' : crop === 'Soybean' ? 'Soyabean' : crop
    void getMandiPrices({
      state: location.state,
      commodity,
      limit: 40,
    }).then((r) => {
      if (cancelled || !r.modal_price) return
      setPriceModal(r.modal_price)
      setPriceSource(r.source)
    })
    return () => {
      cancelled = true
    }
  }, [crop, location.state, setPriceModal])

  useEffect(() => {
    return subscribeListings((next) => {
      setListings(next)
      setBackend('supabase')
    })
  }, [])

  useEffect(() => {
    if (gradeCard?.grade) setGrade(gradeCard.grade)
  }, [gradeCard?.grade])

  useEffect(() => {
    setPrice(suggestFairPrice(mandi, grade))
  }, [mandi, grade])

  useEffect(() => {
    setCrop(selectedCrop.label)
  }, [selectedCrop.label])

  const hitlBlocked = gradeCard?.hitlRequired ?? false
  const collective = useMemo(() => collectiveSummary(listings), [listings])
  const filtered = useMemo(
    () => filterListings(listings, filters),
    [listings, filters],
  )
  const crops = useMemo(() => listingCrops(listings), [listings])

  const publish = async () => {
    if (hitlBlocked || !farmerName.trim() || qty < 1 || publishing) return
    setPublishing(true)
    try {
      const { listing, backend: b, error } = await publishListingAsync(
        {
          farmer_name: farmerName.trim(),
          crop,
          grade,
          quantity_quintals: qty,
          district: location.district,
          state: location.state,
          price_per_quintal: price,
          mandi_modal: mandi,
          grade_card_id: gradeCard?.id,
          contact: 'you@annadata.demo',
        },
        gradeCard
          ? {
              id: gradeCard.id,
              grade: gradeCard.grade,
              defectLabel: gradeCard.defectLabel,
              confidencePct: gradeCard.confidencePct,
              sourceMode: gradeCard.sourceMode,
            }
          : null,
      )
      setBackend(b)
      setSyncError(error ?? null)
      setListings((prev) => [listing, ...prev.filter((l) => l.id !== listing.id)])
      setPublished(true)
      setView('buyer')
      void refresh()
    } finally {
      setPublishing(false)
    }
  }

  const onInterest = async (id: string) => {
    await expressInterestAsync(id)
    setInterestedIds(getMyInterests())
    void refresh()
  }

  const onStateChange = (state: string) => {
    const districts = DISTRICTS_BY_STATE[state] ?? []
    setLocation({ state, district: districts[0] ?? location.district })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28">
      <SectionLabel>D2C Marketplace</SectionLabel>
      <SplitText as="h1" className="text-3xl font-bold tracking-tight text-text">
        Sell direct, skip the middleman
      </SplitText>
      <p className="mt-2 text-sm text-muted">
        List after <strong className="text-text">Produce Quality</strong> Inspect
        (not Leaf Health). Fair price = live mandi modal ± grade premium (A +10% /
        B / C −20%).
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] sm:grid-cols-3">
        <img
          src="/photos/vegetable-mandi.jpg"
          alt="Vegetable mandi"
          className="aspect-[16/10] h-full w-full object-cover sm:col-span-2"
          loading="lazy"
        />
        <img
          src="/photos/male-farmers.jpg"
          alt="Farmers"
          className="hidden aspect-[16/10] h-full w-full object-cover sm:block"
          loading="lazy"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest',
            backend === 'supabase'
              ? 'border-healthy/30 bg-healthy/10 text-healthy'
              : 'border-warning/30 bg-warning/10 text-warning',
          )}
        >
          <Database className="h-3 w-3" aria-hidden />
          {backend === 'supabase'
            ? 'Live · Supabase (multi-device)'
            : 'This device · localStorage'}
        </p>
        {priceSource && (
          <p className="inline-flex items-center gap-1.5 rounded-lg border border-cyan/30 bg-cyan/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-cyan">
            Mandi ₹{mandi.toLocaleString('en-IN')}/q · {priceSource}
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-[36px] gap-1.5"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          )}
          Refresh
        </Button>
      </div>

      {syncError && (
        <p className="mt-2 text-xs text-warning">
          Cloud sync issue — using local fallback. {syncError}
        </p>
      )}

      {(!gradeCard || gradeCard.sourceMode !== 'produce') && (
        <p className="mt-3 rounded-xl border border-cyan/30 bg-cyan/5 px-3 py-2 text-sm text-muted">
          Tip: open Inspect → <strong className="text-text">Produce Quality</strong>,
          scan a batch, then return here to list with a real Grade Card.
        </p>
      )}

      <div className="mt-6 flex gap-2">
        {(
          [
            { id: 'farmer' as const, label: 'Farmer', icon: Store },
            { id: 'buyer' as const, label: 'Buyer', icon: ShoppingBag },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={cn(
              'flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors',
              view === id
                ? 'border-[#3dd6c3]/40 bg-[#3dd6c3]/10 text-[#3dd6c3]'
                : 'border-[var(--border)] text-muted hover:text-text',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
            {id === 'buyer' && (
              <span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[9px] text-dim">
                {listings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <RevealOnScroll immediate className="mt-6">
        {view === 'farmer' && (
          <FarmerListForm
            crop={crop}
            onCropChange={setCrop}
            grade={grade}
            onGradeChange={setGrade}
            qty={qty}
            onQtyChange={setQty}
            price={price}
            onPriceChange={setPrice}
            farmerName={farmerName}
            onFarmerNameChange={setFarmerName}
            breakdown={breakdown}
            gradeCard={gradeCard}
            hitlBlocked={hitlBlocked}
            district={location.district}
            state={location.state}
            onDistrictChange={(d) => setLocation({ district: d })}
            onStateChange={onStateChange}
            published={published}
            onPublish={() => void publish()}
            onResetPublished={() => setPublished(false)}
          />
        )}
        {view === 'buyer' && (
          <BuyerBrowse
            listings={filtered}
            filters={filters}
            onFiltersChange={setFilters}
            crops={crops}
            interestedIds={interestedIds}
            onInterest={(id) => void onInterest(id)}
          />
        )}
      </RevealOnScroll>

      {publishing && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Publishing listing…
        </p>
      )}

      <RevealOnScroll immediate delay={0.1} className="mt-8">
        <CollectivePanel pools={collective} />
      </RevealOnScroll>
    </div>
  )
}
