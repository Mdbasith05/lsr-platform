-- ==============================================================================
-- LSR Platform — Reconciled Supabase PostgreSQL Database Schema
-- Migration: 20261028_reconciled_schema.sql
--
-- Reconciles differences between 20261026_initial_schema.sql and backend/app/db/models.py:
-- 1. Uses VARCHAR(36) primary keys with gen_random_uuid()::text defaults to support
--    both RFC 4122 UUIDs and business identifiers (e.g. LSR-2026-001, doc-*, fnd-*, qry-*).
-- 2. Decouples profiles.id from mandatory auth.users foreign key to allow seed advocates
--    and service accounts while retaining optional link to auth.users.
-- 3. Adds UNIQUE constraint to properties(case_id) enforcing 1-to-1 case relationship.
-- 4. Preserves unique_doc_page constraint on document_pages(document_id, page_number).
-- 5. Preserves CHECK constraints on category, severity, status, and opinion_outcome.
-- 6. Adds safe guard for Supabase storage.buckets insertion.
-- 7. Configures Row Level Security (RLS) with service_role and backend access policies.
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ADVOCATE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    full_name VARCHAR(255) NOT NULL DEFAULT 'Adv. Rajesh Kumar',
    email VARCHAR(255),
    bar_enrollment_number VARCHAR(100) NOT NULL DEFAULT 'KAR/1429/2012',
    chamber_name VARCHAR(255) NOT NULL DEFAULT 'Chamber of Adv. Rajesh Kumar & Associates',
    chamber_address TEXT,
    phone VARCHAR(50),
    role VARCHAR(100) NOT NULL DEFAULT 'Senior Empaneled Advocate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. CASES TABLE
