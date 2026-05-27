"""
Master test runner for all FLARE backend integration tests.

Usage:
  cd backend
  python -m tests.run_tests

Or run individual suites:
  python -m tests.test_lost_found
  python -m tests.test_shelters
  python -m tests.test_donation_accounts
  python -m tests.test_change_requests

Requirements:
  pip install requests
  Server must be running: uvicorn main:app --reload  (from backend/ directory)
"""

import sys
import os
import traceback

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tests.test_lost_found import run_tests as run_lf
from tests.test_shelters import run_tests as run_shelters
from tests.test_donation_accounts import run_tests as run_donations
from tests.test_change_requests import run_tests as run_change_requests

SUITES = [
    ("Lost & Found", run_lf),
    ("Shelters", run_shelters),
    ("Donation Accounts", run_donations),
    ("Change Requests", run_change_requests),
]

if __name__ == "__main__":
    print("\n" + "█" * 65)
    print("  FLARE Backend — Full Integration Test Suite")
    print("█" * 65)

    failed_suites = []

    for name, runner in SUITES:
        try:
            runner()
        except Exception as exc:
            print(f"\n  [ERROR] Suite '{name}' crashed:\n  {traceback.format_exc()}")
            failed_suites.append(name)

    print("\n" + "█" * 65)
    if failed_suites:
        print(f"  DONE — {len(failed_suites)} suite(s) crashed: {', '.join(failed_suites)}")
    else:
        print("  DONE — All suites ran successfully.")
    print("█" * 65 + "\n")
