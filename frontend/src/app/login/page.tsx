"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconScale,
  IconLock,
  IconEye,
  IconEyeOff,
  IconShield,
  IconCheck,
} from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAutofillDemo = () => {
    setEmail("sreenivasan.legal@lsr-platform.local");
    setPassword("advocate#2026");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please provide both email and chamber access credentials.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid legal chamber email address.");
      return;
    }

    setLoading(true);
    // Simulate brief mock authentication
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-[#10233F] flex items-center justify-center text-white shadow-lg shadow-slate-900/10">
          <IconScale className="w-6 h-6 text-[#356AE6]" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#10233F]">
          Lawyer Copilot
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Empaneled Title Scrutiny &amp; Legal Report Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
              <span className="font-bold">Notice:</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chamber / Advocate Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advocate@chambers.in"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#356AE6]/20 focus:border-[#356AE6] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Access Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-[#356AE6] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-3 pr-10 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#356AE6]/20 focus:border-[#356AE6] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#356AE6] focus:ring-[#356AE6]"
                />
                <span className="text-xs text-slate-600">Keep session active on this chamber terminal</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#10233F] hover:bg-[#152e52] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Verifying Mock Session...</span>
                </>
              ) : (
                <>
                  <IconLock className="w-3.5 h-3.5" />
                  <span>Enter Scrutiny Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleAutofillDemo}
              className="text-xs text-[#356AE6] hover:text-[#2655C4] font-medium inline-flex items-center gap-1.5"
            >
              <IconCheck className="w-3.5 h-3.5" />
              <span>Click to autofill Senior Advocate demo credentials</span>
            </button>
          </div>
        </div>

        {/* Confidentiality and Security Disclaimer */}
        <div className="mt-6 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <IconShield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Demonstration Auth Mode • Real credentials will use Supabase Auth</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Confidential borrower documents and live bank credentials are strictly safeguarded.
          </p>
        </div>
      </div>
    </div>
  );
}
