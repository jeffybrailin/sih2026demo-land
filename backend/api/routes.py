from fastapi import APIRouter
from models.schemas import FeatureCollection, Feature, FeatureProperties, Geometry, Sector, FieldReport
from services.risk_engine import calculate_sector_risk
from typing import List
import random

router = APIRouter()

# Mock data for at least 8 critical North East hill sectors
SECTORS = [
    Sector(id="NH6-S1", name="Shillong Bypass", lat=25.578, lng=91.893, base_slope_deg=45.0, elevation_m=1500, twi=5.2),
    Sector(id="NH6-S2", name="Umiam Lake Road", lat=25.660, lng=91.900, base_slope_deg=55.0, elevation_m=1000, twi=6.1),
    Sector(id="NH6-S3", name="Jowai Corridor", lat=25.448, lng=92.164, base_slope_deg=35.0, elevation_m=1300, twi=4.8),
    Sector(id="NH6-S4", name="Sonapur Tunnel", lat=25.109, lng=92.366, base_slope_deg=65.0, elevation_m=800, twi=7.5),
    Sector(id="NH10-S1", name="Teesta Valley", lat=27.060, lng=88.470, base_slope_deg=60.0, elevation_m=1100, twi=8.2),
    Sector(id="NH10-S2", name="Kalimpong Turn", lat=27.062, lng=88.468, base_slope_deg=50.0, elevation_m=1250, twi=5.9),
    Sector(id="NH10-S3", name="Rangpo Border", lat=27.176, lng=88.530, base_slope_deg=40.0, elevation_m=600, twi=6.5),
    Sector(id="NH10-S4", name="Singtam Bend", lat=27.234, lng=88.500, base_slope_deg=55.0, elevation_m=850, twi=7.1),
]

def generate_polygon(lat: float, lng: float) -> List[List[float]]:
    # Create a small square polygon around the point
    offset = 0.005
    return [[
        [lng - offset, lat - offset],
        [lng + offset, lat - offset],
        [lng + offset, lat + offset],
        [lng - offset, lat + offset],
        [lng - offset, lat - offset] # close polygon
    ]]

@router.get("/risk-zones", response_model=FeatureCollection)
def get_risk_zones(forecast_rain_24h: float = 0.0, antecedent_rain_7d: float = 0.0, corridor_id: str = None):
    features = []
    
    # Simulate a daily history sum equal to antecedent_rain_7d for the API decay calculation
    # We'll just distribute it evenly across 7 days
    daily_rain = antecedent_rain_7d / 7.0
    rainfall_history = [daily_rain] * 7
    
    for sector in SECTORS:
        if corridor_id and not sector.id.startswith(corridor_id):
            continue
            
        risk_data = calculate_sector_risk(sector, rainfall_history, forecast_rain_24h)
        
        properties = FeatureProperties(
            sector_id=risk_data["sector_id"],
            name=risk_data["name"],
            hazard_score=risk_data["hazard_score"],
            severity=risk_data["severity"],
            color=risk_data["color"],
            slope_deg=risk_data["slope_deg"],
            fos=risk_data["fos"],
            recommended_action=risk_data["recommended_action"]
        )
        
        geometry = Geometry(
            type="Polygon",
            coordinates=generate_polygon(sector.lat, sector.lng)
        )
        
        features.append(Feature(type="Feature", properties=properties, geometry=geometry))
        
    return FeatureCollection(type="FeatureCollection", features=features)

@router.get("/alerts")
def get_alerts(forecast_rain_24h: float = 0.0, antecedent_rain_7d: float = 0.0):
    # Re-calculate to filter only WARNING (ORANGE) and CRITICAL (RED)
    daily_rain = antecedent_rain_7d / 7.0
    rainfall_history = [daily_rain] * 7
    
    alerts = []
    for sector in SECTORS:
        risk_data = calculate_sector_risk(sector, rainfall_history, forecast_rain_24h)
        if risk_data["severity"] in ["RED", "ORANGE"]:
            alerts.append(risk_data)
            
    return {"alerts": alerts}

@router.post("/report-hazard")
def report_hazard(report: FieldReport):
    # In a real app, save to database
    return {"status": "success", "ticket_id": f"TKT-{random.randint(1000, 9999)}", "message": "Report received"}

@router.get("/evacuation-route")
def get_evacuation_route():
    # Mock safe alternative waypoints
    return {
        "status": "success",
        "route": [
            {"lat": 25.578, "lng": 91.893},
            {"lat": 25.600, "lng": 91.850},
            {"lat": 25.650, "lng": 91.800}
        ]
    }
