"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconScale,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconUser,
} from "@/components/icons";
import { useAuth } from "@/context/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, user, isLoading } = useAuth();

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
  const [devConfirmationLink, setDevConfirmationLink] = useState<string | null>(null);

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
      if (res.confirmationLink) {
        setDevConfirmationLink(res.confirmationLink);
      }
      setEmailSent(true);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#2457C5] flex items-center justify-center text-white shadow-xs">
          <IconScale className="w-6 h-6 text-white" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#172B4D]">
          LSR Platform
        </h1>
        <p className="mt-1 text-xs text-[#66758A]">
          Empaneled Advocate &amp; Chamber Registration
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#E3E9F2] rounded-2xl sm:px-10">
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#16805D] flex items-center justify-center">
                <IconCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#172B4D]">
                Confirmation Email Dispatched
              </h3>
              <p className="text-xs text-[#66758A] leading-relaxed">
                We have dispatched a verification email to <strong className="text-[#172B4D]">{email}</strong>. Please click the link to activate your chamber access.
              </p>

              {devConfirmationLink && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-left text-xs space-y-2">
                  <span className="font-bold text-[#2457C5] block">Development Environment Link:</span>
                  <a
                    href={devConfirmationLink}
                    className="text-[#2457C5] underline break-all font-mono text-[10px]"
                  >
                    {devConfirmationLink}
                  </a>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full py-2 px-4 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Return to Chamber Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-[#C03945] flex items-start gap-2">
                  <span className="font-bold">Error:</span>
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                    Full Advocate Name <span className="text-[#C03945]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adv. Rajesh Kumar"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                    Official Chamber Email <span className="text-[#C03945]">*</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Bar Council Reg. No.
                    </label>
                    <input
                      type="text"
                      value={barNumber}
                      onChange={(e) => setBarNumber(e.target.value)}
                      placeholder="KAR/1234/2012"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Chamber / Firm Name
                    </label>
                    <input
                      type="text"
                      value={chamberName}
                      onChange={(e) => setChamberName(e.target.value)}
                      placeholder="Kumar &amp; Associates"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                    Password <span className="text-[#C03945]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-3.5 pr-10 py-2 text-xs rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66758A] hover:text-[#172B4D]"
                    >
                      {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                    Confirm Password <span className="text-[#C03945]">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <IconUser className="w-3.5 h-3.5" />
                      <span>Register Chamber Account</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-[#E3E9F2] text-center">
                <p className="text-xs text-[#66758A] mb-1">
                  Already have an active account?
                </p>
                <Link
                  href="/login"
                  className="text-xs text-[#2457C5] hover:text-[#1B449E] font-semibold hover:underline"
                >
                  Sign in with Chamber Account &rarr;
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
