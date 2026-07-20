import { useEffect, useRef } from 'react'
import { capDpr, prefersReducedMotion } from '@/lib/motion'

interface ParticleBurstProps {
  trigger: boolean
}

export function ParticleBurst({ trigger }: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!trigger || prefersReducedMotion()) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = capDpr()
    const W = 320
    const H = 320
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const particles = Array.from({ length: 40 }, () => ({
      x: W / 2,
      y: H / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.7) * 12,
      r: Math.random() * 4 + 2,
      alpha: 1,
      color: `hsl(${140 + Math.random() * 30}, 70%, ${50 + Math.random() * 20}%)`,
    }))

    let raf = 0
    const animate = () => {
      ctx.clearRect(0, 0, W, H)
      let alive = false
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.3
        p.alpha -= 0.025
        if (p.alpha > 0) {
          alive = true
          ctx.globalAlpha = p.alpha
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      if (alive) raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)
    if (navigator.vibrate) navigator.vibrate([30, 10, 30])

    return () => cancelAnimationFrame(raf)
  }, [trigger])

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  )
}
