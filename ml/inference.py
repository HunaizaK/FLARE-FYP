# ============================================================
# inference.py — LSTM Discharge Forecasting Inference Pipeline
# ============================================================

import os
import json
import pickle
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from datetime import datetime

# ── Paths ─────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH    = os.path.join(BASE_DIR, 'models', 'regional_lstm_cmal_final.pt')
SCALERS_PATH  = os.path.join(BASE_DIR, 'models', 'scalers.pkl')
DISCHARGE_DIR = os.path.join(BASE_DIR, 'data', 'discharge')
RAINFALL_DIR  = os.path.join(BASE_DIR, 'data', 'rainfall')
COORDS_PATH   = os.path.join(BASE_DIR, 'data', 'gauge_coordinates.json')
THRESH_PATH   = os.path.join(BASE_DIR, 'thresholds', 'demo_thresholds.json')
OUTPUT_DIR    = os.path.join(BASE_DIR, 'outputs', 'forecasts')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Hyperparameters (must match training) ─────────────────────
HINDCAST_WIN = 60
LEAD_TIMES   = 7
N_COMPRESSED = 5
LSTM_HIDDEN  = 64
LSTM_LAYERS  = 2
N_MIXTURES   = 3
DEVICE       = torch.device('cpu')

# ── Gauge Configuration ───────────────────────────────────────
GAUGE_LIST = [
    'Kotli', 'Phulra', 'Besham_Qila', 'Bunji', 'Shatial_Bridge',
    'Chakothi', 'Chattar_Kalass', 'Domel', 'Hattian_Bala',
    'Kaghan', 'Talhata_Bridge', 'Dhudhnial', 'Muzaffarabad'
]

UPSTREAM_MAP = {
    'Kotli'         : [],
    'Phulra'        : [],
    'Besham_Qila'   : ['Shatial_Bridge', 'Bunji'],
    'Bunji'         : [],
    'Shatial_Bridge': ['Bunji'],
    'Chakothi'      : ['Hattian_Bala'],
    'Chattar_Kalass': ['Hattian_Bala', 'Chakothi'],
    'Domel'         : ['Chattar_Kalass', 'Hattian_Bala',
                       'Chakothi', 'Dhudhnial', 'Muzaffarabad'],
    'Hattian_Bala'  : ['Chakothi'],
    'Kaghan'        : [],
    'Talhata_Bridge': ['Kaghan'],
    'Dhudhnial'     : [],
    'Muzaffarabad'  : ['Dhudhnial'],
}

# ============================================================
# STEP 1 — CMAL Functions (same as training)
# ============================================================

class CMALHead(nn.Module):
    def __init__(self, hidden_size, n_mixtures=N_MIXTURES):
        super().__init__()
        self.n_mixtures  = n_mixtures
        self.param_layer = nn.Linear(hidden_size, n_mixtures * 4)

    def forward(self, h):
        p   = self.param_layer(h).reshape(-1, self.n_mixtures, 4)
        mu  = p[:, :, 0]
        b   = F.softplus(p[:, :, 1]) + 1e-6
        tau = torch.sigmoid(p[:, :, 2])
        pi  = F.softmax(p[:, :, 3], dim=-1)
        return mu, b, tau, pi


def cmal_point(mu, pi):
    return (pi * mu).sum(dim=-1)


def cmal_quantile(mu, b, tau, pi, q):
    q_t   = torch.tensor(q, dtype=torch.float32, device=mu.device)
    safe  = torch.clamp(2 * tau * (1 - q_t), min=1e-8)
    safe2 = torch.clamp(2 * (1 - tau) * q_t, min=1e-8)
    offset = torch.where(
        q_t >= tau,
        -b * torch.log(safe)  / (tau + 1e-8),
         b * torch.log(safe2) / (1 - tau + 1e-8)
    )
    return (pi * (mu + offset)).sum(dim=-1)


# ============================================================
# STEP 2 — Model Architecture (same as training)
# ============================================================

