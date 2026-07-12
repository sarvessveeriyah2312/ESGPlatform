/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  HashRouter, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  useLocation 
} from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  ShieldCheck,
  Sliders,
  Target,
  FileText,
  Globe,
  Lock,
  KeyRound,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  Sparkles,
  Info,
  Building,
  Hash,
  X,
  Headphones,
  BarChart3,
  Building2,
  Database,
  Ticket,
  Package
} from 'lucide-react';

import { PlanProvider, usePlan, PlanType } from './contexts/PlanContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Role, canAccess, MANAGEMENT_ROLES, PLATFORM_ROLES, TENANT_ROLES } from './permissions';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AcceptInvitePage from './components/AcceptInvitePage';
import OnboardingPage from './components/OnboardingPage';
import UpgradeGate from './components/ui/UpgradeGate';
import AuthTopBar from './components/ui/AuthTopBar';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import PricingPage from './components/PricingPage';
import AboutPage from './components/AboutPage';

import MaterialityAssessmentView from './components/MaterialityAssessmentView';
import GovernanceView from './components/GovernanceView';
import IndicatorsView from './components/IndicatorsView';
import IfrsS1S2View from './components/IfrsS1S2View';
import AssuranceWorkspaceView from './components/AssuranceWorkspaceView';
import ApiAccessView from './components/ApiAccessView';
import ReportsExportView from './components/ReportsExportView';
import AdminPanel from './components/AdminPanel';
import TargetsView from './components/TargetsView';
import SupportTicketsView from './components/SupportTicketsView';
import ProfileView from './components/ProfileView';
import TeamView from './components/TeamView';

// Import all sub-views from PlaceholderViews
import {
  BillingView,
  SettingsView
} from './components/PlaceholderViews';

/**
 * 1. Authenticated Layout Component (Sidebar + TopBar + Main Area Wrapper)
 */
