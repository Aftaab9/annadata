import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraFacing = 'environment' | 'user'

interface UseCameraOptions {
  facingMode?: CameraFacing
  enabled?: boolean
}

export function useCamera({ facingMode = 'environment', enabled = true }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facing, setFacing] = useState<CameraFacing>(facingMode)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setActive(false)
  }, [])

  const start = useCallback(async () => {
    if (!enabled) return
    stop()
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setActive(true)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Camera access denied'
      setError(msg)
      setActive(false)
    }
  }, [enabled, facing, stop])

  const toggleFacing = useCallback(() => {
    setFacing((f) => (f === 'environment' ? 'user' : 'environment'))
  }, [])

  useEffect(() => {
    if (enabled) start()
    else stop()
    return stop
  }, [enabled, facing, start, stop])

  return {
    videoRef,
    active,
    error,
    facing,
    toggleFacing,
    restart: start,
    stop,
  }
}

/** Capture current video frame to canvas (224×224 for model input preview) */
export function captureVideoFrame(
  video: HTMLVideoElement,
  size = 224,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const vw = video.videoWidth
  const vh = video.videoHeight
  const side = Math.min(vw, vh)
  const sx = (vw - side) / 2
  const sy = (vh - side) / 2
  ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size)
  return canvas
}

/** Thumbnail for history strip */
export function captureThumbnail(video: HTMLVideoElement, size = 96): string {
  const canvas = captureVideoFrame(video, size)
  return canvas.toDataURL('image/jpeg', 0.7)
}

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}

export function imageToThumbnail(img: HTMLImageElement, size = 96): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const side = Math.min(img.width, img.height)
  const sx = (img.width - side) / 2
  const sy = (img.height - side) / 2
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', 0.7)
}
