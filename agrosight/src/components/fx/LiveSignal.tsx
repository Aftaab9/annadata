import { useEffect, useRef } from 'react'
import { capDpr, prefersReducedMotion } from '@/lib/motion'
import { useStore } from '@/store/useStore'
import { DEFECT_TO_RATE } from '@/lib/constants'

export function LiveSignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const history = useStore((s) => s.inspectionHistory)

  const defectRates = history.length
    ? [...history].reverse().map((r) => DEFECT_TO_RATE[r.result.class])
    : null

  useEffect(() => {
    if (prefersReducedMotion()) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = capDpr()
    const W = 600
    const H = 120
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const points: number[] = Array.from({ length: 80 }, () => 0)
    let t = 0
    let raf = 0
    let dataIdx = 0

    const draw = () => {
      t += 0.05

      if (defectRates && defectRates.length > 0) {
        dataIdx = (dataIdx + 0.15) % defectRates.length
        const base = defectRates[Math.floor(dataIdx)]! / 30
        for (let i = 0; i < points.length; i++) {
          const sampleIdx = Math.min(
            defectRates.length - 1,
            Math.floor((i / points.length) * defectRates.length),
          )
          const target = (defectRates[sampleIdx] ?? 5) / 30
          points[i] =
            target * 0.7 +
            Math.sin(t + i * 0.15) * 0.08 +
            (Math.random() - 0.5) * 0.03
        }
        void base
      } else {
        for (let i = 0; i < points.length; i++) {
          points[i] =
            Math.sin(t + i * 0.2) * 0.4 +
            Math.sin(t * 1.7 + i * 0.08) * 0.25 +
            (Math.random() - 0.5) * 0.08
        }
      }

      ctx.clearRect(0, 0, W, H)

      const grad = ctx.createLinearGradient(0, 0, W, 0)
      grad.addColorStop(0, 'rgba(6, 182, 212, 0)')
      grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.8)')
      grad.addColorStop(1, 'rgba(99, 102, 241, 0)')

      ctx.beginPath()
      const step = W / (points.length - 1)
      points.forEach((p, i) => {
        const x = i * step
        const y = H / 2 + p * (H * 0.35)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.strokeStyle = grad
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.lineTo(W, H)
      ctx.lineTo(0, H)
      ctx.closePath()
      const fill = ctx.createLinearGradient(0, 0, 0, H)
      fill.addColorStop(0, 'rgba(6, 182, 212, 0.15)')
      fill.addColorStop(1, 'rgba(6, 182, 212, 0)')
      ctx.fillStyle = fill
      ctx.fill()

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [defectRates])

  const live = history.length > 0

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-4">
      <span className="absolute right-4 top-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-healthy">
        <span className="live-dot h-2 w-2 rounded-full bg-healthy" />
        {live ? 'Live — session data' : 'Live — simulated'}
      </span>
      <canvas ref={canvasRef} width={600} height={120} className="w-full" aria-hidden />
      <p className="mt-2 font-mono text-xs text-muted">
        {live
          ? `Defect signal from ${history.length} inspection${history.length === 1 ? '' : 's'} this session`
          : 'Defect rate signal — inspect crops to feed real data'}
      </p>
    </div>
  )
}
