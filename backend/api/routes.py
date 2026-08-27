"""
Main API Routes — SIH26001 Landslide Early-Warning Platform
============================================================
Risk zones are driven by the trained ML model (XGBoost primary).
Physics FoS is a sanity check only — not the primary classifier.
Sectors are defined as the 44 monitored NER locations.
"""

from fastapi import APIRouter, HTTPException
import sys, os, math, random
from datetime import datetime

from models.schemas import (
    ForecastResponse, ForecastHorizon, SHAPContributor,
    FeatureProperties, Feature, RiskZonesResponse,
)
from services.risk_service import calculate_all_sectors, calculate_sector_risk, get_risk_color
from services.alert_prioritizer import AlertPrioritizer
from services.live_data_service import LiveDataService

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml'))
try:
    from predict import is_model_ready, get_model_meta
except Exception:
    def is_model_ready(): return False
    def get_model_meta(): return {}

router = APIRouter()
live_data = LiveDataService()
prioritizer = AlertPrioritizer()

# ── Probability → severity mapping (spec §5.1) ────────────────────────────────
def prob_to_severity(prob: float) -> str:
    if prob >= 0.75: return "RED"
    if prob >= 0.50: return "ORANGE"
    if prob >= 0.25: return "YELLOW"
    return "GREEN"

def prob_to_color(prob: float) -> str:
    colors = {
        "RED":    "#DC2626",
        "ORANGE": "#EA580C",
        "YELLOW": "#D97706",
        "GREEN":  "#16A34A",
    }
    return colors[prob_to_severity(prob)]

