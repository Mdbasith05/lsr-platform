import os
import re
import shutil
import logging
from pathlib import Path
from typing import Tuple, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Base storage directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
LOCAL_STORAGE_DIR = (BACKEND_DIR / "storage").resolve()
LOCAL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_filename(name: str) -> str:
    """Strips path elements and restricts characters to prevent path traversal."""
    clean_name = Path(name).name
    # Keep only alphanumeric, hyphens, underscores, dots
    clean_name = re.sub(r"[^A-Za-z0-9_.-]", "_", clean_name)
    return clean_name or "document.pdf"


class StorageService:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL.strip() if settings.SUPABASE_URL else None
        self.supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY.strip() if settings.SUPABASE_SERVICE_ROLE_KEY else None
        self.bucket_name = "legal-documents"

    def save_document_file(self, case_id: str, doc_id: str, file_name: str, file_bytes: bytes) -> str:
        """
        Saves document bytes securely to storage.
        Sanitizes filenames to prevent path traversal.
        Returns the relative storage_path.
        """
        clean_file_name = sanitize_filename(file_name)
        clean_case_id = re.sub(r"[^A-Za-z0-9_-]", "_", case_id)
        clean_doc_id = re.sub(r"[^A-Za-z0-9_-]", "_", doc_id)
        relative_path = f"cases/{clean_case_id}/{clean_doc_id}_{clean_file_name}"

        # If Supabase credentials are configured, upload to Supabase Storage
        if self.supabase_url and self.supabase_key and "placeholder" not in self.supabase_key:
            try:
                import httpx
                headers = {
                    "Authorization": f"Bearer {self.supabase_key}",
                    "apikey": self.supabase_key,
                }
                upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{relative_path}"
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(upload_url, headers=headers, content=file_bytes)
                    if resp.status_code in [200, 201]:
                        logger.info(f"[StorageService] Successfully uploaded to Supabase: {relative_path}")
                        return relative_path
            except Exception as e:
                logger.warning(f"[StorageService] Supabase upload failed, falling back to local disk: {e}")

        # Local secure disk storage fallback
        dest_dir = (LOCAL_STORAGE_DIR / "cases" / clean_case_id).resolve()
        if not dest_dir.is_relative_to(LOCAL_STORAGE_DIR):
            raise ValueError("Invalid storage directory path")
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = (dest_dir / f"{clean_doc_id}_{clean_file_name}").resolve()
        if not dest_path.is_relative_to(LOCAL_STORAGE_DIR):
            raise ValueError("Invalid destination file path")

        with open(dest_path, "wb") as f:
            f.write(file_bytes)

        return relative_path

    def get_document_bytes(self, storage_path: str) -> Optional[bytes]:
        """Reads document bytes from storage with strict boundary enforcement."""
        try:
            local_path = (LOCAL_STORAGE_DIR / storage_path).resolve()
            if local_path.is_relative_to(LOCAL_STORAGE_DIR) and local_path.exists() and local_path.is_file():
                with open(local_path, "rb") as f:
                    return f.read()
        except Exception as e:
            logger.warning(f"[StorageService] Local read failed or invalid path '{storage_path}': {e}")

        # If stored in Supabase Storage
        if self.supabase_url and self.supabase_key and "placeholder" not in self.supabase_key:
            try:
                import httpx
                download_url = f"{self.supabase_url}/storage/v1/object/authenticated/{self.bucket_name}/{storage_path}"
                headers = {
                    "Authorization": f"Bearer {self.supabase_key}",
                    "apikey": self.supabase_key,
                }
                with httpx.Client(timeout=10.0) as client:
                    resp = client.get(download_url, headers=headers)
                    if resp.status_code == 200:
                        return resp.content
            except Exception as e:
                logger.warning(f"[StorageService] Supabase read failed: {e}")

        return None

    def delete_document_file(self, storage_path: str) -> bool:
        """Deletes document file from local storage and Supabase storage."""
        deleted = False
        try:
            local_path = (LOCAL_STORAGE_DIR / storage_path).resolve()
            if local_path.is_relative_to(LOCAL_STORAGE_DIR) and local_path.exists():
                local_path.unlink()
                deleted = True
        except Exception as e:
            logger.warning(f"[StorageService] Local delete failed for '{storage_path}': {e}")

        if self.supabase_url and self.supabase_key and "placeholder" not in self.supabase_key:
            try:
                import httpx
                headers = {
                    "Authorization": f"Bearer {self.supabase_key}",
                    "apikey": self.supabase_key,
                }
                delete_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{storage_path}"
                with httpx.Client(timeout=5.0) as client:
                    resp = client.delete(delete_url, headers=headers)
                    if resp.status_code in [200, 204]:
                        deleted = True
            except Exception as e:
                logger.warning(f"[StorageService] Supabase delete failed: {e}")

        return deleted

    def get_signed_url(self, storage_path: str, doc_id: str) -> str:
        """Returns accessible URL for viewing the document."""
        return f"/api/v1/documents/{doc_id}/content"


storage_service = StorageService()
