/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Building2, Landmark, Contact } from 'lucide-react';
import { companyApi, CompanyGroupMember, CreateSubsidiaryRequest, ListingBoard, CompanyType } from '../../api/companyApi';
import { referenceApi, SectorResponse } from '../../api/referenceApi';
import { ApiError } from '../../api/client';

interface AddCompanyModalProps {
  onClose: () => void;
  onCreated: (company: CompanyGroupMember) => void;
}

export const LISTING_BOARDS: { value: ListingBoard; label: string }[] = [
  { value: 'MAIN_MARKET', label: 'Main Market' },
  { value: 'ACE_MARKET', label: 'ACE Market' },
  { value: 'LEAP_MARKET', label: 'LEAP Market' },
  { value: 'PRIVATE', label: 'Private (unlisted)' },
  { value: 'OTHER', label: 'Other' },
];

export const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: 'PUBLIC_LISTED', label: 'Public Listed' },
  { value: 'PRIVATE_LIMITED', label: 'Private Limited (Sdn Bhd)' },
  { value: 'SUBSIDIARY', label: 'Subsidiary' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
  { value: 'OTHER', label: 'Other' },
];

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-500 transition-colors bg-white';
const labelClass = 'text-xs font-semibold text-gray-700';

export default function AddCompanyModal({ onClose, onCreated }: AddCompanyModalProps) {
  const [sectors, setSectors] = useState<SectorResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identity
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [tickerCode, setTickerCode] = useState('');
  const [dateOfIncorporation, setDateOfIncorporation] = useState('');
  const [countryOfIncorporation, setCountryOfIncorporation] = useState('Malaysia');

  // Classification
  const [sectorCode, setSectorCode] = useState('');
  const [listingBoard, setListingBoard] = useState<ListingBoard | ''>('');
  const [companyType, setCompanyType] = useState<CompanyType | ''>('');

  // Contact & Location
  const [registeredOfficeAddress, setRegisteredOfficeAddress] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonDesignation, setContactPersonDesignation] = useState('');
  const [contactPersonEmail, setContactPersonEmail] = useState('');
  const [contactPersonPhone, setContactPersonPhone] = useState('');
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState('');

  useEffect(() => {
    referenceApi.sectors().then(setSectors).catch(() => setSectors([]));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const canSubmit = name.trim().length > 0 && !submitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const payload: CreateSubsidiaryRequest = {
      name: name.trim(),
      sectorCode: sectorCode || undefined,
      registrationNumber: registrationNumber.trim() || undefined,
      tickerCode: tickerCode.trim() || undefined,
      dateOfIncorporation: dateOfIncorporation || undefined,
      countryOfIncorporation: countryOfIncorporation || undefined,
      listingBoard: listingBoard || undefined,
      companyType: companyType || undefined,
      registeredOfficeAddress: registeredOfficeAddress.trim() || undefined,
      businessAddress: businessAddress.trim() || undefined,
      contactPersonName: contactPersonName.trim() || undefined,
      contactPersonDesignation: contactPersonDesignation.trim() || undefined,
      contactPersonEmail: contactPersonEmail.trim() || undefined,
      contactPersonPhone: contactPersonPhone.trim() || undefined,
      taxIdentificationNumber: taxIdentificationNumber.trim() || undefined,
    };

    companyApi.createSubsidiary(payload)
      .then((created) => {
        onCreated(created);
        onClose();
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to add the company — please try again.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-gray-950/40 backdrop-blur-xs" />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fade-in"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">Add Company</h3>
            <p className="text-xs text-gray-500 mt-0.5">Register a subsidiary or group entity in your workspace.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="space-y-3">
              <div className="flex items-center gap-1.5 text-gray-900">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wide">Identity</h4>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Company name<span className="text-rose-500"> *</span></label>
                <input type="text" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. EsgEasy Green Tech Sdn Bhd" className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Registration number (SSM)</label>
                <input type="text" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="e.g. 202401012345" className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Stock / ticker code</label>
                <input type="text" value={tickerCode} onChange={(e) => setTickerCode(e.target.value.toUpperCase())} placeholder="If listed, e.g. 5347" className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Date of incorporation</label>
                <input type="date" value={dateOfIncorporation} onChange={(e) => setDateOfIncorporation(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Country of incorporation</label>
                <select value={countryOfIncorporation} onChange={(e) => setCountryOfIncorporation(e.target.value)} className={`${inputClass} cursor-pointer`}>
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
                <select value={sectorCode} onChange={(e) => setSectorCode(e.target.value)} className={`${inputClass} cursor-pointer`}>
                  <option value="">Select a sector…</option>
                  {sectors.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Market / board</label>
                <select value={listingBoard} onChange={(e) => setListingBoard(e.target.value as ListingBoard | '')} className={`${inputClass} cursor-pointer`}>
                  <option value="">Select a board…</option>
                  {LISTING_BOARDS.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Company type</label>
                <select value={companyType} onChange={(e) => setCompanyType(e.target.value as CompanyType | '')} className={`${inputClass} cursor-pointer`}>
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
                <textarea value={registeredOfficeAddress} onChange={(e) => setRegisteredOfficeAddress(e.target.value)} rows={2} placeholder="Legal registered address" className={`${inputClass} resize-none`} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Business address <span className="text-gray-400 font-normal">(if different)</span></label>
                <textarea value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} rows={2} placeholder="Operational address" className={`${inputClass} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={labelClass}>Contact person</label>
                  <input type="text" value={contactPersonName} onChange={(e) => setContactPersonName(e.target.value)} placeholder="Full name" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Designation</label>
                  <input type="text" value={contactPersonDesignation} onChange={(e) => setContactPersonDesignation(e.target.value)} placeholder="e.g. CFO" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={labelClass}>Contact email</label>
                  <input type="email" value={contactPersonEmail} onChange={(e) => setContactPersonEmail(e.target.value)} placeholder="name@company.com" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Contact phone</label>
                  <input type="tel" value={contactPersonPhone} onChange={(e) => setContactPersonPhone(e.target.value)} placeholder="+60 12-345 6789" className={inputClass} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Tax Identification Number (TIN)</label>
                <input type="text" value={taxIdentificationNumber} onChange={(e) => setTaxIdentificationNumber(e.target.value)} placeholder="e.g. C1234567890" className={inputClass} />
              </div>
            </section>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full cursor-pointer transition-all shadow-sm"
          >
            {submitting ? 'Adding…' : 'Add Company'}
          </button>
        </div>
      </form>
    </div>
  );
}
