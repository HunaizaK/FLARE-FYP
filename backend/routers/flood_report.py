import json
import os
from fastapi import APIRouter, HTTPException, Depends
from dependencies import require_approved_user

router = APIRouter(prefix="/flood-report", tags=["Flood Report"])

REPORT_FILE = os.path.join(os.path.dirname(__file__), "flood_report.json")


@router.get("")
def get_flood_report(current_user: dict = Depends(require_approved_user)):
    if not os.path.exists(REPORT_FILE):
        raise HTTPException(status_code=404, detail="Report not available.")
    try:
        with open(REPORT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Invalid report data: {exc}")
