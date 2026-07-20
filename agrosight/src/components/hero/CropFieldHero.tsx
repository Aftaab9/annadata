import { Suspense, lazy } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

const CropFieldCanvas = lazy(() =>
  import('./CropFieldCanvas').then((m) => ({ default: m.CropFieldCanvas })),
)

export function CropFieldHero() {
  if (prefersReducedMotion()) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[min(72vh,640px)] opacity-90"
      aria-hidden
    >
      <Suspense fallback={null}>
        <CropFieldCanvas />
      </Suspense>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg)]/20 to-[var(--bg)]" />
    </div>
  )
}
