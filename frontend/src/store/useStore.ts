import { create } from 'zustand';
import axios from 'axios';
import * as turf from '@turf/turf';

export interface RiskFeature {
  type: 'Feature';
  properties: {
    sector_id: string;
    name: string;
    hazard_score: number;
    severity: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
    color: string;
    slope_deg: number;
    fos: number;
    recommended_action: string;
    rainfall_mm?: number;
    historical_incidents?: number;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: RiskFeature[];
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface AppState {
  forecastRain24h: number;
  antecedentRain7d: number;
  riskZones: GeoJSONCollection | null;
  alerts: any[];
  userLocation: UserLocation | null;
  isAlertActive: boolean;
  alertMessage: string;
  selectedSector: RiskFeature | null;

  setForecastRain24h: (val: number) => void;
  setAntecedentRain7d: (val: number) => void;
  fetchData: () => Promise<void>;
  setUserLocation: (loc: UserLocation) => void;
  checkIntersection: () => void;
  dismissAlert: () => void;
  setSelectedSector: (f: RiskFeature | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  forecastRain24h: 0,
  antecedentRain7d: 0,
  riskZones: null,
  alerts: [],
  userLocation: null,
  isAlertActive: false,
  alertMessage: '',
  selectedSector: null,

  setForecastRain24h: (val) => {
    set({ forecastRain24h: val });
    get().fetchData();
  },
  setAntecedentRain7d: (val) => {
    set({ antecedentRain7d: val });
    get().fetchData();
  },

  fetchData: async () => {
    try {
      const { forecastRain24h, antecedentRain7d } = get();
      const params = { forecast_rain_24h: forecastRain24h, antecedent_rain_7d: antecedentRain7d };

      const [zonesRes, alertsRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/v1/risk-zones', { params }),
        axios.get('http://127.0.0.1:8000/api/v1/alerts', { params })
      ]);

      // Enrich features with mock contextual data
      const enriched: GeoJSONCollection = {
        ...zonesRes.data,
        features: zonesRes.data.features.map((f: RiskFeature) => ({
          ...f,
          properties: {
            ...f.properties,
            rainfall_mm: Math.round(antecedentRain7d + forecastRain24h),
            historical_incidents: Math.floor(Math.random() * 12) + 1,
          }
        }))
      };

      set({ riskZones: enriched, alerts: alertsRes.data.alerts });

      // Re-check intersection after data update
      get().checkIntersection();
    } catch (error) {
      console.error('Error fetching data from backend:', error);
    }
  },

  setUserLocation: (loc) => {
    set({ userLocation: loc });
    get().checkIntersection();
  },

  checkIntersection: () => {
    const { userLocation, riskZones } = get();
    if (!userLocation || !riskZones) return;

    const point = turf.point([userLocation.lng, userLocation.lat]);
    let triggered = false;
    let message = '';

    for (const feature of riskZones.features) {
      if (feature.properties.severity === 'RED' || feature.properties.severity === 'ORANGE') {
        try {
          const poly = turf.polygon(feature.geometry.coordinates);
          if (turf.booleanPointInPolygon(point, poly)) {
            triggered = true;
            message = `⚠️ WARNING: High Landslide Probability Detected in ${feature.properties.name} Zone.`;
            break;
          }
        } catch (_) { /* skip malformed */ }
      }
    }

    set({ isAlertActive: triggered, alertMessage: message });

    if (triggered && 'vibrate' in navigator) {
      navigator.vibrate([300, 100, 300]);
    }
  },

  dismissAlert: () => set({ isAlertActive: false }),
  setSelectedSector: (f) => set({ selectedSector: f }),
}));
