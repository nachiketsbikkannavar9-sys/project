from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum

# ─── Enums ────────────────────────────────────────────────────────────────────
class HazardType(str, Enum):
    flood      = "Flood"
    fire       = "Fire"
    earthquake = "Earthquake"
    landslide  = "Landslide"
    chemical   = "Chemical"
    sos        = "SOS"

class SeverityLevel(str, Enum):
    low      = "low"
    medium   = "medium"
    high     = "high"
    critical = "critical"

class ReportStatus(str, Enum):
    pending  = "pending"
    verified = "verified"
    rejected = "rejected"

class GeofenceLevel(str, Enum):
    RED    = "RED"
    ORANGE = "ORANGE"
    YELLOW = "YELLOW"

# ─── Report ───────────────────────────────────────────────────────────────────
class ReportCreate(BaseModel):
    type: HazardType
    severity: SeverityLevel = SeverityLevel.medium
    lat: float = Field(..., ge=-90,  le=90)
    lng: float = Field(..., ge=-180, le=180)
    location: str
    description: Optional[str] = None
    photo_url: Optional[str] = None

class ReportResponse(ReportCreate):
    id: str
    timestamp: datetime
    status: ReportStatus = ReportStatus.pending
    ai_confidence: int = Field(default=0, ge=0, le=100)
    user_reports: int = 1
    evidence: List[str] = []

class ReportUpdate(BaseModel):
    status: ReportStatus

# ─── Alert ───────────────────────────────────────────────────────────────────
class AlertCreate(BaseModel):
    report_id: str
    message: str
    zone_ids: Optional[List[str]] = []

class AlertResponse(AlertCreate):
    id: str
    timestamp: datetime
    broadcast_count: int = 0

# ─── Zone / Geofence ─────────────────────────────────────────────────────────
class Coordinate(BaseModel):
    lat: float
    lng: float

class ZoneCreate(BaseModel):
    name: str
    level: GeofenceLevel
    coordinates: List[Coordinate]

class ZoneResponse(ZoneCreate):
    id: str
    active: bool = True
    created: datetime

# ─── AI Analysis Result ───────────────────────────────────────────────────────
class AIAnalysisResult(BaseModel):
    hazard_type: HazardType
    confidence: int = Field(..., ge=0, le=100)
    evidence: List[str]
    recommended_action: str
