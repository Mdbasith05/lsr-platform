"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { ScrutinyRuleTemplate } from "@/types";
import {
  IconUser,
  IconUsers,
  IconSettings,
  IconCheck,
  IconShield,
  IconX,
  IconSliders,
} from "@/components/icons";

export default function SettingsTemplatesPage() {
  const { templates, updateTemplate } = useCases();

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [minChain, setMinChain] = useState<number>(30);
  const [minEc, setMinEc] = useState<number>(30);
  const [newDocText, setNewDocText] = useState("");

  const startEdit = (tmpl: ScrutinyRuleTemplate) => {
    setEditingTemplateId(tmpl.id);
    setMinChain(tmpl.minChainYears);
    setMinEc(tmpl.minEcYears);
  };

  const saveEdit = (tmpl: ScrutinyRuleTemplate) => {
    updateTemplate(tmpl.id, {
      minChainYears: minChain,
      minEcYears: minEc,
    });
    setEditingTemplateId(null);
  };

  const handleAddDocToTemplate = (tmpl: ScrutinyRuleTemplate) => {
    if (!newDocText.trim()) return;
    const updatedDocs = [...tmpl.mandatoryDocuments, newDocText.trim()];
    updateTemplate(tmpl.id, { mandatoryDocuments: updatedDocs });
    setNewDocText("");
  };

  const handleRemoveDocFromTemplate = (tmpl: ScrutinyRuleTemplate, indexToRemove: number) => {
    const updatedDocs = tmpl.mandatoryDocuments.filter((_, idx) => idx !== indexToRemove);
    updateTemplate(tmpl.id, { mandatoryDocuments: updatedDocs });
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
              Configure bank-specific scrutiny checklist rules, chain limits, and mandatory documents.
            </p>
          </div>
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
            className="pb-3 text-[#66758A] hover:text-[#172B4D] flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <IconUsers className="w-4 h-4" />
            <span>Chamber Team &amp; Roles</span>
          </Link>
          <Link
            href="/settings/templates"
            className="pb-3 border-b-2 border-[#2457C5] text-[#2457C5] flex items-center gap-2 whitespace-nowrap"
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

        {/* Guidance Notice */}
        <div className="rounded-xl border border-[#2457C5]/20 bg-[#EEF4FF] p-4 text-xs text-[#16325C] flex items-start gap-3 shadow-xs">
          <IconShield className="w-5 h-5 text-[#2457C5] flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold text-[#16325C]">
              Configurable Legal Rule Templates (Bank Policy Compliant):
            </strong>
            <p className="text-[#16325C]/80 leading-relaxed text-[11px]">
              Every lending institution specifies its own statutory minimums (e.g. 30-year unbroken chain vs 13-year statutory limitation) and mandatory local revenue certificates. Adjust parameters below to customize the scrutiny checklist for each bank.
            </p>
          </div>
        </div>

        {/* Templates List */}
        <div className="space-y-6">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-6 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E9F2]/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#16325C]">{tmpl.title}</h3>
                    <span className="text-[10px] font-semibold text-[#2457C5] bg-[#EEF4FF] border border-[#2457C5]/20 px-2 py-0.5 rounded">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#66758A] mt-0.5">{tmpl.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-[#66758A] bg-[#F7F9FC] border border-[#E3E9F2] px-2.5 py-1 rounded-xl">
                    Jurisdiction: {tmpl.stateJurisdiction}
                  </span>
                </div>
              </div>

              {/* Scrutiny Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E3E9F2] space-y-1">
                  <span className="text-[11px] font-semibold text-[#66758A] block">
                    Minimum Chain of Title Period:
                  </span>
                  {editingTemplateId === tmpl.id ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        min={10}
                        max={60}
                        value={minChain}
                        onChange={(e) => setMinChain(Number(e.target.value))}
                        className="w-20 px-2 py-1.5 rounded-xl border border-[#E3E9F2] bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
                      />
                      <span className="text-[#66758A]">Years</span>
                    </div>
                  ) : (
                    <span className="font-bold font-mono text-base text-[#16325C]">
                      {tmpl.minChainYears} Years Devolution
                    </span>
                  )}
                  <p className="text-[10px] text-[#66758A]">
                    Devolution from mother deed through current conveyance
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E3E9F2] space-y-1">
                  <span className="text-[11px] font-semibold text-[#66758A] block">
                    Minimum Form 15 Encumbrance Search:
                  </span>
                  {editingTemplateId === tmpl.id ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        min={10}
                        max={60}
                        value={minEc}
                        onChange={(e) => setMinEc(Number(e.target.value))}
                        className="w-20 px-2 py-1.5 rounded-xl border border-[#E3E9F2] bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
                      />
                      <span className="text-[#66758A]">Years</span>
                    </div>
                  ) : (
                    <span className="font-bold font-mono text-base text-[#16325C]">
                      {tmpl.minEcYears} Years Continuous EC
                    </span>
                  )}
                  <p className="text-[10px] text-[#66758A]">
                    Unbroken jurisdictional Nil Encumbrance Certificate
                  </p>
                </div>
              </div>

              {/* Mandatory Checklist Documents */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-[#172B4D] block">
                  Mandatory Documents Checklist ({tmpl.mandatoryDocuments.length} Required):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tmpl.mandatoryDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] flex items-center justify-between text-xs"
                    >
                      <span className="text-[#172B4D]">{doc}</span>
                      {editingTemplateId === tmpl.id && (
                        <button
                          onClick={() => handleRemoveDocFromTemplate(tmpl, idx)}
                          className="text-[#66758A] hover:text-[#C03945] p-1 rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <IconX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {editingTemplateId === tmpl.id && (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add another mandatory document (e.g. Village Map demarcation)..."
                      value={newDocText}
                      onChange={(e) => setNewDocText(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E3E9F2] text-xs focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddDocToTemplate(tmpl)}
                      className="px-4 py-2 bg-[#2457C5] hover:bg-[#1B449E] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Template Controls */}
              <div className="pt-3 border-t border-[#E3E9F2]/60 flex items-center justify-end gap-2 text-xs">
                {editingTemplateId === tmpl.id ? (
                  <>
                    <button
                      onClick={() => setEditingTemplateId(null)}
                      className="px-4 py-2 rounded-xl border border-[#E3E9F2] text-[#66758A] hover:bg-[#F7F9FC] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(tmpl)}
                      className="px-5 py-2 rounded-xl bg-[#16805D] hover:bg-[#126b4d] text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>Save Parameters</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(tmpl)}
                    className="px-4 py-2 rounded-xl bg-[#F7F9FC] hover:bg-[#E3E9F2] text-[#172B4D] font-bold border border-[#E3E9F2] transition-colors cursor-pointer"
                  >
                    Configure Rules
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AuthenticatedShell>
  );
}
