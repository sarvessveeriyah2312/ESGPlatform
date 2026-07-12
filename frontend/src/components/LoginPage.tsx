/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Trees, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { postLoginPath } from '../permissions';
import Button from './ui/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, sessionExpired, clearSessionExpired } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Landed here because a request came back 401 (expired/invalid token) rather than an explicit
  // "Log out" click — explain why, then clear the flag so it doesn't resurface on a later visit.
  useEffect(() => {
    if (sessionExpired) {
      setErrorMessage('Your session has expired. Please log in again.');
      clearSessionExpired();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email) {
      setErrorMessage('Please enter your corporate email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your secure account password.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const user = await login(email, password);
      setSuccessMessage('Authentication successful. Initializing secure workspace...');
      
      // Short delay before redirecting for smooth UX
      setTimeout(() => {
        navigate(postLoginPath(user.role, user.onboardingCompleted));
      }, 600);
    } catch (error: any) {
      setIsSubmitting(false);
      setErrorMessage(error.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleQuickLogin = async (demoEmail: string, isCorp: boolean) => {
    setEmail(demoEmail);
    setPassword('demo1234');
    setErrorMessage('');
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    try {
      const user = await login(demoEmail, 'demo1234');
      navigate(postLoginPath(user.role, user.onboardingCompleted));
    } catch (error: any) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
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
              Enterprise ESG <br/>Reporting Platform.
            </h1>
            <p className="text-emerald-100/80 text-lg leading-relaxed">
              Consolidate data, align with NSRF and IFRS standards, and automate your Bursa Malaysia disclosures in one secure environment.
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

      {/* Right section: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative bg-white border-l border-gray-100">
        
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-8 left-6 sm:left-12 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
            <Trees className="w-5 h-5" />
          </div>
          <span className="text-lg font-black text-gray-900 tracking-tight">Lestari</span>
        </div>

        {/* Back Link */}
        <div className="absolute top-8 right-6 sm:right-12">
           <button 
             onClick={() => navigate('/')}
             className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full"
           >
             <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
             <span>Back</span>
           </button>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8 py-12">
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back</h3>
            <p className="text-sm text-gray-500 mt-2">Sign in to manage your sustainability indicators and corporate disclosures.</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center shadow-sm">
                <Lock className="w-4 h-4 mr-2" />
                {errorMessage}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center shadow-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                {successMessage}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 placeholder-gray-400 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700">Password</label>
                <button 
                  type="button"
                  onClick={() => alert("Please contact platform administration at support@lestari.my to reset your enterprise-linked SSO credentials.")}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs font-medium text-gray-600 cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-gray-500 pt-4">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/register')}
              className="text-emerald-600 font-bold hover:underline cursor-pointer"
            >
              Sign Up
            </button>
          </div>

          {/* Quick Sandbox Login Section */}
          <div className="pt-8 border-t border-gray-100 space-y-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center">
              Sandbox Test Accounts
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <button
                onClick={() => handleQuickLogin('sarvesh@lestari.my', true)}
                disabled={isSubmitting}
                className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-left cursor-pointer transition-all space-y-1.5 shadow-sm group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Sarvesh Veeri</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Starter</span>
                </div>
                <span className="text-[10px] text-gray-500 block">SME User (SEDG)</span>
              </button>
              
              <button
                onClick={() => handleQuickLogin('sarah.lim@gamuda.com', true)}
                disabled={isSubmitting}
                className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-left cursor-pointer transition-all space-y-1.5 shadow-sm group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Sarah Lim</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">Issuer</span>
                </div>
                <span className="text-[10px] text-gray-500 block">Corp. Admin (IFRS)</span>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}