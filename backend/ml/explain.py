"""
SHAP Explainability — TreeExplainer
====================================
Produces model contribution values (NOT causal percentages).
Uses shap.TreeExplainer for fast inference with RF/XGBoost.

IMPORTANT WORDING:
  Use: 'model contribution'
  Do NOT label as: 'causal percentage', 'probability share', or 'physical cause'
"""
import numpy as np

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    import warnings
    warnings.warn("shap library not found.")

DISPLAY_NAMES = {
    'rainfall_24h_mm': '24h Rainfall',
    'soil_moisture': 'Soil Moisture',
    'slope_deg': 'Slope Angle',
    'elevation_m': 'Elevation',
    'rainfall_6h_mm': '6h Rainfall',
}

class SHAPExplainer:
    def __init__(self, model, feature_names: list):
        self.model = model
        self.feature_names = feature_names
        self.explainer = None
        if SHAP_AVAILABLE:
            try:
                self.explainer = shap.TreeExplainer(model)
            except Exception as e:
                pass

    def explain(self, feature_vector: np.ndarray) -> dict:
        if not SHAP_AVAILABLE or self.explainer is None:
            return {'contributors': [], 'top_reason': 'N/A', 'shap_sum': 0.0, 'base_value': 0.0}
        
        shap_vals = self.explainer.shap_values(feature_vector)
        # Handle multi-class / single-class outputs
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]
        if len(shap_vals.shape) > 1:
            shap_vals = shap_vals[0]
            
        expected_value = self.explainer.expected_value
        if isinstance(expected_value, (list, np.ndarray)):
            expected_value = expected_value[-1]

        norm_importances = self._normalize_importances(shap_vals)
        contributors = []
        for i, val in enumerate(shap_vals):
            if abs(val) > 1e-4:
                feat = self.feature_names[i]
                contributors.append({
                    'feature': feat,
                    'direction': self._direction(val),
                    'importance': float(norm_importances[i]),
                    'display_name': DISPLAY_NAMES.get(feat, feat)
                })
                
        contributors.sort(key=lambda x: x['importance'], reverse=True)
        top_reason = generate_top_reason(contributors)
        
        return {
            'contributors': contributors,
            'top_reason': top_reason,
            'shap_sum': float(np.sum(shap_vals)),
            'base_value': float(expected_value)
        }

    def _direction(self, shap_val) -> str:
        return 'up' if shap_val > 0 else 'down'

    def _normalize_importances(self, shap_vals) -> list:
        abs_vals = np.abs(shap_vals)
        total = np.sum(abs_vals)
        if total == 0:
            return [0.0] * len(shap_vals)
        return list(abs_vals / total)

def generate_top_reason(contributors: list) -> str:
    if not contributors:
        return "No specific factors identified."
    top = [c['display_name'] for c in contributors[:3]]
    return f"Elevated risk primarily driven by {', '.join(top)}."
