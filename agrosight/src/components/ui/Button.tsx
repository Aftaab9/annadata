import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-semibold rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3dd6c3] disabled:opacity-50 disabled:pointer-events-none transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out active:scale-[0.97]'

    const variants = {
      primary:
        'bg-[#3dd6c3] text-[#04241c] shadow-[0_0_24px_rgba(61,214,195,0.35)] hover:brightness-110',
      ghost: 'text-muted hover:text-text hover:bg-[var(--surface-2)] font-medium',
      outline:
        'border border-[var(--border-2)] bg-[var(--surface-2)] text-text font-medium hover:border-[#3dd6c3]/50',
    }

    const sizes = {
      sm: 'px-3 py-2 text-sm gap-1.5 min-h-[40px]',
      md: 'px-5 py-2.5 text-sm gap-2 min-h-[44px]',
      lg: 'px-8 py-3.5 text-base gap-2 min-h-[52px]',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