function AuthenticatedLayout({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Role[] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, hasFeature, isFeatureVisible } = usePlan();
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();

  // Declared before any early return below so hook order stays stable across renders
  // (e.g. logging out flips isAuthenticated on this same mounted component).
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8F9FA] text-gray-400 text-sm">
        Loading workspace…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Platform-level roles have no company, so the onboarding flow (which sets up a tenant's
  // market/sector) doesn't apply to them.
  const requiresOnboarding = user && !user.onboardingCompleted && !canAccess(user.role, PLATFORM_ROLES);
  if (requiresOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  const isPlatformAdmin = canAccess(user?.role, PLATFORM_ROLES);
  const hasPageAccess = canAccess(user?.role, allowedRoles);
  const activeCompany = user?.company || 'Lestari Workspace';

  const userInitials = user?.name 
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() 
    : 'SV';

  // Calculate current page breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const path = location.pathname.substring(1) || 'dashboard';
    const mapping: Record<string, string> = {
      'dashboard': 'Dashboard',
      'materiality': 'Materiality Assessment',
      'governance': 'Governance & Policy',
      'indicators': 'ESG Indicators',
      'targets': 'Targets & Decarbonization',
      'reports': 'Reports & Export',
      'support': 'Feedback & Support',
      'ifrs-s1-s2': 'IFRS S1/S2 Module',
      'climate-module': 'Advanced Climate Tracker',
      'assurance-workspace': 'Assurance Workspace',
      'csi-export': 'Bursa CSI Export',
      'team': 'Team Directory',
      'billing': 'Billing & Plan',
      'settings': 'Settings',
      'profile': 'My Profile',
      'admin/overview': 'Platform Admin — Overview',
      'admin/tenants': 'Platform Admin — Tenant Companies',
      'admin/reference': 'Platform Admin — Reference Frameworks',
      'admin/billing': 'Platform Admin — Subscriptions & Invoices',
      'admin/support': 'Platform Admin — Feedback & Support',
      'admin/plans': 'Platform Admin — Plan Management'
    };
    return ['Workspace', mapping[path] || path];
  };

  // Nav categories & items
  const mainMenuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, path: '/dashboard' },
    { key: 'materiality', label: 'Materiality', icon: <Compass className="w-4 h-4" />, path: '/materiality' },
    { key: 'indicators', label: 'Indicators', icon: <Sliders className="w-4 h-4" />, path: '/indicators' },
    { key: 'targets', label: 'Targets', icon: <Target className="w-4 h-4" />, path: '/targets', gated: true },
    { key: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" />, path: '/reports' },
  ];

  const managementsItems = [
    { key: 'governance', label: 'Compliance', icon: <ShieldCheck className="w-4 h-4" />, path: '/governance', gated: true },
    { key: 'ifrs-s1-s2', label: 'IFRS S1/S2', icon: <Globe className="w-4 h-4" />, path: '/ifrs-s1-s2', premiumOnly: true },
    { key: 'assurance-workspace', label: 'Assurance Workspace', icon: <Lock className="w-4 h-4" />, path: '/assurance-workspace', premiumOnly: true },
    { key: 'api-access', label: 'API Access', icon: <KeyRound className="w-4 h-4" />, path: '/api-access' },
    { key: 'team', label: 'Team', icon: <Users className="w-4 h-4" />, path: '/team' },
  ];

  const platformItems = [
    { key: 'admin-overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" />, path: '/admin/overview' },
    { key: 'admin-tenants', label: 'Tenant Companies', icon: <Building2 className="w-4 h-4" />, path: '/admin/tenants' },
    { key: 'admin-reference', label: 'Reference Frameworks', icon: <Database className="w-4 h-4" />, path: '/admin/reference' },
    { key: 'admin-billing', label: 'Subscriptions & Invoices', icon: <CreditCard className="w-4 h-4" />, path: '/admin/billing' },
    { key: 'admin-support', label: 'Feedback & Support', icon: <Ticket className="w-4 h-4" />, path: '/admin/support' },
    { key: 'admin-plans', label: 'Plan Management', icon: <Package className="w-4 h-4" />, path: '/admin/plans' },
  ];

  const canManageWorkspace = canAccess(user?.role, MANAGEMENT_ROLES);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] text-gray-900 font-sans">
      
      {/* SIDEBAR */}
      <aside 
        className={`bg-white border-r border-gray-100 flex flex-col h-full relative transition-all duration-300 z-40 shrink-0 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        
        {/* Sidebar Header */}
        <div className="h-[72px] flex items-center px-6 border-b border-transparent shrink-0">
          <div className="flex items-center space-x-3 w-full">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm font-black text-sm shrink-0">
              <Hash className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 flex justify-between items-center">
                <span className="font-bold text-gray-900 text-lg truncate">Lestari</span>
                <button 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {sidebarCollapsed && (
           <div className="flex justify-center mt-4">
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        )}

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">

          {isPlatformAdmin ? (
            /* Platform Admin Section — platform admins have no company context, so tenant
               data views (dashboard, materiality, etc.) don't apply to them. */
            <div className="mb-6">
              {!sidebarCollapsed && <h3 className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Platform</h3>}
              <nav className="space-y-1">
                {platformItems.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.key}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <div className={`${isActive ? 'text-emerald-500' : 'text-gray-400'} shrink-0`}>
                        {item.icon}
                      </div>
                      {!sidebarCollapsed && (
                        <span className="ml-3 truncate">{item.label}</span>
                      )}
                      {isActive && !sidebarCollapsed && (
                        <div className="ml-auto w-1 h-5 bg-emerald-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ) : (
            <>
              {/* Main Menu Section */}
              <div className="mb-6">
                {!sidebarCollapsed && <h3 className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Main menu</h3>}
                <nav className="space-y-1">
                  {mainMenuItems.map(item => {
                    if (item.gated && !isFeatureVisible(item.key)) return null;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.key}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <div className={`${isActive ? 'text-emerald-500' : 'text-gray-400'} shrink-0`}>
                          {item.icon}
                        </div>
                        {!sidebarCollapsed && (
                          <span className="ml-3 truncate">{item.label}</span>
                        )}
                        {isActive && !sidebarCollapsed && (
                          <div className="ml-auto w-1 h-5 bg-emerald-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Managements Section */}
              <div className="mb-6">
                {!sidebarCollapsed && <h3 className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Managements</h3>}
                <nav className="space-y-1">
                  {managementsItems.map(item => {
                    if (item.gated && !isFeatureVisible(item.key)) return null;
                    // TEMP: plan gating disabled for dev — delete this line to re-enable enforcement.
                    if (false && item.premiumOnly && plan !== 'issuer-ready') return null;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.key}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <div className={`${isActive ? 'text-emerald-500' : 'text-gray-400'} shrink-0`}>
                          {item.icon}
                        </div>
                        {!sidebarCollapsed && (
                          <span className="ml-3 truncate">{item.label}</span>
                        )}
                        {!sidebarCollapsed && item.premiumOnly && (
                           <span className="ml-auto bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">New</span>
                        )}
                        {isActive && !sidebarCollapsed && !item.premiumOnly && (
                          <div className="ml-auto w-1 h-5 bg-emerald-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          {!sidebarCollapsed && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 relative group">
               <button 
                 className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 cursor-pointer"
               >
                 <X className="w-4 h-4" />
               </button>
               <div className="flex items-center space-x-2 mb-2 text-gray-900 font-semibold text-sm">
                 <Headphones className="w-4 h-4" />
                 <span>Need support</span>
               </div>
               <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                 Contact with one of our expert to get support.
               </p>
               <button className="w-full py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                 Call the Expert
               </button>
            </div>
          )}

          <div className="space-y-1">
            {canManageWorkspace && (
              <button
                onClick={() => navigate('/settings')}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  location.pathname === '/settings'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? "Settings" : undefined}
              >
                <div className={`${location.pathname === '/settings' ? 'text-emerald-500' : 'text-gray-400'} shrink-0`}>
                   <Settings className="w-4 h-4" />
                </div>
                {!sidebarCollapsed && <span className="ml-3">Settings</span>}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Dynamic TopBar */}
        <AuthTopBar 
          breadcrumbs={getBreadcrumbs()} 
          onNotificationClick={() => alert("Notification center is simulated in this ESG Sandbox.")}
          onSearchChange={(val) => console.log('Simulated ESG search query: ', val)}
        />

        {/* Scrollable Children Body */}
        <main className="flex-1 overflow-y-auto bg-[#F8F9FA] p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto">
            {hasPageAccess ? children : (
              <div className="flex flex-col items-center justify-center text-center py-24 px-6 bg-white border border-gray-100 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">You don't have access to this page</h2>
                <p className="text-sm text-gray-500 max-w-sm">
                  This area is restricted based on your account role. Contact your workspace admin if you believe this is a mistake.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * 2. Main App Content Switcher mapping React Router URL state
 */
function AppContent() {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Superadmin Panel — sections are separate routes so the sidebar can navigate/highlight them */}
      <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
      <Route
        path="/admin/overview"
        element={
          <AuthenticatedLayout allowedRoles={PLATFORM_ROLES}>
            <AdminPanel />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/admin/tenants"
        element={
          <AuthenticatedLayout allowedRoles={PLATFORM_ROLES}>
            <AdminPanel />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/admin/reference"
        element={
          <AuthenticatedLayout allowedRoles={PLATFORM_ROLES}>
            <AdminPanel />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/admin/billing"
        element={
          <AuthenticatedLayout allowedRoles={PLATFORM_ROLES}>
            <AdminPanel />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/admin/support"
        element={
          <AuthenticatedLayout allowedRoles={PLATFORM_ROLES}>
            <AdminPanel />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/admin/plans"
        element={
          <AuthenticatedLayout allowedRoles={PLATFORM_ROLES}>
            <AdminPanel />
          </AuthenticatedLayout>
        }
      />

      {/* Standalone Authentication & Onboarding Gateway Pages */}
      <Route 
        path="/login" 
        element={<LoginPage />} 
      />
      <Route
        path="/register"
        element={<RegisterPage />}
      />
      <Route
        path="/accept-invite"
        element={<AcceptInvitePage />}
      />
      <Route
        path="/onboarding"
        element={<OnboardingPage />} 
      />

      {/* Public Pages */}
      <Route 
        path="/" 
        element={
          <LandingPage 
            onNavigateToDashboard={() => navigate('/dashboard')} 
            onNavigateToPricing={() => navigate('/pricing')} 
            onNavigateToAbout={() => navigate('/about')} 
            onNavigateToLogin={() => navigate('/login')}
            onNavigateToRegister={() => navigate('/register')}
          />
        } 
      />
      <Route 
        path="/pricing" 
        element={
          <PricingPage 
            onNavigateToDashboard={() => navigate('/dashboard')} 
            onNavigateToAbout={() => navigate('/about')} 
            onNavigateToLanding={(section) => {
              navigate('/');
              if (section) {
                setTimeout(() => {
                  const el = document.getElementById(section);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 150);
              }
            }} 
          />
        } 
      />
      <Route 
        path="/about" 
        element={
          <AboutPage 
            onNavigateToDashboard={() => navigate('/dashboard')} 
            onNavigateToPricing={() => navigate('/pricing')} 
            onNavigateToLanding={(section) => {
              navigate('/');
              if (section) {
                setTimeout(() => {
                  const el = document.getElementById(section);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 150);
              }
            }} 
          />
        } 
      />

      {/* Authenticated Pages Layout Wrappers */}
      <Route
        path="/dashboard"
        element={
          <AuthenticatedLayout allowedRoles={TENANT_ROLES}>
            <Dashboard />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/materiality"
        element={
          <AuthenticatedLayout allowedRoles={TENANT_ROLES}>
            <MaterialityAssessmentView />
          </AuthenticatedLayout>
        }
      />

      {/* Gated Governance Route (Growth requirement) */}
      <Route
        path="/governance"
        element={
          <AuthenticatedLayout allowedRoles={TENANT_ROLES}>
            <UpgradeGate feature="governance" onUpgrade={() => navigate('/billing')}>
              <GovernanceView />
            </UpgradeGate>
          </AuthenticatedLayout>
        }
      />

      <Route
        path="/indicators"
        element={
          <AuthenticatedLayout allowedRoles={TENANT_ROLES}>
            <IndicatorsView />
          </AuthenticatedLayout>
        } 
      />

      {/* Gated Targets Route (Growth requirement) */}
      <Route
        path="/targets"
        element={
          <AuthenticatedLayout allowedRoles={TENANT_ROLES}>
            <UpgradeGate feature="targets" onUpgrade={() => navigate('/billing')}>
              <TargetsView />
            </UpgradeGate>
          </AuthenticatedLayout>
        }
      />

      <Route
        path="/reports"
        element={
          <AuthenticatedLayout allowedRoles={TENANT_ROLES}>
            <ReportsExportView />
          </AuthenticatedLayout>
        }
      />

      <Route
        path="/support"
        element={
          <AuthenticatedLayout allowedRoles={TENANT_ROLES}>
            <SupportTicketsView />
          </AuthenticatedLayout>
        }
      />

      {/* No allowedRoles — every authenticated role (tenant or platform) can reach their own profile */}
      <Route
        path="/profile"
        element={
          <AuthenticatedLayout>
            <ProfileView />
          </AuthenticatedLayout>
        }
      />

      {/* Premium Specific Routes (Only accessed if Issuer-Ready is active, but safeguard with UpgradeGate too) */}
      <Route
        path="/ifrs-s1-s2"
        element={
          <AuthenticatedLayout allowedRoles={TENANT_ROLES}>
            <UpgradeGate feature="ifrs-s1-s2" onUpgrade={() => navigate('/billing')}>
              <IfrsS1S2View />
            </UpgradeGate>
          </AuthenticatedLayout>
        }
      />
      {/* Retired duplicate placeholder — the real Scope 1/2/3 GHG ledger lives at /ifrs-s1-s2 */}
      <Route path="/climate-module" element={<Navigate to="/ifrs-s1-s2" replace />} />
      <Route
        path="/assurance-workspace"
        element={
          <AuthenticatedLayout allowedRoles={TENANT_ROLES}>
            <UpgradeGate feature="assurance-workspace" onUpgrade={() => navigate('/billing')}>
              <AssuranceWorkspaceView />
            </UpgradeGate>
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/api-access"
        element={
          <AuthenticatedLayout allowedRoles={TENANT_ROLES}>
            <ApiAccessView />
          </AuthenticatedLayout>
        }
      />
      {/* Retired duplicate placeholder — the real CSI-Compatible Export lives on /reports */}
      <Route path="/csi-export" element={<Navigate to="/reports" replace />} />

      {/* Company Pages */}
      <Route
        path="/team"
        element={
          <AuthenticatedLayout allowedRoles={MANAGEMENT_ROLES}>
            <TeamView />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/billing"
        element={
          <AuthenticatedLayout allowedRoles={MANAGEMENT_ROLES}>
            <BillingView />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthenticatedLayout allowedRoles={MANAGEMENT_ROLES}>
            <SettingsView />
          </AuthenticatedLayout>
        }
      />

      {/* Fallback routing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * 3. Core App Entrance wrapping Provider and Router
 */
function AppWithAuth() {
  const { plan, setPlan } = usePlan();
  return (
    <AuthProvider currentPlan={plan} setWorkspacePlan={setPlan}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <PlanProvider>
      <AppWithAuth />
    </PlanProvider>
  );
}
