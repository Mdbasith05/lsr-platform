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
  IconCheck,
  IconUser,
} from "@/components/icons";
import { useAuth } from "@/context/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, user, isLoading, isConfigured } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [chamberName, setChamberName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all mandatory advocate registration fields.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid chamber email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify and re-enter.");
      return;
    }

    setSubmitting(true);
    const res = await signUp(email.trim(), password, {
      fullName: fullName.trim(),
      barEnrollmentNumber: barNumber.trim(),
      chamberName: chamberName.trim() || `Chamber of ${fullName.trim()}`,
    });
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.requiresEmailConfirmation) {
      setEmailSent(true);
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
          Advocate Registration &bull; Title Scrutiny Workspace
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {emailSent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <IconCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Verification Email Dispatched
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We have registered your advocate profile for <strong>{email}</strong>. Please check your inbox and confirm your email to activate your chamber access.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center py-2.5 px-5 rounded-lg bg-[#10233F] hover:bg-[#152e52] text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              {!isConfigured && (
                <div className="mb-5 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#10233F]">
                    <IconShield className="w-4 h-4 text-[#356AE6]" />
                    <span>Supabase Auth Configuration</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Set your <code className="font-mono bg-blue-100 px-1 rounded text-blue-800">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="font-mono bg-blue-100 px-1 rounded text-blue-800">frontend/.env.local</code> to enable real Supabase registrations.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-5 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
                  <span className="font-bold">Notice:</span>
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-3.5 text-xs" onSubmit={handleSubmit}>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Advocate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adv. First Last, LL.B."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#356AE6]/20 focus:border-[#356AE6] transition-all"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Chamber Email *
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bar Enrolment No.
                    </label>
                    <input
                      type="text"
                      value={barNumber}
                      onChange={(e) => setBarNumber(e.target.value)}
                      placeholder="e.g. KAR/1234/2018"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#356AE6]/20 focus:border-[#356AE6] transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Chamber / Firm
                    </label>
                    <input
                      type="text"
                      value={chamberName}
                      onChange={(e) => setChamberName(e.target.value)}
                      placeholder="Chamber of Adv. Name"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#356AE6]/20 focus:border-[#356AE6] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Access Password (min 6 characters) *
                  </label>
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

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Confirm Access Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#356AE6]/20 focus:border-[#356AE6] transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#10233F] hover:bg-[#152e52] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Creating Chamber Account...</span>
                      </>
                    ) : (
                      <>
                        <IconLock className="w-3.5 h-3.5" />
                        <span>Register Chamber Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 mb-1">
                  Already have an advocate account?
                </p>
                <Link
                  href="/login"
                  className="text-xs text-[#356AE6] hover:text-[#2655C4] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <IconUser className="w-3.5 h-3.5" />
                  <span>Sign In with Existing Credentials &rarr;</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <IconShield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Profile bound directly to your authenticated Supabase user ID</span>
          </div>
          <p className="text-[10px] text-slate-400">
            No hardcoded or shared lawyer credentials. Each advocate retains dedicated workspace isolation.
          </p>
        </div>
      </div>
    </div>
  );
}
