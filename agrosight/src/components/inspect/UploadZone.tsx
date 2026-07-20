import { useCallback, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { cn } from '@/lib/cn'

interface UploadZoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

export function UploadZone({ onFile, disabled }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file?.type.startsWith('image/')) onFile(file)
    },
    [onFile],
  )

  return (
    <label
      className={cn(
        'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 transition-colors',
        dragOver
          ? 'border-cyan bg-cyan/5'
          : 'border-[var(--border-2)] bg-[var(--surface)]',
        disabled && 'pointer-events-none opacity-50',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <ImagePlus className="h-6 w-6 text-cyan" aria-hidden />
      <span className="mt-2 text-sm text-muted">or upload an image</span>
      <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-dim">
        drag & drop · jpg png
      </span>
    </label>
  )
}
