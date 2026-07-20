import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface BottleneckAlertProps {
  reason: string
}

export function BottleneckAlert({ reason }: BottleneckAlertProps) {
  return (
    <Card className="bottleneck-pulse border-warning/50 bg-warning/10">
      <div className="flex gap-3">
        <AlertTriangle className="h-6 w-6 shrink-0 text-warning" aria-hidden />
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-warning">
            Bottleneck detected
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{reason}</p>
          <p className="mt-2 font-mono text-[10px] text-dim">
            Suggested: reduce machine speed or lower moisture before increasing throughput.
          </p>
        </div>
      </div>
    </Card>
  )
}
