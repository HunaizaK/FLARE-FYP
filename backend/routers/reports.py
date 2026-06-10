import os
import requests
from dotenv import load_dotenv

load_dotenv()
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from dependencies import require_approved_user

router = APIRouter(prefix="/reports", tags=["Reports"])

ML_API_BASE    = "http://localhost:8001"
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are a flood risk analyst for Pakistan's northern river basins "
    "(Jhelum, Neelum, Kunhar, and Indus tributaries in AJK and KPK).\n\n"
    "You will receive JSON data from a hydrological monitoring station including:\n"
    "- Current flood status (normal / warning / danger)\n"
    "- 7-day river discharge forecast with probabilistic uncertainty bounds (p10, p50, p90 in m³/s)\n"
    "- Recent historical discharge readings\n"
    "- Warning and danger threshold values\n\n"
    "Write a clear, professional flood situation report in 3–4 paragraphs covering:\n"
    "1. Current situation summary — station name, river, current status, and recent observed discharge\n"
    "2. Short-term forecast analysis — directional trend, peak risk day(s), uncertainty range\n"
    "3. Risk assessment — how forecast values compare to warning/danger thresholds, "
    "potential impact on downstream communities\n"
    "4. Recommended actions — tailored to severity "
    "(normal = monitoring, warning = preparedness, danger = evacuation/emergency)\n\n"
    "Language must be accessible to emergency responders and the general public. "
    "Use m³/s for all discharge values. Be specific about dates and magnitudes from the data. "
    "Do not use markdown, bullet points, or headers — write plain, connected paragraphs only."
)


class GenerateReportRequest(BaseModel):
    gauge_name: str


@router.post("/generate")
def generate_report(
    body: GenerateReportRequest,
    current_user: dict = Depends(require_approved_user),
):
    gauge_name = body.gauge_name.strip()
    if not gauge_name:
        raise HTTPException(status_code=400, detail="gauge_name is required")

    # 1. Fetch gauge forecast from ML API
    ml_url = f"{ML_API_BASE}/api/gauges/{gauge_name}"
    try:
        ml_res = requests.get(ml_url, timeout=15)
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="ML forecast service is not running. Start the ML API first.",
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="ML forecast service timed out.")

    if ml_res.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail=f"No forecast data found for gauge '{gauge_name}'. Run inference first.",
        )
    if ml_res.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"ML API returned unexpected status {ml_res.status_code}.",
        )

    gauge_data = ml_res.json()

    # 2. Build compact payload for LLM
    payload = {
        "station":      gauge_data.get("station"),
        "river":        gauge_data.get("river"),
        "status":       gauge_data.get("status"),
        "generated_at": gauge_data.get("generated_at"),
        "thresholds":   gauge_data.get("thresholds"),
        "forecast":     gauge_data.get("forecast", [])[:7],
        "historical":   gauge_data.get("historical", []),
    }

    # 3. Call OpenRouter
    if not OPENROUTER_KEY:
        raise HTTPException(
            status_code=500,
            detail="OpenRouter API key not configured on the server.",
        )

    llm_payload = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Generate a flood situation report for this gauge station data:\n\n"
                    f"{__import__('json').dumps(payload, indent=2)}"
                ),
            },
        ],
    }

    try:
        llm_res = requests.post(
            OPENROUTER_URL,
            json=llm_payload,
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "FLARE Flood Report",
            },
            timeout=60,
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="LLM service timed out.")

    if llm_res.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"LLM service error: {llm_res.text[:200]}",
        )

    report_text = llm_res.json()["choices"][0]["message"]["content"]

    return {
        "success":     True,
        "gauge":       gauge_name,
        "station":     gauge_data.get("station", gauge_name.replace("_", " ")),
        "river":       gauge_data.get("river", "—"),
        "status":      (gauge_data.get("status") or "normal").lower(),
        "report":      report_text,
    }
