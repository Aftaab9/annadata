import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  Database,
  MapPin,
  MessageCircle,
  Minus,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Volume2,
  Wifi,
} from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { VoiceButton } from '@/components/voice/VoiceButton'
import { useStore } from '@/store/useStore'
import { speak } from '@/lib/speech'
import {
  buildPriceTrends,
  compareMandis,
  getMandiPrices,
  getPriceForecastAsync,
  gradeAdjustedModal,
  pricePerKg,
  priceRange,
  type PriceResult,
} from '@/services'
import type { ForecastResult } from '@/services/forecastService'
import { PriceTrendChart } from '@/components/prices/PriceTrendChart'
import { PricesSkeleton } from '@/components/prices/PricesSkeleton'
import { RevealOnScroll, SplitText, PriceGauge } from '@/components/fx'
import {
  DISTRICTS_BY_STATE,
  INDIAN_STATES,
  MANDI_COMMODITIES,
} from '@/services/types'
import { cn } from '@/lib/cn'

const SOURCE_LABELS: Record<PriceResult['source'], string> = {
  live: 'Agmarknet · data.gov.in',
  cache: 'Cached Agmarknet (6h)',
  snapshot: 'Offline snapshot',
}

const SIGNAL_STYLES = {
  sell_now: {
    label: 'Sell now',
    icon: ArrowDownRight,
    className: 'border-danger/40 bg-danger/10 text-danger',
  },
  hold: {
    label: 'Hold',
    icon: ArrowUpRight,
    className: 'border-harvest/40 bg-harvest/10 text-harvest',
  },
  neutral: {
    label: 'Neutral',
    icon: Minus,
    className: 'border-[var(--border)] bg-[var(--surface-2)] text-muted',
  },
} as const

