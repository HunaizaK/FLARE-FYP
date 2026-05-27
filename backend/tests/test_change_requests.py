"""
Integration tests — /change-requests

Admin credentials:  admin / admin123  (auto-created on server startup)

Tests the full approve/reject lifecycle across all three tables:
  lost_found_posts, shelters, donation_accounts

Run:
  cd backend && python -m tests.test_change_requests
"""

import sys, os, requests
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tests.helpers import (
    BASE_URL, auth_headers, login, check, reset_results, print_results,
    create_citizen, create_organization, approve_organization,
    db_delete_user, db_delete_change_request,
    db_delete_lost_found_post, db_delete_shelter, db_delete_donation_account,
    db_insert_shelter, get_db,
)

LF_PAYLOAD = {
    "category": "Pets",
    "location": "Karachi Clifton",
    "contact": "03219876543",
    "name": "Golden Retriever",
    "post_type": "lost",
    "additional_info": "Red collar",
}
SHELTER_PAYLOAD = {
    "shelter_name": "Al-Noor Shelter",
    "location": "Rawalpindi Saddar",
    "capacity": 80,
    "latitude": 33.5651,
    "longitude": 73.0169,
}
DONATION_PAYLOAD = {
    "account_title": "Flood Relief Fund",
    "account_no": "9876543210",
    "bank_name": "MCB",
    "iban": "PK36MCBL0000001123456702",
}


def _find_row(table: str, field: str, value: str) -> str | None:
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT id FROM {table} WHERE {field} = %s", (value,))
        row = cursor.fetchone()
        return str(row["id"]) if row else None
    finally:
        cursor.close()