# ── 44 Monitored Sectors — full NER coverage ──────────────────────────────────
SECTORS = [
    # Assam
    {"id":"AS-01","name":"Guwahati Hills",     "lat":26.1445,"lng":91.7362,"base_slope_deg":28.0,"elevation_m":55,   "twi":3.1,"state":"Assam"},
    {"id":"AS-02","name":"Kamakhya Slope",     "lat":26.1664,"lng":91.6432,"base_slope_deg":38.0,"elevation_m":180,  "twi":4.2,"state":"Assam"},
    {"id":"AS-03","name":"Tezpur Corridor",    "lat":26.6338,"lng":92.8005,"base_slope_deg":35.0,"elevation_m":75,   "twi":3.8,"state":"Assam"},
    {"id":"AS-04","name":"Haflong Hill",       "lat":25.1664,"lng":93.0182,"base_slope_deg":52.0,"elevation_m":700,  "twi":6.1,"state":"Assam"},
    {"id":"AS-05","name":"Silchar Valley",     "lat":24.8333,"lng":92.7789,"base_slope_deg":42.0,"elevation_m":100,  "twi":5.2,"state":"Assam"},
    {"id":"AS-06","name":"Dibrugarh Slope",    "lat":27.4728,"lng":94.9120,"base_slope_deg":36.0,"elevation_m":110,  "twi":4.0,"state":"Assam"},
    {"id":"AS-07","name":"Dima Hasao Ridge",   "lat":25.5833,"lng":93.0500,"base_slope_deg":55.0,"elevation_m":900,  "twi":6.8,"state":"Assam"},
    {"id":"AS-08","name":"Barak Valley",       "lat":24.9167,"lng":92.9333,"base_slope_deg":38.0,"elevation_m":130,  "twi":5.0,"state":"Assam"},
    # Meghalaya
    {"id":"ML-01","name":"Shillong Bypass",    "lat":25.5788,"lng":91.8933,"base_slope_deg":45.0,"elevation_m":1500, "twi":5.2,"state":"Meghalaya"},
    {"id":"ML-02","name":"Umiam Lake Road",    "lat":25.6600,"lng":91.9000,"base_slope_deg":55.0,"elevation_m":1000, "twi":6.1,"state":"Meghalaya"},
    {"id":"ML-03","name":"Jowai Corridor",     "lat":25.4480,"lng":92.1640,"base_slope_deg":35.0,"elevation_m":1300, "twi":4.8,"state":"Meghalaya"},
    {"id":"ML-04","name":"Sonapur Tunnel",     "lat":26.1158,"lng":91.7026,"base_slope_deg":65.0,"elevation_m":800,  "twi":7.5,"state":"Meghalaya"},
    {"id":"ML-05","name":"Cherrapunji Cliff",  "lat":25.2830,"lng":91.7200,"base_slope_deg":52.0,"elevation_m":1300, "twi":7.8,"state":"Meghalaya"},
    {"id":"ML-06","name":"Tura Hills",         "lat":25.5154,"lng":90.2126,"base_slope_deg":42.0,"elevation_m":450,  "twi":5.0,"state":"Meghalaya"},
    {"id":"ML-07","name":"Nongstoin Slope",    "lat":25.5167,"lng":91.2667,"base_slope_deg":48.0,"elevation_m":700,  "twi":5.9,"state":"Meghalaya"},
    # Manipur
    {"id":"MN-01","name":"Imphal Periphery",   "lat":24.8170,"lng":93.9368,"base_slope_deg":32.0,"elevation_m":780,  "twi":4.2,"state":"Manipur"},
    {"id":"MN-02","name":"Churachandpur",      "lat":24.3333,"lng":93.6833,"base_slope_deg":56.0,"elevation_m":900,  "twi":6.5,"state":"Manipur"},
    {"id":"MN-03","name":"Senapati Hills",     "lat":25.2667,"lng":94.0167,"base_slope_deg":50.0,"elevation_m":1100, "twi":6.0,"state":"Manipur"},
    {"id":"MN-04","name":"Tamenglong",         "lat":24.9833,"lng":93.5167,"base_slope_deg":54.0,"elevation_m":980,  "twi":6.3,"state":"Manipur"},
    {"id":"MN-05","name":"Ukhrul Ridge",       "lat":25.1167,"lng":94.3667,"base_slope_deg":48.0,"elevation_m":1200, "twi":5.8,"state":"Manipur"},
    # Mizoram
    {"id":"MZ-01","name":"Aizawl Escarpment",  "lat":23.7271,"lng":92.7176,"base_slope_deg":58.0,"elevation_m":1130, "twi":7.0,"state":"Mizoram"},
    {"id":"MZ-02","name":"Lunglei Slope",      "lat":22.8833,"lng":92.7333,"base_slope_deg":52.0,"elevation_m":900,  "twi":6.4,"state":"Mizoram"},
    {"id":"MZ-03","name":"Champhai Pass",      "lat":23.4667,"lng":93.3167,"base_slope_deg":46.0,"elevation_m":1100, "twi":5.6,"state":"Mizoram"},
    {"id":"MZ-04","name":"Kolasib Hill",       "lat":24.2167,"lng":92.6833,"base_slope_deg":50.0,"elevation_m":780,  "twi":6.1,"state":"Mizoram"},
    # Nagaland
    {"id":"NL-01","name":"Kohima Slope",       "lat":25.6751,"lng":94.1086,"base_slope_deg":50.0,"elevation_m":1500, "twi":5.9,"state":"Nagaland"},
    {"id":"NL-02","name":"Dimapur Foothills",  "lat":25.9064,"lng":93.7267,"base_slope_deg":38.0,"elevation_m":200,  "twi":4.5,"state":"Nagaland"},
    {"id":"NL-03","name":"Mokokchung Ridge",   "lat":26.3267,"lng":94.5213,"base_slope_deg":44.0,"elevation_m":1350, "twi":5.3,"state":"Nagaland"},
    {"id":"NL-04","name":"Tuensang Hills",     "lat":26.2667,"lng":94.8167,"base_slope_deg":47.0,"elevation_m":1400, "twi":5.6,"state":"Nagaland"},
    {"id":"NL-05","name":"Wokha Slope",        "lat":26.1000,"lng":94.2667,"base_slope_deg":42.0,"elevation_m":1100, "twi":5.0,"state":"Nagaland"},
    # Tripura
    {"id":"TR-01","name":"Ambassa Hills",      "lat":23.9333,"lng":91.8600,"base_slope_deg":38.0,"elevation_m":300,  "twi":4.8,"state":"Tripura"},
    {"id":"TR-02","name":"Dharmanagar Slope",  "lat":24.3833,"lng":92.1667,"base_slope_deg":40.0,"elevation_m":350,  "twi":5.0,"state":"Tripura"},
    {"id":"TR-03","name":"Udaipur Tripura",    "lat":23.5333,"lng":91.4833,"base_slope_deg":32.0,"elevation_m":220,  "twi":4.0,"state":"Tripura"},
    # Arunachal Pradesh
    {"id":"AR-01","name":"Itanagar Slope",     "lat":27.0844,"lng":93.6053,"base_slope_deg":48.0,"elevation_m":400,  "twi":5.5,"state":"Arunachal Pradesh"},
    {"id":"AR-02","name":"Tawang Pass",        "lat":27.5859,"lng":91.8669,"base_slope_deg":62.0,"elevation_m":3400, "twi":7.0,"state":"Arunachal Pradesh"},
    {"id":"AR-03","name":"Bomdila Corridor",   "lat":27.2667,"lng":92.4167,"base_slope_deg":56.0,"elevation_m":2200, "twi":6.5,"state":"Arunachal Pradesh"},
    {"id":"AR-04","name":"Along Valley",       "lat":28.1667,"lng":94.8000,"base_slope_deg":50.0,"elevation_m":500,  "twi":5.8,"state":"Arunachal Pradesh"},
    {"id":"AR-05","name":"Pasighat Hills",     "lat":28.0667,"lng":95.3333,"base_slope_deg":45.0,"elevation_m":300,  "twi":5.2,"state":"Arunachal Pradesh"},
    {"id":"AR-06","name":"Ziro Valley",        "lat":27.5500,"lng":93.8333,"base_slope_deg":44.0,"elevation_m":1700, "twi":5.4,"state":"Arunachal Pradesh"},
    # Sikkim & West Bengal Hills
    {"id":"SK-01","name":"Teesta Valley",      "lat":27.2000,"lng":88.4500,"base_slope_deg":62.0,"elevation_m":400,  "twi":8.2,"state":"Sikkim"},
    {"id":"SK-02","name":"Kalimpong Turn",     "lat":27.0620,"lng":88.4680,"base_slope_deg":52.0,"elevation_m":1250, "twi":5.9,"state":"West Bengal"},
    {"id":"SK-03","name":"Rangpo Border",      "lat":27.1760,"lng":88.5300,"base_slope_deg":42.0,"elevation_m":600,  "twi":6.5,"state":"Sikkim"},
    {"id":"SK-04","name":"Singtam Bend",       "lat":27.2340,"lng":88.5000,"base_slope_deg":56.0,"elevation_m":850,  "twi":7.1,"state":"Sikkim"},
    {"id":"SK-05","name":"Gangtok Escarpment", "lat":27.3389,"lng":88.6065,"base_slope_deg":58.0,"elevation_m":1650, "twi":6.8,"state":"Sikkim"},
    {"id":"SK-06","name":"Mangan Slope",       "lat":27.5167,"lng":88.5333,"base_slope_deg":64.0,"elevation_m":1200, "twi":7.6,"state":"Sikkim"},
]

