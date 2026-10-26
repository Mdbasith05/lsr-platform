"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { IconShield } from "@/components/icons";

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen flex bg-[#F4F7FB] text-[#10233F]">
      {/* Sidebar (Fixed desktop navigation) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />

        {/* Global Compliance & Sandbox Bar */}
        <div className="bg-[#10233F] text-slate-300 px-6 py-1.5 text-[11px] flex items-center justify-between border-b border-slate-800/60 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium text-white">Bank Empaneled Legal Portal</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">
              Confidentiality Sandbox Active: Client-side demonstration mode
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-300 text-[10px]">
            <IconShield className="w-3 h-3 text-blue-400" />
            <span>Advocate Retains Sole Legal Authority</span>
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
