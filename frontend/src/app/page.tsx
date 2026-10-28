"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconScale,
  IconShield,
  IconBriefcase,
  IconArrowRight,
  IconCheckCircle,
  IconFileText,
  IconLock,
  IconUploadCloud,
} from "@/components/icons";
import { useAuth } from "@/context/auth-context";

export default function RootHomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // If already authenticated, redirect straight to the advocate dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // If session is being restored/verified, show smooth transition loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center font-sans text-[#10233F]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#10233F]/20 border-t-[#356AE6] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-700 tracking-wide">
            Loading Lawyer Copilot...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col font-sans text-[#10233F]">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10233F] to-[#1c3862] flex items-center justify-center text-white shadow-md shadow-slate-900/15">
            <IconScale className="w-6 h-6 text-[#356AE6]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-[#10233F]">
              Lawyer Copilot
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              AI-Powered Property Document Scrutiny &amp; Legal Scrutiny Report Platform
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Chamber Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#10233F] hover:bg-slate-100 transition-colors hidden sm:inline-block"
          >
            Register Chamber
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Open Workspace</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero & Value Propositions */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-12 space-y-12">
        {/* Statutory Compliance Banner */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-950 flex items-start gap-3 shadow-xs">
          <IconShield className="w-5 h-5 text-[#356AE6] flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold text-[#10233F]">
              Statutory Advocate Opinion Standards &bull; Human-in-the-Loop Architecture:
            </strong>
            <p className="text-blue-900/80 leading-relaxed text-[11px]">
              Lawyer Copilot assists advocates in cross-document discrepancy scrutiny, boundary clause verification, and bank requisition formulation. AI provides draft recommendations and grounded page citations; final professional judgment and certificate sign-off always remain exclusively with the Advocate under the Advocates Act, 1961.
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-blue-100/70 text-[#356AE6] border border-blue-200 shadow-2xs">
            Bank Empaneled Title Scrutiny Portal &bull; Indian Jurisdictions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#10233F] leading-tight">
            AI-Assisted Property Document Scrutiny for Bank Mortgage Title Loans
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Accelerate 30-year chain of title verification, cross-reference boundary schedules across successive deeds, formulate formal bank requisitions, and generate court-ready Legal Scrutiny Reports with verified evidence citations.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-[#10233F] hover:bg-[#152e52] text-white text-xs font-bold shadow-md shadow-slate-900/20 transition-all flex items-center gap-2"
            >
              <IconBriefcase className="w-4 h-4 text-[#356AE6]" />
              <span>Chamber Sign In</span>
            </Link>
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold shadow-xs transition-all flex items-center gap-2"
            >
              <IconScale className="w-4 h-4 text-[#356AE6]" />
              <span>Register New Chamber</span>
            </Link>
          </div>
        </div>

        {/* Core Capabilities Grid */}
        <div className="space-y-5">
          <div className="text-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              End-to-End Mortgage Scrutiny Lifecycle
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5 hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#356AE6] flex items-center justify-center font-extrabold text-xs">
                1
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Intake &amp; Upload</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Register property schedule details and ingest multi-page title deeds, prior link mother deeds, and Encumbrance Certificates.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5 hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#356AE6] flex items-center justify-center font-extrabold text-xs">
                2
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Extraction &amp; Indexing</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                PyMuPDF &amp; Gemini parse deed pages, extract schedule boundaries, and index recitals with exact page citations.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5 hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-xs">
                3
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Discrepancy Scrutiny</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                AI cross-checks 30-year continuity and boundary conflicts against Indian property laws, flagging title breaks with verbatim excerpts.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5 hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16805D] flex items-center justify-center font-extrabold text-xs">
                4
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Queries &amp; Sealed LSR</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Formulate official requisitions for the bank manager and compile, sign, and export a watermarked Legal Scrutiny Report.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Confidentiality Features */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-sm font-bold text-[#10233F]">
              Enterprise-Grade Confidentiality &amp; Bank Standards
            </h3>
            <p className="text-xs text-slate-500">
              Designed to satisfy the highest privacy requirements of empaneled bank advocates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconCheckCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#10233F]">Strict Advocate Isolation</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  PostgreSQL Row-Level Security (RLS) ensures client property records are accessible exclusively by your empaneled chamber.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#356AE6] flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconLock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#10233F]">Immutable Report Signing</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Digitally signed legal opinions are locked against tampering, with explicit verification audit trails for any subsequent amendments.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconFileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#10233F]">Bank Format Compliance</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Standardized schedules formatted for SBI, HDFC Bank, ICICI Bank, Axis Bank, and leading nationalized financial institutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500 space-y-2">
        <p>Lawyer Copilot &mdash; AI-Powered Legal Productivity Platform for Advocates Across India</p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <Link href="/login" className="hover:text-slate-600 transition-colors">
            Chamber Login
          </Link>
          <span>&bull;</span>
          <Link href="/register" className="hover:text-slate-600 transition-colors">
            Register
          </Link>
          <span>&bull;</span>
          <Link href="/diagnostics" className="hover:text-slate-600 transition-colors">
            System Diagnostics
          </Link>
        </div>
      </footer>
    </div>
  );
}