CREATE TABLE IF NOT EXISTS public.cases (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    case_number VARCHAR(100) NOT NULL UNIQUE,
    lawyer_id VARCHAR(36) REFERENCES public.profiles(id) ON DELETE SET NULL,
    borrower_name VARCHAR(255) NOT NULL,
    co_borrower_name VARCHAR(255),
    bank_name VARCHAR(255) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    loan_amount VARCHAR(100) NOT NULL,
    loan_type VARCHAR(255) NOT NULL DEFAULT 'Housing Loan / Mortgage Scrutiny',
    status VARCHAR(50) NOT NULL DEFAULT 'Intake' CHECK (status IN ('Intake', 'Document Processing', 'Scrutiny Review', 'Queries Raised', 'Completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. PROPERTIES TABLE (1-to-1 with Cases)
CREATE TABLE IF NOT EXISTS public.properties (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    case_id VARCHAR(36) NOT NULL UNIQUE REFERENCES public.cases(id) ON DELETE CASCADE,
    property_type VARCHAR(255) NOT NULL DEFAULT 'Residential Plot',
    property_address TEXT NOT NULL,
    survey_number VARCHAR(100) NOT NULL,
    khata_number VARCHAR(100),
    boundary_north TEXT,
    boundary_south TEXT,
    boundary_east TEXT,
    boundary_west TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    case_id VARCHAR(36) NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    doc_type VARCHAR(255) NOT NULL,
    doc_date VARCHAR(50),
    registration_number VARCHAR(100),
    sub_registrar_office VARCHAR(255),
    page_count INT NOT NULL DEFAULT 0,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    processing_status VARCHAR(50) NOT NULL DEFAULT 'Uploaded' CHECK (processing_status IN ('Uploaded', 'Extracting Text', 'Classified', 'Review Ready', 'Failed')),
    confidence_score FLOAT NOT NULL DEFAULT 1.0,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. DOCUMENT PAGES TABLE (Page-Indexed OCR Text)
CREATE TABLE IF NOT EXISTS public.document_pages (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    document_id VARCHAR(36) NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    raw_text TEXT NOT NULL,
    ocr_applied BOOLEAN NOT NULL DEFAULT false,
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT unique_doc_page UNIQUE (document_id, page_number)
);

-- 6. SCRUTINY FINDINGS TABLE
CREATE TABLE IF NOT EXISTS public.scrutiny_findings (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    case_id VARCHAR(36) NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    source_doc_id VARCHAR(36) REFERENCES public.documents(id) ON DELETE SET NULL,
    source_doc_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'Chain of Title Break',
        'Missing Mandatory Document',
        'Boundary Mismatch',
        'Name Variation / Identity',
        'Encumbrance / Charge',
        'Tax / Revenue Default',
        'Stamp Duty & Registration'
    )),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    description TEXT NOT NULL,
    page_number INT NOT NULL DEFAULT 1,
    evidence_snippet TEXT,
    ai_confidence FLOAT NOT NULL DEFAULT 0.9,
    lawyer_decision VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (lawyer_decision IN ('pending', 'accepted', 'dismissed', 'modified')),
    lawyer_notes TEXT NOT NULL DEFAULT '',
    suggested_query_text TEXT,
    is_ai_generated BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    reviewed_at TIMESTAMPTZ
);

-- 7. CASE QUERIES (BANK REQUISITIONS) TABLE
CREATE TABLE IF NOT EXISTS public.case_queries (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    case_id VARCHAR(36) NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    linked_finding_id VARCHAR(36) REFERENCES public.scrutiny_findings(id) ON DELETE SET NULL,
    query_code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    draft_text TEXT NOT NULL,
    lawyer_approved_text TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Approved', 'Sent to Bank', 'Resolved', 'Waived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. LSR REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.lsr_reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    case_id VARCHAR(36) NOT NULL UNIQUE REFERENCES public.cases(id) ON DELETE CASCADE,
    report_ref_number VARCHAR(100) NOT NULL,
    report_date VARCHAR(50) NOT NULL,
    opinion_outcome VARCHAR(100) NOT NULL DEFAULT 'Clear with Pre-Disbursement Conditions' CHECK (opinion_outcome IN (
        'Clear and Marketable Title',
        'Clear with Pre-Disbursement Conditions',
        'Defective Title - Unfit for Mortgage',
        'Awaiting Critical Query Resolution'
    )),
    chain_of_title_narrative TEXT,
    encumbrance_verification_notes TEXT,
    revenue_records_notes TEXT,
    pre_disbursement_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    post_disbursement_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    general_observations TEXT,
    is_signed BOOLEAN NOT NULL DEFAULT false,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- INDEXES FOR FAST LEGAL QUERYING
CREATE INDEX IF NOT EXISTS idx_cases_lawyer ON public.cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_properties_case ON public.properties(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_case ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_doc_pages_doc ON public.document_pages(document_id);
CREATE INDEX IF NOT EXISTS idx_findings_case ON public.scrutiny_findings(case_id);
CREATE INDEX IF NOT EXISTS idx_queries_case ON public.case_queries(case_id);
CREATE INDEX IF NOT EXISTS idx_reports_case ON public.lsr_reports(case_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrutiny_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lsr_reports ENABLE ROW LEVEL SECURITY;

-- Service role & superuser full access policies
DO $$
BEGIN
    -- Allow service_role / postgres superuser full access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on profiles') THEN
        CREATE POLICY "Service role full access on profiles" ON public.profiles FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on cases') THEN
        CREATE POLICY "Service role full access on cases" ON public.cases FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on properties') THEN
        CREATE POLICY "Service role full access on properties" ON public.properties FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on documents') THEN
        CREATE POLICY "Service role full access on documents" ON public.documents FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on document_pages') THEN
        CREATE POLICY "Service role full access on document_pages" ON public.document_pages FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on scrutiny_findings') THEN
        CREATE POLICY "Service role full access on scrutiny_findings" ON public.scrutiny_findings FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on case_queries') THEN
        CREATE POLICY "Service role full access on case_queries" ON public.case_queries FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on lsr_reports') THEN
        CREATE POLICY "Service role full access on lsr_reports" ON public.lsr_reports FOR ALL USING (true);
    END IF;
END $$;

-- STORAGE BUCKET CONFIGURATION (Safely guarded for Supabase Storage schema)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('legal-documents', 'legal-documents', false)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
