"""
Integration tests — /shelters

Admin credentials:  admin / admin123  (auto-created on server startup)

Run:
  cd backend && python -m tests.test_shelters
"""

import sys, os, requests
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tests.helpers import (
    BASE_URL, auth_headers, login, check, reset_results, print_results,
    create_citizen, create_organization, approve_organization,
    db_delete_user, db_delete_change_request, db_delete_shelter,
    db_insert_shelter,
)

VALID_SHELTER = {
    "shelter_name": "Hope Shelter",
    "location": "Lahore Model Town",
    "capacity": 120,
    "latitude": 31.4697,
    "longitude": 74.2728,
}


def run_tests():
    reset_results()

    print("\n  Setting up test users…")
    admin_token = login("admin", "admin123")
    citizen     = create_citizen()
    citizen_token = login(citizen["username"], citizen["password"])
    org  = create_organization()
    approve_organization(admin_token, org["user_id"])
    org_token = login(org["username"], org["password"])
    org2 = create_organization()
    approve_organization(admin_token, org2["user_id"])
    org2_token = login(org2["username"], org2["password"])
    print("  Done.\n")

    created_request_ids = []
    created_shelter_ids = []

    try:
        # ── GET /shelters ──────────────────────────────────────────────────
        check(
            "GET /shelters — no token",
            403, requests.get(f"{BASE_URL}/shelters")
        )
        check(
            "GET /shelters — citizen (approved only)",
            200,
            requests.get(f"{BASE_URL}/shelters", headers=auth_headers(citizen_token)),
            validator=lambda r: all(
                s.get("approval_status") == "approved" for s in r.json()["data"]
            ),
            expected_desc="only approved"
        )
        check(
            "GET /shelters — approved org",
            200, requests.get(f"{BASE_URL}/shelters", headers=auth_headers(org_token))
        )
        check(
            "GET /shelters — admin (all statuses)",
            200, requests.get(f"{BASE_URL}/shelters", headers=auth_headers(admin_token))
        )

        # ── POST /shelters/request (add) ───────────────────────────────────
        check(
            "POST /request — no token",
            403, requests.post(f"{BASE_URL}/shelters/request", json=VALID_SHELTER)
        )
        check(
            "POST /request — citizen → 403 (org only)",
            403,
            requests.post(
                f"{BASE_URL}/shelters/request", json=VALID_SHELTER,
                headers=auth_headers(citizen_token)
            )
        )
        check(
            "POST /request — admin → 403 (org only)",
            403,
            requests.post(
                f"{BASE_URL}/shelters/request", json=VALID_SHELTER,
                headers=auth_headers(admin_token)
            )
        )
        check(
            "POST /request — missing required fields → 422",
            422,
            requests.post(
                f"{BASE_URL}/shelters/request",
                json={"shelter_name": "Only name"},
                headers=auth_headers(org_token)
            )
        )

        resp = requests.post(
            f"{BASE_URL}/shelters/request", json=VALID_SHELTER,
            headers=auth_headers(org_token)
        )
        if check(
            "POST /request — org add shelter",
            201, resp,
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        ):
            created_request_ids.append(resp.json()["data"]["request_id"])

        # ── PUT /shelters/request/{id} (edit) ─────────────────────────────
        org_shelter_id = db_insert_shelter(org["user_id"])
        created_shelter_ids.append(org_shelter_id)

        resp = requests.put(
            f"{BASE_URL}/shelters/request/{org_shelter_id}",
            json={**VALID_SHELTER, "shelter_name": "Hope Updated", "capacity": 150},
            headers=auth_headers(org_token)
        )
        if check(
            "PUT /request/{id} — org edits own shelter",
            201, resp,
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        ):
            created_request_ids.append(resp.json()["data"]["request_id"])

        check(
            "PUT /request/{id} — duplicate pending → 409",
            409,
            requests.put(
                f"{BASE_URL}/shelters/request/{org_shelter_id}",
                json=VALID_SHELTER,
                headers=auth_headers(org_token)
            )
        )
        check(
            "PUT /request/{id} — org2 edits org's shelter → 403",
            403,
            requests.put(
                f"{BASE_URL}/shelters/request/{org_shelter_id}",
                json=VALID_SHELTER,
                headers=auth_headers(org2_token)
            )
        )
        check(
            "PUT /request/{id} — citizen edits shelter → 403 (org only)",
            403,
            requests.put(
                f"{BASE_URL}/shelters/request/{org_shelter_id}",
                json=VALID_SHELTER,
                headers=auth_headers(citizen_token)
            )
        )
        check(
            "PUT /request/{id} — non-existent shelter → 404",
            404,
            requests.put(
                f"{BASE_URL}/shelters/request/00000000-0000-0000-0000-000000000000",
                json=VALID_SHELTER,
                headers=auth_headers(org_token)
            )
        )

        # ── DELETE /shelters/request/{id} ──────────────────────────────────
        org_shelter_id2 = db_insert_shelter(org["user_id"])
        created_shelter_ids.append(org_shelter_id2)

        check(
            "DELETE /request/{id} — org2 deletes org's shelter → 403",
            403,
            requests.delete(
                f"{BASE_URL}/shelters/request/{org_shelter_id2}",
                headers=auth_headers(org2_token)
            )
        )
        check(
            "DELETE /request/{id} — citizen deletes shelter → 403 (org only)",
            403,
            requests.delete(
                f"{BASE_URL}/shelters/request/{org_shelter_id2}",
                headers=auth_headers(citizen_token)
            )
        )

        resp = requests.delete(
            f"{BASE_URL}/shelters/request/{org_shelter_id2}",
            headers=auth_headers(org_token)
        )
        if check(
            "DELETE /request/{id} — org deletes own shelter",
            201, resp,
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        ):
            created_request_ids.append(resp.json()["data"]["request_id"])

        check(
            "DELETE /request/{id} — duplicate pending → 409",
            409,
            requests.delete(
                f"{BASE_URL}/shelters/request/{org_shelter_id2}",
                headers=auth_headers(org_token)
            )
        )
        check(
            "DELETE /request/{id} — non-existent shelter → 404",
            404,
            requests.delete(
                f"{BASE_URL}/shelters/request/00000000-0000-0000-0000-000000000000",
                headers=auth_headers(org_token)
            )
        )

    finally:
        for rid in created_request_ids:
            db_delete_change_request(rid)
        for sid in created_shelter_ids:
            db_delete_shelter(sid)
        db_delete_user(citizen["user_id"])
        db_delete_user(org["user_id"])
        db_delete_user(org2["user_id"])

    print_results("SHELTERS — Integration Tests")


if __name__ == "__main__":
    run_tests()
