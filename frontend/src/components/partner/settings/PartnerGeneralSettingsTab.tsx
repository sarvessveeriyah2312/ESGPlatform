import React, { useEffect, useState } from 'react';
import { Sparkles, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { partnerConsoleApi, PartnerBrandingResponse } from '../../../api/partnerConsoleApi';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import Button from '../../ui/Button';

const DEFAULT_COLOR = '#10B981';

/** Brand identity fields — logo/color/name — split out from the old standalone Branding tab into Settings > General; supportEmail/emailFromAddress moved to Settings > Email. Same backend endpoint (PUT /branding), just a narrower form each side saves. */
export default function PartnerGeneralSettingsTab() {
  const { updateUser } = useAuth();
  const { showToast } = useToast();
  const [branding, setBranding] = useState<PartnerBrandingResponse | null>(null);
  const [brandName, setBrandName] = useState('');
  const [logoAsset, setLogoAsset] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    partnerConsoleApi.getBranding()
      .then((b) => {
        setBranding(b);
        setBrandName(b.brandName);
        setLogoAsset(b.logoAsset ?? '');
        setPrimaryColor(b.primaryColor ?? '');
      })
      .catch(() => showToast('Failed to load settings.', 'warning'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    if (!branding) return;
    if (!brandName.trim()) {
      showToast('Brand name is required.', 'warning');
      return;
    }
    setSaving(true);
    partnerConsoleApi.updateBranding({
      brandName,
      logoAsset,
      primaryColor,
      supportEmail: branding.supportEmail ?? '',
      emailFromAddress: branding.emailFromAddress ?? '',
    })
      .then((b) => {
        setBranding(b);
        updateUser({ brandName: b.brandName, logoUrl: b.logoAsset, primaryColor: b.primaryColor });
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
      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-3">Preview — what your customers see</div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1.5" style={{ backgroundColor: primaryColor?.trim() || DEFAULT_COLOR }} />
          <div className="flex items-center space-x-3 px-4 py-3.5">
            <BrandSwatch logoAsset={logoAsset} primaryColor={primaryColor} name={brandName} size={36} />
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{brandName || 'Brand Name'}</div>
              <div className="text-[10px] text-gray-400 truncate">Reporting Platform</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6 space-y-4">
        <Field icon={<Sparkles className="w-3.5 h-3.5" />} label="Brand Name (customer-facing) *" value={brandName} onChange={setBrandName} placeholder="e.g. Acme ESG Portal" />
        <Field icon={<ImageIcon className="w-3.5 h-3.5" />} label="Logo URL" value={logoAsset} onChange={setLogoAsset} placeholder="https://…" />

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> <span>Primary Color</span>
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : DEFAULT_COLOR}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer shrink-0 p-0.5 bg-white"
              title="Pick a color"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#10B981"
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 font-mono outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
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
