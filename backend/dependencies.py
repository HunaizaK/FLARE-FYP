from typing import Optional
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth_utils import decode_token
from database import get_db

security = HTTPBearer(auto_error=False)


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """Extract and validate JWT from Authorization header. Returns {user_id, role}."""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=403, detail="Not authenticated")
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow only admin users."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_approved_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow any authenticated user whose account is approved.
    Admin is always approved. Citizens are auto-approved on signup.
    Organizations must be approved by admin."""
    if current_user.get("role") == "admin":
        return current_user
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT is_approved FROM app_users WHERE id = %s",
            (current_user["user_id"],)
        )
        user = cursor.fetchone()
        if not user or not user["is_approved"]:
            raise HTTPException(status_code=403, detail="Account not approved yet")
        return current_user
    finally:
        cursor.close()


def require_organization(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow only approved organization users."""
    if current_user.get("role") != "organization":
        raise HTTPException(status_code=403, detail="Organization access required")
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT is_approved FROM app_users WHERE id = %s",
            (current_user["user_id"],)
        )
        user = cursor.fetchone()
        if not user or not user["is_approved"]:
            raise HTTPException(status_code=403, detail="Organization not approved yet")
        return current_user
    finally:
        cursor.close()
