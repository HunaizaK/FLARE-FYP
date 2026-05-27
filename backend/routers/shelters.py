from fastapi import APIRouter, HTTPException, Depends
from psycopg2.extras import Json
from database import get_db
from dependencies import require_approved_user, require_organization
from schemas.shelters import ShelterCreate

router = APIRouter(prefix="/shelters", tags=["Shelters"])


@router.get("")
def get_shelters(current_user: dict = Depends(require_approved_user)):
    """
    Get shelters.
    Admin receives all shelters (any approval status).
    Citizens and organizations receive only approved shelters.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        if current_user["role"] == "admin":
            cursor.execute("SELECT * FROM shelters ORDER BY created_at DESC")
        else:
            cursor.execute(
                "SELECT * FROM shelters WHERE approval_status = 'approved' ORDER BY created_at DESC"
            )
        shelters = cursor.fetchall()
        return {"success": True, "message": "Shelters retrieved successfully", "data": list(shelters)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.post("/request", status_code=201)
def submit_add_request(data: ShelterCreate, current_user: dict = Depends(require_organization)):
    """
    Submit a change request to add a new shelter.
    Only approved organizations can submit.
    The shelter is not created directly — admin must approve the request.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        payload = data.dict()
        payload["added_by"] = current_user["user_id"]

        cursor.execute(
            """
            INSERT INTO change_requests
                (table_name, record_id, requested_by, request_type, payload, status)
            VALUES ('shelters', NULL, %s, 'add', %s, 'pending')
            RETURNING id
            """,
            (current_user["user_id"], Json(payload))
        )
        request_id = cursor.fetchone()["id"]
        conn.commit()
        return {
            "success": True,
            "message": "Add request submitted successfully. Pending admin approval.",
            "data": {"request_id": str(request_id)}
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.put("/request/{shelter_id}", status_code=201)
def submit_edit_request(
    shelter_id: str,
    data: ShelterCreate,
    current_user: dict = Depends(require_organization)
):
    """
    Submit a change request to edit an existing shelter.
    - Organization must own the shelter.
    - Full schema required (entire record is replaced on approval).
    - Returns 404 if shelter not found, 403 if not owner, 409 if a pending request already exists.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT added_by FROM shelters WHERE id = %s", (shelter_id,))
        shelter = cursor.fetchone()
        if not shelter:
            raise HTTPException(status_code=404, detail="Shelter not found")
        if str(shelter["added_by"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only edit your own shelters")

        cursor.execute(
            """
            SELECT id FROM change_requests
            WHERE table_name = 'shelters' AND record_id = %s AND status = 'pending'
            """,
            (shelter_id,)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="A pending request already exists for this shelter")

        payload = data.dict()
        cursor.execute(
            """
            INSERT INTO change_requests
                (table_name, record_id, requested_by, request_type, payload, status)
            VALUES ('shelters', %s, %s, 'edit', %s, 'pending')
            RETURNING id
            """,
            (shelter_id, current_user["user_id"], Json(payload))
        )
        request_id = cursor.fetchone()["id"]
        conn.commit()
        return {
            "success": True,
            "message": "Edit request submitted successfully. Pending admin approval.",
            "data": {"request_id": str(request_id)}
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.delete("/request/{shelter_id}", status_code=201)
def submit_delete_request(shelter_id: str, current_user: dict = Depends(require_organization)):
    """
    Submit a change request to delete an existing shelter.
    - Organization must own the shelter.
    - Returns 404 if shelter not found, 403 if not owner, 409 if a pending request already exists.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT added_by FROM shelters WHERE id = %s", (shelter_id,))
        shelter = cursor.fetchone()
        if not shelter:
            raise HTTPException(status_code=404, detail="Shelter not found")
        if str(shelter["added_by"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only delete your own shelters")

        cursor.execute(
            """
            SELECT id FROM change_requests
            WHERE table_name = 'shelters' AND record_id = %s AND status = 'pending'
            """,
            (shelter_id,)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="A pending request already exists for this shelter")

        cursor.execute(
            """
            INSERT INTO change_requests
                (table_name, record_id, requested_by, request_type, payload, status)
            VALUES ('shelters', %s, %s, 'delete', NULL, 'pending')
            RETURNING id
            """,
            (shelter_id, current_user["user_id"])
        )
        request_id = cursor.fetchone()["id"]
        conn.commit()
        return {
            "success": True,
            "message": "Delete request submitted successfully. Pending admin approval.",
            "data": {"request_id": str(request_id)}
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
