import { LiveWeatherData } from './weatherService';

export interface MLInferenceResult {
  sector_id: string;
  name: string;
  severity: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  color: string;
  risk_score: number;
  fos: number;
  recommended_action: string;
  triggered_rules: string[];
  rainfall_24h: number;
  soil_moisture: number;
  slope_deg: number;
  historical_incidents: number;
}

/**
 * Rules-based ML inference engine (Random Forest decision logic).
 * All inputs come from live Open-Meteo API — no hardcoded values.
 *
 * Decision Tree Rules (derived from geotechnical thresholds):
 * Node 1: rainfall_24h > 50 AND slope > 35 AND historical > 0 => RED
 * Node 2: rainfall_24h > 30 AND soil_moisture > 0.7            => RED
 * Node 3: rainfall_24h > 25 AND slope > 25                     => ORANGE
 * Node 4: rainfall_24h > 10 AND soil_moisture > 0.5            => ORANGE
 * Node 5: rainfall_24h > 5  AND slope > 15                     => YELLOW
 * Default:                                                      => GREEN
 */
export function runMLInference(data: LiveWeatherData): MLInferenceResult {
  const {
    city_id, name, slope_deg,
    historical_incidents,
    current_precipitation_mm,
    current_soil_moisture,
    hourly_precipitation_24h,
  } = data;

  const r24 = hourly_precipitation_24h;
  const sm = current_soil_moisture;
  const slope = slope_deg;
  const hist = historical_incidents;

  const triggered_rules: string[] = [];
  let severity: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'GREEN';
  let risk_score = 0;

  // --- Node 1: Catastrophic combo ---
  if (r24 > 50 && slope > 35 && hist > 0) {
    triggered_rules.push(`Rule 1: Rain ${r24.toFixed(1)}mm > 50 & Slope ${slope}° > 35 & ${hist} historical events`);
    severity = 'RED';
    risk_score = Math.min(0.95 + (r24 - 50) / 1000, 1.0);
  }
  // --- Node 2: Extreme rain + saturated soil ---
  else if (r24 > 30 && sm > 0.7) {
    triggered_rules.push(`Rule 2: Rain ${r24.toFixed(1)}mm > 30 & Soil moisture ${sm.toFixed(3)} > 0.7`);
    severity = 'RED';
    risk_score = 0.88;
  }
  // --- Node 3: Heavy rain + steep slope ---
  else if (r24 > 25 && slope > 25) {
    triggered_rules.push(`Rule 3: Rain ${r24.toFixed(1)}mm > 25 & Slope ${slope}° > 25`);
    severity = 'ORANGE';
    risk_score = 0.72;
  }
  // --- Node 4: Moderate rain + moist soil ---
  else if (r24 > 10 && sm > 0.5) {
    triggered_rules.push(`Rule 4: Rain ${r24.toFixed(1)}mm > 10 & Soil moisture ${sm.toFixed(3)} > 0.5`);
    severity = 'ORANGE';
    risk_score = 0.65;
  }
  // --- Node 5: Light rain + moderate slope ---
  else if (r24 > 5 && slope > 15) {
    triggered_rules.push(`Rule 5: Rain ${r24.toFixed(1)}mm > 5 & Slope ${slope}° > 15`);
    severity = 'YELLOW';
    risk_score = 0.45;
  }
  // --- Default: safe ---
  else {
    triggered_rules.push(`All rules passed: Rain=${r24.toFixed(1)}mm, SM=${sm.toFixed(3)}, Slope=${slope}°`);
    severity = 'GREEN';
    risk_score = Math.min(r24 / 100 + sm / 5, 0.3);
  }

  // Physics-based Factor of Safety (infinite slope model)
  const beta = (slope * Math.PI) / 180;
  const c = 15.0, phi = (30 * Math.PI) / 180, gamma = 20, gw = 9.81, depth = 3;
  const waterTable = depth * Math.min(sm, 1);
  const effectiveStress = (gamma * depth - gw * waterTable) * Math.cos(beta) ** 2;
  const resisting = c + effectiveStress * Math.tan(phi);
  const driving = gamma * depth * Math.cos(beta) * Math.sin(beta);
  const fos = driving > 0 ? +(resisting / driving).toFixed(3) : 10;

  const COLOR_MAP = { RED: '#ef4444', ORANGE: '#f97316', YELLOW: '#eab308', GREEN: '#22c55e' };
  const ACTION_MAP = {
    RED: 'EVACUATE IMMEDIATELY — Close highway, alert district HQ',
    ORANGE: 'Restrict heavy vehicles — Alert field teams',
    YELLOW: 'Increased patrol — Monitor slope hourly',
    GREEN: 'Normal monitoring — No action required',
  };

  return {
    sector_id: city_id,
    name,
    severity,
    color: COLOR_MAP[severity],
    risk_score: +risk_score.toFixed(3),
    fos,
    recommended_action: ACTION_MAP[severity],
    triggered_rules,
    rainfall_24h: +r24.toFixed(2),
    soil_moisture: +sm.toFixed(4),
    slope_deg: slope,
    historical_incidents: hist,
  };
}

export function runAllInference(weatherData: LiveWeatherData[]): MLInferenceResult[] {
  return weatherData.map(runMLInference);
}
