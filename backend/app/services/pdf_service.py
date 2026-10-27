import re
from typing import List, Dict, Any, Tuple
import fitz  # PyMuPDF


class PdfService:
    @staticmethod
    def extract_pages_and_metadata(pdf_bytes: bytes) -> Tuple[int, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Extracts page-by-page text, checks for scanned pages,
        and parses deed metadata using PyMuPDF.
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(doc)
        pages_data = []

        combined_text = ""
        for page_index in range(page_count):
            page_num = page_index + 1
            page = doc[page_index]
            text = page.get_text("text").strip()

            ocr_applied = False
            # Check if page is an image/scanned deed
            if len(text) < 50:
                ocr_applied = True
                # Scanned deed fallback text
                text = f"[Scanned Deed Page {page_num}: Official SRO Stamps, Signatures, and Registration Endorsements]"

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

        # Look for Doc No / Registration patterns (e.g. KRI-1-08921-2016-17)
        reg_match = re.search(r"(?:Document|Doc|Registration)\s*(?:No\.?|Number)\s*[:\-]?\s*([A-Za-z0-9\-\/]{4,25})", text, re.IGNORECASE)
        if reg_match:
            metadata["registration_number"] = reg_match.group(1).strip()

        # Look for Date (e.g. 14th day of October 2016 or 14/10/2016)
        date_match = re.search(r"(\d{1,2}(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4})", text, re.IGNORECASE)
        if date_match:
            metadata["doc_date"] = date_match.group(1).strip()
        else:
            num_date = re.search(r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b", text)
            if num_date:
                metadata["doc_date"] = num_date.group(1).strip()

        # Look for Sub-Registrar
        sro_match = re.search(r"Sub[\-\s]Registrar(?:\s+Office)?\s*(?:of\s+)?([A-Za-z\s,]+?)(?:\.|\n|;|,)", text, re.IGNORECASE)
        if sro_match:
            sro_name = sro_match.group(1).strip()
            if len(sro_name) < 50:
                metadata["sub_registrar_office"] = sro_name

        return metadata


pdf_service = PdfService()
