import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Apple, Leaf, Loader2, RotateCcw, ShieldCheck } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Button } from '@/components/ui/Button'
import { CROPS } from '@/lib/constants'
import {
  classifyImage,
  getInferenceMode,
  getModelLoadError,
  getMockReason,
  isModelReady,
  isUsingMock,
  loadModel,
  subscribeInferenceState,
  type ClassificationResult,
  type InferenceMode,
} from '@/lib/inference'
import {
  buildGradeCard,
  buildProduceGradeCard,
  type GradeCardData,
} from '@/lib/gradeCard'
import {
  classifyProduce,
  getProduceLoadError,
  isProduceUsingMock,
  loadProduceModel,
  PRODUCE_LABELS,
  subscribeProduceState,
} from '@/lib/produceInference'
import { INSPECT_MODE_COPY, type InspectMode } from '@/lib/inspectMode'
import { SplitText } from '@/components/fx'
import { useStore } from '@/store/useStore'
import {
  captureThumbnail,
  captureVideoFrame,
  fileToImage,
  imageToThumbnail,
  useCamera,
} from '@/hooks/useCamera'
import { CropChips } from '@/components/inspect/CropChips'
import { CameraViewfinder } from '@/components/inspect/CameraViewfinder'
import { UploadZone } from '@/components/inspect/UploadZone'
import { InspectResultCard } from '@/components/inspect/InspectResultCard'
import { HistoryStrip } from '@/components/inspect/HistoryStrip'
import { cn } from '@/lib/cn'

type InspectPhase = 'live' | 'scanning' | 'result' | 'failed'

