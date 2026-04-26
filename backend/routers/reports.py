from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import ReportCreate, ReportResponse, ReportUpdate, ReportStatus, AIAnalysisResult
from datetime import datetime
import uuid, random

router = APIRouter()

# ─── In-memory store (replace with DB in production) ─────────────────────────
_reports: dict[str, dict] = {}

# ─── Mock AI classifier ───────────────────────────────────────────────────────
def _run_ai_analysis(report_id: str):
    """Simulates async AI confidence scoring."""
    if report_id in _reports:
        _reports[report_id]["ai_confidence"] = random.randint(55, 96)
        _reports[report_id]["evidence"] = [
            f"{random.randint(2, 20)} User Reports",
            "Sensor Data Corroborated",
            "Satellite Imagery Matched",
        ]

# ─── Routes ───────────────────────────────────────────────────────────────────
@router.post("/", response_model=ReportResponse, status_code=201)
def create_report(payload: ReportCreate, background_tasks: BackgroundTasks):
    report_id = f"RPT-{uuid.uuid4().hex[:6].upper()}"
    report = {
        **payload.model_dump(),
        "id": report_id,
        "timestamp": datetime.utcnow(),
        "status": ReportStatus.pending,
        "ai_confidence": 0,
        "user_reports": 1,
        "evidence": ["1 User Report", "Awaiting AI Processing"],
    }
    _reports[report_id] = report
    # Run AI classification asynchronously
    background_tasks.add_task(_run_ai_analysis, report_id)
    return report

@router.get("/", response_model=list[ReportResponse])
def list_reports(status: str | None = None):
    reports = list(_reports.values())
    if status:
        reports = [r for r in reports if r["status"] == status]
    return sorted(reports, key=lambda r: r["timestamp"], reverse=True)

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str):
    if report_id not in _reports:
        raise HTTPException(status_code=404, detail="Report not found")
    return _reports[report_id]

@router.patch("/{report_id}", response_model=ReportResponse)
def update_report_status(report_id: str, payload: ReportUpdate):
    if report_id not in _reports:
        raise HTTPException(status_code=404, detail="Report not found")
    _reports[report_id]["status"] = payload.status
    return _reports[report_id]

@router.delete("/{report_id}", status_code=204)
def delete_report(report_id: str):
    if report_id not in _reports:
        raise HTTPException(status_code=404, detail="Report not found")
    del _reports[report_id]
