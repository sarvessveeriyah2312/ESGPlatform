const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, hasFeature, isFeatureVisible } = usePlan();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  
  const activeCompany = user?.company || 'EsgEasy Workspace';

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
      'ifrs-s1-s2': 'IFRS S1/S2 Module',
      'climate-module': 'Advanced Climate Tracker',
      'assurance-workspace': 'Assurance Workspace',
      'csi-export': 'Bursa CSI Export',
      'team': 'Team Directory',
      'billing': 'Billing & Plan',
      'settings': 'Settings'
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
    { key: 'climate-module', label: 'Climate Module', icon: <Zap className="w-4 h-4" />, path: '/climate-module', premiumOnly: true },
    { key: 'assurance-workspace', label: 'Assurance Workspace', icon: <Lock className="w-4 h-4" />, path: '/assurance-workspace', premiumOnly: true },
    { key: 'csi-export', label: 'CSI Export', icon: <ArrowUpRight className="w-4 h-4" />, path: '/csi-export', premiumOnly: true },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] text-gray-900 font-sans">
      
      {/* SIDEBAR */}
      <aside 
        className={\`bg-white border-r border-gray-100 flex flex-col h-full relative transition-all duration-300 z-40 shrink-0 \${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }\`}
      >
        
        {/* Sidebar Header */}
        <div className="h-[72px] flex items-center px-6 border-b border-transparent shrink-0">
          <div className="flex items-center space-x-3 w-full">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm font-black text-sm shrink-0">
              <Hash className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 flex justify-between items-center">
                <span className="font-bold text-gray-900 text-lg truncate">EsgEasy</span>
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

        {/* Global Search in Sidebar */}
        {!sidebarCollapsed && (
          <div className="px-6 py-4">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <div className="w-full pl-9 pr-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 hover:border-emerald-500 rounded-lg outline-none flex items-center justify-between transition-all duration-150">
                <span>Search</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          
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
                    className={\`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer \${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className={\`\${isActive ? 'text-emerald-500' : 'text-gray-400'} shrink-0\`}>
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
                if (item.premiumOnly && plan !== 'issuer-ready') return null;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.path)}
                    className={\`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer \${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className={\`\${isActive ? 'text-emerald-500' : 'text-gray-400'} shrink-0\`}>
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
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          {!sidebarCollapsed && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 relative">
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
            <button 
              onClick={() => navigate('/settings')}
              className={\`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer \${
                location.pathname === '/settings' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } \${sidebarCollapsed ? 'justify-center' : ''}\`}
              title={sidebarCollapsed ? "Settings" : undefined}
            >
              <div className={\`\${location.pathname === '/settings' ? 'text-emerald-500' : 'text-gray-400'} shrink-0\`}>
                 <Settings className="w-4 h-4" />
              </div>
              {!sidebarCollapsed && <span className="ml-3">Settings</span>}
            </button>
            
            <button 
              onClick={() => {
                logout();
                navigate('/');
              }}
              className={\`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer \${sidebarCollapsed ? 'justify-center' : ''}\`}
              title={sidebarCollapsed ? "Log out" : undefined}
            >
              <div className="text-gray-400 group-hover:text-red-500 shrink-0">
                 <LogOut className="w-4 h-4" />
              </div>
              {!sidebarCollapsed && <span className="ml-3">Log out</span>}
            </button>
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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}`;

const regex = /function AuthenticatedLayout\(\{ children \}: \{ children: React\.ReactNode \}\) \{[\s\S]*?\n\s*\}/m;
code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code, 'utf8');
