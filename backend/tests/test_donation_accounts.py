"""
Integration tests — /donation-accounts

Admin credentials:  admin / admin123  (auto-created on server startup)

Run:
  cd backend && python -m tests.test_donation_accounts
"""

import sys, os, requests
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tests.helpers import (
    BASE_URL, auth_headers, login, check, reset_results, print_results,
    create_citizen, create_organization, approve_organization,
    db_delete_user, db_delete_change_request, db_delete_donation_account,
    db_insert_donation_account,
)

VALID_ACCOUNT = {
    "account_title": "FLARE Relief Fund",
    "account_no": "1234567890",
    "bank_name": "HBL",
    "iban": "PK36SCBL0000001123456702",
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
    created_account_ids = []

    try:
        # ── GET /donation-accounts ─────────────────────────────────────────
        check(
            "GET /donation-accounts — no token",
            403, requests.get(f"{BASE_URL}/donation-accounts")
        )
        check(
            "GET /donation-accounts — citizen",
            200,
            requests.get(f"{BASE_URL}/donation-accounts", headers=auth_headers(citizen_token)),
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        )
        check(
            "GET /donation-accounts — approved org",
            200, requests.get(f"{BASE_URL}/donation-accounts", headers=auth_headers(org_token))
        )
        check(
            "GET /donation-accounts — admin",
            200, requests.get(f"{BASE_URL}/donation-accounts", headers=auth_headers(admin_token))
        )

        # ── POST /donation-accounts/request (add) ─────────────────────────
        check(
            "POST /request — no token",
            403, requests.post(f"{BASE_URL}/donation-accounts/request", json=VALID_ACCOUNT)
        )
        check(
            "POST /request — citizen → 403 (org only)",
            403,
            requests.post(
                f"{BASE_URL}/donation-accounts/request", json=VALID_ACCOUNT,
                headers=auth_headers(citizen_token)
            )
        )
        check(
            "POST /request — admin → 403 (org only)",
            403,
            requests.post(
                f"{BASE_URL}/donation-accounts/request", json=VALID_ACCOUNT,
                headers=auth_headers(admin_token)
            )
        )
        check(
            "POST /request — missing fields → 422",
            422,
            requests.post(
                f"{BASE_URL}/donation-accounts/request",
                json={"account_title": "Only title"},
                headers=auth_headers(org_token)
            )
        )

        resp = requests.post(
            f"{BASE_URL}/donation-accounts/request", json=VALID_ACCOUNT,
            headers=auth_headers(org_token)
        )
        if check(
            "POST /request — org add account",
            201, resp,
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        ):
            created_request_ids.append(resp.json()["data"]["request_id"])

        # ── PUT /donation-accounts/request/{id} (edit) ────────────────────
        org_account_id = db_insert_donation_account(org["user_id"])
        created_account_ids.append(org_account_id)

        resp = requests.put(
            f"{BASE_URL}/donation-accounts/request/{org_account_id}",
            json={**VALID_ACCOUNT, "account_title": "Updated Fund"},
            headers=auth_headers(org_token)
        )
        if check(
            "PUT /request/{id} — org edits own account",
            201, resp,
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        ):
            created_request_ids.append(resp.json()["data"]["request_id"])

        check(
            "PUT /request/{id} — duplicate pending → 409",
            409,
            requests.put(
                f"{BASE_URL}/donation-accounts/request/{org_account_id}",
                json=VALID_ACCOUNT,
                headers=auth_headers(org_token)
            )
        )
        check(
            "PUT /request/{id} — org2 edits org's account → 403",
            403,
            requests.put(
                f"{BASE_URL}/donation-accounts/request/{org_account_id}",
                json=VALID_ACCOUNT,
                headers=auth_headers(org2_token)
            )
        )
        check(
            "PUT /request/{id} — citizen edits account → 403 (org only)",
            403,
            requests.put(
                f"{BASE_URL}/donation-accounts/request/{org_account_id}",
                json=VALID_ACCOUNT,
                headers=auth_headers(citizen_token)
            )
        )
        check(
            "PUT /request/{id} — non-existent account → 404",
            404,
            requests.put(
                f"{BASE_URL}/donation-accounts/request/00000000-0000-0000-0000-000000000000",
                json=VALID_ACCOUNT,
                headers=auth_headers(org_token)
            )
        )

        # ── DELETE /donation-accounts/request/{id} ────────────────────────
        org_account_id2 = db_insert_donation_account(org["user_id"])
        created_account_ids.append(org_account_id2)

        check(
            "DELETE /request/{id} — org2 deletes org's account → 403",
            403,
            requests.delete(
                f"{BASE_URL}/donation-accounts/request/{org_account_id2}",
                headers=auth_headers(org2_token)
            )
        )
        check(
            "DELETE /request/{id} — citizen deletes account → 403 (org only)",
            403,
            requests.delete(
                f"{BASE_URL}/donation-accounts/request/{org_account_id2}",
                headers=auth_headers(citizen_token)
            )
        )

        resp = requests.delete(
            f"{BASE_URL}/donation-accounts/request/{org_account_id2}",
            headers=auth_headers(org_token)
        )
        if check(
            "DELETE /request/{id} — org deletes own account",
            201, resp,
            validator=lambda r: r.json().get("success") is True,
            expected_desc="success=True"
        ):
            created_request_ids.append(resp.json()["data"]["request_id"])

        check(
            "DELETE /request/{id} — duplicate pending → 409",
            409,
            requests.delete(
                f"{BASE_URL}/donation-accounts/request/{org_account_id2}",
                headers=auth_headers(org_token)
            )
        )
        check(
            "DELETE /request/{id} — non-existent account → 404",
            404,
            requests.delete(
                f"{BASE_URL}/donation-accounts/request/00000000-0000-0000-0000-000000000000",
                headers=auth_headers(org_token)
            )
        )

    finally:
        for rid in created_request_ids:
            db_delete_change_request(rid)
        for aid in created_account_ids:
            db_delete_donation_account(aid)
        db_delete_user(citizen["user_id"])
        db_delete_user(org["user_id"])
        db_delete_user(org2["user_id"])

    print_results("DONATION ACCOUNTS — Integration Tests")


if __name__ == "__main__":
    run_tests()
