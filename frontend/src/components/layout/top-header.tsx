"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  IconSearch,
  IconBell,
  IconPlus,
  IconUploadCloud,
  IconUser,
  IconLogOut,
  IconSettings,
  IconMenu,
} from "@/components/icons";
import { useCases } from "@/context/case-context";
import { useAuth } from "@/context/auth-context";
import { useSidebarOpen, toggleSidebar } from "@/lib/sidebar-state";

interface TopHeaderProps {
  onMobileMenuToggle?: () => void;
}

export function TopHeader({ onMobileMenuToggle }: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isSidebarOpen = useSidebarOpen();
  const { cases, notifications, markNotificationRead } = useCases();
  const { profile, user, signOut } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Quick search handling
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = cases.find(
      (c) =>
        c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (match) {
      router.push(`/cases/${match.id}`);
      setSearchQuery("");
    } else {
      router.push(`/cases?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Generate breadcrumb items
  const pathSegments = pathname.split("/").filter(Boolean);
  const getBreadcrumbs = () => {
    if (pathSegments.length === 0 || pathSegments[0] === "dashboard") {
      return [{ label: "Dashboard", href: "/dashboard" }];
    }
    const crumbs = [{ label: "Home", href: "/dashboard" }];
    if (pathSegments[0] === "cases") {
      crumbs.push({ label: "Cases", href: "/cases" });
      if (pathSegments[1] && pathSegments[1] !== "new") {
        const c = cases.find((item) => item.id === pathSegments[1]);
        crumbs.push({
          label: c ? `${c.id} (${c.borrowerName.split(" ")[0]})` : pathSegments[1],
          href: `/cases/${pathSegments[1]}`,
        });
        if (pathSegments[2]) {
          const sub = pathSegments[2].charAt(0).toUpperCase() + pathSegments[2].slice(1);
          crumbs.push({ label: sub, href: `/cases/${pathSegments[1]}/${pathSegments[2]}` });
        }
      } else if (pathSegments[1] === "new") {
        crumbs.push({ label: "New Case", href: "/cases/new" });
      }
    } else if (pathSegments[0] === "documents") {
      crumbs.push({ label: "Document Library", href: "/documents" });
    } else if (pathSegments[0] === "scrutiny") {
      crumbs.push({ label: "AI Scrutiny", href: "/scrutiny" });
    } else if (pathSegments[0] === "queries") {
      crumbs.push({ label: "Bank Queries", href: "/queries" });
    } else if (pathSegments[0] === "reports") {
      crumbs.push({ label: "Reports", href: "/reports" });
    } else if (pathSegments[0] === "activity") {
      crumbs.push({ label: "Activity & Audit", href: "/activity" });
    } else if (pathSegments[0] === "settings") {
      crumbs.push({ label: "Settings", href: "/settings/profile" });
      if (pathSegments[1]) {
        const sub = pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1);
        crumbs.push({ label: sub, href: `/settings/${pathSegments[1]}` });
      }
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const userName = profile?.name || user?.user_metadata?.full_name || user?.email || "Advocate";
  const userInitials = (userName.trim().split(" ").slice(-1)[0]?.[0] || userName[0] || "A").toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-[#E3E9F2] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Sidebar Toggle & Breadcrumbs */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              onMobileMenuToggle?.();
            } else {
              toggleSidebar();
            }
          }}
          className={`p-2 -ml-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
            !isSidebarOpen
              ? "bg-[#EEF4FF] text-[#2457C5] hover:bg-[#DDE9FF] border border-[#2457C5]/30 shadow-xs ring-2 ring-[#2457C5]/10"
              : "text-[#66758A] hover:text-[#172B4D] hover:bg-[#F7F9FC]"
          }`}
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-label={isSidebarOpen ? "Close navigation sidebar" : "Open navigation sidebar"}
        >
          <IconMenu className="w-5 h-5" />
        </button>

        <nav className="flex items-center space-x-1.5 text-xs text-[#66758A] truncate">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href + idx}>
              {idx > 0 && <span className="text-[#CBD5E1]">/</span>}
              <Link
                href={crumb.href}
                className={`hover:text-[#2457C5] transition-colors truncate max-w-[160px] sm:max-w-[220px] ${
                  idx === breadcrumbs.length - 1 ? "font-semibold text-[#172B4D]" : ""
                }`}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Search, Actions, Notifications & Profile Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Global Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden lg:block">
          <IconSearch className="w-3.5 h-3.5 text-[#66758A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cases, borrowers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2457C5] focus:border-[#2457C5] transition-all"
          />
        </form>

        {/* Upload Deeds Quick Action */}
        <Link
          href="/documents"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E3E9F2] bg-white hover:bg-[#F7F9FC] text-[#172B4D] text-xs font-semibold shadow-xs transition-colors"
          title="Document Library"
        >
          <IconUploadCloud className="w-3.5 h-3.5 text-[#2457C5]" />
          <span>Upload</span>
        </Link>

        {/* Primary CTA */}
        <Link
          href="/cases/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <IconPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Case</span>
        </Link>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-[#66758A] hover:text-[#172B4D] hover:bg-[#F7F9FC] relative transition-colors"
            title="Notifications"
          >
            <IconBell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C03945]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E3E9F2] p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-[#E3E9F2] pb-2">
                <span className="text-xs font-bold text-[#172B4D]">Notifications</span>
                <span className="text-[10px] bg-[#EEF4FF] text-[#2457C5] font-bold px-2 py-0.5 rounded-full border border-[#2457C5]/20">
                  {unreadCount} new
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#66758A] text-center py-4">No recent notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                        n.read ? "bg-[#F7F9FC] text-[#66758A]" : "bg-[#EEF4FF] text-[#172B4D] border-l-2 border-[#2457C5]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="font-semibold text-[11px]">{n.title}</strong>
                        <span className="text-[9px] text-[#66758A]">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F7F9FC] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#EEF4FF] border border-[#2457C5]/30 flex items-center justify-center text-xs font-bold text-[#2457C5]">
              {userInitials}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E3E9F2] py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-[#E3E9F2]">
                <p className="text-xs font-bold text-[#172B4D] truncate">{userName}</p>
                <p className="text-[11px] text-[#66758A] truncate">{profile?.role || "Advocate"}</p>
                {user?.email && <p className="text-[10px] text-[#66758A] truncate mt-0.5">{user.email}</p>}
              </div>

              <div className="py-1">
                <Link
                  href="/settings/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-[#172B4D] hover:bg-[#F7F9FC] transition-colors"
                >
                  <IconUser className="w-3.5 h-3.5 text-[#66758A]" />
                  <span>Advocate Profile</span>
                </Link>
                <Link
                  href="/settings/preferences"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-[#172B4D] hover:bg-[#F7F9FC] transition-colors"
                >
                  <IconSettings className="w-3.5 h-3.5 text-[#66758A]" />
                  <span>Preferences</span>
                </Link>
                <Link
                  href="/settings/templates"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-[#172B4D] hover:bg-[#F7F9FC] transition-colors"
                >
                  <IconSettings className="w-3.5 h-3.5 text-[#66758A]" />
                  <span>Firm Scrutiny Rules</span>
                </Link>
              </div>

              <div className="border-t border-[#E3E9F2] pt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-[#C03945] hover:bg-rose-50 transition-colors"
                >
                  <IconLogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
