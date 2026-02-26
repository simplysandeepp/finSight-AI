"""
explainability/explainer.py
===========================
Implements Section 5.
SHAP TreeExplainer for XGBoost.
"""

from typing import List, Dict, Any
import shap
import numpy as np
import pandas as pd
from pydantic import BaseModel

class ShapValue(BaseModel):
    feature: str
    shap: float

class ExplanationPayload(BaseModel):
    request_id: str
    model_version: str
    feature_version: str
    shap_values: List[ShapValue]
    top_sentences: List[Dict]
    confidence_breakdown: Dict[str, float]
    audit_link: str

def get_explanation(request_id: str, model: Any, X_row: pd.DataFrame) -> ExplanationPayload:
    """
    model: the trained XGBoost model (median quantile, revenue)
    X_row: single-row DataFrame with feature columns
    """
    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_row)
        
        feature_names = X_row.columns.tolist()
        shap_list = [
            ShapValue(feature=f, shap=float(s))
            for f, s in sorted(
                zip(feature_names, shap_values[0]),
                key=lambda x: abs(x[1]),
                reverse=True
            )
        ][:10]  # Top 10 features
    except Exception as e:
        shap_list = [ShapValue(feature="unavailable", shap=0.0)]
    
    return ExplanationPayload(
        request_id=request_id,
        model_version="xgb_v1",
        feature_version="feats_v1",
        shap_values=shap_list,
        top_sentences=[],
        confidence_breakdown={},
        audit_link=f"https://audit.internal/{request_id}"
    )
