from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SHAPContributor(BaseModel):
    feature: str
    direction: str
    importance: float
    display_name: str

class ForecastHorizon(BaseModel):
    horizon_label: str
    prob: float
    risk_level: str
    color: str

class ForecastResponse(BaseModel):
    sector_id: str
    prob_now: float
    prob_1h: float
    prob_6h: float
    prob_12h: float
    prob_24h: float
    horizons: List[ForecastHorizon]
    shap_contributors: List[SHAPContributor]
    top_reason: str
    model_version: str
    prediction_timestamp: str
    confidence_flag: str
    fos_override: bool

class PriorityScore(BaseModel):
    sector_id: str
    hazard_score: float
    exposure_score: float
    vulnerability_score: float
    infrastructure_criticality: float
    priority_score: float
    priority_rank: int
    population_at_risk: int
    road_name: str
    nearest_hospital_km: float

class FeatureProperties(BaseModel):
    sector_id: str
    name: str
    severity: str
    color: str
    recommended_action: str
    prob_now: float
    prob_1h: Optional[float] = None
    prob_6h: Optional[float] = None
    prob_12h: Optional[float] = None
    prob_24h: Optional[float] = None
    priority_score: Optional[float] = None
    priority_rank: Optional[int] = None
    fos: Optional[float] = None
    fos_override: Optional[bool] = False
    model_version: Optional[str] = None
    confidence_flag: Optional[str] = None

class Feature(BaseModel):
    type: str = "Feature"
    geometry: dict
    properties: FeatureProperties

class RiskZonesResponse(BaseModel):
    type: str = "FeatureCollection"
    features: List[Feature]

class FieldReportRequest(BaseModel):
    lat: float
    lon: float
    report_type: str
    severity_estimate: str
    description: str
    photo_url: str = ""
    reporter_type: str = "CITIZEN"

class FieldReportResponse(BaseModel):
    id: str
    lat: float
    lon: float
    report_type: str
    severity_estimate: str
    description: str
    photo_url: str
    timestamp: datetime
    verification_status: str

class SensorObservationRequest(BaseModel):
    sensor_id: str
    latitude: float
    longitude: float
    soil_moisture: Optional[float] = None
    rainfall_mm: Optional[float] = None
    timestamp: datetime

class AlertResponse(BaseModel):
    alert_id: str
    sector_id: str
    sector_name: str
    level: str
    prob: float
    priority_score: float
    priority_rank: int
    road_name: str
    population_at_risk: int
    triggered_at: str
    channels: List[str]
    fos_override: bool

class ProvenanceResponse(BaseModel):
    sector_id: str
    rainfall_source: str
    rainfall_obs_time: str
    terrain_source: str
    terrain_resolution: str
    soil_source: str
    satellite_source: str
    model_version: str
    model_trained_on: str
    cv_roc_auc: float
    brier_score: float
    features_used: int
    prediction_timestamp: str

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    primary_model: str
    baseline_model: str
    calibration_method: str
    trained_on: str
    n_training_samples: int
    n_positive: int
    n_negative: int
    cv_roc_auc_mean: float
    cv_roc_auc_std: float
    brier_score: float
    pr_auc: float
    false_alarm_rate: float
    data_sources: List[str]
    feature_count: int
    training_split_method: str
