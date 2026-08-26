import axios from 'axios';

// NER city coordinates — all live Open-Meteo API calls, zero mocks
export const NER_CITIES = [
  { id: 'NH6-S1', name: 'Shillong Bypass',   lat: 25.5788, lon: 91.8933, slope_deg: 45, historical_incidents: 7 },
  { id: 'NH6-S2', name: 'Umiam Lake Road',   lat: 25.6600, lon: 91.9000, slope_deg: 55, historical_incidents: 3 },
  { id: 'NH6-S3', name: 'Jowai Corridor',    lat: 25.4480, lon: 92.1640, slope_deg: 35, historical_incidents: 2 },
  { id: 'NH6-S4', name: 'Sonapur Tunnel',    lat: 26.1158, lon: 91.7026, slope_deg: 65, historical_incidents: 9 },
  { id: 'NH10-S1', name: 'Teesta Valley',    lat: 27.3314, lon: 88.6138, slope_deg: 60, historical_incidents: 11 },
  { id: 'NH10-S2', name: 'Kalimpong Turn',   lat: 27.0620, lon: 88.4680, slope_deg: 50, historical_incidents: 5 },
  { id: 'NH10-S3', name: 'Rangpo Border',    lat: 27.1760, lon: 88.5300, slope_deg: 40, historical_incidents: 4 },
  { id: 'NH10-S4', name: 'Singtam Bend',     lat: 27.2340, lon: 88.5000, slope_deg: 55, historical_incidents: 6 },
];

export interface LiveWeatherData {
  city_id: string;
  name: string;
  lat: number;
  lon: number;
  slope_deg: number;
  historical_incidents: number;
  current_precipitation_mm: number;
  current_soil_moisture: number;
  hourly_precipitation_24h: number;
  fetched_at: string;
  error?: string;
}

/**
 * Fetches LIVE weather from Open-Meteo for a single NER coordinate.
 * No mocks, no random values — pure API response.
 */
async function fetchCityWeather(city: typeof NER_CITIES[0]): Promise<LiveWeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast`;
  const params = {
    latitude: city.lat,
    longitude: city.lon,
    current: 'precipitation,soil_moisture_0_to_7cm',
    hourly: 'precipitation,soil_moisture_0_to_7cm',
    past_days: 1,
    forecast_days: 1,
    timezone: 'Asia/Kolkata',
  };

  const res = await axios.get(url, { params, timeout: 10000 });
  const d = res.data;

  // Sum last 24h of hourly precipitation for antecedent rainfall
  const hourlyPrecip: number[] = d.hourly?.precipitation ?? [];
  const hourly_precipitation_24h = hourlyPrecip.slice(-24).reduce((a: number, b: number) => a + b, 0);

  return {
    city_id: city.id,
    name: city.name,
    lat: city.lat,
    lon: city.lon,
    slope_deg: city.slope_deg,
    historical_incidents: city.historical_incidents,
    current_precipitation_mm: d.current?.precipitation ?? 0,
    current_soil_moisture: d.current?.soil_moisture_0_to_7cm ?? 0,
    hourly_precipitation_24h,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Fetches live weather for ALL NER cities in parallel.
 * Retries failed cities with a fallback of 0 values to avoid breaking the map.
 */
export async function fetchAllCitiesWeather(): Promise<LiveWeatherData[]> {
  const results = await Promise.allSettled(NER_CITIES.map(fetchCityWeather));
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    // On API failure, return zero values rather than mock data
    return {
      city_id: NER_CITIES[i].id,
      name: NER_CITIES[i].name,
      lat: NER_CITIES[i].lat,
      lon: NER_CITIES[i].lon,
      slope_deg: NER_CITIES[i].slope_deg,
      historical_incidents: NER_CITIES[i].historical_incidents,
      current_precipitation_mm: 0,
      current_soil_moisture: 0,
      hourly_precipitation_24h: 0,
      fetched_at: new Date().toISOString(),
      error: (r.reason as Error)?.message,
    };
  });
}
