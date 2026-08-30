"""
One-time migration: moves existing binary images from the database
into Supabase Storage and stores the file path in image_url column.
Safe to re-run — skips posts that already have image_url set.
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from storage import upload_image

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
cur  = conn.cursor()

# Fetch posts that have old binary image but no image_url yet
cur.execute("""
    SELECT id, image FROM lost_found_posts
    WHERE image IS NOT NULL AND (image_url IS NULL OR image_url = '')
""")
posts = cur.fetchall()
print(f"Found {len(posts)} posts to migrate.\n")

migrated = 0
for post in posts:
    try:
        image_bytes = bytes(post["image"])
        # Detect format from magic bytes
        if image_bytes[:2] == b'\xff\xd8':
            content_type = "image/jpeg"
        elif image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            content_type = "image/png"
        else:
            content_type = "image/jpeg"  # default

        file_name = upload_image(image_bytes, content_type)

        cur.execute("""
            UPDATE lost_found_posts
            SET image_url = %s, image = NULL
            WHERE id = %s
        """, (file_name, post["id"]))

        conn.commit()
        migrated += 1
        print(f"  ✅ Migrated post {post['id']}")
    except Exception as e:
        conn.rollback()
        print(f"  ❌ Failed post {post['id']}: {e}")

cur.close()
conn.close()
print(f"\nDone. {migrated}/{len(posts)} posts migrated.")
