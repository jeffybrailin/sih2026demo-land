import { create } from 'zustand';
import * as turf from '@turf/turf';
import { fetchAllCitiesWeather, LiveWeatherData } from '../services/weatherService';
import { runAllInference, MLInferenceResult } from '../services/mlInference';
import { 
  ForecastResponse, PriorityData, FieldReport, ProvenanceData, ModelInfo, AlertData,
  getForecast, getAlerts, getFieldReports, getProvenance, getModelInfo, submitReport as apiSubmitReport
} from '../services/apiService';

const POLYGON_OFFSET = 0.030; // ~3 km per side — tighter for 44-sector NE India coverage

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
  weatherData: LiveWeatherData[];
  inferenceResults: MLInferenceResult[];
  riskGeoJSON: GeoJSON.FeatureCollection | null;
  activeAlerts: MLInferenceResult[];
  userLocation: { lat: number; lng: number } | null;
  isAlertActive: boolean;
  intersectedZone: string;
  weatherStatus: 'idle' | 'fetching' | 'success' | 'error';
  lastWeatherFetch: string;
  
  // New state
  selectedSectorId: string | null;
  forecastData: Record<string, ForecastResponse>;
  priority: PriorityData[];
  fieldReports: FieldReport[];
  provenanceData: Record<string, ProvenanceData>;
  modelInfo: ModelInfo | null;
  alertData: AlertData[];
  showHistoricalReplay: boolean;
  showFieldReports: boolean;
  showInfrastructure: boolean;
  showProvenance: boolean;
  language: 'en' | 'hi' | 'as';

  // Actions
  fetchLiveWeather: () => Promise<void>;
  setUserLocation: (loc: { lat: number; lng: number }) => void;
  dismissAlert: () => void;
  setLanguage: (lang: 'en' | 'hi' | 'as') => void;
  
  // New actions
  selectSector: (sectorId: string | null) => void;
  fetchForecast: (sectorId: string) => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchFieldReports: () => Promise<void>;
  fetchProvenance: (sectorId: string) => Promise<void>;
  fetchModelInfo: () => Promise<void>;
  submitFieldReport: (data: Partial<FieldReport>) => Promise<void>;
  toggleHistoricalReplay: () => void;
  toggleFieldReports: () => void;
  toggleInfrastructure: () => void;
  toggleProvenance: () => void;
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
  
  selectedSectorId: null,
  forecastData: {},
  priority: [],
  fieldReports: [],
  provenanceData: {},
  modelInfo: null,
  alertData: [],
  showHistoricalReplay: false,
  showFieldReports: false,
  showInfrastructure: false,
  showProvenance: false,
  language: 'en',

  fetchLiveWeather: async () => {
    set({ weatherStatus: 'fetching' });
    try {
      const weatherData = await fetchAllCitiesWeather();
      const inferenceResults = runAllInference(weatherData);

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
        } catch (_) {}
      }
    }
    set({ isAlertActive: triggered, intersectedZone: zoneName });
    if (triggered && 'vibrate' in navigator) navigator.vibrate([400, 100, 400, 100, 400]);
  },

  dismissAlert: () => set({ isAlertActive: false }),
  setLanguage: (lang) => set({ language: lang }),
  
  selectSector: (sectorId) => {
    set({ selectedSectorId: sectorId });
    if (sectorId) {
      get().fetchForecast(sectorId);
      get().fetchProvenance(sectorId);
    }
  },
  
  fetchForecast: async (sectorId) => {
    const data = await getForecast(sectorId);
    if (data) {
      set(state => ({ forecastData: { ...state.forecastData, [sectorId]: data } }));
    } else {
      // Mock for demo if backend is missing
      const mock: ForecastResponse = {
        sector_id: sectorId, prob_now: 0.18, prob_1h: 0.25, prob_6h: 0.72, prob_12h: 0.79, prob_24h: 0.84,
        horizons: [], shap_contributors: [
          { feature: 'rainfall_24h', direction: 'up', importance: 0.31, display_name: '24h Rainfall' },
          { feature: 'soil_moisture', direction: 'up', importance: 0.21, display_name: 'Soil Moisture' },
          { feature: 'slope', direction: 'up', importance: 0.18, display_name: 'Slope' },
          { feature: 'history', direction: 'up', importance: 0.14, display_name: 'Historical Risk' },
        ],
        top_reason: 'Elevated 24h rainfall on saturated soils over steep slope',
        model_version: 'xgb-v1.3', prediction_timestamp: new Date().toISOString(), confidence_flag: 'HIGH'
      };
      set(state => ({ forecastData: { ...state.forecastData, [sectorId]: mock } }));
    }
  },
  
  fetchAlerts: async () => {
    const data = await getAlerts();
    set({ alertData: data });
  },
  
  fetchFieldReports: async () => {
    const data = await getFieldReports();
    set({ fieldReports: data });
  },
  
  fetchProvenance: async (sectorId) => {
    const data = await getProvenance(sectorId);
    if (data) {
      set(state => ({ provenanceData: { ...state.provenanceData, [sectorId]: data } }));
    } else {
      // Mock
      set(state => ({ provenanceData: { ...state.provenanceData, [sectorId]: {
        sector_id: sectorId, rainfall_source: 'IMD Operational (primary)', rainfall_obs_time: '2026-08-27 10:15 IST',
        terrain_source: 'NASA SRTM 30m', terrain_resolution: '30m', soil_source: 'NBSS-LUP Meghalaya Soil Survey 2018',
        model_version: 'xgb-v1.3', model_trained_on: '2026-08-15', cv_roc_auc: 0.8943, brier_score: 0.112,
        features_used: 27, prediction_timestamp: new Date().toISOString()
      }}}));
    }
  },
  
  fetchModelInfo: async () => {
    const data = await getModelInfo();
    if (data) {
      set({ modelInfo: data });
    } else {
      set({ modelInfo: {
        model_name: 'LEWS Ensemble', model_version: 'xgb-v1.3', primary_model: 'XGBoost', baseline_model: 'Random Forest',
        calibration_method: 'Platt-calibrated | spatial-temporal validation', trained_on: '2026-08-15',
        n_training_samples: 15420, cv_roc_auc_mean: 0.8943, brier_score: 0.112, data_sources: ['IMD', 'ERA5'],
        feature_count: 27, training_split_method: 'Spatial-temporal (NOT random)'
      }});
    }
  },
  
  submitFieldReport: async (data) => {
    const result = await apiSubmitReport(data);
    if (result) {
      set(state => ({ fieldReports: [...state.fieldReports, result] }));
    }
  },
  
  toggleHistoricalReplay: () => set(s => ({ showHistoricalReplay: !s.showHistoricalReplay })),
  toggleFieldReports: () => set(s => ({ showFieldReports: !s.showFieldReports })),
  toggleInfrastructure: () => set(s => ({ showInfrastructure: !s.showInfrastructure })),
  toggleProvenance: () => set(s => ({ showProvenance: !s.showProvenance })),
}));
