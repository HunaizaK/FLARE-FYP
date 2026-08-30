"""
Run once to add performance indexes to the database.
Safe to re-run — all use CREATE INDEX IF NOT EXISTS.
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

INDEXES = """
-- app_users
CREATE INDEX IF NOT EXISTS idx_users_username      ON app_users(username);
CREATE INDEX IF NOT EXISTS idx_users_email         ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_approved ON app_users(role, is_approved);

-- lost_found_posts
CREATE INDEX IF NOT EXISTS idx_lf_user_id          ON lost_found_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_lf_created_at       ON lost_found_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lf_approval_created ON lost_found_posts(approval_status, created_at DESC);

-- shelters
CREATE INDEX IF NOT EXISTS idx_shelters_added_by       ON shelters(added_by);
CREATE INDEX IF NOT EXISTS idx_shelters_created_at     ON shelters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shelters_status_created ON shelters(approval_status, created_at DESC);

-- change_requests
CREATE INDEX IF NOT EXISTS idx_cr_requested_by         ON change_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_cr_status               ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_cr_created_at           ON change_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cr_table_record_status  ON change_requests(table_name, record_id, status);

-- donation_accounts
CREATE INDEX IF NOT EXISTS idx_da_added_by    ON donation_accounts(added_by);
CREATE INDEX IF NOT EXISTS idx_da_created_at  ON donation_accounts(created_at DESC);

-- organizations
CREATE INDEX IF NOT EXISTS idx_orgs_user_id ON organizations(user_id);
"""

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

for stmt in [s.strip() for s in INDEXES.strip().split('\n') if s.strip() and not s.strip().startswith('--')]:
    try:
        cur.execute(stmt)
        name = stmt.split('idx_')[1].split(' ')[0] if 'idx_' in stmt else stmt
        print(f"  ✅ {name}")
    except Exception as e:
        print(f"  ❌ {stmt[:60]} → {e}")

cur.close()
conn.close()
print("\nDone.")
