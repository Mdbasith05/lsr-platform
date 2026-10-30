"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconScale,
  IconHome,
  IconBriefcase,
  IconUploadCloud,
  IconShield,
  IconFileText,
  IconClock,
  IconUsers,
  IconSettings,
  IconUser,
  IconChevronLeft,
  IconX,
} from "@/components/icons";
import { useCases } from "@/context/case-context";
import { useAuth } from "@/context/auth-context";
import { useSidebarOpen, setSidebarOpen } from "@/lib/sidebar-state";

interface SidebarProps {
  desktopOpen?: boolean;
  onDesktopClose?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  desktopOpen: propDesktopOpen,
  onDesktopClose,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const globalSidebarOpen = useSidebarOpen();
  const isDesktopOpen = propDesktopOpen !== undefined ? propDesktopOpen : globalSidebarOpen;
  const handleDesktopClose = onDesktopClose || (() => setSidebarOpen(false));

  const { cases, backendOnline } = useCases();
  const { profile, user } = useAuth();

  const activeCasesCount = cases.filter((c) => c.status !== "Completed").length;

  const workspaceLinks = [
    { name: "Dashboard", href: "/dashboard", icon: IconHome, badge: null },
    { name: "Cases", href: "/cases", icon: IconBriefcase, badge: activeCasesCount > 0 ? activeCasesCount : null },
    { name: "Documents", href: "/documents", icon: IconUploadCloud, badge: null },
    { name: "AI Scrutiny", href: "/scrutiny", icon: IconScale, badge: null },
    { name: "Bank Queries", href: "/queries", icon: IconShield, badge: null },
    { name: "Reports", href: "/reports", icon: IconFileText, badge: null },
  ];

  const adminLinks = [
    { name: "Activity & Audit", href: "/activity", icon: IconClock, badge: null },
    { name: "Team Management", href: "/settings/team", icon: IconUsers, badge: null },
    { name: "Firm Settings", href: "/settings/templates", icon: IconSettings, badge: null },
  ];

  const personalLinks = [
    { name: "Profile", href: "/settings/profile", icon: IconUser, badge: null },
    { name: "Preferences", href: "/settings/preferences", icon: IconSettings, badge: null },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/cases") return pathname === "/cases" || pathname === "/cases/new";
    if (href === "/documents") return pathname === "/documents";
    if (href === "/scrutiny") return pathname === "/scrutiny";
    if (href === "/queries") return pathname === "/queries";
    if (href === "/reports") return pathname === "/reports";
    if (href === "/activity") return pathname === "/activity";
    if (href === "/settings/team") return pathname === "/settings/team";
    if (href === "/settings/templates") return pathname === "/settings/templates";
    if (href === "/settings/profile") return pathname === "/settings/profile";
    if (href === "/settings/preferences") return pathname === "/settings/preferences";
    return pathname.startsWith(href);
  };

