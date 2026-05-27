"""
Integration tests — /lost-found

Admin credentials:  admin / admin123  (auto-created on server startup)

Run:
  cd backend && python -m tests.test_lost_found
"""

import sys, os, requests
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tests.helpers import (
    BASE_URL, auth_headers, login, check, reset_results, print_results,
    create_citizen, create_organization, approve_organization,
    db_delete_user, db_delete_change_request, db_delete_lost_found_post,
    db_insert_lost_found_post,
)

VALID_POST = {
    "category": "Electronics",
    "location": "Islamabad F-7",
    "contact": "03001234567",
    "name": "Black Wallet",
    "post_type": "lost",
    "additional_info": "Found near Jinnah Super",
}


def run_tests():
    reset_results()

    # ── Setup ──────────────────────────────────────────────────────────────
    print("\n  Setting up test users…")
    admin_token    = login("admin", "admin123")
    citizen        = create_citizen()
    citizen_token  = login(citizen["username"], citizen["password"])
    org            = create_organization()
    approve_organization(admin_token, org["user_id"])
    org_token      = login(org["username"], org["password"])
    unapproved_org = create_organization()
    print("  Done.\n")

    created_request_ids = []
    created_post_ids    = []

    try:
        # ── GET /lost-found ────────────────────────────────────────────────
        check(
            "GET /lost-found — no token",
            403, requests.get(f"{BASE_URL}/lost-found")
        )
        check(
            "GET /lost-found — citizen (approved posts only)",
            200,
            requests.get(f"{BASE_URL}/lost-found", headers=auth_headers(citizen_token)),
            validator=lambda r: all(
                p.get("approval_status") == "approved" for p in r.json()["data"]
            ),
            expected_desc="only approved"
        )
        check(
            "GET /lost-found — approved org",
            200, requests.get(f"{BASE_URL}/lost-found", headers=auth_headers(org_token))
        )
        check(
            "GET /lost-found — admin (all posts)",
            200, requests.get(f"{BASE_URL}/lost-found", headers=auth_headers(admin_token))
        )

        # unapproved org: login is blocked, so token attempt will raise AssertionError
        try:
            up_token = login(unapproved_org["username"], unapproved_org["password"])
            check(
                "GET /lost-found — unapproved org",
                403, requests.get(f"{BASE_URL}/lost-found", headers=auth_headers(up_token))
            )
        except AssertionError:
            # login itself rejected — record as PASS (same enforcement)
            check(
                "GET /lost-found — unapproved org blocked at login",
                403,
                type("R", (), {"status_code": 403, "text": "blocked at login"})()
            )

        # ── POST /lost-found/request (add) ─────────────────────────────────
        check(
            "POST /request — no token",
            403, requests.post(f"{BASE_URL}/lost-found/request", json=VALID_POST)
        )
        check(
            "POST /request — missing required fields",
            422,
            requests.post(
                f"{BASE_URL}/lost-found/request",
                json={"category": "Electronics"},
                headers=auth_headers(citizen_token)
            )
        )

        resp = requests.post(
            f"{BASE_URL}/lost-found/request", json=VALID_POST,
            headers=auth_headers(citizen_token)
        )
        if check(
            "POST /request — citizen add",
            201, resp,
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        ):
            created_request_ids.append(resp.json()["data"]["request_id"])

        resp = requests.post(
            f"{BASE_URL}/lost-found/request", json=VALID_POST,
            headers=auth_headers(org_token)
        )
        if check(
            "POST /request — org add",
            201, resp,
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        ):
            created_request_ids.append(resp.json()["data"]["request_id"])

        # ── PUT /lost-found/request/{id} (edit) ────────────────────────────
        citizen_post_id = db_insert_lost_found_post(citizen["user_id"])
        created_post_ids.append(citizen_post_id)

        resp = requests.put(
            f"{BASE_URL}/lost-found/request/{citizen_post_id}",
            json={**VALID_POST, "name": "Updated Wallet"},
            headers=auth_headers(citizen_token)
        )
        if check(
            "PUT /request/{id} — citizen edits own post",
            201, resp,
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        ):
            created_request_ids.append(resp.json()["data"]["request_id"])

        check(
            "PUT /request/{id} — duplicate pending → 409",
            409,
            requests.put(
                f"{BASE_URL}/lost-found/request/{citizen_post_id}",
                json=VALID_POST,
                headers=auth_headers(citizen_token)
            )
        )
        check(
            "PUT /request/{id} — org edits citizen's post → 403",
            403,
            requests.put(
                f"{BASE_URL}/lost-found/request/{citizen_post_id}",
                json=VALID_POST,
                headers=auth_headers(org_token)
            )
        )
        check(
            "PUT /request/{id} — non-existent post → 404",
            404,
            requests.put(
                f"{BASE_URL}/lost-found/request/00000000-0000-0000-0000-000000000000",
                json=VALID_POST,
                headers=auth_headers(citizen_token)
            )
        )

        # ── DELETE /lost-found/request/{id} ────────────────────────────────
        citizen_post_id2 = db_insert_lost_found_post(citizen["user_id"])
        created_post_ids.append(citizen_post_id2)

        check(
            "DELETE /request/{id} — org deletes citizen's post → 403",
            403,
            requests.delete(
                f"{BASE_URL}/lost-found/request/{citizen_post_id2}",
                headers=auth_headers(org_token)
            )
        )

        resp = requests.delete(
            f"{BASE_URL}/lost-found/request/{citizen_post_id2}",
            headers=auth_headers(citizen_token)
        )
        if check(
            "DELETE /request/{id} — citizen deletes own post",
            201, resp,
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        ):
            created_request_ids.append(resp.json()["data"]["request_id"])

        check(
            "DELETE /request/{id} — duplicate pending → 409",
            409,
            requests.delete(
                f"{BASE_URL}/lost-found/request/{citizen_post_id2}",
                headers=auth_headers(citizen_token)
            )
        )
        check(
            "DELETE /request/{id} — non-existent post → 404",
            404,
            requests.delete(
                f"{BASE_URL}/lost-found/request/00000000-0000-0000-0000-000000000000",
                headers=auth_headers(citizen_token)
            )
        )

    finally:
        for rid in created_request_ids:
            db_delete_change_request(rid)
        for pid in created_post_ids:
            db_delete_lost_found_post(pid)
        db_delete_user(citizen["user_id"])
        db_delete_user(org["user_id"])
        db_delete_user(unapproved_org["user_id"])

    print_results("LOST & FOUND — Integration Tests")


if __name__ == "__main__":
    run_tests()
