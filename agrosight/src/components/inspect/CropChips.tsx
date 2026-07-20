import { cn } from '@/lib/cn'
import type { CropSku } from '@/lib/constants'

interface CropChipsProps {
  crops: CropSku[]
  selected: CropSku
  onSelect: (crop: CropSku) => void
}

export function CropChips({ crops, selected, onSelect }: CropChipsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
      role="listbox"
      aria-label="Select crop SKU"
    >
      {crops.map((crop) => {
        const isSelected = crop.sku === selected.sku
        return (
          <button
            key={crop.sku}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(crop)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-200',
              isSelected
                ? 'border-cyan bg-cyan/10 text-text shadow-[0_0_20px_var(--glow-cyan)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-muted hover:border-[var(--border-2)] hover:text-text',
            )}
          >
            {crop.label}
          </button>
        )
      })}
    </div>
  )
}
