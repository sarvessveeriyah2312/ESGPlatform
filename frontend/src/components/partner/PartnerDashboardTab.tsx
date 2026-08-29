/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Percent, CreditCard, ArrowRight } from 'lucide-react';
import { partnerConsoleApi, PartnerCompanySummary, PartnerRevenueSummary } from '../../api/partnerConsoleApi';
import { useToast } from '../../contexts/ToastContext';
import { marketFromBackend, planFromBackend } from '../../api/mappers';
import { PRICING_PLAN_ORDER, PLAN_LABELS, PLAN_BADGE_CLASSES } from '../admin/constants';

const PLAN_BAR_COLORS: Record<string, string> = {
  STARTER: 'bg-gray-400',
  GROWTH: 'bg-indigo-500',
  ISSUER_READY: 'bg-purple-500',
  ON_PREM: 'bg-slate-800',
};

/** Landing view for the partner console — aggregates from the same data the Companies/Revenue tabs already fetch, no new backend endpoint needed. */
export default function PartnerDashboardTab() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<PartnerCompanySummary[]>([]);
  const [revenue, setRevenue] = useState<PartnerRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([partnerConsoleApi.myCompanies(), partnerConsoleApi.getRevenue()])
      .then(([companiesRes, revenueRes]) => {
        setCompanies(companiesRes);
        setRevenue(revenueRes);
      })
      .catch(() => showToast('Failed to load dashboard.', 'warning'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.active).length;
  const planCounts = PRICING_PLAN_ORDER.reduce<Record<string, number>>((acc, plan) => {
    acc[plan] = companies.filter((c) => c.subscriptionPlan === plan).length;
    return acc;
  }, {});
  const recentCompanies = [...companies]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (loading) {
    return <div className="text-center py-24 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">An overview of the companies provisioned under your brand.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Total Companies</p>
              <h3 className="text-gray-900 text-2xl font-bold">{totalCompanies}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Active Companies</p>
              <h3 className="text-gray-900 text-2xl font-bold">{activeCompanies}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Your Revenue Share</p>
              <h3 className="text-gray-900 text-2xl font-bold">{revenue?.revenueSharePercent != null ? `${revenue.revenueSharePercent}%` : '—'}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Stripe Connect</p>
              <h3 className="text-gray-900 text-lg font-bold">
                {revenue?.connected ? (revenue.chargesEnabled && revenue.payoutsEnabled ? 'Active' : 'Pending') : 'Not connected'}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {totalCompanies > 0 && (
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm space-y-2">
          <span className="text-gray-500 text-xs font-medium">Companies by Plan Tier</span>
          <div className="h-3 rounded-full overflow-hidden flex w-full bg-gray-100">
            {PRICING_PLAN_ORDER.map((plan) => (
              planCounts[plan] > 0 && (
                <div key={plan} style={{ width: `${(planCounts[plan] / totalCompanies) * 100}%` }} className={`${PLAN_BAR_COLORS[plan]} h-full`} title={PLAN_LABELS[plan]} />
              )
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-gray-500 pt-1">
            {PRICING_PLAN_ORDER.map((plan) => (
              <span key={plan} className="flex items-center">
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${PLAN_BAR_COLORS[plan]}`} />
                {PLAN_LABELS[plan]} ({planCounts[plan]})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900">Recently Joined</h4>
          {totalCompanies > 5 && (
            <button
              onClick={() => navigate('/partner/companies')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-white text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Market</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {recentCompanies.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-xs font-medium">No companies provisioned under your brand yet.</td></tr>
              )}
              {recentCompanies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-6 py-3.5 text-gray-500">{marketFromBackend(c.marketClassification)}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${PLAN_BADGE_CLASSES[c.subscriptionPlan]}`}>
                      {planFromBackend(c.subscriptionPlan)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      <span className={`w-1 h-1 rounded-full mr-1.5 ${c.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {c.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-gray-500 font-mono">{c.createdAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
