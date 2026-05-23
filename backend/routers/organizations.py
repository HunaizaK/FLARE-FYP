from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_db
from auth_utils import decode_token, require_admin
from schemas.organization import OrganizationResponse

router = APIRouter(prefix="/organizations", tags=["Organizations"])
security = HTTPBearer()


# 🔹 Helper: get current user
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload


# 🔹 GET pending organizations (admin only)
@router.get("/pending", response_model=list[OrganizationResponse])
def get_pending_orgs(user=Depends(get_current_user)):
    require_admin(user)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT o.id, o.organization_name, o.address, o.contact_person, u.email
        FROM organizations o
        JOIN app_users u ON o.user_id = u.id
        WHERE u.is_approved = false
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data


# 🔹 APPROVE organization
@router.put("/{org_id}/approve")
def approve_org(org_id: str, user=Depends(get_current_user)):
    require_admin(user)

    conn = get_db()
    cursor = conn.cursor()

    # check org exists
    cursor.execute("SELECT user_id FROM organizations WHERE id=%s", (org_id,))
    org = cursor.fetchone()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    user_id = org["user_id"]

    # update user approval
    cursor.execute("""
        UPDATE app_users
        SET is_approved = true
        WHERE id = %s
    """, (user_id,))

    # update organization approval metadata
    cursor.execute("""
        UPDATE organizations
        SET approved_by = %s,
            approved_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (user["user_id"], org_id))

    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Organization approved"}


# 🔹 REJECT organization (simple delete approach)
@router.delete("/{org_id}/reject")
def reject_org(org_id: str, user=Depends(get_current_user)):
    require_admin(user)

    conn = get_db()
    cursor = conn.cursor()

    # get user_id
    cursor.execute("SELECT user_id FROM organizations WHERE id=%s", (org_id,))
    org = cursor.fetchone()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    user_id = org["user_id"]

    # delete organization (will cascade delete user)
    cursor.execute("DELETE FROM organizations WHERE id=%s", (org_id,))
    cursor.execute("DELETE FROM app_users WHERE id=%s", (user_id,))

    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Organization rejected and deleted"}