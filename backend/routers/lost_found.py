from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import get_db
from auth_utils import decode_token
from schemas.lost_found import LostFoundCreate, LostFoundUpdate

router = APIRouter(prefix="/lost-found", tags=["Lost & Found"])
security = HTTPBearer()


# ---------------- AUTH ----------------
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Invalid token")
    return payload


def get_db_user(user_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, role, is_approved FROM app_users WHERE id=%s", (user_id,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        raise HTTPException(404, "User not found")

    return user


def serialize(row):
    return {
        "id": str(row["id"]),
        "user_id": str(row["user_id"]),
        "category": row["category"],
        "location": row["location"],
        "contact": row["contact"],
        "name": row["name"],
        "post_type": row["post_type"],
        "additional_info": row["additional_info"],
        "approval_status": row["approval_status"],
        "created_at": row["created_at"]
    }


# ---------------- CREATE ----------------
@router.post("")
def create_post(data: LostFoundCreate, user=Depends(get_current_user)):
    db_user = get_db_user(user["user_id"])

    # Rule 1
    if db_user["role"] == "organization" and not db_user["is_approved"]:
        raise HTTPException(403, "Organization not approved")

    # Rule 2
    if db_user["role"] in ["admin", "organization"]:
        status = "approved"
    else:
        status = "pending"

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO lost_found_posts
        (user_id, category, location, contact, name, post_type, additional_info, approval_status)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING *
    """, (
        user["user_id"],
        data.category,
        data.location,
        data.contact,
        data.name,
        data.post_type,
        data.additional_info,
        status
    ))

    post = cursor.fetchone()
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Created", "post": serialize(post)}


# ---------------- GET ----------------
@router.get("")
def get_posts(user=Depends(get_current_user)):
    db_user = get_db_user(user["user_id"])

    conn = get_db()
    cursor = conn.cursor()

    # Rule applied exactly
    if db_user["role"] == "citizen":
        cursor.execute("SELECT * FROM lost_found_posts WHERE approval_status='approved'")
    else:
        cursor.execute("SELECT * FROM lost_found_posts")

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return [serialize(i) for i in data]


# ---------------- PENDING ----------------
@router.get("/pending")
def get_pending(user=Depends(get_current_user)):
    db_user = get_db_user(user["user_id"])

    if db_user["role"] == "citizen":
        raise HTTPException(403, "Not allowed")

    conn = get_db()
    cursor = conn.cursor()

    if db_user["role"] == "admin":
        cursor.execute("SELECT * FROM lost_found_posts WHERE approval_status='pending'")
    else:
        cursor.execute("""
            SELECT p.* FROM lost_found_posts p
            JOIN app_users u ON p.user_id=u.id
            WHERE p.approval_status='pending' AND u.role='citizen'
        """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return [serialize(i) for i in data]


# ---------------- UPDATE ----------------
@router.put("/{post_id}")
def update_post(post_id: str, data: LostFoundUpdate, user=Depends(get_current_user)):
    db_user = get_db_user(user["user_id"])

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM lost_found_posts WHERE id=%s", (post_id,))
    post = cursor.fetchone()

    if not post:
        raise HTTPException(404, "Not found")

    is_owner = str(post["user_id"]) == user["user_id"]

    if not (
        db_user["role"] == "admin"
        or (db_user["role"] == "organization" and db_user["is_approved"])
        or is_owner
    ):
        raise HTTPException(403, "Not allowed")

    cursor.execute("""
        UPDATE lost_found_posts
        SET
            category=COALESCE(%s,category),
            location=COALESCE(%s,location),
            contact=COALESCE(%s,contact),
            name=COALESCE(%s,name),
            post_type=COALESCE(%s,post_type),
            additional_info=COALESCE(%s,additional_info)
        WHERE id=%s
        RETURNING *
    """, (
        data.category,
        data.location,
        data.contact,
        data.name,
        data.post_type,
        data.additional_info,
        post_id
    ))

    updated = cursor.fetchone()
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Updated", "post": serialize(updated)}


# ---------------- DELETE ----------------
@router.delete("/{post_id}")
def delete_post(post_id: str, user=Depends(get_current_user)):
    db_user = get_db_user(user["user_id"])

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM lost_found_posts WHERE id=%s", (post_id,))
    post = cursor.fetchone()

    if not post:
        raise HTTPException(404, "Not found")

    is_owner = str(post["user_id"]) == user["user_id"]

    if not (
        db_user["role"] == "admin"
        or (db_user["role"] == "organization" and db_user["is_approved"])
        or is_owner
    ):
        raise HTTPException(403, "Not allowed")

    cursor.execute("DELETE FROM lost_found_posts WHERE id=%s", (post_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Deleted"}


# ---------------- APPROVE ----------------
@router.put("/{post_id}/approve")
def approve(post_id: str, user=Depends(get_current_user)):
    db_user = get_db_user(user["user_id"])

    if db_user["role"] == "citizen":
        raise HTTPException(403, "Not allowed")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.*, u.role AS creator_role
        FROM lost_found_posts p
        JOIN app_users u ON p.user_id=u.id
        WHERE p.id=%s
    """, (post_id,))
    post = cursor.fetchone()

    if not post:
        raise HTTPException(404, "Not found")

    if db_user["role"] == "organization" and post["creator_role"] != "citizen":
        raise HTTPException(403, "Org can only approve citizen posts")

    cursor.execute("""
        UPDATE lost_found_posts
        SET approval_status='approved'
        WHERE id=%s
        RETURNING *
    """, (post_id,))

    updated = cursor.fetchone()
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Approved", "post": serialize(updated)}


# ---------------- REJECT ----------------
@router.put("/{post_id}/reject")
def reject(post_id: str, user=Depends(get_current_user)):
    db_user = get_db_user(user["user_id"])

    if db_user["role"] == "citizen":
        raise HTTPException(403, "Not allowed")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.*, u.role AS creator_role
        FROM lost_found_posts p
        JOIN app_users u ON p.user_id=u.id
        WHERE p.id=%s
    """, (post_id,))
    post = cursor.fetchone()

    if not post:
        raise HTTPException(404, "Not found")

    if db_user["role"] == "organization" and post["creator_role"] != "citizen":
        raise HTTPException(403, "Org can only reject citizen posts")

    cursor.execute("""
        UPDATE lost_found_posts
        SET approval_status='rejected'
        WHERE id=%s
        RETURNING *
    """, (post_id,))

    updated = cursor.fetchone()
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Rejected", "post": serialize(updated)}