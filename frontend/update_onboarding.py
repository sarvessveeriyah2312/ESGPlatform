import re

with open('src/components/OnboardingPage.tsx', 'r') as f:
    code = f.read()

# I will replace the OnboardingPage to align with the light theme.

new_component_str = """export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4>(1);
  
  const [market, setMarket] = useState<'SME' | 'ACE Market' | 'Main Market'>('SME');
  const [sector, setSector] = useState(MALAYSIAN_SECTORS[0]);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['SEDG']);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(['Carbon Emissions', 'Anti-Corruption']);
  
  const [loadingText, setLoadingText] = useState('Generating secure sandbox database...');
  const [loadingProgress, setLoadingProgress] = useState(15);

  const handleToggleFramework = (id: string) => {
    setSelectedFrameworks(prev => {
      if (prev.includes(id)) {
        return prev.filter(f => f !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleTogglePriority = (id: string) => {
    setSelectedPriorities(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleGoToStep2 = () => {
    if (market === 'SME') {
      setSelectedFrameworks(['SEDG']);
    } else if (market === 'ACE Market') {
      setSelectedFrameworks(['Bursa 9-matter', 'SEDG']);
    } else {
      setSelectedFrameworks(['Bursa 11-matter', 'IFRS S1', 'IFRS S2']);
    }
    setOnboardingStep(2);
  };

  const handleGoToStep3 = () => {
    if (selectedFrameworks.length === 0) {
      alert("Please select at least one disclosure framework to align your reporting cycles.");
      return;
    }
    setOnboardingStep(3);
  };

  const handleFinishOnboarding = async () => {
    if (selectedPriorities.length === 0) {
      alert("Please select at least one priority ESG focus area to seed your reporting indicators.");
      return;
    }
    setOnboardingStep(4);
    
    setTimeout(() => {
      setLoadingText('Mapping mandatory reporting indicators...');
      setLoadingProgress(45);
    }, 1000);
    setTimeout(() => {
      setLoadingText('Pre-configuring materiality metrics...');
      setLoadingProgress(70);
    }, 2000);
    setTimeout(() => {
      setLoadingText('Applying global standard calculations...');
      setLoadingProgress(90);
    }, 3000);
    setTimeout(async () => {
      setLoadingProgress(100);
      await completeOnboarding({
        market,
        sector,
        frameworks: selectedFrameworks,
        priorities: selectedPriorities
      });
      navigate('/dashboard');
    }, 3800);
  };

  return (
    <div className="min-h-screen w-screen overflow-y-auto bg-[#F8F9FA] text-gray-900 flex flex-col font-sans">
      
      {/* 1. Header Row */}
      <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-gray-900 block">Lestari Onboarding Portal</span>
            <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest block leading-none">Workspace Initialization</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
          <span>Active Representative:</span>
          <span className="text-gray-900 font-bold bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
            {user?.name || 'Administrator'}
          </span>
        </div>
      </header>

      {/* 2. Main Setup Form Area */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute top-1/2 right-0 w-80 h-80 bg-sky-100/50 rounded-full blur-3xl opacity-60 translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="max-w-3xl w-full bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xl relative z-10">
          
          {/* ONBOARDING PROGRESS HEADER BAR */}
          {onboardingStep < 4 && (
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-500">
                <span>Setup Progress</span>
                <span className="text-emerald-600">Step {onboardingStep} of 3</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full flex overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${(onboardingStep / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 1: ORGANIZATION BOUNDARY & CLASSIFICATION */}
          {onboardingStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1.5">
                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Organization Profile
                </div>
                <h3 className="text-2xl font-black text-gray-900">Declare your reporting boundaries</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Lestari aligns workspace tiers, reports, and calculations to meet your specific market regulations. Under Malaysian NSRF mandates, choose your corporate scale.
                </p>
              </div>

              {/* Three Market Classification Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                
                {/* SME Option */}
                <button
                  type="button"
                  onClick={() => setMarket('SME')}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between h-44 ${
                    market === 'SME' 
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className={`p-2 rounded-xl w-10 h-10 flex items-center justify-center ${market === 'SME' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-sm text-gray-900 block">SME Enterprise</span>
                    <span className="text-[11px] text-gray-500 block leading-relaxed">
                      Sectors reporting under SEDG core guides.
                    </span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 mt-2 block">
                    Starter Tier Included
                  </span>
                </button>

                {/* ACE Market Option */}
                <button
                  type="button"
                  onClick={() => setMarket('ACE Market')}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between h-44 ${
                    market === 'ACE Market' 
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className={`p-2 rounded-xl w-10 h-10 flex items-center justify-center ${market === 'ACE Market' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-sm text-gray-900 block">ACE Listed Market</span>
                    <span className="text-[11px] text-gray-500 block leading-relaxed">
                      Small-to-mid capital companies listed on Bursa ACE board.
                    </span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 mt-2 block">
                    Growth Tier Activated
                  </span>
                </button>

                {/* Main Market Option */}
                <button
                  type="button"
                  onClick={() => setMarket('Main Market')}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between h-44 ${
                    market === 'Main Market' 
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className={`p-2 rounded-xl w-10 h-10 flex items-center justify-center ${market === 'Main Market' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-sm text-gray-900 block">Main Listed Market</span>
                    <span className="text-[11px] text-gray-500 block leading-relaxed">
                      Large-cap companies, aligned to global IFRS S1/S2 scope.
                    </span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 mt-2 block">
                    Issuer-Ready Activated
                  </span>
                </button>

              </div>

              {/* Sector Selection */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700 block">Select Active Operational Sector</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 hover:border-gray-300 text-sm text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none shadow-sm transition-all cursor-pointer"
                  >
                    {MALAYSIAN_SECTORS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleGoToStep2}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center transition-all shadow-sm cursor-pointer"
                >
                  <span>Continue Setup</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FRAMEWORK ALIGNMENT */}
          {onboardingStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1.5">
                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Compliance Frameworks
                </div>
                <h3 className="text-2xl font-black text-gray-900">Select applicable reporting frameworks</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Based on your classification as a <strong>{market}</strong>, we have pre-selected the recommended reporting frameworks. You can toggle additional frameworks if you intend to cross-report.
                </p>
              </div>

              {/* Frameworks Selection List */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {FRAMEWORK_OPTIONS.map((f) => {
                  const isChecked = selectedFrameworks.includes(f.id);
                  const isRecommended = 
                    (market === 'SME' && f.recommendedFor === 'SME') ||
                    (market === 'ACE Market' && (f.recommendedFor === 'ACE Market' || f.recommendedFor === 'SME')) ||
                    (market === 'Main Market' && f.recommendedFor === 'Main Market');

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleToggleFramework(f.id)}
                      className={`w-full p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start space-x-4 ${
                        isChecked 
                          ? 'bg-white border-emerald-500 ring-1 ring-emerald-500/20 shadow-md' 
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white'
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900 block truncate">{f.name}</span>
                          
                          {isRecommended && (
                            <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md">
                              Recommended
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 block font-bold uppercase">{f.organization}</span>
                        <p className="text-[11px] text-gray-600 leading-relaxed font-medium">{f.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation controllers */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(1)}
                  className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center transition-colors cursor-pointer border border-gray-200 hover:bg-gray-50 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoToStep3}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center transition-all shadow-sm cursor-pointer"
                >
                  <span>Configure Metrics</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEWS AND KEY TOPICS */}
          {onboardingStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1.5">
                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Disclosure Preconfiguration
                </div>
                <h3 className="text-2xl font-black text-gray-900">Seed priority ESG focus areas</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Pick key environmental, social, or governance themes that are high priority for your company. We will prepare active indicators with input forms in your dashboard.
                </p>
              </div>

              {/* Topics Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {TOPIC_OPTIONS.map((opt) => {
                  const isChecked = selectedPriorities.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTogglePriority(opt.id)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start space-x-3.5 ${
                        isChecked 
                          ? 'bg-white border-emerald-500 ring-1 ring-emerald-500/20 shadow-md' 
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-900 block">{opt.id}</span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            opt.category === 'Environmental' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            opt.category === 'Social' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            'bg-purple-50 text-purple-600 border border-purple-100'
                          }`}>
                            {opt.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-normal font-medium">{opt.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation controllers */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(2)}
                  className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center transition-colors cursor-pointer border border-gray-200 hover:bg-gray-50 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center transition-all shadow-sm cursor-pointer animate-pulse-slow"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span>Initialize ESG Environment</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: INTUITIVE BOOTSTRAPPING ENGINE (Animated loading) */}
          {onboardingStep === 4 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
              <div className="relative">
                {/* Visual pulsating green aura */}
                <div className="absolute inset-0 w-20 h-20 bg-emerald-500/20 rounded-3xl blur-xl animate-ping" />
                <div className="w-20 h-20 bg-white border border-emerald-100 rounded-3xl flex items-center justify-center text-emerald-500 relative z-10 shadow-lg animate-spin-slow">
                  <Compass className="w-10 h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-gray-900">Initializing your workspace...</h3>
                <p className="text-sm text-gray-500 font-medium">{loadingText}</p>
              </div>

              {/* Progress visual feedback bar */}
              <div className="max-w-sm w-full pt-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex w-full">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300 rounded-full"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-bold text-gray-400 pt-2 uppercase tracking-wider">
                  <span>System Setup</span>
                  <span>{loadingProgress}%</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 3. Footer Row */}
      <footer className="h-12 border-t border-gray-200 bg-white px-6 flex items-center justify-between text-xs font-medium text-gray-500 shrink-0 sticky bottom-0 z-50">
        <span>© 2026 Lestari ESG Malaysia Onboarding Console</span>
        <div className="flex items-center">
           <Lock className="w-3.5 h-3.5 mr-1.5" />
           <span>Secure ISO/IEC 27001 Certified Host</span>
        </div>
      </footer>

    </div>
  );
}"""

pattern = re.compile(r'export default function OnboardingPage\(\) \{.*?\n\}\n', re.DOTALL)
new_code = pattern.sub(new_component_str, code)

with open('src/components/OnboardingPage.tsx', 'w') as f:
    f.write(new_code)
