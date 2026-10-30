"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { IconShield, IconLock } from "@/components/icons";
import { useCases } from "@/context/case-context";
import { useAuth } from "@/context/auth-context";
import { toggleSidebar } from "@/lib/sidebar-state";

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { backendOnline } = useCases();
  const { user, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar fully
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Loading state while Supabase session is verified/restored
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] text-[#172B4D]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#E3E9F2] border-t-[#2457C5] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#172B4D] tracking-wide">
            Verifying Chamber Credentials...
          </p>
          <span className="text-[11px] text-[#66758A]">LSR Platform</span>
        </div>
      </div>
    );
  }

  // Deny access if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] text-[#172B4D] p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B7791F] mb-3">
          <IconLock className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-bold text-[#172B4D]">Protected Legal Workspace</h2>
        <p className="text-xs text-[#66758A] max-w-sm mt-1">
          Access to Title Scrutiny and borrower records requires an authenticated advocate session. Redirecting to sign in...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7F9FC] text-[#172B4D]">
      {/* Sidebar with Desktop & Mobile Drawer capability */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
        />

        {/* Global Compliance & Sandbox Bar */}
        <div className="bg-[#16325C] text-slate-200 px-4 sm:px-6 py-1.5 text-[11px] flex items-center justify-between no-print shadow-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? "bg-[#16805D]" : "bg-sky-400"}`} />
            <span className="font-semibold text-white">LSR Platform</span>
            <span className="text-slate-400 hidden sm:inline">&bull;</span>
            <span className="text-slate-200 hidden sm:inline">
              Empaneled Title Scrutiny &amp; Legal Draft Workspace
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-200 text-[10px]">
            <IconShield className="w-3.5 h-3.5 text-blue-300" />
            <span className="font-medium">Advocate Retains Sole Legal Opinion Authority</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
