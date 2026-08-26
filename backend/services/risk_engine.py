import numpy as np

def calculate_api(rainfall_history: list[float], decay_factor: float = 0.85) -> float:
    """Calculate 7-day Antecedent Precipitation Index."""
    api = 0.0
    for i, r in enumerate(rainfall_history):
        api += (decay_factor ** i) * r
    return api

def calculate_fos(slope_deg: float, api: float, forecast_24h: float) -> float:
    """
    Simplified Factor of Safety (FoS) based on infinite slope stability.
    This is a mock physics-informed scoring engine.
    FoS = Resisting Forces / Driving Forces
    """
    # Convert slope to radians
    beta = np.radians(slope_deg)
    
    # Mock parameters
    cohesion = 15.0 # kPa
    friction_angle = np.radians(30.0)
    soil_unit_weight = 20.0 # kN/m3
    water_unit_weight = 9.81
    depth = 3.0 # m
    
    # Simulate water table rise based on antecedent and forecast rain
    # Normalize rain impact to 0-1 (e.g., max expected rain 500mm)
    total_rain_impact = min((api + forecast_24h) / 500.0, 1.0)
    water_height = depth * total_rain_impact
    
    # Infinite slope equation
    effective_stress = (soil_unit_weight * depth - water_unit_weight * water_height) * np.cos(beta)**2
    resisting = cohesion + effective_stress * np.tan(friction_angle)
    driving = soil_unit_weight * depth * np.cos(beta) * np.sin(beta)
    
    fos = resisting / driving if driving > 0 else 10.0
    return fos

def get_risk_classification(fos: float) -> tuple[str, str, float, str]:
    """Returns (severity, color, hazard_score, recommended_action)."""
    if fos > 1.3:
        return "GREEN", "#22c55e", 0.2, "Normal Monitoring"
    elif 1.1 < fos <= 1.3:
        return "YELLOW", "#eab308", 0.5, "Watch: Prepare for potential issues"
    elif 1.0 <= fos <= 1.1:
        return "ORANGE", "#f97316", 0.75, "Warning: Restrict Heavy Vehicles"
    else:
        return "RED", "#ef4444", 0.95, "Critical: Evacuate Downhill Habitation"

def calculate_sector_risk(sector, rainfall_history: list[float], forecast_24h: float) -> dict:
    api = calculate_api(rainfall_history)
    fos = calculate_fos(sector.base_slope_deg, api, forecast_24h)
    severity, color, score, action = get_risk_classification(fos)
    
    return {
        "sector_id": sector.id,
        "name": sector.name,
        "hazard_score": score,
        "severity": severity,
        "color": color,
        "fos": fos,
        "slope_deg": sector.base_slope_deg,
        "recommended_action": action
    }