  const renderNavGroup = (title: string, links: typeof workspaceLinks) => (
    <div className="space-y-1">
      <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-[#66758A]">
        {title}
      </div>
      {links.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onMobileClose?.()}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              active
                ? "bg-[#EEF4FF] text-[#2457C5] font-semibold border-l-2 border-[#2457C5]"
                : "text-[#172B4D] hover:bg-[#F7F9FC] hover:text-[#2457C5]"
            }`}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#2457C5]" : "text-[#66758A]"}`} />
            <span className="flex-1 truncate">{item.name}</span>
            {item.badge !== null && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#EEF4FF] text-[#2457C5] font-bold border border-[#2457C5]/20">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand & Logo Header with full close button */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#E3E9F2]">
        <Link
          href="/dashboard"
          onClick={() => onMobileClose?.()}
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#2457C5] flex items-center justify-center text-white shadow-xs">
            <IconScale className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-extrabold text-sm tracking-tight text-[#172B4D] truncate">
              LSR Platform
            </span>
            <span className="text-[10px] text-[#66758A] font-medium truncate">
              Legal Scrutiny Workspace
            </span>
          </div>
        </Link>

        {/* Desktop Close Button (Closes panel completely) */}
        <button
          onClick={handleDesktopClose}
          className="hidden md:inline-flex text-[#66758A] hover:text-[#172B4D] p-1.5 rounded-lg hover:bg-[#F7F9FC] transition-colors"
          title="Close Sidebar"
          aria-label="Close Sidebar"
        >
          <IconChevronLeft className="w-4 h-4" />
        </button>

        {/* Mobile close button */}
        <button
          onClick={() => onMobileClose?.()}
          className="md:hidden text-[#66758A] hover:text-[#172B4D] p-1.5 rounded-lg hover:bg-[#F7F9FC] transition-colors"
          title="Close Navigation"
          aria-label="Close Navigation"
        >
          <IconX className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Groups */}
      <div className="flex-1 py-3 px-3 space-y-3 overflow-y-auto">
        {renderNavGroup("Workspace", workspaceLinks)}
        {renderNavGroup("Administration", adminLinks)}
        {renderNavGroup("Personal", personalLinks)}

        {/* Contextual Active Case Flow Stepper if inspecting a case */}
        {pathname.startsWith("/cases/") && pathname !== "/cases/new" && (
          <div className="pt-3 border-t border-[#E3E9F2] mt-2">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#66758A]">
              Active Case Flow
            </div>
            <div className="space-y-1 text-xs">
              <div className="px-3 py-1 text-[11px] font-mono text-[#2457C5] bg-[#EEF4FF] rounded-lg border border-[#E3E9F2] truncate font-semibold">
                {pathname.split("/")[2]}
              </div>
              <Link
                href={`${pathname.split("/").slice(0, 3).join("/")}/documents`}
                onClick={() => onMobileClose?.()}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                  pathname.includes("/documents")
                    ? "text-[#2457C5] font-semibold bg-[#EEF4FF]"
                    : "text-[#66758A] hover:text-[#172B4D] hover:bg-[#F7F9FC]"
                }`}
              >
                <IconUploadCloud className="w-3.5 h-3.5 text-[#2457C5]" />
                <span>1. Upload Deeds</span>
              </Link>
              <Link
                href={`${pathname.split("/").slice(0, 3).join("/")}/scrutiny`}
                onClick={() => onMobileClose?.()}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                  pathname.includes("/scrutiny")
                    ? "text-[#2457C5] font-semibold bg-[#EEF4FF]"
                    : "text-[#66758A] hover:text-[#172B4D] hover:bg-[#F7F9FC]"
                }`}
              >
                <IconScale className="w-3.5 h-3.5 text-[#B7791F]" />
                <span>2. AI Scrutiny</span>
              </Link>
              <Link
                href={`${pathname.split("/").slice(0, 3).join("/")}/queries`}
                onClick={() => onMobileClose?.()}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                  pathname.includes("/queries")
                    ? "text-[#2457C5] font-semibold bg-[#EEF4FF]"
                    : "text-[#66758A] hover:text-[#172B4D] hover:bg-[#F7F9FC]"
                }`}
              >
                <IconShield className="w-3.5 h-3.5 text-[#2457C5]" />
                <span>3. Bank Queries</span>
              </Link>
              <Link
                href={`${pathname.split("/").slice(0, 3).join("/")}/report`}
                onClick={() => onMobileClose?.()}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                  pathname.includes("/report")
                    ? "text-[#2457C5] font-semibold bg-[#EEF4FF]"
                    : "text-[#66758A] hover:text-[#172B4D] hover:bg-[#F7F9FC]"
                }`}
              >
                <IconFileText className="w-3.5 h-3.5 text-[#16805D]" />
                <span>4. Draft LSR</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Engine Status & User Profile Footer */}
      <div className="p-3 border-t border-[#E3E9F2] bg-[#F7F9FC] space-y-2.5">
        <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-white border border-[#E3E9F2] text-[#66758A]">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? "bg-[#16805D]" : "bg-[#B7791F]"}`} />
            <span className="font-medium text-[#172B4D]">
              {backendOnline ? "FastAPI Online" : "Local Workspace"}
            </span>
          </span>
          <span className="text-[10px] text-[#66758A] font-mono">v1.0</span>
        </div>

        {(() => {
          const lawyerName = profile?.name || user?.user_metadata?.full_name || user?.email || "Advocate";
          const lawyerRole = profile?.role || "Empaneled Advocate";
          const avatarInitial = (lawyerName.trim().split(" ").slice(-1)[0]?.[0] || lawyerName[0] || "A").toUpperCase();

          return (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#EEF4FF] border border-[#2457C5]/30 flex items-center justify-center text-xs font-bold text-[#2457C5] flex-shrink-0">
                {avatarInitial}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#172B4D] truncate">{lawyerName}</span>
                <span className="text-[10px] text-[#66758A] truncate">{lawyerRole}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Closes completely to width 0 with smooth transition) */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out z-30 select-none overflow-hidden ${
          isDesktopOpen
            ? "w-64 border-r border-[#E3E9F2] opacity-100"
            : "w-0 border-r-0 border-transparent opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isDesktopOpen}
      >
        <div className="w-64 h-full flex flex-col flex-shrink-0">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => onMobileClose?.()}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
