import os
import threading
import psycopg2
import psycopg2.extensions
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

_local = threading.local()


def get_db():
    conn = getattr(_local, "conn", None)

    if conn is None or conn.closed:
        _local.conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return _local.conn

    status = conn.get_transaction_status()

    if status == psycopg2.extensions.TRANSACTION_STATUS_INERROR:
        conn.rollback()
    elif status == psycopg2.extensions.TRANSACTION_STATUS_UNKNOWN:
        try:
            conn.close()
        except Exception:
            pass
        _local.conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

    return _local.conn
