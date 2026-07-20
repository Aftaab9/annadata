import { DEFECT_LABELS, type DefectClass } from '@/lib/constants'
import type { InspectionRecord } from '@/store/useStore'
import { cn } from '@/lib/cn'

const VERDICT_COLORS: Record<DefectClass, string> = {
  HEALTHY: 'border-healthy/50',
  SURFACE_DEFECT: 'border-warning/50',
  BLIGHT_MOLD: 'border-danger/50',
}

interface HistoryStripProps {
  records: InspectionRecord[]
}

export function HistoryStrip({ records }: HistoryStripProps) {
  if (records.length === 0) return null

  return (
    <div className="mt-8">
      <p className="section-label mb-3">Session history</p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {records.slice(0, 12).map((r) => (
          <div
            key={r.id}
            className={cn(
              'shrink-0 overflow-hidden rounded-xl border-2 bg-[var(--surface)]',
              VERDICT_COLORS[r.result.class],
            )}
            title={`${r.crop} — ${DEFECT_LABELS[r.result.class]}`}
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
              {DEFECT_LABELS[r.result.class].split(' ')[0]}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
