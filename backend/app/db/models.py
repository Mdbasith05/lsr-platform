import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def utc_now():
    return datetime.now(timezone.utc)


class ProfileModel(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(255), nullable=False, default="Empaneled Advocate")
    email = Column(String(255), nullable=True)
    bar_enrollment_number = Column(String(100), nullable=False, default="Pending Verification")
    chamber_name = Column(String(255), nullable=False, default="Chamber of Advocates")
    chamber_address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    role = Column(String(100), nullable=False, default="Senior Empaneled Advocate")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    cases = relationship("CaseModel", back_populates="lawyer", cascade="all, delete-orphan")


class CaseModel(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = Column(String(100), nullable=False, unique=True)
    lawyer_id = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    borrower_name = Column(String(255), nullable=False)
    co_borrower_name = Column(String(255), nullable=True)
    bank_name = Column(String(255), nullable=False)
    branch = Column(String(255), nullable=False)
    loan_amount = Column(String(100), nullable=False)
    loan_type = Column(String(255), nullable=False, default="Housing Loan / Mortgage Scrutiny")
    status = Column(String(50), nullable=False, default="Intake")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    lawyer = relationship("ProfileModel", back_populates="cases")
    property = relationship("PropertyModel", back_populates="case", uselist=False, cascade="all, delete-orphan")
    documents = relationship("DocumentModel", back_populates="case", cascade="all, delete-orphan")
    findings = relationship("ScrutinyFindingModel", back_populates="case", cascade="all, delete-orphan")
    queries = relationship("CaseQueryModel", back_populates="case", cascade="all, delete-orphan")
    report = relationship("LSRReportModel", back_populates="case", uselist=False, cascade="all, delete-orphan")


class PropertyModel(Base):
    __tablename__ = "properties"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True)
    property_type = Column(String(255), nullable=False, default="Residential Plot")
    property_address = Column(Text, nullable=False)
    survey_number = Column(String(100), nullable=False)
    khata_number = Column(String(100), nullable=True)
    boundary_north = Column(Text, nullable=True)
    boundary_south = Column(Text, nullable=True)
    boundary_east = Column(Text, nullable=True)
    boundary_west = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    case = relationship("CaseModel", back_populates="property")


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    storage_path = Column(Text, nullable=False)
    doc_type = Column(String(255), nullable=False)
    doc_date = Column(String(50), nullable=True)
    registration_number = Column(String(100), nullable=True)
    sub_registrar_office = Column(String(255), nullable=True)
    page_count = Column(Integer, nullable=False, default=0)
    file_size_bytes = Column(BigInteger, nullable=False, default=0)
    processing_status = Column(String(50), nullable=False, default="Uploaded")
    confidence_score = Column(Float, nullable=False, default=1.0)
    uploaded_at = Column(DateTime(timezone=True), default=utc_now)

    case = relationship("CaseModel", back_populates="documents")
    pages = relationship("DocumentPageModel", back_populates="document", cascade="all, delete-orphan")
    findings = relationship("ScrutinyFindingModel", back_populates="source_doc")


class DocumentPageModel(Base):
    __tablename__ = "document_pages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    raw_text = Column(Text, nullable=False)
    ocr_applied = Column(Boolean, nullable=False, default=False)
    extracted_at = Column(DateTime(timezone=True), default=utc_now)

    document = relationship("DocumentModel", back_populates="pages")


class ScrutinyFindingModel(Base):
    __tablename__ = "scrutiny_findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    source_doc_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    source_doc_name = Column(String(255), nullable=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=False, default=1)
    evidence_snippet = Column(Text, nullable=True)
    ai_confidence = Column(Float, nullable=False, default=0.9)
    lawyer_decision = Column(String(50), nullable=False, default="pending")
    lawyer_notes = Column(Text, nullable=False, default="")
    suggested_query_text = Column(Text, nullable=True)
    is_ai_generated = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    case = relationship("CaseModel", back_populates="findings")
    source_doc = relationship("DocumentModel", back_populates="findings")
    queries = relationship("CaseQueryModel", back_populates="linked_finding")


class CaseQueryModel(Base):
    __tablename__ = "case_queries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    linked_finding_id = Column(String(36), ForeignKey("scrutiny_findings.id", ondelete="SET NULL"), nullable=True)
    query_code = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    draft_text = Column(Text, nullable=False)
    lawyer_approved_text = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Draft")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    case = relationship("CaseModel", back_populates="queries")
    linked_finding = relationship("ScrutinyFindingModel", back_populates="queries")


class LSRReportModel(Base):
    __tablename__ = "lsr_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True)
    report_ref_number = Column(String(100), nullable=False)
    report_date = Column(String(50), nullable=False)
    opinion_outcome = Column(String(100), nullable=False, default="Clear with Pre-Disbursement Conditions")
    chain_of_title_narrative = Column(Text, nullable=True)
    encumbrance_verification_notes = Column(Text, nullable=True)
    revenue_records_notes = Column(Text, nullable=True)
    pre_disbursement_conditions = Column(JSON, nullable=False, default=list)
    post_disbursement_conditions = Column(JSON, nullable=False, default=list)
    general_observations = Column(Text, nullable=True)
    is_signed = Column(Boolean, nullable=False, default=False)
    signed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    case = relationship("CaseModel", back_populates="report")
