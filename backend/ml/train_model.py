"""
NE India Landslide Prediction — ML Training Pipeline
=====================================================
Model:   Random Forest + XGBoost soft-voting ensemble
Data:    Real ERA5 weather (Open-Meteo Archive) + GSI/NDMA inventory
Target:  Landslide probability (binary: 0=stable, 1=landslide)

Architecture:
  LIVE SENSOR DATA
        ↓
  Feature Engineering
        ↓
  ┌─────────────────────────────────────┐
  │     ENSEMBLE  (soft voting)         │
  │  RandomForest  +  XGBoost           │
  │  (500 trees)      (500 estimators)  │
  └─────────────────────────────────────┘
        ↓
  Landslide Probability  [0.0 – 1.0]
        ↓
  Risk Classification
  0.00–0.30 → GREEN
  0.30–0.50 → YELLOW
  0.50–0.75 → ORANGE
  >0.75     → RED

  PLUS: Physics FoS (Infinite Slope Model) fused into final score.

Run:
  python train_model.py
  (downloads real data on first run, uses cache on subsequent runs)
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import date

from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score, classification_report, confusion_matrix,
    average_precision_score, brier_score_loss
)
from sklearn.calibration import CalibratedClassifierCV
from xgboost import XGBClassifier

# ── Paths ─────────────────────────────────────────────────────────────────────
_HERE = Path(__file__).parent
MODEL_DIR  = _HERE / "trained"
MODEL_DIR.mkdir(exist_ok=True)
DATA_CSV   = _HERE / "training_data_real.csv"

FEATURE_COLS = [
    "slope_deg", "aspect_sin", "aspect_cos", "elevation_m", "twi",
    "rainfall_24h_mm", "rainfall_7d_mm", "rainfall_15d_mm", "rainfall_30d_mm",
    "api_7d", "soil_moisture", "soil_moisture_28",
    "temp_c", "wind_kmh",
    "lithology", "soil_type", "lulc",
    "dist_fault_km", "dist_stream_km",
    "month",
]
TARGET_COL = "landslide"


# ─────────────────────────────────────────────────────────────────────────────
def load_or_download() -> pd.DataFrame:
    if DATA_CSV.exists():
        print(f"✓ Loading cached dataset: {DATA_CSV}")
        df = pd.read_csv(DATA_CSV)
    else:
        print("◈ No cached data found — downloading from Open-Meteo Archive (ERA5)…")
        from data_downloader import build_real_dataset
        df = build_real_dataset(save_csv=True)
    return df


# ─────────────────────────────────────────────────────────────────────────────
def validate_data(df: pd.DataFrame) -> pd.DataFrame:
    missing = [c for c in FEATURE_COLS + [TARGET_COL] if c not in df.columns]
    if missing:
        sys.exit(f"[FATAL] Missing columns in dataset: {missing}")
    df = df.dropna(subset=FEATURE_COLS + [TARGET_COL])
    pos = int(df[TARGET_COL].sum())
    neg = int((df[TARGET_COL] == 0).sum())
    print(f"  Rows after cleaning: {len(df)}  (pos={pos}, neg={neg}, ratio=1:{neg//max(pos,1)})")
    if pos < 30:
        sys.exit("[FATAL] Too few positive samples. Run data_downloader.py first.")
    return df


# ─────────────────────────────────────────────────────────────────────────────
def build_models(scale_pos_weight: float):
    """Returns (rf, xgb, ensemble) — all unfitted."""
    rf = RandomForestClassifier(
        n_estimators      = 500,
        max_depth         = 12,
        min_samples_leaf  = 3,
        max_features      = "sqrt",
        class_weight      = "balanced_subsample",
        n_jobs            = -1,
        random_state      = 42,
    )
    xgb = XGBClassifier(
        n_estimators      = 500,
        max_depth         = 8,
        learning_rate     = 0.04,
        subsample         = 0.8,
        colsample_bytree  = 0.8,
        scale_pos_weight  = scale_pos_weight,
        eval_metric       = "logloss",
        use_label_encoder = False,
        n_jobs            = -1,
        random_state      = 42,
        verbosity         = 0,
    )
    ensemble = VotingClassifier(
        estimators = [("rf", rf), ("xgb", xgb)],
        voting     = "soft",
        weights    = [1, 1],
    )
    return rf, xgb, ensemble


# ─────────────────────────────────────────────────────────────────────────────
def evaluate_cv(model, X: np.ndarray, y: np.ndarray, n_splits: int = 5):
    """Stratified k-fold cross-validation across all metrics."""
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    scoring = ["roc_auc", "average_precision", "f1", "accuracy"]
    results = cross_validate(model, X, y, cv=cv, scoring=scoring, n_jobs=-1)
    print(f"\n{'─'*50}")
    print(f"  {n_splits}-Fold Cross-Validation (stratified)")
    print(f"{'─'*50}")
    for metric in scoring:
        vals = results[f"test_{metric}"]
        print(f"  {metric:<22} {vals.mean():.4f} ± {vals.std():.4f}")
    print(f"{'─'*50}")
    return results


# ─────────────────────────────────────────────────────────────────────────────
def print_feature_importance(rf_model, feature_names: list):
    importances = pd.Series(
        rf_model.feature_importances_, index=feature_names
    ).sort_values(ascending=False)
    print("\n  Top-10 Feature Importances (Random Forest):")
    for fname, imp in importances.head(10).items():
        bar = "█" * int(imp * 60)
        print(f"  {fname:<22} {bar}  {imp:.4f}")


# ─────────────────────────────────────────────────────────────────────────────
def train():
    print("═" * 55)
    print("  NE INDIA LANDSLIDE ML — TRAINING PIPELINE")
    print("  Data: ERA5 (Open-Meteo Archive) + GSI/NDMA inventory")
    print("═" * 55)

    # 1. Load real data
    df = load_or_download()
    df = validate_data(df)

    X = df[FEATURE_COLS].values.astype(np.float32)
    y = df[TARGET_COL].values.astype(np.int32)

    pos = int(y.sum())
    neg = int((y == 0).sum())
    spw = round(neg / max(pos, 1), 2)

    print(f"\n  Training set:  {len(X)} samples")
    print(f"  Positive:      {pos}   Negative: {neg}")
    print(f"  scale_pos_weight (XGB): {spw}\n")

    # 2. Scaler (saved for inference)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 3. Build models
    rf, xgb, ensemble = build_models(spw)

    # 4. Cross-validation evaluation
    print("▶ Running cross-validation on Ensemble…")
    cv_results = evaluate_cv(ensemble, X_scaled, y)

    # 5. Final fit on full dataset
    print("\n▶ Fitting final models on full dataset…")
    ensemble.fit(X_scaled, y)

    # Calibrate for well-calibrated probabilities (Platt scaling)
    calibrated = CalibratedClassifierCV(ensemble, method="sigmoid", cv="prefit")
    calibrated.fit(X_scaled, y)

    # 6. Hold-out evaluation (last 20%)
    split = int(len(X_scaled) * 0.80)
    X_tr, X_te = X_scaled[:split], X_scaled[split:]
    y_tr, y_te = y[:split], y[split:]
    ensemble.fit(X_tr, y_tr)
    proba = ensemble.predict_proba(X_te)[:, 1]
    preds = (proba >= 0.50).astype(int)

    print("\n  Hold-out Evaluation (last 20%):")
    print(f"  AUC-ROC:          {roc_auc_score(y_te, proba):.4f}")
    print(f"  Avg Precision:    {average_precision_score(y_te, proba):.4f}")
    print(f"  Brier Score:      {brier_score_loss(y_te, proba):.4f}")
    print(f"\n{classification_report(y_te, preds, target_names=['Stable','Landslide'])}")

    # Feature importance from RF arm
    rf_arm = ensemble.estimators_[0]
    print_feature_importance(rf_arm, FEATURE_COLS)

    # 7. Re-fit calibrated model on full data
    ensemble.fit(X_scaled, y)
    calibrated = CalibratedClassifierCV(ensemble, method="sigmoid", cv="prefit")
    calibrated.fit(X_scaled, y)

    # 8. Save artifacts
    joblib.dump(calibrated,    MODEL_DIR / "ensemble_calibrated.pkl")
    joblib.dump(scaler,        MODEL_DIR / "scaler.pkl")
    joblib.dump(FEATURE_COLS,  MODEL_DIR / "feature_cols.pkl")

    meta = {
        "trained_on":     str(date.today()),
        "n_samples":      len(X),
        "n_positive":     pos,
        "n_negative":     neg,
        "feature_cols":   FEATURE_COLS,
        "data_sources":   [
            "Open-Meteo Archive (ERA5, ECMWF) — real daily weather",
            "Open-Meteo Elevation API (SRTM GL3) — real terrain",
            "GSI Landslide Atlas of India 2021 — inventory",
            "NDMA Annual Disaster Reports 2001–2024",
            "GSI / NBSS-LUP / NRSC — terrain attributes",
        ],
        "cv_roc_auc_mean":  float(cv_results["test_roc_auc"].mean()),
        "cv_roc_auc_std":   float(cv_results["test_roc_auc"].std()),
        "model":            "RF(500)+XGB(500) SoftVoting, Platt-calibrated",
    }
    import json
    (MODEL_DIR / "model_meta.json").write_text(json.dumps(meta, indent=2))

    print(f"\n✓ Models saved → {MODEL_DIR}/")
    print(f"  ensemble_calibrated.pkl  |  scaler.pkl  |  feature_cols.pkl")
    print(f"  CV AUC-ROC: {cv_results['test_roc_auc'].mean():.4f} ± {cv_results['test_roc_auc'].std():.4f}")


if __name__ == "__main__":
    train()
