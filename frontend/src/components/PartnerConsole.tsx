/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { PartnerTab, PARTNER_TABS } from './partner/constants';
import PartnerCompaniesTab from './partner/PartnerCompaniesTab';
import PartnerBrandingTab from './partner/PartnerBrandingTab';
import PartnerRevenueTab from './partner/PartnerRevenueTab';
import PartnerUsersTab from './partner/PartnerUsersTab';

/**
 * Content switcher for the partner console (WHITELABEL_PLAN.md Phase 4, expanded) — mirrors
 * AdminPanel.tsx's own "URL owns the active section" pattern. Rendered inside
 * PartnerConsoleLayout, which owns the sidebar, auth guard, and top bar.
 */
export default function PartnerConsole() {
  const location = useLocation();
  const tabFromPath = location.pathname.split('/')[2] as PartnerTab | undefined;
  const activeTab: PartnerTab = tabFromPath && PARTNER_TABS.includes(tabFromPath) ? tabFromPath : 'companies';

  return (
    <>
      {activeTab === 'companies' && <PartnerCompaniesTab />}
      {activeTab === 'branding' && <PartnerBrandingTab />}
      {activeTab === 'revenue' && <PartnerRevenueTab />}
      {activeTab === 'users' && <PartnerUsersTab />}
    </>
  );
}
