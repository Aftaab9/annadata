import { DEFECT_LABELS, type DefectClass } from '@/lib/constants'
import { PRODUCE_LABELS } from '@/lib/produceInference'
import type { InspectionRecord } from '@/store/useStore'
import { cn } from '@/lib/cn'

const VERDICT_COLORS: Record<DefectClass, string> = {
  HEALTHY: 'border-healthy/50',
  SURFACE_DEFECT: 'border-warning/50',
  BLIGHT_MOLD: 'border-danger/50',
}

interface HistoryStripProps {
  records: InspectionRecord[]
  onSelect?: (record: InspectionRecord) => void
  activeId?: string | null
}

export function HistoryStrip({ records, onSelect, activeId }: HistoryStripProps) {
  if (records.length === 0) return null

  return (
    <div className="mt-8">
      <p className="section-label mb-1">Session history</p>
      <p className="mb-3 text-xs text-dim">
        Tap a scan to reopen its grade card — no need to upload again.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {records.slice(0, 12).map((r) => {
          const isProduce = r.mode === 'produce' || r.gradeCard?.sourceMode === 'produce'
          const label = isProduce
            ? r.result.class === 'HEALTHY'
              ? PRODUCE_LABELS.FRESH
              : r.result.class === 'SURFACE_DEFECT'
                ? PRODUCE_LABELS.BORDERLINE
                : PRODUCE_LABELS.ROTTEN
            : DEFECT_LABELS[r.result.class]
          const short = label.split(/[\s/]/)[0] ?? label
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect?.(r)}
              className={cn(
                'shrink-0 overflow-hidden rounded-xl border-2 bg-[var(--surface)] text-left transition-transform hover:scale-[1.03]',
                VERDICT_COLORS[r.result.class],
                activeId === r.id && 'ring-2 ring-cyan/60',
                onSelect && 'cursor-pointer',
              )}
              title={`${r.crop} — ${label} (${Math.round(r.result.confidence * 100)}%)`}
            >
              {r.thumbnail ? (
                <img
                  src={r.thumbnail}
                  alt=""
                  className="h-16 w-16 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center font-mono text-[10px] text-muted">
                  {Math.round(r.result.confidence * 100)}%
                </div>
              )}
              <p className="max-w-[64px] truncate px-1 py-1 text-center font-mono text-[9px] uppercase text-muted">
                {short}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
