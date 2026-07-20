import { useState } from 'react'
import { Smartphone } from 'lucide-react'
import { requestGyroPermission } from '@/hooks/useGyroscopeTilt'
import { isTouchDevice } from '@/lib/motion'

/** One-time iOS gyro permission prompt */
export function GyroPermitButton() {
  const [granted, setGranted] = useState(false)
  const [hidden, setHidden] = useState(!isTouchDevice())

  if (hidden || granted) return null

  const handleClick = async () => {
    const ok = await requestGyroPermission()
    setGranted(ok)
    if (ok) setHidden(true)
  }

  return (
    <button
      id="gyro-permit"
      type="button"
      onClick={handleClick}
      className="fixed bottom-24 right-6 z-40 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-muted backdrop-blur-md"
    >
      <Smartphone className="h-3.5 w-3.5" aria-hidden />
      Enable tilt
    </button>
  )
}
