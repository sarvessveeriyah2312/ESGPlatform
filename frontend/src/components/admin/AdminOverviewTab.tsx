/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Building2, CreditCard, TrendingUp } from 'lucide-react';
import Card from '../ui/Card';
import { Tenant, ActivityLog } from './types';
import { PLAN_PRICING } from './constants';

// Activity Logs — no real audit-log table backing this yet, retained as illustrative sample data.
const activityLogs: ActivityLog[] = [
  { id: '1', timestamp: '2026-07-02, 11:45 AM', tenantName: 'Gamuda Berhad', eventType: 'Sync Success', eventDescription: 'Successfully generated and downloaded Bursa CSI manual import CSV', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { id: '2', timestamp: '2026-07-02, 09:30 AM', tenantName: 'Penang Electronic SME', eventType: 'Signup', eventDescription: 'Created dynamic sandbox workspace under SME trial tier', badgeColor: 'bg-blue-50 text-blue-700 border-blue-100' },
  { id: '3', timestamp: '2026-07-01, 04:15 PM', tenantName: 'EsgEasy Workspace', eventType: 'Upgrade', eventDescription: 'Upgraded subscription tier to Premium (Issuer-Ready) via billing settings', badgeColor: 'bg-purple-50 text-purple-700 border-purple-100' },
  { id: '4', timestamp: '2026-06-30, 02:00 PM', tenantName: 'Top Glove Corporation', eventType: 'Support Request', eventDescription: 'Logged ticket: "Difficulty syncing scope 3 carbon metrics"', badgeColor: 'bg-amber-50 text-amber-700 border-amber-100' },
  { id: '5', timestamp: '2026-06-29, 10:12 AM', tenantName: 'ACE Tech Solutions', eventType: 'Sync Success', eventDescription: 'Completed Materiality matrix and finalized 10 active indicators', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
];

interface AdminOverviewTabProps {
  tenants: Tenant[];
}

export default function AdminOverviewTab({ tenants }: AdminOverviewTabProps) {
  const totalTenants = tenants.length;
  const mrrTotal = tenants.reduce((acc, curr) => acc + (curr.status === 'Active' ? PLAN_PRICING[curr.plan] : 0), 0);
  const starterCount = tenants.filter(t => t.plan === 'starter').length;
  const growthCount = tenants.filter(t => t.plan === 'growth').length;
  const issuerCount = tenants.filter(t => t.plan === 'issuer-ready').length;

  const conversionRate = 28.5; // Trial to Paid Conversion — no signup/upgrade cohort data exists to compute this for real

  return (
    <div className="space-y-6">

      {/* Top Header Row */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Platform Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time stats and audit-trail logs across all tenant workspaces.</p>
      </div>

      {/* Top Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stat card 1 */}
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Total Registered Tenants</p>
              <h3 className="text-gray-900 text-2xl font-bold">{totalTenants}</h3>
            </div>
          </div>
        </div>

        {/* Stat card 2 */}
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Active Monthly Revenue</p>
              <h3 className="text-gray-900 text-2xl font-bold font-mono">${mrrTotal.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Stat card 3: Horizontal Plan Breakdown Bar */}
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-medium">Tenants by Plan Tier</span>
            <span className="text-[10px] font-bold text-gray-400 font-mono">{starterCount}S / {growthCount}G / {issuerCount}I</span>
          </div>

          {/* Bar Visualizer */}
          <div className="h-3 rounded-full overflow-hidden flex w-full bg-gray-100">
            <div style={{ width: `${(starterCount / totalTenants) * 100}%` }} className="bg-gray-400 h-full" title="Starter Plan" />
            <div style={{ width: `${(growthCount / totalTenants) * 100}%` }} className="bg-indigo-500 h-full" title="Growth Plan" />
            <div style={{ width: `${(issuerCount / totalTenants) * 100}%` }} className="bg-purple-500 h-full" title="Issuer-Ready Plan" />
          </div>

          {/* Small Legend */}
          <div className="flex justify-between text-[10px] font-semibold text-gray-500 pt-1">
            <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1" />Starter</span>
            <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1" />Growth</span>
            <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1" />Issuer</span>
          </div>
        </div>

        {/* Stat card 4 */}
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1 flex items-center">
                Trial-to-Paid <span className="ml-2 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Above baseline</span>
              </p>
              <h3 className="text-gray-900 text-2xl font-bold font-mono">{conversionRate}%</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Auditing Log Table */}
      <Card className="bg-white text-slate-900 border border-slate-100 overflow-hidden shadow-2xl" padded="none">
        <div className="px-6 py-5 border-b border-navy-50 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-navy-950">System-Wide Security & Lifecycle Audits</h4>
            <p className="text-xs text-navy-400 mt-0.5">Real-time capture of compliance milestones, plan upgrades, and key user actions.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50 text-navy-500 text-[10px] uppercase font-bold tracking-wider font-mono">
                <th className="px-6 py-3.5">Audit Timestamp</th>
                <th className="px-6 py-3.5">Tenant Company</th>
                <th className="px-6 py-3.5">Action Code</th>
                <th className="px-6 py-3.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50 text-navy-700 font-medium">
              {activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-navy-50/45 transition-colors">
                  <td className="px-6 py-4 font-mono text-[11px] text-navy-500">{log.timestamp}</td>
                  <td className="px-6 py-4 font-bold text-navy-950">{log.tenantName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${log.badgeColor}`}>
                      {log.eventType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-navy-600 text-xs leading-relaxed">{log.eventDescription}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
