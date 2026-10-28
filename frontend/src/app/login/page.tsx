"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconScale,
  IconLock,
  IconEye,
  IconEyeOff,
  IconShield,
  IconUser,
} from "@/components/icons";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, isLoading, isConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please provide both email and chamber access password.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid legal chamber email address.");
      return;
    }

    setSubmitting(true);
    const res = await signIn(email.trim(), password);
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push("/dashboard");
    }
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
          Empaneled Title Scrutiny &amp; Legal Scrutiny Report Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {!isConfigured && (
            <div className="mb-5 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#10233F]">
                <IconShield className="w-4 h-4 text-[#356AE6]" />
                <span>Supabase Auth Configuration</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Connect your live Supabase project by placing your publishable <code className="font-mono bg-blue-100 px-1 rounded text-blue-800">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="font-mono bg-blue-100 px-1 rounded text-blue-800">frontend/.env.local</code>.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
              <span className="font-bold">Authentication Notice:</span>
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
                placeholder="advocate@chamber.in"
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
                <span className="text-xs text-slate-600">Keep session active on this terminal</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#10233F] hover:bg-[#152e52] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Verifying Supabase Session...</span>
                </>
              ) : (
                <>
                  <IconLock className="w-3.5 h-3.5" />
                  <span>Sign In with Chamber Account</span>
                </>
              )}
            </button>
          </form>

          {/* Registration Navigation */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-2">
              New empaneled advocate or legal chamber?
            </p>
            <Link
              href="/register"
              className="text-xs text-[#356AE6] hover:text-[#2655C4] font-semibold inline-flex items-center gap-1.5 hover:underline"
            >
              <IconUser className="w-3.5 h-3.5" />
              <span>Register New Advocate Account &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Confidentiality and Security Disclaimer */}
        <div className="mt-6 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <IconShield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Identity Secured via Supabase Auth &bull; 256-bit Cryptographic JWT</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Confidential borrower title documents and bank scrutiny records are strictly tenant-isolated.
          </p>
        </div>
      </div>
    </div>
  );
}