export default function Prices() {
  const location = useStore((s) => s.location)
  const setLocation = useStore((s) => s.setLocation)
  const setPriceModal = useStore((s) => s.setPriceModal)
  const gradeCard = useStore((s) => s.gradeCard)
  const cvResult = useStore((s) => s.cvResult)
  const language = useStore((s) => s.language)
  const setAssistantOpen = useStore((s) => s.setAssistantOpen)
  const setAssistantPrompt = useStore((s) => s.setAssistantPrompt)

  const [data, setData] = useState<PriceResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forecast, setForecast] = useState<ForecastResult | null>(null)

  const districts =
    DISTRICTS_BY_STATE[location.state] ?? DISTRICTS_BY_STATE.Maharashtra ?? []

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getMandiPrices({
        state: location.state,
        commodity: location.commodity,
        district: location.district,
      })
      setData(result)
      setPriceModal(result.modal_price)
    } catch (e) {
      console.error(e)
      setError('Could not load mandi prices. Using offline data when available.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [location.state, location.commodity, location.district])

  useEffect(() => {
    if (!data) {
      setForecast(null)
      return
    }
    let cancelled = false
    getPriceForecastAsync(data.modal_price, location.commodity).then((f) => {
      if (!cancelled) setForecast(f)
    })
    return () => {
      cancelled = true
    }
  }, [data, location.commodity])

  const ranked = useMemo(
    () => (data ? compareMandis(data.records) : []),
    [data],
  )

  const range = useMemo(
    () => (data ? priceRange(data.records) : { min: 0, max: 4000 }),
    [data],
  )

  const trend7 = useMemo(
    () =>
      data
        ? buildPriceTrends(
            data.modal_price,
            location.commodity,
            location.state,
            7,
          )
        : null,
    [data, location.commodity, location.state],
  )

  const trend30 = useMemo(
    () =>
      data
        ? buildPriceTrends(
            data.modal_price,
            location.commodity,
            location.state,
            30,
          )
        : null,
    [data, location.commodity, location.state],
  )

  const gradePrice =
    data && gradeCard
      ? gradeAdjustedModal(data.modal_price, gradeCard.grade)
      : null

  const signalStyle = forecast ? SIGNAL_STYLES[forecast.signal] : null
  const SignalIcon = signalStyle?.icon ?? TrendingUp

  const priceSpeech = useMemo(() => {
    if (!data) return ''
    if (language === 'hi') {
    return `आज ${location.district} में ${location.commodity} का मंडी भाव ${data.modal_price} रुपये प्रति क्विंटल है, यानी ${pricePerKg(data.modal_price)} रुपये प्रति किलो.`
  }
  return `Today's ${location.commodity} modal price in ${location.district} is ${data.modal_price} rupees per quintal, or ${pricePerKg(data.modal_price)} rupees per kilogram.`
  }, [data, language, location.commodity, location.district])

  const askAboutPrice = (prompt?: string) => {
    const q =
      prompt ??
      (language === 'hi'
        ? `आज ${location.commodity} का भाव क्या है और बेचना चाहिए या रोकना?`
        : `What is today's ${location.commodity} mandi price and should I sell now or hold?`)
    setAssistantPrompt(q)
    setAssistantOpen(true)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28">
      <SectionLabel>Price Transparency</SectionLabel>
      <SplitText as="h1" className="text-3xl font-bold tracking-tight text-text">
        Mandi prices you can trust
      </SplitText>
      <p className="mt-2 text-sm text-muted">
        Live Agmarknet via data.gov.in — cached 6h with offline snapshot fallback.
      </p>

      {gradeCard && (
        <RevealOnScroll immediate className="mt-6">
          <Card className="border-cyan/25 bg-cyan/5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan" aria-hidden />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-cyan">
                  From your inspection · Grade {gradeCard.grade}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Premium-grade batches can negotiate above mandi modal. Estimated fair
                  price for your batch:
                  {gradePrice != null && (
                    <strong className="ml-1 text-harvest">
                      ₹{gradePrice.toLocaleString('en-IN')}/q
                    </strong>
                  )}
                </p>
                {cvResult && (
                  <p className="mt-1 text-xs text-dim">
                    Verdict: {gradeCard.defectLabel} · {gradeCard.confidencePct}%
                    confidence
                  </p>
                )}
              </div>
            </div>
          </Card>
        </RevealOnScroll>
      )}

      <RevealOnScroll immediate className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs text-muted">
          State
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
            value={location.state}
            onChange={(e) => {
              const state = e.target.value
              const nextDistricts = DISTRICTS_BY_STATE[state] ?? []
              setLocation({
                state,
                district: nextDistricts[0] ?? location.district,
              })
            }}
          >
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          District
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
            value={location.district}
            onChange={(e) => setLocation({ district: e.target.value })}
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Commodity
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
            value={location.commodity}
            onChange={(e) => setLocation({ commodity: e.target.value })}
          >
            {MANDI_COMMODITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Button variant="outline" className="w-full" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </Button>
        </div>
      </RevealOnScroll>

      {error && (
        <p className="mt-4 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          {error}
        </p>
      )}

      {loading && !data && <PricesSkeleton />}

      {data && (
        <>
          <RevealOnScroll immediate className="mt-8">
            <Card className="flex flex-col items-center py-6">
              <PriceGauge
                modalPrice={data.modal_price}
                minPrice={range.min}
                maxPrice={range.max}
              />
              <p className="mt-1 font-mono text-sm text-muted">
                ₹{pricePerKg(data.modal_price)} /kg
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest',
                    data.source === 'live'
                      ? 'border-healthy/40 bg-healthy/10 text-healthy'
                      : data.source === 'cache'
                        ? 'border-cyan/40 bg-cyan/10 text-cyan'
                        : 'border-warning/40 bg-warning/10 text-warning',
                  )}
                >
                  {data.source === 'live' ? (
                    <Wifi className="h-3 w-3" aria-hidden />
                  ) : (
                    <Database className="h-3 w-3" aria-hidden />
                  )}
                  {SOURCE_LABELS[data.source]}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
                  {location.commodity} · {location.district}, {location.state}
                </span>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-dim">
                Updated {new Date(data.fetched_at).toLocaleString()}
              </p>
              <p className="mt-1 font-mono text-xs text-dim">
                Range ₹{range.min.toLocaleString('en-IN')} – ₹
                {range.max.toLocaleString('en-IN')} /q across mandis
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speak(priceSpeech, language)}
                >
                  <Volume2 className="h-4 w-4" aria-hidden />
                  {language === 'hi' ? 'भाव सुनें' : 'Hear price'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => askAboutPrice()}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Ask assistant
                </Button>
                <VoiceButton
                  language={language}
                  onTranscript={(text) => askAboutPrice(text)}
                />
              </div>
            </Card>
          </RevealOnScroll>

          {trend7 && trend30 && (
            <RevealOnScroll immediate delay={0.05} className="mt-6">
              <Card>
                <PriceTrendChart trend7={trend7} trend30={trend30} />
              </Card>
            </RevealOnScroll>
          )}

          {forecast && signalStyle && (
            <RevealOnScroll immediate delay={0.08} className="mt-6">
              <Card className={cn('border', signalStyle.className.split(' ')[0])}>
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                      signalStyle.className,
                    )}
                  >
                    <SignalIcon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest">
                      {signalStyle.label}
                      {forecast.predicted_change_pct !== 0 && (
                        <span className="ml-2 opacity-80">
                          ({forecast.predicted_change_pct > 0 ? '+' : ''}
                          {forecast.predicted_change_pct}% est.)
                        </span>
                      )}
                    </p>
                    <p
                      className={cn(
                        'mt-1 font-mono text-[9px] uppercase tracking-widest',
                        forecast.source === 'trained_series'
                          ? 'text-healthy'
                          : 'text-warning',
                      )}
                    >
                      {forecast.modelLabel}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed opacity-90">
                      {forecast.explanation}
                    </p>
                  </div>
                </div>
              </Card>
            </RevealOnScroll>
          )}

          <RevealOnScroll immediate delay={0.1} className="mt-8">
            <Card>
              <h2 className="flex items-center gap-2 font-semibold text-text">
                <MapPin className="h-4 w-4 text-cyan" aria-hidden />
                Nearby mandi comparison
              </h2>
              <p className="mt-1 text-xs text-muted">
                Best modal price highlighted — negotiate with your Grade Card for
                premium tiers.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="font-mono text-[10px] uppercase tracking-widest text-dim">
                      <th className="pb-2 pr-4">Market</th>
                      <th className="pb-2 pr-4">District</th>
                      <th className="pb-2 pr-4">Min ₹/q</th>
                      <th className="pb-2">Modal ₹/q</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((r, i) => (
                      <tr
                        key={`${r.market}-${r.district}`}
                        className={cn(
                          'border-t border-[var(--border)]',
                          i === 0 ? 'bg-healthy/5 text-healthy' : 'text-muted',
                        )}
                      >
                        <td className="py-3 pr-4 font-medium text-text">
                          {r.market}
                          {i === 0 && (
                            <span className="ml-2 rounded bg-healthy/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-healthy">
                              Best
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">{r.district}</td>
                        <td className="py-3 pr-4 font-mono">
                          ₹{r.min_price.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 font-mono font-semibold">
                          ₹{r.modal_price.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ranked.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted">
                    No mandi records for this filter — try another district or commodity.
                  </p>
                )}
              </div>
            </Card>
          </RevealOnScroll>
        </>
      )}

      <div className="mt-8 flex gap-3">
        <Link to="/inspect" className="flex-1 no-underline">
          <Button variant="outline" className="w-full">
            Grade produce first
          </Button>
        </Link>
        <Link to="/market" className="flex-1 no-underline">
          <Button className="w-full">List in market →</Button>
        </Link>
      </div>
    </div>
  )
}
