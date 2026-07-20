import { getDefectAdvice } from '@/lib/defectAdvice'
import type { DefectAdvice } from '@/lib/defectAdvice'
import type { DefectClass, Language } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { MessageCircle, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/cn'

interface DefectRecommendationProps {
  defectClass: DefectClass
  language: Language
  onAskAssistant: (prompt: string) => void
}

const SEVERITY_UI: Record<
  DefectAdvice['severity'],
  { border: string; bg: string; icon: typeof CheckCircle2; color: string }
> = {
  ok: {
    border: 'border-healthy/40',
    bg: 'bg-healthy/5',
    icon: CheckCircle2,
    color: 'text-healthy',
  },
  caution: {
    border: 'border-warning/40',
    bg: 'bg-warning/5',
    icon: AlertTriangle,
    color: 'text-warning',
  },
  critical: {
    border: 'border-danger/40',
    bg: 'bg-danger/5',
    icon: ShieldAlert,
    color: 'text-danger',
  },
}

export function DefectRecommendation({
  defectClass,
  language,
  onAskAssistant,
}: DefectRecommendationProps) {
  const advice = getDefectAdvice(defectClass, language)
  const ui = SEVERITY_UI[advice.severity]
  const Icon = ui.icon

  return (
    <div className={cn('mt-6 rounded-xl border p-4', ui.border, ui.bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', ui.color)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={cn('font-mono text-[10px] uppercase tracking-widest', ui.color)}>
            Field recommendation
          </p>
          <p className="mt-1 font-semibold text-text">{advice.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{advice.summary}</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-muted">
            {advice.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => onAskAssistant(advice.askAssistant)}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {language === 'hi' ? 'सहायक से पूछें' : 'Ask assistant for more'}
          </Button>
        </div>
      </div>
    </div>
  )
}
