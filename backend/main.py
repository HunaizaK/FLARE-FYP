from fastapi import FastAPI
from routers.auth import router as auth_router
from routers.organizations import router as org_router
from database import get_db
from auth_utils import hash_password
from routers.shelters import router as shelters_router
from routers.lost_found import router as lf_router
app = FastAPI()


# 🔹 Admin creation function
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


# 🔹 THIS is where your line goes
@app.on_event("startup")
def startup_event():
    ensure_admin_exists()



# 🔹 Routers
app.include_router(auth_router)
app.include_router(org_router)
app.include_router(shelters_router)
app.include_router(lf_router)


@app.get("/")
def root():
    return {"message": "FLARE API running"}