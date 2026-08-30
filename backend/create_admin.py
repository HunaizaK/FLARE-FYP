import os
import psycopg2
import bcrypt
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

email    = "admin@flare.com"
username = "admin"
password = "Admin@1234"
contact  = "03000000000"

password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

SQL = """
INSERT INTO app_users (email, username, password_hash, contact_no, role, is_approved)
VALUES (%s, %s, %s, %s, 'admin', TRUE)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_approved = TRUE;
"""

conn = psycopg2.connect(DATABASE_URL)
cur  = conn.cursor()
cur.execute(SQL, (email, username, password_hash, contact))
conn.commit()
cur.close()
conn.close()

print("Admin created successfully.")
print(f"  Email   : {email}")
print(f"  Username: {username}")
print(f"  Password: {password}")