class RegionalLSTM(nn.Module):
    def __init__(self, gauge_upstream_sizes,
                 n_compressed=N_COMPRESSED,
                 hidden_size=LSTM_HIDDEN,
                 num_layers=LSTM_LAYERS,
                 lead_times=LEAD_TIMES,
                 n_mixtures=N_MIXTURES):
        super().__init__()
        self.hidden_size  = hidden_size
        self.num_layers   = num_layers
        self.lead_times   = lead_times
        self.n_compressed = n_compressed

        self.upstream_combiners = nn.ModuleDict({
            str(gid): nn.Linear(n_up, n_compressed, bias=True)
            for gid, n_up in gauge_upstream_sizes.items()
        })

        lstm_input_size = 1 + 1 + n_compressed

        self.hindcast_lstm = nn.LSTM(
            input_size  = lstm_input_size,
            hidden_size = hidden_size,
            num_layers  = num_layers,
            batch_first = True,
            dropout     = 0.2 if num_layers > 1 else 0.0
        )

        self.state_handoff_h = nn.Linear(hidden_size, hidden_size)
        self.state_handoff_c = nn.Linear(hidden_size, hidden_size)

        self.forecast_lstm = nn.LSTM(
            input_size  = 1,
            hidden_size = hidden_size,
            num_layers  = num_layers,
            batch_first = True,
            dropout     = 0.2 if num_layers > 1 else 0.0
        )

        self.cmal_head = CMALHead(hidden_size, n_mixtures)

    def forward(self, target_x, rainfall_x, upstream_x, gauge_id):
        combiner  = self.upstream_combiners[str(gauge_id)]
        up_comp   = combiner(upstream_x)
        x         = torch.cat([target_x, rainfall_x, up_comp], dim=-1)

        _, (h, c) = self.hindcast_lstm(x)

        h0 = torch.tanh(self.state_handoff_h(h))
        c0 = torch.tanh(self.state_handoff_c(c))

        last_input = target_x[:, -1:, :]
        outputs    = []
        h_t, c_t   = h0, c0

        for t in range(self.lead_times):
            out, (h_t, c_t) = self.forecast_lstm(last_input, (h_t, c_t))
            params = self.cmal_head(out[:, -1, :])
            outputs.append(params)
            pred   = cmal_point(params[0], params[3]).detach()
            last_input = pred.unsqueeze(-1).unsqueeze(-1)

        return outputs


# ============================================================
# STEP 3 — Load Thresholds
# ============================================================

def load_thresholds():
    with open(os.path.join(BASE_DIR, 'thresholds', 'demo_thresholds.json'), 'r') as f:
        return json.load(f)


# ============================================================
# STEP 4 — Determine Flood Status
# ============================================================

def get_flood_status(discharge, gauge, thresholds):
    if gauge not in thresholds:
        return 'No Data'
    w = thresholds[gauge]['warning']
    s = thresholds[gauge]['severe']
    e = thresholds[gauge]['extreme']
    if discharge >= e:
        return 'Extreme'
    elif discharge >= s:
        return 'Danger'
    elif discharge >= w:
        return 'Warning'
    else:
        return 'Normal'


# ============================================================
# STEP 5 — Main Inference Function
# ============================================================

