import os
import psycopg2
import psycopg2.extensions
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

_conn = None


def get_db():
    """Return the single persistent DB connection.
    - Reconnects if the connection was closed or dropped.
    - Rolls back any aborted transaction so every request starts clean."""
    global _conn
    if _conn is None or _conn.closed:
        _conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return _conn

    status = _conn.get_transaction_status()
    if status == psycopg2.extensions.TRANSACTION_STATUS_INERROR:
        # A previous request left a failed transaction — clear it
        _conn.rollback()
    elif status == psycopg2.extensions.TRANSACTION_STATUS_UNKNOWN:
        # Connection is in an unknown/broken state — reconnect entirely
        try:
            _conn.close()
        except Exception:
            pass
        _conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

    return _conn


