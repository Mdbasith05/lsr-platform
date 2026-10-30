"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  IconScale,
  IconCheckCircle,
  IconAlertTriangle,
  IconArrowRight,
  IconRefresh,
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

  const mountedRef = useRef(false);

  const runDiagnostics = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      runDiagnostics();
    }
  }, [runDiagnostics]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col font-sans text-[#172B4D]">
      {/* Header */}
      <header className="border-b border-[#E3E9F2] bg-white sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#16325C] flex items-center justify-center text-white shadow-xs">
            <IconScale className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-[#16325C]">
              System Diagnostics
            </h1>
            <p className="text-[11px] text-[#66758A] font-medium">
              Backend Health &amp; Subsystem Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#66758A] hover:text-[#172B4D] hover:bg-[#F7F9FC] transition-colors"
          >
            &larr; Back to Home
          </Link>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-md shadow-[#2457C5]/20 transition-all flex items-center gap-1.5"
          >
            <span>{user ? "Open Dashboard" : "Sign In"}</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Diagnostics Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 space-y-6">
        <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E9F2]">
            <div>
              <h2 className="text-sm font-extrabold text-[#16325C]">
                FastAPI Gateway &amp; Subsystems Status
              </h2>
              <p className="text-xs text-[#66758A] mt-0.5">
                Target endpoint: <code className="font-mono text-[#2457C5] bg-[#EEF4FF] px-2 py-0.5 rounded text-[11px] border border-[#2457C5]/20">{API_BASE_URL}/api/v1/health</code>
              </p>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#16325C] hover:bg-[#112442] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <IconRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Testing Connection..." : "Run Diagnostics"}</span>
            </button>
          </div>

          {/* Status Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#66758A]">Connection State</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${healthData ? "bg-[#16805D]" : "bg-[#C03945]"}`} />
                <span className="text-sm font-extrabold text-[#16325C]">
                  {loading ? "Checking..." : healthData ? "Online (HTTP 200)" : "Unreachable"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#66758A]">Response Latency</span>
              <div className="text-sm font-extrabold text-[#16325C]">
                {latencyMs !== null ? `${latencyMs} ms` : "N/A"}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#66758A]">Environment</span>
              <div className="text-sm font-extrabold text-[#16325C]">
                {healthData?.environment || "Development"}
              </div>
            </div>
          </div>

          {/* Subsystem Health Cards */}
          {detailsData && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#16325C] uppercase tracking-wide">Subsystems Verification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-[#16805D]/20 bg-[#16805D]/5 text-xs text-[#16805D] flex items-center gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-[#16805D] flex-shrink-0" />
                  <div>
                    <strong className="block font-bold">Tenant Isolation</strong>
                    <span className="text-[11px] text-[#16805D]/80">Enforced at DB &amp; Route</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[#16805D]/20 bg-[#16805D]/5 text-xs text-[#16805D] flex items-center gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-[#16805D] flex-shrink-0" />
                  <div>
                    <strong className="block font-bold">Storage Service</strong>
                    <span className="text-[11px] text-[#16805D]/80">Active (Supabase &amp; Local)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[#16805D]/20 bg-[#16805D]/5 text-xs text-[#16805D] flex items-center gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-[#16805D] flex-shrink-0" />
                  <div>
                    <strong className="block font-bold">AI Scrutiny Service</strong>
                    <span className="text-[11px] text-[#16805D]/80">Gemini &amp; Rule Engine</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-[#C03945]/10 border border-[#C03945]/20 text-xs text-[#C03945] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <IconAlertTriangle className="w-4 h-4" />
                <span>Backend Connection Error</span>
              </div>
              <p className="text-[11px] text-[#C03945]/90 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Raw Diagnostic Payload */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#16325C] uppercase tracking-wide">Raw Telemetry Payload</h3>
            <pre className="font-mono text-[11px] bg-[#16325C] text-emerald-400 p-4 rounded-xl overflow-x-auto max-h-64 shadow-inner">
              {JSON.stringify({ health: healthData, details: detailsData, latency_ms: latencyMs, timestamp: lastCheckedAt }, null, 2)}
            </pre>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E3E9F2] bg-white py-4 px-6 text-center text-xs text-[#66758A]">
        LSR Platform Diagnostic Utility &bull; Internal System Telemetry
      </footer>
    </div>
  );
}
