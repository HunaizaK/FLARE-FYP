import os, psycopg2
from dotenv import load_dotenv
load_dotenv()
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute('ALTER TABLE lost_found_posts ADD COLUMN IF NOT EXISTS image_url TEXT')
conn.commit()
print('Done')
