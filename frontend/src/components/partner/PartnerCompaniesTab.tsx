/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { partnerConsoleApi, PartnerCompanySummary } from '../../api/partnerConsoleApi';
import { planFromBackend, marketFromBackend } from '../../api/mappers';

export default function PartnerCompaniesTab() {
  const [companies, setCompanies] = useState<PartnerCompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    partnerConsoleApi.myCompanies()
      .then(setCompanies)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Your Companies</h1>
        <p className="text-sm text-gray-500 mt-1">Companies provisioned under your brand. Read-only for now.</p>
      </div>

      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
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
              {loading && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-xs font-medium">Loading…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-xs font-medium">Failed to load — try refreshing.</td></tr>
              )}
              {!loading && !error && companies.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-xs font-medium">No companies provisioned under your brand yet.</td></tr>
              )}
              {!loading && companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-6 py-3.5 text-gray-500">{marketFromBackend(c.marketClassification)}</td>
                  <td className="px-6 py-3.5 text-gray-500 uppercase">{planFromBackend(c.subscriptionPlan)}</td>
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
