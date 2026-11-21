# FLARE: flood forecasting and disaster-response platform for Pakistan

FLARE forecasts river discharge 7 days ahead at 13 gauging stations in the Jhelum and Indus basins, with uncertainty ranges. It turns each forecast into a flood status and a satellite-derived flood-extent map. A web platform lets citizens, relief organisations and administrators coordinate shelters, incident reports, lost & found and donations around those forecasts.

> The method and its evaluation are described in the paper **"FLARE: A Regional LSTM-CMAL Model for Probabilistic River-Discharge Forecasting and SAR-Derived Flood Inundation Mapping in the Jhelum and Indus Basins of Pakistan"** by H. Khan, F. Shahid and S. M. Awan (NED University of Engineering and Technology). All metrics below come from that paper.

## Problem

The 2022 and 2025 monsoon floods showed the limits of Pakistan's static warning arrangements: alerts often came too late to act on. Building a data-driven forecaster here faces two obstacles:

1. **Gauge records are short and have gaps lasting years.** Data-hungry models struggle on this alone.
2. **A discharge number alone doesn't tell anyone what to do.** It has to become a flood extent on a map. Doing that conventionally needs high-quality elevation models and hydraulic simulation, which are expensive to build and maintain.

## Dataset

| Source | Content |
|---|---|
| **WAPDA** (Water and Power Development Authority) | Daily river discharge in m³/s, 2009–2023, 5,479 days per station |
| **NASA IMERG** | Satellite rainfall, averaged over each station's watershed |
| **Sentinel-1 SAR** (via Google Earth Engine) | 504 historical flood-extent maps at 10 m resolution, covering low-flow, rising and monsoon-peak periods |

The rivers covered are the Indus, Jhelum, Neelum, Kunhar and Poonch.

**Filling gaps in the discharge records:** the method depends on the station.
- Five stations had complete records and needed no filling.
- Where a strongly correlated upstream station exists, gaps were filled by regression on that station.
- Otherwise, gaps were filled with the average for that day of the year, which preserves the seasonal pattern.

**Rainfall** was capped at 200 mm/day to remove erroneous spikes.

**Model inputs:** each sample is a 60-day window of past data, used to forecast the next 7 days. Inputs are standardised using statistics from the training set only.

**Splits:** 50,505 training samples, 5,603 validation samples, and a separate test split.

The raw WAPDA data and the trained weights are not included in this repository.

## Approach

FLARE has two stages, trained independently and joined at inference.

### Stage 1: one LSTM shared across all stations, with an uncertainty head

**One model for all 13 stations.** Each station's record is short, so a single network trained on every station pools what it learns across the basin. The only part specific to each station is a small **upstream combiner**. It compresses that station's upstream gauges into 5 features (zero-padded if the station has no upstream gauges). The upstream links follow the river network; for example, Domel uses five gauges upstream of it.

**Encoder–decoder LSTM:**
1. A 2-layer **hindcast LSTM** (hidden size 64, dropout 0.2) reads 60 days of history: local discharge, rainfall and the 5 upstream features.
2. Learned **state handoff** layers pass its memory to a **forecast LSTM**.
3. The forecast LSTM produces one output per forecast day, feeding each day's point forecast into the next.

**CMAL output head.** Each forecast day outputs a mixture of 3 asymmetric Laplace distributions. Discharge can't go below zero but can spike sharply, so a symmetric Gaussian would understate flood risk. From this distribution the model reports:
- the **point forecast**: the mixture's weighted mean;
- a **60% prediction interval**: from the 20th to the 80th percentile.

**Training:**
- Loss: negative log-likelihood of the forecast distribution.
- Optimiser: Adam at learning rate 1e-3, reduced on plateau, with gradient clipping at 1.0.
- 50 epochs, batch size 64, on a GPU.
- The checkpoint with the lowest validation loss is kept.

### Stage 2: per-pixel discharge thresholds learned from satellite radar

For each gauge, historical Sentinel-1 flood maps are paired with that day's discharge. Every pixel then learns a **discharge threshold**: the pixel is predicted flooded when discharge exceeds it.

- **Choosing thresholds:** an iterative procedure trades off correct flood predictions against false ones. Sweeping its strictness gives a range of precision–recall trade-offs, and the setting with the best F-score is kept.
- **Inference is a single raster comparison.** No elevation model or hydraulic simulation is needed at prediction time.
- **Beyond the training range:** for discharge higher than ever observed, the code grows the most extreme historical extent outward in proportion to the excess ([flood_api/thresholding_model.py](flood_api/thresholding_model.py)).

