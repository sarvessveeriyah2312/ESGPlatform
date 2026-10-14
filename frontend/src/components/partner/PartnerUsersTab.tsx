import React, { useEffect, useState } from 'react';
import { Plus, X, KeyRound, Copy, Check, Power } from 'lucide-react';
import { partnerConsoleApi, PartnerUserResponse, CreatePartnerAdminUserResponse } from '../../api/partnerConsoleApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../ui/Button';

/** A partner's own team of PARTNER_ADMIN logins — every teammate sees the same read-only company list, there are no sub-roles here (unlike a tenant company's Team view). */
export default function PartnerUsersTab() {
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<PartnerUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatePartnerAdminUserResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = () => {
    setLoading(true);
    partnerConsoleApi.listUsers()
      .then(setUsers)
      .catch(() => showToast('Failed to load your team.', 'warning'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openInvite = () => {
    setInviteName('');
    setInviteEmail('');
    setCreatedCredentials(null);
    setCopied(false);
    setInviteOpen(true);
  };

  const invite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast('Name and email are required.', 'warning');
      return;
    }
    setInviting(true);
    partnerConsoleApi.inviteUser(inviteName, inviteEmail)
      .then((res) => {
        setCreatedCredentials(res);
        refresh();
      })
      .catch((err) => showToast(err?.message || 'Failed to invite teammate.', 'warning'))
      .finally(() => setInviting(false));
  };

  const copyPassword = () => {
    if (!createdCredentials) return;
    navigator.clipboard.writeText(createdCredentials.temporaryPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => showToast('Could not copy — select and copy manually.', 'warning'));
  };

  const toggleActive = (u: PartnerUserResponse) => {
    setTogglingId(u.id);
    partnerConsoleApi.setUserActive(u.id, !u.active)
      .then(() => {
        showToast(`${u.name} ${u.active ? 'deactivated' : 'reactivated'}.`, 'success');
        refresh();
      })
      .catch((err) => showToast(err?.message || 'Failed to update teammate.', 'warning'))
      .finally(() => setTogglingId(null));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Teammates who can sign in and see your companies.</p>
        </div>
        <Button variant="primary" size="sm" onClick={openInvite} icon={<Plus className="w-4 h-4" />}>
          Invite Teammate
        </Button>
      </div>

      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-white text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-xs font-medium">Loading…</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-xs font-medium">No teammates yet.</td></tr>
              )}
              {!loading && users.map((u) => {
                const isSelf = u.email.toLowerCase() === me?.email?.toLowerCase();
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-gray-900">{u.name}{isSelf && <span className="ml-1.5 text-[10px] text-gray-400 font-normal">(you)</span>}</td>
                    <td className="px-6 py-3.5 text-gray-500">{u.email}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <span className={`w-1 h-1 rounded-full mr-1.5 ${u.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 font-mono">{u.createdAt.slice(0, 10)}</td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={isSelf || togglingId === u.id}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={isSelf ? "You can't deactivate your own login" : u.active ? 'Deactivate' : 'Reactivate'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-100 rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in text-gray-700">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-gray-900">Invite Teammate</h4>
              </div>
              <button onClick={() => setInviteOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 cursor-pointer transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!createdCredentials ? (
              <>
                <p className="text-xs text-gray-500 leading-relaxed">
                  They'll get their own login with the same read-only view of your companies.
                </p>
                <div className="space-y-3">
                  <Field label="Name" value={inviteName} onChange={setInviteName} placeholder="e.g. Aisyah Rahman" />
                  <Field label="Email" value={inviteEmail} onChange={setInviteEmail} placeholder="teammate@partner.com" />
                </div>
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                  <button onClick={() => setInviteOpen(false)} className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <Button variant="primary" size="sm" loading={inviting} onClick={invite}>
                    Invite
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Shown once — copy it now. There's no way to retrieve this password again after closing this dialog.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">Email</label>
                    <div className="text-sm font-mono text-gray-900">{createdCredentials.email}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">Temporary Password</label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-sm font-mono text-gray-900 bg-white border border-amber-200 rounded-lg px-3 py-2 break-all">
                        {createdCredentials.temporaryPassword}
                      </code>
                      <button
                        onClick={copyPassword}
                        className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg cursor-pointer transition-colors shrink-0"
                        title="Copy"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                  <Button variant="primary" size="sm" onClick={() => setInviteOpen(false)}>
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
      />
    </div>
  );
}
