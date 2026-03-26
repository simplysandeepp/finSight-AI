"""
agents/financial_model.py
==========================
Implements Section 2.2 of the design doc.
XGBoost-based probabilistic forecasting with Quantile Regression.
"""

import os
import pickle
import pandas as pd
import numpy as np
import xgboost as xgb
from typing import List, Dict, Optional, Any, Tuple
from pydantic import BaseModel, Field
from .base import BaseAgent, BaseAgentInput, BaseAgentOutput
from pathlib import Path

# Static configuration
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "out" / "financial_model.pkl"
FEATURES_PATH = BASE_DIR / "out" / "features_v1.pkl"

class ForecastValue(BaseModel):
    p05: float
    p50: float
    p95: float
    unit: str = "million_USD"

class FeatureImportance(BaseModel):
    feature: str
    weight: float

class FinancialModelInput(BaseAgentInput):
    company_id: str
    as_of_date: str
    features: Dict[str, Any]

class FinancialModelOutput(BaseAgentOutput):
    revenue_forecast: ForecastValue
    ebitda_forecast: ForecastValue
    feature_importances: List[FeatureImportance]
    model_version: str

def calculate_confidence(p05: float, p50: float, p95: float) -> float:
    """confidence = 1 - (p95-p05)/(2*p50) clamped to [0,1]"""
    if p50 == 0:
        return 0.0
    conf = 1 - (p95 - p05) / (2 * p50)
    return float(np.clip(conf, 0, 1))


def _safe_float(value: Any) -> float:
    try:
        if value is None:
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0

