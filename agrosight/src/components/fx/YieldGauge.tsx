import { useEffect, useRef } from 'react'
import { capDpr, prefersReducedMotion } from '@/lib/motion'

interface YieldGaugeProps {
  value: number
  max?: number
  className?: string
}

export function YieldGauge({ value, max = 100, className }: YieldGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef({ current: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = capDpr()
    const W = 280
    const H = 180
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const cx = W / 2
    const cy = H * 0.72
    const R = W * 0.38
    const target = value / max

    if (prefersReducedMotion()) {
      animRef.current.current = target
    }

    const color = value >= 75 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'
    let raf = 0

    const draw = () => {
      const t = animRef.current.current
      const diff = target - t
      animRef.current.current += diff * 0.06
      const pct = animRef.current.current

      ctx.clearRect(0, 0, W, H)

      ctx.beginPath()
      ctx.arc(cx, cy, R, Math.PI, 0)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 16
      ctx.lineCap = 'round'
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * pct)
      ctx.strokeStyle = color
      ctx.lineWidth = 16
      ctx.lineCap = 'round'
      ctx.shadowBlur = 20
      ctx.shadowColor = color
      ctx.stroke()
      ctx.shadowBlur = 0

      ctx.fillStyle = '#ecedf5'
      ctx.font = `700 ${W * 0.14}px "Space Grotesk", sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`${Math.round(pct * max)}%`, cx, cy + 8)
      ctx.font = `400 ${W * 0.07}px "JetBrains Mono", monospace`
      ctx.fillStyle = 'rgba(236,237,245,0.5)'
      ctx.fillText('YIELD', cx, cy + W * 0.1)

      if (Math.abs(diff) > 0.001) raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [value, max])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={180}
      className={className}
      role="img"
      aria-label={`Yield gauge ${Math.round(value)} percent`}
    />
  )
}
