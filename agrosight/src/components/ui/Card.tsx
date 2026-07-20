import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Floating glass — nav/modals only. Dense data should stay solid. */
  strong?: boolean
  glass?: boolean
}

export function Card({
  className,
  strong,
  glass,
  children,
  ...props
}: CardProps) {
  const useGlass = glass || strong
  return (
    <div
      className={cn(
        'p-6',
        useGlass
          ? strong
            ? 'glass-strong'
            : 'glass'
          : 'rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-solid)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
