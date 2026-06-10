from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from database import get_db
from dependencies import require_admin, require_approved_user

router = APIRouter(prefix="/change-requests", tags=["Change Requests"])

# Only these tables may be referenced in change_requests
_TABLE_WHITELIST = {"lost_found_posts", "shelters", "donation_accounts"}


@router.get("")
def get_all_change_requests(
    status: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected"),
    current_user: dict = Depends(require_admin)
):
    """
    Admin only. List all change requests across all tables.
    Optional ?status= query param to filter by pending / approved / rejected.
    """
    if status and status not in ("pending", "approved", "rejected"):
        raise HTTPException(status_code=400, detail="status must be pending, approved, or rejected")

    conn = get_db()
    cursor = conn.cursor()
    try:
        if status:
            cursor.execute(
                """
                SELECT cr.*, u.username, u.contact_no
                FROM change_requests cr
                LEFT JOIN app_users u ON u.id = cr.requested_by
                WHERE cr.status = %s
                ORDER BY cr.created_at DESC
                """,
                (status,)
            )
        else:
            cursor.execute(
                """
                SELECT cr.*, u.username, u.contact_no
                FROM change_requests cr
                LEFT JOIN app_users u ON u.id = cr.requested_by
                ORDER BY cr.created_at DESC
                """
            )
        requests = cursor.fetchall()
        return {"success": True, "message": "Change requests retrieved", "data": list(requests)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.get("/my")
def get_my_change_requests(current_user: dict = Depends(require_approved_user)):
    """
    Citizen / Organization. List all change requests submitted by the current user.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT * FROM change_requests WHERE requested_by = %s ORDER BY created_at DESC",
            (current_user["user_id"],)
        )
        requests = cursor.fetchall()
        return {"success": True, "message": "Your change requests retrieved", "data": list(requests)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.put("/{request_id}/approve")
def approve_change_request(request_id: str, current_user: dict = Depends(require_admin)):
    """
    Admin only. Approve a pending change request and execute the operation against the target table.

    - add    → INSERT row into the target table (with approval metadata for lost_found/shelters)
    - edit   → UPDATE existing row with payload values
    - delete → DELETE the existing row

    Updates change_requests.status to 'approved' and records reviewed_by / reviewed_at.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM change_requests WHERE id = %s", (request_id,))
        cr = cursor.fetchone()
        if not cr:
            raise HTTPException(status_code=404, detail="Change request not found")
        if cr["status"] != "pending":
            raise HTTPException(status_code=400, detail=f"Request is already {cr['status']}")

        table_name = cr["table_name"]
        if table_name not in _TABLE_WHITELIST:
            raise HTTPException(status_code=400, detail="Invalid table name in change request")

        request_type = cr["request_type"]
        record_id = cr["record_id"]
        payload = cr["payload"]  # RealDictCursor auto-deserialises jsonb → dict
        admin_id = current_user["user_id"]

        if request_type == "add":
            _execute_add(cursor, table_name, payload, admin_id)
        elif request_type == "edit":
            _execute_edit(cursor, table_name, record_id, payload)
        elif request_type == "delete":
            _execute_delete(cursor, table_name, record_id)
        else:
            raise HTTPException(status_code=400, detail="Unknown request_type in change request")

        cursor.execute(
            """
            UPDATE change_requests
            SET status = 'approved', reviewed_by = %s, reviewed_at = NOW()
            WHERE id = %s
            """,
            (admin_id, request_id)
        )
        conn.commit()
        return {"success": True, "message": "Change request approved and executed", "data": None}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.put("/{request_id}/reject")
def reject_change_request(request_id: str, current_user: dict = Depends(require_admin)):
    """
    Admin only. Reject a pending change request.
    No changes are made to the target table.
    Updates change_requests.status to 'rejected' and records reviewed_by / reviewed_at.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, status FROM change_requests WHERE id = %s",
            (request_id,)
        )
        cr = cursor.fetchone()
        if not cr:
            raise HTTPException(status_code=404, detail="Change request not found")
        if cr["status"] != "pending":
            raise HTTPException(status_code=400, detail=f"Request is already {cr['status']}")

        cursor.execute(
            """
            UPDATE change_requests
            SET status = 'rejected', reviewed_by = %s, reviewed_at = NOW()
            WHERE id = %s
            """,
            (current_user["user_id"], request_id)
        )
        conn.commit()
        return {"success": True, "message": "Change request rejected", "data": None}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


# ─── Internal helpers (not exposed as routes) ────────────────────────────────

def _execute_add(cursor, table_name: str, payload: dict, admin_id: str):
    """Insert a new row into the target table from the change_request payload."""
    if table_name == "lost_found_posts":
        cursor.execute(
            """
            INSERT INTO lost_found_posts
                (user_id, category, location, contact, name, post_type,
                 additional_info, approval_status, approved_by, approved_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'approved', %s, NOW())
            """,
            (
                payload["user_id"],
                payload["category"],
                payload["location"],
                payload["contact"],
                payload["name"],
                payload["post_type"],
                payload.get("additional_info"),
                admin_id,
            )
        )

    elif table_name == "shelters":
        cursor.execute(
            """
            INSERT INTO shelters
                (added_by, shelter_name, location, capacity, latitude, longitude,
                 approval_status, approved_by, approved_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'approved', %s, NOW())
            """,
            (
                payload["added_by"],
                payload["shelter_name"],
                payload["location"],
                payload["capacity"],
                payload.get("latitude"),
                payload.get("longitude"),
                admin_id,
            )
        )

    elif table_name == "donation_accounts":
        cursor.execute(
            """
            INSERT INTO donation_accounts (added_by, account_title, account_no, bank_name, iban)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                payload["added_by"],
                payload["account_title"],
                payload["account_no"],
                payload["bank_name"],
                payload["iban"],
            )
        )


def _execute_edit(cursor, table_name: str, record_id: str, payload: dict):
    """Update an existing row in the target table using the full payload."""
    if table_name == "lost_found_posts":
        cursor.execute(
            """
            UPDATE lost_found_posts
            SET category = %s, location = %s, contact = %s,
                name = %s, post_type = %s, additional_info = %s
            WHERE id = %s
            """,
            (
                payload["category"],
                payload["location"],
                payload["contact"],
                payload["name"],
                payload["post_type"],
                payload.get("additional_info"),
                record_id,
            )
        )

    elif table_name == "shelters":
        cursor.execute(
            """
            UPDATE shelters
            SET shelter_name = %s, location = %s, capacity = %s,
                latitude = %s, longitude = %s
            WHERE id = %s
            """,
            (
                payload["shelter_name"],
                payload["location"],
                payload["capacity"],
                payload.get("latitude"),
                payload.get("longitude"),
                record_id,
            )
        )

    elif table_name == "donation_accounts":
        cursor.execute(
            """
            UPDATE donation_accounts
            SET account_title = %s, account_no = %s, bank_name = %s, iban = %s
            WHERE id = %s
            """,
            (
                payload["account_title"],
                payload["account_no"],
                payload["bank_name"],
                payload["iban"],
                record_id,
            )
        )


def _execute_delete(cursor, table_name: str, record_id: str):
    """Delete a row from the target table. table_name is whitelisted before this is called."""
    cursor.execute(f"DELETE FROM {table_name} WHERE id = %s", (record_id,))
