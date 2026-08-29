/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Handshake, Building2, Sparkles, Image as ImageIcon, Mail, Send, Globe, Percent, ShieldCheck, KeyRound, Copy, Check, CreditCard, ExternalLink } from 'lucide-react';
import { partnerAdminApi, PartnerResponse, SavePartnerRequest, CreatePartnerAdminUserResponse, StripeConnectStatusResponse } from '../../api/partnerAdminApi';
import { ShowToast } from './types';
import Button from '../ui/Button';

interface AdminPartnersTabProps {
  showToast: ShowToast;
}

const EMPTY_FORM: SavePartnerRequest = {
  name: '', brandName: '', logoAsset: '', primaryColor: '', supportEmail: '', emailFromAddress: '', subdomainSlug: '', billingModel: '', revenueSharePercent: null,
};

const DEFAULT_COLOR = '#10B981';

export default function AdminPartnersTab({ showToast }: AdminPartnersTabProps) {
  const [partners, setPartners] = useState<PartnerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SavePartnerRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create-login flow (WHITELABEL_PLAN.md Phase 4) — separate from the edit-partner modal above.
  const [loginModalPartner, setLoginModalPartner] = useState<PartnerResponse | null>(null);
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatePartnerAdminUserResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Stripe Connect status (WHITELABEL_PLAN.md Phase 5) — only fetched while editing an existing partner.
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatusResponse | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const refresh = () => {
    setLoading(true);
    partnerAdminApi.list()
      .then(setPartners)
      .catch(() => showToast('Failed to load partners.', 'warning'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: PartnerResponse) => {
    setEditingId(p.id);
    setForm({
      name: p.name, brandName: p.brandName, logoAsset: p.logoAsset ?? '', primaryColor: p.primaryColor ?? '',
      supportEmail: p.supportEmail ?? '', emailFromAddress: p.emailFromAddress ?? '', subdomainSlug: p.subdomainSlug ?? '', billingModel: p.billingModel ?? '',
      revenueSharePercent: p.revenueSharePercent,
    });
    setModalOpen(true);
    setConnectStatus(null);
    setConnectLoading(true);
    partnerAdminApi.getStripeConnectStatus(p.id)
      .then(setConnectStatus)
      .catch(() => showToast('Failed to load Stripe Connect status.', 'warning'))
      .finally(() => setConnectLoading(false));
  };

  const startConnectOnboarding = () => {
    if (!editingId) return;
    setConnecting(true);
    partnerAdminApi.startStripeConnectOnboarding(editingId)
      .then((res) => {
        window.open(res.url, '_blank', 'noopener,noreferrer');
        showToast('Opened Stripe onboarding in a new tab.', 'success');
      })
      .catch((err) => showToast(err?.message || 'Failed to start Stripe Connect onboarding.', 'warning'))
      .finally(() => setConnecting(false));
  };

  const save = () => {
    if (!form.name.trim() || !form.brandName.trim()) {
      showToast('Name and brand name are required.', 'warning');
      return;
    }
    setSaving(true);
    const call = editingId ? partnerAdminApi.update(editingId, form) : partnerAdminApi.create(form);
    call
      .then(() => {
        showToast(editingId ? `Updated "${form.brandName}".` : `Created partner "${form.brandName}".`, 'success');
        setModalOpen(false);
        refresh();
      })
      .catch((err) => showToast(err?.message || 'Failed to save partner.', 'warning'))
      .finally(() => setSaving(false));
  };

  const openCreateLogin = (p: PartnerResponse) => {
    setLoginModalPartner(p);
    setLoginName('');
    setLoginEmail('');
    setCreatedCredentials(null);
    setCopied(false);
  };

  const createLogin = () => {
    if (!loginModalPartner) return;
    if (!loginName.trim() || !loginEmail.trim()) {
      showToast('Name and email are required.', 'warning');
      return;
    }
    setCreatingLogin(true);
    partnerAdminApi.createUser(loginModalPartner.id, loginName, loginEmail)
      .then((res) => {
        setCreatedCredentials(res);
        showToast(`Login created for ${loginModalPartner.brandName}.`, 'success');
      })
      .catch((err) => showToast(err?.message || 'Failed to create login.', 'warning'))
      .finally(() => setCreatingLogin(false));
  };

  const copyPassword = () => {
    if (!createdCredentials) return;
    navigator.clipboard.writeText(createdCredentials.temporaryPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => showToast('Could not copy — select and copy manually.', 'warning'));
  };

  const remove = (p: PartnerResponse) => {
    setDeletingId(p.id);
    partnerAdminApi.remove(p.id)
      .then(() => {
        showToast(`Deleted "${p.brandName}".`, 'success');
        refresh();
      })
      .catch((err) => showToast(err?.message || 'Failed to delete partner — unlink its companies first.', 'warning'))
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Partners</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              White-label partners a tenant company can be linked to — independent of plan tier, see WHITELABEL_PLAN.md.
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
          Add Partner
        </Button>
      </div>

      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-white text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Internal Name</th>
                <th className="px-6 py-4">Subdomain</th>
                <th className="px-6 py-4">Support Email</th>
                <th className="px-6 py-4">Billing Model</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-xs font-medium">Loading partners…</td></tr>
              )}
              {!loading && partners.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-xs font-medium">No partners yet — Phase 0 of WHITELABEL_PLAN.md: line up a real prospect before this list needs to grow.</td></tr>
              )}
              {!loading && partners.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center space-x-2.5">
                      <BrandSwatch logoAsset={p.logoAsset} primaryColor={p.primaryColor} name={p.brandName} size={26} />
                      <span className="font-semibold text-gray-900">{p.brandName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-gray-500">{p.name}</td>
                  <td className="px-6 py-3.5 text-gray-500 font-mono">{p.subdomainSlug ?? '—'}</td>
                  <td className="px-6 py-3.5 text-gray-500">{p.supportEmail ?? '—'}</td>
                  <td className="px-6 py-3.5 text-gray-500">{p.billingModel ?? '—'}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openCreateLogin(p)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                        title="Create login"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => remove(p)}
                        disabled={deletingId === p.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-100 rounded-[28px] max-w-2xl w-full shadow-2xl animate-fade-in text-gray-700 max-h-[90vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Handshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">{editingId ? 'Edit Partner' : 'Add Partner'}</h4>
                  <p className="text-[11px] text-gray-400">Sets branding & contact info — this doesn't grant any plan or feature access on its own.</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 cursor-pointer transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-6">

              {/* Live brand preview — updates as the form changes below */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-3">Preview — what their customers see</div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="h-1.5" style={{ backgroundColor: form.primaryColor?.trim() || DEFAULT_COLOR }} />
                  <div className="flex items-center space-x-3 px-4 py-3.5">
                    <BrandSwatch logoAsset={form.logoAsset} primaryColor={form.primaryColor} name={form.brandName || form.name} size={36} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{form.brandName || 'Brand Name'}</div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {form.subdomainSlug ? `${form.subdomainSlug}.esgeasy.my` : 'Reporting Platform'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity */}
              <FormSection title="Identity">
                <Field icon={<Building2 className="w-3.5 h-3.5" />} label="Internal Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Acme Sustainability Consulting" />
                <Field icon={<Sparkles className="w-3.5 h-3.5" />} label="Brand Name (customer-facing) *" value={form.brandName} onChange={(v) => setForm({ ...form, brandName: v })} placeholder="e.g. Acme ESG Portal" />
              </FormSection>

              {/* Branding */}
              <FormSection title="Branding">
                <Field icon={<ImageIcon className="w-3.5 h-3.5" />} label="Logo URL" value={form.logoAsset ?? ''} onChange={(v) => setForm({ ...form, logoAsset: v })} placeholder="https://…" />
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> <span>Primary Color</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={/^#[0-9A-Fa-f]{6}$/.test(form.primaryColor ?? '') ? form.primaryColor! : DEFAULT_COLOR}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer shrink-0 p-0.5 bg-white"
                      title="Pick a color"
                    />
                    <input
                      type="text"
                      value={form.primaryColor ?? ''}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      placeholder="#10B981"
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 font-mono outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </FormSection>

              {/* Contact */}
              <FormSection title="Contact">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field icon={<Mail className="w-3.5 h-3.5" />} label="Support Email" value={form.supportEmail ?? ''} onChange={(v) => setForm({ ...form, supportEmail: v })} placeholder="support@partner.com" />
                  <Field icon={<Send className="w-3.5 h-3.5" />} label="Email From Address" value={form.emailFromAddress ?? ''} onChange={(v) => setForm({ ...form, emailFromAddress: v })} placeholder="no-reply@partner.com" />
                </div>
              </FormSection>

              {/* Distribution & billing */}
              <FormSection title="Distribution & Billing">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                      <Globe className="w-3.5 h-3.5 text-gray-400" /> <span>Subdomain Slug</span>
                    </label>
                    <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                      <input
                        type="text"
                        value={form.subdomainSlug ?? ''}
                        onChange={(e) => setForm({ ...form, subdomainSlug: e.target.value })}
                        placeholder="acme"
                        className="flex-1 min-w-0 px-3 py-2 text-sm text-gray-900 outline-none"
                      />
                      <span className="pr-3 text-xs text-gray-400 font-mono whitespace-nowrap">.esgeasy.my</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Reserved for later — not routed to a live brand yet.</p>
                  </div>
                  <Field icon={<Percent className="w-3.5 h-3.5" />} label="Billing Model (free text)" value={form.billingModel ?? ''} onChange={(v) => setForm({ ...form, billingModel: v })} placeholder="e.g. 15% revenue share" />
                </div>
                <div className="space-y-1 max-w-[240px]">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                    <Percent className="w-3.5 h-3.5 text-gray-400" /> <span>Revenue Share %</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={form.revenueSharePercent ?? ''}
                    onChange={(e) => setForm({ ...form, revenueSharePercent: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-gray-400">The actual % automatically routed to this partner's connected Stripe account. Leave blank for no automated split.</p>
                </div>
              </FormSection>

              {/* Stripe Connect (WHITELABEL_PLAN.md Phase 5) — only relevant once the partner already exists */}
              {editingId && (
                <FormSection title="Stripe Connect">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                    {connectLoading ? (
                      <p className="text-xs text-gray-400">Checking status…</p>
                    ) : connectStatus?.connected ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-mono text-gray-600 truncate">{connectStatus.stripeAccountId}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill ok={connectStatus.detailsSubmitted} label="Details submitted" />
                          <StatusPill ok={connectStatus.chargesEnabled} label="Charges enabled" />
                          <StatusPill ok={connectStatus.payoutsEnabled} label="Payouts enabled" />
                        </div>
                        {!(connectStatus.chargesEnabled && connectStatus.payoutsEnabled) && (
                          <Button variant="secondary" size="sm" loading={connecting} onClick={startConnectOnboarding} icon={<ExternalLink className="w-3.5 h-3.5" />}>
                            Resume Onboarding
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Not connected yet — this partner has no Stripe Express account. Revenue share only applies to payments made after onboarding is complete.
                        </p>
                        <Button variant="secondary" size="sm" loading={connecting} onClick={startConnectOnboarding} icon={<ExternalLink className="w-3.5 h-3.5" />}>
                          Start Stripe Connect Onboarding
                        </Button>
                      </>
                    )}
                  </div>
                </FormSection>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <Button variant="primary" size="sm" loading={saving} onClick={save}>
                {editingId ? 'Save Changes' : 'Create Partner'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loginModalPartner && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-100 rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in text-gray-700">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">Create Login</h4>
                  <p className="text-[11px] text-gray-400">For {loginModalPartner.brandName}</p>
                </div>
              </div>
              <button onClick={() => setLoginModalPartner(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 cursor-pointer transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!createdCredentials ? (
              <>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Creates the one login this partner uses to see their own companies (read-only) — see the Partner Console. No self-service signup yet, so this is the only way one gets created.
                </p>
                <div className="space-y-3">
                  <Field label="Name" value={loginName} onChange={setLoginName} placeholder="e.g. Aisyah Rahman" />
                  <Field label="Email" value={loginEmail} onChange={setLoginEmail} placeholder="admin@partner.com" />
                </div>
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setLoginModalPartner(null)}
                    className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button variant="primary" size="sm" loading={creatingLogin} onClick={createLogin}>
                    Create Login
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
                  <Button variant="primary" size="sm" onClick={() => setLoginModalPartner(null)}>
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

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
      {label}
    </span>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ icon, label, value, onChange, placeholder }: { icon?: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span>{label}</span>
      </label>
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

/** Logo image if a URL is set, otherwise a colored initial-letter chip using the brand's own primary color — same fallback idea as the tenant-list avatar chips elsewhere in this admin panel. */
function BrandSwatch({ logoAsset, primaryColor, name, size }: { logoAsset?: string | null; primaryColor?: string | null; name: string; size: number }) {
  const color = /^#[0-9A-Fa-f]{6}$/.test(primaryColor ?? '') ? primaryColor! : DEFAULT_COLOR;
  const style = { width: size, height: size };

  if (logoAsset?.trim()) {
    return (
      <img
        src={logoAsset}
        alt=""
        style={style}
        className="rounded-lg object-cover border border-gray-100 shrink-0 bg-white"
        onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
      />
    );
  }

  return (
    <div
      style={{ ...style, backgroundColor: color }}
      className="rounded-lg flex items-center justify-center text-white font-black shrink-0"
    >
      <span style={{ fontSize: size * 0.42 }}>{(name || '?').trim().slice(0, 1).toUpperCase()}</span>
    </div>
  );
}
