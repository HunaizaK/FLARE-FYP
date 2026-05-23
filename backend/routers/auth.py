from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import get_db
from schemas.auth import SignupSchema, LoginSchema
from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token
)

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload


@router.post("/signup")
def signup(data: SignupSchema):
    if data.role not in ["citizen", "organization", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Public signup must never create admin users
    if data.role == "admin":
        raise HTTPException(status_code=403, detail="Admin cannot be created via signup")

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id FROM app_users
            WHERE username = %s OR email = %s
            """,
            (data.username, data.email)
        )
        existing_user = cursor.fetchone()

        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already exists")

        # Approval rules
        if data.role == "citizen":
            is_approved = True
        elif data.role == "organization":
            is_approved = False

        hashed_password = hash_password(data.password)

        cursor.execute(
            """
            INSERT INTO app_users (
                email,
                contact_no,
                username,
                password_hash,
                role,
                is_approved
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                data.email,
                data.contact_no,
                data.username,
                hashed_password,
                data.role,
                is_approved
            )
        )

        user_id = cursor.fetchone()["id"]

        # Organization users must also have an organization profile row
        if data.role == "organization":
            cursor.execute(
                """
                INSERT INTO organizations (
                    user_id,
                    organization_name
                )
                VALUES (%s, %s)
                """,
                (
                    user_id,
                    data.username
                )
            )

        conn.commit()

        return {
            "message": "Signup successful",
            "user_id": str(user_id),
            "role": data.role,
            "is_approved": is_approved
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as error:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(error))

    finally:
        cursor.close()
        conn.close()


@router.post("/login")
def login(data: LoginSchema):
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id, username, password_hash, role, is_approved
            FROM app_users
            WHERE username = %s
            """,
            (data.username,)
        )
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=400, detail="Invalid credentials")

        if not verify_password(data.password, user["password_hash"]):
            raise HTTPException(status_code=400, detail="Invalid credentials")

        # Organization must be approved before login
        if user["role"] == "organization" and user["is_approved"] is False:
            raise HTTPException(status_code=403, detail="Organization not approved yet")

        token = create_access_token({
            "user_id": str(user["id"]),
            "role": user["role"]
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": str(user["id"]),
            "username": user["username"],
            "role": user["role"],
            "is_approved": user["is_approved"]
        }

    finally:
        cursor.close()
        conn.close()


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return current_user