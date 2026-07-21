import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface BottleneckAlertProps {
  reasons: string[]
}

export function BottleneckAlert({ reasons }: BottleneckAlertProps) {
  if (reasons.length === 0) return null

  return (
    <Card className="bottleneck-pulse border-warning/50 bg-warning/10">
      <div className="flex gap-3">
        <AlertTriangle className="h-6 w-6 shrink-0 text-warning" aria-hidden />
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-warning">
            Bottleneck{reasons.length > 1 ? 's' : ''} detected
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-muted">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-[10px] text-dim">
            Suggested: dry raw material, sort defects upstream, keep RPM in the
            safe band, then raise throughput.
          </p>
        </div>
      </div>
    </Card>
  )
}