### Operational pipeline

- **Daily forecasts:** [ml/scheduler.py](ml/scheduler.py) runs [ml/inference.py](ml/inference.py) every day at 00:00. Each run writes one JSON file per gauge with:
  - the 7-day point forecast;
  - the 20th- and 80th-percentile bounds;
  - the station's coordinates;
  - a status based on the next day's forecast. The levels are *Normal*, *Warning*, *Danger* and *Extreme*, from each gauge's warning, severe and extreme thresholds in [ml/thresholds](ml/thresholds/).
- **Flood maps:** [flood_api/batch_inference.py](flood_api/batch_inference.py) renders a flood-extent overlay per gauge, which `flood_api` serves to the map.

## Architecture

```
WAPDA discharge ─┐
IMERG rainfall ──┼─► 60-day window ─► upstream combiner (per gauge) ─► hindcast LSTM ─► state handoff
upstream gauges ─┘                                                                         │
                                                                  forecast LSTM (7 steps) ◄┘
                                                                           │
                                                 CMAL head (3 asymmetric Laplacians)
                                                                           │
                      point forecast + 20th/80th percentile per day ──► status vs gauge thresholds
                                                                           │
                         per-pixel discharge thresholds (from Sentinel-1) ─► flood-extent map
                                                                           │
   ml/api (forecasts) · flood_api (flood maps) ─► React + Leaflet map ◄─ backend (FastAPI + Supabase)
```

```
ml/            LSTM-CMAL inference, daily scheduler, forecast API, gauge thresholds and coordinates
flood_api/     per-pixel threshold model, batch flood-map rendering, flood-map API
backend/       FastAPI + PostgreSQL (Supabase): JWT auth with roles, shelters, incident reports,
               lost & found, donation accounts, organisations, approvals (31 endpoints)
flare/         React 19 + Vite, Redux Toolkit, Tailwind, Leaflet: map, dashboards, admin approval
```

The platform has three roles:
- **Citizens** submit reports and lost & found entries.
- **Organisations**, once approved, manage shelters and donation accounts.
- **Admins** approve sign-ups and content changes.

## Results

All figures are from the paper.

**Discharge forecasting (13 stations).** The average R² across all stations and forecast days is **0.818**, meaning the model explains about 82% of daily variation in discharge.

| Forecast day | Avg R² | Avg MAE (m³/s) | Avg RMSE (m³/s) |
|---|---|---|---|
| T+1 | **0.916** | 36.3 | 76.4 |
| T+2 | 0.872 | 60.6 | 125.1 |
| T+3 | 0.838 | 83.6 | 168.1 |
| T+4 | 0.810 | 102.0 | 199.6 |
| T+5 | 0.787 | 116.3 | 223.8 |
| T+6 | 0.763 | 128.0 | 243.8 |
| T+7 | 0.742 | 137.4 | 259.1 |

**Per station** (average R² over the 7 forecast days):

| Group | Stations |
|---|---|
| **Excellent** | Kaghan 0.961 · Bunji 0.916 · Besham Qila 0.914 · Shatial Bridge 0.909 · Talhata Bridge 0.908 |
| **Good** | Domel 0.888 · Hattian Bala 0.887 · Dhudhnial 0.883 · Chakothi 0.882 · Chattar Kalass 0.869 · Muzaffarabad 0.836 |
| **Moderate** | Kotli 0.531 |
| **Poor** | Phulra 0.252 |

**Training:** validation loss fell steadily alongside training loss over all 50 epochs (−0.66 to −1.22 validation, −0.87 to −1.33 training) and never diverged from it.

**Flood-extent mapping:** F1 score against held-out Sentinel-1 flood maps, per gauge:

| Gauge | F1 | Gauge | F1 |
|---|---|---|---|
| Shatial Bridge | **0.969** | Muzaffarabad | 0.818 |
| Chattar Kalass | 0.933 | Bunji | 0.762 |
| Talhata Bridge | 0.906 | Hattian Bala | 0.760 |
| Kaghan | 0.880 | Chakothi | 0.757 |
| Besham Qila | 0.840 | Kotli | 0.542 |
| Domel | 0.819 | | |

Eight of the 11 evaluated gauges score above 0.80.

## Error and root-cause analysis

