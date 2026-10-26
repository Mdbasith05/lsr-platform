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
            <h1 className="text-2xl font-bold tracking-tight text-[#10233F]">
              Chamber &amp; Advocate Settings
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure bank-specific scrutiny checklist rules, chain limits, and mandatory documents.
            </p>
          </div>
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
            className="pb-3 text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors"
          >
            <IconUsers className="w-4 h-4" />
            <span>Chamber Team &amp; Roles</span>
          </Link>
          <Link
            href="/settings/templates"
            className="pb-3 border-b-2 border-[#356AE6] text-[#356AE6] flex items-center gap-2"
          >
            <IconSettings className="w-4 h-4" />
            <span>Bank Scrutiny Checklists</span>
          </Link>
        </div>

        {/* Guidance Notice */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3">
          <IconShield className="w-5 h-5 text-[#356AE6] flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-semibold text-[#10233F]">
              Configurable Legal Rule Templates (No Hardcoded Assumptions):
            </strong>
            <p className="text-blue-900/80 leading-relaxed text-[11px]">
              Every lending institution specifies its own statutory minimums (e.g. 30-year unbroken chain vs 13-year statutory limitation) and mandatory local revenue certificates. Adjust parameters below to customize the scrutiny checklist for each bank.
            </p>
          </div>
        </div>

        {/* Templates List */}
        <div className="space-y-6">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#10233F]">{tmpl.title}</h3>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{tmpl.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">
                    Jurisdiction: {tmpl.stateJurisdiction}
                  </span>
                </div>
              </div>

              {/* Scrutiny Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 block">
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
                        className="w-20 p-1.5 rounded border border-slate-300 bg-white font-mono text-xs"
                      />
                      <span className="text-slate-600">Years</span>
                    </div>
                  ) : (
                    <span className="font-bold font-mono text-base text-[#10233F]">
                      {tmpl.minChainYears} Years Devolution
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Devolution from mother deed through current conveyance
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 block">
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
                        className="w-20 p-1.5 rounded border border-slate-300 bg-white font-mono text-xs"
                      />
                      <span className="text-slate-600">Years</span>
                    </div>
                  ) : (
                    <span className="font-bold font-mono text-base text-[#10233F]">
                      {tmpl.minEcYears} Years Continuous EC
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Unbroken jurisdictional Nil Encumbrance Certificate
                  </p>
                </div>
              </div>

              {/* Mandatory Checklist Documents */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-slate-700 block">
                  Mandatory Documents Checklist ({tmpl.mandatoryDocuments.length} Required):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tmpl.mandatoryDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-800">{doc}</span>
                      {editingTemplateId === tmpl.id && (
                        <button
                          onClick={() => handleRemoveDocFromTemplate(tmpl, idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
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
                      className="flex-1 p-2 rounded-lg border border-slate-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddDocToTemplate(tmpl)}
                      className="px-3 py-1.5 bg-[#356AE6] text-white rounded-lg font-semibold text-xs"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Template Controls */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                {editingTemplateId === tmpl.id ? (
                  <>
                    <button
                      onClick={() => setEditingTemplateId(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(tmpl)}
                      className="px-4 py-1.5 rounded-lg bg-[#16805D] text-white font-semibold flex items-center gap-1"
                    >
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>Save Parameters</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(tmpl)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Edit Template Parameters
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
