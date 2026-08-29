/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { partnerConsoleApi, PartnerInvoiceResponse } from '../../api/partnerConsoleApi';
import { useToast } from '../../contexts/ToastContext';

/** Read-only invoice ledger for every company under this partner — mirrors AdminBillingTab's summary-cards + table shape, scoped down. */
export default function PartnerBillingTab() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<PartnerInvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    partnerConsoleApi.listInvoices()
      .then(setInvoices)
      .catch(() => showToast('Failed to load invoices.', 'warning'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const paidInvoices = invoices.filter((inv) => inv.status === 'PAID');
  const grossInvoicedThisMonth = paidInvoices
    .filter((inv) => inv.dueDate.slice(0, 7) === currentMonth)
    .reduce((sum, inv) => sum + inv.amount, 0);
  const outstanding = invoices
    .filter((inv) => inv.status !== 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subscription Billing & Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">Payment history for every company provisioned under your brand.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <span className="text-gray-500 text-xs font-medium block">Paid This Month</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block font-mono">MYR {grossInvoicedThisMonth.toFixed(2)}</span>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <span className="text-gray-500 text-xs font-medium block">Outstanding</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block font-mono">MYR {outstanding.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h4 className="text-sm font-bold text-gray-900">Invoice Ledger</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-white text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-xs font-medium">Loading invoices…</td></tr>
              )}
              {!loading && invoices.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-xs font-medium">No invoices issued yet.</td></tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-bold text-gray-700">{inv.invoiceNumber}</td>
                  <td className="px-6 py-3.5 font-bold text-gray-900">{inv.companyName ?? '—'}</td>
                  <td className="px-6 py-3.5 font-mono text-gray-500">{inv.dueDate}</td>
                  <td className="px-6 py-3.5 font-bold font-mono text-gray-700">MYR {inv.amount.toFixed(2)}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                      inv.status === 'OVERDUE' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {inv.status === 'PAID' ? 'Paid' : inv.status === 'OVERDUE' ? 'Overdue' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {inv.hostedInvoiceUrl && (
                        <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700" title="View invoice">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700" title="Download PDF">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {!inv.hostedInvoiceUrl && !inv.pdfUrl && <span className="text-gray-300">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
