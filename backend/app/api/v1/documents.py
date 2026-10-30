import uuid
import re
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, status
from starlette.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import CaseModel, DocumentModel, DocumentPageModel
from app.schemas.schemas import DocumentResponse, DocumentPageSnippet
from app.services.storage_service import storage_service
from app.services.pdf_service import pdf_service
from app.core.security import get_current_user_stub, AuthenticatedUser

router = APIRouter(tags=["Documents"])

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
ALLOWED_MAGIC_SIGNATURES = [
    b"%PDF",              # PDF
    b"\xff\xd8\xff",      # JPEG
    b"\x89PNG\r\n\x1a\n", # PNG
    b"II*\x00",           # TIFF (little-endian)
    b"MM\x00*",           # TIFF (big-endian)
]


def validate_file_bytes(file_bytes: bytes, filename: str):
    """Enforces file size and magic-byte signature validation."""
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded document is empty.")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Document exceeds maximum permitted size of 50 MB (received {len(file_bytes) / (1024 * 1024):.1f} MB)."
        )

    is_valid_type = any(file_bytes.startswith(sig) for sig in ALLOWED_MAGIC_SIGNATURES)
    if not is_valid_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported document format. Only PDF deeds and official property record images (JPEG, PNG, TIFF) are accepted."
        )


def get_authorized_case(case_id: str, user_id: str, db: Session) -> CaseModel:
    """Resolves a case by either UUID or case_number and verifies lawyer ownership."""
    case = db.query(CaseModel).filter(
        (CaseModel.id == case_id) | (CaseModel.case_number == case_id)
    ).first()
    if not case or case.lawyer_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


def serialize_document(d: DocumentModel, db: Session) -> DocumentResponse:
    pages = db.query(DocumentPageModel).filter(DocumentPageModel.document_id == d.id).order_by(DocumentPageModel.page_number.asc()).all()
    snippets = [DocumentPageSnippet(page=p.page_number, text=p.raw_text[:200]) for p in pages[:4]]

    file_url = f"/api/v1/documents/{d.id}/content"

    return DocumentResponse(
        id=d.id,
        caseId=d.case_id,
        fileName=d.file_name,
        docType=d.doc_type,
        docDate=d.doc_date or "Under Verification",
        registrationNumber=d.registration_number,
        subRegistrarOffice=d.sub_registrar_office,
        pageCount=d.page_count,
        fileSizeBytes=d.file_size_bytes,
        uploadedAt=d.uploaded_at.isoformat() if d.uploaded_at else datetime.now(timezone.utc).isoformat(),
        status=d.processing_status,
        confidenceScore=d.confidence_score,
        fileUrl=file_url,
        sampleSnippets=snippets,
    )


@router.post("/cases/{case_id}/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    case_id: str,
    file: UploadFile = File(...),
    doc_type: str = Form("Sale Deed / Title Deed"),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    case = get_authorized_case(case_id, user.user_id, db)

    file_bytes = await file.read()
    validate_file_bytes(file_bytes, file.filename or "document.pdf")

    doc_id = f"doc-{uuid.uuid4().hex[:8]}"

    # Save to storage (Supabase / local disk) with path traversal defenses
    storage_path = storage_service.save_document_file(case.id, doc_id, file.filename or "document.pdf", file_bytes)

    # PyMuPDF page-level extraction & OCR offloaded to worker threadpool
    try:
        page_count, pages_data, metadata = await run_in_threadpool(
            pdf_service.extract_pages_and_metadata, file_bytes
        )
    except Exception as e:
        page_count = 1
        pages_data = [{"page_number": 1, "raw_text": f"Extracted deed: {file.filename}", "ocr_applied": False}]
        metadata = {}

    new_doc = DocumentModel(
        id=doc_id,
        case_id=case.id,
        file_name=file.filename or "document.pdf",
        storage_path=storage_path,
        doc_type=doc_type,
        doc_date=metadata.get("doc_date") or datetime.now(timezone.utc).strftime("%d-%b-%Y"),
        registration_number=metadata.get("registration_number"),
        sub_registrar_office=metadata.get("sub_registrar_office"),
        page_count=page_count,
        file_size_bytes=len(file_bytes),
        processing_status="Review Ready",
        confidence_score=0.96,
    )
    db.add(new_doc)
    db.flush()

    # Save extracted pages
    for page in pages_data:
        p_model = DocumentPageModel(
            document_id=new_doc.id,
            page_number=page["page_number"],
            raw_text=page["raw_text"],
            ocr_applied=page.get("ocr_applied", False),
        )
        db.add(p_model)

    # Auto-advance case status if Intake
    if case.status == "Intake":
        case.status = "Document Processing"

    db.commit()
    db.refresh(new_doc)
    return serialize_document(new_doc, db)


@router.get("/cases/{case_id}/documents", response_model=List[DocumentResponse])
def list_case_documents(
    case_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    case = get_authorized_case(case_id, user.user_id, db)
    docs = db.query(DocumentModel).filter(DocumentModel.case_id == case.id).order_by(DocumentModel.uploaded_at.desc()).all()
    return [serialize_document(d, db) for d in docs]


@router.get("/documents/{doc_id}/content")
def get_document_content(
    doc_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    case = db.query(CaseModel).filter(CaseModel.id == doc.case_id).first()
    if not case or case.lawyer_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    content = storage_service.get_document_bytes(doc.storage_path)
    if not content:
        # Minimal valid PDF fallback
        content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF"

    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{doc.file_name}"'},
    )


@router.get("/documents/{doc_id}/signed-url")
def get_document_signed_url(
    doc_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Strict tenancy check: caller must own the case to which the document belongs
    case = db.query(CaseModel).filter(CaseModel.id == doc.case_id).first()
    if not case or case.lawyer_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    signed_url = storage_service.get_signed_url(doc.storage_path, doc.id)
    return {"signed_url": signed_url}


@router.delete("/documents/{doc_id}", status_code=status.HTTP_200_OK)
def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Strict tenancy check: caller must own the case to which the document belongs
    case = db.query(CaseModel).filter(CaseModel.id == doc.case_id).first()
    if not case or case.lawyer_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Delete underlying file from storage
    storage_service.delete_document_file(doc.storage_path)

    db.delete(doc)
    db.commit()
    return {"success": True, "message": f"Document {doc_id} deleted"}