class FinancialModelAgent(BaseAgent):
    def __init__(self, model_version: str = "xgb_v1"):
        super().__init__("financial_model")
        self.model_version = model_version
        self.models: Dict[str, Any] = {} # target -> {alpha -> model}
        self.scale_reference: Dict[str, float] = {}
        self._load_models()

    def _load_models(self):
        if MODEL_PATH.exists():
            with open(MODEL_PATH, 'rb') as f:
                self.models = pickle.load(f)
            # Load version from model if available
            if 'version' in self.models:
                self.model_version = self.models['version']
            self.scale_reference = self.models.get("scale_reference") or self._build_scale_reference_from_features()
            self.logger.info(f"Loaded models from {MODEL_PATH} (version: {self.model_version})")
        else:
            self.logger.warning(f"Model file {MODEL_PATH} not found. Agent will fail if run() is called.")

    def _build_scale_reference_from_features(self) -> Dict[str, float]:
        revenue_feature_cols = [
            "revenue_lag_1q",
            "revenue_lag_2q",
            "revenue_lag_4q",
            "revenue_roll_mean_4q",
        ]

        if not FEATURES_PATH.exists():
            return {}

        try:
            with open(FEATURES_PATH, 'rb') as f:
                data = pickle.load(f)
        except Exception:
            return {}

        feature_df = data.get("train")
        if feature_df is None or feature_df.empty:
            feature_df = data.get("full_featured")

        if feature_df is None or feature_df.empty:
            return {}

        available_cols = [col for col in revenue_feature_cols if col in feature_df.columns]
        if not available_cols:
            return {}

        p95_values = [float(feature_df[col].quantile(0.95)) for col in available_cols]
        max_values = [float(feature_df[col].max()) for col in available_cols]
        return {
            "feature_anchor": float(np.median(p95_values)),
            "feature_cap": float(max(max_values)),
        }

    def _get_scale_multiplier(self, input_features: Dict[str, Any]) -> float:
        revenue_feature_cols = [
            "revenue_lag_1q",
            "revenue_lag_2q",
            "revenue_lag_4q",
            "revenue_roll_mean_4q",
        ]
        observed_values = []
        for col in revenue_feature_cols:
            value = _safe_float(input_features.get(col))
            if value > 0:
                observed_values.append(value)

        if not observed_values:
            return 1.0

        typical_input_revenue = float(np.median(observed_values))
        feature_anchor = float(self.scale_reference.get("feature_anchor", 0) or 0)
        feature_cap = float(self.scale_reference.get("feature_cap", 0) or 0)

        if feature_anchor <= 0 or feature_cap <= 0:
            return 1.0

        if typical_input_revenue <= feature_cap * 1.25:
            return 1.0

        return max(1.0, typical_input_revenue / feature_anchor)

    def train(self):
        """Train XGBoost quantile regression models for Revenue and EBITDA."""
        if not FEATURES_PATH.exists():
            self.logger.error(f"Features file {FEATURES_PATH} not found. Run feature store first.")
            return

        with open(FEATURES_PATH, 'rb') as f:
            data = pickle.load(f)
        
        train_df = data['train']
        val_df = data['val']
        
        # Load feature list from manifest if possible, otherwise use a default set
        manifest_path = BASE_DIR / "out" / "feature_manifest.json"
        if manifest_path.exists():
            import json
            with open(manifest_path, 'r') as f:
                feature_cols = json.load(f)['feature_list']
        else:
            # Fallback to non-target/non-id columns if manifest is missing
            exclude = ['company_id', 'ticker', 'date', 'quarter', 'revenue', 'ebitda', 'net_income', 'eps', 'revenue_growth', 'ebitda_margin', 'guidance_flag', 'sentiment_score', 'topic_confidence', 'transcript_excerpt', 'restatement_flag', 'seed', 'provenance_note']
            feature_cols = [c for c in train_df.columns if c not in exclude]

        self.logger.info(f"Training models with {len(feature_cols)} features: {feature_cols}")
        
        targets = ["revenue", "ebitda"]
        alphas = [0.05, 0.5, 0.95]
        
        trained_models = {}
        
        for target in targets:
            trained_models[target] = {}
            for alpha in alphas:
                self.logger.info(f"Training XGBoost for {target} (alpha={alpha})")
                
                # Using quantile error objective for XGBoost >= 2.0
                # Tighter parameters for better interval stability
                model = xgb.XGBRegressor(
                    objective="reg:quantileerror",
                    quantile_alpha=alpha,
                    n_estimators=150,
                    learning_rate=0.05,  # Slower learning for stability
                    max_depth=6,
                    tree_method="hist",
                    random_state=42,
                    early_stopping_rounds=20  # Prevent overfitting to historical means
                )
                
                model.fit(
                    train_df[feature_cols], 
                    train_df[target],
                    eval_set=[(val_df[feature_cols], val_df[target])],
                    verbose=False
                )
                trained_models[target][alpha] = model

        # Generate version string based on timestamp
        from datetime import datetime
        import json
        version = f"v1.{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        revenue_feature_cols = [
            "revenue_lag_1q",
            "revenue_lag_2q",
            "revenue_lag_4q",
            "revenue_roll_mean_4q",
        ]
        available_revenue_cols = [col for col in revenue_feature_cols if col in train_df.columns]
        scale_reference = {}
        if available_revenue_cols:
            p95_values = [float(train_df[col].quantile(0.95)) for col in available_revenue_cols]
            max_values = [float(train_df[col].max()) for col in available_revenue_cols]
            scale_reference = {
                "feature_anchor": float(np.median(p95_values)),
                "feature_cap": float(max(max_values)),
            }

        # Save models and feature list with version
        save_data = {
            "models": trained_models,
            "feature_cols": feature_cols,
            "version": version,
            "trained_at": datetime.now().isoformat(),
            "scale_reference": scale_reference,
        }

        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(save_data, f)

        # Save model metadata to JSON for easy access
        metadata_path = BASE_DIR / "out" / "model_metadata.json"
        metadata = {
            "model_version": version,
            "trained_at": datetime.now().isoformat(),
            "feature_count": len(feature_cols),
            "features": feature_cols,
            "targets": ["revenue", "ebitda"],
            "quantiles": [0.05, 0.5, 0.95],
            "training_rows": {
                "train": len(train_df),
                "val": len(val_df)
            },
            "scale_reference": scale_reference,
        }
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        self.models = save_data
        self.scale_reference = scale_reference
        self.model_version = version
        self.logger.info(f"Models saved to {MODEL_PATH} (version: {version})")

    async def run(self, input_data: FinancialModelInput) -> FinancialModelOutput:
        if not self.models:
            self._load_models()
        
        if not self.models:
            raise RuntimeError("Financial model not trained or loaded.")

        self.logger.info(f"Predicting for company {input_data.company_id} as of {input_data.as_of_date}")
        
        feature_cols = self.models['feature_cols']
        # Extract features from input dict
        # NOTE: All financial values (revenue, EBITDA) are expected in MILLIONS of USD
        # Both training data (synthetic) and live data (Finnhub) use this scale
        X = pd.DataFrame([input_data.features])[feature_cols]
        
        # ═══════════════════════════════════════════════════════════════════════
        # DEBUG: Log ALL features going into the model for scale verification
        # ═══════════════════════════════════════════════════════════════════════
        self.logger.info("="*80)
        self.logger.info("DEBUG: FEATURES GOING INTO MODEL")
        self.logger.info("="*80)
        self.logger.info(f"Company: {input_data.company_id}")
        self.logger.info(f"Date: {input_data.as_of_date}")
        self.logger.info(f"\nFeature columns expected by model: {feature_cols}")
        self.logger.info(f"\nRaw input features dictionary:")
        for key, value in input_data.features.items():
            self.logger.info(f"  {key:30s} = {value}")
        self.logger.info(f"\nFeatures DataFrame (after column selection):")
        self.logger.info(f"{X.to_string()}")
        self.logger.info(f"\nFeature statistics:")
        self.logger.info(f"{X.describe().to_string()}")
        self.logger.info("="*80)
        
        forecasts = {}
        
        X_scaled = X.copy()
        scale_multiplier = self._get_scale_multiplier(input_data.features)
        if scale_multiplier > 1.0:
            for col in X_scaled.columns:
                if (
                    any(token in col for token in ("revenue", "ebitda", "income", "expenses"))
                    and "growth" not in col
                    and "margin" not in col
                ):
                    X_scaled[col] = X_scaled[col] / scale_multiplier

        # 2. HISTORICAL MARGIN EXTRACTION (The Guardrail)
        historical_margin = float(X['ebitda_margin_roll_mean_4q'].iloc[0])
        if pd.isna(historical_margin) or historical_margin <= 0:
            historical_margin = 0.15 # Fallback to 15%
            
        # 3. HORIZON DAMPENING (Fixes the "Degraded" confidence score)
        horizon = input_data.features.get('forecast_horizon_quarters', 1)
        variance_penalty = 1.0
        if horizon > 1:
            # Squeeze the P05 and P95 closer to the median by 15% to prevent wild uncertainty
            variance_penalty = 0.85 

        for target in ["revenue", "ebitda"]:
            if target == "revenue":
                # Predict Revenue
                p05_raw = float(self.models['models'][target][0.05].predict(X_scaled)[0]) * scale_multiplier
                p50_raw = float(self.models['models'][target][0.5].predict(X_scaled)[0]) * scale_multiplier
                p95_raw = float(self.models['models'][target][0.95].predict(X_scaled)[0]) * scale_multiplier
                
                # Apply Confidence Dampening
                p05_damp = p50_raw - ((p50_raw - p05_raw) * variance_penalty)
                p95_damp = p50_raw + ((p95_raw - p50_raw) * variance_penalty)

                predictions = np.sort(
                    np.maximum(np.array([p05_damp, p50_raw, p95_damp], dtype=float), 0.0)
                )
                forecasts[target] = ForecastValue(
                    p05=float(predictions[0]),
                    p50=float(predictions[1]),
                    p95=float(predictions[2])
                )
                
            elif target == "ebitda":
                # Predict EBITDA using the Margin Guardrail
                margin_p05 = historical_margin * 0.90 
                margin_p50 = historical_margin        
                margin_p95 = historical_margin * 1.05 
                
                forecasts[target] = ForecastValue(
                    p05=float(forecasts["revenue"].p05 * margin_p05),
                    p50=float(forecasts["revenue"].p50 * margin_p50),
                    p95=float(forecasts["revenue"].p95 * margin_p95)
                )


        # Confidence based on Revenue forecast (as per standard)
        confidence = calculate_confidence(
            forecasts["revenue"].p05, 
            forecasts["revenue"].p50, 
            forecasts["revenue"].p95
        )

        # Feature importance from p50 revenue model
        rev_p50_model = self.models['models']['revenue'][0.5]
        importances = rev_p50_model.get_booster().get_score(importance_type='gain')
        total_gain = sum(importances.values()) if importances else 1
        
        sorted_imps = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]
        feature_importances = [
            FeatureImportance(feature=k, weight=v/total_gain) 
            for k, v in sorted_imps
        ]

        return FinancialModelOutput(
            request_id=input_data.request_id,
            confidence=confidence,
            revenue_forecast=forecasts["revenue"],
            ebitda_forecast=forecasts["ebitda"],
            feature_importances=feature_importances,
            model_version=self.model_version
        )

if __name__ == "__main__":
    # Script mode: train the model
    from loguru import logger
    agent = FinancialModelAgent()
    agent.train()
