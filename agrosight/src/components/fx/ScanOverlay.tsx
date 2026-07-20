import { cn } from '@/lib/cn'

interface ScanOverlayProps {
  active?: boolean
  className?: string
}

/** Corner-bracket frame + sweeping scan line for /inspect */
export function ScanOverlay({ active = false, className }: ScanOverlayProps) {
  return (
    <div
      className={cn('scan-overlay pointer-events-none absolute inset-0', className)}
      aria-hidden
    >
      <span className="scan-corner scan-corner-tl" />
      <span className="scan-corner scan-corner-tr" />
      <span className="scan-corner scan-corner-bl" />
      <span className="scan-corner scan-corner-br" />
      {active && <span className="scan-line" />}
    </div>
  )
}
