"""
reports.py  —  FLARE Flood Report Generation API
-------------------------------------------------
Flow:
  1. Read all_gauges.json from the same folder as this file (drop the file there)
  2. Derive inundation probability per gauge (deterministic, no extra ML call)
  3. Call LLM with a strict JSON-output system prompt
  4. Parse & validate the LLM response with Pydantic
  5. Return a single structured JSON ready for the frontend PDF renderer

Output shape (ReportResponse):
{
  "generated_at": "2026-05-29T15:36:54",
  "report_period": { "start": "2022-08-11", "end": "2022-08-17" },
  "overall_status": "Warning",          # worst status across all gauges
  "executive_summary": "...",           # 2-3 sentence plain-text overview
  "gauges": [
    {
      "gauge":               "Bunji",
      "station":             "BUNJI",
      "river":               "INDUS",
      "status":              "Warning",
      "inundation_probability": 0.68,   # 0-1 float derived from forecast vs thresholds
      "current_discharge":   5573.4,    # first forecast day predicted value (m³/s)
      "peak_discharge":      5708.2,
      "peak_date":           "2022-08-13",
      "thresholds":          { "warning": 5541.0, "severe": 7388.0, "extreme": 8773.2 },
      "situation":           "...",     # 1-paragraph LLM-written narrative
      "recommended_actions": ["...", "..."]   # 2-4 bullet actions
    },
    ...
  ],
  "regional_actions": ["...", "..."]    # cross-basin actions if any gauge ≥ Warning
}
"""

import json
import os
import re
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

load_dotenv()

logger = logging.getLogger(__name__)

# Path to the gauge JSON file — place all_gauges.json in the same folder as this file
GAUGES_FILE = os.path.join(os.path.dirname(__file__), "all_gauges.json")

router = APIRouter(prefix="/reports", tags=["Reports"])

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
LLM_MODEL      = "openai/gpt-4o-mini"

# ---------------------------------------------------------------------------
# Inundation probability helper
# ---------------------------------------------------------------------------

def compute_inundation_probability(gauge: Dict[str, Any]) -> float:
    """
    Deterministic proxy for inundation probability.

    Uses the p80 (upper_80) ensemble band — the optimistic-high scenario —
    and checks what fraction of the 7-day forecast days breach each threshold.
    The final score is a weighted count:
        breach_warning  → +0.4 per day  (capped at warning_threshold)
        breach_severe   → +0.7 per day
        breach_extreme  → +1.0 per day
    Normalised to [0, 1].

    This is a heuristic; replace with your actual probabilistic model output
    (e.g. Monte-Carlo pass rate) when available.
    """
    thresholds = gauge.get("thresholds", {})
    w = thresholds.get("warning",  float("inf"))
    s = thresholds.get("severe",   float("inf"))
    e = thresholds.get("extreme",  float("inf"))

    forecast = gauge.get("forecast", [])
    if not forecast:
        return 0.0

    score = 0.0
    max_score = len(forecast) * 1.0  # worst case: every day breaches extreme

    for day in forecast:
        val = day.get("upper_80", day.get("predicted", 0))
        if val >= e:
            score += 1.0
        elif val >= s:
            score += 0.7
        elif val >= w:
            score += 0.4

    prob = round(min(score / max_score, 1.0), 3)
    return prob


# ---------------------------------------------------------------------------
# Pydantic response models
# ---------------------------------------------------------------------------

class ThresholdModel(BaseModel):
    warning:  float
    severe:   float
    extreme:  float


class GaugeReport(BaseModel):
    gauge:                   str
    station:                 str
    river:                   str
    status:                  str
    inundation_probability:  float = Field(..., ge=0.0, le=1.0)
    current_discharge:       float
    peak_discharge:          float
    peak_date:               str
    thresholds:              ThresholdModel
    situation:               str          # 1-paragraph narrative
    recommended_actions:     List[str]    # 2-4 actions

    @field_validator("status")
    @classmethod
    def normalise_status(cls, v: str) -> str:
        return v.strip().capitalize()


class ReportPeriod(BaseModel):
    start: str
    end:   str


class ReportResponse(BaseModel):
    generated_at:     str
    report_period:    ReportPeriod
    overall_status:   str
    executive_summary: str
    gauges:           List[GaugeReport]
    regional_actions: List[str]


