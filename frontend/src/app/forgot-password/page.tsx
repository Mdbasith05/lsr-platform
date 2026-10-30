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
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#2457C5] flex items-center justify-center text-white shadow-xs">
          <IconScale className="w-6 h-6 text-white" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#172B4D]">
          Recover Chamber Access
        </h1>
        <p className="mt-1 text-xs text-[#66758A]">
          Reset password for your empaneled advocate account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#E3E9F2] rounded-2xl sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#16805D] flex items-center justify-center">
                <IconCheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#172B4D]">
                Password Reset Link Sent
              </h3>
              <p className="text-xs text-[#66758A] leading-relaxed">
                If an empaneled account matches <strong className="text-[#172B4D]">{email}</strong>, we have dispatched an encrypted recovery token link.
              </p>
              <div className="pt-2">
                <Link
                  href="/reset-password?token=mock-demo-token"
                  className="inline-flex items-center justify-center w-full py-2 px-4 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-semibold transition-colors"
                >
                  Continue to Password Reset
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Chamber Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="advocate@chamber.in"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                {loading ? "Sending Recovery Link..." : "Send Reset Instructions"}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-[#E3E9F2] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[#66758A] hover:text-[#172B4D] font-medium"
            >
              <IconArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Chamber Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
