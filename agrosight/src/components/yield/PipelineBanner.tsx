import { Link2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { ClassificationResult } from '@/lib/inference'
import { DEFECT_LABELS } from '@/lib/constants'

interface PipelineBannerProps {
  defectRate: number
  cvResult?: ClassificationResult | null
  materialGrade?: number
}

export function PipelineBanner({
  defectRate,
  cvResult,
  materialGrade,
}: PipelineBannerProps) {
  return (
    <Card className="pipeline-banner relative overflow-hidden border-cyan/50 bg-cyan/5">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan/10 via-transparent to-indigo/10" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan/20">
          <Link2 className="h-5 w-5 text-cyan" aria-hidden />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
            CV → Yield pipeline linked
          </p>
          <p className="mt-1 text-sm text-text">
            Defect rate{' '}
            <strong className="font-mono text-cyan">{defectRate}%</strong>
            {materialGrade != null && (
              <>
                {' '}
                · material grade{' '}
                <strong className="font-mono text-cyan">{materialGrade}/5</strong>
              </>
            )}{' '}
            from inspection
            {cvResult && (
              <>
                {' '}
                (
                <span style={{ color: 'var(--healthy)' }}>
                  {DEFECT_LABELS[cvResult.class]}
                </span>
                , {Math.round(cvResult.confidence * 100)}% confidence)
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-muted">
            Move moisture / grade / defects (high impact) to watch yield and
            throughput change.
          </p>
        </div>
      </div>
    </Card>
  )
}
