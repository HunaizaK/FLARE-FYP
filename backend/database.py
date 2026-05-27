import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

_conn = None


def get_db():
    """Return the single persistent DB connection.
    Automatically reconnects if the connection was closed or dropped."""
    global _conn
    if _conn is None or _conn.closed:
        _conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return _conn


