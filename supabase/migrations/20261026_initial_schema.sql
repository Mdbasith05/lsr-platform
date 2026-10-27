-- ==============================================================================
-- Lawyer Copilot — Complete Supabase PostgreSQL Database Schema
-- Migration: 20261026_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ADVOCATE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    bar_enrollment_number TEXT NOT NULL,
    chamber_name TEXT NOT NULL,
    chamber_address TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'Senior Empaneled Advocate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. CASES TABLE
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT NOT NULL UNIQUE,
    lawyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    borrower_name TEXT NOT NULL,
    co_borrower_name TEXT,
    bank_name TEXT NOT NULL,
    branch TEXT NOT NULL,
    loan_amount TEXT NOT NULL,
    loan_type TEXT NOT NULL DEFAULT 'Housing Loan / Mortgage Scrutiny',
    status TEXT NOT NULL DEFAULT 'Intake' CHECK (status IN ('Intake', 'Document Processing', 'Scrutiny Review', 'Queries Raised', 'Completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    property_type TEXT NOT NULL,
    property_address TEXT NOT NULL,
    survey_number TEXT NOT NULL,
    khata_number TEXT,
    boundary_north TEXT,
    boundary_south TEXT,
    boundary_east TEXT,
    boundary_west TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    doc_date TEXT,
    registration_number TEXT,
    sub_registrar_office TEXT,
    page_count INT NOT NULL DEFAULT 0,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    processing_status TEXT NOT NULL DEFAULT 'Uploaded' CHECK (processing_status IN ('Uploaded', 'Extracting Text', 'Classified', 'Review Ready', 'Failed')),
    confidence_score FLOAT DEFAULT 1.0,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. DOCUMENT PAGES TABLE (Page-Indexed OCR Text)
CREATE TABLE IF NOT EXISTS public.document_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    raw_text TEXT NOT NULL,
    ocr_applied BOOLEAN NOT NULL DEFAULT false,
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT unique_doc_page UNIQUE (document_id, page_number)
);

-- 6. SCRUTINY FINDINGS TABLE
CREATE TABLE IF NOT EXISTS public.scrutiny_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    source_doc_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    source_doc_name TEXT,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Chain of Title Break',
        'Missing Mandatory Document',
        'Boundary Mismatch',
        'Name Variation / Identity',
        'Encumbrance / Charge',
        'Tax / Revenue Default',
        'Stamp Duty & Registration'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    description TEXT NOT NULL,
    page_number INT DEFAULT 1,
    evidence_snippet TEXT,
    ai_confidence FLOAT DEFAULT 0.9,
    lawyer_decision TEXT NOT NULL DEFAULT 'pending' CHECK (lawyer_decision IN ('pending', 'accepted', 'dismissed', 'modified')),
    lawyer_notes TEXT DEFAULT '',
    suggested_query_text TEXT,
    is_ai_generated BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    reviewed_at TIMESTAMPTZ
);

-- 7. CASE QUERIES (BANK REQUISITIONS) TABLE
CREATE TABLE IF NOT EXISTS public.case_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    linked_finding_id UUID REFERENCES public.scrutiny_findings(id) ON DELETE SET NULL,
    query_code TEXT NOT NULL,
    title TEXT NOT NULL,
    draft_text TEXT NOT NULL,
    lawyer_approved_text TEXT,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Approved', 'Sent to Bank', 'Resolved', 'Waived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. LSR REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.lsr_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL UNIQUE REFERENCES public.cases(id) ON DELETE CASCADE,
    report_ref_number TEXT NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    opinion_outcome TEXT NOT NULL DEFAULT 'Clear with Pre-Disbursement Conditions' CHECK (opinion_outcome IN (
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

-- Allow advocates to manage their own profile
CREATE POLICY "Users can view and manage their own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id);

-- Allow advocates to manage their own cases
CREATE POLICY "Lawyers can view and manage their own cases"
    ON public.cases FOR ALL
    USING (auth.uid() = lawyer_id OR lawyer_id IS NULL);

-- Cascade access to properties, documents, findings, queries, and reports based on case access
CREATE POLICY "Lawyers can manage properties for their cases"
    ON public.properties FOR ALL
    USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = properties.case_id AND (cases.lawyer_id = auth.uid() OR cases.lawyer_id IS NULL)));

CREATE POLICY "Lawyers can manage documents for their cases"
    ON public.documents FOR ALL
    USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = documents.case_id AND (cases.lawyer_id = auth.uid() OR cases.lawyer_id IS NULL)));

CREATE POLICY "Lawyers can view document pages for their cases"
    ON public.document_pages FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.documents
        JOIN public.cases ON cases.id = documents.case_id
        WHERE documents.id = document_pages.document_id AND (cases.lawyer_id = auth.uid() OR cases.lawyer_id IS NULL)
    ));

CREATE POLICY "Lawyers can manage findings for their cases"
    ON public.scrutiny_findings FOR ALL
    USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = scrutiny_findings.case_id AND (cases.lawyer_id = auth.uid() OR cases.lawyer_id IS NULL)));

CREATE POLICY "Lawyers can manage queries for their cases"
    ON public.case_queries FOR ALL
    USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_queries.case_id AND (cases.lawyer_id = auth.uid() OR cases.lawyer_id IS NULL)));

CREATE POLICY "Lawyers can manage reports for their cases"
    ON public.lsr_reports FOR ALL
    USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = lsr_reports.case_id AND (cases.lawyer_id = auth.uid() OR cases.lawyer_id IS NULL)));

-- STORAGE BUCKET CONFIGURATION FOR DEEDS
INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-documents', 'legal-documents', false)
ON CONFLICT (id) DO NOTHING;
