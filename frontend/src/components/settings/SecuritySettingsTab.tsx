/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import ChangePasswordCard from './ChangePasswordCard';
import TwoFactorAuthCard from './TwoFactorAuthCard';
import ActiveSessionsCard from './ActiveSessionsCard';

export default function SecuritySettingsTab() {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'warning') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
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

      <ChangePasswordCard onResult={showMessage} />
      <TwoFactorAuthCard onResult={showMessage} />
      <ActiveSessionsCard onResult={showMessage} />
    </div>
  );
}
