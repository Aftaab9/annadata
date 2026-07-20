import { useEffect, useState } from 'react'
import { Sprout, FlaskConical, BarChart3, CloudSun } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { RevealOnScroll, SplitText } from '@/components/fx'
import { CropRecPanel } from '@/components/advisory/CropRecPanel'
import { FertilizerPanel } from '@/components/advisory/FertilizerPanel'
import {
  HarvestPanel,
  YieldAdvisoryPanel,
} from '@/components/advisory/HarvestPanel'
import { probeOnnxArtifacts } from '@/lib/onnxProbe'
import { cn } from '@/lib/cn'

type Panel = 'crop' | 'fertilizer' | 'yield' | 'harvest'

const PANELS: { id: Panel; label: string; icon: typeof Sprout; desc: string }[] = [
  { id: 'crop', label: 'Crop', icon: Sprout, desc: 'What to plant' },
  { id: 'fertilizer', label: 'Fertilizer', icon: FlaskConical, desc: 'Soil nutrients' },
  { id: 'yield', label: 'Yield', icon: BarChart3, desc: 'Output forecast' },
  { id: 'harvest', label: 'Harvest', icon: CloudSun, desc: 'Weather window' },
]

export default function Advisory() {
  const [panel, setPanel] = useState<Panel>('crop')
  const [onnx, setOnnx] = useState<{ cropRec: boolean; fertilizer: boolean } | null>(
    null,
  )

  useEffect(() => {
    probeOnnxArtifacts().then(setOnnx)
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28">
      <SectionLabel>Farmer Advisory</SectionLabel>
      <SplitText as="h1" className="text-3xl font-bold tracking-tight text-text">
        Pre-harvest to post-harvest
      </SplitText>
      <p className="mt-2 text-sm text-muted">
        What to plant → soil nutrients → expected yield → harvest weather. Yield engine
        is trained; crop/fertilizer use lookups until you drop Colab ONNX files.
      </p>
      {onnx && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-dim">
          Artifacts · crop ONNX {onnx.cropRec ? 'ready' : 'pending'} · fert ONNX{' '}
          {onnx.fertilizer ? 'ready' : 'pending'}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PANELS.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPanel(id)}
            className={cn(
              'rounded-xl border px-3 py-3 text-left transition-colors',
              panel === id
                ? 'border-cyan/40 bg-cyan/10'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-2)]',
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4',
                panel === id ? 'text-cyan' : 'text-muted',
              )}
              aria-hidden
            />
            <p
              className={cn(
                'mt-2 font-mono text-[10px] uppercase tracking-widest',
                panel === id ? 'text-cyan' : 'text-muted',
              )}
            >
              {label}
            </p>
            <p className="mt-0.5 text-[10px] text-dim">{desc}</p>
          </button>
        ))}
      </div>

      <RevealOnScroll immediate className="mt-6">
        {panel === 'crop' && <CropRecPanel />}
        {panel === 'fertilizer' && <FertilizerPanel />}
        {panel === 'yield' && <YieldAdvisoryPanel />}
        {panel === 'harvest' && <HarvestPanel />}
      </RevealOnScroll>
    </div>
  )
}
