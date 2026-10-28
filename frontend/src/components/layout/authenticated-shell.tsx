"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { IconShield, IconLock } from "@/components/icons";
import { useCases } from "@/context/case-context";
import { useAuth } from "@/context/auth-context";

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { backendOnline } = useCases();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Loading state while Supabase session is verified/restored
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FB] text-[#10233F]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#10233F]/20 border-t-[#356AE6] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-700 tracking-wide">
            Verifying Advocate Credentials &amp; Session...
          </p>
          <span className="text-[10px] text-slate-400">Lawyer Copilot Scrutiny Portal</span>
        </div>
      </div>
    );
  }

  // Deny access if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FB] text-[#10233F] p-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
          <IconLock className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-bold text-slate-900">Protected Legal Workspace</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Access to Title Scrutiny and borrower records requires an authenticated advocate session. Redirecting to sign in...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F4F7FB] text-[#10233F]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />

        {/* Global Compliance & Sandbox Bar */}
        <div className="bg-[#10233F] text-slate-300 px-6 py-1.5 text-[11px] flex items-center justify-between border-b border-slate-800/60 no-print shadow-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? "bg-emerald-400" : "bg-blue-400"}`} />
            <span className="font-semibold text-white">Lawyer Copilot</span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">
              Empaneled Title Scrutiny &amp; Legal Draft Workspace
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-200 text-[10px]">
            <IconShield className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium">Advocate Retains Sole Legal Authority</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
