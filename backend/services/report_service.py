"""
Field Report Service
=====================
Handles citizen/field officer geo-tagged hazard reports.

CRITICAL DESIGN RULE:
  Field reports are SUPPLEMENTARY ground intelligence.
  The AI warning system must function with citizen_reports = 0.
  A field report does NOT automatically trigger an alert.
  Authority/field verification is always required.

Report types: CRACK, SLOPE_MOVEMENT, LANDSLIDE, ROAD_BLOCKAGE, OTHER_HAZARD
Verification states: UNVERIFIED, VERIFIED, REJECTED
"""
from dataclasses import dataclass, field, asdict
from datetime import datetime
import uuid
from typing import List

GPS_NER_BOUNDS = {'lat': (20, 32), 'lon': (88, 98)}

@dataclass
class FieldReport:
    id: str
    lat: float
    lon: float
    report_type: str
    severity_estimate: str
    description: str
    photo_url: str
    timestamp: datetime
    reporter_type: str
    verification_status: str = 'UNVERIFIED'
    verified_by: str = None
    verified_at: datetime = None

def validate_report(data: dict) -> tuple:
    errors = []
    lat = data.get('lat')
    lon = data.get('lon')
    if not lat or not lon:
        errors.append("lat/lon required")
    elif not (GPS_NER_BOUNDS['lat'][0] <= lat <= GPS_NER_BOUNDS['lat'][1]):
        errors.append("lat out of bounds")
    elif not (GPS_NER_BOUNDS['lon'][0] <= lon <= GPS_NER_BOUNDS['lon'][1]):
        errors.append("lon out of bounds")
        
    rt = data.get('report_type')
    if rt not in ['CRACK', 'SLOPE_MOVEMENT', 'LANDSLIDE', 'ROAD_BLOCKAGE', 'OTHER_HAZARD']:
        errors.append("Invalid report_type")
        
    return len(errors) == 0, errors

class ReportService:
    def __init__(self):
        self.reports = {}

    def submit(self, data: dict) -> FieldReport:
        valid, errs = validate_report(data)
        if not valid:
            raise ValueError(f"Invalid report: {errs}")
            
        r_id = str(uuid.uuid4())
        r = FieldReport(
            id=r_id,
            lat=data['lat'],
            lon=data['lon'],
            report_type=data['report_type'],
            severity_estimate=data.get('severity_estimate', 'UNKNOWN'),
            description=data.get('description', ''),
            photo_url=data.get('photo_url', ''),
            timestamp=datetime.utcnow(),
            reporter_type=data.get('reporter_type', 'CITIZEN')
        )
        self.reports[r_id] = r
        return r

    def verify(self, report_id: str, authority_id: str, decision: str) -> FieldReport:
        if report_id not in self.reports:
            raise KeyError("Report not found")
        if decision not in ['VERIFIED', 'REJECTED']:
            raise ValueError("Invalid decision")
            
        r = self.reports[report_id]
        r.verification_status = decision
        r.verified_by = authority_id
        r.verified_at = datetime.utcnow()
        return r

    def get_nearby(self, lat: float, lon: float, radius_km: float = 25.0) -> List[FieldReport]:
        # Simple bounding box approximation
        res = []
        d = radius_km / 111.0 # rough deg
        for r in self.reports.values():
            if abs(r.lat - lat) <= d and abs(r.lon - lon) <= d:
                res.append(r)
        return res

    def get_all(self, filter_status=None) -> List[FieldReport]:
        if not filter_status:
            return list(self.reports.values())
        return [r for r in self.reports.values() if r.verification_status == filter_status]

    def to_geojson(self, reports: List[FieldReport]) -> dict:
        features = []
        for r in reports:
            features.append({
                'type': 'Feature',
                'geometry': {'type': 'Point', 'coordinates': [r.lon, r.lat]},
                'properties': {
                    'id': r.id,
                    'report_type': r.report_type,
                    'severity': r.severity_estimate,
                    'status': r.verification_status,
                    'timestamp': r.timestamp.isoformat() + 'Z'
                }
            })
        return {
            'type': 'FeatureCollection',
            'features': features
        }