_POLY_OFFSET = 0.030  # ~3 km per side

def _make_polygon(lat: float, lng: float):
    o = _POLY_OFFSET
    return [[[lng-o, lat-o],[lng+o, lat-o],[lng+o, lat+o],[lng-o, lat+o],[lng-o, lat-o]]]

def _physics_fos(slope_deg: float, soil_moisture: float = 0.5) -> float:
    """Infinite slope FoS — engineering sanity check only (not primary classifier)."""
    import math
    beta  = math.radians(max(slope_deg, 0.1))
    phi_r = math.radians(30.0)
    c, gamma, h, gamma_w = 15.0, 20.0, 2.0, 9.81
    mw = min(max(soil_moisture, 0), 1)
    term_c = c / (gamma * h * math.cos(beta)**2 * math.tan(beta))
    term_f = math.tan(phi_r) / math.tan(beta)
    term_w = (gamma_w / gamma) * mw * math.tan(phi_r) / math.tan(beta)
    return max(term_c + term_f - term_w, 0.01)

def _fos_to_prob(fos: float) -> float:
    """Convert FoS to pseudo-probability — used only as sanity check."""
    import math
    return round(min(max(1.0 / (1.0 + math.exp(5.0 * (fos - 1.1))), 0.0), 1.0), 4)

