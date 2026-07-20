import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'
import { isTouchDevice } from '@/lib/motion'

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function MagneticButton({
  children,
  className,
  onClick,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const touch = isTouchDevice()

  useEffect(() => {
    if (touch) return

    const handleMouseMove = (e: MouseEvent) => {
      const btn = ref.current
      if (!btn) return
      const r = btn.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 100) {
        btn.style.transform = `translate(${dx * 0.28}px, ${dy * 0.38}px) scale(1.04)`
      } else {
        btn.style.transform = 'translate(0,0) scale(1)'
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [touch])

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = 'translate(0,0) scale(1)'
  }

  const addRipple = (e: React.PointerEvent<HTMLButtonElement>) => {
    const btn = ref.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const size = Math.max(r.width, r.height) * 2
    const ripple = document.createElement('span')
    ripple.style.cssText = `
      position:absolute;border-radius:50%;pointer-events:none;
      width:${size}px;height:${size}px;
      left:${e.clientX - r.left - size / 2}px;
      top:${e.clientY - r.top - size / 2}px;
      background:rgba(255,255,255,0.18);
      transform:scale(0);animation:ripple 0.55s ease-out forwards;
    `
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn('magnetic-btn', className)}
      onPointerDown={addRipple}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      {...props}
    >
      {children}
    </button>
  )
}