**Skill depends on the catchment more than on the model.**
- Large catchments with gauges upstream (Kaghan, Bunji, Besham Qila) score above 0.9 R². Their flow collects runoff from a wide area and is announced in advance by the upstream gauges.
- Small, isolated headwater stations with fast-changing flow (Kotli 0.531, Phulra 0.252) have no upstream signal. Their floods come from local rain that a watershed-averaged satellite product smooths out.
- Kotli is also the weakest gauge for flood-extent mapping (F1 0.542). Mapping errors there are partly inherited from the discharge forecast.

**Errors are concentrated in flood peaks.** RMSE grows much faster than MAE: 76 vs 36 m³/s at T+1, and 259 vs 137 m³/s at T+7. Large errors are therefore rare but sit in the high-flow events that matter most. This is why the model predicts a full, right-skewed distribution and not just a single value.

**The uncertainty ranges are asymmetric, as they should be.** The upper bound sits further above the forecast than the lower bound sits below it, more so downstream and further ahead. At isolated stations some peak flows still fall outside the 60% range, so the model is mildly overconfident in extreme conditions.

**How to use each forecast day:** skill drops quickly over the first 3 days and then more slowly. So:
- **T+1 to T+3** should drive alerts;
- **T+4 to T+5** support planning;
- **T+6 to T+7** indicate the trend only.

**Floods larger than any on record.** Flood-extent thresholds are learned only from discharge that has actually been observed. Beyond that range the mapping can only grow the largest recorded flood outward, so a genuinely new flood pattern may be under-mapped.

**Issues found while reviewing this code:**
- [ml/inference.py](ml/inference.py) cuts the target gauge's history off at its end date, but reads upstream gauges with plain `.tail(60)` and no date filter. If the upstream CSVs extend past the end date, the target and upstream windows cover different days. Filtering upstream data by the same date would keep them aligned.
- The forecast end date is fixed at `2022-08-10`, which replays the 2022 flood season. Live operation needs it set from the latest data available.
- `JWT_SECRET` falls back to `"secret"` if the environment variable isn't set ([backend/auth_utils.py](backend/auth_utils.py)). In production the backend should refuse to start without it.

## How to run

**Forecasting** needs `ml/models/regional_lstm_cmal_final.pt`, `ml/models/scalers.pkl`, and discharge and rainfall CSVs in `ml/data/`:

```bash
cd ml
pip install torch pandas numpy scikit-learn fastapi uvicorn schedule
python inference.py            # writes ml/outputs/forecasts/*.json
python scheduler.py            # or: rerun daily at 00:00
uvicorn api:app --port 8001    # GET /api/gauges, /api/gauges/{name}
```

**Flood maps:**

```bash
cd flood_api
pip install -r requirements.txt
python batch_inference.py
uvicorn api:app --port 8002    # GET /api/flood_maps, /api/flood_maps/{gauge}
```

**Backend:** needs `DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` and `FRONTEND_URL` set in your environment. Never commit them.

```bash
cd backend
pip install -r requirements.txt
python create_tables.py
uvicorn main:app --reload --port 8000
python -m tests.run_tests      # API tests
```

**Frontend:** set `VITE_API_URL`, plus `VITE_OPENROUTE_API_KEY` (see `flare/.env.example`).

```bash
cd flare
npm install
npm run dev                    # http://localhost:5173
```

**Deployment:** the backend deploys to Render ([render.yaml](render.yaml)) and the frontend to Vercel ([flare/vercel.json](flare/vercel.json)).

## What I learned

- **With short records, pool stations into one model.** A single LSTM across 13 gauges, with only a tiny station-specific layer, trains well on about 50k samples, where a separate model per station would have far less data each.
- **For flood warning, predicting a distribution matters more than predicting a point.** The errors that matter are in the peaks, and a right-skewed output keeps that risk visible where a symmetric model would hide it.
- **Station physics sets the ceiling.** No architecture change lifts a flashy headwater station with no upstream signal to the skill of a large downstream catchment. Better rainfall data and more upstream gauges would.
- **Forecasts only help once they become actions.** That means converting discharge to statuses and flood maps, and wiring them into a platform where shelters, reports and donations can be coordinated.
- **Plain methods go far when data is scarce.** Per-pixel thresholds learned from free Sentinel-1 radar give F1 above 0.8 at most gauges without any elevation model at prediction time.

## Team

Final-year project, NED University of Engineering and Technology. Supervisor: Ms. Samia Masood Awan. Discharge data provided by WAPDA.
