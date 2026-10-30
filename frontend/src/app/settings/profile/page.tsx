"use client";

import React, { useState } from "react";
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
  IconSliders,
} from "@/components/icons";

/* ---------- Settings navigation tabs (shared across settings pages) ---------- */
function SettingsTabs() {
  return (
    <div className="flex border-b border-[#E3E9F2] text-xs font-semibold space-x-6 overflow-x-auto pb-px">
      <Link
        href="/settings/profile"
        className="pb-3 border-b-2 border-[#2457C5] text-[#2457C5] flex items-center gap-2 whitespace-nowrap"
      >
        <IconUser className="w-4 h-4" />
        <span>Advocate Profile</span>
      </Link>
      <Link
        href="/settings/team"
        className="pb-3 text-[#66758A] hover:text-[#172B4D] flex items-center gap-2 transition-colors whitespace-nowrap"
      >
        <IconUsers className="w-4 h-4" />
        <span>Chamber Team &amp; Roles</span>
      </Link>
      <Link
        href="/settings/templates"
        className="pb-3 text-[#66758A] hover:text-[#172B4D] flex items-center gap-2 transition-colors whitespace-nowrap"
      >
        <IconSettings className="w-4 h-4" />
        <span>Bank Scrutiny Checklists</span>
      </Link>
      <Link
        href="/settings/preferences"
        className="pb-3 text-[#66758A] hover:text-[#172B4D] flex items-center gap-2 transition-colors whitespace-nowrap"
      >
        <IconSliders className="w-4 h-4" />
        <span>Preferences</span>
      </Link>
    </div>
  );
}

/* ---------- Inner form that initialises state from props (no useEffect) ---------- */
interface ProfileFormProps {
  initial: {
    name: string;
    email: string;
    barNumber: string;
    chamberName: string;
    phone: string;
    address: string;
    role: string;
  };
}

function ProfileForm({ initial }: ProfileFormProps) {
  const { updateUserProfile } = useCases();
  const { updateProfile } = useAuth();

  const [name, setName] = useState(initial.name);
  const [email] = useState(initial.email);
  const [barNumber, setBarNumber] = useState(initial.barNumber);
  const [chamberName, setChamberName] = useState(initial.chamberName);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    <>
      {saved && (
        <div className="rounded-xl bg-[#16805D]/10 border border-[#16805D]/20 p-4 text-xs text-[#16805D] flex items-center gap-2 shadow-xs">
          <IconCheck className="w-4 h-4 flex-shrink-0" />
          <span>Advocate profile details saved successfully to database.</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl bg-[#C03945]/10 border border-[#C03945]/20 p-4 text-xs text-[#C03945] flex items-center gap-2 shadow-xs">
          <span className="font-bold">Error:</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form Card */}
      <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E9F2]/60 pb-4">
          <div>
            <h3 className="font-bold text-sm text-[#16325C]">Official Empaneled Advocate Profile</h3>
            <p className="text-xs text-[#66758A] mt-0.5">
              Credentials printed on Legal Scrutiny Reports (LSR) and bank requisition correspondence
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#16805D]/10 text-[#16805D] border border-[#16805D]/20 self-start sm:self-auto">
            <IconShield className="w-3.5 h-3.5" />
            <span>Identity Verified</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1.5">
                Full Advocate Name (with qualifications)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adv. First Last, LL.B."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9F2] text-xs text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1.5">
                Bar Council Enrolment Number
              </label>
              <input
                type="text"
                required
                value={barNumber}
                onChange={(e) => setBarNumber(e.target.value)}
                placeholder="e.g. KAR/1234/2018 or MAH/5678/2015"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9F2] font-mono text-xs text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1.5">
                Chamber / Law Firm Name
              </label>
              <input
                type="text"
                required
                value={chamberName}
                onChange={(e) => setChamberName(e.target.value)}
                placeholder="Chamber of Adv. Name & Associates"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9F2] text-xs text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1.5">
                Official Chamber Email
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] text-[#66758A] cursor-not-allowed text-xs"
                title="Email is anchored to your authenticated Supabase account"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1.5">
                Chamber Telephone / Mobile
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9F2] text-xs text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1.5">
                Advocate Role Designation
              </label>
              <input
                type="text"
                disabled
                value={initial.role}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] text-[#66758A] cursor-not-allowed text-xs font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#172B4D] mb-1.5">
                Chamber Office Postal Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Chamber #, High Court Lawyers Chambers or Office Address"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9F2] text-xs text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E3E9F2]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] text-[#66758A]">
              Secured via Supabase Auth &bull; Tied strictly to your User ID
            </span>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            >
              {saving ? "Saving to Database..." : "Save Chamber Profile"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* ---------- Page wrapper: derives initial values, uses key to reset form ---------- */
export default function SettingsProfilePage() {
  const { profile, user } = useAuth();

  // Build a stable key so ProfileForm remounts (re-initializes state) when profile loads
  const formKey = profile?.name || user?.id || "loading";

  const initial = (() => {
    if (profile) {
      return {
        name: profile.name || "",
        email: profile.email || user?.email || "",
        barNumber: profile.barEnrollmentNumber || "",
        chamberName: profile.chamberName || "",
        phone: profile.phone || "",
        address: profile.address || "",
        role: profile.role || "Senior Empaneled Advocate",
      };
    }
    if (user) {
      const meta = user.user_metadata || {};
      return {
        name: meta.full_name || meta.name || "",
        email: user.email || "",
        barNumber: meta.bar_enrollment_number || "",
        chamberName: meta.chamber_name || "",
        phone: meta.phone || "",
        address: meta.address || "",
        role: "Senior Empaneled Advocate",
      };
    }
    return { name: "", email: "", barNumber: "", chamberName: "", phone: "", address: "", role: "Senior Empaneled Advocate" };
  })();

  return (
    <AuthenticatedShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#16325C]">
            Chamber &amp; Advocate Settings
          </h1>
          <p className="text-xs text-[#66758A] mt-1">
            Manage advocate accreditation, official chamber credentials, and bank scrutiny rules.
          </p>
        </div>

        <SettingsTabs />
        <ProfileForm key={formKey} initial={initial} />
      </div>
    </AuthenticatedShell>
  );
}
