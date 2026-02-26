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
MODEL_PATH = Path("out/financial_model.pkl")
FEATURES_PATH = Path("out/features_v1.pkl")

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

class FinancialModelAgent(BaseAgent):
    def __init__(self, model_version: str = "xgb_v1"):
        super().__init__("financial_model")
        self.model_version = model_version
        self.models: Dict[str, Any] = {} # target -> {alpha -> model}
        self._load_models()

    def _load_models(self):
        if MODEL_PATH.exists():
            with open(MODEL_PATH, 'rb') as f:
                self.models = pickle.load(f)
            self.logger.info(f"Loaded models from {MODEL_PATH}")
        else:
            self.logger.warning(f"Model file {MODEL_PATH} not found. Agent will fail if run() is called.")

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
        manifest_path = Path("out/feature_manifest.json")
        if manifest_path.exists():
            import json
            with open(manifest_path, 'r') as f:
                feature_cols = json.load(f)['feature_list']
        else:
            # Fallback to non-target/non-id columns if manifest is missing
            exclude = ['company_id', 'date', 'quarter', 'revenue', 'ebitda', 'net_income', 'eps', 'revenue_growth', 'ebitda_margin', 'guidance_flag', 'sentiment_score', 'topic_confidence', 'transcript_excerpt', 'restatement_flag', 'seed', 'provenance_note']
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
                model = xgb.XGBRegressor(
                    objective="reg:quantileerror",
                    quantile_alpha=alpha,
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=5,
                    tree_method="hist", # Efficient for larger data
                    random_state=42
                )
                
                model.fit(
                    train_df[feature_cols], 
                    train_df[target],
                    eval_set=[(val_df[feature_cols], val_df[target])],
                    verbose=False
                )
                trained_models[target][alpha] = model

        # Save models and feature list
        save_data = {
            "models": trained_models,
            "feature_cols": feature_cols
        }
        
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(save_data, f)
        
        self.models = save_data
        self.logger.info(f"Models saved to {MODEL_PATH}")

    async def run(self, input_data: FinancialModelInput) -> FinancialModelOutput:
        if not self.models:
            self._load_models()
        
        if not self.models:
            raise RuntimeError("Financial model not trained or loaded.")

        self.logger.info(f"Predicting for company {input_data.company_id} as of {input_data.as_of_date}")
        
        feature_cols = self.models['feature_cols']
        # Extract features from input dict
        X = pd.DataFrame([input_data.features])[feature_cols]
        
        forecasts = {}
        for target in ["revenue", "ebitda"]:
            p05 = float(self.models['models'][target][0.05].predict(X)[0])
            p50 = float(self.models['models'][target][0.5].predict(X)[0])
            p95 = float(self.models['models'][target][0.95].predict(X)[0])
            
            # Ensure monotonicity
            p50 = max(p05, p50)
            p95 = max(p50, p95)
            
            forecasts[target] = ForecastValue(p05=p05, p50=p50, p95=p95)

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

