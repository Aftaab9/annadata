import { Card } from '@/components/ui/Card'
import { Counter } from '@/components/ui/Counter'
import { RevealOnScroll } from '@/components/fx'

interface YieldStatCardProps {
  label: string
  value: number
  suffix?: string
  decimals?: number
  delay?: number
}

export function YieldStatCard({
  label,
  value,
  suffix = '',
  decimals = 1,
  delay = 0,
}: YieldStatCardProps) {
  return (
    <RevealOnScroll delay={delay} immediate>
      <Card className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {label}
        </p>
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-text">
          <Counter value={value} suffix={suffix} decimals={decimals} />
        </p>
      </Card>
    </RevealOnScroll>
  )
}
