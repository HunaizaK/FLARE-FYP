import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["Flood Maps"])

BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
FLOOD_MAPS_DIR = os.path.join(BASE_DIR, '..', '..', 'flood_api', 'outputs', 'flood_maps')


def load_json(path):
    with open(path) as f:
        return json.load(f)


@router.get('/flood_maps')
def get_all_flood_maps():
    idx = os.path.join(FLOOD_MAPS_DIR, 'flood_maps_index.json')
    if not os.path.exists(idx):
        raise HTTPException(status_code=404, detail='No flood maps yet. Run: python batch_inference.py')
    return load_json(idx)


@router.get('/flood_maps/{gauge_name}')
def get_flood_map(gauge_name: str):
    meta = os.path.join(FLOOD_MAPS_DIR, gauge_name, 'meta.json')
    if not os.path.exists(meta):
        raise HTTPException(status_code=404, detail=f'No flood map for gauge: {gauge_name}')
    return load_json(meta)
