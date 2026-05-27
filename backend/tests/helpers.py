"""
Shared test helpers for FLARE backend integration tests.

All tests hit the live API at BASE_URL (default: http://localhost:8000).
Start the server first:  uvicorn main:app --reload  (from the backend/ directory)
"""

import sys
import os
import uuid
import requests

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database import get_db  # noqa: E402

BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")

# ─── ANSI colours ─────────────────────────────────────────────────────────────
GREEN = "\033[92m"
RED   = "\033[91m"
CYAN  = "\033[96m"
BOLD  = "\033[1m"
DIM   = "\033[2m"
RESET = "\033[0m"

# ─── Result store (reset per suite) ──────────────────────────────────────────
_results: list[dict] = []


def reset_results():
    global _results
    _results = []


# ─── Core check function ──────────────────────────────────────────────────────

def check(
    label: str,
    expected_status: int,
    response: requests.Response,
    validator=None,
    expected_desc: str = "",
) -> bool:
    """
    Record one test case.

    label          – short description shown in the table
    expected_status – HTTP status code you expect
    response       – the requests.Response object
    validator      – optional callable(response) -> bool for extra body checks
    expected_desc  – extra text shown in the Expected column, e.g. "success=True"

    Returns True if the test passed.
    """
    status_ok  = response.status_code == expected_status
    extra_ok   = validator(response) if validator else True
    ok         = status_ok and extra_ok

    expected_col = f"HTTP {expected_status}"
    if expected_desc:
        expected_col += f"  {expected_desc}"

    got_col = f"HTTP {response.status_code}"
    if not extra_ok and status_ok:
        got_col += "  (bad body)"

    detail = ""
    if not ok:
        try:
            detail = response.json().get("detail", response.text)
        except Exception:
            detail = response.text

    _results.append({
        "label":    label,
        "expected": expected_col,
        "got":      got_col,
        "ok":       ok,
        "detail":   str(detail)[:160],
    })
    return ok


# ─── Pretty-print the results table ──────────────────────────────────────────

def print_results(suite_title: str):
    C1, C2, C3, C4 = 54, 22, 22, 6      # column widths
    W = C1 + C2 + C3 + C4 + 6

    passed = sum(1 for r in _results if r["ok"])
    failed = len(_results) - passed

    bar = "━" * W
    thin = "─" * W

    print(f"\n{BOLD}{bar}{RESET}")
    print(f"{BOLD}  {suite_title}{RESET}")
    print(f"{BOLD}{bar}{RESET}\n")

    hdr = (
        f"  {BOLD}{'Test':<{C1}}{RESET}"
        f"{BOLD}{'Expected':<{C2}}{RESET}"
        f"{BOLD}{'Got':<{C3}}{RESET}"
        f"{BOLD}{'Result':<{C4}}{RESET}"
    )
    print(hdr)
    print(f"  {thin}")

    for r in _results:
        colour = GREEN if r["ok"] else RED
        status = "PASS" if r["ok"] else "FAIL"
        row = (
            f"  {r['label']:<{C1}}"
            f"{DIM}{r['expected']:<{C2}}{RESET}"
            f"{r['got']:<{C3}}"
            f"{colour}{BOLD}{status}{RESET}"
        )
        print(row)
        if not r["ok"] and r["detail"]:
            print(f"    {DIM}└─ {r['detail']}{RESET}")

    print(f"  {thin}")
    res_colour = GREEN if failed == 0 else RED
    print(
        f"\n  {GREEN}{BOLD}{passed} passed{RESET}  "
        f"{res_colour}{BOLD}{failed} failed{RESET}  "
        f"{DIM}/ {len(_results)} total{RESET}"
    )
    print(f"{BOLD}{bar}{RESET}\n")


# ─── HTTP convenience ─────────────────────────────────────────────────────────

def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login(username: str, password: str) -> str:
    """Login and return access token. Raises AssertionError on failure."""
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    assert resp.status_code == 200, f"Login failed for '{username}': {resp.text}"
    return resp.json()["access_token"]


# ─── User factories ───────────────────────────────────────────────────────────

