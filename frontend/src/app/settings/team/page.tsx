"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import {
  IconUser,
  IconUsers,
  IconSettings,
  IconPlus,
  IconShield,
  IconCheck,
  IconX,
} from "@/components/icons";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Senior Empaneled Advocate" | "Associate Advocate" | "Legal Assistant";
  status: "Active" | "Invited";
  canSignReports: boolean;
}

export default function SettingsTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "mem-1",
      name: "Adv. K. R. Sreenivasan",
      email: "sreenivasan.legal@lsr-platform.local",
      role: "Senior Empaneled Advocate",
      status: "Active",
      canSignReports: true,
    },
    {
      id: "mem-2",
      name: "Adv. Lakshmi Narayanan",
      email: "lakshmi.narayanan@lsr-platform.local",
      role: "Associate Advocate",
      status: "Active",
      canSignReports: false,
    },
    {
      id: "mem-3",
      name: "Rahul V. Deshpande",
      email: "rahul.paralegal@lsr-platform.local",
      role: "Legal Assistant",
      status: "Active",
      canSignReports: false,
    },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"Associate Advocate" | "Legal Assistant">("Associate Advocate");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newMem: TeamMember = {
      id: `mem-${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      status: "Invited",
      canSignReports: false,
    };

    setMembers([...members, newMem]);
    setNewName("");
    setNewEmail("");
    setShowInviteModal(false);
  };

  return (
    <AuthenticatedShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#10233F]">
              Chamber &amp; Advocate Settings
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage advocate accreditation, legal team roles, and bank policy templates.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <IconPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-semibold space-x-6">
          <Link
            href="/settings/profile"
            className="pb-3 text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors"
          >
            <IconUser className="w-4 h-4" />
            <span>Advocate Profile</span>
          </Link>
          <Link
            href="/settings/team"
            className="pb-3 border-b-2 border-[#356AE6] text-[#356AE6] flex items-center gap-2"
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

        {/* Team Members List */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#10233F]">
              Active Chamber Associates ({members.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Mock Role Presentation • Role-based access enforcement deferred
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Chamber Role</th>
                  <th className="py-3 px-4">Report Sign-Off Authority</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{m.name}</span>
                      <span className="text-[10px] text-slate-400">{m.email}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{m.role}</td>
                    <td className="py-3 px-4">
                      {m.canSignReports ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16805D] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <IconCheck className="w-3 h-3" />
                          <span>Sole Sign-Off Power</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Draft Preparation Only</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.status === "Active"
                            ? "bg-emerald-50 text-[#16805D] border border-emerald-200"
                            : "bg-blue-50 text-[#356AE6] border border-blue-200"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roles & Permissions Explanation Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <IconShield className="w-4 h-4 text-[#356AE6]" />
            <h4 className="font-bold text-slate-900">Legal Governance Principles</h4>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            In accordance with legal scrutiny compliance, only empaneled Senior Advocates holding valid Bar Council enrollments have authority to sign and issue binding Legal Scrutiny Reports to banking institutions. Associate Advocates and Paralegals can perform preliminary document classification, cross-check boundary recitals, and formulate draft bank queries.
          </p>
        </div>

        {/* Modal: Invite Team Member */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-[#10233F]">Invite Chamber Member</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Associate Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adv. Naveen Rao"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Associate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="naveen@chambers.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Chamber Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "Associate Advocate" | "Legal Assistant")}
                    className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                  >
                    <option value="Associate Advocate">Associate Advocate (Scrutiny &amp; Queries)</option>
                    <option value="Legal Assistant">Legal Assistant (Document Intake)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white font-semibold"
                  >
                    Send Mock Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
}
