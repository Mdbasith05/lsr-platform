"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconScale,
  IconEye,
  IconEyeOff,
  IconCheckCircle,
} from "@/components/icons";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters in length for bank scrutiny security compliance.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both entries.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-[#10233F] flex items-center justify-center text-white shadow-lg shadow-slate-900/10">
          <IconScale className="w-6 h-6 text-[#356AE6]" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#10233F]">
          Set New Chamber Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Ensure strong password requirements for legal data integrity
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#16805D] flex items-center justify-center">
                <IconCheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Password Successfully Reset
              </h3>
              <p className="text-xs text-slate-500">
                Your chamber access key has been updated. You may now log in with your updated credentials.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => router.push("/login")}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#10233F] hover:bg-[#152e52] text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Return to Login
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Secure Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#356AE6]/20 focus:border-[#356AE6] transition-all"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Security Criteria:</p>
                <p>• Minimum 8 characters in length</p>
                <p>• Contains letters and numeric digits</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#10233F] hover:bg-[#152e52] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-slate-900 font-medium"
            >
              Cancel and Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
