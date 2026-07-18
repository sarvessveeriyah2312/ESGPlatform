/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { notificationSettingsApi, UpdateNotificationPreferencesRequest } from '../../api/notificationSettingsApi';

const TOGGLES: { key: keyof UpdateNotificationPreferencesRequest; label: string; description: string }[] = [
  {
    key: 'reportDeadlineReminders',
    label: 'Report deadline reminders',
    description: 'Email me as upcoming ESG disclosure and filing deadlines approach.',
  },
  {
    key: 'teamActivityAlerts',
    label: 'Team activity',
    description: 'Email me when a teammate assigns me a task, comments, or requests sign-off.',
  },
  {
    key: 'complianceAlerts',
    label: 'Compliance alerts',
    description: 'Email me about material changes to Bursa disclosure requirements affecting this workspace.',
  },
  {
    key: 'weeklyDigest',
    label: 'Weekly summary digest',
    description: 'A weekly email recapping indicator progress, targets, and open action items.',
  },
];

export default function NotificationsTab() {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<UpdateNotificationPreferencesRequest>({
    reportDeadlineReminders: true,
    teamActivityAlerts: true,
    complianceAlerts: true,
    weeklyDigest: false,
  });

  const showMessage = (text: string, type: 'success' | 'warning') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    notificationSettingsApi.get()
      .then((res) => setPrefs({
        reportDeadlineReminders: res.reportDeadlineReminders,
        teamActivityAlerts: res.teamActivityAlerts,
        complianceAlerts: res.complianceAlerts,
        weeklyDigest: res.weeklyDigest,
      }))
      .catch(() => showMessage('Failed to load notification preferences.', 'warning'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: keyof UpdateNotificationPreferencesRequest, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    notificationSettingsApi.update(next)
      .then((res) => {
        setPrefs({
          reportDeadlineReminders: res.reportDeadlineReminders,
          teamActivityAlerts: res.teamActivityAlerts,
          complianceAlerts: res.complianceAlerts,
          weeklyDigest: res.weeklyDigest,
        });
        showMessage('Notification preferences saved.', 'success');
      })
      .catch(() => {
        setPrefs(prefs);
        showMessage('Failed to save notification preferences.', 'warning');
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 ${
          message.type === 'success' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-rose-600 bg-rose-50 border border-rose-100'
        }`}>
          {message.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
        <h3 className="text-lg font-bold text-gray-900">Email Notifications</h3>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Choose which updates Lestari should email you about. These apply to your account only.
        </p>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="space-y-4">
            {TOGGLES.map((item) => (
              <label key={item.key} className="flex items-start justify-between gap-4 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">{item.label}</span>
                  <span className="text-[11px] text-gray-500">{item.description}</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs[item.key]}
                  disabled={saving}
                  onChange={(e) => toggle(item.key, e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
