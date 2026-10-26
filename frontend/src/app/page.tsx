"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconScale,
  IconShield,
  IconBriefcase,
  IconArrowRight,
  IconCheckCircle,
} from "@/components/icons";

interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  timestamp: string;
}

export default function RootHomePage() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const checkBackendHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HealthResponse = await res.json();
      setHealthData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Backend unreachable";
      setHealthError(`${msg}. Ensure FastAPI server is running on http://localhost:8000`);
    } finally {
      setLoadingHealth(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col font-sans text-[#10233F]">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#10233F] flex items-center justify-center text-white shadow-md shadow-slate-900/10">
            <IconScale className="w-6 h-6 text-[#356AE6]" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#10233F]">
              Legal Scrutiny Report (LSR) Platform
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Property Document Verification &amp; Bank Title Scrutiny
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Chamber Login
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Open Dashboard</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-12 space-y-10">
        {/* Compliance Notice */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3">
          <IconShield className="w-5 h-5 text-[#356AE6] flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-semibold text-[#10233F]">
              Statutory Bank Scrutiny Standards • Advocate-in-the-Loop Architecture:
            </strong>
            <p className="text-blue-900/80 leading-relaxed text-[11px]">
              AI models perform text extraction, classification, and cross-document discrepancy indexing. All legal conclusions, query formulations, and final opinion certificates remain under the exclusive professional authority of the empaneled advocate.
            </p>
          </div>
        </div>

        {/* Hero Title & Primary Entry Points */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#356AE6] border border-blue-200">
            Empaneled Legal SaaS Portal
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#10233F]">
            AI-Assisted Property Document Scrutiny for Bank Loans
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Accelerate title chain verification, identify boundary discrepancies, draft targeted bank requisitions, and generate formatted Draft LSR opinions with grounded evidence citations.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-[#10233F] hover:bg-[#152e52] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <span>Login to Chamber Portal</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold shadow-xs transition-all flex items-center gap-2"
            >
              <IconBriefcase className="w-4 h-4 text-[#356AE6]" />
              <span>Explore Demo Dashboard</span>
            </Link>
          </div>
        </div>

        {/* 4-Step Legal Verification Workflow Cards */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              End-to-End Scrutiny Workflow
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#356AE6] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Intake &amp; Ingestion</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Register property schedule, survey numbers, and ingest multi-page title deeds, prior link mother deeds, and ECs.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#356AE6] flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Extraction &amp; Indexing</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                PyMuPDF parses pages, extracts text density, and indexes clauses to provide grounded coordinate citations.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Discrepancy Scrutiny</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Interactive split-screen viewer links flagged boundary variances and EC gaps directly to highlighted source pages.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16805D] flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Queries &amp; LSR Draft</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Formulate official requisitions for the bank manager and compile a formatted Draft Legal Scrutiny Report.
              </p>
            </div>
          </div>
        </div>

        {/* Developer Sandbox & Backend Health Test Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-xs text-[#10233F]">
                Backend Health &amp; Integration Diagnostics
              </h3>
              <p className="text-[11px] text-slate-500">
                Ping the Python FastAPI server at <code className="font-mono text-[#356AE6]">http://localhost:8000/health</code>
              </p>
            </div>
            <button
              onClick={checkBackendHealth}
              disabled={loadingHealth}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              {loadingHealth ? "Checking..." : "Ping Backend Health"}
            </button>
          </div>

          {healthData && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#16805D] space-y-1">
              <div className="font-bold flex items-center gap-1">
                <IconCheckCircle className="w-4 h-4" />
                <span>Backend Connected Successfully</span>
              </div>
              <pre className="font-mono text-[10px] bg-white p-2 rounded border border-emerald-200 overflow-x-auto text-slate-800">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </div>
          )}

          {healthError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <strong>Connection Status:</strong> {healthError}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500">
        Legal Scrutiny Report (LSR) Platform • Built for Empaneled Bank Advocates &amp; Loan Processing
      </footer>
    </div>
  );
}
