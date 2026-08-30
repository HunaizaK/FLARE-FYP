import os, io, json
from pathlib import Path
from datetime import datetime
import numpy as np
from PIL import Image
from rasterio.transform import array_bounds
from rasterio.warp import transform_bounds
from thresholding_model import load_pickle

BASE_DIR        = Path(__file__).resolve().parent
FLOOD_MODEL_DIR = BASE_DIR / "flood_models"
OUTPUT_DIR      = BASE_DIR / "outputs" / "flood_maps"
LSTM_FORECAST_DIR = Path(os.environ.get(
    "LSTM_FORECAST_DIR",
    BASE_DIR.parent / "ml" / "outputs" / "forecasts",
))

COLOR_LOW_CONF  = (100, 180, 255, 140)
COLOR_HIGH_CONF = ( 20,  80, 200, 220)


def compute_leaflet_bounds(model):
    H, W = model.shape
    left, bottom, right, top = array_bounds(H, W, model.transform)
    if model.crs and model.crs.to_string() != "EPSG:4326":
        left, bottom, right, top = transform_bounds(
            model.crs, "EPSG:4326", left, bottom, right, top)
    return [[bottom, left], [top, right]]


def render_png(mask):
    H, W = mask.shape
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[mask == 1] = COLOR_LOW_CONF
    rgba[mask == 2] = COLOR_HIGH_CONF
    buf = io.BytesIO()
    Image.fromarray(rgba).save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def process_gauge(gauge, forecast_data):
    pkl_path = FLOOD_MODEL_DIR / f"{gauge}.pkl"
    if not pkl_path.exists():
        print(f"  SKIP {gauge}: no pickle at {pkl_path}")
        return None

    forecasts = forecast_data.get("forecast", [])
    if not forecasts:
        print(f"  SKIP {gauge}: no forecast entries")
        return None

    peak_idx  = max(range(len(forecasts)), key=lambda i: forecasts[i]["predicted"])
    peak_q    = float(forecasts[peak_idx]["predicted"])
    peak_date = forecasts[peak_idx]["date"]

    model = load_pickle(pkl_path)
    leaflet_bounds = compute_leaflet_bounds(model)
    mask = model.predict(peak_q)
    png_bytes = render_png(mask)

    gauge_out_dir = OUTPUT_DIR / gauge
    gauge_out_dir.mkdir(parents=True, exist_ok=True)
    with open(gauge_out_dir / "peak.png", "wb") as f:
        f.write(png_bytes)

    all_days = [
        {"day": i+1, "date": d["date"], "discharge_m3s": round(float(d["predicted"]), 1), "is_peak": i == peak_idx}
        for i, d in enumerate(forecasts)
    ]

    entry = {
        "gauge":          gauge,
        "station":        forecast_data.get("station", gauge),
        "river":          forecast_data.get("river", ""),
        "lat":            forecast_data.get("lat"),
        "lon":            forecast_data.get("lon"),
        "status":         forecast_data.get("status", "").lower(),
        "max_train_Q":    float(model.max_train_Q),
        "leaflet_bounds": leaflet_bounds,
        "peak": {
            "day":              peak_idx + 1,
            "date":             peak_date,
            "discharge_m3s":    round(peak_q, 1),
            "extrapolated":     peak_q > model.max_train_Q,
            "pixels_low_conf":  int((mask >= 1).sum()),
            "pixels_high_conf": int((mask >= 2).sum()),
            "png_path":         f"flood_maps/{gauge}/peak.png",
        },
        "all_days": all_days,
    }

    with open(gauge_out_dir / "meta.json", "w") as f:
        json.dump(entry, f, indent=2)

    print(f"  {gauge}: peak day {peak_idx+1} ({peak_date}) Q={peak_q:.1f} m³/s")
    return entry


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    combined_path = LSTM_FORECAST_DIR / "all_gauges.json"
    if not combined_path.exists():
        raise SystemExit(f"LSTM forecast not found: {combined_path}")

    with open(combined_path) as f:
        all_forecasts = json.load(f)

    print(f"Reading {len(all_forecasts)} gauges from {combined_path}\n")
    index = {"generated_at": datetime.now().isoformat(timespec="seconds"), "gauges": {}}

    for gauge, forecast_data in all_forecasts.items():
        entry = process_gauge(gauge, forecast_data)
        if entry:
            index["gauges"][gauge] = entry

    index_path = OUTPUT_DIR / "flood_maps_index.json"
    with open(index_path, "w") as f:
        json.dump(index, f, indent=2)

    print(f"\nDone. {len(index['gauges'])} gauges processed.")


if __name__ == "__main__":
    main()