from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import get_db
from auth_utils import decode_token
from schemas.shelters import ShelterCreate, ShelterUpdate

router = APIRouter(prefix="/shelters", tags=["Shelters"])
security = HTTPBearer()


# -----------------------------
# Auth helper
# -----------------------------
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload


# -----------------------------
# DB helper: fetch complete user
# -----------------------------
def get_db_user(user_id: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, role, is_approved
        FROM app_users
        WHERE id = %s
        """,
        (user_id,)
    )

    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# -----------------------------
# Helper: convert DB shelter row
# -----------------------------
def serialize_shelter(row):
    if not row:
        return None

    return {
        "id": str(row["id"]),
        "added_by": str(row["added_by"]) if row["added_by"] else None,
        "shelter_name": row["shelter_name"],
        "location": row["location"],
        "capacity": row["capacity"],
        "latitude": float(row["latitude"]) if row["latitude"] is not None else None,
        "longitude": float(row["longitude"]) if row["longitude"] is not None else None,
        "approval_status": row["approval_status"],
        "approved_by": str(row["approved_by"]) if row["approved_by"] else None,
        "approved_at": row["approved_at"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


# -----------------------------
# CREATE shelter
# admin = approved
# approved organization = approved
# citizen = pending
# -----------------------------
@router.post("")
def create_shelter(data: ShelterCreate, current_user=Depends(get_current_user)):
    db_user = get_db_user(current_user["user_id"])

    role = db_user["role"]
    is_approved = db_user["is_approved"]

    if role == "organization" and not is_approved:
        raise HTTPException(status_code=403, detail="Organization is not approved yet")

    if role in ["admin", "organization"]:
        approval_status = "approved"
        approved_by = current_user["user_id"]
    else:
        approval_status = "pending"
        approved_by = None

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO shelters (
                added_by,
                shelter_name,
                location,
                capacity,
                latitude,
                longitude,
                approval_status,
                approved_by,
                approved_at
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s,
                CASE WHEN %s IS NOT NULL THEN CURRENT_TIMESTAMP ELSE NULL END
            )
            RETURNING *
            """,
            (
                current_user["user_id"],
                data.shelter_name,
                data.location,
                data.capacity,
                data.latitude,
                data.longitude,
                approval_status,
                approved_by,
                approved_by
            )
        )

        shelter = cursor.fetchone()
        conn.commit()

        return {
            "message": "Shelter created successfully",
            "shelter": serialize_shelter(shelter)
        }

    except Exception as error:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(error))

    finally:
        cursor.close()
        conn.close()


# -----------------------------
# GET shelters
# admin = all
# approved organization = approved + own
# citizen = approved only
# -----------------------------
@router.get("")
def get_shelters(current_user=Depends(get_current_user)):
    db_user = get_db_user(current_user["user_id"])

    conn = get_db()
    cursor = conn.cursor()

    if db_user["role"] == "admin":
        cursor.execute("SELECT * FROM shelters ORDER BY created_at DESC")

    elif db_user["role"] == "organization":
        cursor.execute(
            """
            SELECT * FROM shelters
            WHERE approval_status = 'approved'
               OR added_by = %s
            ORDER BY created_at DESC
            """,
            (current_user["user_id"],)
        )

    else:
        cursor.execute(
            """
            SELECT * FROM shelters
            WHERE approval_status = 'approved'
            ORDER BY created_at DESC
            """
        )

    shelters = cursor.fetchall()

    cursor.close()
    conn.close()

    return [serialize_shelter(s) for s in shelters]


# -----------------------------
# GET shelters for map only
# only approved shelters appear on map
# -----------------------------
@router.get("/map")
def get_map_shelters():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, shelter_name, location, capacity, latitude, longitude
        FROM shelters
        WHERE approval_status = 'approved'
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        ORDER BY created_at DESC
        """
    )

    shelters = cursor.fetchall()

    cursor.close()
    conn.close()

    return [
        {
            "id": str(s["id"]),
            "shelter_name": s["shelter_name"],
            "location": s["location"],
            "capacity": s["capacity"],
            "latitude": float(s["latitude"]),
            "longitude": float(s["longitude"]),
        }
        for s in shelters
    ]


# -----------------------------
# GET pending shelters
# admin = all pending
# approved organization = pending citizen shelters
# citizen = blocked
# -----------------------------
@router.get("/pending")
def get_pending_shelters(current_user=Depends(get_current_user)):
    db_user = get_db_user(current_user["user_id"])

    if db_user["role"] == "citizen":
        raise HTTPException(status_code=403, detail="Not allowed")

    if db_user["role"] == "organization" and not db_user["is_approved"]:
        raise HTTPException(status_code=403, detail="Organization is not approved yet")

    conn = get_db()
    cursor = conn.cursor()

    if db_user["role"] == "admin":
        cursor.execute(
            """
            SELECT s.*
            FROM shelters s
            WHERE s.approval_status = 'pending'
            ORDER BY s.created_at DESC
            """
        )
    else:
        # Approved organizations can approve citizen shelter submissions
        cursor.execute(
            """
            SELECT s.*
            FROM shelters s
            JOIN app_users u ON s.added_by = u.id
            WHERE s.approval_status = 'pending'
              AND u.role = 'citizen'
            ORDER BY s.created_at DESC
            """
        )

    shelters = cursor.fetchall()

    cursor.close()
    conn.close()

    return [serialize_shelter(s) for s in shelters]


# -----------------------------
# GET my shelters
# -----------------------------
@router.get("/my")
def get_my_shelters(current_user=Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM shelters
        WHERE added_by = %s
        ORDER BY created_at DESC
        """,
        (current_user["user_id"],)
    )

    shelters = cursor.fetchall()

    cursor.close()
    conn.close()

    return [serialize_shelter(s) for s in shelters]


