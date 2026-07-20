import { useEffect, useRef } from 'react'
import { capDpr, prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/cn'

interface AuroraBgProps {
  className?: string
}

export function AuroraBg({ className }: AuroraBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let t = 0
    let raf = 0

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = capDpr()
      w = parent.clientWidth
      h = parent.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      t += 0.008
      ctx.clearRect(0, 0, w, h)

      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        for (let x = 0; x <= w; x += 4) {
          const y =
            h * 0.5 +
            Math.sin(x * 0.008 + t + i) * 40 +
            Math.sin(x * 0.015 + t * 1.3 + i * 2) * 25
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.lineTo(w, h)
        ctx.lineTo(0, h)
        ctx.closePath()
        const colors = [
          'oklch(0.55 0.12 175 / 0.12)',
          'oklch(0.5 0.1 145 / 0.1)',
          'oklch(0.48 0.08 95 / 0.08)',
        ]
        ctx.fillStyle = colors[i] ?? colors[0]!
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none absolute inset-0', className)}
      aria-hidden
    />
  )
}
