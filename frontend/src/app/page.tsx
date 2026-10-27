"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconScale,
  IconShield,
  IconBriefcase,
  IconArrowRight,
  IconCheckCircle,
  IconAlertTriangle,
} from "@/components/icons";
import { checkBackendHealth, BackendHealth } from "@/lib/api";

export default function RootHomePage() {
  const [healthData, setHealthData] = useState<BackendHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const pingBackend = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    const res = await checkBackendHealth();
    if (res.online && res.data) {
      setHealthData(res.data);
    } else {
      setHealthError(res.error || "Backend unreachable");
    }
    setLoadingHealth(false);
  };

  useEffect(() => {
    let active = true;
    checkBackendHealth().then((res) => {
      if (!active) return;
      if (res.online && res.data) {
        setHealthData(res.data);
      } else {
        setHealthError(res.error || "Backend unreachable");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col font-sans text-[#10233F]">
      {/* Navigation Header */}
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
              AI-Powered Property Document Scrutiny &amp; Legal Report Platform
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
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Open Workspace</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-12 space-y-12">
        {/* Compliance Notice */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-950 flex items-start gap-3 shadow-xs">
          <IconShield className="w-5 h-5 text-[#356AE6] flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold text-[#10233F]">
              Statutory Advocate Opinion Standards ? Human-in-the-Loop Architecture:
            </strong>
            <p className="text-blue-900/80 leading-relaxed text-[11px]">
              Lawyer Copilot assists advocates in cross-document discrepancy scrutiny, boundary clause verification, and bank requisition formulation. AI provides draft recommendations and grounded page citations; final professional judgment and certificate sign-off always remain exclusively with the Advocate under the Advocates Act, 1961.
            </p>
          </div>
        </div>

        {/* Hero Title & Primary Entry Points */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-blue-100/70 text-[#356AE6] border border-blue-200 shadow-2xs">
            Empaneled Legal SaaS Portal ? India
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#10233F] leading-tight">
            AI-Assisted Property Document Scrutiny for Bank Title Loans
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Accelerate 30-year chain of title verification, identify boundary discrepancies across deeds, formulate targeted bank requisitions, and generate formatted Draft LSR opinions with grounded evidence citations.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-[#10233F] hover:bg-[#152e52] text-white text-xs font-bold shadow-md shadow-slate-900/20 transition-all flex items-center gap-2"
            >
              <IconBriefcase className="w-4 h-4 text-[#356AE6]" />
              <span>Launch Advocate Dashboard</span>
            </Link>
            <Link
              href="/cases/new"
              className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold shadow-xs transition-all flex items-center gap-2"
            >
              <IconScale className="w-4 h-4 text-[#356AE6]" />
              <span>Create Scrutiny Case</span>
            </Link>
          </div>
        </div>

        {/* Workflow Showcase Grid */}
        <div className="space-y-5">
          <div className="text-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              End-to-End Scrutiny Workflow
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5 hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#356AE6] flex items-center justify-center font-extrabold text-xs">
                1
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Intake &amp; Upload</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Register property schedule and ingest multi-page title deeds, prior link mother deeds, and Encumbrance Certificates.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5 hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#356AE6] flex items-center justify-center font-extrabold text-xs">
                2
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Extraction &amp; Indexing</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                PyMuPDF &amp; Gemini parse pages, extract legal clauses, and index recitals to provide grounded coordinate citations.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5 hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-xs">
                3
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Discrepancy Scrutiny</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Interactive split-screen viewer links flagged boundary variances and EC gaps directly to highlighted source pages.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5 hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16805D] flex items-center justify-center font-extrabold text-xs">
                4
              </div>
              <h4 className="font-bold text-xs text-[#10233F]">Queries &amp; LSR Draft</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Formulate official requisitions for the bank manager and compile a formatted Draft Legal Scrutiny Report.
              </p>
            </div>
          </div>
        </div>

        {/* Backend Diagnostics Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-xs text-[#10233F]">
                FastAPI &amp; AI Integration Status
              </h3>
              <p className="text-[11px] text-slate-500">
                Pinging Python FastAPI server at <code className="font-mono text-[#356AE6]">http://localhost:8000/health</code>
              </p>
            </div>
            <button
              onClick={pingBackend}
              disabled={loadingHealth}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              {loadingHealth ? "Checking..." : "Re-Check Backend"}
            </button>
          </div>

          {healthData && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#16805D] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <IconCheckCircle className="w-4 h-4" />
                <span>Backend Connected: {healthData.app_name} ({healthData.version})</span>
              </div>
              <pre className="font-mono text-[10px] bg-white p-2.5 rounded-lg border border-emerald-200 overflow-x-auto text-slate-800">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </div>
          )}

          {healthError && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <IconAlertTriangle className="w-4 h-4" />
                <span>Offline Demo Workspace Active</span>
              </div>
              <p className="text-[11px] text-amber-800/80">
                FastAPI is not currently running on port 8000 ({healthError}). Lawyer Copilot is operating with high-fidelity local legal intelligence so you can test all screens and workflows seamlessly.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500">
        Lawyer Copilot ? AI-Powered Legal Productivity Platform for Lawyers Across India
      </footer>
    </div>
  );
}
