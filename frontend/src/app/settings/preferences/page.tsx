"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import {
  IconUser,
  IconUsers,
  IconSettings,
  IconCheck,
} from "@/components/icons";

export default function SettingsPreferencesPage() {
  const [notifyOnCritical, setNotifyOnCritical] = useState(true);
  const [notifyOnQueryResponse, setNotifyOnQueryResponse] = useState(true);
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lsr_preferences");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.notifyOnCritical === "boolean") setNotifyOnCritical(parsed.notifyOnCritical);
        if (typeof parsed.notifyOnQueryResponse === "boolean") setNotifyOnQueryResponse(parsed.notifyOnQueryResponse);
        if (parsed.density === "compact" || parsed.density === "comfortable") setDensity(parsed.density);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        "lsr_preferences",
        JSON.stringify({
          notifyOnCritical,
          notifyOnQueryResponse,
          density,
        })
      );
    } catch {
      // Ignore localStorage write errors
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AuthenticatedShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
            Chamber &amp; Advocate Settings
          </h1>
          <p className="text-xs text-[#66758A] mt-1">
            Configure application preferences, notification delivery, and table density.
          </p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-[#E3E9F2] text-xs font-semibold space-x-6">
          <Link
            href="/settings/profile"
            className="pb-3 text-[#66758A] hover:text-[#172B4D] flex items-center gap-2 transition-colors"
          >
            <IconUser className="w-4 h-4" />
            <span>Advocate Profile</span>
          </Link>
          <Link
            href="/settings/team"
            className="pb-3 text-[#66758A] hover:text-[#172B4D] flex items-center gap-2 transition-colors"
          >
            <IconUsers className="w-4 h-4" />
            <span>Chamber Team &amp; Roles</span>
          </Link>
          <Link
            href="/settings/templates"
            className="pb-3 text-[#66758A] hover:text-[#172B4D] flex items-center gap-2 transition-colors"
          >
            <IconSettings className="w-4 h-4" />
            <span>Firm Scrutiny Rules</span>
          </Link>
          <Link
            href="/settings/preferences"
            className="pb-3 border-b-2 border-[#2457C5] text-[#2457C5] flex items-center gap-2 font-bold"
          >
            <IconSettings className="w-4 h-4" />
            <span>Preferences</span>
          </Link>
        </div>

        {/* Preferences Form */}
        <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-6 md:p-8">
          <form className="space-y-6" onSubmit={handleSave}>
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">Notification Rules</h2>
              <p className="text-xs text-[#66758A] mt-0.5">
                Manage automated alerts for high-priority title discrepancies and bank responses.
              </p>

              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnCritical}
                    onChange={(e) => setNotifyOnCritical(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#E3E9F2] text-[#2457C5] focus:ring-[#2457C5]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#172B4D] block">
                      Alert on Priority Title Breaks
                    </span>
                    <span className="text-[11px] text-[#66758A]">
                      Immediate in-app and badge notification whenever AI scrutiny identifies boundary mismatches or missing parent links.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnQueryResponse}
                    onChange={(e) => setNotifyOnQueryResponse(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#E3E9F2] text-[#2457C5] focus:ring-[#2457C5]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#172B4D] block">
                      Bank Requisition Updates
                    </span>
                    <span className="text-[11px] text-[#66758A]">
                      Notify when clarification documents or answers are received from branch credit officers.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E3E9F2]">
              <h2 className="text-sm font-bold text-[#172B4D]">Display &amp; Table Density</h2>
              <p className="text-xs text-[#66758A] mt-0.5">
                Adjust table density for multi-deed comparison views.
              </p>

              <div className="mt-3 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="density"
                    value="comfortable"
                    checked={density === "comfortable"}
                    onChange={() => setDensity("comfortable")}
                    className="text-[#2457C5] focus:ring-[#2457C5]"
                  />
                  <span className="text-xs font-medium text-[#172B4D]">Comfortable (Recommended)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="density"
                    value="compact"
                    checked={density === "compact"}
                    onChange={() => setDensity("compact")}
                    className="text-[#2457C5] focus:ring-[#2457C5]"
                  />
                  <span className="text-xs font-medium text-[#172B4D]">Compact (High density)</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E3E9F2] flex items-center justify-between">
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#16805D] font-semibold">
                  <IconCheck className="w-4 h-4" />
                  <span>Preferences saved successfully</span>
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedShell>
  );
}

