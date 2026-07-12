import re

with open('src/components/RegisterPage.tsx', 'r') as f:
    code = f.read()

new_component_str = r"""export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [employeeSize, setEmployeeSize] = useState('1-50');
  const [country, setCountry] = useState('Malaysia');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const valLength = password.length >= 8;
  const valNumber = /\d/.test(password);
  const valCapital = /[A-Z]/.test(password);
  const valSpecial = /[^A-Za-z0-9]/.test(password);

  const validateStep1 = () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Please state your full authorized name.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please specify a valid corporate work email address.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setErrorMessage('');
    if (!company.trim()) {
      setErrorMessage('Please state your registered corporate entity name.');
      return false;
    }
    return true;
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!valLength || !valNumber || !valCapital || !valSpecial) {
      setErrorMessage('Please meet all password strength indicators.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('Please accept the general service and compliance terms.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await register(name, email, company, password);
      navigate('/onboarding');
    } catch (err) {
      setErrorMessage('Database connection handshake timed out. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
      setErrorMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-gray-900 font-sans">
      
      {/* Left section: Branding & Value Prop */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-800 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-emerald-600 rounded-full blur-3xl opacity-40 mix-blend-overlay translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-2.5 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 font-black text-xl shadow-lg">
              <Trees className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">Lestari</span>
          </div>

          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              Start your ESG <br/>Compliance Journey.
            </h1>
            <p className="text-emerald-100/80 text-lg leading-relaxed">
              Create an enterprise account to generate automated sustainability reports aligned with Bursa Malaysia and IFRS frameworks.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-3 text-emerald-200 text-sm font-medium bg-emerald-800/40 w-fit px-4 py-2 rounded-full border border-emerald-700/50 backdrop-blur-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Bank Negara Climate Risk Aligned</span>
          </div>
          <div className="flex items-center space-x-3 text-emerald-200 text-sm font-medium bg-emerald-800/40 w-fit px-4 py-2 rounded-full border border-emerald-700/50 backdrop-blur-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>End-to-End Scope 3 Verification</span>
          </div>
        </div>
      </div>

      {/* Right section: Signup Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative bg-white border-l border-gray-100">
        
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-8 left-6 sm:left-12 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
            <Trees className="w-5 h-5" />
          </div>
          <span className="text-lg font-black text-gray-900 tracking-tight">Lestari</span>
        </div>

        {/* Top login link */}
        <div className="absolute top-8 right-6 sm:right-12">
          <div className="text-xs text-gray-500 flex items-center space-x-1.5">
            <span>Already registered?</span>
            <button 
              onClick={() => navigate('/login')}
              className="text-emerald-600 font-bold hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8 py-12">
          
          {/* Header */}
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Provision Account</h3>
            <p className="text-sm text-gray-500 mt-2">Initialize your administrative account to configure the workspace.</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl">
            
            {/* Steps indicator */}
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 -z-10 rounded-full transition-all duration-300"
                style={{ width: `${(step - 1) * 50}%` }}
              />
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s ? 'bg-emerald-500 text-white shadow-md' :
                    step > s ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                    'bg-white text-gray-400 border border-gray-200'
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-start shadow-sm">
                <Info className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: ADMIN PROFILE */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-gray-900">1. Administrative Contact</h4>
                  <p className="text-[11px] text-gray-500">Provide the primary operator details for this reporting entity.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Siti Nurhaliza"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 placeholder-gray-400 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Corporate Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 placeholder-gray-400 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ORG PROFILE */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-gray-900">2. Corporate Entity Details</h4>
                  <p className="text-[11px] text-gray-500">How your organization will be officially listed.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Organization Name</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Lestari Green Tech Sdn Bhd"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 placeholder-gray-400 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Employee Headcount</label>
                    <select
                      value={employeeSize}
                      onChange={(e) => setEmployeeSize(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 shadow-sm transition-all cursor-pointer"
                    >
                      <option value="1-50">1 - 50</option>
                      <option value="51-200">51 - 200</option>
                      <option value="201-1000">201 - 1,000</option>
                      <option value="1000+">1,000+</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Headquarters</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 shadow-sm transition-all cursor-pointer"
                    >
                      <option value="Malaysia">Malaysia</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Indonesia">Indonesia</option>
                      <option value="Other">Other International</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PASSWORD SETUP */}
            {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="space-y-5 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-gray-900">3. Create Secure Password</h4>
                  <p className="text-[11px] text-gray-500">Establish your secure administrative password.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 placeholder-gray-400 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password validation checklists */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Password Strength</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                    <div className="flex items-center space-x-1.5">
                      {valLength ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                      <span className={valLength ? 'text-emerald-700 font-bold' : 'text-gray-500'}>Min 8 chars</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {valCapital ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                      <span className={valCapital ? 'text-emerald-700 font-bold' : 'text-gray-500'}>Upper case</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {valNumber ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                      <span className={valNumber ? 'text-emerald-700 font-bold' : 'text-gray-500'}>One number</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {valSpecial ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                      <span className={valSpecial ? 'text-emerald-700 font-bold' : 'text-gray-500'}>Special symbol</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Verify Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 placeholder-gray-400 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Terms Acceptance checkbox */}
                <div className="flex items-start space-x-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs font-medium text-gray-600 leading-relaxed cursor-pointer select-none">
                    I authorize Lestari ESG to provision my cloud reporting environment and I accept the <span className="text-emerald-600 underline">Service Agreement</span>.
                  </label>
                </div>
              </form>
            )}

            {/* Stepper controls */}
            <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-100">
              
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center transition-colors cursor-pointer border border-gray-200 hover:bg-gray-50 rounded-xl"
                >
                  <ChevronRight className="w-4 h-4 mr-1.5 rotate-180" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center transition-all shadow-sm cursor-pointer ml-auto"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </button>
              ) : (
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting || !termsAccepted}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center shadow-sm cursor-pointer transition-all ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Provisioning...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <span>Provision</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Security context banner */}
        <div className="flex justify-between text-[10px] font-medium text-gray-400 pb-6 px-6">
          <div className="flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            <span>Enterprise SSO Integrity Checked</span>
          </div>
          <div className="flex items-center">
            <Lock className="w-3.5 h-3.5 mr-1" />
            <span>PDPA Data Privacy Compliant</span>
          </div>
        </div>

      </div>
    </div>
  );
}"""

# Since r"..." treats \ as literal, we can do replacement properly without \d escape issue
# but we can also just split the file around the function and replace it.

pattern = re.compile(r'export default function RegisterPage\(\) \{.*?\n\}\n', re.DOTALL)
new_code = pattern.sub(new_component_str.replace('\\', '\\\\'), code) # we have to double escape if we use re.sub, because sub interprets \ as group reference.
# wait, actually we can just pass a function to sub to avoid string escape interpretation.

def repl(m):
    return new_component_str

new_code = pattern.sub(repl, code)

with open('src/components/RegisterPage.tsx', 'w') as f:
    f.write(new_code)
