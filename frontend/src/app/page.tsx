"use client";

import { useState } from "react";

interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  timestamp: string;
}

export default function Home() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBackendHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/health`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: HealthResponse = await res.json();
      setHealthData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reach backend server";
      setError(`${message}. Ensure the FastAPI server is running at http://localhost:8000`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
            LSR
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Legal Scrutiny Report Platform
            </h1>
            <p className="text-xs text-slate-400">
              Property Document Verification &amp; Bank Loan Processing
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Milestone 0: Scaffolded
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Compliance Notice */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200 flex items-start gap-3">
          <span className="text-lg">🛡️</span>
          <div>
            <strong className="font-semibold">Confidentiality &amp; Compliance Sandbox:</strong>
            <p className="text-amber-200/80 text-xs mt-0.5">
              Strict tenant isolation and private document storage enforced. No real borrower documents or production secrets are used during development. AI findings will be evidence-linked with lawyer final sign-off authority.
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-slate-50">
            AI-Powered Legal Verification Platform
          </h2>
          <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
            Welcome to the developer workbench. Frontend and Backend are set up as independent, modular services inside the monorepo.
          </p>
        </div>

        {/* Team Role & Architecture Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Project Lead Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <span className="text-indigo-400">●</span> Project Lead Workspace
              </h3>
              <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                /frontend
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Next.js 16, TypeScript, Tailwind CSS, shadcn/ui foundation. Manages Case intake, split-screen PDF evidence viewer, query review, and LSR report generation.
            </p>
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>Next.js App Router:</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
          </div>

          {/* Teammate Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <span className="text-emerald-400">●</span> Teammate Workspace
              </h3>
              <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                /backend
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              FastAPI, PyMuPDF, pluggable OCR, and provider-agnostic Gemini AI service. Manages extraction, discrepancy cross-checks, and bank query drafting.
            </p>
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>FastAPI Scrutiny Service:</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
          </div>
        </div>

        {/* Backend Connectivity & Health Check Tool */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-100">Backend Connectivity Check</h3>
              <p className="text-xs text-slate-400">
                Verify that the Next.js frontend can communicate with the Python FastAPI health check endpoint.
              </p>
            </div>
            <button
              onClick={checkBackendHealth}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {loading ? "Checking..." : "Ping Backend Health (/health)"}
            </button>
          </div>

          {healthData && (
            <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <span>✓</span> Backend Connected Successfully
              </div>
              <pre className="text-xs font-mono text-emerald-200/90 bg-emerald-950/60 p-3 rounded overflow-x-auto">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-rose-950/40 border border-rose-500/30 p-4 space-y-1">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <span>✕</span> Connection Failed
              </div>
              <p className="text-xs text-rose-200/80">{error}</p>
            </div>
          )}
        </div>

        {/* Next Milestones Guide */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Roadmap Sequence
          </h4>
          <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
            <li className="text-slate-200 font-medium">Milestone 0: Monorepo Scaffolding (Current)</li>
            <li>Milestone 1: Supabase Database Schema, Tenant RLS &amp; Private Storage</li>
            <li>Milestone 2: Case Intake &amp; Confidential Multi-PDF Document Upload</li>
            <li>Milestone 3: PyMuPDF Document Extraction &amp; OCR Selection Benchmarking</li>
            <li>Milestone 4: Document Classification &amp; Bank Checklist Gap Analysis</li>
            <li>Milestone 5: Cross-Document Discrepancy Scrutiny &amp; Evidence-Linked Viewer</li>
            <li>Milestone 6: Bank Query Generation &amp; Lawyer Review / Sign-off Workflow</li>
            <li>Milestone 7: Supplementary Deeds Ingestion &amp; Draft LSR Export</li>
          </ol>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500">
        AI-Powered Legal Scrutiny Report (LSR) Platform • Built for Bank Loan Processing
      </footer>
    </div>
  );
}