def _sector_prediction(sector: dict, weather: dict) -> dict:
    """
    Compute risk for a single sector.
    ML model is primary. FoS is fallback only if ML not ready.
    """
    slope   = sector["base_slope_deg"]
    sm      = weather.get("soil_moisture", 0.45)
    r24h    = weather.get("rainfall_24h_mm", 0.0)
    r6h     = weather.get("rainfall_6h_mm", 0.0)
    r1h     = weather.get("rainfall_1h_mm", 0.0)
    r12h    = weather.get("rainfall_12h_mm", 0.0)
    f_rain  = weather.get("forecast_rain_24h", 0.0)
    f6h     = weather.get("forecast_rain_6h", 0.0)

    fos     = _physics_fos(slope, sm)
    fos_prob = _fos_to_prob(fos)

    # Try ML model
    ml_ready = is_model_ready()
    prob_now = fos_prob   # default to physics fallback
    prob_1h  = fos_prob
    prob_6h  = fos_prob
    prob_12h = fos_prob
    prob_24h = fos_prob
    model_used = "Physics FoS (ML model not trained)"
    shap_contributors = []
    top_reason = ""
    confidence_flag = "LOW"
    fos_override = False

    if ml_ready:
        try:
            sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml'))
            from predict import predict as ml_predict
            features = {
                "slope_deg":        slope,
                "elevation_m":      sector.get("elevation_m", 500.0),
                "aspect_deg":       180.0,
                "twi":              sector.get("twi", 5.0),
                "rainfall_1h_mm":   r1h,
                "rainfall_6h_mm":   r6h,
                "rainfall_12h_mm":  r12h,
                "rainfall_24h_mm":  r24h,
                "rainfall_3d_mm":   r24h * 2.5,
                "rainfall_7d_mm":   r24h * 5.0,
                "rainfall_15d_mm":  r24h * 8.0,
                "rainfall_30d_mm":  r24h * 12.0,
                "rainfall_intensity": r1h,
                "api_7d":           r24h * 3.0 * 0.85,
                "soil_moisture":    sm,
                "soil_moisture_28": sm * 0.9,
                "soil_class":       2,   # Clay (conservative default)
                "lithology":        2,   # Schist (NE India dominant)
                "lulc":             0,   # Forest
                "ndvi":             0.6,
                "dist_fault_km":    6.0,
                "dist_stream_km":   0.5,
                "historical_density": 0.02,
                "month":            datetime.utcnow().month,
                "season_code":      2 if 6 <= datetime.utcnow().month <= 9 else 0,
                "state_code":       0,
                "temp_c":           weather.get("temp_c", 22.0),
                "wind_kmh":         weather.get("wind_kmh", 10.0),
                "curvature":        0.0,
                "relief_m":         sector.get("elevation_m", 500.0) * 0.1,
            }
            res = ml_predict(features, f6h, r12h + f6h, r24h + f_rain, r1h, fos)
            prob_now  = res.get("prob_now",  fos_prob)
            prob_1h   = res.get("prob_1h",   fos_prob)
            prob_6h   = res.get("prob_6h",   fos_prob)
            prob_12h  = res.get("prob_12h",  fos_prob)
            prob_24h  = res.get("prob_24h",  fos_prob)
            shap_contributors = res.get("shap_contributors", [])
            top_reason = res.get("top_reason", "")
            confidence_flag = res.get("confidence_flag", "LOW")
            fos_override = res.get("fos_override", False)
            model_used = "XGBoost (primary) + RF baseline, Platt-calibrated"
        except Exception as e:
            print(f"[WARN] ML predict failed for {sector['id']}: {e}")

    # FoS override: conservative safety escalation (not statistical weighting)
    if fos < 1.0 and prob_now < 0.50:
        fos_override = True

    worst = max(prob_now, prob_1h, prob_6h, prob_12h, prob_24h)
    if fos_override:
        worst = max(worst, 0.50)

    severity = prob_to_severity(worst)
    color    = prob_to_color(worst)

    actions = {
        "RED":    "IMMEDIATE EVACUATION. Close road. Alert NDRF + SDRF.",
        "ORANGE": "Issue public warning. Pre-position emergency teams. Monitor every 30 min.",
        "YELLOW": "Issue advisory. Restrict heavy vehicles. Increase monitoring.",
        "GREEN":  "Normal operations. Continue automated monitoring.",
    }
    if fos_override and severity not in ("RED",):
        action = "Slope structurally unsafe (FoS < 1.0). Escalated to ORANGE minimum."
    else:
        action = actions.get(severity, "Continue monitoring.")

    meta = get_model_meta()
    return {
        "sector_id":          sector["id"],
        "name":               sector["name"],
        "prob_now":           round(prob_now, 4),
        "prob_1h":            round(prob_1h, 4),
        "prob_6h":            round(prob_6h, 4),
        "prob_12h":           round(prob_12h, 4),
        "prob_24h":           round(prob_24h, 4),
        "severity":           severity,
        "color":              color,
        "fos":                round(fos, 3),
        "fos_override":       fos_override,
        "recommended_action": action,
        "shap_contributors":  shap_contributors,
        "top_reason":         top_reason,
        "model_version":      meta.get("model_selected", "Physics FoS (fallback)"),
        "confidence_flag":    confidence_flag,
        "model_used":         model_used,
        "prediction_timestamp": datetime.utcnow().isoformat() + "Z",
        "data_sources_used":  meta.get("data_sources", ["ERA5/Open-Meteo", "GSI Atlas"]),
    }


