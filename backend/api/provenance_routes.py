from fastapi import APIRouter, HTTPException
from models.schemas import ProvenanceResponse, ModelInfoResponse
from datetime import datetime
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml'))
from predict import get_model_meta

router = APIRouter(prefix="/api/v1", tags=["provenance"])

@router.get("/data-provenance/{sector_id}", response_model=ProvenanceResponse)
def get_data_provenance(sector_id: str):
    meta = get_model_meta()
    return {
        'sector_id': sector_id,
        'rainfall_source': 'IMD / Open-Meteo Reanalysis',
        'rainfall_obs_time': datetime.utcnow().isoformat() + 'Z',
        'terrain_source': 'NASA SRTM 30m',
        'terrain_resolution': '30m',
        'soil_source': 'NBSS-LUP State Reports',
        'satellite_source': 'Open-Meteo',
        'model_version': meta.get('model_selected', 'Unknown'),
        'model_trained_on': meta.get('trained_on', 'Unknown'),
        'cv_roc_auc': meta.get('cv_roc_auc_mean', 0.0),
        'brier_score': meta.get('brier_score', 0.0),
        'features_used': len(meta.get('feature_cols', [])),
        'prediction_timestamp': datetime.utcnow().isoformat() + 'Z'
    }

@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    meta = get_model_meta()
    if not meta:
        raise HTTPException(status_code=404, detail="Model metadata not found")
    
    return {
        'model_name': 'SIH2026_Landslide_Prediction',
        'model_version': meta.get('model_selected', 'Unknown'),
        'primary_model': 'XGBClassifier',
        'baseline_model': 'RandomForestClassifier',
        'calibration_method': meta.get('calibration_method', 'sigmoid'),
        'trained_on': meta.get('trained_on', 'Unknown'),
        'n_training_samples': meta.get('n_samples', 0),
        'n_positive': meta.get('n_positive', 0),
        'n_negative': meta.get('n_negative', 0),
        'cv_roc_auc_mean': meta.get('cv_roc_auc_mean', 0.0),
        'cv_roc_auc_std': meta.get('cv_roc_auc_std', 0.0),
        'brier_score': meta.get('brier_score', 0.0),
        'pr_auc': meta.get('pr_auc', 0.0),
        'false_alarm_rate': meta.get('false_alarm_rate', 0.0),
        'data_sources': meta.get('data_sources', []),
        'feature_count': len(meta.get('feature_cols', [])),
        'training_split_method': meta.get('training_split_method', 'spatial_temporal')
    }
