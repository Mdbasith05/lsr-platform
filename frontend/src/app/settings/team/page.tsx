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
  IconSliders,
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
            <h1 className="text-2xl font-extrabold tracking-tight text-[#16325C]">
              Chamber &amp; Advocate Settings
            </h1>
            <p className="text-xs text-[#66758A] mt-1">
              Manage advocate accreditation, legal team roles, and bank policy templates.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-md shadow-[#2457C5]/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <IconPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-[#E3E9F2] text-xs font-semibold space-x-6 overflow-x-auto pb-px">
          <Link
            href="/settings/profile"
            className="pb-3 text-[#66758A] hover:text-[#172B4D] flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <IconUser className="w-4 h-4" />
            <span>Advocate Profile</span>
          </Link>
          <Link
            href="/settings/team"
            className="pb-3 border-b-2 border-[#2457C5] text-[#2457C5] flex items-center gap-2 whitespace-nowrap"
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

        {/* Team Members List */}
        <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs overflow-hidden">
          <div className="p-4.5 border-b border-[#E3E9F2] bg-[#F7F9FC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#16325C]">
              Active Chamber Associates ({members.length})
            </h3>
            <span className="text-[11px] text-[#66758A]">
              Role-based access enforcement aligned with Bar Council standards
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F9FC] border-b border-[#E3E9F2] text-[11px] font-semibold text-[#66758A] uppercase tracking-wider">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Chamber Role</th>
                  <th className="py-3 px-4">Report Sign-Off Authority</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E9F2]">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F7F9FC] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#16325C] block">{m.name}</span>
                      <span className="text-[10px] text-[#66758A] font-mono">{m.email}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#172B4D] font-medium">{m.role}</td>
                    <td className="py-3.5 px-4">
                      {m.canSignReports ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16805D] bg-[#16805D]/10 px-2 py-0.5 rounded border border-[#16805D]/20">
                          <IconCheck className="w-3 h-3" />
                          <span>Sole Sign-Off Power</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#66758A]">Draft Preparation Only</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.status === "Active"
                            ? "bg-[#16805D]/10 text-[#16805D] border border-[#16805D]/20"
                            : "bg-[#EEF4FF] text-[#2457C5] border border-[#2457C5]/20"
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
        <div className="bg-white rounded-2xl border border-[#E3E9F2] p-6 space-y-3 text-xs text-[#66758A] shadow-xs">
          <div className="flex items-center gap-2">
            <IconShield className="w-4 h-4 text-[#2457C5]" />
            <h4 className="font-bold text-[#16325C]">Legal Governance Principles</h4>
          </div>
          <p className="text-[11px] leading-relaxed text-[#66758A]">
            In accordance with legal scrutiny compliance, only empaneled Senior Advocates holding valid Bar Council enrollments have authority to sign and issue binding Legal Scrutiny Reports to banking institutions. Associate Advocates and Paralegals can perform preliminary document classification, cross-check boundary recitals, and formulate draft bank queries.
          </p>
        </div>

        {/* Modal: Invite Team Member */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#E3E9F2] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E3E9F2] pb-3">
                <h3 className="font-bold text-sm text-[#16325C]">Invite Chamber Member</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 rounded-lg text-[#66758A] hover:bg-[#F7F9FC] transition-colors"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">
                    Associate Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adv. Naveen Rao"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E3E9F2] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">
                    Associate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="naveen@chambers.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E3E9F2] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">
                    Assigned Chamber Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "Associate Advocate" | "Legal Assistant")}
                    className="w-full px-3 py-2 rounded-xl border border-[#E3E9F2] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5] bg-white text-[#172B4D]"
                  >
                    <option value="Associate Advocate">Associate Advocate (Scrutiny &amp; Queries)</option>
                    <option value="Legal Assistant">Legal Assistant (Document Intake)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E3E9F2]">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-[#66758A] hover:bg-[#F7F9FC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white font-bold cursor-pointer transition-colors"
                  >
                    Send Invitation
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
