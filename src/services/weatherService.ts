import { WeatherInfo } from '../types';

const WMO: Record<number, { emoji: string; label: string }> = {
  0:  { emoji: '☀️',  label: 'Despejado' },
  1:  { emoji: '🌤️', label: 'Poco nublado' },
  2:  { emoji: '⛅',  label: 'Parcialmente nublado' },
  3:  { emoji: '☁️',  label: 'Nublado' },
  45: { emoji: '🌫️', label: 'Neblina' },
  48: { emoji: '🌫️', label: 'Neblina con escarcha' },
  51: { emoji: '🌦️', label: 'Llovizna leve' },
  53: { emoji: '🌦️', label: 'Llovizna' },
  55: { emoji: '🌧️', label: 'Llovizna intensa' },
  61: { emoji: '🌧️', label: 'Lluvia leve' },
  63: { emoji: '🌧️', label: 'Lluvia moderada' },
  65: { emoji: '🌧️', label: 'Lluvia intensa' },
  71: { emoji: '🌨️', label: 'Nieve leve' },
  73: { emoji: '🌨️', label: 'Nieve' },
  80: { emoji: '🌦️', label: 'Chubascos' },
  95: { emoji: '⛈️', label: 'Tormenta' },
};

function resolveCode(code: number): { emoji: string; label: string } {
  if (WMO[code]) return WMO[code];
  if (code >= 80) return { emoji: '🌧️', label: 'Lluvia' };
  if (code >= 60) return { emoji: '🌧️', label: 'Lluvia' };
  if (code >= 50) return { emoji: '🌦️', label: 'Llovizna' };
  if (code >= 40) return { emoji: '🌫️', label: 'Neblina' };
  if (code >= 1)  return { emoji: '⛅',  label: 'Nublado' };
  return { emoji: '☀️', label: 'Despejado' };
}

interface WeatherCache {
  byDate: Record<string, WeatherInfo>;
  ts: number;
  lat: number;
  lng: number;
}

let cache: WeatherCache | null = null;
const TTL = 30 * 60 * 1000;

export async function fetchWeatherForecast(
  lat: number,
  lng: number,
): Promise<Record<string, WeatherInfo>> {
  if (
    cache &&
    Date.now() - cache.ts < TTL &&
    Math.abs(cache.lat - lat) < 0.05 &&
    Math.abs(cache.lng - lng) < 0.05
  ) {
    return cache.byDate;
  }

  const today   = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 16 * 86_400_000).toISOString().split('T')[0];

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude',   lat.toFixed(4));
  url.searchParams.set('longitude',  lng.toFixed(4));
  url.searchParams.set('daily',      'weather_code,precipitation_probability_max');
  url.searchParams.set('timezone',   'America/Santiago');
  url.searchParams.set('start_date', today);
  url.searchParams.set('end_date',   endDate);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();

    const byDate: Record<string, WeatherInfo> = {};
    (data.daily.time as string[]).forEach((date: string, i: number) => {
      const code   = data.daily.weather_code[i] as number;
      const precip = (data.daily.precipitation_probability_max[i] as number) ?? 0;
      const { emoji, label } = resolveCode(code);
      byDate[date] = { emoji, label, precipChance: precip };
    });

    cache = { byDate, ts: Date.now(), lat, lng };
    return byDate;
  } catch (err) {
    console.warn('Weather fetch failed:', err);
    return {};
  }
}
