import { Link } from 'react-router-dom'
import { BadgeCheck, HandHeart, MapPin, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { MarketFilters, MarketGrade, MarketListing } from '@/services/types'
import { INDIAN_STATES } from '@/services/types'
import { cn } from '@/lib/cn'

interface BuyerBrowseProps {
  listings: MarketListing[]
  filters: MarketFilters
  onFiltersChange: (f: MarketFilters) => void
  crops: string[]
  interestedIds: string[]
  onInterest: (id: string) => void
}

export function BuyerBrowse({
  listings,
  filters,
  onFiltersChange,
  crops,
  interestedIds,
  onInterest,
}: BuyerBrowseProps) {
  return (
    <div className="space-y-4">
      <Card>
        <p className="font-mono text-[10px] uppercase tracking-widest text-dim">
          Filter listings
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-muted">
            Crop
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
              value={filters.crop ?? 'all'}
              onChange={(e) =>
                onFiltersChange({ ...filters, crop: e.target.value })
              }
            >
              <option value="all">All crops</option>
              {crops.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Grade
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
              value={filters.grade ?? 'all'}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  grade: e.target.value as MarketGrade | 'all',
                })
              }
            >
              <option value="all">All grades</option>
              <option value="A">A — Premium</option>
              <option value="B">B — Standard</option>
              <option value="C">C — Discount</option>
            </select>
          </label>
          <label className="text-xs text-muted">
            State
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
              value={filters.state ?? 'all'}
              onChange={(e) =>
                onFiltersChange({ ...filters, state: e.target.value })
              }
            >
              <option value="all">All states</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {listings.length === 0 && (
        <Card className="py-10 text-center text-sm text-muted">
          No listings match these filters. Clear crop / grade / state, or tap Refresh
          on the Market page — demo stock loads from Supabase automatically.
        </Card>
      )}

      {listings.map((l) => {
        const interested = interestedIds.includes(l.id)
        const fairBadge =
          l.mandi_modal != null
            ? l.price_per_quintal <=
              Math.round(
                l.mandi_modal *
                  (l.grade === 'A' ? 1.1 : l.grade === 'C' ? 0.8 : 1.0),
              )
            : true

        return (
          <Card key={l.id} className="relative overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-text">
                    {l.crop} · Grade {l.grade}
                  </p>
                  {l.grade_card_id && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-cyan">
                      <ShieldCheck className="h-3 w-3" aria-hidden />
                      Graded
                    </span>
                  )}
                  {fairBadge && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-healthy/30 bg-healthy/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-healthy">
                      <BadgeCheck className="h-3 w-3" aria-hidden />
                      Fair price
                    </span>
                  )}
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="h-3.5 w-3.5 text-dim" aria-hidden />
                  {l.quantity_quintals} q · {l.district}, {l.state}
                </p>
                <p className="mt-1 font-mono text-xs text-dim">{l.farmer_name}</p>
                {l.grade_card_id && (
                  <Link
                    to={`/inspect?verify=${l.grade_card_id}`}
                    className="mt-2 inline-block font-mono text-[10px] uppercase tracking-widest text-cyan hover:underline"
                  >
                    View grade card →
                  </Link>
                )}
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl text-harvest">
                  ₹{l.price_per_quintal.toLocaleString('en-IN')}
                </p>
                <p className="font-mono text-[10px] text-muted">/quintal</p>
                {l.mandi_modal != null && (
                  <p className="mt-1 font-mono text-[10px] text-dim">
                    Mandi ₹{l.mandi_modal.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
              <Button
                size="sm"
                variant={interested ? 'outline' : 'primary'}
                disabled={interested}
                onClick={() => onInterest(l.id)}
              >
                <HandHeart className="h-4 w-4" aria-hidden />
                {interested ? 'Interest sent' : 'Express interest'}
              </Button>
              {(l.interests ?? 0) > 0 && (
                <span className="font-mono text-[10px] text-dim">
                  {l.interests} buyer{(l.interests ?? 0) === 1 ? '' : 's'} interested
                </span>
              )}
              {l.contact && (
                <a
                  href={`mailto:${l.contact}?subject=Annadata%20enquiry%20—%20${encodeURIComponent(l.crop)}%20Grade%20${l.grade}`}
                  className={cn(
                    'ml-auto font-mono text-[10px] uppercase tracking-widest text-cyan hover:underline',
                  )}
                >
                  Contact farmer
                </a>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