# ---------------------------------------------------------------------------
# System prompt  (instructs LLM to return ONLY JSON)
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are a flood risk analyst for Pakistan's northern river basins \
(Jhelum, Neelum, Kunhar, Indus tributaries in AJK and KPK).

You will receive a JSON array of gauge station objects.  Each object contains:
  - gauge, station, river, status
  - inundation_probability  (0–1 float; >0.6 = high risk)
  - current_discharge, peak_discharge, peak_date  (m³/s)
  - thresholds: warning / severe / extreme  (m³/s)
  - 7-day forecast array

YOUR TASK:
Return ONLY a single valid JSON object — no markdown, no prose outside the JSON.
The JSON must conform exactly to this schema:

{
  "executive_summary": "<2–3 sentence plain-text basin-wide overview>",
  "gauges": [
    {
      "gauge": "<gauge key as given>",
      "situation": "<1 paragraph, ≤120 words, plain text, no bullet points>",
      "recommended_actions": ["<action 1>", "<action 2>", ...]
    }
    // one object per gauge, in the same order as the input
  ],
  "regional_actions": ["<cross-basin action>", ...]
}

Rules:
- situation: discuss current discharge vs thresholds, peak forecast day, \
  uncertainty range, and downstream impact.  Plain sentences only.
- recommended_actions: 2 actions for Normal, 3 for Warning, 4 for Danger/Extreme. \
  Start each with a verb (e.g. "Deploy", "Issue", "Activate").
- regional_actions: include only if at least one gauge is Warning or worse; \
  otherwise return an empty array [].
