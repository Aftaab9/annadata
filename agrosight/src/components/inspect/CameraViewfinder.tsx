import { SwitchCamera } from 'lucide-react'
import { ScanOverlay } from '@/components/fx'
import { cn } from '@/lib/cn'

interface CameraViewfinderProps {
  videoRef: React.RefObject<HTMLVideoElement>
  active: boolean
  scanning: boolean
  error: string | null
  onToggleCamera: () => void
  frozenImage?: string | null
}

export function CameraViewfinder({
  videoRef,
  active,
  scanning,
  error,
  onToggleCamera,
  frozenImage,
}: CameraViewfinderProps) {
  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[var(--border-2)] bg-[var(--bg-2)]',
      )}
    >
      {frozenImage ? (
        <img
          src={frozenImage}
          alt="Captured frame"
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={cn(
            'h-full w-full object-cover',
            !active && 'opacity-0',
          )}
        />
      )}

      {!active && !frozenImage && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Starting camera…
          </p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <p className="text-sm text-danger">Camera unavailable</p>
          <p className="text-xs text-muted">{error}</p>
          <p className="text-xs text-dim">Use upload below instead</p>
        </div>
      )}

      <ScanOverlay active={scanning} />

      <button
        type="button"
        onClick={onToggleCamera}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-2)] bg-[var(--surface-2)] backdrop-blur-md transition-colors hover:border-cyan"
        aria-label="Switch camera"
      >
        <SwitchCamera className="h-5 w-5 text-text" />
      </button>
    </div>
  )
}
