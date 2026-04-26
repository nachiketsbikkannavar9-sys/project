from fastapi import APIRouter, HTTPException
from models.schemas import ZoneCreate, ZoneResponse
from datetime import datetime
import uuid

router = APIRouter()

_zones: dict[str, dict] = {}

@router.post("/", response_model=ZoneResponse, status_code=201)
def create_zone(payload: ZoneCreate):
    zone_id = f"GF-{uuid.uuid4().hex[:6].upper()}"
    zone = {
        **payload.model_dump(),
        "id": zone_id,
        "active": True,
        "created": datetime.utcnow(),
    }
    _zones[zone_id] = zone
    return zone

@router.get("/", response_model=list[ZoneResponse])
def list_zones(active_only: bool = False):
    zones = list(_zones.values())
    if active_only:
        zones = [z for z in zones if z["active"]]
    return zones

@router.get("/{zone_id}", response_model=ZoneResponse)
def get_zone(zone_id: str):
    if zone_id not in _zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    return _zones[zone_id]

@router.patch("/{zone_id}/toggle", response_model=ZoneResponse)
def toggle_zone(zone_id: str):
    if zone_id not in _zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    _zones[zone_id]["active"] = not _zones[zone_id]["active"]
    return _zones[zone_id]

@router.delete("/{zone_id}", status_code=204)
def delete_zone(zone_id: str):
    if zone_id not in _zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    del _zones[zone_id]
