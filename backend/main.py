from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.auth import router as auth_router
from routers.organizations import router as org_router
from routers.shelters import router as shelters_router
from routers.lost_found import router as lf_router
from routers.donation_accounts import router as donation_accounts_router
from routers.change_requests import router as change_requests_router
from routers.users import router as users_router
from routers.reports import router as reports_router
from database import get_db
from auth_utils import hash_password

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
    conn.close()


@app.on_event("startup")
def startup_event():
    ensure_admin_exists()


app.include_router(auth_router)
app.include_router(org_router)
app.include_router(shelters_router)
app.include_router(lf_router)
app.include_router(donation_accounts_router)
app.include_router(change_requests_router)
app.include_router(users_router)
app.include_router(reports_router)


@app.get("/")
def root():
    return {"message": "FLARE API running"}
