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
      setError("Please provide both chamber email and access password.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid advocate or chamber email address.");
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
          Legal Scrutiny Report &amp; Title Verification Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#E3E9F2] rounded-2xl sm:px-10">
          {!isConfigured && (
            <div className="mb-5 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#172B4D]">
                <IconShield className="w-4 h-4 text-[#2457C5]" />
                <span>Supabase Configuration</span>
              </div>
              <p className="text-[11px] text-[#66758A] leading-relaxed">
                Connect your live Supabase project by placing your publishable <code className="font-mono bg-blue-100 px-1 rounded text-blue-800">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="font-mono bg-blue-100 px-1 rounded text-blue-800">frontend/.env.local</code>.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-[#C03945] flex items-start gap-2">
              <span className="font-bold">Authentication Notice:</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                Chamber / Advocate Email
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#172B4D]">
                  Access Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-[#2457C5] hover:underline"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#E3E9F2] text-[#2457C5] focus:ring-[#2457C5]"
                />
                <span className="text-xs text-[#66758A]">Keep session active on this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
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
          <div className="mt-6 pt-5 border-t border-[#E3E9F2] text-center">
            <p className="text-xs text-[#66758A] mb-2">
              New empaneled advocate or legal chamber?
            </p>
            <Link
              href="/register"
              className="text-xs text-[#2457C5] hover:text-[#1B449E] font-semibold inline-flex items-center gap-1.5 hover:underline"
            >
              <IconUser className="w-3.5 h-3.5" />
              <span>Register New Chamber Account &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Security Disclaimer */}
        <div className="mt-6 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#66758A]">
            <IconShield className="w-3.5 h-3.5 text-[#16805D]" />
            <span>Encrypted Session &bull; Tenant-Isolated Title Records</span>
          </div>
        </div>
      </div>
    </div>
  );
}