# ── Risk Zones ────────────────────────────────────────────────────────────────
@router.get("/api/v1/risk-zones")
async def get_risk_zones():
    weather_cache = live_data.get_all_cached()
    results = []
    for sector in SECTORS:
        sid = sector["id"]
        wc = weather_cache.get(sid, {})
        r = _sector_prediction(sector, wc)
        results.append(r)

    results = prioritizer.prioritize(results)

    features = []
    for sector, result in zip(SECTORS, results):
        # Re-match by sector_id since prioritize sorts
        r = next((x for x in results if x["sector_id"] == sector["id"]), result)
        features.append({
            "type": "Feature",
            "properties": {
                "sector_id":         sector["id"],
                "name":              sector["name"],
                "hazard_score":      r["prob_now"],
                "severity":          r["severity"],
                "color":             r["color"],
                "slope_deg":         sector["base_slope_deg"],
                "fos":               r.get("fos", 1.5),
                "fos_override":      r.get("fos_override", False),
                "recommended_action":r["recommended_action"],
                "prob_now":          r["prob_now"],
                "prob_1h":           r["prob_1h"],
                "prob_6h":           r["prob_6h"],
                "prob_12h":          r["prob_12h"],
                "prob_24h":          r["prob_24h"],
                "priority_score":    r.get("priority_score", 0.0),
                "priority_rank":     r.get("priority_rank", 99),
                "model_version":     r.get("model_version", ""),
                "confidence_flag":   r.get("confidence_flag", "LOW"),
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": _make_polygon(sector["lat"], sector["lng"])
            }
        })

    return {"type": "FeatureCollection", "features": features}


