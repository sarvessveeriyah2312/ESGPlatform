import React, { useEffect, useState } from 'react';
import { CreditCard, ExternalLink, Percent } from 'lucide-react';
import { partnerConsoleApi, PartnerRevenueSummary } from '../../api/partnerConsoleApi';
import { useToast } from '../../contexts/ToastContext';
import Button from '../ui/Button';

/** WHITELABEL_PLAN.md Phase 5 — self-service mirror of the admin Stripe Connect panel in AdminPartnersTab, scoped to the caller's own partner (no partnerId anywhere, backend resolves it from the JWT). */
export default function PartnerRevenueTab() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<PartnerRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const refresh = () => {
    setLoading(true);
    partnerConsoleApi.getRevenue()
      .then(setSummary)
      .catch(() => showToast('Failed to load revenue status.', 'warning'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startOnboarding = () => {
    setConnecting(true);
    partnerConsoleApi.startStripeConnectOnboarding()
      .then((res) => {
        window.open(res.url, '_blank', 'noopener,noreferrer');
        showToast('Opened Stripe onboarding in a new tab.', 'success');
      })
      .catch((err) => showToast(err?.message || 'Failed to start Stripe Connect onboarding.', 'warning'))
      .finally(() => setConnecting(false));
  };

  // Connected accounts here are Standard-shaped (controller[stripe_dashboard][type]=full — see
  // PartnerService.startStripeConnectOnboarding's doc comment for why), so there's no login-link
  // single-sign-on the way there is for Express accounts — the partner logs into
  // dashboard.stripe.com directly with the credentials they set during onboarding.
  const openDashboard = () => {
    window.open('https://dashboard.stripe.com', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Revenue</h1>
        <p className="text-sm text-gray-500 mt-1">Your revenue share and Stripe Connect payout account.</p>
      </div>

      {loading ? (
        <div className="text-center py-24 text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6 flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Revenue Share</div>
              <div className="text-2xl font-bold text-gray-900 mt-0.5">
                {summary?.revenueSharePercent != null ? `${summary.revenueSharePercent}%` : 'Not set'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {summary?.revenueSharePercent != null
                  ? 'Set by your EsgEasy contact — automatically applied to payments once your Stripe account is connected.'
                  : 'No revenue share configured yet — contact your EsgEasy representative.'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stripe Connect</div>

            {summary?.connected ? (
              <>
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm text-gray-700">Your Stripe account is connected.</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill ok={summary.detailsSubmitted} label="Details submitted" />
                  <StatusPill ok={summary.chargesEnabled} label="Charges enabled" />
                  <StatusPill ok={summary.payoutsEnabled} label="Payouts enabled" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  {summary.chargesEnabled && summary.payoutsEnabled ? (
                    <Button variant="secondary" size="sm" onClick={openDashboard} icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Open Stripe Dashboard
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" loading={connecting} onClick={startOnboarding} icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Resume Onboarding
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Connect your Stripe account to receive your revenue share automatically as your companies pay their subscriptions.
                </p>
                <Button variant="primary" size="sm" loading={connecting} onClick={startOnboarding} icon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Connect Stripe Account
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
      {label}
    </span>
  );
}
