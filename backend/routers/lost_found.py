from fastapi import APIRouter, HTTPException, Depends
from psycopg2.extras import Json
from database import get_db
from dependencies import require_approved_user
from schemas.lost_found import LostFoundCreate

router = APIRouter(prefix="/lost-found", tags=["Lost & Found"])


@router.get("")
def get_posts(current_user: dict = Depends(require_approved_user)):
    """
    Get lost & found posts.
    Admin receives all posts (any approval status).
    Citizens and organizations receive only approved posts.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        if current_user["role"] == "admin":
            cursor.execute(
                """
                SELECT p.*, u.username, u.contact_no, u.created_at AS user_created_at
                FROM lost_found_posts p
                LEFT JOIN app_users u ON u.id = p.user_id
                ORDER BY p.created_at DESC
                """
            )
        else:
            cursor.execute(
                """
                SELECT p.*, u.username, u.contact_no, u.created_at AS user_created_at
                FROM lost_found_posts p
                LEFT JOIN app_users u ON u.id = p.user_id
                WHERE p.approval_status = 'approved'
                ORDER BY p.created_at DESC
                """
            )
        posts = cursor.fetchall()
        return {"success": True, "message": "Posts retrieved successfully", "data": list(posts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.post("/request", status_code=201)
def submit_add_request(data: LostFoundCreate, current_user: dict = Depends(require_approved_user)):
    """
    Submit a change request to add a new lost/found post.
    Available to citizens and approved organizations.
    The post is not created directly — admin must approve the request.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        payload = data.dict()
        payload["user_id"] = current_user["user_id"]

        cursor.execute(
            """
            INSERT INTO change_requests
                (table_name, record_id, requested_by, request_type, payload, status)
            VALUES ('lost_found_posts', NULL, %s, 'add', %s, 'pending')
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


@router.put("/request/{post_id}", status_code=201)
def submit_edit_request(
    post_id: str,
    data: LostFoundCreate,
    current_user: dict = Depends(require_approved_user)
):
    """
    Submit a change request to edit an existing lost/found post.
    - User must own the post.
    - Full schema required (no partial updates — the entire record is replaced on approval).
    - Returns 404 if post not found, 403 if not owner, 409 if a pending request already exists.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT user_id FROM lost_found_posts WHERE id = %s",
            (post_id,)
        )
        post = cursor.fetchone()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if str(post["user_id"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only edit your own posts")

        cursor.execute(
            """
            SELECT id FROM change_requests
            WHERE table_name = 'lost_found_posts' AND record_id = %s AND status = 'pending'
            """,
            (post_id,)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="A pending request already exists for this post")

        payload = data.dict()
        cursor.execute(
            """
            INSERT INTO change_requests
                (table_name, record_id, requested_by, request_type, payload, status)
            VALUES ('lost_found_posts', %s, %s, 'edit', %s, 'pending')
            RETURNING id
            """,
            (post_id, current_user["user_id"], Json(payload))
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


@router.delete("/request/{post_id}", status_code=201)
def submit_delete_request(post_id: str, current_user: dict = Depends(require_approved_user)):
    """
    Submit a change request to delete an existing lost/found post.
    - User must own the post.
    - Returns 404 if post not found, 403 if not owner, 409 if a pending request already exists.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT user_id FROM lost_found_posts WHERE id = %s",
            (post_id,)
        )
        post = cursor.fetchone()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if str(post["user_id"]) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only delete your own posts")

        cursor.execute(
            """
            SELECT id FROM change_requests
            WHERE table_name = 'lost_found_posts' AND record_id = %s AND status = 'pending'
            """,
            (post_id,)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="A pending request already exists for this post")

        cursor.execute(
            """
            INSERT INTO change_requests
                (table_name, record_id, requested_by, request_type, payload, status)
            VALUES ('lost_found_posts', %s, %s, 'delete', NULL, 'pending')
            RETURNING id
            """,
            (post_id, current_user["user_id"])
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
