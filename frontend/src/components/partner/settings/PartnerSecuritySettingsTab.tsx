import React, { useEffect, useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { partnerConsoleApi } from '../../../api/partnerConsoleApi';
import { useToast } from '../../../contexts/ToastContext';
import Button from '../../ui/Button';
import ActiveSessionsCard from '../../settings/ActiveSessionsCard';

/**
 * Two things, per the user's explicit scope choice for this tab: a partner-wide "require MFA for
 * teammates" toggle (separate from PlatformSettings.require2fa, which is platform-wide and
 * platform-admin-only — see Partner.mfaRequiredForTeam / AuthService.requiresMfa), and the signed-in
 * partner-admin's own active sessions. Deliberately does NOT include a password-change/MFA-enrollment
 * card here — that was offered as an option and not chosen.
 */
export default function PartnerSecuritySettingsTab() {
  const { showToast } = useToast();
  const [mfaRequiredForTeam, setMfaRequiredForTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    partnerConsoleApi.getSecuritySettings()
      .then((s) => setMfaRequiredForTeam(s.mfaRequiredForTeam))
      .catch(() => showToast('Failed to load security settings.', 'warning'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    setSaving(true);
    partnerConsoleApi.updateSecuritySettings(mfaRequiredForTeam)
      .then((s) => {
        setMfaRequiredForTeam(s.mfaRequiredForTeam);
        showToast('Security settings saved.', 'success');
      })
      .catch((err) => showToast(err?.message || 'Failed to save security settings.', 'warning'))
      .finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {loading ? (
        <div className="text-center py-24 text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
          <h3 className="text-lg font-bold text-gray-900">Security</h3>
          <p className="text-xs text-gray-500 mt-1 mb-6">Authentication policy for your own team's logins.</p>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={mfaRequiredForTeam}
              onChange={(e) => setMfaRequiredForTeam(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <span>
              <span className="text-xs font-semibold text-gray-700 block">Require two-factor authentication for your team</span>
              <span className="text-[10px] text-gray-500 block mt-1">
                Teammates without 2FA enabled will be asked to set it up before continuing. Only affects logins under your own partner — not other partners or platform staff.
              </span>
            </span>
          </label>

          <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              This is separate from EsgEasy's own platform-wide 2FA policy, which a platform admin controls and applies to every user regardless of this setting.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" loading={saving} onClick={save} icon={<Check className="w-4 h-4" />}>
              Save Settings
            </Button>
          </div>
        </div>
      )}

      <ActiveSessionsCard onResult={(message, type) => showToast(message, type)} />
    </div>
  );
}