export default function Inspect() {
  const selectedCrop = useStore((s) => s.selectedCrop)
  const setSelectedCrop = useStore((s) => s.setSelectedCrop)
  const addInspection = useStore((s) => s.addInspection)
  const inspectionHistory = useStore((s) => s.inspectionHistory)
  const setCvResult = useStore((s) => s.setCvResult)
  const setGradeCard = useStore((s) => s.setGradeCard)
  const setYieldParams = useStore((s) => s.setYieldParams)
  const setDefectRateAutoFilled = useStore((s) => s.setDefectRateAutoFilled)

  const [mode, setMode] = useState<InspectMode>('produce')
  const [produceLoading, setProduceLoading] = useState(true)
  const [phase, setPhase] = useState<InspectPhase>('live')
  const [modelLoading, setModelLoading] = useState(true)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [gradeCard, setLocalGradeCard] = useState<GradeCardData | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inferenceMode, setInferenceMode] = useState<InferenceMode>('loading')
  const [produceMock, setProduceMock] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const lastSourceRef = useRef<HTMLCanvasElement | HTMLImageElement | null>(null)
  const [searchParams] = useSearchParams()
  const verifyId = searchParams.get('verify')

  const cameraEnabled = phase === 'live' || phase === 'scanning' || phase === 'failed'
  const { videoRef, active, error: cameraError, toggleFacing } = useCamera({
    enabled: cameraEnabled && !frozenFrame,
  })

  const modeCopy = INSPECT_MODE_COPY[mode]

  useEffect(() => {
    const sync = () => {
      setInferenceMode(getInferenceMode())
      setModelLoading(getInferenceMode() === 'loading')
    }
    loadModel(true).then(sync).finally(() => setModelLoading(false))
    return subscribeInferenceState(sync)
  }, [])

  useEffect(() => {
    setProduceLoading(true)
    loadProduceModel(true)
      .then(() => setProduceMock(isProduceUsingMock()))
      .finally(() => setProduceLoading(false))
    const unsub = subscribeProduceState(() => setProduceMock(isProduceUsingMock()))
    return () => {
      unsub()
    }
  }, [])

  const runInference = useCallback(
    async (
      source: HTMLCanvasElement | HTMLImageElement,
      thumbnail: string,
    ) => {
      setError(null)
      setPhase('scanning')
      setFrozenFrame(thumbnail)
      setPreviewUrl(thumbnail)
      setResult(null)
      setLocalGradeCard(null)
      setGradeCard(null)
      lastSourceRef.current = source

      if (navigator.vibrate) navigator.vibrate(15)

      try {
        await new Promise((r) => setTimeout(r, 600))
        const inspectionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const issuedAt = new Date().toISOString()

        if (mode === 'produce') {
          const produce = await classifyProduce(source)
          // Map produce → ClassificationResult shape for shared UI/store
          const asCv: ClassificationResult = {
            class:
              produce.class === 'FRESH'
                ? 'HEALTHY'
                : produce.class === 'BORDERLINE'
                  ? 'SURFACE_DEFECT'
                  : 'BLIGHT_MOLD',
            confidence: produce.confidence,
            probabilities: {
              HEALTHY: produce.probabilities.FRESH,
              SURFACE_DEFECT: produce.probabilities.BORDERLINE,
              BLIGHT_MOLD: produce.probabilities.ROTTEN,
            },
            inferenceMs: produce.inferenceMs,
            mock: produce.mock,
          }
          const card = buildProduceGradeCard(
            produce,
            selectedCrop,
            inspectionId,
            PRODUCE_LABELS[produce.class],
            issuedAt,
          )
          setResult(asCv)
          setCvResult(asCv)
          setLocalGradeCard(card)
          setGradeCard(card)
          setYieldParams({
            defect_rate_pct: produce.defectRatePct,
            raw_material_grade:
              produce.grade === 'A' ? 5 : produce.grade === 'B' ? 3 : 1,
          })
          setDefectRateAutoFilled(true)
          setPhase('result')
          addInspection({
            id: inspectionId,
            timestamp: Date.now(),
            crop: selectedCrop.label,
            result: asCv,
            thumbnail,
          })
        } else {
          const classification = await classifyImage(source)
          const card = buildGradeCard(
            classification,
            selectedCrop,
            inspectionId,
            issuedAt,
          )
          setResult(classification)
          setCvResult(classification)
          setLocalGradeCard(card)
          setGradeCard(card)
          setYieldParams({
            defect_rate_pct: card.defectRatePct,
            raw_material_grade:
              classification.class === 'HEALTHY'
                ? 5
                : classification.class === 'SURFACE_DEFECT'
                  ? 3
                  : 1,
          })
          setDefectRateAutoFilled(true)
          setPhase('result')
          addInspection({
            id: inspectionId,
            timestamp: Date.now(),
            crop: selectedCrop.label,
            result: classification,
            thumbnail,
          })
        }

        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        })
      } catch (err) {
        console.error('Inference failed:', err)
        setError(
          err instanceof Error ? err.message : 'Analysis failed. Try another image.',
        )
        setPhase('failed')
      }
    },
    [
      addInspection,
      mode,
      selectedCrop,
      setCvResult,
      setDefectRateAutoFilled,
      setGradeCard,
      setYieldParams,
    ],
  )

  const handleCapture = useCallback(async () => {
    const video = videoRef.current
    if (!video || !active) return
    const canvas = captureVideoFrame(video)
    const thumb = captureThumbnail(video)
    await runInference(canvas, thumb)
  }, [active, runInference, videoRef])

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        setError(null)
        const img = await fileToImage(file)
        const thumb = imageToThumbnail(img, 160)
        await runInference(img, thumb)
      } catch (err) {
        console.error('Upload failed:', err)
        setError('Could not read image. Use JPG or PNG.')
        setPhase('failed')
      }
    },
    [runInference],
  )

  const handleReset = useCallback(() => {
    setPhase('live')
    setResult(null)
    setLocalGradeCard(null)
    setPreviewUrl(null)
    setFrozenFrame(null)
    setError(null)
    setGradeCard(null)
    lastSourceRef.current = null
  }, [setGradeCard])

  const handleRetry = useCallback(async () => {
    const source = lastSourceRef.current
    if (!source || !previewUrl) {
      handleReset()
      return
    }
    await runInference(source, previewUrl)
  }, [handleReset, previewUrl, runInference])

  const switchMode = (next: InspectMode) => {
    setMode(next)
    handleReset()
  }

  const busy = phase === 'scanning' || modelLoading
  const showCapture = phase === 'live' || phase === 'scanning' || phase === 'failed'
  const modelReady =
    mode === 'leaf' ? isModelReady() : true /* produce always runnable (mock or real) */

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28">
      <SectionLabel>Quality Inspection</SectionLabel>
      <SplitText as="h1" className="text-3xl font-bold tracking-tight text-text">
        Inspect Batch
      </SplitText>
      <p className="mt-2 text-sm text-muted">
        Two real jobs, two models:{' '}
        <strong className="text-text">Leaf Health</strong> (disease in the field) and{' '}
        <strong className="text-text">Produce Quality</strong> (grade harvested batch).
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2">
        {(
          [
            { id: 'leaf' as const, icon: Leaf },
            { id: 'produce' as const, icon: Apple },
          ] as const
        ).map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchMode(id)}
            className={cn(
              'rounded-xl border px-3 py-3 text-left transition-colors',
              mode === id
                ? 'border-cyan/40 bg-cyan/10'
                : 'border-[var(--border)] bg-[var(--surface)]',
            )}
          >
            <Icon
              className={cn('h-4 w-4', mode === id ? 'text-cyan' : 'text-muted')}
              aria-hidden
            />
            <p
              className={cn(
                'mt-2 font-mono text-[10px] uppercase tracking-widest',
                mode === id ? 'text-cyan' : 'text-muted',
              )}
            >
              {INSPECT_MODE_COPY[id].title}
            </p>
            <p className="mt-0.5 text-[10px] text-dim">
              {INSPECT_MODE_COPY[id].subtitle}
            </p>
          </button>
        ))}
      </div>

      <p className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs leading-relaxed text-muted">
        {modeCopy.hint}
      </p>

      <div className="mt-6">
        <CropChips
          crops={CROPS}
          selected={selectedCrop}
          onSelect={setSelectedCrop}
        />
      </div>

      {mode === 'leaf' && modelLoading && (
        <div className="mt-4 flex items-center gap-2 font-mono text-xs text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-cyan" aria-hidden />
          Loading PlantVillage TFLite…
        </div>
      )}

      {mode === 'leaf' && !modelLoading && inferenceMode === 'tflite' && (
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-healthy">
          ● Leaf Health · live TFLite
        </p>
      )}

      {mode === 'produce' && produceLoading && (
        <div className="mt-4 flex items-center gap-2 font-mono text-xs text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-cyan" aria-hidden />
          Loading Produce TFLite (~90 MB) — wait for Live badge before testing…
        </div>
      )}

      {mode === 'produce' && !produceLoading && (
        <p
          className={cn(
            'mt-4 font-mono text-xs uppercase tracking-widest',
            produceMock ? 'text-warning' : 'text-healthy',
          )}
        >
          {produceMock
            ? '● Produce Quality · DEMO heuristic (TFLite missing or failed)'
            : '● Produce Quality · live TFLite · expect Fresh / Borderline / Spoiled (not leaf blight)'}
        </p>
      )}

      {mode === 'produce' && produceMock && (
        <button
          type="button"
          className="mt-2 rounded-lg border border-[var(--border-2)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan"
          onClick={() => {
            setProduceLoading(true)
            loadProduceModel(true)
              .then(() => setProduceMock(isProduceUsingMock()))
              .finally(() => setProduceLoading(false))
          }}
        >
          Retry produce TFLite load
        </button>
      )}

      {mode === 'leaf' && !modelLoading && isUsingMock() && (
        <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-muted">
          <p className="font-mono text-[10px] uppercase tracking-widest text-warning">
            {getMockReason() === 'missing_file'
              ? 'Mock leaf CV — TFLite file not found'
              : 'Mock leaf CV — TFLite failed to load'}
          </p>
          {getModelLoadError() && (
            <p className="mt-1 text-xs text-dim">{getModelLoadError()}</p>
          )}
          <button
            type="button"
            disabled={retrying}
            onClick={() => {
              setRetrying(true)
              setModelLoading(true)
              loadModel(true)
                .then(() => setInferenceMode(getInferenceMode()))
                .finally(() => {
                  setModelLoading(false)
                  setRetrying(false)
                })
            }}
            className="mt-3 rounded-lg border border-[var(--border-2)] px-4 py-2 font-mono text-xs uppercase tracking-widest text-cyan"
          >
            {retrying ? 'Loading…' : 'Retry TFLite load'}
          </button>
        </div>
      )}

      {mode === 'produce' && produceMock && getProduceLoadError() && (
        <p className="mt-2 text-xs text-dim">{getProduceLoadError()}</p>
      )}

      {verifyId && phase !== 'result' && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3 text-sm text-muted">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan" aria-hidden />
          <p>
            Verifying Grade Card <span className="font-mono text-cyan">{verifyId}</span>.
          </p>
        </div>
      )}

      {phase === 'result' && result && gradeCard && (
        <InspectResultCard
          result={result}
          crop={selectedCrop}
          gradeCard={gradeCard}
          previewUrl={previewUrl ?? undefined}
          onReset={handleReset}
          inspectMode={mode}
        />
      )}

      {phase === 'failed' && (
        <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-danger">
            Analysis failed
          </p>
          <p className="mt-2 text-sm text-danger" role="alert">
            {error ?? 'Something went wrong.'}
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Start over
            </Button>
            <Button className="flex-1" onClick={handleRetry} disabled={busy}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {showCapture && (
        <>
          <div className="relative mt-4">
            <CameraViewfinder
              videoRef={videoRef}
              active={active}
              scanning={phase === 'scanning'}
              error={cameraError}
              onToggleCamera={toggleFacing}
              frozenImage={frozenFrame}
            />
            {phase === 'scanning' && (
              <div className="absolute inset-x-0 top-4 z-20 mx-auto w-fit rounded-full border border-cyan/40 bg-[var(--bg)]/90 px-4 py-2 backdrop-blur-md">
                <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-cyan">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {mode === 'leaf' ? 'Leaf health…' : 'Produce grade…'}{' '}
                  {selectedCrop.label}
                </p>
              </div>
            )}
          </div>

          {phase !== 'failed' && (
            <>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  disabled={!active || busy || !modelReady}
                  onClick={handleCapture}
                  className={cn(
                    'capture-btn flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-[var(--border-2)] bg-accent shadow-[0_0_40px_var(--glow-cyan)] transition-transform',
                    'enabled:active:scale-95 enabled:hover:scale-105',
                    'disabled:cursor-not-allowed disabled:opacity-40',
                  )}
                  aria-label="Capture and inspect"
                >
                  <span className="h-14 w-14 rounded-full border-2 border-white/30 bg-white/10" />
                </button>
              </div>
              <div className="mt-6">
                <UploadZone onFile={handleUpload} disabled={busy} />
              </div>
            </>
          )}
        </>
      )}

      <HistoryStrip records={inspectionHistory} />
    </div>
  )
}
