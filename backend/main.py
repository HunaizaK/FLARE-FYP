import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers.auth import router as auth_router
from routers.organizations import router as org_router
from routers.shelters import router as shelters_router
from routers.lost_found import router as lf_router
from routers.donation_accounts import router as donation_accounts_router
from routers.change_requests import router as change_requests_router
from routers.users import router as users_router
from routers.flood_report import router as flood_report_router
from routers.gauges import router as gauges_router
from routers.flood_maps import router as flood_maps_router
from fastapi import Request
from database import get_db, release_db
from auth_utils import hash_password

app = FastAPI()

# Serve flood map PNG images as static files
FLOOD_MAPS_DIR = os.path.join(os.path.dirname(__file__), '..', 'flood_api', 'outputs', 'flood_maps')
os.makedirs(FLOOD_MAPS_DIR, exist_ok=True)
app.mount("/static/flood_maps", StaticFiles(directory=FLOOD_MAPS_DIR), name="flood_maps")

# FRONTEND_URL env var: set to your deployed frontend URL on Render (e.g. https://flare.onrender.com)
# Multiple origins can be comma-separated: https://flare.onrender.com,https://myapp.com
_frontend_env = os.getenv("FRONTEND_URL", "")
_extra_origins = [o.strip() for o in _frontend_env.split(",") if o.strip()]
ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:3000"] + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_admin_exists():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM app_users WHERE role='admin'")
    admin = cursor.fetchone()

    if not admin:
        password = hash_password("admin123")

        cursor.execute("""
            INSERT INTO app_users (email, contact_no, username, password_hash, role, is_approved)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            "admin@flare.com",
            "000000",
            "admin",
            password,
            "admin",
            True
        ))

        conn.commit()

    cursor.close()
    release_db(conn)


@app.on_event("startup")
def startup_event():
    ensure_admin_exists()


@app.middleware("http")
async def release_db_after_request(request: Request, call_next):
    response = await call_next(request)
    return response


app.include_router(auth_router)
app.include_router(org_router)
app.include_router(shelters_router)
app.include_router(lf_router)
app.include_router(donation_accounts_router)
app.include_router(change_requests_router)
app.include_router(users_router)
app.include_router(flood_report_router)
app.include_router(gauges_router)
app.include_router(flood_maps_router)


@app.get("/")
def root():
    return {"message": "FLARE API running"}
