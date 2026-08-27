import os
import json
import joblib
import numpy as np
from datetime import datetime

try:
    from .feature_pipeline import build_feature_vector, FEATURE_COLS
except ImportError:
    from feature_pipeline import build_feature_vector, FEATURE_COLS

def load_model():
    base_dir = os.path.dirname(__file__)
    trained_dir = os.path.join(base_dir, 'trained')
    
    xgb_path = os.path.join(trained_dir, 'xgb_primary.pkl')
    ensemble_path = os.path.join(trained_dir, 'ensemble_calibrated.pkl')
    
    model = None
    if os.path.exists(xgb_path):
        model = joblib.load(xgb_path)
    elif os.path.exists(ensemble_path):
        model = joblib.load(ensemble_path)
        
    explainer = None
    explainer_path = os.path.join(trained_dir, 'shap_explainer.pkl')
    if os.path.exists(explainer_path):
        explainer = joblib.load(explainer_path)
        
    return model, explainer

MODEL, EXPLAINER = None, None

def is_model_ready():
    global MODEL
    if MODEL is None:
        MODEL, _ = load_model()
    return MODEL is not None

def get_model_meta():
    base_dir = os.path.dirname(__file__)
    meta_path = os.path.join(base_dir, 'trained', 'model_meta.json')
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            return json.load(f)
    return {}

def predict(features_dict: dict, forecast_6h: float, forecast_12h: float, forecast_24h: float, forecast_1h: float = 0.0, fos: float = 1.5):
    global MODEL, EXPLAINER
    if MODEL is None:
        MODEL, EXPLAINER = load_model()
    if MODEL is None:
        return {}
        
    meta = get_model_meta()
    
    # Base prediction vector for 'now'
    vec_now = build_feature_vector(**features_dict)
    prob_now = float(MODEL.predict_proba(vec_now)[0, 1]) if hasattr(MODEL, 'predict_proba') else 0.0

    # 1h vector
    f1 = features_dict.copy()
    f1['rainfall_1h_mm'] = forecast_1h
    prob_1h = float(MODEL.predict_proba(build_feature_vector(**f1))[0, 1])

    # 6h vector
    f6 = features_dict.copy()
    f6['rainfall_6h_mm'] = forecast_6h
    prob_6h = float(MODEL.predict_proba(build_feature_vector(**f6))[0, 1])
    
    # 12h vector
    f12 = features_dict.copy()
    f12['rainfall_12h_mm'] = forecast_12h
    prob_12h = float(MODEL.predict_proba(build_feature_vector(**f12))[0, 1])

    # 24h vector
    f24 = features_dict.copy()
    f24['rainfall_24h_mm'] = forecast_24h
    prob_24h = float(MODEL.predict_proba(build_feature_vector(**f24))[0, 1])

    # SHAP
    shap_res = {'contributors': [], 'top_reason': ''}
    if EXPLAINER is not None:
        try:
            shap_res = EXPLAINER.explain(vec_now)
        except Exception:
            pass

    fos_override = False
    if fos < 1.0 and prob_now < 0.50:
        fos_override = True

    confidence = 'LOW'
    if abs(prob_now - 0.5) > 0.25:
        confidence = 'HIGH'
    elif abs(prob_now - 0.5) > 0.1:
        confidence = 'MEDIUM'

    return {
        'prob_now': prob_now,
        'prob_1h': prob_1h,
        'prob_6h': prob_6h,
        'prob_12h': prob_12h,
        'prob_24h': prob_24h,
        'shap_contributors': shap_res.get('contributors', []),
        'top_reason': shap_res.get('top_reason', ''),
        'model_version': meta.get('model_selected', 'Unknown'),
        'data_sources_used': meta.get('data_sources', []),
        'prediction_timestamp': datetime.utcnow().isoformat() + 'Z',
        'confidence_flag': confidence,
        'fos_override': fos_override
    }

def get_risk_band(prob: float) -> str:
    if prob < 0.25: return 'GREEN'
    if prob < 0.50: return 'YELLOW'
    if prob < 0.75: return 'ORANGE'
    return 'RED'
