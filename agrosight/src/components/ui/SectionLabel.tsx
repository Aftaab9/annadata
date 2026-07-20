import { cn } from '@/lib/cn'

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return <p className={cn('section-label mb-3', className)}>{children}</p>
}
