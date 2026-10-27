import os
import shutil
from pathlib import Path
from typing import Tuple, Optional
from app.core.config import settings

# Base storage directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
LOCAL_STORAGE_DIR = BACKEND_DIR / "storage"
LOCAL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


class StorageService:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL.strip() if settings.SUPABASE_URL else None
        self.supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY.strip() if settings.SUPABASE_SERVICE_ROLE_KEY else None
        self.bucket_name = "legal-documents"

    def save_document_file(self, case_id: str, doc_id: str, file_name: str, file_bytes: bytes) -> str:
        """
        Saves document bytes securely to storage.
        Returns the relative storage_path.
        """
        relative_path = f"cases/{case_id}/{doc_id}_{file_name}"

        # If Supabase credentials are configured, we can upload to Supabase Storage
        if self.supabase_url and self.supabase_key and "placeholder" not in self.supabase_key:
            try:
                import httpx
                headers = {
                    "Authorization": f"Bearer {self.supabase_key}",
                    "apikey": self.supabase_key,
                }
                upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{relative_path}"
                with httpx.Client() as client:
                    resp = client.post(upload_url, headers=headers, content=file_bytes)
                    if resp.status_code in [200, 201]:
                        return relative_path
            except Exception as e:
                print(f"[StorageService] Supabase upload failed, falling back to local disk: {e}")

        # Local secure disk storage fallback
        dest_dir = LOCAL_STORAGE_DIR / "cases" / case_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / f"{doc_id}_{file_name}"

        with open(dest_path, "wb") as f:
            f.write(file_bytes)

        return relative_path

    def get_document_bytes(self, storage_path: str) -> Optional[bytes]:
        """Reads document bytes from storage."""
        # Check local disk first
        local_path = LOCAL_STORAGE_DIR / storage_path
        if local_path.exists() and local_path.is_file():
            with open(local_path, "rb") as f:
                return f.read()

        # If stored in Supabase Storage
        if self.supabase_url and self.supabase_key and "placeholder" not in self.supabase_key:
            try:
                import httpx
                download_url = f"{self.supabase_url}/storage/v1/object/authenticated/{self.bucket_name}/{storage_path}"
                headers = {
                    "Authorization": f"Bearer {self.supabase_key}",
                    "apikey": self.supabase_key,
                }
                with httpx.Client() as client:
                    resp = client.get(download_url, headers=headers)
                    if resp.status_code == 200:
                        return resp.content
            except Exception as e:
                print(f"[StorageService] Supabase read failed: {e}")

        return None

    def get_signed_url(self, storage_path: str, doc_id: str) -> str:
        """Returns accessible URL for viewing the document."""
        # In local mode, point directly to FastAPI streaming endpoint
        return f"/api/v1/documents/{doc_id}/content"


storage_service = StorageService()
