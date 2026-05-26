# ============================================================
# api.py — FastAPI endpoints for FLARE forecast data
# ============================================================

import os
import json
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title='FLARE Forecast API')

# ── CORS — allows React frontend to call this API ──────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
FORECAST_DIR  = os.path.join(BASE_DIR, 'outputs', 'forecasts')
DISCHARGE_DIR = os.path.join(BASE_DIR, 'data', 'discharge')


def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)


# ── Endpoint 1 — All gauges (for map markers) ──────────────
@app.get('/api/gauges')
def get_all_gauges():
    """
    Returns all 13 gauges with coordinates and flood status.
    Used by React to place and color markers on the map.
    """
    combined_path = os.path.join(FORECAST_DIR, 'all_gauges.json')

    if not os.path.exists(combined_path):
        raise HTTPException(
            status_code=404,
            detail='No forecast data available. Run inference first.')

    data = load_json(combined_path)

    # Return simplified list for map markers
    gauges = []
    for gauge_name, info in data.items():
        gauges.append({
            'id'     : gauge_name,
            'name'   : info['station'],
            'river'  : info['river'],
            'lat'    : info['lat'],
            'lon'    : info['lon'],
            'status' : info['status'].lower(),
            'generated_at': info['generated_at'],
            't1_forecast' : info['forecast'][0]['predicted']
            if info['forecast'] else None,
        })

    return {'gauges': gauges, 'total': len(gauges)}


# ── Endpoint 2 — Single gauge (for graph) ──────────────────
@app.get('/api/gauges/{gauge_name}')
def get_gauge_forecast(gauge_name: str):
    """
    Returns full 7-day forecast + thresholds + 60-day historical
    discharge for a single gauge. Used by React to show the graph.
    """
    gauge_path = os.path.join(FORECAST_DIR, f'{gauge_name}.json')

    if not os.path.exists(gauge_path):
        raise HTTPException(
            status_code=404,
            detail=f'No forecast data found for gauge: {gauge_name}')

    data = load_json(gauge_path)

    # Attach 3 days of historical discharge ending the day before forecast
    historical = []
    discharge_path = os.path.join(DISCHARGE_DIR, f'{gauge_name}.csv')
    if data.get('forecast') and os.path.exists(discharge_path):
        forecast_start = data['forecast'][0]['date']
        df = pd.read_csv(discharge_path, parse_dates=['date'])
        df = df.sort_values('date')
        df = df[df['date'] < forecast_start].tail(3)
        historical = [
            {
                'date'      : row['date'].strftime('%Y-%m-%d'),
                'discharge' : round(float(row['discharge_m3s']), 1),
            }
            for _, row in df.iterrows()
        ]

    data['historical'] = historical
    return data


# ── Endpoint 3 — Health check ──────────────────────────────
@app.get('/api/health')
def health_check():
    return {'status': 'ok', 'message': 'FLARE API is running'}