import os
import uuid
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL         = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # service_role key — bypasses RLS
BUCKET               = "lost-found"

_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def upload_image(file_bytes: bytes, content_type: str) -> str:
    """
    Upload image bytes to Supabase Storage.
    Returns the file path stored in the bucket (use this in DB).
    """
    ext       = content_type.split("/")[-1]   # jpeg / png / webp
    file_name = f"{uuid.uuid4()}.{ext}"

    _client.storage.from_(BUCKET).upload(
        path         = file_name,
        file         = file_bytes,
        file_options = {"content-type": content_type},
    )
    return file_name


def _extract_signed_url(item: dict) -> str | None:
    """Extract signed URL regardless of key casing (signedUrl vs signedURL)."""
    return item.get("signedUrl") or item.get("signedURL") or item.get("signed_url")


def get_signed_url(file_name: str, expires_in: int = 3600) -> str:
    """
    Generate a signed URL for a private bucket file.
    Valid for `expires_in` seconds (default 1 hour).
    """
    res = _client.storage.from_(BUCKET).create_signed_url(file_name, expires_in)
    return _extract_signed_url(res)


def get_signed_urls_batch(file_names: list, expires_in: int = 3600) -> dict:
    """
    Generate signed URLs for multiple files in a single API call.
    Returns dict of {file_name: signed_url}.
    """
    res = _client.storage.from_(BUCKET).create_signed_urls(file_names, expires_in)
    result = {}
    for item in (res or []):
        path = item.get("path") or item.get("name") or item.get("key")
        url  = _extract_signed_url(item)
        if path and url:
            result[path] = url
    return result


def delete_image(file_name: str):
    """Delete an image from storage (called when post is deleted)."""
    try:
        _client.storage.from_(BUCKET).remove([file_name])
    except Exception:
        pass
