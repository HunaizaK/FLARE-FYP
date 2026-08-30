import os
import time
import logging
import psycopg2
import psycopg2.pool
import psycopg2.extensions
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

# ---------------------------------------------------------------------------
# Connection pool — 2 warm connections, up to 10 concurrent
# ---------------------------------------------------------------------------
def _make_pool():
    return psycopg2.pool.ThreadedConnectionPool(
        minconn=2,
        maxconn=10,
        dsn=DATABASE_URL,
        cursor_factory=RealDictCursor,
    )

try:
    _pool = _make_pool()
    logger.info("DB connection pool created.")
except Exception as e:
    logger.error(f"Pool creation failed: {e}")
    _pool = None


def _new_direct_conn():
    """Fallback: open a single direct connection (no pool)."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def _is_healthy(conn):
    """Ping the connection; return False if it's dead."""
    try:
        conn.cursor().execute("SELECT 1")
        return True
    except Exception:
        return False


def get_db(retries: int = 3, delay: float = 0.5):
    """
    Return a live DB connection.
    - Tries the pool first (fast, reuses existing connections).
    - If the pool is exhausted or broken, falls back to a direct connection.
    - Retries up to `retries` times before raising.
    """
    global _pool

    last_error = None
    for attempt in range(1, retries + 1):
        try:
            # ── Try pool ────────────────────────────────────────────────
            if _pool is not None:
                try:
                    conn = _pool.getconn()
                    if not _is_healthy(conn):
                        _pool.putconn(conn, close=True)
                        conn = _pool.getconn()   # get a fresh one from pool

                    status = conn.get_transaction_status()
                    if status == psycopg2.extensions.TRANSACTION_STATUS_INERROR:
                        conn.rollback()

                    return conn

                except psycopg2.pool.PoolError:
                    # Pool exhausted — fall through to direct connection
                    logger.warning("Pool exhausted; opening direct connection.")

            # ── Fallback: direct connection ─────────────────────────────
            conn = _new_direct_conn()
            return conn

        except Exception as e:
            last_error = e
            logger.warning(f"DB connect attempt {attempt}/{retries} failed: {e}")

            # Try to rebuild the pool on the next attempt
            if attempt < retries:
                time.sleep(delay)
                try:
                    if _pool:
                        _pool.closeall()
                    _pool = _make_pool()
                except Exception:
                    _pool = None   # pool rebuild failed; next attempt uses direct

    raise Exception(f"Could not connect to database after {retries} attempts: {last_error}")


def release_db(conn):
    """Return connection to pool, or close it if it came from a direct connection."""
    if conn is None:
        return
    try:
        conn.rollback()   # clean state before returning
    except Exception:
        pass

    if _pool is not None:
        try:
            _pool.putconn(conn)
            return
        except Exception:
            pass   # conn wasn't from pool — just close it

    try:
        conn.close()
    except Exception:
        pass
