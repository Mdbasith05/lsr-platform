"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { useAuth } from "@/context/auth-context";
import {
  IconUser,
  IconUsers,
  IconSettings,
  IconShield,
  IconCheck,
} from "@/components/icons";

export default function SettingsProfilePage() {
  const { updateUserProfile } = useCases();
  const { profile, user, updateProfile } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [chamberName, setChamberName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when profile or user loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || user?.email || "");
      setBarNumber(profile.barEnrollmentNumber || "");
      setChamberName(profile.chamberName || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
    } else if (user) {
      const meta = user.user_metadata || {};
      setName(meta.full_name || meta.name || "");
      setEmail(user.email || "");
      setBarNumber(meta.bar_enrollment_number || "");
      setChamberName(meta.chamber_name || "");
      setPhone(meta.phone || "");
      setAddress(meta.address || "");
    }
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const updatePayload = {
      name,
      email,
      barEnrollmentNumber: barNumber,
      chamberName,
      phone,
      address,
    };

    const res = await updateProfile(updatePayload);
    setSaving(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      updateUserProfile(updatePayload);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    }
  };

  return (
    <AuthenticatedShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#10233F]">
            Chamber &amp; Advocate Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage advocate accreditation, official chamber credentials, and bank scrutiny rules.
          </p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-semibold space-x-6">
          <Link
            href="/settings/profile"
            className="pb-3 border-b-2 border-[#356AE6] text-[#356AE6] flex items-center gap-2"
          >
            <IconUser className="w-4 h-4" />
            <span>Advocate Profile</span>
          </Link>
          <Link
            href="/settings/team"
            className="pb-3 text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors"
          >
            <IconUsers className="w-4 h-4" />
            <span>Chamber Team &amp; Roles</span>
          </Link>
          <Link
            href="/settings/templates"
            className="pb-3 text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors"
          >
            <IconSettings className="w-4 h-4" />
            <span>Bank Scrutiny Checklists</span>
          </Link>
        </div>

        {saved && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-[#16805D] flex items-center gap-2">
            <IconCheck className="w-4 h-4 flex-shrink-0" />
            <span>Advocate profile details saved successfully to PostgreSQL database.</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 flex items-center gap-2">
            <span className="font-bold">Error:</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Form Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#10233F]">Official Empaneled Advocate Profile</h3>
              <p className="text-xs text-slate-500">
                Credentials printed on Legal Scrutiny Reports (LSR) and bank requisition correspondence
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#16805D] border border-emerald-200">
              <IconShield className="w-3.5 h-3.5" />
              <span>Identity Verified</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Advocate Name (with qualifications)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adv. First Last, LL.B."
                  className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bar Council Enrolment Number
                </label>
                <input
                  type="text"
                  required
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                  placeholder="e.g. KAR/1234/2018 or MAH/5678/2015"
                  className="w-full p-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chamber / Law Firm Name
                </label>
                <input
                  type="text"
                  required
                  value={chamberName}
                  onChange={(e) => setChamberName(e.target.value)}
                  placeholder="Chamber of Adv. Name & Associates"
                  className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Chamber Email
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  title="Email is anchored to your authenticated Supabase account"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chamber Telephone / Mobile
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Advocate Role Designation
                </label>
                <input
                  type="text"
                  disabled
                  value={profile?.role || "Senior Empaneled Advocate"}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Chamber Office Postal Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Chamber #, High Court Lawyers Chambers or Office Address"
                  className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Secured via Supabase Auth &bull; Tied strictly to your User ID
              </span>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#10233F] hover:bg-[#152e52] text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
              >
                {saving ? "Saving to Database..." : "Save Chamber Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedShell>
  );
}
