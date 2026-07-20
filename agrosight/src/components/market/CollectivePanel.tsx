import { Bell, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { CollectivePool } from '@/services/types'
import { BULK_THRESHOLD_Q } from '@/services/marketService'
import { cn } from '@/lib/cn'

interface CollectivePanelProps {
  pools: CollectivePool[]
}

export function CollectivePanel({ pools }: CollectivePanelProps) {
  const notified = pools.filter((p) => p.bulk_notified)

  return (
    <Card className="border-indigo/20">
      <h2 className="flex items-center gap-2 font-semibold text-text">
        <Users className="h-4 w-4 text-indigo" aria-hidden />
        Collective bargaining
      </h2>
      <p className="mt-1 text-xs text-muted">
        Farmers pool volume by crop + grade + region. Bulk buyers are notified when a
        pool crosses {BULK_THRESHOLD_Q} quintals.
      </p>

      {notified.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-healthy/30 bg-healthy/10 px-3 py-2 text-xs text-healthy">
          <Bell className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {notified.length} pool{notified.length === 1 ? '' : 's'} at threshold —
            bulk buyers notified (demo).
          </p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {pools.length === 0 && (
          <p className="text-sm text-muted">No pooled listings yet.</p>
        )}
        {pools.map((c) => (
          <div key={`${c.crop}-${c.grade}`}>
            <div className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-text">
                  {c.crop} · Grade {c.grade}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {c.listing_count} listing{c.listing_count === 1 ? '' : 's'} ·{' '}
                  {c.regions.join(', ')}
                </p>
              </div>
              <p className="shrink-0 font-mono text-text">
                {c.total_quintals} q
                {c.bulk_notified && (
                  <span className="ml-2 rounded bg-healthy/15 px-1.5 py-0.5 text-[9px] uppercase text-healthy">
                    Notified
                  </span>
                )}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  c.bulk_notified ? 'bg-healthy' : 'bg-indigo',
                )}
                style={{ width: `${c.progress_pct}%` }}
              />
            </div>
            <p className="mt-1 font-mono text-[10px] text-dim">
              {c.progress_pct}% of {c.threshold} q bulk threshold
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
