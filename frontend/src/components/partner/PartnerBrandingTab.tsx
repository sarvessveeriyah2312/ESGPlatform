/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, Image as ImageIcon, ShieldCheck, Mail, Send } from 'lucide-react';
import { partnerConsoleApi, UpdatePartnerBrandingRequest } from '../../api/partnerConsoleApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../ui/Button';

const DEFAULT_COLOR = '#10B981';
const EMPTY: UpdatePartnerBrandingRequest = { brandName: '', logoAsset: '', primaryColor: '', supportEmail: '', emailFromAddress: '' };

/** Self-service subset of what a platform admin can edit for this partner — see backend UpdatePartnerBrandingRequest's own doc comment for what's deliberately excluded (internal name, subdomain, billing model, revenue share). */
export default function PartnerBrandingTab() {
  const { updateUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState<UpdatePartnerBrandingRequest>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    partnerConsoleApi.getBranding()
      .then((b) => setForm({
        brandName: b.brandName, logoAsset: b.logoAsset ?? '', primaryColor: b.primaryColor ?? '',
        supportEmail: b.supportEmail ?? '', emailFromAddress: b.emailFromAddress ?? '',
      }))
      .catch(() => showToast('Failed to load branding.', 'warning'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    if (!form.brandName.trim()) {
      showToast('Brand name is required.', 'warning');
      return;
    }
    setSaving(true);
    partnerConsoleApi.updateBranding(form)
      .then((b) => {
        updateUser({ brandName: b.brandName, logoUrl: b.logoAsset, primaryColor: b.primaryColor });
        showToast('Branding updated.', 'success');
      })
      .catch((err) => showToast(err?.message || 'Failed to save branding.', 'warning'))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return <div className="text-center py-24 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Branding</h1>
        <p className="text-sm text-gray-500 mt-1">What your own customers see. Doesn't affect your plan or feature access.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-3">Preview — what your customers see</div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1.5" style={{ backgroundColor: form.primaryColor?.trim() || DEFAULT_COLOR }} />
          <div className="flex items-center space-x-3 px-4 py-3.5">
            <BrandSwatch logoAsset={form.logoAsset} primaryColor={form.primaryColor} name={form.brandName} size={36} />
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{form.brandName || 'Brand Name'}</div>
              <div className="text-[10px] text-gray-400 truncate">Reporting Platform</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6 space-y-4">
        <Field icon={<Sparkles className="w-3.5 h-3.5" />} label="Brand Name (customer-facing) *" value={form.brandName} onChange={(v) => setForm({ ...form, brandName: v })} placeholder="e.g. Acme ESG Portal" />
        <Field icon={<ImageIcon className="w-3.5 h-3.5" />} label="Logo URL" value={form.logoAsset ?? ''} onChange={(v) => setForm({ ...form, logoAsset: v })} placeholder="https://…" />

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> <span>Primary Color</span>
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(form.primaryColor ?? '') ? form.primaryColor! : DEFAULT_COLOR}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer shrink-0 p-0.5 bg-white"
              title="Pick a color"
            />
            <input
              type="text"
              value={form.primaryColor ?? ''}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              placeholder="#10B981"
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 font-mono outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field icon={<Mail className="w-3.5 h-3.5" />} label="Support Email" value={form.supportEmail ?? ''} onChange={(v) => setForm({ ...form, supportEmail: v })} placeholder="support@partner.com" />
          <Field icon={<Send className="w-3.5 h-3.5" />} label="Email From Address" value={form.emailFromAddress ?? ''} onChange={(v) => setForm({ ...form, emailFromAddress: v })} placeholder="no-reply@partner.com" />
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-gray-100">
          <Button variant="primary" size="sm" loading={saving} onClick={save}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, value, onChange, placeholder }: { icon?: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span>{label}</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
      />
    </div>
  );
}

function BrandSwatch({ logoAsset, primaryColor, name, size }: { logoAsset?: string | null; primaryColor?: string | null; name: string; size: number }) {
  const color = /^#[0-9A-Fa-f]{6}$/.test(primaryColor ?? '') ? primaryColor! : DEFAULT_COLOR;
  const style = { width: size, height: size };

  if (logoAsset?.trim()) {
    return (
      <img
        src={logoAsset}
        alt=""
        style={style}
        className="rounded-lg object-cover border border-gray-100 shrink-0 bg-white"
        onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
      />
    );
  }

  return (
    <div style={{ ...style, backgroundColor: color }} className="rounded-lg flex items-center justify-center text-white font-black shrink-0">
      <span style={{ fontSize: size * 0.42 }}>{(name || '?').trim().slice(0, 1).toUpperCase()}</span>
    </div>
  );
}
