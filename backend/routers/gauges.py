import os
import json
import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["Gauges"])

BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
ML_DIR        = os.path.join(BASE_DIR, '..', '..', 'ml')
FORECAST_DIR  = os.path.join(ML_DIR, 'outputs', 'forecasts')
DISCHARGE_DIR = os.path.join(ML_DIR, 'data', 'discharge')


def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)


@router.get('/gauges')
def get_all_gauges():
    combined_path = os.path.join(FORECAST_DIR, 'all_gauges.json')
    if not os.path.exists(combined_path):
        raise HTTPException(status_code=404, detail='No forecast data available. Run inference first.')

    data = load_json(combined_path)
    gauges = []
    for gauge_name, info in data.items():
        gauges.append({
            'id'          : gauge_name,
            'name'        : info['station'],
            'river'       : info['river'],
            'lat'         : info['lat'],
            'lon'         : info['lon'],
            'status'      : info['status'].lower(),
            'generated_at': info['generated_at'],
            't1_forecast' : info['forecast'][0]['predicted'] if info['forecast'] else None,
        })
    return {'gauges': gauges, 'total': len(gauges)}


@router.get('/gauges/{gauge_name}')
def get_gauge_forecast(gauge_name: str):
    gauge_path = os.path.join(FORECAST_DIR, f'{gauge_name}.json')
    if not os.path.exists(gauge_path):
        raise HTTPException(status_code=404, detail=f'No forecast data found for gauge: {gauge_name}')

    data = load_json(gauge_path)

    historical = []
    discharge_path = os.path.join(DISCHARGE_DIR, f'{gauge_name}.csv')
    if data.get('forecast') and os.path.exists(discharge_path):
        forecast_start = data['forecast'][0]['date']
        df = pd.read_csv(discharge_path, parse_dates=['date'])
        df = df.sort_values('date')
        df = df[df['date'] < forecast_start].tail(3)
        historical = [
            {'date': row['date'].strftime('%Y-%m-%d'), 'discharge': round(float(row['discharge_m3s']), 1)}
            for _, row in df.iterrows()
        ]

    data['historical'] = historical
    return data
