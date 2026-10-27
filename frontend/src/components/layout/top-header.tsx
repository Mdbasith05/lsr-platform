"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  IconSearch,
  IconBell,
  IconPlus,
  IconUpload,
  IconUser,
  IconLogOut,
  IconSettings,
  IconShield,
} from "@/components/icons";
import { useCases } from "@/context/case-context";

export function TopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { cases, userProfile, notifications, markNotificationRead } = useCases();

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
        crumbs.push({ label: "New Case Intake", href: "/cases/new" });
      }
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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 overflow-hidden">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.href + idx}>
            {idx > 0 && <span className="text-slate-300">/</span>}
            <Link
              href={crumb.href}
              className={`hover:text-[#10233F] transition-colors truncate max-w-[200px] ${
                idx === breadcrumbs.length - 1 ? "font-semibold text-[#10233F]" : ""
              }`}
            >
              {crumb.label}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      {/* Right: Search, Actions, Notifications & Profile */}
      <div className="flex items-center space-x-4">
        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search borrower, case ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-60 pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6] focus:border-[#356AE6] transition-all"
          />
        </form>

        {/* Actions */}
        <Link
          href={`/cases/${
            pathSegments[0] === "cases" && pathSegments[1] && pathSegments[1] !== "new"
              ? pathSegments[1]
              : cases.length > 0
              ? cases[0].id
              : "LSR-2026-001"
          }/documents`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          title="Upload Deeds, Encumbrance Certificates, and Property Records"
        >
          <IconUpload className="w-3.5 h-3.5 text-[#356AE6]" />
          <span className="hidden sm:inline">Upload Deeds</span>
        </Link>

        {/* Primary CTA */}
        <Link
          href="/cases/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-medium shadow-sm transition-colors"
        >
          <IconPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Case</span>
        </Link>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            title="Notifications"
          >
            <IconBell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-3 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[10px] bg-blue-50 text-[#356AE6] font-medium px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      n.read ? "bg-slate-50 text-slate-500" : "bg-blue-50/50 text-slate-800 border-l-2 border-[#356AE6]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="font-medium text-[11px]">{n.title}</strong>
                      <span className="text-[9px] text-slate-400">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#10233F] text-white flex items-center justify-center font-bold text-xs">
              {userProfile.name.split(" ").slice(-1)[0][0] || "A"}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-800 truncate max-w-[120px]">
                {userProfile.name}
              </span>
              <span className="text-[10px] text-slate-500">Lawyer Panel</span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 text-xs text-slate-700 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900 truncate">{userProfile.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{userProfile.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700">
                  <IconShield className="w-3 h-3" />
                  <span>Enrolled: {userProfile.barEnrollmentNumber}</span>
                </div>
              </div>
              <Link
                href="/settings/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition-colors"
              >
                <IconUser className="w-3.5 h-3.5 text-slate-400" />
                <span>Advocate Profile</span>
              </Link>
              <Link
                href="/settings/templates"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition-colors"
              >
                <IconSettings className="w-3.5 h-3.5 text-slate-400" />
                <span>Bank Rule Templates</span>
              </Link>
              <div className="border-t border-slate-100 my-1" />
              <Link
                href="/login"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <IconLogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
