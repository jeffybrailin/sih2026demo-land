from fastapi import APIRouter, HTTPException
from typing import List
from models.schemas import SensorObservationRequest
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data'))
from sensor_ingestion import SensorIngestionService, SensorObservation

router = APIRouter(prefix="/api/v1/sensors", tags=["sensors"])

sensor_service = SensorIngestionService()

@router.post("/soil-moisture")
def ingest_sensor(req: SensorObservationRequest):
    obs = SensorObservation(**req.dict())
    res = sensor_service.ingest(obs)
    if res.get('status') == 'error':
        raise HTTPException(status_code=400, detail=res['errors'])
    return res

@router.get("/recent")
def get_recent_sensors(max_age_hours: int = 1):
    return sensor_service.get_all_recent(max_age_hours)
