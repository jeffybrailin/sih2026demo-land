import numpy as np
from typing import Optional, Dict, Any

"""
Feature Pipeline — Central feature engineering module.
Must produce a consistent feature dict for both training and inference.

Features:
- Terrain: slope_deg, aspect_sin, aspect_cos, elevation_m, twi, curvature, relief_m
- Rainfall: 1h, 6h, 12h, 24h, 3d, 7d, 15d, 30d accumulations, intensity, api_7d
- Soil/moisture: soil_moisture, soil_moisture_28, soil_class
- Geology: lithology, lulc, ndvi
- Distance: dist_fault_km, dist_stream_km
- Historical: historical_density
- Context: month, season_code, state_code
- Weather: temp_c, wind_kmh
"""

FEATURE_COLS = [
    'slope_deg', 'aspect_sin', 'aspect_cos', 'elevation_m', 'twi', 'curvature', 'relief_m',
    'rainfall_1h_mm', 'rainfall_6h_mm', 'rainfall_12h_mm', 'rainfall_24h_mm',
    'rainfall_3d_mm', 'rainfall_7d_mm', 'rainfall_15d_mm', 'rainfall_30d_mm',
    'rainfall_intensity', 'api_7d',
    'soil_moisture', 'soil_moisture_28', 'soil_class',
    'lithology', 'lulc', 'ndvi',
    'dist_fault_km', 'dist_stream_km',
    'historical_density',
    'month', 'season_code', 'state_code',
    'temp_c', 'wind_kmh',
]

state_code_map = {
    'assam': 0, 'meghalaya': 1, 'manipur': 2, 'mizoram': 3,
    'nagaland': 4, 'tripura': 5, 'arunachal pradesh': 6, 'sikkim': 7
}

LEAKAGE_GUARD = {
    'rainfall_1h_mm': 'Safe up to 1h forecast horizon',
    'rainfall_24h_mm': 'Safe up to 24h forecast horizon',
    'historical_density': 'Must not include future events',
}

def compute_api(daily_rain: list, k=0.85, days=7) -> float:
    """Antecedent Precipitation Index."""
    api = 0.0
    for i in range(min(days, len(daily_rain))):
        api += daily_rain[i] * (k ** (i + 1))
    return api

def season_from_month(month: int) -> int:
    """0=Winter(Nov-Feb) 1=PreMonsoon(Mar-May) 2=Monsoon(Jun-Sep) 3=PostMonsoon(Oct)"""
    if month in [11, 12, 1, 2]: return 0
    if month in [3, 4, 5]: return 1
    if month in [6, 7, 8, 9]: return 2
    return 3

def build_feature_vector(**kwargs) -> np.ndarray:
    """Builds feature array for inference (single sample)"""
    vec = []
    for col in FEATURE_COLS:
        vec.append(float(kwargs.get(col, 0.0)))
    return np.array(vec).reshape(1, -1)

def build_training_row(event: dict, weather_df, terrain_dict: dict) -> Optional[dict]:
    """Builds one training row."""
    row = {}
    for col in FEATURE_COLS:
        row[col] = 0.0
    # simplified mock builder
    row['slope_deg'] = terrain_dict.get('slope_deg', 0.0)
    # ... mapping logic
    return row
