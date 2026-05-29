import os, json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

BASE_DIR       = Path(__file__).resolve().parent
FLOOD_MAPS_DIR = BASE_DIR / "outputs" / "flood_maps"

app = FastAPI(title="FLARE Flood Inundation API", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

FLOOD_MAPS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static/flood_maps", StaticFiles(directory=FLOOD_MAPS_DIR), name="flood_maps")


def _load_json(path):
    with open(path) as f:
        return json.load(f)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "flood_api"}


@app.get("/api/flood_maps")
def get_all_flood_maps():
    idx = FLOOD_MAPS_DIR / "flood_maps_index.json"
    if not idx.exists():
        raise HTTPException(404, "No flood maps yet. Run: python batch_inference.py")
    return _load_json(idx)


@app.get("/api/flood_maps/{gauge_name}")
def get_flood_map(gauge_name: str):
    meta = FLOOD_MAPS_DIR / gauge_name / "meta.json"
    if not meta.exists():
        raise HTTPException(404, f"No flood map for gauge: {gauge_name}")
    return _load_json(meta)