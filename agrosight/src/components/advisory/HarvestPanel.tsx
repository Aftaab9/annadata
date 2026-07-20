import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CloudRain, Scan, Sun } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { getHarvestWeather, type WeatherResult } from '@/services'
import { cn } from '@/lib/cn'

function weatherEmoji(code: number): string {
  if (code >= 80) return '🌧️'
  if (code >= 60) return '🌦️'
  if (code >= 30) return '⛈️'
  if (code >= 10) return '🌫️'
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  return '🌤️'
}

export function HarvestPanel() {
  const location = useStore((s) => s.location)
  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getHarvestWeather(undefined, undefined, location.district)
      .then(setWeather)
      .finally(() => setLoading(false))
  }, [location.district])

  const heavyRain = weather?.days.filter((d) => d.precipitation_mm > 15).length ?? 0

  return (
    <div className="space-y-4">
      <Card>
        <p className="font-mono text-[10px] uppercase tracking-widest text-cyan">
          Open-Meteo · 7-day harvest window
        </p>
        <p className="mt-1 text-xs text-dim">
          {location.district}, {location.state}
          {weather?.source === 'live' ? ' · live forecast' : ' · offline fallback'}
        </p>

        {loading && (
          <p className="mt-6 animate-pulse text-sm text-muted">Loading forecast…</p>
        )}

        {!loading && weather && (
          <>
            <div
              className={cn(
                'mt-4 rounded-xl border p-4 text-sm leading-relaxed',
                heavyRain >= 2
                  ? 'border-warning/40 bg-warning/10 text-warning'
                  : 'border-healthy/30 bg-healthy/5 text-muted',
              )}
            >
              {weather.harvest_advice}
            </div>

            {weather.days.length > 0 && (
              <div className="mt-5 grid grid-cols-7 gap-1.5">
                {weather.days.map((d) => (
                  <div
                    key={d.date}
                    className={cn(
                      'rounded-xl border p-2 text-center',
                      d.precipitation_mm > 15
                        ? 'border-warning/30 bg-warning/5'
                        : 'border-[var(--border)] bg-[var(--surface)]',
                    )}
                  >
                    <p className="font-mono text-[9px] text-dim">{d.date.slice(5)}</p>
                    <p className="mt-1 text-lg" aria-hidden>
                      {weatherEmoji(d.weather_code)}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-cyan">
                      {Math.round(d.temp_max)}°
                    </p>
                    <p className="font-mono text-[9px] text-muted">
                      {Math.round(d.precipitation_mm)}mm
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-4 font-mono text-[10px] uppercase tracking-widest text-dim">
              <span className="flex items-center gap-1">
                <Sun className="h-3 w-3" aria-hidden /> Max temp
              </span>
              <span className="flex items-center gap-1">
                <CloudRain className="h-3 w-3" aria-hidden /> Daily rain
              </span>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export function YieldAdvisoryPanel() {
  const cvResult = useStore((s) => s.cvResult)
  const defectRateAutoFilled = useStore((s) => s.defectRateAutoFilled)
  const yieldParams = useStore((s) => s.yieldParams)
  const selectedCrop = useStore((s) => s.selectedCrop)
  const yieldPrediction = useStore((s) => s.yieldPrediction)

  return (
    <Card>
      <p className="font-mono text-[10px] uppercase tracking-widest text-cyan">
        Yield predictor · trained regression
      </p>
      <p className="mt-2 text-sm text-muted">
        Seven processing parameters for{' '}
        <strong className="text-text">{selectedCrop.label}</strong> batches — defect
        rate auto-fills from your last inspection.
      </p>

      {defectRateAutoFilled && cvResult ? (
        <div className="mt-4 rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-cyan">
            CV pipeline linked
          </p>
          <p className="mt-1 text-sm text-muted">
            Defect rate <strong className="text-text">{yieldParams.defect_rate_pct}%</strong>{' '}
            from inspect verdict ·{' '}
            {yieldPrediction
              ? `predicted yield ${yieldPrediction.yield_pct}%`
              : 'open simulator to run'}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-muted">
          <Scan className="mb-1 inline h-4 w-4 text-dim" aria-hidden /> No inspection
          linked yet —{' '}
          <Link to="/inspect" className="text-cyan no-underline hover:underline">
            inspect a batch
          </Link>{' '}
          to auto-fill defect rate.
        </div>
      )}

      <Link to="/yield" className="mt-5 inline-flex w-full no-underline">
        <Button className="w-full">
          Open yield simulator
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </Link>
    </Card>
  )
}
