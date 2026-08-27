"""
SIH26001 — AI-Based Landslide Early-Warning Platform (NER)
============================================================
FastAPI application entry point.

Design principles (spec §2):
  - Software-only: no hardware components
  - IMD = primary weather source; ERA5/Open-Meteo = historical gap-fill
  - XGBoost = primary model; RF = baseline/ensemble candidate
  - Citizens = supplementary evidence; system warns without any citizen report
  - All predictions include source provenance and model version
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from api.routes import router as main_router, SECTORS, live_data
from api.report_routes import router as report_router
from api.sensor_routes import router as sensor_router
from api.alert_routes import router as alert_router
from api.provenance_routes import router as provenance_router

try:
    from ml.predict import is_model_ready, get_model_meta
except Exception:
    def is_model_ready(): return False
    def get_model_meta(): return {}


async def _refresh_loop():
    """Background task: refresh live weather for all 44 sectors every 15 minutes."""
    while True:
        try:
            await live_data.fetch_all_sectors(SECTORS)
        except Exception as e:
            print(f"[WARN] Background refresh error: {e}")
        await asyncio.sleep(900)  # 15 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background live-data refresh
    print("[SIH26001] Starting background weather refresh task…")
    task = asyncio.create_task(_refresh_loop())
    yield
    # Shutdown: cancel gracefully
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="SIH26001 — Landslide Early-Warning Platform (NER)",
    description=(
        "AI-based landslide risk monitoring for North East India. "
        "Primary model: XGBoost. Data: IMD + ERA5 + GSI + NBSS-LUP + NRSC LULC. "
        "Citizen reports are supplementary evidence — system warns independently."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(main_router)
app.include_router(report_router)
app.include_router(sensor_router)
app.include_router(alert_router)
app.include_router(provenance_router)


@app.get("/health")
def health_check():
    meta = get_model_meta()
    return {
        "status": "healthy",
        "model_ready": is_model_ready(),
        "model_info": {
            "primary_model": meta.get("model_selected", "Physics FoS (fallback)"),
            "trained_on":    meta.get("trained_on", "not yet trained"),
            "cv_roc_auc":    meta.get("cv_roc_auc_mean", None),
            "training_split": meta.get("training_split_method", "N/A"),
        },
        "data_sources": {
            "primary_weather": "IMD Operational API",
            "historical_weather": "ERA5 via Open-Meteo Archive (reanalysis gap-fill)",
            "terrain": "NASA SRTM 30m via Open-Meteo Elevation API",
            "inventory": "GSI Landslide Atlas 2021 + NDMA Annual Reports",
            "soil": "NBSS-LUP NE India State Soil Surveys",
        },
        "design_notes": {
            "sensor_data": "Software API connector only — no project hardware deployed",
            "citizen_reports": "Supplementary evidence — early warning operates independently",
        },
        "sectors_monitored": 44,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
