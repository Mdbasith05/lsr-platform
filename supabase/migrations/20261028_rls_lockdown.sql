-- ==============================================================================
-- LSR Platform — Database Security & RLS Lockdown Migration
-- Migration: 20261028_rls_lockdown.sql
--
-- Objective:
-- 1. Revoke public, anonymous, and authenticated access to all sensitive application tables.
--    Direct PostgREST table access is completely disabled for client-facing roles.
-- 2. Drop overly permissive 'Service role full access on ...' policies that target 'public'.
-- 3. Re-create strict RLS policies targeting ONLY 'service_role' (trusted backend).
-- 4. Correct default privileges FOR ROLE postgres in schema public so future tables
--    created by postgres do not grant privileges to anon, authenticated, or public.
--
-- Safe Recovery & Resilience Plan:
-- If any operational or application issue occurs post-migration, execute the
-- Safe Recovery Plan documented in Section 5 below. The recovery plan restores
-- trusted backend access while strictly preserving the denial of anon/authenticated/public access.
-- Under no circumstances should unrestricted PUBLIC policies be restored.
-- ==============================================================================

-- 1. REVOKE TABLE PRIVILEGES FROM anon, authenticated, AND public ROLES
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.cases FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.properties FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.documents FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.document_pages FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.scrutiny_findings FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.case_queries FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.lsr_reports FROM anon, authenticated, public;

-- 2. CORRECT DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
-- Ensures tables created in the future by the postgres role grant privileges
-- ONLY to postgres and service_role, never to anon, authenticated, or public.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE ALL ON TABLES FROM anon, authenticated, public;

-- 3. DROP OVERLY PERMISSIVE POLICIES (which targeted 'public' with USING (true))
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access on cases" ON public.cases;
DROP POLICY IF EXISTS "Service role full access on properties" ON public.properties;
DROP POLICY IF EXISTS "Service role full access on documents" ON public.documents;
DROP POLICY IF EXISTS "Service role full access on document_pages" ON public.document_pages;
DROP POLICY IF EXISTS "Service role full access on scrutiny_findings" ON public.scrutiny_findings;
DROP POLICY IF EXISTS "Service role full access on case_queries" ON public.case_queries;
DROP POLICY IF EXISTS "Service role full access on lsr_reports" ON public.lsr_reports;

-- 4. CREATE STRICT LEAST-PRIVILEGE POLICIES FOR service_role ONLY (IDEMPOTENT)
DROP POLICY IF EXISTS "service_role_manage_profiles" ON public.profiles;
CREATE POLICY "service_role_manage_profiles" ON public.profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_manage_cases" ON public.cases;
CREATE POLICY "service_role_manage_cases" ON public.cases
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_manage_properties" ON public.properties;
CREATE POLICY "service_role_manage_properties" ON public.properties
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_manage_documents" ON public.documents;
CREATE POLICY "service_role_manage_documents" ON public.documents
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_manage_document_pages" ON public.document_pages;
CREATE POLICY "service_role_manage_document_pages" ON public.document_pages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_manage_scrutiny_findings" ON public.scrutiny_findings;
CREATE POLICY "service_role_manage_scrutiny_findings" ON public.scrutiny_findings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_manage_case_queries" ON public.case_queries;
CREATE POLICY "service_role_manage_case_queries" ON public.case_queries
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_manage_lsr_reports" ON public.lsr_reports;
CREATE POLICY "service_role_manage_lsr_reports" ON public.lsr_reports
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ensure RLS remains ENABLED on all 8 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrutiny_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lsr_reports ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 5. SAFE RECOVERY PLAN (Preserves lockdown; never restores unrestricted public/anon access)
--
-- If backend database access encounters unexpected issues post-migration:
-- Step A: Confirm connection role has required schema & table privileges:
--   GRANT ALL ON TABLE public.profiles, public.cases, public.properties,
--       public.documents, public.document_pages, public.scrutiny_findings,
--       public.case_queries, public.lsr_reports TO postgres, service_role;
--
-- Step B: Re-verify that service_role policies exist and are valid:
--   SELECT schemaname, tablename, policyname, roles, cmd
--   FROM pg_policies WHERE schemaname = 'public';
--
-- Step C: Confirm anon, authenticated, and public remain strictly revoked (must return 0 rows):
--   SELECT grantee, table_name, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'public');
-- ==============================================================================