def _row_exists(table: str, row_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT id FROM {table} WHERE id = %s", (row_id,))
        return cursor.fetchone() is not None
    finally:
        cursor.close()


def run_tests():
    reset_results()

    print("\n  Setting up test users…")
    admin_token   = login("admin", "admin123")
    citizen       = create_citizen()
    citizen_token = login(citizen["username"], citizen["password"])
    org           = create_organization()
    approve_organization(admin_token, org["user_id"])
    org_token     = login(org["username"], org["password"])
    print("  Done.\n")

    cleanup_requests  = []
    cleanup_posts     = []
    cleanup_shelters  = []
    cleanup_accounts  = []

    try:
        # ── Access control ─────────────────────────────────────────────────
        check(
            "GET /change-requests — no token → 403",
            403, requests.get(f"{BASE_URL}/change-requests")
        )
        check(
            "GET /change-requests — citizen → 403 (admin only)",
            403, requests.get(f"{BASE_URL}/change-requests", headers=auth_headers(citizen_token))
        )
        check(
            "GET /change-requests — org → 403 (admin only)",
            403, requests.get(f"{BASE_URL}/change-requests", headers=auth_headers(org_token))
        )

        # ── GET /change-requests (admin) ───────────────────────────────────
        check(
            "GET /change-requests — admin → 200",
            200,
            requests.get(f"{BASE_URL}/change-requests", headers=auth_headers(admin_token)),
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        )
        for s in ("pending", "approved", "rejected"):
            check(
                f"GET /change-requests?status={s} — only {s} records",
                200,
                requests.get(
                    f"{BASE_URL}/change-requests?status={s}",
                    headers=auth_headers(admin_token)
                ),
                validator=lambda r, st=s: all(x["status"] == st for x in r.json()["data"]),
                expected_desc=f"all status={s}"
            )
        check(
            "GET /change-requests?status=invalid → 400",
            400,
            requests.get(
                f"{BASE_URL}/change-requests?status=invalid",
                headers=auth_headers(admin_token)
            )
        )

        # ── GET /change-requests/my ────────────────────────────────────────
        # Submit something so citizen has a visible request
        resp = requests.post(
            f"{BASE_URL}/lost-found/request", json=LF_PAYLOAD,
            headers=auth_headers(citizen_token)
        )
        assert resp.status_code == 201
        seed_rid = resp.json()["data"]["request_id"]
        cleanup_requests.append(seed_rid)

        check(
            "GET /change-requests/my — citizen sees own request",
            200,
            requests.get(f"{BASE_URL}/change-requests/my", headers=auth_headers(citizen_token)),
            validator=lambda r: seed_rid in [str(x["id"]) for x in r.json()["data"]],
            expected_desc="contains own request"
        )
        check(
            "GET /change-requests/my — org (empty list ok)",
            200,
            requests.get(f"{BASE_URL}/change-requests/my", headers=auth_headers(org_token)),
            validator=lambda r: isinstance(r.json()["data"], list),
            expected_desc="list returned"
        )

        # ── Reject flow ────────────────────────────────────────────────────
        check(
            "PUT /{id}/reject — citizen → 403 (admin only)",
            403,
            requests.put(
                f"{BASE_URL}/change-requests/{seed_rid}/reject",
                headers=auth_headers(citizen_token)
            )
        )
        check(
            "PUT /{id}/reject — admin rejects pending → 200",
            200,
            requests.put(
                f"{BASE_URL}/change-requests/{seed_rid}/reject",
                headers=auth_headers(admin_token)
            ),
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        )
        check(
            "PUT /{id}/reject — already rejected → 400",
            400,
            requests.put(
                f"{BASE_URL}/change-requests/{seed_rid}/reject",
                headers=auth_headers(admin_token)
            )
        )

        # ── Approve ADD — lost_found_posts ─────────────────────────────────
        resp = requests.post(
            f"{BASE_URL}/lost-found/request", json=LF_PAYLOAD,
            headers=auth_headers(citizen_token)
        )
        assert resp.status_code == 201
        lf_add_rid = resp.json()["data"]["request_id"]
        cleanup_requests.append(lf_add_rid)

        check(
            "PUT /{id}/approve — citizen → 403 (admin only)",
            403,
            requests.put(
                f"{BASE_URL}/change-requests/{lf_add_rid}/approve",
                headers=auth_headers(citizen_token)
            )
        )
        check(
            "PUT /{id}/approve — admin approves lost_found ADD → 200",
            200,
            requests.put(
                f"{BASE_URL}/change-requests/{lf_add_rid}/approve",
                headers=auth_headers(admin_token)
            ),
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True, row inserted"
        )
        post_id = _find_row("lost_found_posts", "name", LF_PAYLOAD["name"])
        if post_id:
            cleanup_posts.append(post_id)
        check(
            "Verify lost_found_posts row inserted after approve",
            200,
            type("R", (), {
                "status_code": 200 if post_id else 404,
                "text": "found" if post_id else "not found"
            })(),
            expected_desc="row exists in DB"
        )
        check(
            "PUT /{id}/approve — already approved → 400",
            400,
            requests.put(
                f"{BASE_URL}/change-requests/{lf_add_rid}/approve",
                headers=auth_headers(admin_token)
            )
        )

        # ── Approve EDIT — lost_found_posts ────────────────────────────────
        if post_id:
            resp = requests.put(
                f"{BASE_URL}/lost-found/request/{post_id}",
                json={**LF_PAYLOAD, "name": "Golden Retriever EDITED"},
                headers=auth_headers(citizen_token)
            )
            if resp.status_code == 201:
                edit_rid = resp.json()["data"]["request_id"]
                cleanup_requests.append(edit_rid)
                check(
                    "PUT /{id}/approve — admin approves lost_found EDIT → 200",
                    200,
                    requests.put(
                        f"{BASE_URL}/change-requests/{edit_rid}/approve",
                        headers=auth_headers(admin_token)
                    ),
                    validator=lambda r: r.json().get("success") is True,
                    expected_desc="success=True, row updated"
                )
                updated = _find_row("lost_found_posts", "name", "Golden Retriever EDITED")
                check(
                    "Verify lost_found_posts row updated after EDIT approve",
                    200,
                    type("R", (), {
                        "status_code": 200 if updated else 404,
                        "text": "updated" if updated else "not updated"
                    })(),
                    expected_desc="updated name in DB"
                )

        # ── Approve ADD — shelters ─────────────────────────────────────────
        resp = requests.post(
            f"{BASE_URL}/shelters/request", json=SHELTER_PAYLOAD,
            headers=auth_headers(org_token)
        )
        assert resp.status_code == 201
        sh_add_rid = resp.json()["data"]["request_id"]
        cleanup_requests.append(sh_add_rid)

        check(
            "PUT /{id}/approve — admin approves shelter ADD → 200",
            200,
            requests.put(
                f"{BASE_URL}/change-requests/{sh_add_rid}/approve",
                headers=auth_headers(admin_token)
            ),
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True, row inserted"
        )
        shelter_id = _find_row("shelters", "shelter_name", SHELTER_PAYLOAD["shelter_name"])
        if shelter_id:
            cleanup_shelters.append(shelter_id)
        check(
            "Verify shelters row inserted after approve",
            200,
            type("R", (), {
                "status_code": 200 if shelter_id else 404,
                "text": "found" if shelter_id else "not found"
            })(),
            expected_desc="row exists in DB"
        )

        # ── Approve DELETE — shelters ──────────────────────────────────────
        temp_shelter = db_insert_shelter(org["user_id"])
        cleanup_shelters.append(temp_shelter)

        resp = requests.delete(
            f"{BASE_URL}/shelters/request/{temp_shelter}",
            headers=auth_headers(org_token)
        )
        assert resp.status_code == 201
        sh_del_rid = resp.json()["data"]["request_id"]
        cleanup_requests.append(sh_del_rid)

        check(
            "PUT /{id}/approve — admin approves shelter DELETE → 200",
            200,
            requests.put(
                f"{BASE_URL}/change-requests/{sh_del_rid}/approve",
                headers=auth_headers(admin_token)
            ),
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True, row deleted"
        )
        still_exists = _row_exists("shelters", temp_shelter)
        if not still_exists:
            cleanup_shelters.remove(temp_shelter)
        check(
            "Verify shelter row deleted after DELETE approve",
            200,
            type("R", (), {
                "status_code": 200 if not still_exists else 500,
                "text": "deleted" if not still_exists else "still exists"
            })(),
            expected_desc="row removed from DB"
        )

        # ── Approve ADD — donation_accounts ───────────────────────────────
        resp = requests.post(
            f"{BASE_URL}/donation-accounts/request", json=DONATION_PAYLOAD,
            headers=auth_headers(org_token)
        )
        assert resp.status_code == 201
        da_add_rid = resp.json()["data"]["request_id"]
        cleanup_requests.append(da_add_rid)

        check(
            "PUT /{id}/approve — admin approves donation ADD → 200",
            200,
            requests.put(
                f"{BASE_URL}/change-requests/{da_add_rid}/approve",
                headers=auth_headers(admin_token)
            ),
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True, row inserted"
        )
        account_id = _find_row("donation_accounts", "account_title", DONATION_PAYLOAD["account_title"])
        if account_id:
            cleanup_accounts.append(account_id)
        check(
            "Verify donation_accounts row inserted after approve",
            200,
            type("R", (), {
                "status_code": 200 if account_id else 404,
                "text": "found" if account_id else "not found"
            })(),
            expected_desc="row exists in DB"
        )

        # ── 404 for non-existent request ──────────────────────────────────
        for action in ("approve", "reject"):
            check(
                f"PUT /{{id}}/{action} — non-existent → 404",
                404,
                requests.put(
                    f"{BASE_URL}/change-requests/00000000-0000-0000-0000-000000000000/{action}",
                    headers=auth_headers(admin_token)
                )
            )

    finally:
        for rid in cleanup_requests:
            db_delete_change_request(rid)
        for pid in cleanup_posts:
            db_delete_lost_found_post(pid)
        for sid in cleanup_shelters:
            db_delete_shelter(sid)
        for aid in cleanup_accounts:
            db_delete_donation_account(aid)
        db_delete_user(citizen["user_id"])
        db_delete_user(org["user_id"])

    print_results("CHANGE REQUESTS — Integration Tests")


if __name__ == "__main__":
    run_tests()