def run_inference():
    print(f'\n{"="*60}')
    print(f'FLARE Inference Pipeline')
    print(f'Started: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print(f'{"="*60}\n')

    # ── Load scalers ──────────────────────────────────────────
    print('Loading scalers...')
    with open(SCALERS_PATH, 'rb') as f:
        scalers = pickle.load(f)
    print('  ✅ Scalers loaded')

    # ── Load thresholds ───────────────────────────────────────
    print('Loading thresholds...')
    thresholds = load_thresholds()
    print(f'  ✅ Thresholds loaded for {len(thresholds)} gauges')

    # ── Load coordinates ──────────────────────────────────────
    print('Loading coordinates...')
    with open(COORDS_PATH, 'r') as f:
        coordinates = json.load(f)
    print('  ✅ Coordinates loaded')

    # ── Build gauge upstream sizes ────────────────────────────
    gauge_id_map = {g: i for i, g in enumerate(GAUGE_LIST)}
    gauge_upstream_sizes = {}
    for gauge in GAUGE_LIST:
        n_up = len(UPSTREAM_MAP.get(gauge, []))
        gauge_upstream_sizes[gauge_id_map[gauge]] = max(n_up, 1)

    # ── Load model ────────────────────────────────────────────
    print('Loading model...')
    model = RegionalLSTM(gauge_upstream_sizes).to(DEVICE)
    model.load_state_dict(torch.load(MODEL_PATH,
                          map_location=DEVICE))
    model.eval()

    print('  ✅ Model loaded\n')

    # ── Run inference per gauge ───────────────────────────────
    results = {}

    for gauge in GAUGE_LIST:
        print(f'Running inference for {gauge}...')
        try:
            gid     = gauge_id_map[gauge]
            sc      = scalers[gauge]
            sc_t    = sc['target']
            sc_r    = sc['rainfall']
            sc_u    = sc['upstream']

            # Load last 60 days up to end_date
            end_date = '2022-08-10'
            df_q = pd.read_csv(
                os.path.join(DISCHARGE_DIR, f'{gauge}.csv'),
                parse_dates=['date']
            ).sort_values('date')
            df_q = df_q[df_q['date'] <= end_date].tail(HINDCAST_WIN)

            df_r = pd.read_csv(
                os.path.join(RAINFALL_DIR, f'{gauge}.csv'),
                parse_dates=['date']
            ).sort_values('date')
            df_r = df_r[df_r['date'] <= end_date].tail(HINDCAST_WIN)

            # Upstream discharge
            up_gauges = UPSTREAM_MAP.get(gauge, [])
            if up_gauges:
                up_data = []
                for up in up_gauges:
                    df_up = pd.read_csv(
                        os.path.join(DISCHARGE_DIR, f'{up}.csv'),
                        parse_dates=['date']
                    ).sort_values('date').tail(HINDCAST_WIN)
                    up_data.append(
                        df_up['discharge_m3s'].values.astype(np.float32))
                u_raw = np.stack(up_data, axis=1)
            else:
                u_raw = np.zeros((HINDCAST_WIN, 1), dtype=np.float32)

            # Prepare tensors
            t_raw = df_q['discharge_m3s'].values.astype(
                np.float32).reshape(-1, 1)
            r_raw = df_r['precipitation_mm'].values.astype(
                np.float32).reshape(-1, 1)

            tx = torch.tensor(
                sc_t.transform(t_raw),
                dtype=torch.float32).unsqueeze(0).to(DEVICE)
            rx = torch.tensor(
                sc_r.transform(r_raw),
                dtype=torch.float32).unsqueeze(0).to(DEVICE)
            ux = torch.tensor(
                sc_u.transform(u_raw),
                dtype=torch.float32).unsqueeze(0).to(DEVICE)

            # Run model
            with torch.no_grad():
                params = model(tx, rx, ux, gid)

            # Get forecasts
            def inv(arr):
                return sc_t.inverse_transform(
                    arr.reshape(-1, 1)).flatten()

            pt = inv(np.array([
                cmal_point(params[t][0],
                           params[t][3]).cpu().item()
                for t in range(LEAD_TIMES)]))
            lo = inv(np.array([
                cmal_quantile(*params[t], q=0.2).cpu().item()
                for t in range(LEAD_TIMES)]))
            hi = inv(np.array([
                cmal_quantile(*params[t], q=0.8).cpu().item()
                for t in range(LEAD_TIMES)]))

            # Forecast dates
            last_date  = df_q['date'].iloc[-1]
            fore_dates = pd.date_range(
                last_date + pd.Timedelta(days=1),
                periods=LEAD_TIMES)

            # Flood status based on T+1
            status = get_flood_status(float(pt[0]), gauge, thresholds)

            # Build result
            forecast_list = []
            for i in range(LEAD_TIMES):
                forecast_list.append({
                    'date'      : fore_dates[i].strftime('%Y-%m-%d'),
                    'predicted' : round(float(pt[i]), 1),
                    'lower_20'  : round(float(lo[i]), 1),
                    'upper_80'  : round(float(hi[i]), 1),
                })

            results[gauge] = {
                'gauge'       : gauge,
                'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'status'      : status,
                'lat'         : coordinates[gauge]['lat'],
                'lon'         : coordinates[gauge]['lon'],
                'station'     : coordinates[gauge]['station'],
                'river'       : coordinates[gauge]['river'],
                'thresholds'  : thresholds.get(gauge, {}),
                'forecast'    : forecast_list,
            }

            # Save individual JSON
            out_path = os.path.join(OUTPUT_DIR, f'{gauge}.json')
            with open(out_path, 'w') as f:
                json.dump(results[gauge], f, indent=2)

            print(f'  ✅ {gauge}: status={status} | '
                  f'T+1={pt[0]:.1f} m³/s')

        except Exception as e:
            print(f'  ❌ {gauge}: ERROR — {e}')

    # ── Save combined JSON ────────────────────────────────────
    combined_path = os.path.join(OUTPUT_DIR, 'all_gauges.json')
    with open(combined_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f'\n{"="*60}')
    print(f'Inference complete!')
    print(f'  Individual JSONs : {OUTPUT_DIR}')
    print(f'  Combined JSON    : {combined_path}')
    print(f'  Gauges processed : {len(results)}/13')
    print(f'{"="*60}\n')

    return results


# ── Run directly ──────────────────────────────────────────────
if __name__ == '__main__':
    run_inference()