- Use m³/s for all discharge values.  Be specific about dates from the data.
- Do NOT add any key not listed in the schema above.
- Output must be parseable by Python json.loads() with no preprocessing.
"""


# ---------------------------------------------------------------------------
# File loader
# ---------------------------------------------------------------------------

def load_gauges_from_file() -> Dict[str, Any]:
    """Read all_gauges.json from the same directory as reports.py."""
    if not os.path.exists(GAUGES_FILE):
        raise HTTPException(
            status_code=500,
            detail=f"Gauge data file not found: {GAUGES_FILE}. "
                   "Place all_gauges.json in the same folder as reports.py.",
        )
    try:
        with open(GAUGES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"all_gauges.json is not valid JSON: {exc}",
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

STATUS_ORDER = {"normal": 0, "warning": 1, "danger": 2, "severe": 2, "extreme": 3}

def worst_status(statuses: List[str]) -> str:
    ranked = sorted(statuses, key=lambda s: STATUS_ORDER.get(s.lower(), 0), reverse=True)
    return ranked[0].capitalize() if ranked else "Normal"


def build_llm_payload(enriched_gauges: List[Dict[str, Any]]) -> str:
    """Compact serialisation passed to the LLM."""
    slim = []
    for g in enriched_gauges:
        slim.append({
            "gauge":                  g["gauge"],
            "station":                g["station"],
            "river":                  g["river"],
            "status":                 g["status"],
            "inundation_probability": g["inundation_probability"],
            "current_discharge":      g["current_discharge"],
            "peak_discharge":         g["peak_discharge"],
            "peak_date":              g["peak_date"],
            "thresholds":             g["thresholds"],
            "forecast":               g["forecast"],   # full 7-day array
        })
    return json.dumps(slim, indent=2)


def call_llm(payload_str: str) -> Dict[str, Any]:
    """Call OpenRouter and return the parsed JSON from the LLM."""
    if not OPENROUTER_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured.")

    body = {
        "model": LLM_MODEL,
        "response_format": {"type": "json_object"},   # force JSON mode
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Generate the flood situation report for these gauge stations:\n\n"
                    + payload_str
                ),
            },
        ],
        "max_tokens": 4096,
        "temperature": 0.3,   # low temp → more deterministic / factual
    }

    try:
        res = requests.post(
            OPENROUTER_URL,
            json=body,
            headers={
                "Authorization":  f"Bearer {OPENROUTER_KEY}",
                "Content-Type":   "application/json",
                "HTTP-Referer":   "http://localhost:5173",
                "X-Title":        "FLARE Flood Report",
            },
            timeout=90,
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="LLM service timed out.")
    except requests.exceptions.ConnectionError as exc:
        raise HTTPException(status_code=503, detail=f"LLM service unreachable: {exc}")

    if res.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"LLM error {res.status_code}: {res.text[:300]}",
        )

    raw_text = res.json()["choices"][0]["message"]["content"]
    return parse_llm_json(raw_text)


def parse_llm_json(raw: str) -> Dict[str, Any]:
    """
    Robust parser: strips markdown fences if present, then json.loads.
    Raises HTTPException 502 if the JSON is malformed or missing required keys.
    """
    # Strip ```json ... ``` or ``` ... ``` fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("LLM returned non-JSON: %s", raw[:500])
        raise HTTPException(
            status_code=502,
            detail=f"LLM returned malformed JSON: {exc}",
        )

    # Validate required top-level keys
    required_keys = {"executive_summary", "gauges", "regional_actions"}
    missing = required_keys - data.keys()
    if missing:
        raise HTTPException(
            status_code=502,
            detail=f"LLM JSON missing keys: {missing}",
        )

    return data


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=ReportResponse)
def generate_report(
    # current_user: dict = Depends(require_approved_user),   # uncomment when auth is wired
):
    """
    POST /reports/generate
    No request body — reads all_gauges.json from the same folder as this file.
    Returns: ReportResponse JSON
    """
    gauges_json = load_gauges_from_file()
    if not gauges_json:
        raise HTTPException(status_code=500, detail="all_gauges.json is empty.")

    # ------------------------------------------------------------------
    # 1. Enrich each gauge with derived fields
    # ------------------------------------------------------------------
    enriched: List[Dict[str, Any]] = []
    report_start: Optional[str] = None
    report_end:   Optional[str] = None

    for key, g in gauges_json.items():
        forecast = g.get("forecast", [])

        # Determine current & peak discharge
        current_discharge = forecast[0]["predicted"] if forecast else 0.0
        peak_day = max(forecast, key=lambda d: d["predicted"]) if forecast else {}
        peak_discharge = peak_day.get("predicted", 0.0)
        peak_date      = peak_day.get("date", "N/A")

        # Report date range
        if forecast:
            if report_start is None or forecast[0]["date"] < report_start:
                report_start = forecast[0]["date"]
            if report_end is None or forecast[-1]["date"] > report_end:
                report_end = forecast[-1]["date"]

        enriched.append({
            "gauge":                  key,
            "station":                g.get("station", key),
            "river":                  g.get("river", "—"),
            "status":                 (g.get("status") or "Normal"),
            "inundation_probability": compute_inundation_probability(g),
            "current_discharge":      round(current_discharge, 1),
            "peak_discharge":         round(peak_discharge, 1),
            "peak_date":              peak_date,
            "thresholds":             g.get("thresholds", {}),
            "forecast":               forecast,
            "generated_at":           g.get("generated_at", ""),
        })

    # ------------------------------------------------------------------
    # 2. Call the LLM
    # ------------------------------------------------------------------
    llm_payload_str = build_llm_payload(enriched)
    llm_data        = call_llm(llm_payload_str)

    # ------------------------------------------------------------------
    # 3. Parse & merge LLM output with enriched data
    # ------------------------------------------------------------------
    # Build a lookup: gauge_key → LLM narrative
    llm_gauge_map: Dict[str, Dict] = {}
    for item in llm_data.get("gauges", []):
        llm_gauge_map[item["gauge"]] = item

    gauge_reports: List[GaugeReport] = []
    for g in enriched:
        llm_g = llm_gauge_map.get(g["gauge"], {})
        gauge_reports.append(
            GaugeReport(
                gauge                  = g["gauge"],
                station                = g["station"],
                river                  = g["river"],
                status                 = g["status"],
                inundation_probability = g["inundation_probability"],
                current_discharge      = g["current_discharge"],
                peak_discharge         = g["peak_discharge"],
                peak_date              = g["peak_date"],
                thresholds             = ThresholdModel(**g["thresholds"]),
                situation              = llm_g.get("situation", "No narrative generated."),
                recommended_actions    = llm_g.get("recommended_actions", []),
            )
        )

    overall = worst_status([g["status"] for g in enriched])

    return ReportResponse(
        generated_at      = datetime.utcnow().isoformat(timespec="seconds"),
        report_period     = ReportPeriod(
            start = report_start or "N/A",
            end   = report_end   or "N/A",
        ),
        overall_status    = overall,
        executive_summary = llm_data.get("executive_summary", ""),
        gauges            = gauge_reports,
        regional_actions  = llm_data.get("regional_actions", []),
    )