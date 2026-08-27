from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models.schemas import FieldReportRequest, FieldReportResponse
import sys
import os

# Append services to path if needed
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))
from report_service import ReportService

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])

# In-memory singleton for demo
report_service = ReportService()

@router.post("", response_model=FieldReportResponse)
def submit_report(req: FieldReportRequest):
    try:
        r = report_service.submit(req.dict())
        return r
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[FieldReportResponse])
def list_reports(status: str = None):
    return report_service.get_all(filter_status=status)

@router.patch("/{report_id}/verify", response_model=FieldReportResponse)
def verify_report(report_id: str, decision: str, authority_id: str = "AUTH_001"):
    try:
        return report_service.verify(report_id, authority_id, decision)
    except KeyError:
        raise HTTPException(status_code=404, detail="Report not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/geojson")
def get_reports_geojson():
    reports = report_service.get_all()
    return report_service.to_geojson(reports)
