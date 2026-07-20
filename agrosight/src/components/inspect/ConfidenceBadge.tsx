import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { HITL_THRESHOLD } from '@/lib/constants'

interface ConfidenceBadgeProps {
  confidence: number
  className?: string
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100)
  const low = confidence < HITL_THRESHOLD
  const color = low ? 'var(--warning)' : pct >= 85 ? 'var(--healthy)' : 'var(--cyan)'

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className="relative flex h-32 w-32 items-center justify-center rounded-full border-[3px] bg-[var(--surface)] shadow-[0_0_40px_var(--glow-cyan)]"
        style={{ borderColor: color }}
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Model confidence ${pct} percent`}
      >
        <motion.span
          className="font-mono text-4xl font-bold tabular-nums text-text"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {pct}%
        </motion.span>
      </div>
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
        Model confidence
      </p>
      {low && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-warning">
          Below {HITL_THRESHOLD * 100}% — human review required
        </p>
      )}
    </div>
  )
}