# ── Forecast + SHAP ───────────────────────────────────────────────────────────
@router.get("/api/v1/forecast/{sector_id}")
async def get_forecast(sector_id: str):
    sector = next((s for s in SECTORS if s["id"] == sector_id), None)
    if not sector:
        raise HTTPException(status_code=404, detail=f"Sector {sector_id} not found")

    wc = live_data.get_cached(sector_id) or {}
    r  = _sector_prediction(sector, wc)

    def _horizon(label, prob):
        sev = prob_to_severity(prob)
        col = prob_to_color(prob)
        return {"horizon_label": label, "prob": prob, "risk_level": sev, "color": col}

    return {
        "sector_id":           sector_id,
        "prob_now":            r["prob_now"],
        "prob_1h":             r["prob_1h"],
        "prob_6h":             r["prob_6h"],
        "prob_12h":            r["prob_12h"],
        "prob_24h":            r["prob_24h"],
        "horizons":            [
            _horizon("1h",  r["prob_1h"]),
            _horizon("6h",  r["prob_6h"]),
            _horizon("12h", r["prob_12h"]),
            _horizon("24h", r["prob_24h"]),
        ],
        "shap_contributors":   r.get("shap_contributors", []),
        "top_reason":          r.get("top_reason", ""),
        "model_version":       r.get("model_version", ""),
        "prediction_timestamp":r.get("prediction_timestamp", ""),
        "confidence_flag":     r.get("confidence_flag", "LOW"),
        "fos_override":        r.get("fos_override", False),
        "data_sources_used":   r.get("data_sources_used", []),
    }


# ── Full sector detail ────────────────────────────────────────────────────────
@router.get("/api/v1/risk/{sector_id}")
async def get_risk_detail(sector_id: str):
    return await get_forecast(sector_id)


# ── Alerts ────────────────────────────────────────────────────────────────────
@router.get("/api/v1/alerts")
async def get_alerts():
    weather_cache = live_data.get_all_cached()
    alerts = []
    results = []
    for sector in SECTORS:
        wc = weather_cache.get(sector["id"], {})
        r  = _sector_prediction(sector, wc)
        results.append(r)

    results = prioritizer.prioritize(results)

    for r in results:
        if r["severity"] in ("RED", "ORANGE"):
            alerts.append({
                "sector_id":       r["sector_id"],
                "name":            r.get("name", r["sector_id"]),
                "severity":        r["severity"],
                "prob":            r["prob_now"],
                "priority_score":  r.get("priority_score", 0.0),
                "priority_rank":   r.get("priority_rank", 99),
                "road_name":       r.get("road_name", ""),
                "population_at_risk": r.get("population_at_risk", 0),
                "fos_override":    r.get("fos_override", False),
                "recommended_action": r["recommended_action"],
                "triggered_at":    r.get("prediction_timestamp", ""),
            })

    return {"alerts": alerts, "total_sectors": len(SECTORS)}


# ── Legacy compat ─────────────────────────────────────────────────────────────
@router.get("/api/v1/evacuation-route")
def get_evacuation_route():
    return {
        "status": "success",
        "route": [
            {"lat": 25.578, "lng": 91.893},
            {"lat": 25.600, "lng": 91.850},
            {"lat": 25.650, "lng": 91.800},
        ],
    }

@router.post("/api/v1/report-hazard")
def report_hazard():
    return {"status": "success", "ticket_id": f"TKT-{random.randint(1000,9999)}", "message": "Report received. Use /api/v1/reports for full submission."}
