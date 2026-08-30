/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Landmark, Contact, Pencil, Check, AlertCircle, Trash2, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { companyApi, CompanyGroupMember, CreateSubsidiaryRequest, ListingBoard, CompanyType } from '../../api/companyApi';
import { referenceApi, SectorResponse } from '../../api/referenceApi';
import { marketFromBackend, planFromBackend } from '../../api/mappers';
import { ApiError } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { LISTING_BOARDS, COMPANY_TYPES } from './AddCompanyModal';

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-500 transition-colors bg-white';
const labelClass = 'text-xs font-semibold text-gray-700';

interface EditForm {
  name: string;
  sectorCode: string;
  registrationNumber: string;
  tickerCode: string;
  dateOfIncorporation: string;
  countryOfIncorporation: string;
  listingBoard: ListingBoard | '';
  companyType: CompanyType | '';
  registeredOfficeAddress: string;
  businessAddress: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  taxIdentificationNumber: string;
}

const formFromCompany = (company: CompanyGroupMember): EditForm => ({
  name: company.name,
  sectorCode: company.sectorCode ?? '',
  registrationNumber: company.registrationNumber ?? '',
  tickerCode: company.tickerCode ?? '',
  dateOfIncorporation: company.dateOfIncorporation ? company.dateOfIncorporation.slice(0, 10) : '',
  countryOfIncorporation: company.countryOfIncorporation ?? '',
  listingBoard: company.listingBoard ?? '',
  companyType: company.companyType ?? '',
  registeredOfficeAddress: company.registeredOfficeAddress ?? '',
  businessAddress: company.businessAddress ?? '',
  contactPersonName: company.contactPersonName ?? '',
  contactPersonDesignation: company.contactPersonDesignation ?? '',
  contactPersonEmail: company.contactPersonEmail ?? '',
  contactPersonPhone: company.contactPersonPhone ?? '',
  taxIdentificationNumber: company.taxIdentificationNumber ?? '',
});

