"""
ML-Driven Risk Service
=======================
The ML model (XGBoost) is the primary hazard classifier.
Physics FoS is an engineering sanity check only (Option A from design spec).

FoS override rule (conservative safety measure):
  IF FoS < 1.0 AND ML probability < 0.50:
    Bump severity to ORANGE minimum, set fos_override=True
  This is documented as a safety-conservative rule, not a statistical claim.

Do NOT apply a fixed 40% FoS weighting to every prediction.
"""
import os
import sys

# Ensure ml is in path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml'))
try:
    from predict import predict as ml_predict
except ImportError:
    # Dummy mock if not found
    def ml_predict(*args, **kwargs):
        return {'prob_now': 0.1, 'prob_1h': 0.1, 'prob_6h': 0.1, 'prob_12h': 0.1, 'prob_24h': 0.1, 'fos_override': False}

def get_risk_color(severity: str) -> str:
    colors = {'GREEN': '#00FF00', 'YELLOW': '#FFFF00', 'ORANGE': '#FFA500', 'RED': '#FF0000'}
    return colors.get(severity, '#00FF00')

def get_recommended_action(severity: str, fos_override: bool) -> str:
    if severity == 'RED': return 'Evacuate immediately'
    if severity == 'ORANGE': return 'Be ready to evacuate'
    if severity == 'YELLOW': return 'Monitor local updates'
    return 'No immediate action required'

def get_risk_severity(prob: float, fos_override: bool) -> str:
    if fos_override:
        return 'ORANGE' if prob < 0.75 else 'RED'
    if prob < 0.25: return 'GREEN'
    if prob < 0.50: return 'YELLOW'
    if prob < 0.75: return 'ORANGE'
    return 'RED'

def calculate_sector_risk(sector: dict, live_weather: dict, forecast_weather: dict) -> dict:
    features = sector.get('features', {})
    fos = sector.get('fos', 1.5)
    
    # Merge live weather to features
    merged_features = features.copy()
    for k, v in live_weather.items():
        merged_features[k] = v
        
    f_1h = forecast_weather.get('forecast_1h', 0.0)
    f_6h = forecast_weather.get('forecast_6h', 0.0)
    f_12h = forecast_weather.get('forecast_12h', 0.0)
    f_24h = forecast_weather.get('forecast_24h', 0.0)
    
    res = ml_predict(merged_features, f_6h, f_12h, f_24h, f_1h, fos)
    
    prob = res.get('prob_now', 0.0)
    fos_override = res.get('fos_override', False)
    
    severity = get_risk_severity(prob, fos_override)
    
    res['sector_id'] = sector.get('id', 'unknown')
    res['severity'] = severity
    res['color'] = get_risk_color(severity)
    res['recommended_action'] = get_recommended_action(severity, fos_override)
    
    return res

def calculate_all_sectors(sectors: list, weather_cache: dict) -> list:
    results = []
    for s in sectors:
        sid = s.get('id')
        wc = weather_cache.get(sid, {})
        lw = wc.get('current', {})
        fw = wc.get('forecast', {})
        results.append(calculate_sector_risk(s, lw, fw))
    return results
