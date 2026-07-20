import { cn } from '@/lib/cn'

interface ShimmerProps {
  className?: string
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gradient-to-r from-[var(--surface-2)] via-[var(--surface)] to-[var(--surface-2)] bg-[length:200%_100%]',
        className,
      )}
      aria-hidden
    />
  )
}

export function PricesSkeleton() {
  return (
    <div className="mt-8 space-y-6">
      <Shimmer className="mx-auto h-44 w-full max-w-xs" />
      <Shimmer className="h-24 w-full" />
      <Shimmer className="h-52 w-full" />
      <Shimmer className="h-40 w-full" />
    </div>
  )
}
