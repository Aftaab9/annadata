import { Link } from 'react-router-dom'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StarRating } from '@/components/inspect/StarRating'
import type { GradeCardData } from '@/lib/gradeCard'
import type { FairPriceBreakdown, MarketGrade } from '@/services/types'
import { CROPS } from '@/lib/constants'
import { DISTRICTS_BY_STATE, INDIAN_STATES } from '@/services/types'
import { cn } from '@/lib/cn'

interface FarmerListFormProps {
  crop: string
  onCropChange: (crop: string) => void
  grade: MarketGrade
  onGradeChange: (g: MarketGrade) => void
  qty: number
  onQtyChange: (n: number) => void
  price: number
  onPriceChange: (n: number) => void
  farmerName: string
  onFarmerNameChange: (s: string) => void
  breakdown: FairPriceBreakdown
  gradeCard: GradeCardData | null
  hitlBlocked: boolean
  district: string
  state: string
  onDistrictChange: (d: string) => void
  onStateChange: (s: string) => void
  published: boolean
  onPublish: () => void
  onResetPublished: () => void
}

export function FarmerListForm({
  crop,
  onCropChange,
  grade,
  onGradeChange,
  qty,
  onQtyChange,
  price,
  onPriceChange,
  farmerName,
  onFarmerNameChange,
  breakdown,
  gradeCard,
  hitlBlocked,
  district,
  state,
  onDistrictChange,
  onStateChange,
  published,
  onPublish,
  onResetPublished,
}: FarmerListFormProps) {
  const districts = DISTRICTS_BY_STATE[state] ?? []
  const gradeLocked = !!gradeCard && !hitlBlocked

  if (published) {
    return (
      <Card className="border-healthy/30 bg-healthy/5 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-healthy" aria-hidden />
        <p className="mt-3 text-lg font-semibold text-text">Listing published</p>
        <p className="mt-1 text-sm text-muted">
          Buyers can now browse your {crop} Grade {grade} batch.
        </p>
        <Button className="mt-4" variant="outline" onClick={onResetPublished}>
          List another batch
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {gradeCard && (
        <Card className="border-cyan/20 bg-cyan/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-cyan">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Attached grade card
              </p>
              <p className="mt-1 font-semibold text-text">
                Grade {gradeCard.grade} · {gradeCard.crop}
              </p>
              <p className="font-mono text-xs text-muted">{gradeCard.id}</p>
              <StarRating value={gradeCard.stars} className="mt-2" />
            </div>
            <Link
              to={`/inspect?verify=${gradeCard.id}`}
              className="font-mono text-[10px] uppercase tracking-widest text-cyan hover:underline"
            >
              Verify
            </Link>
          </div>
          {hitlBlocked && (
            <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              HITL gate active — supervisor must review inspect result before listing.
            </p>
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-semibold text-text">List your batch</h2>
        <p className="mt-1 text-xs text-muted">
          Fair price = mandi modal ± grade premium. Adjust before publishing.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted">
            Your name
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
              value={farmerName}
              onChange={(e) => onFarmerNameChange(e.target.value)}
              placeholder="Farmer / FPC name"
            />
          </label>
          <label className="text-xs text-muted">
            Crop
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
              value={crop}
              onChange={(e) => onCropChange(e.target.value)}
            >
              {CROPS.map((c) => (
                <option key={c.sku} value={c.label}>
                  {c.label}
                </option>
              ))}
              <option value="Onion">Onion</option>
              <option value="Wheat">Wheat</option>
            </select>
          </label>
          <label className="text-xs text-muted">
            Grade
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text disabled:opacity-60"
              value={grade}
              onChange={(e) => onGradeChange(e.target.value as MarketGrade)}
              disabled={gradeLocked}
            >
              <option value="A">A — Premium (+8%)</option>
              <option value="B">B — Standard</option>
              <option value="C">C — Discount (−8%)</option>
            </select>
          </label>
          <label className="text-xs text-muted">
            Quantity (quintals)
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
              value={qty}
              onChange={(e) => onQtyChange(Number(e.target.value))}
            />
          </label>
          <label className="text-xs text-muted">
            State
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
              value={state}
              onChange={(e) => onStateChange(e.target.value)}
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            District
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
              value={district}
              onChange={(e) => onDistrictChange(e.target.value)}
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 rounded-xl border border-harvest/25 bg-harvest/5 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-harvest">
                Fair price suggestion
              </p>
              <p className="mt-1 text-xs text-muted">{breakdown.explanation}</p>
            </div>
            <button
              type="button"
              className="font-mono text-[10px] uppercase tracking-widest text-cyan hover:underline"
              onClick={() => onPriceChange(breakdown.fair_price)}
            >
              Reset to fair
            </button>
          </div>
          <label className="mt-3 block text-xs text-muted">
            Your asking price ₹/quintal
            <input
              type="number"
              min={100}
              className="mt-1 w-full rounded-lg border border-harvest/40 bg-[var(--bg-2)] px-3 py-2 font-mono text-lg text-harvest"
              value={price}
              onChange={(e) => onPriceChange(Number(e.target.value))}
            />
          </label>
          <p className="mt-2 font-mono text-[10px] text-dim">
            Mandi modal ₹{breakdown.mandi_modal.toLocaleString('en-IN')} · Grade{' '}
            {grade} ·{' '}
            <span
              className={cn(
                price === breakdown.fair_price ? 'text-healthy' : 'text-warning',
              )}
            >
              {price === breakdown.fair_price
                ? 'at fair price'
                : price > breakdown.fair_price
                  ? 'above fair'
                  : 'below fair'}
            </span>
          </p>
        </div>

        {!gradeCard && (
          <p className="mt-3 text-xs text-warning">
            No Grade Card yet —{' '}
            <Link to="/inspect" className="text-cyan">
              inspect first
            </Link>{' '}
            for buyer trust (optional for demo).
          </p>
        )}

        <Button
          className="mt-4 w-full"
          onClick={onPublish}
          disabled={hitlBlocked || !farmerName.trim() || qty < 1}
          title={hitlBlocked ? 'Supervisor review required' : undefined}
        >
          {hitlBlocked ? 'Publish blocked (HITL)' : 'Publish listing'}
        </Button>
      </Card>
    </div>
  )
}
