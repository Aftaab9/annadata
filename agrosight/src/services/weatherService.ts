import type { WeatherResult } from './types'
import { DISTRICT_COORDS } from './types'

export async function getHarvestWeather(
  lat?: number,
  lon?: number,
  district = 'Pune',
): Promise<WeatherResult> {
  const coords = DISTRICT_COORDS[district] ?? DISTRICT_COORDS.Pune!
  const useLat = lat ?? coords.lat
  const useLon = lon ?? coords.lon

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${useLat}&longitude=${useLon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
      `&timezone=Asia%2FKolkata&forecast_days=7`

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)

    const json = (await res.json()) as {
      daily: {
        time: string[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        precipitation_sum: number[]
        weathercode: number[]
      }
    }

    const d = json.daily
    const days = d.time.map((date, i) => ({
      date,
      temp_max: d.temperature_2m_max[i] ?? 0,
      temp_min: d.temperature_2m_min[i] ?? 0,
      precipitation_mm: d.precipitation_sum[i] ?? 0,
      weather_code: d.weathercode[i] ?? 0,
    }))

    const heavyRainDays = days.filter((day) => day.precipitation_mm > 15).length
    let harvest_advice: string
    if (heavyRainDays >= 2) {
      harvest_advice =
        'Heavy rain expected in the next week — harvest mature batches early and ensure covered drying to avoid moisture defects.'
    } else if (days[0] && days[0].temp_max > 38) {
      harvest_advice =
        'High heat forecast — harvest in early morning, move to shade quickly to preserve grade.'
    } else {
      harvest_advice =
        'Weather window looks favourable for harvest and field drying over the next 7 days.'
    }

    return { days, harvest_advice, source: 'live' }
  } catch (err) {
    console.warn('[weatherService] fallback:', err)
    return {
      days: [],
      harvest_advice:
        'Weather advisory unavailable offline. Check local IMD bulletin before scheduling harvest.',
      source: 'snapshot',
    }
  }
}
