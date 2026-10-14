import React from 'react';
import { useLocation } from 'react-router-dom';
import { PartnerTab, PARTNER_TABS } from './partner/constants';
import PartnerDashboardTab from './partner/PartnerDashboardTab';
import PartnerCompaniesTab from './partner/PartnerCompaniesTab';
import PartnerBillingTab from './partner/PartnerBillingTab';
import PartnerSupportTab from './partner/PartnerSupportTab';
import PartnerRevenueTab from './partner/PartnerRevenueTab';
import PartnerUsersTab from './partner/PartnerUsersTab';
import PartnerAuditLogTab from './partner/PartnerAuditLogTab';
import PartnerSettingsTab from './partner/PartnerSettingsTab';

/**
 * Content switcher for the partner console (WHITELABEL_PLAN.md Phase 4, expanded) — mirrors
 * AdminPanel.tsx's own "URL owns the active section" pattern. Rendered inside
 * PartnerConsoleLayout, which owns the sidebar, auth guard, and top bar. `/partner` itself (no
 * sub-segment) is the dashboard — same convention as `/admin` defaulting to Overview.
 */
export default function PartnerConsole() {
  const location = useLocation();
  const tabFromPath = location.pathname.split('/')[2] as PartnerTab | undefined;
  const activeTab: PartnerTab = tabFromPath && PARTNER_TABS.includes(tabFromPath) ? tabFromPath : 'dashboard';

  return (
    <>
      {activeTab === 'dashboard' && <PartnerDashboardTab />}
      {activeTab === 'companies' && <PartnerCompaniesTab />}
      {activeTab === 'billing' && <PartnerBillingTab />}
      {activeTab === 'support' && <PartnerSupportTab />}
      {activeTab === 'revenue' && <PartnerRevenueTab />}
      {activeTab === 'users' && <PartnerUsersTab />}
      {activeTab === 'audit-log' && <PartnerAuditLogTab />}
      {activeTab === 'settings' && <PartnerSettingsTab />}
    </>
  );
}