# -----------------------------
# UPDATE shelter
# admin = any
# owner = own
# approved organization = any
# citizen cannot update others
# -----------------------------
@router.put("/{shelter_id}")
def update_shelter(
    shelter_id: str,
    data: ShelterUpdate,
    current_user=Depends(get_current_user)
):
    db_user = get_db_user(current_user["user_id"])

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM shelters WHERE id = %s", (shelter_id,))
        shelter = cursor.fetchone()

        if not shelter:
            raise HTTPException(status_code=404, detail="Shelter not found")

        is_owner = str(shelter["added_by"]) == current_user["user_id"]
        is_admin = db_user["role"] == "admin"
        is_approved_org = db_user["role"] == "organization" and db_user["is_approved"]

        if not (is_admin or is_owner or is_approved_org):
            raise HTTPException(status_code=403, detail="Not allowed to update this shelter")

        cursor.execute(
            """
            UPDATE shelters
            SET
                shelter_name = COALESCE(%s, shelter_name),
                location = COALESCE(%s, location),
                capacity = COALESCE(%s, capacity),
                latitude = COALESCE(%s, latitude),
                longitude = COALESCE(%s, longitude)
            WHERE id = %s
            RETURNING *
            """,
            (
                data.shelter_name,
                data.location,
                data.capacity,
                data.latitude,
                data.longitude,
                shelter_id
            )
        )

        updated = cursor.fetchone()
        conn.commit()

        return {
            "message": "Shelter updated successfully",
            "shelter": serialize_shelter(updated)
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


# -----------------------------
# DELETE shelter
# admin = any
# owner = own
# approved organization = any
# citizen cannot delete others
# -----------------------------
@router.delete("/{shelter_id}")
def delete_shelter(shelter_id: str, current_user=Depends(get_current_user)):
    db_user = get_db_user(current_user["user_id"])

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM shelters WHERE id = %s", (shelter_id,))
        shelter = cursor.fetchone()

        if not shelter:
            raise HTTPException(status_code=404, detail="Shelter not found")

        is_owner = str(shelter["added_by"]) == current_user["user_id"]
        is_admin = db_user["role"] == "admin"
        is_approved_org = db_user["role"] == "organization" and db_user["is_approved"]

        if not (is_admin or is_owner or is_approved_org):
            raise HTTPException(status_code=403, detail="Not allowed to delete this shelter")

        cursor.execute("DELETE FROM shelters WHERE id = %s", (shelter_id,))
        conn.commit()

        return {"message": "Shelter deleted successfully"}

    except HTTPException:
        conn.rollback()
        raise

    except Exception as error:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(error))

    finally:
        cursor.close()
        conn.close()


# -----------------------------
# APPROVE shelter
# admin = any pending shelter
# approved organization = citizen shelters only
# citizen = blocked
# -----------------------------
@router.put("/{shelter_id}/approve")
def approve_shelter(shelter_id: str, current_user=Depends(get_current_user)):
    db_user = get_db_user(current_user["user_id"])

    if db_user["role"] == "citizen":
        raise HTTPException(status_code=403, detail="Citizens cannot approve shelters")

    if db_user["role"] == "organization" and not db_user["is_approved"]:
        raise HTTPException(status_code=403, detail="Organization is not approved yet")

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT s.*, u.role AS creator_role
            FROM shelters s
            LEFT JOIN app_users u ON s.added_by = u.id
            WHERE s.id = %s
            """,
            (shelter_id,)
        )

        shelter = cursor.fetchone()

        if not shelter:
            raise HTTPException(status_code=404, detail="Shelter not found")

        # Approved organizations can approve only citizen-created shelters
        if db_user["role"] == "organization" and shelter["creator_role"] != "citizen":
            raise HTTPException(
                status_code=403,
                detail="Organizations can only approve citizen shelter submissions"
            )

        cursor.execute(
            """
            UPDATE shelters
            SET approval_status = 'approved',
                approved_by = %s,
                approved_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *
            """,
            (current_user["user_id"], shelter_id)
        )

        updated = cursor.fetchone()
        conn.commit()

        return {
            "message": "Shelter approved successfully",
            "shelter": serialize_shelter(updated)
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


# -----------------------------
# REJECT shelter
# admin = any pending shelter
# approved organization = citizen shelters only
# citizen = blocked
# -----------------------------
@router.put("/{shelter_id}/reject")
def reject_shelter(shelter_id: str, current_user=Depends(get_current_user)):
    db_user = get_db_user(current_user["user_id"])

    if db_user["role"] == "citizen":
        raise HTTPException(status_code=403, detail="Citizens cannot reject shelters")

    if db_user["role"] == "organization" and not db_user["is_approved"]:
        raise HTTPException(status_code=403, detail="Organization is not approved yet")

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT s.*, u.role AS creator_role
            FROM shelters s
            LEFT JOIN app_users u ON s.added_by = u.id
            WHERE s.id = %s
            """,
            (shelter_id,)
        )

        shelter = cursor.fetchone()

        if not shelter:
            raise HTTPException(status_code=404, detail="Shelter not found")

        if db_user["role"] == "organization" and shelter["creator_role"] != "citizen":
            raise HTTPException(
                status_code=403,
                detail="Organizations can only reject citizen shelter submissions"
            )

        cursor.execute(
            """
            UPDATE shelters
            SET approval_status = 'rejected',
                approved_by = %s,
                approved_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *
            """,
            (current_user["user_id"], shelter_id)
        )

        updated = cursor.fetchone()
        conn.commit()

        return {
            "message": "Shelter rejected successfully",
            "shelter": serialize_shelter(updated)
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