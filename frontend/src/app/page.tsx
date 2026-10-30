"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconScale,
  IconShield,
  IconArrowRight,
  IconFileText,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center font-sans text-[#172B4D]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#E3E9F2] border-t-[#2457C5] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#172B4D] tracking-wide">
            Loading LSR Platform...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col font-sans text-[#172B4D]">
      {/* Top Navigation Header */}
      <header className="border-b border-[#E3E9F2] bg-white sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2457C5] flex items-center justify-center text-white shadow-xs">
            <IconScale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#172B4D]">
              LSR Platform
            </h1>
            <p className="text-[11px] text-[#66758A] font-medium">
              Legal Scrutiny Report &amp; Property Title Verification
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#172B4D] hover:bg-[#F7F9FC] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#172B4D] hover:bg-[#F7F9FC] transition-colors hidden sm:inline-block"
          >
            Register Chamber
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Open Workspace</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero & Platform Overview */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-12 space-y-12">
        {/* Compliance Assurance Banner */}
        <div className="rounded-2xl border border-blue-200 bg-[#EEF4FF] p-4 text-xs text-blue-950 flex items-start gap-3">
          <IconShield className="w-5 h-5 text-[#2457C5] flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold text-[#172B4D]">
              Statutory Advocate Opinion Standards &bull; Human-in-the-Loop Architecture:
            </strong>
            <p className="text-blue-900/80 leading-relaxed text-[11px]">
              LSR Platform assists empaneled advocates in 30-year chain-of-title verification, boundary scrutiny, and bank query formulation. AI provides draft discrepancy suggestions and verified page citations; final certification sign-off remains exclusively with the Advocate under the Advocates Act, 1961.
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E3E9F2] text-xs font-semibold text-[#2457C5] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#16805D]" />
            <span>Bank-Standard 30-Year Chain Scrutiny</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#172B4D] leading-tight">
            Precision Legal Scrutiny Reports for Empaneled Advocates
          </h2>

          <p className="text-sm text-[#66758A] leading-relaxed max-w-2xl mx-auto">
            Review registered sale deeds, identify parent link breaks, draft formal bank requisitions, and generate certified Draft &amp; Final Legal Scrutiny Reports in one unified legal-tech workspace.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2"
            >
              <span>Access Chamber Portal</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-white hover:bg-[#F7F9FC] border border-[#E3E9F2] text-[#172B4D] text-xs font-bold transition-all shadow-xs"
            >
              <span>New Chamber Registration</span>
            </Link>
          </div>
        </div>

        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E3E9F2] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#2457C5] flex items-center justify-center font-bold">
              <IconUploadCloud className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#172B4D]">Multi-Deed Ingestion</h3>
            <p className="text-xs text-[#66758A] leading-relaxed">
              Ingest multi-page registered sale deeds, mother link deeds, and Encumbrance Certificates with automated OCR text extraction.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E3E9F2] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B7791F] flex items-center justify-center font-bold">
              <IconScale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#172B4D]">AI Discrepancy Scrutiny</h3>
            <p className="text-xs text-[#66758A] leading-relaxed">
              Identify boundary variances, missing parent deeds, and encumbrance charges with page-referenced citations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E3E9F2] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16805D] flex items-center justify-center font-bold">
              <IconFileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#172B4D]">Certified LSR Generation</h3>
            <p className="text-xs text-[#66758A] leading-relaxed">
              Generate standardized bank-compliant Legal Scrutiny Reports with pre-disbursement conditions and digital advocate sign-off.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E3E9F2] bg-white py-6 px-6 text-center text-xs text-[#66758A]">
        <p>&copy; {new Date().getFullYear()} LSR Platform. Empaneled Property Title Verification &amp; Legal Scrutiny System.</p>
      </footer>
    </div>
  );
}
