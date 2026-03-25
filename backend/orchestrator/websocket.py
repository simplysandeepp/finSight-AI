"""WebSocket endpoint for live prediction progress updates."""

import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .orchestrate import orchestrate


router = APIRouter()


def _iso_now() -> str:
    return datetime.utcnow().isoformat() + "Z"


async def _send_step(websocket: WebSocket, step: str, status: str, message: str, latency_ms=None):
    payload = {
        "type": "progress",
        "timestamp": _iso_now(),
        "step": step,
        "status": status,
        "message": message,
    }
    if latency_ms is not None:
        payload["latency_ms"] = int(latency_ms)
    await websocket.send_text(json.dumps(payload))


@router.websocket("/ws/predict")
async def predict_websocket(websocket: WebSocket):
    """Run prediction and push progress events over WebSocket."""
    await websocket.accept()

    try:
        raw = await websocket.receive_text()
        req = json.loads(raw)

        company_id = (req.get("company_id") or "").strip().upper()
        as_of_date = (req.get("as_of_date") or "").strip()

        if not company_id or not as_of_date:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "company_id and as_of_date are required"
            }))
            await websocket.close(code=1003)
            return

        await _send_step(websocket, "data_fetch", "running", f"Fetching market data for {company_id}...")
        await _send_step(websocket, "financial_model", "running", "Running financial model...")
        await _send_step(websocket, "news_macro", "running", "Analyzing news and macro signals...")
        await _send_step(websocket, "competitor", "running", "Comparing peer performance...")
        await _send_step(websocket, "ensembler", "running", "Combining agent outputs...")

        result = await orchestrate(company_id=company_id, as_of_date=as_of_date)

        latencies = result.get("agent_latencies", {})
        if isinstance(latencies, dict):
            if "financial_model" in latencies:
                await _send_step(
                    websocket,
                    "financial_model",
                    "done",
                    f"Financial model done ({latencies['financial_model']}ms)",
                    latency_ms=latencies["financial_model"],
                )
            if "news_macro" in latencies:
                await _send_step(
                    websocket,
                    "news_macro",
                    "done",
                    f"News and macro done ({latencies['news_macro']}ms)",
                    latency_ms=latencies["news_macro"],
                )
            if "competitor" in latencies:
                await _send_step(
                    websocket,
                    "competitor",
                    "done",
                    f"Competitor analysis done ({latencies['competitor']}ms)",
                    latency_ms=latencies["competitor"],
                )

        await websocket.send_text(json.dumps({
            "type": "final",
            "timestamp": _iso_now(),
            "result": result,
        }))

    except WebSocketDisconnect:
        return
    except Exception as exc:
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "timestamp": _iso_now(),
                "message": str(exc),
            }))
        finally:
            await websocket.close(code=1011)
