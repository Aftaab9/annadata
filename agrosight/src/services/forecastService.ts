import type { ForecastSignal } from './types'

export type ForecastSource = 'trained_series' | 'seasonal_heuristic'

export interface ForecastResult extends ForecastSignal {
  source: ForecastSource
  modelLabel: string
}

type SeriesFile = {
  model?: string
  series?: Record<
    string,
    {
      predicted_change_pct: number
      signal: string
      explanation: string
      mape_pct?: number
    }
  >
}

let seriesCache: SeriesFile | null | undefined

async function loadTrainedSeries(): Promise<SeriesFile | null> {
  if (seriesCache !== undefined) return seriesCache
  try {
    const res = await fetch('/data/price_forecast_series.json', { cache: 'no-store' })
    if (!res.ok) {
      seriesCache = null
      return null
    }
    seriesCache = (await res.json()) as SeriesFile
    return seriesCache
  } catch {
    seriesCache = null
    return null
  }
}

function mapSignal(s: string): ForecastSignal['signal'] {
  const u = s.toUpperCase()
  if (u.includes('SELL')) return 'sell_now'
  if (u.includes('WAIT') || u.includes('HOLD')) return 'hold'
  return 'neutral'
}

/** Prefer Colab-trained series when present; else honest seasonal heuristic. */
export async function getPriceForecastAsync(
  modalPrice: number,
  commodity: string,
): Promise<ForecastResult> {
  const file = await loadTrainedSeries()
  const key = Object.keys(file?.series ?? {}).find(
    (k) => k.toLowerCase() === commodity.toLowerCase(),
  )
  const row = key && file?.series ? file.series[key] : undefined
  if (row) {
    return {
      signal: mapSignal(row.signal),
      predicted_change_pct: row.predicted_change_pct,
      explanation: row.explanation,
      source: 'trained_series',
      modelLabel: `${file?.model ?? 'trained'} · MAPE ${row.mape_pct ?? '—'}%`,
    }
  }
  return {
    ...getPriceForecastHeuristic(modalPrice, commodity),
    source: 'seasonal_heuristic',
    modelLabel: 'Seasonal heuristic (not a trained forecast)',
  }
}

/** Sync helper for legacy callers */
export function getPriceForecast(
  modalPrice: number,
  commodity: string,
): ForecastSignal {
  return getPriceForecastHeuristic(modalPrice, commodity)
}

function getPriceForecastHeuristic(
  modalPrice: number,
  commodity: string,
): ForecastSignal {
  const month = new Date().getMonth()
  const isTomatoPeak =
    commodity.toLowerCase() === 'tomato' && month >= 5 && month <= 8

  if (isTomatoPeak) {
    return {
      signal: 'sell_now',
      predicted_change_pct: -8,
      explanation:
        'Heuristic only: tomato prices often soften in monsoon glut. Consider selling graded stock now — replace with Colab forecast file for trained signal.',
    }
  }

  if (modalPrice > 2000) {
    return {
      signal: 'hold',
      predicted_change_pct: 5,
      explanation:
        'Heuristic only: modal is above a simple seasonal average. Monitor daily mandi updates — not a trained LSTM.',
    }
  }

  return {
    signal: 'neutral',
    predicted_change_pct: 0,
    explanation:
      'No strong seasonal heuristic. Compare nearby mandis and use your Produce Grade Card for negotiation. Drop price_forecast_series.json from Colab for a real model.',
  }
}
