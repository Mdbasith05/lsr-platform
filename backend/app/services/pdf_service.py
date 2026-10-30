import re
import logging
from typing import List, Dict, Any, Tuple, Optional

try:
    import pymupdf as fitz
except ImportError:
    import fitz

logger = logging.getLogger(__name__)

_ocr_engine_instance = None


def get_ocr_engine():
    """Lazily initializes the RapidOCR engine to conserve memory on startup."""
    global _ocr_engine_instance
    if _ocr_engine_instance is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _ocr_engine_instance = RapidOCR()
            logger.info("[PdfService] RapidOCR ONNX engine initialized successfully.")
        except Exception as e:
            logger.warning(f"[PdfService] Failed to initialize RapidOCR: {e}. OCR fallback disabled.")
            _ocr_engine_instance = False
    return _ocr_engine_instance if _ocr_engine_instance is not False else None


class PdfService:
    @staticmethod
    def extract_pages_and_metadata(pdf_bytes: bytes) -> Tuple[int, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Extracts page-by-page text, performs optical character recognition (OCR)
        on scanned deeds/pages, and parses deed metadata using PyMuPDF and RapidOCR.
        """
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            logger.warning(f"[PdfService] Failed to parse as PDF stream: {e}. Treating as non-PDF or single page.")
            return 1, [{"page_number": 1, "raw_text": "[Non-PDF or Scanned Binary Document]", "ocr_applied": True}], {}

        if doc.is_encrypted:
            logger.warning("[PdfService] Document is password-encrypted.")
            return len(doc), [{"page_number": 1, "raw_text": "[Encrypted PDF - Decryption required for OCR]", "ocr_applied": False}], {}

        page_count = len(doc)
        pages_data = []
        combined_text = ""

        ocr_engine = get_ocr_engine()

        for page_index in range(page_count):
            page_num = page_index + 1
            page = doc[page_index]
            text = page.get_text("text").strip()

            ocr_applied = False
            # Check text quality: evaluate total length, alphanumeric count, and word structure
            alphanumeric_count = len(re.sub(r'[^a-zA-Z0-9]', '', text))
            words = [w for w in text.split() if len(w) > 1 and any(c.isalnum() for c in w)]

            # If native text extraction is minimal or unreadable (< 50 chars or < 25 alphanumeric chars or < 5 words), trigger RapidOCR
            needs_ocr = (len(text) < 50 or alphanumeric_count < 25 or len(words) < 5)

            if needs_ocr and ocr_engine is not None:
                try:
                    # Render page at 150 DPI for optimal OCR recognition
                    pix = page.get_pixmap(dpi=150)
                    img_png = pix.tobytes("png")
                    ocr_result, _ = ocr_engine(img_png)

                    if ocr_result:
                        ocr_lines = [item[1].strip() for item in ocr_result if len(item) > 1 and item[1].strip()]
                        if ocr_lines:
                            text = "\n".join(ocr_lines)
                            ocr_applied = True
                            logger.info(f"[PdfService] Extracted {len(ocr_lines)} lines via OCR on page {page_num}.")
                    else:
                        if len(text) < 20:
                            text = f"[Scanned Deed Page {page_num}: No legible text detected via OCR]"
                        ocr_applied = True
                except Exception as ocr_err:
                    logger.warning(f"[PdfService] OCR failed on page {page_num}: {ocr_err}")
                    if len(text) < 20:
                        text = f"[Scanned Deed Page {page_num}: OCR processing error]"
                    ocr_applied = True
            elif needs_ocr:
                # OCR engine not available
                if len(text) < 20:
                    text = f"[Scanned Deed Page {page_num}: High-resolution scan requiring manual advocate review]"
                ocr_applied = False

            combined_text += f"\n--- PAGE {page_num} ---\n" + text
            pages_data.append({
                "page_number": page_num,
                "raw_text": text,
                "ocr_applied": ocr_applied,
            })

        metadata = PdfService._extract_legal_metadata(combined_text)
        return page_count, pages_data, metadata

    @staticmethod
    def _extract_legal_metadata(text: str) -> Dict[str, Any]:
        """Extracts registration number, date, and SRO using regex."""
        metadata = {
            "registration_number": None,
            "doc_date": None,
            "sub_registrar_office": None,
        }

        # Look for Doc No / Registration patterns (e.g. KRI-1-08921-2016-17 or 8921/2016)
        reg_match = re.search(r"(?:Document|Doc|Registration)\s*(?:No\.?|Number|#)?\s*[:\-]?\s*([A-Za-z0-9\-\/]{4,28})", text, re.IGNORECASE)
        if reg_match:
            metadata["registration_number"] = reg_match.group(1).strip()

        # Look for Date (e.g. 14th day of October 2016 or 14/10/2016)
        date_match = re.search(r"(\d{1,2}(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4})", text, re.IGNORECASE)
        if date_match:
            metadata["doc_date"] = date_match.group(1).strip()
        else:
            num_date = re.search(r" (\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}) ", text)
            if num_date:
                metadata["doc_date"] = num_date.group(1).strip()

        # Look for Sub-Registrar
        sro_pattern = r"Sub[- ]Registrar(?:\s+Office)?(?:\s+of\s+)?([A-Za-z\s,]+?)(?:\.|;|\n|,|$)"
        sro_match = re.search(sro_pattern, text, re.IGNORECASE)
        if sro_match:
            sro_name = sro_match.group(1).strip()
            if len(sro_name) < 50:
                metadata["sub_registrar_office"] = sro_name
        return metadata


pdf_service = PdfService()
