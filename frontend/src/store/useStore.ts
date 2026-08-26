import { create } from 'zustand';
import axios from 'axios';

interface AppState {
  forecastRain24h: number;
  antecedentRain7d: number;
  riskZones: any;
  alerts: any[];
  setForecastRain24h: (val: number) => void;
  setAntecedentRain7d: (val: number) => void;
  fetchData: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  forecastRain24h: 0,
  antecedentRain7d: 0,
  riskZones: null,
  alerts: [],
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
        axios.get('http://localhost:8000/api/v1/risk-zones', { params }),
        axios.get('http://localhost:8000/api/v1/alerts', { params })
      ]);
      
      set({ riskZones: zonesRes.data, alerts: alertsRes.data.alerts });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }
}));
