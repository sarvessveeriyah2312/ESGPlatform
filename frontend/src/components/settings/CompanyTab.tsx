/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Building2, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { companyApi, CompanyGroupMember } from '../../api/companyApi';

export default function CompanyTab() {
  const [members, setMembers] = useState<CompanyGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const [newCompanyName, setNewCompanyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showMessage = (text: string, type: 'success' | 'warning') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadGroup = () => {
    companyApi.getGroup()
      .then(setMembers)
      .catch(() => showMessage('Failed to load your companies.', 'warning'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGroup();
  }, []);

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCompanyName.trim();
    if (!name) return;
    setCreating(true);
    companyApi.createSubsidiary(name)
      .then((created) => {
        setMembers((prev) => [...prev, created]);
        setNewCompanyName('');
        showMessage(`${created.name} added to your company group.`, 'success');
      })
      .catch(() => showMessage('Failed to add the company — please try again.', 'warning'))
      .finally(() => setCreating(false));
  };

  const handleSwitch = (member: CompanyGroupMember) => {
    if (member.current) return;
    setSwitchingId(member.id);
    companyApi.switchCompany(member.id)
      .then(() => {
        window.location.reload();
      })
      .catch(() => {
        showMessage('Failed to switch companies — please try again.', 'warning');
        setSwitchingId(null);
      });
  };

  const handleDelete = (member: CompanyGroupMember) => {
    companyApi.deleteSubsidiary(member.id)
      .then(() => {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        showMessage(`${member.name} was removed.`, 'success');
      })
      .catch(() => showMessage('Failed to remove the company — it may still have users assigned to it.', 'warning'))
      .finally(() => setConfirmDeleteId(null));
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 ${
          message.type === 'success' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-rose-600 bg-rose-50 border border-rose-100'
        }`}>
          {message.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900">Companies</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Manage subsidiaries or group entities and switch which company&apos;s data you&apos;re working with. Reporting, indicators, and disclosures are kept fully separate per company.
        </p>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="space-y-3 mb-6">
            {members.map((member) => (
              <div
                key={member.id}
                className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border ${
                  member.current ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">{member.name}</span>
                    {member.current && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{member.marketClassification}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!member.current && (
                    <button
                      type="button"
                      onClick={() => handleSwitch(member)}
                      disabled={switchingId === member.id}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-60 cursor-pointer transition-colors"
                    >
                      {switchingId === member.id ? 'Switching…' : 'Switch'}
                    </button>
                  )}

                  {!member.current && confirmDeleteId === member.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(member)}
                        className="px-2 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-gray-700 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : !member.current && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(member.id)}
                      className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Remove company"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submitCreate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 border-t border-gray-100">
          <input
            type="text"
            placeholder="Add a subsidiary or group company..."
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={creating || !newCompanyName.trim()}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-semibold rounded-full cursor-pointer transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            {creating ? 'Adding…' : 'Add Company'}
          </button>
        </form>
      </div>
    </div>
  );
}
