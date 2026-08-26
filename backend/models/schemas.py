from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Sector(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    base_slope_deg: float
    elevation_m: float
    twi: float # Topographic Wetness Index

class FieldReport(BaseModel):
    lat: float
    lng: float
    hazard_type: str
    severity: str
    photo_url: Optional[str] = None
    notes: Optional[str] = None

class RiskResponse(BaseModel):
    sector_id: str
    hazard_score: float
    severity: str
    color: str
    fos: float
    recommended_action: str

# GeoJSON schemas
class FeatureProperties(BaseModel):
    sector_id: str
    name: str
    hazard_score: float
    severity: str
    color: str
    slope_deg: float
    fos: float
    recommended_action: str

class Geometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]

class Feature(BaseModel):
    type: str = "Feature"
    properties: FeatureProperties
    geometry: Geometry

class FeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[Feature]
