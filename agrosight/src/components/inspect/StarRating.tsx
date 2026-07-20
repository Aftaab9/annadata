import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StarRatingProps {
  value: number
  max?: number
  className?: string
}

export function StarRating({ value, max = 5, className }: StarRatingProps) {
  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role="img"
      aria-label={`${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value
        return (
          <Star
            key={i}
            className={cn(
              'h-5 w-5',
              filled ? 'fill-harvest text-harvest' : 'text-[var(--border-2)]',
            )}
            aria-hidden
          />
        )
      })}
    </div>
  )
}
