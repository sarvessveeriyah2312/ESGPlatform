/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, RotateCcw, Check, AlertCircle, Loader2, Search } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { promptTemplateApi, PromptTemplateResponse } from '../../api/promptTemplateApi';
import { indicatorPromptApi, IndicatorPromptResponse } from '../../api/indicatorPromptApi';
import { useToast } from '../../contexts/ToastContext';

function groupLabel(draftType: string): string {
  const prefix = draftType.split('-')[0];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

export default function PromptLibraryTab() {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<PromptTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { systemPrompt: string; userPromptTemplate: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Indicator Extraction Prompts — a per-indicator override of "Extract with AI"'s prompt,
  // separate from the feature-level templates above (see IndicatorPromptService on the backend).
  const [indicatorPrompts, setIndicatorPrompts] = useState<IndicatorPromptResponse[]>([]);
  const [indicatorLoading, setIndicatorLoading] = useState(true);
  const [indicatorExpanded, setIndicatorExpanded] = useState<string | null>(null);
  const [indicatorDrafts, setIndicatorDrafts] = useState<Record<string, { systemPrompt: string; userPromptTemplate: string }>>({});
  const [indicatorSaving, setIndicatorSaving] = useState<string | null>(null);
  const [indicatorSearch, setIndicatorSearch] = useState('');

  const refresh = () => {
    setLoading(true);
    promptTemplateApi.list()
      .then((list) => {
        setTemplates(list);
        setDrafts(Object.fromEntries(list.map((t) => [t.draftType, { systemPrompt: t.systemPrompt, userPromptTemplate: t.userPromptTemplate }])));
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  const refreshIndicatorPrompts = () => {
    setIndicatorLoading(true);
    indicatorPromptApi.list()
      .then((list) => {
        setIndicatorPrompts(list);
        setIndicatorDrafts(Object.fromEntries(list.map((t) => [t.indicatorId, { systemPrompt: t.systemPrompt, userPromptTemplate: t.userPromptTemplate }])));
      })
      .catch((e) => console.error(e))
      .finally(() => setIndicatorLoading(false));
  };

  useEffect(() => { refresh(); refreshIndicatorPrompts(); }, []);

  const handleIndicatorToggle = (indicatorId: string) => setIndicatorExpanded(indicatorExpanded === indicatorId ? null : indicatorId);

  const handleIndicatorSave = (indicatorId: string) => {
    const draft = indicatorDrafts[indicatorId];
    if (!draft) return;
    setIndicatorSaving(indicatorId);
    indicatorPromptApi.update(indicatorId, draft)
      .then((updated) => {
        setIndicatorPrompts((prev) => prev.map((t) => (t.indicatorId === indicatorId ? updated : t)));
        showToast('Prompt saved.', 'success');
      })
      .catch((err) => showToast(err?.message || 'Failed to save prompt.', 'error'))
      .finally(() => setIndicatorSaving(null));
  };

  const handleIndicatorReset = (indicatorId: string) => {
    setIndicatorSaving(indicatorId);
    indicatorPromptApi.resetToDefault(indicatorId)
      .then((reset) => {
        setIndicatorPrompts((prev) => prev.map((t) => (t.indicatorId === indicatorId ? reset : t)));
        setIndicatorDrafts((prev) => ({ ...prev, [indicatorId]: { systemPrompt: reset.systemPrompt, userPromptTemplate: reset.userPromptTemplate } }));
        showToast('Reset to default.', 'success');
      })
      .catch((err) => showToast(err?.message || 'Failed to reset prompt.', 'error'))
      .finally(() => setIndicatorSaving(null));
  };

  const filteredIndicatorPrompts = indicatorPrompts.filter((t) => {
    const q = indicatorSearch.trim().toLowerCase();
    if (!q) return true;
    return t.indicatorName.toLowerCase().includes(q) || t.indicatorId.toLowerCase().includes(q) || t.unit.toLowerCase().includes(q);
  });

  const handleToggle = (draftType: string) => setExpanded(expanded === draftType ? null : draftType);

  const handleSave = (draftType: string) => {
    const draft = drafts[draftType];
    if (!draft) return;
    setSaving(draftType);
    promptTemplateApi.update(draftType, draft)
      .then((updated) => {
        setTemplates((prev) => prev.map((t) => (t.draftType === draftType ? updated : t)));
        showToast('Template saved.', 'success');
      })
      .catch((err) => showToast(err?.message || 'Failed to save template.', 'error'))
      .finally(() => setSaving(null));
  };

  const handleReset = (draftType: string) => {
    setSaving(draftType);
    promptTemplateApi.resetToDefault(draftType)
      .then((reset) => {
        setTemplates((prev) => prev.map((t) => (t.draftType === draftType ? reset : t)));
        setDrafts((prev) => ({ ...prev, [draftType]: { systemPrompt: reset.systemPrompt, userPromptTemplate: reset.userPromptTemplate } }));
        showToast('Reset to default.', 'success');
      })
      .catch((err) => showToast(err?.message || 'Failed to reset template.', 'error'))
      .finally(() => setSaving(null));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 max-w-2xl">
        These are the actual prompts sent to your configured AI provider for each "Draft with AI" feature and the Q&amp;A assistant. Placeholders like <code className="bg-gray-100 px-1 rounded">{'{{companyName}}'}</code> are filled in automatically from your company's data — don't remove one unless you mean to.
      </p>

      {templates.map((t) => {
        const isOpen = expanded === t.draftType;
        const draft = drafts[t.draftType] ?? { systemPrompt: t.systemPrompt, userPromptTemplate: t.userPromptTemplate };

        return (
          <Card key={t.draftType} className="bg-white border-gray-100 overflow-hidden" padded="none">
            <button
              onClick={() => handleToggle(t.draftType)}
              className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{groupLabel(t.draftType)}</span>
                    <h5 className="text-sm font-bold text-gray-900 truncate">{t.label}</h5>
                    {t.isCustomized && (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wider shrink-0">Customized</span>
                    )}
                  </div>
                  {t.description && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{t.description}</p>}
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">System Prompt</label>
                  <textarea
                    value={draft.systemPrompt}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [t.draftType]: { ...draft, systemPrompt: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 outline-none focus:border-emerald-500 transition-colors h-24 resize-y font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">User Prompt Template</label>
                  <textarea
                    value={draft.userPromptTemplate}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [t.draftType]: { ...draft, userPromptTemplate: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 outline-none focus:border-emerald-500 transition-colors h-32 resize-y font-mono"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleReset(t.draftType)}
                    loading={saving === t.draftType}
                    disabled={!t.isCustomized}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Reset to Default
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSave(t.draftType)}
                    loading={saving === t.draftType}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Save Template
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      <div className="pt-6 border-t border-gray-100 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Indicator Extraction Prompts</h4>
          <p className="text-xs text-gray-500 max-w-2xl mt-1">
            The prompt "Extract with AI" uses when reading an uploaded evidence document for a specific indicator. Every indicator shares one default unless you customize it here — useful for a computed/ratio indicator (e.g. one with a unit like <code className="bg-gray-100 px-1 rounded">MWh/RM mil</code>) that a single document can rarely satisfy, or to point the model at document-specific terminology (e.g. "look for 'Kegunaan kWh' on a TNB bill").
          </p>
        </div>

        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={indicatorSearch}
            onChange={(e) => setIndicatorSearch(e.target.value)}
            placeholder="Search indicators by name, ID or unit..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {indicatorLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : filteredIndicatorPrompts.length === 0 ? (
          <p className="text-xs text-gray-400 italic px-1">No indicators match "{indicatorSearch}".</p>
        ) : (
          <div className="space-y-3">
            {filteredIndicatorPrompts.map((t) => {
              const isOpen = indicatorExpanded === t.indicatorId;
              const draft = indicatorDrafts[t.indicatorId] ?? { systemPrompt: t.systemPrompt, userPromptTemplate: t.userPromptTemplate };

              return (
                <Card key={t.indicatorId} className="bg-white border-gray-100 overflow-hidden" padded="none">
                  <button
                    onClick={() => handleIndicatorToggle(t.indicatorId)}
                    className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{t.unit}</span>
                          <h5 className="text-sm font-bold text-gray-900 truncate">{t.indicatorName}</h5>
                          {t.isCustomized && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wider shrink-0">Customized</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">System Prompt</label>
                        <textarea
                          value={draft.systemPrompt}
                          onChange={(e) => setIndicatorDrafts((prev) => ({ ...prev, [t.indicatorId]: { ...draft, systemPrompt: e.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 outline-none focus:border-emerald-500 transition-colors h-24 resize-y font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">User Prompt Template</label>
                        <textarea
                          value={draft.userPromptTemplate}
                          onChange={(e) => setIndicatorDrafts((prev) => ({ ...prev, [t.indicatorId]: { ...draft, userPromptTemplate: e.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 outline-none focus:border-emerald-500 transition-colors h-32 resize-y font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleIndicatorReset(t.indicatorId)}
                          loading={indicatorSaving === t.indicatorId}
                          disabled={!t.isCustomized}
                          icon={<RotateCcw className="w-3.5 h-3.5" />}
                        >
                          Reset to Default
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleIndicatorSave(t.indicatorId)}
                          loading={indicatorSaving === t.indicatorId}
                          icon={<Check className="w-3.5 h-3.5" />}
                        >
                          Save Prompt
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
