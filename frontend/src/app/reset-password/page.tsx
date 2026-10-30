"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconScale,
  IconEye,
  IconEyeOff,
  IconCheckCircle,
} from "@/components/icons";

export default function ResetPasswordPage() {
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
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#2457C5] flex items-center justify-center text-white shadow-xs">
          <IconScale className="w-6 h-6 text-white" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#172B4D]">
          Set New Chamber Password
        </h1>
        <p className="mt-1 text-xs text-[#66758A]">
          Ensure strong password requirements for legal data integrity
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#E3E9F2] rounded-2xl sm:px-10">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#16805D] flex items-center justify-center">
                <IconCheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#172B4D]">
                Password Updated Successfully
              </h3>
              <p className="text-xs text-[#66758A] leading-relaxed">
                Your chamber credentials have been updated. You can now access your active scrutiny files.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-semibold transition-colors"
                >
                  Sign In with New Password
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#C03945]">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
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
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                {loading ? "Updating Password..." : "Update Password &amp; Sign In"}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-[#E3E9F2] text-center">
            <Link
              href="/login"
              className="text-xs text-[#66758A] hover:text-[#172B4D] font-medium"
            >
              Return to Chamber Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
