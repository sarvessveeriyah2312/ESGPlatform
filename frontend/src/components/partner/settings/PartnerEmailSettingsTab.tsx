/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { partnerConsoleApi, PartnerBrandingResponse } from '../../../api/partnerConsoleApi';
import { useToast } from '../../../contexts/ToastContext';
import Button from '../../ui/Button';

/** Contact-email fields split out from the old standalone Branding tab — same PUT /branding endpoint as Settings > General, just this tab's slice of the same fields. */
export default function PartnerEmailSettingsTab() {
  const { showToast } = useToast();
  const [branding, setBranding] = useState<PartnerBrandingResponse | null>(null);
  const [supportEmail, setSupportEmail] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    partnerConsoleApi.getBranding()
      .then((b) => {
        setBranding(b);
        setSupportEmail(b.supportEmail ?? '');
        setEmailFromAddress(b.emailFromAddress ?? '');
      })
      .catch(() => showToast('Failed to load settings.', 'warning'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    if (!branding) return;
    setSaving(true);
    partnerConsoleApi.updateBranding({
      brandName: branding.brandName,
      logoAsset: branding.logoAsset ?? '',
      primaryColor: branding.primaryColor ?? '',
      supportEmail,
      emailFromAddress,
    })
      .then((b) => {
        setBranding(b);
        showToast('Settings saved.', 'success');
      })
      .catch((err) => showToast(err?.message || 'Failed to save settings.', 'warning'))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return <div className="text-center py-24 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field icon={<Mail className="w-3.5 h-3.5" />} label="Support Email" value={supportEmail} onChange={setSupportEmail} placeholder="support@partner.com" />
          <Field icon={<Send className="w-3.5 h-3.5" />} label="Email From Address" value={emailFromAddress} onChange={setEmailFromAddress} placeholder="no-reply@partner.com" />
        </div>
        <p className="text-[10px] text-gray-400">Shown to your companies' users on lifecycle emails and as their support contact.</p>
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
