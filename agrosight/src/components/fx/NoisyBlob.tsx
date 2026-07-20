import { useEffect, useRef } from 'react'
import { capDpr, isTouchDevice, prefersReducedMotion } from '@/lib/motion'

interface NoisyBlobProps {
  color1?: string
  color2?: string
  size?: number
  className?: string
}

export function NoisyBlob({
  color1 = '#6366f1',
  color2 = '#06b6d4',
  size = 300,
  className,
}: NoisyBlobProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    let raf = 0
    let t = 0

    const run = async () => {
      const { createNoise2D } = await import('simplex-noise')
      if (cancelled) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = capDpr()
      canvas.width = size * dpr
      canvas.height = size * dpr
      ctx.scale(dpr, dpr)

      const noise = createNoise2D()
      const points = isTouchDevice() ? 40 : 80

      const draw = () => {
        t += 0.004
        ctx.clearRect(0, 0, size, size)
        const cx = size / 2
        const cy = size / 2
        const baseR = size * 0.32

        ctx.beginPath()
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2
          const n = noise(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9 + t)
          const r = baseR + n * size * 0.12
          const x = cx + Math.cos(angle) * r
          const y = cy + Math.sin(angle) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()

        const grad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, baseR + 40)
        grad.addColorStop(0, `${color1}cc`)
        grad.addColorStop(0.6, `${color2}88`)
        grad.addColorStop(1, `${color2}11`)
        ctx.fillStyle = grad
        ctx.fill()

        raf = requestAnimationFrame(draw)
      }
      draw()
    }

    run()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [color1, color2, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      aria-hidden
      style={{
        position: 'absolute',
        opacity: 0.6,
        filter: 'blur(8px)',
        pointerEvents: 'none',
      }}
    />
  )
}
