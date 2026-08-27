from fastapi import APIRouter, HTTPException
from typing import List
from models.schemas import AlertResponse
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))
from alert_service import AlertEngine
from alert_prioritizer import SECTOR_EXPOSURE

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])

# singleton
alert_engine = AlertEngine()

@router.get("", response_model=List[AlertResponse])
def get_alerts():
    raw_alerts = alert_engine.get_active_alerts()
    # Mock priority sorting and enrichment
    alerts = []
    for i, a in enumerate(raw_alerts):
        sid = a['sector_id']
        alerts.append({
            'alert_id': f"ALT_{sid}",
            'sector_id': sid,
            'sector_name': f"Sector {sid}",
            'level': a['level'],
            'prob': a['max_prob'],
            'priority_score': 0.8 - (i * 0.1),
            'priority_rank': i + 1,
            'road_name': SECTOR_EXPOSURE[sid]['road_name'],
            'population_at_risk': SECTOR_EXPOSURE[sid]['population_50km'],
            'triggered_at': a['first_triggered'],
            'channels': ['DASHBOARD', 'SMS'] if a['level'] in ['WARNING', 'CRITICAL'] else ['DASHBOARD'],
            'fos_override': False
        })
    alerts.sort(key=lambda x: x['priority_rank'])
    return alerts

@router.get("/{alert_id}", response_model=AlertResponse)
def get_single_alert(alert_id: str):
    alerts = get_alerts()
    for a in alerts:
        if a['alert_id'] == alert_id:
            return a
    raise HTTPException(status_code=404, detail="Alert not found")

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, authority_id: str = "AUTH_001"):
    sid = alert_id.replace("ALT_", "")
    if alert_engine.acknowledge(sid, authority_id):
        return {"status": "success", "alert_id": alert_id}
    raise HTTPException(status_code=404, detail="Alert not found")