export default function CompanyDetailsView() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { showToast } = useToast();

  const [members, setMembers] = useState<CompanyGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [sectors, setSectors] = useState<SectorResponse[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);

  useEffect(() => {
    companyApi.getGroup()
      .then(setMembers)
      .catch(() => showToast('Failed to load company details.', 'error'))
      .finally(() => setLoading(false));
    referenceApi.sectors().then(setSectors).catch(() => setSectors([]));
  }, []);

  const company = members.find((m) => m.id === companyId);

  const formatDate = (value: string | null): string =>
    value ? new Date(value).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const listingBoardLabel = (value: string | null): string =>
    LISTING_BOARDS.find((b) => b.value === value)?.label ?? '—';

  const companyTypeLabel = (value: string | null): string =>
    COMPANY_TYPES.find((t) => t.value === value)?.label ?? '—';

  const handleSwitch = () => {
    if (!company || company.current) return;
    setSwitching(true);
    companyApi.switchCompany(company.id)
      .then(() => window.location.reload())
      .catch(() => {
        showToast('Failed to switch companies — please try again.', 'error');
        setSwitching(false);
      });
  };

  const handleStartEdit = () => {
    if (!company) return;
    setForm(formFromCompany(company));
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const updateField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSaveEdit = () => {
    if (!company || !form || !form.name.trim()) return;
    setSaving(true);

    const payload: CreateSubsidiaryRequest = {
      name: form.name.trim(),
      sectorCode: form.sectorCode || undefined,
      registrationNumber: form.registrationNumber.trim() || undefined,
      tickerCode: form.tickerCode.trim() || undefined,
      dateOfIncorporation: form.dateOfIncorporation || undefined,
      countryOfIncorporation: form.countryOfIncorporation.trim() || undefined,
      listingBoard: form.listingBoard || undefined,
      companyType: form.companyType || undefined,
      registeredOfficeAddress: form.registeredOfficeAddress.trim() || undefined,
      businessAddress: form.businessAddress.trim() || undefined,
      contactPersonName: form.contactPersonName.trim() || undefined,
      contactPersonDesignation: form.contactPersonDesignation.trim() || undefined,
      contactPersonEmail: form.contactPersonEmail.trim() || undefined,
      contactPersonPhone: form.contactPersonPhone.trim() || undefined,
      taxIdentificationNumber: form.taxIdentificationNumber.trim() || undefined,
    };

    companyApi.updateCompanyDetails(company.id, payload)
      .then((updated) => {
        setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setEditing(false);
        setForm(null);
        showToast('Company details saved.', 'success');
      })
      .catch((err) => showToast(err instanceof ApiError ? err.message : 'Failed to save company details — please try again.', 'error'))
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!company || deleteConfirmInput !== company.name) return;
    setDeleting(true);
    companyApi.deleteSubsidiary(company.id)
      .then(() => {
        showToast(`${company.name} and all of its data were permanently deleted.`, 'success');
        navigate('/settings?tab=company');
      })
      .catch((err) => {
        showToast(err instanceof ApiError ? err.message : 'Failed to remove the company — please try again.', 'error');
        setConfirmDelete(false);
      })
      .finally(() => setDeleting(false));
  };

  return (
    <div className="w-full pb-16">
      <button
        type="button"
        onClick={() => navigate('/settings?tab=company')}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Companies
      </button>

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
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                {editing && form ? (
                  <input
                    type="text"
                    autoFocus
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Company name"
                    className="text-lg font-bold text-gray-900 border-b border-gray-200 focus:border-emerald-500 outline-none bg-transparent transition-colors w-full max-w-sm"
                  />
                ) : (
                  <h2 className="text-lg font-bold text-gray-900 truncate">{company.name}</h2>
                )}
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

            <div className="flex items-center gap-2 shrink-0">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 rounded-full cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={saving || !form?.name.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-full cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Details
                  </button>
                  {!company.current && (
                    <button
                      type="button"
                      onClick={handleSwitch}
                      disabled={switching}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-60 cursor-pointer transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${switching ? 'animate-spin' : ''}`} />
                      {switching ? 'Switching…' : 'Switch to this company'}
                    </button>
                  )}
                </>
              )}
            </div>
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

          {editing && form ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
              <section className="space-y-3">
                <div className="flex items-center gap-1.5 text-gray-900">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wide">Identity</h4>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Registration number (SSM)</label>
                  <input type="text" value={form.registrationNumber} onChange={(e) => updateField('registrationNumber', e.target.value)} placeholder="e.g. 202401012345" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Stock / ticker code</label>
                  <input type="text" value={form.tickerCode} onChange={(e) => updateField('tickerCode', e.target.value.toUpperCase())} placeholder="If listed, e.g. 5347" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Date of incorporation</label>
                  <input type="date" value={form.dateOfIncorporation} onChange={(e) => updateField('dateOfIncorporation', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Country of incorporation</label>
                  <select value={form.countryOfIncorporation} onChange={(e) => updateField('countryOfIncorporation', e.target.value)} className={`${inputClass} cursor-pointer`}>
                    <option value="">Select a country…</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Other">Other International</option>
                  </select>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-1.5 text-gray-900">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wide">Classification</h4>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Industry / sector</label>
                  <select value={form.sectorCode} onChange={(e) => updateField('sectorCode', e.target.value)} className={`${inputClass} cursor-pointer`}>
                    <option value="">Select a sector…</option>
                    {sectors.map((s) => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Market / board</label>
                  <select value={form.listingBoard} onChange={(e) => updateField('listingBoard', e.target.value as ListingBoard | '')} className={`${inputClass} cursor-pointer`}>
                    <option value="">Select a board…</option>
                    {LISTING_BOARDS.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Company type</label>
                  <select value={form.companyType} onChange={(e) => updateField('companyType', e.target.value as CompanyType | '')} className={`${inputClass} cursor-pointer`}>
                    <option value="">Select a type…</option>
                    {COMPANY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-1.5 text-gray-900">
                  <Contact className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wide">Contact &amp; Location</h4>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Registered office address</label>
                  <textarea value={form.registeredOfficeAddress} onChange={(e) => updateField('registeredOfficeAddress', e.target.value)} rows={2} placeholder="Legal registered address" className={`${inputClass} resize-none`} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Business address <span className="text-gray-400 font-normal">(if different)</span></label>
                  <textarea value={form.businessAddress} onChange={(e) => updateField('businessAddress', e.target.value)} rows={2} placeholder="Operational address" className={`${inputClass} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className={labelClass}>Contact person</label>
                    <input type="text" value={form.contactPersonName} onChange={(e) => updateField('contactPersonName', e.target.value)} placeholder="Full name" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Designation</label>
                    <input type="text" value={form.contactPersonDesignation} onChange={(e) => updateField('contactPersonDesignation', e.target.value)} placeholder="e.g. CFO" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className={labelClass}>Contact email</label>
                    <input type="email" value={form.contactPersonEmail} onChange={(e) => updateField('contactPersonEmail', e.target.value)} placeholder="name@company.com" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Contact phone</label>
                    <input type="tel" value={form.contactPersonPhone} onChange={(e) => updateField('contactPersonPhone', e.target.value)} placeholder="+60 12-345 6789" className={inputClass} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Tax Identification Number (TIN)</label>
                  <input type="text" value={form.taxIdentificationNumber} onChange={(e) => updateField('taxIdentificationNumber', e.target.value)} placeholder="e.g. C1234567890" className={inputClass} />
                </div>
              </section>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Identity</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Registration number</dt>
                    <dd className="text-gray-900">{company.registrationNumber ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stock / ticker code</dt>
                    <dd className="text-gray-900">{company.tickerCode ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date of incorporation</dt>
                    <dd className="text-gray-900">{formatDate(company.dateOfIncorporation)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Country of incorporation</dt>
                    <dd className="text-gray-900">{company.countryOfIncorporation ?? '—'}</dd>
                  </div>
                </dl>
              </section>

              <section className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Classification</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Market / board</dt>
                    <dd className="text-gray-900">{listingBoardLabel(company.listingBoard)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Company type</dt>
                    <dd className="text-gray-900">{companyTypeLabel(company.companyType)}</dd>
                  </div>
                </dl>
              </section>

              <section className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Contact &amp; Location</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Registered office address</dt>
                    <dd className="text-gray-900 whitespace-pre-line">{company.registeredOfficeAddress ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Business address</dt>
                    <dd className="text-gray-900 whitespace-pre-line">{company.businessAddress ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact person</dt>
                    <dd className="text-gray-900">
                      {company.contactPersonName ?? '—'}
                      {company.contactPersonDesignation && <span className="text-gray-400"> · {company.contactPersonDesignation}</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact email</dt>
                    <dd className="text-gray-900">{company.contactPersonEmail ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact phone</dt>
                    <dd className="text-gray-900">{company.contactPersonPhone ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tax Identification Number (TIN)</dt>
                    <dd className="text-gray-900">{company.taxIdentificationNumber ?? '—'}</dd>
                  </div>
                </dl>
              </section>
            </div>
          )}

          {!editing && !company.current && (
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
