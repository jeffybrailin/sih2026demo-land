// apiService.ts
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface ForecastHorizon {
  horizon_label: string; // '1h' | '6h' | '12h' | '24h'
  prob: number;
  risk_level: string;
  color: string;
}

export interface SHAPContributor {
  feature: string;
  direction: 'up' | 'down';
  importance: number; // 0-1
  display_name: string;
}

export interface ForecastResponse {
  sector_id: string;
  prob_now: number;
  prob_1h: number;
  prob_6h: number;
  prob_12h: number;
  prob_24h: number;
  horizons: ForecastHorizon[];
  shap_contributors: SHAPContributor[];
  top_reason: string;
  model_version: string;
  prediction_timestamp: string;
  confidence_flag: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PriorityData {
  sector_id: string;
  hazard_score: number;
  exposure_score: number;
  vulnerability_score: number;
  infrastructure_criticality: number;
  priority_score: number;
  priority_rank: number;
  population_at_risk: number;
  road_name: string;
  nearest_hospital_km: number;
}

export interface FieldReport {
  id: string;
  lat: number;
  lon: number;
  report_type: string;
  severity_estimate: string;
  description: string;
  photo_url?: string;
  timestamp: string;
  verification_status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
}

export interface AlertData {
  alert_id: string;
  sector_id: string;
  sector_name: string;
  level: string;
  prob: number;
  priority_score: number;
  priority_rank: number;
  road_name: string;
  population_at_risk: number;
  triggered_at: string;
  fos_override: boolean;
}

export interface ProvenanceData {
  sector_id: string;
  rainfall_source: string;
  rainfall_obs_time: string;
  terrain_source: string;
  terrain_resolution: string;
  soil_source: string;
  model_version: string;
  model_trained_on: string;
  cv_roc_auc: number;
  brier_score: number;
  features_used: number;
  prediction_timestamp: string;
}

export interface ModelInfo {
  model_name: string;
  model_version: string;
  primary_model: string;
  baseline_model: string;
  calibration_method: string;
  trained_on: string;
  n_training_samples: number;
  cv_roc_auc_mean: number;
  brier_score: number;
  data_sources: string[];
  feature_count: number;
  training_split_method: string;
}

const handleApi = async (url: string, defaultData: any = null) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    console.error(`[API] Failed fetch at ${url}`, err);
    return defaultData;
  }
};

export async function getRiskZones(): Promise<any> {
  return handleApi(`${API_BASE}/risk-zones`, null);
}

export async function getForecast(sectorId: string): Promise<ForecastResponse | null> {
  return handleApi(`${API_BASE}/forecast/${sectorId}`, null);
}

export async function getAlerts(): Promise<AlertData[]> {
  return handleApi(`${API_BASE}/alerts`, []);
}

export async function submitReport(data: Partial<FieldReport>): Promise<FieldReport | null> {
  try {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to submit report');
    return await res.json();
  } catch (err) {
    console.error('[API] Submit report error', err);
    return null;
  }
}

export async function getFieldReports(): Promise<FieldReport[]> {
  return handleApi(`${API_BASE}/reports`, []);
}

export async function verifyReport(reportId: string, decision: 'VERIFIED' | 'REJECTED'): Promise<FieldReport | null> {
  try {
    const res = await fetch(`${API_BASE}/reports/${reportId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    });
    return await res.json();
  } catch (err) {
    console.error('[API] Verify report error', err);
    return null;
  }
}

export async function submitSensorReading(data: object): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/sensors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('[API] Submit sensor error', err);
    return null;
  }
}

export async function getProvenance(sectorId: string): Promise<ProvenanceData | null> {
  return handleApi(`${API_BASE}/provenance/${sectorId}`, null);
}

export async function getModelInfo(): Promise<ModelInfo | null> {
  return handleApi(`${API_BASE}/model-info`, null);
}
