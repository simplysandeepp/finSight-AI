"""Pytest stubs for optional heavy dependencies used at import time."""

import sys
import types
import numpy as np


def _ensure_xgboost_stub() -> None:
    if "xgboost" in sys.modules:
        return

    class _DummyBooster:
        def get_score(self, importance_type=None):
            return {"revenue_lag_1q": 1.0}

    class _DummyXGBRegressor:
        def __init__(self, *args, **kwargs):
            pass

        def fit(self, *args, **kwargs):
            return self

        def predict(self, X):
            return np.array([100.0] * len(X))

        def get_booster(self):
            return _DummyBooster()

    mod = types.ModuleType("xgboost")
    mod.XGBRegressor = _DummyXGBRegressor
    sys.modules["xgboost"] = mod


def _ensure_shap_stub() -> None:
    if "shap" in sys.modules:
        return

    class _DummyTreeExplainer:
        def __init__(self, model):
            self.model = model

        def shap_values(self, X):
            return np.zeros((len(X), len(X.columns)))

    mod = types.ModuleType("shap")
    mod.TreeExplainer = _DummyTreeExplainer
    sys.modules["shap"] = mod


def _ensure_groq_stub() -> None:
    if "groq" in sys.modules:
        return

    class RateLimitError(Exception):
        pass

    class _DummyCompletions:
        async def create(self, *args, **kwargs):
            raise RuntimeError("groq unavailable in tests")

    class _DummyChat:
        def __init__(self):
            self.completions = _DummyCompletions()

    class AsyncGroq:
        def __init__(self, *args, **kwargs):
            self.chat = _DummyChat()

    mod = types.ModuleType("groq")
    mod.RateLimitError = RateLimitError
    mod.AsyncGroq = AsyncGroq
    sys.modules["groq"] = mod


def _ensure_newsapi_stub() -> None:
    if "newsapi" in sys.modules:
        return

    class NewsApiClient:
        def __init__(self, *args, **kwargs):
            pass

        def get_everything(self, *args, **kwargs):
            return {"articles": []}

        def get_top_headlines(self, *args, **kwargs):
            return {"articles": []}

    mod = types.ModuleType("newsapi")
    mod.NewsApiClient = NewsApiClient
    sys.modules["newsapi"] = mod


def _ensure_fredapi_stub() -> None:
    if "fredapi" in sys.modules:
        return

    class _Series:
        def __init__(self, values):
            self._values = values

        def dropna(self):
            return self

        @property
        def iloc(self):
            class _ILoc:
                def __getitem__(self, idx):
                    data = [2.0, 2.5]
                    return data[idx]

            return _ILoc()

    class Fred:
        def __init__(self, *args, **kwargs):
            pass

        def get_series(self, *args, **kwargs):
            return _Series([2.0, 2.5])

    mod = types.ModuleType("fredapi")
    mod.Fred = Fred
    sys.modules["fredapi"] = mod


def _ensure_finnhub_stub() -> None:
    if "finnhub" in sys.modules:
        return

    class Client:
        def __init__(self, *args, **kwargs):
            pass

        def financials_reported(self, *args, **kwargs):
            return {"data": []}

        def company_profile2(self, *args, **kwargs):
            return {}

        def company_basic_financials(self, *args, **kwargs):
            return {"metric": {}}

        def company_peers(self, *args, **kwargs):
            return []

    mod = types.ModuleType("finnhub")
    mod.Client = Client
    sys.modules["finnhub"] = mod


def _ensure_aiohttp_stub() -> None:
    if "aiohttp" in sys.modules:
        return

    class _DummyResponse:
        status = 200

        async def json(self):
            return {}

    class _DummyRequestCtx:
        async def __aenter__(self):
            return _DummyResponse()

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class ClientResponse:
        pass

    class ClientSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def get(self, *args, **kwargs):
            return _DummyRequestCtx()

    mod = types.ModuleType("aiohttp")
    mod.ClientSession = ClientSession
    mod.ClientResponse = ClientResponse
    sys.modules["aiohttp"] = mod


def _ensure_google_generativeai_stub() -> None:
    if "google.generativeai" in sys.modules:
        return

    def configure(**kwargs):
        return None

    class _GenerationConfig:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class _Types:
        GenerationConfig = _GenerationConfig

    class GenerativeModel:
        def __init__(self, model_name=None, system_instruction=None):
            self.model_name = model_name
            self.system_instruction = system_instruction

        def generate_content(self, prompt, generation_config=None):
            class _Resp:
                text = "{}"

            return _Resp()

    mod = types.ModuleType("google.generativeai")
    mod.configure = configure
    mod.types = _Types
    mod.GenerativeModel = GenerativeModel
    sys.modules["google.generativeai"] = mod


_ensure_xgboost_stub()
_ensure_shap_stub()
_ensure_groq_stub()
_ensure_newsapi_stub()
_ensure_fredapi_stub()
_ensure_finnhub_stub()
_ensure_aiohttp_stub()
_ensure_google_generativeai_stub()
