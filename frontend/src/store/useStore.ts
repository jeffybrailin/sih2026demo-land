import { create } from 'zustand';
import * as turf from '@turf/turf';
import { fetchAllCitiesWeather, LiveWeatherData } from '../services/weatherService';
import { runAllInference, MLInferenceResult } from '../services/mlInference';

const POLYGON_OFFSET = 0.045;

function buildPolygon(lat: number, lon: number) {
  return [[
    [lon - POLYGON_OFFSET, lat - POLYGON_OFFSET],
    [lon + POLYGON_OFFSET, lat - POLYGON_OFFSET],
    [lon + POLYGON_OFFSET, lat + POLYGON_OFFSET],
    [lon - POLYGON_OFFSET, lat + POLYGON_OFFSET],
    [lon - POLYGON_OFFSET, lat - POLYGON_OFFSET],
  ]];
}

export interface AppState {
  // Live weather from Open-Meteo (real API)
  weatherData: LiveWeatherData[];
  // ML inference results driven by live weather
  inferenceResults: MLInferenceResult[];
  // GeoJSON derived from inference (drives map polygon colors)
  riskGeoJSON: GeoJSON.FeatureCollection | null;
  // Active RED/ORANGE alerts
  activeAlerts: MLInferenceResult[];
  // User monitoring location
  userLocation: { lat: number; lng: number } | null;
  // Turf.js intersection result
  isAlertActive: boolean;
  intersectedZone: string;
  // Weather fetch state
  weatherStatus: 'idle' | 'fetching' | 'success' | 'error';
  lastWeatherFetch: string;
  // Language
  language: 'en' | 'hi';

  // Actions
  fetchLiveWeather: () => Promise<void>;
  setUserLocation: (loc: { lat: number; lng: number }) => void;
  dismissAlert: () => void;
  setLanguage: (lang: 'en' | 'hi') => void;
}

export const useStore = create<AppState>((set, get) => ({
  weatherData: [],
  inferenceResults: [],
  riskGeoJSON: null,
  activeAlerts: [],
  userLocation: null,
  isAlertActive: false,
  intersectedZone: '',
  weatherStatus: 'idle',
  lastWeatherFetch: '',
  language: 'en',

  fetchLiveWeather: async () => {
    set({ weatherStatus: 'fetching' });
    try {
      // 1. Fetch LIVE Open-Meteo data for all 8 NER cities
      const weatherData = await fetchAllCitiesWeather();

      // 2. Run ML inference on live data
      const inferenceResults = runAllInference(weatherData);

      // 3. Build GeoJSON FeatureCollection with weather-driven colors
      const features: GeoJSON.Feature[] = inferenceResults.map((inf, i) => ({
        type: 'Feature',
        properties: {
          sector_id: inf.sector_id,
          name: inf.name,
          severity: inf.severity,
          color: inf.color,
          risk_score: inf.risk_score,
          fos: inf.fos,
          recommended_action: inf.recommended_action,
          triggered_rules: inf.triggered_rules.join(' | '),
          rainfall_24h: inf.rainfall_24h,
          soil_moisture: inf.soil_moisture,
          slope_deg: inf.slope_deg,
          historical_incidents: inf.historical_incidents,
          current_precipitation_mm: weatherData[i]?.current_precipitation_mm ?? 0,
        },
        geometry: {
          type: 'Polygon',
          coordinates: buildPolygon(weatherData[i]?.lat ?? 0, weatherData[i]?.lon ?? 0),
        },
      }));

      const riskGeoJSON: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
      const activeAlerts = inferenceResults.filter(r => r.severity === 'RED' || r.severity === 'ORANGE');

      set({
        weatherData,
        inferenceResults,
        riskGeoJSON,
        activeAlerts,
        weatherStatus: 'success',
        lastWeatherFetch: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      });

      // 4. Re-check Turf intersection with new data
      get().setUserLocation(get().userLocation!);

    } catch (err) {
      console.error('Live weather fetch failed:', err);
      set({ weatherStatus: 'error' });
    }
  },

  setUserLocation: (loc) => {
    if (!loc) return;
    set({ userLocation: loc });

    const { riskGeoJSON } = get();
    if (!riskGeoJSON) return;

    const point = turf.point([loc.lng, loc.lat]);
    let triggered = false;
    let zoneName = '';

    for (const feature of riskGeoJSON.features) {
      const props = feature.properties as any;
      if (props.severity === 'RED' || props.severity === 'ORANGE') {
        try {
          const poly = turf.polygon((feature.geometry as any).coordinates);
          if (turf.booleanPointInPolygon(point, poly)) {
            triggered = true;
            zoneName = props.name;
            break;
          }
        } catch (_) { /* skip malformed */ }
      }
    }

    set({ isAlertActive: triggered, intersectedZone: zoneName });

    if (triggered && 'vibrate' in navigator) {
      navigator.vibrate([400, 100, 400, 100, 400]);
    }
  },

  dismissAlert: () => set({ isAlertActive: false }),
  setLanguage: (lang) => set({ language: lang }),
}));