def create_citizen(suffix: str = None) -> dict:
    """Sign up a citizen. Returns {username, password, user_id}."""
    suffix = suffix or uuid.uuid4().hex[:8]
    username = f"tc_{suffix}"
    resp = requests.post(f"{BASE_URL}/auth/signup", json={
        "username": username,
        "email": f"tc_{suffix}@test.flare",
        "contact_no": "0300000000",
        "password": "Test1234!",
        "role": "citizen",
    })
    assert resp.status_code == 200, f"Citizen signup failed: {resp.text}"
    return {"username": username, "password": "Test1234!", "user_id": resp.json()["user_id"]}


def create_organization(suffix: str = None) -> dict:
    """Sign up an organization (unapproved). Returns {username, password, user_id}."""
    suffix = suffix or uuid.uuid4().hex[:8]
    username = f"to_{suffix}"
    resp = requests.post(f"{BASE_URL}/auth/signup", json={
        "username": username,
        "email": f"to_{suffix}@test.flare",
        "contact_no": "0300000001",
        "password": "Test1234!",
        "role": "organization",
    })
    assert resp.status_code == 200, f"Org signup failed: {resp.text}"
    return {"username": username, "password": "Test1234!", "user_id": resp.json()["user_id"]}


def get_org_table_id(user_id: str) -> str:
    """Return organizations.id for the given app_users.id (needed for approve endpoint)."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM organizations WHERE user_id = %s", (user_id,))
        row = cursor.fetchone()
        assert row, f"No organization row for user_id {user_id}"
        return str(row["id"])
    finally:
        cursor.close()


def approve_organization(admin_token: str, org_user_id: str):
    """Admin approves an org. Takes the app_users.id of the org."""
    org_id = get_org_table_id(org_user_id)
    resp = requests.put(
        f"{BASE_URL}/organizations/{org_id}/approve",
        headers=auth_headers(admin_token)
    )
    assert resp.status_code == 200, f"Org approval failed: {resp.text}"


# ─── DB cleanup helpers ───────────────────────────────────────────────────────

def db_delete_user(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM app_users WHERE id = %s", (user_id,))
        conn.commit()
    finally:
        cursor.close()


def db_delete_change_request(request_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM change_requests WHERE id = %s", (request_id,))
        conn.commit()
    finally:
        cursor.close()


def db_delete_lost_found_post(post_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM lost_found_posts WHERE id = %s", (post_id,))
        conn.commit()
    finally:
        cursor.close()


def db_delete_shelter(shelter_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM shelters WHERE id = %s", (shelter_id,))
        conn.commit()
    finally:
        cursor.close()


def db_delete_donation_account(account_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM donation_accounts WHERE id = %s", (account_id,))
        conn.commit()
    finally:
        cursor.close()


# ─── DB seed helpers (bypass API for test setup) ─────────────────────────────

def db_insert_lost_found_post(user_id: str) -> str:
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO lost_found_posts
                (user_id, category, location, contact, name, post_type, approval_status)
            VALUES (%s, 'test', 'Test City', '0300000000', 'Test Item', 'lost', 'approved')
            RETURNING id
            """,
            (user_id,)
        )
        post_id = str(cursor.fetchone()["id"])
        conn.commit()
        return post_id
    finally:
        cursor.close()


def db_insert_shelter(added_by: str) -> str:
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO shelters
                (added_by, shelter_name, location, capacity, approval_status)
            VALUES (%s, 'Test Shelter', 'Test City', 50, 'approved')
            RETURNING id
            """,
            (added_by,)
        )
        shelter_id = str(cursor.fetchone()["id"])
        conn.commit()
        return shelter_id
    finally:
        cursor.close()


def db_insert_donation_account(added_by: str) -> str:
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO donation_accounts
                (added_by, account_title, account_no, bank_name, iban)
            VALUES (%s, 'Test Account', '12345678', 'Test Bank', 'PK36SCBL0000001123456702')
            RETURNING id
            """,
            (added_by,)
        )
        account_id = str(cursor.fetchone()["id"])
        conn.commit()
        return account_id
    finally:
        cursor.close()
