# ============================================================
# scheduler.py — Runs inference pipeline daily at set time
# ============================================================

import schedule
import time
import logging
from datetime import datetime
from inference import run_inference

# ── Logging setup ─────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s — %(message)s',
    handlers=[
        logging.FileHandler('scheduler.log'),
        logging.StreamHandler()
    ]
)

def scheduled_job():
    logging.info('Scheduler triggered — starting inference...')
    try:
        run_inference()
        logging.info('Inference completed successfully')
    except Exception as e:
        logging.error(f'Inference failed: {e}')

# ── Schedule — runs every day at 00:00 ────────────────────
# Change '00:00' to any time you want e.g. '06:00' for 6 AM
schedule.every().day.at('00:00').do(scheduled_job)

logging.info('FLARE Scheduler started!')
logging.info('Inference will run daily at 00:00')
logging.info('Press Ctrl+C to stop\n')

# ── Run once immediately on startup ───────────────────────
logging.info('Running initial inference on startup...')
scheduled_job()

# ── Keep running ──────────────────────────────────────────
while True:
    schedule.run_pending()
    time.sleep(60)