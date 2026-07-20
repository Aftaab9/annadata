import { Scan, IndianRupee, Sprout, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'

const STEPS = [
  {
    icon: Scan,
    title: 'Inspect',
    desc: 'Grade Card + QR proof',
    to: '/inspect',
    color: 'text-cyan',
  },
  {
    icon: IndianRupee,
    title: 'Prices',
    desc: 'Live mandi + forecast',
    to: '/prices',
    color: 'text-harvest',
  },
  {
    icon: Sprout,
    title: 'Advisory',
    desc: 'Crop, yield, harvest',
    to: '/advisory',
    color: 'text-healthy',
  },
  {
    icon: Store,
    title: 'Market',
    desc: 'Sell direct to buyers',
    to: '/market',
    color: 'text-accent',
  },
] as const

export function PipelineFlow() {
  return (
    <div className="section-item mt-16">
      <p className="section-label mb-6">Farmer empowerment pipeline</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <Link key={step.to} to={step.to} className="bento-cell group no-underline">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <Card className="h-full border-[var(--border)] bg-[var(--surface-solid)] transition-colors group-hover:border-accent/40">
                <div className="flex items-center justify-between">
                  <step.icon className={`h-5 w-5 ${step.color}`} aria-hidden />
                  <span className="font-mono text-[10px] text-dim">0{i + 1}</span>
                </div>
                <h3 className="font-display mt-4 font-semibold text-text">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{step.desc}</p>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}
