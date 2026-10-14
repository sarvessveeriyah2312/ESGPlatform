import React, { useState } from 'react';
import { Sliders, Mail, ShieldCheck } from 'lucide-react';
import PartnerGeneralSettingsTab from './settings/PartnerGeneralSettingsTab';
import PartnerEmailSettingsTab from './settings/PartnerEmailSettingsTab';
import PartnerSecuritySettingsTab from './settings/PartnerSecuritySettingsTab';

type SettingsSubTab = 'general' | 'email' | 'security';

const SUB_TABS: { id: SettingsSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'general', label: 'General', icon: Sliders },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'security', label: 'Security', icon: ShieldCheck },
];

/** Mirrors AdminSettingsTab's sub-tab shell — General/Email absorbed the old standalone Branding tab's two field groups; Payments has no partner equivalent (Stripe platform keys stay platform-only — revenue share/Connect already lives on the Revenue tab). */
export default function PartnerSettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('general');

  return (
    <div className="w-full pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Your brand presentation, contact emails, and team security policy.</p>
      </div>

      <div className="border-b border-gray-100 mb-8 overflow-x-auto">
        <nav className="flex items-center gap-1 min-w-max">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  isActive ? 'border-emerald-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeSubTab === 'general' && <PartnerGeneralSettingsTab />}
      {activeSubTab === 'email' && <PartnerEmailSettingsTab />}
      {activeSubTab === 'security' && <PartnerSecuritySettingsTab />}
    </div>
  );
}
