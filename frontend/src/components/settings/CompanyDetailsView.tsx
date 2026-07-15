/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Check, AlertCircle, Trash2, RefreshCw, ShieldAlert } from 'lucide-react';
import { companyApi, CompanyGroupMember } from '../../api/companyApi';
import { marketFromBackend, planFromBackend } from '../../api/mappers';
import { ApiError } from '../../api/client';

export default function CompanyDetailsView() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();

  const [members, setMembers] = useState<CompanyGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);
  const [switching, setSwitching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const showMessage = (text: string, type: 'success' | 'warning') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    companyApi.getGroup()
      .then(setMembers)
      .catch(() => showMessage('Failed to load company details.', 'warning'))
      .finally(() => setLoading(false));
  }, []);

  const company = members.find((m) => m.id === companyId);

  const handleSwitch = () => {
    if (!company || company.current) return;
    setSwitching(true);
    companyApi.switchCompany(company.id)
      .then(() => window.location.reload())
      .catch(() => {
        showMessage('Failed to switch companies — please try again.', 'warning');
        setSwitching(false);
      });
  };

  const handleDelete = () => {
    if (!company || deleteConfirmInput !== company.name) return;
    setDeleting(true);
    companyApi.deleteSubsidiary(company.id)
      .then(() => {
        showMessage(`${company.name} and all of its data were permanently deleted.`, 'success');
        navigate('/settings?tab=company');
      })
      .catch((err) => {
        showMessage(err instanceof ApiError ? err.message : 'Failed to remove the company — please try again.', 'warning');
        setConfirmDelete(false);
      })
      .finally(() => setDeleting(false));
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto pb-16">
      <button
        type="button"
        onClick={() => navigate('/settings?tab=company')}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Companies
      </button>

      {message && (
        <div className={`flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 mb-4 ${
          message.type === 'success' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-rose-600 bg-rose-50 border border-rose-100'
        }`}>
          {message.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !company ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-gray-300" />
          <h3 className="text-sm font-bold text-gray-900">Company not found</h3>
          <p className="text-xs text-gray-500 max-w-sm">It may have been removed, or you don&apos;t have access to it.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{company.name}</h2>
                {company.current ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {!company.current && (
              <button
                type="button"
                onClick={handleSwitch}
                disabled={switching}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-60 cursor-pointer transition-colors shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${switching ? 'animate-spin' : ''}`} />
                {switching ? 'Switching…' : 'Switch to this company'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/40">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Sector</span>
              <span className="text-sm font-semibold text-gray-900">{company.sectorCode ?? 'Not set'}</span>
            </div>
            <div className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/40">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Market</span>
              <span className="text-sm font-semibold text-gray-900">{marketFromBackend(company.marketClassification)}</span>
            </div>
            <div className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/40">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Plan</span>
              <span className="text-sm font-semibold text-gray-900">{planFromBackend(company.subscriptionPlan)}</span>
            </div>
          </div>

          {!company.current && (
            <div className="pt-4 border-t border-gray-100">
              {confirmDelete ? (
                <div className="border border-rose-100 bg-rose-50/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-900">Permanently delete {company.name}?</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    This deletes <strong>all</strong> of its data — indicators, materiality assessments, governance records, emissions, compliance policies, sign-offs, exports, and invoices. This cannot be undone.
                  </p>
                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      Type <span className="text-gray-900">{company.name}</span> to confirm
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={deleteConfirmInput}
                      onChange={(e) => setDeleteConfirmInput(e.target.value)}
                      placeholder={company.name}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-rose-400 transition-colors bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting || deleteConfirmInput !== company.name}
                      className="px-3 py-1.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg cursor-pointer"
                    >
                      {deleting ? 'Deleting…' : 'Permanently Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setConfirmDelete(false); setDeleteConfirmInput(''); }}
                      className="px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-700 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete this company
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
