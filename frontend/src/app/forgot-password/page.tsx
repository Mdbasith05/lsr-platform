"use client";

import React, { useState } from "react";
import Link from "next/link";
import { IconScale, IconCheckCircle, IconArrowLeft } from "@/components/icons";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-[#10233F] flex items-center justify-center text-white shadow-lg shadow-slate-900/10">
          <IconScale className="w-6 h-6 text-[#356AE6]" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#10233F]">
          Recover Chamber Access
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Reset password for your empaneled advocate account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#16805D] flex items-center justify-center">
                <IconCheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Password Reset Link Sent
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                If an empaneled account matches <strong className="text-slate-800">{email}</strong>, we have dispatched an encrypted recovery token link.
              </p>
              <div className="pt-2">
                <Link
                  href="/reset-password?token=mock-demo-token"
                  className="inline-flex items-center justify-center w-full py-2 px-4 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-medium transition-colors"
                >
                  Continue to Mock Password Reset
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Chamber Email
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#10233F] hover:bg-[#152e52] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? "Generating Link..." : "Send Recovery Link"}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium"
            >
              <IconArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
