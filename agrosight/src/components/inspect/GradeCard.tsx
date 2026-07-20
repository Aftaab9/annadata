import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download, QrCode, ShieldCheck } from 'lucide-react'
import type { GradeCardData } from '@/lib/gradeCard'
import { gradeCardPayload } from '@/lib/gradeCard'
import { cn } from '@/lib/cn'

interface GradeCardProps {
  card: GradeCardData
  className?: string
}

export function GradeCard({ card, className }: GradeCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(gradeCardPayload(card), {
      width: 160,
      margin: 1,
      color: { dark: '#ecedf5', light: '#0a0c16' },
    })
      .then(setQrDataUrl)
      .catch(console.error)
  }, [card])

  const downloadQr = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `annadata-grade-${card.id}.png`
    a.click()
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border-2)] bg-gradient-to-br from-[var(--surface-2)] to-[var(--bg-2)] p-4',
        card.hitlRequired && 'border-warning/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Digital grade card
          </p>
          <p className="mt-2 text-2xl font-bold text-text">Grade {card.grade}</p>
          <p className="font-mono text-xs text-muted">{card.id}</p>
        </div>
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR verification code"
            className="h-20 w-20 shrink-0 rounded-lg border border-[var(--border)]"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <QrCode className="h-8 w-8 animate-pulse text-dim" aria-hidden />
          </div>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-dim">Crop</dt>
          <dd className="text-text">{card.crop}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-dim">SKU</dt>
          <dd className="font-mono text-cyan">{card.sku}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-dim">Verdict</dt>
          <dd className="text-text">{card.defectLabel}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-dim">Defect est.</dt>
          <dd className="font-mono text-text">{card.defectRatePct}%</dd>
        </div>
        <div className="col-span-2">
          <dt className="font-mono text-[10px] uppercase tracking-widest text-dim">Issued</dt>
          <dd className="text-muted">
            {new Date(card.issuedAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </dd>
        </div>
      </dl>

      {card.hitlRequired && (
        <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          HITL gate — supervisor must confirm before batch release or marketplace listing.
        </p>
      )}

      <button
        type="button"
        onClick={downloadQr}
        disabled={!qrDataUrl}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-2)] py-2 font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:border-cyan/40 hover:text-cyan disabled:opacity-40"
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        Save QR proof
      </button>
    </div>
  )
}
