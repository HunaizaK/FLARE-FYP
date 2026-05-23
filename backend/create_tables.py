import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing. Add it inside your .env file.")

SQL = """
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) UNIQUE NOT NULL,
    contact_no VARCHAR(20),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL CHECK (
        role IN ('admin', 'organization', 'citizen')
    ),

    is_approved BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,

    organization_name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_person VARCHAR(150),

    approved_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lost_found_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,

    image_url TEXT,
    category VARCHAR(100) NOT NULL,
    location TEXT NOT NULL,
    contact VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    additional_info TEXT,

    post_type VARCHAR(20) NOT NULL CHECK (
        post_type IN ('lost', 'found')
    ),

    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        approval_status IN ('pending', 'approved', 'rejected')
    ),

    approved_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shelters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    added_by UUID REFERENCES app_users(id) ON DELETE SET NULL,

    shelter_name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity >= 0),

    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        approval_status IN ('pending', 'approved', 'rejected')
    ),

    approved_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donation_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    added_by UUID REFERENCES app_users(id) ON DELETE SET NULL,

    account_title VARCHAR(255) NOT NULL,
    account_no VARCHAR(100) NOT NULL,
    bank_name VARCHAR(255),
    iban VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(100),
    file_url TEXT,

    generated_by UUID REFERENCES app_users(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,

    published_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lost_found_posts_updated_at ON lost_found_posts;
CREATE TRIGGER update_lost_found_posts_updated_at
BEFORE UPDATE ON lost_found_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shelters_updated_at ON shelters;
CREATE TRIGGER update_shelters_updated_at
BEFORE UPDATE ON shelters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_donation_accounts_updated_at ON donation_accounts;
CREATE TRIGGER update_donation_accounts_updated_at
BEFORE UPDATE ON donation_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_is_approved ON app_users(is_approved);
CREATE INDEX IF NOT EXISTS idx_lost_found_approval_status ON lost_found_posts(approval_status);
CREATE INDEX IF NOT EXISTS idx_shelters_approval_status ON shelters(approval_status);
CREATE INDEX IF NOT EXISTS idx_shelters_location ON shelters(latitude, longitude);
"""

def create_tables():
    conn = None
    cursor = None

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        cursor.execute(SQL)
        conn.commit()

        print("All tables created successfully.")

    except Exception as error:
        print("Error while creating tables:")
        print(error)

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    create_tables()