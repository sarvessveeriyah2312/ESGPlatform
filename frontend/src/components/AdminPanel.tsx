/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { tenantAdminApi } from '../api/tenantAdminApi';
import { invoiceAdminApi, InvoiceResponse } from '../api/invoiceAdminApi';

import { Tenant, toTenant, ToastType } from './admin/types';
import { AdminTab, ADMIN_TABS } from './admin/constants';
import AdminOverviewTab from './admin/AdminOverviewTab';
import AdminTenantsTab from './admin/AdminTenantsTab';
import AdminTenantDetailView from './admin/AdminTenantDetailView';
import AdminReferenceTab from './admin/AdminReferenceTab';
import AdminBillingTab from './admin/AdminBillingTab';
import AdminSupportTab from './admin/AdminSupportTab';
import AdminPlansTab from './admin/AdminPlansTab';

export default function AdminPanel() {
  const { user } = useAuth();

  // Which section is active is driven by the URL (/admin/overview, /admin/tenants, ...) —
  // the sidebar owns navigation between them, this component just reads where it's mounted.
  const location = useLocation();
  const tabFromPath = location.pathname.split('/')[2] as AdminTab | undefined;
  const activeTab: AdminTab = tabFromPath && ADMIN_TABS.includes(tabFromPath) ? tabFromPath : 'overview';

  // Selected tenant ID (if not null, render the detailed profile view instead of the active tab)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Navigating to a different sidebar section should exit the drill-down, not leave it stuck.
  useEffect(() => {
    if (activeTab !== 'tenants') {
      setSelectedTenantId(null);
    }
  }, [activeTab]);

  // Active Toast Notification state — shared across every tab
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Tenants list, fetched from the real backend on mount — needed by Overview, Tenants, and the
  // tenant detail drill-down, so it's owned here rather than duplicated per tab.
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  useEffect(() => {
    tenantAdminApi.list()
      .then((data) => setTenants(data.map(toTenant)))
      .catch(() => showToast('Failed to load tenant directory.', 'warning'))
      .finally(() => setTenantsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTenantUpdated = (updated: Tenant) => {
    setTenants(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  // Subscription billing invoices, fetched on mount — needed by both the Billing tab and the
  // per-tenant detail drawer.
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    invoiceAdminApi.listAll()
      .then(setInvoices)
      .catch(() => showToast('Failed to load invoices.', 'warning'))
      .finally(() => setInvoicesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">

      {/* Toast Notification (dark floating toast is this app's real pattern — see ReportsExportView.tsx) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 bg-navy-950 text-white px-4 py-3 rounded-xl shadow-2xl border border-navy-800 animate-slide-in">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'info' && <RefreshCw className="w-4 h-4 text-sky-400 animate-spin shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {selectedTenantId ? (
        <AdminTenantDetailView
          tenantId={selectedTenantId}
          tenants={tenants}
          invoices={invoices}
          invoicesLoading={invoicesLoading}
          onBack={() => setSelectedTenantId(null)}
          showToast={showToast}
        />
      ) : (
        <>
          {activeTab === 'overview' && <AdminOverviewTab tenants={tenants} />}

          {activeTab === 'tenants' && (
            <AdminTenantsTab
              tenants={tenants}
              tenantsLoading={tenantsLoading}
              onSelectTenant={setSelectedTenantId}
              onTenantUpdated={handleTenantUpdated}
              showToast={showToast}
            />
          )}

          {activeTab === 'reference' && <AdminReferenceTab showToast={showToast} />}

          {activeTab === 'billing' && (
            <AdminBillingTab invoices={invoices} invoicesLoading={invoicesLoading} showToast={showToast} />
          )}

          {activeTab === 'support' && (
            <AdminSupportTab currentUserEmail={user?.email} showToast={showToast} />
          )}

          {activeTab === 'plans' && <AdminPlansTab showToast={showToast} />}
        </>
      )}
    </div>
  );
}
