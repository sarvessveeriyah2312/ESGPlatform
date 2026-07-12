import re

with open('src/components/PlaceholderViews.tsx', 'r') as f:
    code = f.read()

replacement = """export function SettingsView() {
  return (
    <div className="w-full max-w-[1200px] mx-auto pb-16">
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="space-y-1">
            <button className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-100 text-gray-900 font-semibold rounded-lg text-sm cursor-pointer">
              <div className="flex items-center space-x-3">
                 <User className="w-4 h-4 text-gray-500" />
                 <span>Profile</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-2.5 text-gray-600 hover:bg-gray-50 font-medium rounded-lg text-sm cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                 <Shield className="w-4 h-4 text-gray-400" />
                 <span>Security</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">2FA</span>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-2.5 text-gray-600 hover:bg-gray-50 font-medium rounded-lg text-sm cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                 <SettingsIcon className="w-4 h-4 text-gray-400" />
                 <span>Preferences</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-2.5 text-gray-600 hover:bg-gray-50 font-medium rounded-lg text-sm cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                 <Bell className="w-4 h-4 text-gray-400" />
                 <span>Notifications</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-2.5 text-gray-600 hover:bg-gray-50 font-medium rounded-lg text-sm cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                 <LinkIcon className="w-4 h-4 text-gray-400" />
                 <span>Connected Accounts</span>
              </div>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">4</span>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-2.5 text-gray-600 hover:bg-gray-50 font-medium rounded-lg text-sm cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                 <CreditCard className="w-4 h-4 text-gray-400" />
                 <span>Billing & Plan</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-2.5 text-gray-600 hover:bg-gray-50 font-medium rounded-lg text-sm cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                 <Lock className="w-4 h-4 text-gray-400" />
                 <span>Privacy & Data</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Center Content: Profile Form */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
           <h3 className="text-lg font-bold text-gray-900">Profile</h3>
           <p className="text-xs text-gray-500 mt-1 mb-6">This information will be displayed on your account.</p>

           <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
                 SV
              </div>
              <div className="flex-1">
                 <p className="text-sm font-semibold text-gray-900 mb-1">Profile Photo</p>
                 <p className="text-xs text-gray-500">PNG or JPG, max 2MB</p>
              </div>
              <div className="flex items-center space-x-3">
                 <button className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                   Upload
                 </button>
                 <button className="px-4 py-2 text-red-500 hover:bg-red-50 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                   Remove
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-gray-700">First name</label>
                 <input type="text" defaultValue="Sarvesh" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-gray-700">Last name</label>
                 <input type="text" defaultValue="Veeri" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-500 transition-colors" />
              </div>
           </div>

           <div className="mb-1 space-y-2">
              <label className="text-xs font-semibold text-gray-700">Email address</label>
              <input type="email" defaultValue="sarvesh@lestari.my" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-500 transition-colors" />
           </div>
           <p className="text-[10px] text-gray-400 mb-6">Used for account recovery and statements</p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-gray-700">Phone number</label>
                 <input type="tel" defaultValue="+60 12-345 6789" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-gray-700">Date of birth</label>
                 <div className="relative">
                   <input type="text" defaultValue="12/23/1990" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-500 transition-colors" />
                   <Calendar className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                 </div>
              </div>
           </div>

           <div className="mb-6 space-y-2">
              <label className="text-xs font-semibold text-gray-700">Address</label>
              <textarea defaultValue={"123 Corporate Tower, KLCC\\n50088 Kuala Lumpur\\nMalaysia"} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-500 transition-colors h-24 resize-none leading-relaxed" />
           </div>

           <div className="mb-8 space-y-2">
              <label className="text-xs font-semibold text-gray-700">Bio</label>
              <textarea defaultValue="ESG Specialist focused on building sustainable and compliant corporate operations." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-500 transition-colors h-24 resize-none leading-relaxed" />
           </div>
        </div>

        {/* Right Content: Profile Cards */}
        <div className="w-full md:w-80 flex flex-col space-y-4 shrink-0">
           
           {/* Profile Progress Card */}
           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-6 flex flex-col items-center justify-center text-white">
                 <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg mb-3 shadow-inner">
                   SV
                 </div>
                 <h4 className="font-bold text-sm">Sarvesh Veeri</h4>
                 <p className="text-[11px] text-emerald-100 mt-1">sarvesh@lestari.my</p>
              </div>
              <div className="p-5">
                 <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Profile Completion</span>
                    <span className="text-xs font-bold text-gray-900">100%</span>
                 </div>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full mb-3">
                    <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
                 </div>
                 <p className="text-[11px] text-gray-500 font-medium">All set! Your profile is complete.</p>
              </div>
           </div>

           {/* Account Info Card */}
           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">Account Info</h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Member since</span>
                    <span className="text-gray-900 font-bold">Mar 14, 2023</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Account ID</span>
                    <span className="text-gray-900 font-bold">LST-78240</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Status</span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider">Verified</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Region</span>
                    <span className="text-gray-900 font-bold">Malaysia</span>
                 </div>
              </div>
           </div>

           {/* Tip Card */}
           <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-5">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs mb-2">
                 <Sparkles className="w-3.5 h-3.5" />
                 <span>TIP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                 Keep your profile updated — your name and email appear on reports and invoices sent to regulators.
              </p>
           </div>

        </div>
      </div>
    </div>
  );
}"""

pattern = re.compile(r'export function SettingsView\(\) \{.*?\n\}\n', re.DOTALL)
new_code = pattern.sub(replacement, code)

# Make sure imports are present for the new icons
imports = """import { User, Shield, Settings as SettingsIcon, Link as LinkIcon, Lock, Sparkles, Calendar } from 'lucide-react';
"""

if "import { User, Shield, Settings as SettingsIcon, Link as LinkIcon, Lock, Sparkles, Calendar }" not in new_code:
    # Just insert it at top
    new_code = imports + new_code

with open('src/components/PlaceholderViews.tsx', 'w') as f:
    f.write(new_code)
