from fastapi import APIRouter, HTTPException
from models.schemas import AlertCreate, AlertResponse
from datetime import datetime
import uuid

router = APIRouter()

_alerts: dict[str, dict] = {}

@router.post("/broadcast", response_model=AlertResponse, status_code=201)
def broadcast_alert(payload: AlertCreate):
    """
    Verifies a hazard report and broadcasts an alert to all users.
    In production: push via WebSocket / FCM / SMS gateway.
    """
    alert_id = f"ALERT-{uuid.uuid4().hex[:6].upper()}"
    alert = {
        **payload.model_dump(),
        "id": alert_id,
        "timestamp": datetime.utcnow(),
        "broadcast_count": 1000,  # mock: users in affected area
    }
    _alerts[alert_id] = alert
    return alert

@router.get("/", response_model=list[AlertResponse])
def list_alerts():
    return sorted(_alerts.values(), key=lambda a: a["timestamp"], reverse=True)

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: str):
    if alert_id not in _alerts:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _alerts[alert_id]
