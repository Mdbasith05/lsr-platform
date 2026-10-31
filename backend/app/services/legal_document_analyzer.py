import re
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)


class LegalDocumentAnalyzer:
    """
    Intelligent Legal Document Understanding & Entity Extraction Engine.
    Extracts legal metadata, classifies document types, detects operative parties,
    parses schedule boundaries across pages, identifies referenced prior instruments,
    and analyzes title devolution flow across multi-document dossiers.
    """

    @staticmethod
    def classify_document(file_name: str, pages: List[Dict[str, Any]]) -> str:
        """
        Classifies legal instrument type based on Page 1 header/title and operative recitals.
        Distinguishes primary conveyance deeds, mother deeds, encumbrance certificates,
        revenue records, and estate devolution instruments.
        """
        p1_text = pages[0].get("raw_text", "") if pages else ""
        header_text = (file_name + "\n" + p1_text[:1200]).lower()

        # Priority 1: Page 1 Title Heading Matches
        if re.search(r"\b(?:specimen\s+)?sale\s+deed\b|\bdeed\s+of\s+(?:absolute\s+)?sale\b|\bconveyance\s+deed\b|\babsolute\s+sale\b", header_text):
            if any(k in file_name.lower() for k in ["mother", "parent", "link", "prior"]):
                return "Mother Deed"
            return "Sale Deed"
        if re.search(r"\bgift\s+deed\b|\bdeed\s+of\s+gift\b", header_text):
            return "Gift Deed"
        if re.search(r"\bpartition\s+deed\b|\bdeed\s+of\s+partition\b", header_text):
            return "Partition Deed"
        if re.search(r"\brelease\s+deed\b|\bdeed\s+of\s+release\b|\brelinquishment\s+deed\b", header_text):
            return "Release Deed"
        if re.search(r"\bsettlement\s+deed\b|\bdeed\s+of\s+settlement\b", header_text):
            return "Settlement Deed"
        if re.search(r"\bgeneral\s+power\s+of\s+attorney\b|\bspecial\s+power\s+of\s+attorney\b|\bgpa\b", header_text):
            return "Power of Attorney"
        if re.search(r"\bform\s*(?:no\.?)?\s*15\b|\bform\s*(?:no\.?)?\s*16\b|\bstatement\s+of\s+encumbrance\b|\bencumbrance\s+certificate\b", header_text):
            return "Encumbrance Certificate"
        if re.search(r"\bkhata\s+certificate\b|\bkhata\s+extract\b|\be[- ]khata\b|\bpatta\b|\bchitta\b|\badangal\b|\brtc\s+extract\b", header_text):
            return "Khata Certificate"
        if re.search(r"\btax\s+paid\s+receipt\b|\bproperty\s+tax\s+receipt\b|\btax\s+receipt\b", header_text):
            return "Tax Receipt"
        if re.search(r"\bsanction\s+plan\b|\bapproved\s+plan\b|\bbuilding\s+plan\b|\blayout\s+plan\b", header_text):
            return "Sanction Plan"
        if re.search(r"\bmother\s+deed\b|\bparent\s+deed\b|\blink\s+deed\b", header_text):
            return "Mother Deed"

        # Priority 2: Full Document Corpus Indicators
        full_text = "\n".join(p.get("raw_text", "") for p in pages).lower()
        if "form no. 15" in full_text or "form 15" in full_text or "encumbrance certificate on property" in full_text:
            return "Encumbrance Certificate"
        if "form no. 16" in full_text or "nil encumbrance certificate" in full_text:
            return "Encumbrance Certificate"
        if "khata certificate" in full_text or "khata extract" in full_text:
            return "Khata Certificate"
        if "deed of absolute sale" in full_text or "sale deed" in full_text:
            return "Sale Deed"

        return "Sale Deed / Title Deed"

    @staticmethod
    def extract_document_entities(doc_id: str, file_name: str, doc_type: str, pages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Deep entity extraction from an authentic legal instrument:
        - Dates (execution, registration, year)
        - Registration particulars (Document Number, Book, SRO)
        - Operative Parties (Executant/Vendor vs Claimant/Purchaser)
        - Property Schedule (Survey No, Door No, Khata No, Extent, 4-Direction Boundaries)
        - Referenced Antecedent Instruments in recitals
        """
        full_text = "\n".join(f"[Page {p['page_number']}]\n{p.get('raw_text', '')}" for p in pages)

        inferred_type = LegalDocumentAnalyzer.classify_document(file_name, pages)
        final_doc_type = doc_type if doc_type and doc_type != "Sale Deed / Title Deed" else inferred_type

        # 1. Multi-Format Date Parsing
        doc_date = None
        doc_year = None
        # Written date formats (e.g., 15th day of November 2018 or 15 June 2018 or 15th June, 2018)
        m_date = re.search(r"\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4})\b", full_text, re.IGNORECASE)
        if m_date:
            doc_date = m_date.group(1).strip()
        else:
            # Numeric date formats (e.g., 15/06/2018, 15-06-2018, 15.06.2018)
            m_num_date = re.search(r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b", full_text)
            if m_num_date:
                doc_date = m_num_date.group(1).strip()

        if doc_date:
            ym = re.search(r"\b(19\d\d|20\d\d)\b", doc_date)
            if ym:
                doc_year = int(ym.group(1))
        elif "19" in file_name or "20" in file_name:
            ym = re.search(r"\b(19\d\d|20\d\d)\b", file_name)
            if ym:
                doc_year = int(ym.group(1))

        # 2. Registration Number & SRO
        reg_num = None
        m_reg = re.search(r"\b(?:Document|Doc\.?|Registration|Reg\.?)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Za-z0-9\-\/]{3,28})", full_text, re.IGNORECASE)
        if m_reg:
            reg_num = m_reg.group(1).strip()

        sro = None
        sro_m = re.search(r"Sub[- ]Registrar(?:\s+Office)?(?:\s+of\s+)?(?:,\s*)?([A-Za-z\s]+?)(?:\.|\n|;|,|$)", full_text, re.IGNORECASE)
        if sro_m:
            sro_val = sro_m.group(1).strip().lstrip(",").strip()
            if len(sro_val) < 50 and sro_val.lower() not in ["", "office"]:
                sro = sro_val

        # 3. Comprehensive Schedule Boundaries across all pages
        boundaries = {}
        for p in pages:
            p_text = p.get("raw_text", "")
            for d in ["North", "South", "East", "West"]:
                if d not in boundaries:
                    pat = rf"(?<!\bto\s)(?<!\bfrom\s)(?:\b(?:Bounded\s+on\s+the\s+)?{d}|{d}ern\s+Boundary)(?![\s\n]+to\s+(?:North|South|East|West))[:\s\n]*(?:by\s*[:\-]?\s*|[:\-]\s*)?([^\n\r;]+?)(?=,\s*(?:North|South|East|West)|\n\s*(?:North|South|East|West|Measuring|Extent|6\.)|\n\n|$)"
                    m_b = re.search(pat, p_text, re.IGNORECASE)
                    if m_b:
                        val = m_b.group(1).strip()
                        val = re.sub(r'^(?:by\s*[:\-]?\s*|[:\-]\s*)', '', val).strip()
                        if len(val) > 1 and not re.match(r"^(?:side|direction|boundary)$", val, re.IGNORECASE):
                            boundaries[d] = {
                                "value": val,
                                "page_number": p["page_number"],
                                "snippet": m_b.group(0).strip(),
                            }

        # 4. Referenced Prior Instruments (Devolution Recitals)
        referenced_deeds = []
        seen_refs = set()
        for p in pages:
            p_text = p.get("raw_text", "")
            matches = list(re.finditer(r"\b(?:Doc\.?\s*No\.?|Document\s*No\.?|Reg\.?\s*No\.?)\s*[:\-]?\s*([A-Za-z0-9\-\/]{3,28})", p_text, re.IGNORECASE))
            for m in matches:
                doc_n = m.group(1).strip()
                if doc_n in seen_refs:
                    continue

                start = max(0, m.start() - 150)
                end = min(len(p_text), m.end() + 150)
                window = p_text[start:end]
                keywords = ["acquired", "purchased", "inherited", "devolution", "prior", "parent", "mother", "predecessor", "vendor", "seller", "registered on", "executed", "held under"]
                if any(kw in window.lower() for kw in keywords):
                    date_m = re.search(r"\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b", window, re.IGNORECASE)
                    ref_date = date_m.group(1) if date_m else None
                    ref_yr = None
                    if ref_date:
                        ym = re.search(r"\b(19\d\d|20\d\d)\b", ref_date)
                        if ym:
                            ref_yr = int(ym.group(1))
                    elif "/" in doc_n:
                        ym = re.search(r"\b(19\d\d|20\d\d)\b", doc_n)
                        if ym:
                            ref_yr = int(ym.group(1))

                    sro_ref_m = re.search(r"Sub[- ]Registrar(?:\s+Office)?(?:\s+of\s+)?(?:,\s*)?([A-Za-z\s]+?)(?:\.|\n|;|,|$)", window, re.IGNORECASE)
                    ref_sro = sro_ref_m.group(1).strip().lstrip(",").strip() if sro_ref_m else None

                    before_txt = p_text[:m.start()]
                    after_txt = p_text[m.end():]
                    m_before = list(re.finditer(r"(?:^|\n|[.!?]\s+)([A-Z])", before_txt))
                    start_idx = m_before[-1].start(1) if m_before else 0
                    m_after = re.search(r"(?<!\bDoc)(?<!\bNo)(?<!\bMr)(?<!\bMs)(?<!\bDr)\.\s+(?=[A-Z0-9])|\.\s*$|\n\s*\n", after_txt)
                    end_idx = (m.end() + m_after.start() + 1) if m_after else min(len(p_text), m.end() + 150)
                    snip = " ".join(p_text[start_idx:end_idx].split())

                    seen_refs.add(doc_n)
                    referenced_deeds.append({
                        "doc_number": doc_n,
                        "doc_date": ref_date,
                        "year": ref_yr,
                        "sro": ref_sro,
                        "evidence": snip,
                        "evidence_snippet": snip,
                        "page_number": p["page_number"],
                    })

        # 5. Operative Parties
        seller_m = re.search(r"(?:Seller|Vendor|Executant|Transferor|Donor|Settlor)\s*(?:is\s+)?(?:Mr\.?|Mrs\.?|Ms\.?|Shri\s+)?([A-Za-z\s]{3,35}?)(?:,|\s+son\s+of|\s+daughter\s+of|\s+wife\s+of|\s+aged|\s+residing|\n)", full_text, re.IGNORECASE)
        purchaser_m = re.search(r"(?:Purchaser|Buyer|Claimant|Transferee|Donee|Settlee)\s*(?:is\s+)?(?:Mr\.?|Mrs\.?|Ms\.?|Shri\s+)?([A-Za-z\s]{3,35}?)(?:,|\s+son\s+of|\s+daughter\s+of|\s+wife\s+of|\s+aged|\s+residing|\n)", full_text, re.IGNORECASE)

        # 6. Property Identifiers
        sy_m = re.search(r"(?:Survey|Sy\.?|Plot|Site)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([0-9\/\-]+)", full_text, re.IGNORECASE)
        khata_m = re.search(r"(?:Khata|Assessment|PID)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Za-z0-9\/\-]+)", full_text, re.IGNORECASE)
        extent_m = re.search(r"(\d+(?:,\d+)*(?:\.\d+)?\s*(?:square\s+feet|sq\.?\s*ft\.?|sq\.?\s*yards|acres|guntas|sq\.?\s*meters))", full_text, re.IGNORECASE)

        return {
            "id": doc_id,
            "doc_id": doc_id,
            "file_name": file_name,
            "doc_type": final_doc_type,
            "doc_date": doc_date,
            "doc_year": doc_year,
            "registration_number": reg_num,
            "sub_registrar_office": sro,
            "seller_name": seller_m.group(1).strip() if seller_m else None,
            "purchaser_name": purchaser_m.group(1).strip() if purchaser_m else None,
            "survey_number": sy_m.group(1) if sy_m else None,
            "khata_number": khata_m.group(1) if khata_m else None,
            "extent": extent_m.group(1) if extent_m else None,
            "boundaries": boundaries,
            "referenced_deeds": referenced_deeds,
            "pages": pages,
        }

    @staticmethod
    def identify_primary_conveyance(documents_analyzed: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Identifies the primary operative title deed conveying property to the current owner/borrower.
        Selects the most recent sale/gift/partition/settlement deed not labeled as mother deed.
        """
        conveyance_types = {"Sale Deed", "Gift Deed", "Partition Deed", "Release Deed", "Settlement Deed"}
        candidates = []
        for d in documents_analyzed:
            t = d.get("doc_type", "")
            fname = d.get("file_name", "").lower()
            if any(t.startswith(ct) for ct in conveyance_types):
                if not any(k in fname for k in ["mother", "parent", "link", "prior"]):
                    candidates.append(d)

        if candidates:
            # Sort by doc_year descending (most recent first)
            candidates.sort(key=lambda x: x.get("doc_year") or 0, reverse=True)
            return candidates[0]

        # Fallback to any conveyance deed
        for d in documents_analyzed:
            if any(d.get("doc_type", "").startswith(ct) for ct in conveyance_types):
                return d

        return documents_analyzed[0] if documents_analyzed else None

    @staticmethod
    def verify_all_boundaries(
        case_data: Dict[str, Any],
        primary_doc: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Rigorous 4-Boundary Verification (North, South, East, West).
        Compares schedule boundaries against authentic deed recitals across pages.
        Returns:
        - Detailed warning findings for any directional variance with exact page citations.
        - Consolidated info finding for matching boundaries.
        """
        findings = []
        deed_boundaries = primary_doc.get("boundaries", {})
        directions = ["North", "South", "East", "West"]
        source_id = primary_doc.get("id") or primary_doc.get("doc_id")
        source_name = primary_doc.get("file_name", "Primary Deed")

        matches = []
        variances = []

        for d in directions:
            user_val = (
                case_data.get(f"boundary_{d.lower()}") or
                case_data.get(d.lower()) or
                ""
            ).strip()
            deed_info = deed_boundaries.get(d)

            if not deed_info or not user_val:
                continue

            deed_val = deed_info["value"]
            page_num = deed_info["page_number"]
            snippet = deed_info["snippet"]

            norm_user = re.sub(r'[^a-zA-Z0-9]', '', user_val.lower())
            norm_deed = re.sub(r'[^a-zA-Z0-9]', '', deed_val.lower())

            if norm_user in norm_deed or norm_deed in norm_user:
                matches.append((d, user_val, deed_val, page_num, snippet))
            else:
                variances.append((d, user_val, deed_val, page_num, snippet))

        if variances:
            for d, u_val, d_val, p_num, snip in variances:
                findings.append({
                    "title": f"Schedule Boundary Verification — {d}ern Boundary Variance",
                    "category": "Boundary Mismatch",
                    "severity": "warning",
                    "description": f"Schedule specifies {d}ern boundary as '{u_val}', but deed recital on Page {p_num} records: '{d_val}'. Advocate verification against approved layout sanction plan or site map recommended.",
                    "source_doc_id": source_id,
                    "source_doc_name": source_name,
                    "page_number": p_num,
                    "evidence_snippet": snip,
                    "ai_confidence": 0.94,
                    "suggested_query_text": f"Borrower / Vendor to furnish Approved Layout Sanction Plan or Site Map establishing {d}ern boundary demarcation.",
                    "lawyer_decision": "pending",
                    "lawyer_notes": "",
                    "is_ai_generated": True,
                })
            if matches:
                matching_dirs = ", ".join(m[0] for m in matches)
                findings.append({
                    "title": f"Schedule Boundary Verification & Recital Match ({matching_dirs})",
                    "category": "Boundary Mismatch",
                    "severity": "info",
                    "description": f"Schedule boundaries ({matching_dirs}) conform with registered deed recitals on Page {matches[0][3]}.",
                    "source_doc_id": source_id,
                    "source_doc_name": source_name,
                    "page_number": matches[0][3],
                    "evidence_snippet": " | ".join(m[4] for m in matches),
                    "ai_confidence": 0.98,
                    "suggested_query_text": None,
                    "lawyer_decision": "pending",
                    "lawyer_notes": "",
                    "is_ai_generated": True,
                })
        elif matches:
            all_dirs = ", ".join(m[0] for m in matches)
            summary_desc = "; ".join(f"{m[0]}: '{m[1]}'" for m in matches)
            p_num = matches[0][3]
            snip = " | ".join(m[4] for m in matches)
            findings.append({
                "title": "Schedule Boundary Verification & Recital Match",
                "category": "Boundary Mismatch",
                "severity": "info",
                "description": f"Schedule boundaries ({all_dirs}) conform with registered deed recitals on Page {p_num}: {summary_desc}.",
                "source_doc_id": source_id,
                "source_doc_name": source_name,
                "page_number": p_num,
                "evidence_snippet": snip,
                "ai_confidence": 0.98,
                "suggested_query_text": None,
                "lawyer_decision": "pending",
                "lawyer_notes": "",
                "is_ai_generated": True,
            })
        elif any(case_data.get(f"boundary_{d.lower()}") for d in directions):
            # Intake specified boundaries but deed text has no explicit table
            findings.append({
                "title": "Schedule Boundary Verification — Recital Not Explicit in Ingested Deed",
                "category": "Boundary Mismatch",
                "severity": "info",
                "description": "Schedule boundaries specified during intake. Ingested deed does not contain an explicit boundary schedule table. Verification of layout sanction plan advised.",
                "source_doc_id": source_id,
                "source_doc_name": source_name,
                "page_number": 1,
                "evidence_snippet": f"Intake schedule boundaries specified: East: {case_data.get('boundary_east', '')}, North: {case_data.get('boundary_north', '')}.",
                "ai_confidence": 0.90,
                "suggested_query_text": "Borrower to furnish Approved Layout Sanction Plan from Planning Authority establishing boundary demarcation.",
                "lawyer_decision": "pending",
                "lawyer_notes": "",
                "is_ai_generated": True,
            })

        return findings


legal_document_analyzer = LegalDocumentAnalyzer()
