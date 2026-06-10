from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from dependencies import require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("")
def get_approved_users(current_user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, username, email, contact_no, role, created_at
            FROM app_users
            WHERE is_approved = true AND role != 'admin'
            ORDER BY created_at DESC
        """)
        users = cursor.fetchall()
        return {"success": True, "message": "Users retrieved", "data": list(users)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.delete("/{user_id}")
def remove_user(user_id: str, current_user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, role FROM app_users WHERE id = %s AND role != 'admin'", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Delete in FK-safe order
        cursor.execute("DELETE FROM change_requests WHERE requested_by = %s", (user_id,))
        cursor.execute("DELETE FROM lost_found_posts WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM shelters WHERE added_by = %s", (user_id,))
        cursor.execute("DELETE FROM donation_accounts WHERE added_by = %s", (user_id,))
        if user["role"] == "organization":
            cursor.execute("DELETE FROM organizations WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM app_users WHERE id = %s", (user_id,))

        conn.commit()
        return {"success": True, "message": "User removed successfully"}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
