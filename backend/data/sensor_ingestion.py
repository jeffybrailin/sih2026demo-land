"""
External Sensor Data Ingestion API
====================================
SOFTWARE-ONLY connector for external sensor observations.
NO physical sensor hardware is built or deployed by this project.

This module provides:
  1. Data model for incoming sensor observations
  2. Validation logic
  3. Storage to in-memory buffer (demo) or DB
  4. Retrieval for feature pipeline use

Design: The platform can CONSUME sensor observations from external
government or third-party deployments via this API endpoint.
"""
from pydantic import BaseModel, Field
from typing import Optional, Tuple, List
from datetime import datetime, timedelta

class SensorObservation(BaseModel):
    sensor_id: str
    latitude: float
    longitude: float
    soil_moisture: Optional[float] = None
    rainfall_mm: Optional[float] = None
    timestamp: datetime
    source: str = 'EXTERNAL_SENSOR'
    quality_flag: str = 'UNVERIFIED'

def validate_observation(obs: SensorObservation) -> Tuple[bool, List[str]]:
    errors = []
    if not (20 <= obs.latitude <= 32):
        errors.append("Latitude out of bounds (20-32°N)")
    if not (88 <= obs.longitude <= 98):
        errors.append("Longitude out of bounds (88-98°E)")
    if obs.soil_moisture is not None and not (0.0 <= obs.soil_moisture <= 0.6):
        errors.append("Soil moisture out of reasonable range (0.0-0.6)")
    return len(errors) == 0, errors

class SensorIngestionService:
    def __init__(self):
        self.buffer = {}  # sensor_id -> obs

    def ingest(self, obs: SensorObservation) -> dict:
        valid, errors = validate_observation(obs)
        if not valid:
            return {'status': 'error', 'errors': errors}
        obs.quality_flag = 'VERIFIED'
        self.buffer[obs.sensor_id] = obs
        return {'status': 'success', 'sensor_id': obs.sensor_id}

    def get_nearest(self, lat: float, lon: float, max_age_hours: int = 1) -> Optional[SensorObservation]:
        cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
        best = None
        best_dist = float('inf')
        for obs in self.buffer.values():
            if obs.timestamp.tzinfo is None:
                if obs.timestamp < cutoff: continue
            else:
                if obs.timestamp < cutoff.replace(tzinfo=obs.timestamp.tzinfo): continue
            dist = (obs.latitude - lat)**2 + (obs.longitude - lon)**2
            if dist < best_dist:
                best_dist = dist
                best = obs
        return best

    def get_all_recent(self, max_age_hours: int = 1) -> List[SensorObservation]:
        cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
        res = []
        for obs in self.buffer.values():
            if obs.timestamp.tzinfo is None:
                if obs.timestamp >= cutoff: res.append(obs)
            else:
                if obs.timestamp >= cutoff.replace(tzinfo=obs.timestamp.tzinfo): res.append(obs)
        return res
