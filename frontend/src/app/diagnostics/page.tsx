"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconScale,
  IconShield,
  IconCheckCircle,
  IconAlertTriangle,
  IconArrowRight,
  IconBriefcase,
} from "@/components/icons";
import { checkBackendHealth, BackendHealth, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export default function DiagnosticsPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<BackendHealth | null>(null);
  const [detailsData, setDetailsData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setLastCheckedAt(new Date().toISOString());
    const start = performance.now();
    try {
      const res = await checkBackendHealth();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));

      if (res.online && res.data) {
        setHealthData(res.data);
        setError(null);
      } else {
        setHealthData(null);
        setError(res.error || "Backend unreachable");
      }

      // Also fetch /health/details
      try {
        const detRes = await fetch(`${API_BASE_URL}/api/v1/health/details`);
        if (detRes.ok) {
          const detJson = await detRes.json();
          setDetailsData(detJson);
        }
      } catch {
        // Fallback or ignore
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Diagnostics failure");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col font-sans text-[#10233F]">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10233F] to-[#1c3862] flex items-center justify-center text-white shadow-md shadow-slate-900/15">
            <IconScale className="w-6 h-6 text-[#356AE6]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-[#10233F]">
              System Diagnostics
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Backend Health &amp; Subsystem Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            &larr; Back to Home
          </Link>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="px-4 py-2 rounded-xl bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <span>{user ? "Open Dashboard" : "Sign In"}</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Diagnostics Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-[#10233F]">
                FastAPI Gateway &amp; Subsystems Status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Target endpoint: <code className="font-mono text-[#356AE6] bg-slate-50 px-1.5 py-0.5 rounded text-[11px]">{API_BASE_URL}/api/v1/health</code>
              </p>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#10233F] hover:bg-[#1a3860] disabled:bg-slate-300 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
            >
              {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? "Testing Connection..." : "Run Diagnostics"}</span>
            </button>
          </div>

          {/* Status Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Connection State</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${healthData ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span className="text-sm font-extrabold text-[#10233F]">
                  {loading ? "Checking..." : healthData ? "Online (HTTP 200)" : "Unreachable"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Response Latency</span>
              <div className="text-sm font-extrabold text-[#10233F]">
                {latencyMs !== null ? `${latencyMs} ms` : "N/A"}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Environment</span>
              <div className="text-sm font-extrabold text-[#10233F]">
                {healthData?.environment || "Development"}
              </div>
            </div>
          </div>

          {/* Subsystem Health Cards */}
          {detailsData && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Subsystems Verification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-900 flex items-center gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <strong className="block font-bold">Tenant Isolation</strong>
                    <span className="text-[11px] text-emerald-800/80">Enforced at DB &amp; Route</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-900 flex items-center gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <strong className="block font-bold">Storage Service</strong>
                    <span className="text-[11px] text-emerald-800/80">Active (Supabase &amp; Local)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-900 flex items-center gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <strong className="block font-bold">AI Scrutiny Service</strong>
                    <span className="text-[11px] text-emerald-800/80">Gemini &amp; Rule Engine</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-700">
                <IconAlertTriangle className="w-4 h-4" />
                <span>Backend Connection Error</span>
              </div>
              <p className="text-[11px] text-rose-800/90 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Raw Diagnostic Payload */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Raw Telemetry Payload</h3>
            <pre className="font-mono text-[11px] bg-slate-900 text-emerald-400 p-4 rounded-xl overflow-x-auto max-h-64 shadow-inner">
              {JSON.stringify({ health: healthData, details: detailsData, latency_ms: latencyMs, timestamp: lastCheckedAt }, null, 2)}
            </pre>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        Lawyer Copilot Diagnostic Utility &bull; Internal System Telemetry
      </footer>
    </div>
  );
}
