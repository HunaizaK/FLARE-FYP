from fastapi import APIRouter, HTTPException, Depends
from psycopg2.extras import Json
from database import get_db
from dependencies import require_approved_user, require_organization
from schemas.donation_accounts import DonationAccountCreate

router = APIRouter(prefix="/donation-accounts", tags=["Donation Accounts"])


@router.get("")
def get_accounts(current_user: dict = Depends(require_approved_user)):
    """
    Get all donation accounts.
    Available to any authenticated and approved user (admin, citizen, organization).
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM donation_accounts ORDER BY created_at DESC")
        accounts = cursor.fetchall()
        return {"success": True, "message": "Donation accounts retrieved successfully", "data": list(accounts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.post("/request", status_code=201)
def submit_add_request(data: DonationAccountCreate, current_user: dict = Depends(require_organization)):
    """
    Submit a change request to add a new donation account.
    Only approved organizations can submit.
    The account is not created directly — admin must approve the request.
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
            VALUES ('donation_accounts', NULL, %s, 'add', %s, 'pending')
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


@router.put("/request/{account_id}", status_code=201)
def submit_edit_request(
    account_id: str,
    data: DonationAccountCreate,
    current_user: dict = Depends(require_organization)
):
    """
    Submit a change request to edit an existing donation account.
    - Organization must own the account.
    - Full schema required (entire record is replaced on approval).
    - Returns 404 if account not found, 403 if not owner, 409 if a pending request already exists.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT added_by FROM donation_accounts WHERE id = %s", (account_id,))
        account = cursor.fetchone()
        if not account:
            raise HTTPException(status_code=404, detail="Donation account not found")
        if str(account["added_by"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only edit your own donation accounts")

        cursor.execute(
            """
            SELECT id FROM change_requests
            WHERE table_name = 'donation_accounts' AND record_id = %s AND status = 'pending'
            """,
            (account_id,)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="A pending request already exists for this account")

        payload = data.dict()
        cursor.execute(
            """
            INSERT INTO change_requests
                (table_name, record_id, requested_by, request_type, payload, status)
            VALUES ('donation_accounts', %s, %s, 'edit', %s, 'pending')
            RETURNING id
            """,
            (account_id, current_user["user_id"], Json(payload))
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


@router.delete("/request/{account_id}", status_code=201)
def submit_delete_request(account_id: str, current_user: dict = Depends(require_organization)):
    """
    Submit a change request to delete an existing donation account.
    - Organization must own the account.
    - Returns 404 if account not found, 403 if not owner, 409 if a pending request already exists.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT added_by FROM donation_accounts WHERE id = %s", (account_id,))
        account = cursor.fetchone()
        if not account:
            raise HTTPException(status_code=404, detail="Donation account not found")
        if str(account["added_by"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only delete your own donation accounts")

        cursor.execute(
            """
            SELECT id FROM change_requests
            WHERE table_name = 'donation_accounts' AND record_id = %s AND status = 'pending'
            """,
            (account_id,)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="A pending request already exists for this account")

        cursor.execute(
            """
            INSERT INTO change_requests
                (table_name, record_id, requested_by, request_type, payload, status)
            VALUES ('donation_accounts', %s, %s, 'delete', NULL, 'pending')
            RETURNING id
            """,
            (account_id, current_user["user_id"])
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
