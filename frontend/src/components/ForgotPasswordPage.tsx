import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trees, Mail, ArrowRight, ArrowLeft, CheckCircle, MailCheck } from 'lucide-react';
import { authApi } from '../api/authApi';
import { useToast } from '../contexts/ToastContext';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your account email address.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      // Backend never reveals whether the email exists — a failure here means the request itself broke.
      showToast(err?.message || 'Something went wrong. Please try again.', 'error');
    } finally {
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
            <span className="text-2xl font-black text-white tracking-tight">EsgEasy</span>
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

      {/* Right section: Forgot Password Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative bg-white border-l border-gray-100">

        {/* Mobile Header */}
        <div className="lg:hidden absolute top-8 left-6 sm:left-12 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
            <Trees className="w-5 h-5" />
          </div>
          <span className="text-lg font-black text-gray-900 tracking-tight">EsgEasy</span>
        </div>

        {/* Back Link */}
        <div className="absolute top-8 right-6 sm:right-12">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            <span>Back</span>
          </button>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8 py-12">
          {submitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <MailCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Check your email</h3>
                <p className="text-sm text-gray-500">
                  If an account exists for <strong className="text-gray-700">{email.trim()}</strong>, we've sent a password reset link. It expires in 1 hour.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center shadow-sm mt-2"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Forgot your password?</h3>
                <p className="text-sm text-gray-500 mt-2">Enter your account email and we'll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 placeholder-gray-400 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </form>

              <div className="text-center text-xs text-gray-500 pt-4">
                Remember your password?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-emerald-600 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
