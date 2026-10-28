import io
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)


class ReportService:
    @staticmethod
    def generate_lsr_pdf_bytes(
        report_data: Dict[str, Any],
        case_data: Dict[str, Any],
        documents: List[Dict[str, Any]],
    ) -> bytes:
        """
        Generates an official, print-ready PDF binary of the Legal Scrutiny Report (LSR).
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#10233F"),
            alignment=1,
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#475569"),
            alignment=1,
        )
        h1_style = ParagraphStyle(
            "Heading1",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#10233F"),
            spaceBefore=12,
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#1E293B"),
        )
        bold_label = ParagraphStyle(
            "BoldLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#10233F"),
        )

        elements = []

        # 1. Chamber Letterhead
        elements.append(Paragraph("CHAMBER OF ADVOCATES & LEGAL CONSULTANTS", title_style))
        elements.append(Paragraph(
            f"<b>{report_data.get('advocateName', 'Empaneled Advocate')}</b><br/>"
            f"Bar Council Enrollment: {report_data.get('barEnrollmentNumber', 'Enrolled Advocate')}<br/>"
            f"{report_data.get('chamberAddress', 'High Court of Judicature')}",
            subtitle_style,
        ))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#10233F"), spaceBefore=4, spaceAfter=10))

        # 2. Report Header Box
        elements.append(Paragraph("LEGAL SCRUTINY REPORT (TITLE OPINION)", title_style))
        elements.append(Spacer(1, 8))

        meta_data = [
            [Paragraph("Report Ref:", bold_label), Paragraph(report_data.get("reportRefNumber", "LSR/2026/01"), body_style),
             Paragraph("Date:", bold_label), Paragraph(str(report_data.get("reportDate", "2026-10-26")), body_style)],
            [Paragraph("Borrower:", bold_label), Paragraph(f"{case_data.get('borrower_name')} {('& ' + case_data.get('co_borrower_name')) if case_data.get('co_borrower_name') else ''}", body_style),
             Paragraph("Bank:", bold_label), Paragraph(f"{case_data.get('bank_name')} - {case_data.get('branch')}", body_style)],
            [Paragraph("Loan Amount:", bold_label), Paragraph(case_data.get("loan_amount", ""), body_style),
             Paragraph("Opinion:", bold_label), Paragraph(f"<b>{report_data.get('opinionOutcome', 'Clear')}</b>", body_style)],
        ]
        meta_table = Table(meta_data, colWidths=[80, 180, 70, 190])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 12))

        # 3. Schedule of Property
        elements.append(Paragraph("1. SCHEDULE PROPERTY PARTICULARS", h1_style))
        prop_text = (
            f"<b>Address:</b> {case_data.get('property_address')}<br/>"
            f"<b>Survey / Site No:</b> {case_data.get('survey_number')} | <b>Khata:</b> {case_data.get('khata_number', 'N/A')}<br/>"
            f"<b>Boundaries:</b> North: {case_data.get('boundary_north')} | South: {case_data.get('boundary_south')} | "
            f"East: {case_data.get('boundary_east')} | West: {case_data.get('boundary_west')}"
        )
        elements.append(Paragraph(prop_text, body_style))
        elements.append(Spacer(1, 10))

        # 4. Ingested Documents List
        elements.append(Paragraph("2. DOCUMENTS INSPECTED & SCRUTINIZED", h1_style))
        doc_rows = [[Paragraph("Sl", bold_label), Paragraph("Document Title", bold_label), Paragraph("Type", bold_label), Paragraph("Date / Reg No", bold_label)]]
        for idx, d in enumerate(documents):
            doc_rows.append([
                Paragraph(str(idx + 1), body_style),
                Paragraph(d.get("file_name", ""), body_style),
                Paragraph(d.get("doc_type", ""), body_style),
                Paragraph(f"{d.get('doc_date', 'N/A')}<br/>{d.get('registration_number', '')}", body_style),
            ])
        doc_table = Table(doc_rows, colWidths=[25, 230, 135, 130])
        doc_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EDF2F7")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(doc_table)
        elements.append(Spacer(1, 10))

        # 5. Devolution of Title (30-Year Chain)
        elements.append(Paragraph("3. 30-YEAR CHAIN & DEVOLUTION OF TITLE", h1_style))
        chain_narrative = report_data.get("chainOfTitleNarrative") or "30-year title trace established from original parent link deeds."
        elements.append(Paragraph(chain_narrative, body_style))
        elements.append(Spacer(1, 10))

        # 6. Pre-Disbursement Conditions
        elements.append(Paragraph("4. PRE-DISBURSEMENT CONDITIONS (TO BE SATISFIED BY BANK)", h1_style))
        conditions = report_data.get("preDisbursementConditions") or []
        for idx, cond in enumerate(conditions):
            elements.append(Paragraph(f"• <b>Condition {idx + 1}:</b> {cond}", body_style))
            elements.append(Spacer(1, 3))
        elements.append(Spacer(1, 10))

        # 7. Final Legal Opinion & Signature Block
        elements.append(Paragraph("5. FINAL LEGAL OPINION", h1_style))
        opinion_text = (
            f"Subject to strict compliance with the Pre-Disbursement Conditions outlined hereinabove, I am of the professional opinion that "
            f"the title to the Schedule Property is <b>{report_data.get('opinionOutcome', 'Clear with Pre-Disbursement Conditions')}</b> "
            f"and is valid, marketable, and eligible for creation of an equitable mortgage in favor of {case_data.get('bank_name')}."
        )
        elements.append(Paragraph(opinion_text, body_style))
        elements.append(Spacer(1, 20))

        # Signature
        sign_status = "DIGITALLY SIGNED & CERTIFIED" if report_data.get("isSigned") else "DRAFT REPORT - AWAITING FINAL ADVOCATE SIGN-OFF"
        elements.append(Paragraph(f"<b>Status:</b> {sign_status}", bold_label))
        elements.append(Paragraph(f"<b>Empaneled Advocate:</b> {report_data.get('advocateName', 'Empaneled Advocate')}", body_style))
        elements.append(Paragraph(f"<b>Chamber:</b> {report_data.get('chamberAddress', 'High Court of Judicature')}", body_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()


report_service = ReportService()
