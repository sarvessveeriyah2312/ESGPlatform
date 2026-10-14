import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, LifeBuoy, Percent, Users as UsersIcon, ScrollText, Settings as SettingsIcon, ChevronLeft, ChevronRight, LogOut, Hash } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PartnerTab } from './constants';

const NAV_ITEMS: { key: PartnerTab; label: string; icon: React.ReactNode; path: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, path: '/partner' },
  { key: 'companies', label: 'Tenant Companies', icon: <Building2 className="w-4 h-4" />, path: '/partner/companies' },
  { key: 'billing', label: 'Billing & Invoices', icon: <CreditCard className="w-4 h-4" />, path: '/partner/billing' },
  { key: 'support', label: 'Feedback & Support', icon: <LifeBuoy className="w-4 h-4" />, path: '/partner/support' },
  { key: 'revenue', label: 'Revenue', icon: <Percent className="w-4 h-4" />, path: '/partner/revenue' },
  { key: 'users', label: 'Users', icon: <UsersIcon className="w-4 h-4" />, path: '/partner/users' },
  { key: 'audit-log', label: 'Audit Log', icon: <ScrollText className="w-4 h-4" />, path: '/partner/audit-log' },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" />, path: '/partner/settings' },
];

/**
 * Sidebar shell for the partner console — deliberately its own component rather than reusing
 * AuthenticatedLayout's `<aside>`, even though the markup pattern is copied from it (same
 * collapsible width toggle, same nav-item button styling). Reasons: (1) AuthenticatedLayout's
 * top bar (AuthTopBar) assumes company context in a few places (company switcher, links into
 * /settings and /support) that were never verified to behave for a partner-scoped user, and (2)
 * PartnerConsole.tsx's own guard logic (redirect non-PARTNER_ADMIN elsewhere) is specific to this
 * role and doesn't belong inside the shared tenant/platform layout.
 */
export default function PartnerConsoleLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8F9FA] text-gray-400 text-sm">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'PARTNER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] text-gray-900 font-sans">
      <aside
        className={`bg-white border-r border-gray-100 flex flex-col h-full relative transition-all duration-300 z-40 shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Show Sidebar' : 'Hide Sidebar'}
          aria-label={collapsed ? 'Show Sidebar' : 'Hide Sidebar'}
          className="absolute top-8 -right-3 w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-400 hover:text-gray-800 hover:border-gray-300 transition-colors cursor-pointer z-50"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className="h-[72px] flex items-center px-6 border-b border-transparent shrink-0">
          <div className="flex items-center space-x-3 w-full">
            {user?.logoUrl ? (
              <img src={user.logoUrl} alt="" className="w-8 h-8 rounded-xl object-cover shadow-sm shrink-0" />
            ) : (
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm font-black text-sm shrink-0 ${user?.primaryColor ? '' : 'bg-emerald-500'}`}
                style={user?.primaryColor ? { backgroundColor: user.primaryColor } : undefined}
              >
                <Hash className="w-5 h-5" />
              </div>
            )}
            {!collapsed && <span className="font-bold text-gray-900 text-lg truncate">{user?.brandName ?? 'Partner Console'}</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <div className="mb-6">
            {!collapsed && <h3 className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Partner Console</h3>}
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className={`${isActive ? 'text-emerald-500' : 'text-gray-400'} shrink-0`}>{item.icon}</div>
                    {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
                    {isActive && !collapsed && <div className="ml-auto w-1 h-5 bg-emerald-500 rounded-full" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={logout}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-colors ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="ml-3">Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="w-full flex items-center justify-between py-3 px-8 bg-white border-b border-gray-100 z-35 h-[72px] shrink-0">
          <span className="text-sm font-semibold text-gray-900">{NAV_ITEMS.find((i) => i.path === location.pathname)?.label ?? 'Dashboard'}</span>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-900 truncate max-w-[180px]">{user?.name}</p>
              <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
              {(user?.name ?? '?').split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F8F9FA] p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
