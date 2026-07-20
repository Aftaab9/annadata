import { type RefObject, useEffect } from 'react'
import { isTouchDevice } from '@/lib/motion'

type OrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>
}

/**
 * Gyroscope tilt for mobile TiltCard instances.
 * iOS 13+ requires user gesture — call requestGyroPermission() from a button.
 */
export function useGyroscopeTilt(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    if (!enabled || !isTouchDevice() || !ref.current) return

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (!ref.current) return
      const tiltX = Math.max(-20, Math.min(20, (e.gamma ?? 0) / 2))
      const tiltY = Math.max(-15, Math.min(15, (e.beta ?? 0) / 3))
      ref.current.style.transform = `perspective(800px) rotateY(${tiltX}deg) rotateX(${-tiltY}deg)`
    }

    window.addEventListener('deviceorientation', onOrientation, { passive: true })
    return () => window.removeEventListener('deviceorientation', onOrientation)
  }, [ref, enabled])
}

export async function requestGyroPermission(): Promise<boolean> {
  const DOE = DeviceOrientationEvent as OrientationEventWithPermission
  if (typeof DOE.requestPermission === 'function') {
    try {
      const state = await DOE.requestPermission()
      return state === 'granted'
    } catch {
      return false
    }
  }
  return true
}
