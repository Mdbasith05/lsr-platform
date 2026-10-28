"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconScale,
  IconHome,
  IconBriefcase,
  IconPlus,
  IconSettings,
  IconChevronLeft,
  IconChevronRight,
  IconShield,
  IconFileText,
} from "@/components/icons";
import { useCases } from "@/context/case-context";
import { useAuth } from "@/context/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { cases, backendOnline } = useCases();
  const { profile, user } = useAuth();

  const activeCasesCount = cases.filter((c) => c.status !== "Completed").length;

  const navLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: IconHome,
      badge: null,
    },
    {
      name: "All Matters",
      href: "/cases",
      icon: IconBriefcase,
      badge: activeCasesCount > 0 ? activeCasesCount : null,
    },
    {
      name: "New Intake",
      href: "/cases/new",
      icon: IconPlus,
      badge: null,
    },
    {
      name: "Chamber Settings",
      href: "/settings/profile",
      icon: IconSettings,
      badge: null,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/cases") return pathname === "/cases" && !pathname.startsWith("/cases/new");
    if (href === "/cases/new") return pathname === "/cases/new";
    if (href.startsWith("/settings")) return pathname.startsWith("/settings");
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`relative flex flex-col bg-[#0A1628] text-white border-r border-[#1a2d4b] transition-all duration-300 z-30 select-none ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand & Logo Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1a2d4b]">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#356AE6] to-[#1e44a0] flex items-center justify-center text-white shadow-md shadow-blue-900/40">
            <IconScale className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                Lawyer Copilot
              </span>
              <span className="text-[10px] text-blue-300/80 font-medium tracking-wide">
                Property Scrutiny &amp; LSR
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <IconChevronRight className="w-4 h-4" /> : <IconChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </div>
        )}

        {navLinks.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                active
                  ? "bg-[#356AE6] text-white shadow-sm shadow-blue-500/30 font-semibold"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
              {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
              {!collapsed && item.badge !== null && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-white font-semibold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Contextual Case Workflow Stepper */}
        {pathname.startsWith("/cases/") && pathname !== "/cases/new" && !collapsed && (
          <div className="pt-6">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Active Case Flow</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="px-3 py-1.5 text-[11px] font-mono text-blue-300 bg-blue-950/50 rounded-lg border border-blue-900/50 truncate">
                {pathname.split("/")[2]}
              </div>
              <Link
                href={`${pathname.split("/").slice(0, 3).join("/")}/documents`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] transition-colors ${
                  pathname.includes("/documents") ? "text-white font-semibold bg-white/15" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <IconFileText className="w-3.5 h-3.5 text-blue-400" />
                <span>1. Upload Deeds</span>
              </Link>
              <Link
                href={`${pathname.split("/").slice(0, 3).join("/")}/scrutiny`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] transition-colors ${
                  pathname.includes("/scrutiny") ? "text-white font-semibold bg-white/15" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <IconScale className="w-3.5 h-3.5 text-amber-400" />
                <span>2. AI Evidence Scrutiny</span>
              </Link>
              <Link
                href={`${pathname.split("/").slice(0, 3).join("/")}/queries`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] transition-colors ${
                  pathname.includes("/queries") ? "text-white font-semibold bg-white/15" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <IconShield className="w-3.5 h-3.5 text-indigo-400" />
                <span>3. Bank Requisitions</span>
              </Link>
              <Link
                href={`${pathname.split("/").slice(0, 3).join("/")}/report`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] transition-colors ${
                  pathname.includes("/report") ? "text-white font-semibold bg-white/15" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <IconFileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>4. Draft LSR Report</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Engine Status & Advocate Profile at Bottom */}
      <div className="p-3 border-t border-[#1a2d4b] bg-[#07101e] space-y-2">
        {!collapsed && (
          <div className="flex items-center justify-between text-[10px] px-1 py-1 rounded bg-black/20 text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span>{backendOnline ? "FastAPI & Gemini Live" : "Local Demo Workspace"}</span>
            </span>
            <span className="text-[9px] text-slate-500 font-mono">v0.2</span>
          </div>
        )}

        {(() => {
          const lawyerName = profile?.name || user?.user_metadata?.full_name || user?.email || "Advocate";
          const lawyerRole = profile?.role || "Senior Empaneled Advocate";
          const avatarInitial = (lawyerName.trim().split(" ").slice(-1)[0]?.[0] || lawyerName[0] || "A").toUpperCase();

          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-slate-100 flex-shrink-0 shadow-xs">
                {avatarInitial}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-100 truncate">{lawyerName}</span>
                  <span className="text-[10px] text-slate-400 truncate">{lawyerRole}</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </aside>
  );
}
