/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';
import { BackendMarketClassification, BackendSubscriptionPlan } from './mappers';
import { SupportTicketResponse, TicketMessageResponse, TicketStatus } from './supportTicketApi';
import { ActivityLogResponse } from './activityLogApi';

/** Deliberately minimal — see backend PartnerCompanySummaryResponse's own doc comment on why this isn't the fuller TenantSummaryResponse a platform admin sees. */
export interface PartnerCompanySummary {
  id: string;
  name: string;
  marketClassification: BackendMarketClassification;
  subscriptionPlan: BackendSubscriptionPlan;
  active: boolean;
  createdAt: string;
}

export interface PartnerBrandingResponse {
  brandName: string;
  logoAsset: string | null;
  primaryColor: string | null;
  supportEmail: string | null;
  emailFromAddress: string | null;
}

export interface UpdatePartnerBrandingRequest {
  brandName: string;
  logoAsset?: string;
  primaryColor?: string;
  supportEmail?: string;
  emailFromAddress?: string;
}

/** The admin-set % plus a live Stripe Connect status pull, in one round trip — see backend PartnerRevenueSummaryResponse. */
export interface PartnerRevenueSummary {
  revenueSharePercent: number | null;
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export interface PartnerUserResponse {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}

/** Returned once, at invite time — see backend CreatePartnerAdminUserResponse's own doc comment. */
export interface CreatePartnerAdminUserResponse {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  temporaryPassword: string;
}

export type PartnerInvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE';

/** The full backend InvoiceResponse shape (unlike invoiceAdminApi's narrower one) — the partner Billing tab links out to the hosted invoice/PDF. */
export interface PartnerInvoiceResponse {
  id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string | null;
  dueDate: string;
  amount: number;
  status: PartnerInvoiceStatus;
  description: string | null;
  createdAt: string;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
}

export interface PartnerSecuritySettingsResponse {
  mfaRequiredForTeam: boolean;
}

/** For a signed-in PARTNER_ADMIN only — see WHITELABEL_PLAN.md Phase 4. Every call is implicitly scoped to the caller's own partner; there's no partnerId param anywhere here. */
export const partnerConsoleApi = {
  myCompanies: () => apiClient.get<PartnerCompanySummary[]>('/api/v1/partner/companies'),

  getBranding: () => apiClient.get<PartnerBrandingResponse>('/api/v1/partner/branding'),
  updateBranding: (request: UpdatePartnerBrandingRequest) =>
    apiClient.put<PartnerBrandingResponse>('/api/v1/partner/branding', request),

  getRevenue: () => apiClient.get<PartnerRevenueSummary>('/api/v1/partner/revenue'),
  startStripeConnectOnboarding: () => apiClient.post<{ url: string }>('/api/v1/partner/stripe-connect/link', {}),

  listUsers: () => apiClient.get<PartnerUserResponse[]>('/api/v1/partner/users'),
  inviteUser: (name: string, email: string) =>
    apiClient.post<CreatePartnerAdminUserResponse>('/api/v1/partner/users', { name, email }),
  setUserActive: (userId: string, active: boolean) =>
    apiClient.patch<void>(`/api/v1/partner/users/${userId}/active?active=${active}`),

  listInvoices: () => apiClient.get<PartnerInvoiceResponse[]>('/api/v1/partner/invoices'),

  /** A partner acts as first-line support for its own client companies' tickets — reply, note, and claim/resolve, same as the admin support APIs. See WHITELABEL_PLAN.md's scope note. */
  listSupportTickets: () => apiClient.get<SupportTicketResponse[]>('/api/v1/partner/support-tickets'),
  listSupportTicketMessages: (ticketId: string) => apiClient.get<TicketMessageResponse[]>(`/api/v1/partner/support-tickets/${ticketId}/messages`),
  postSupportTicketMessage: (ticketId: string, message: string) =>
    apiClient.post<TicketMessageResponse>(`/api/v1/partner/support-tickets/${ticketId}/messages`, { message }),
  updateSupportTicketStatus: (ticketId: string, status: TicketStatus) =>
    apiClient.patch<SupportTicketResponse>(`/api/v1/partner/support-tickets/${ticketId}/status`, { status }),
  updateSupportTicketNote: (ticketId: string, note: string) =>
    apiClient.patch<SupportTicketResponse>(`/api/v1/partner/support-tickets/${ticketId}/note`, { note }),

  listAuditLog: (limit?: number) => apiClient.get<ActivityLogResponse[]>('/api/v1/partner/audit-log', limit ? { limit } : undefined),
  getAuditLogEntry: (id: string) => apiClient.get<ActivityLogResponse>(`/api/v1/partner/audit-log/${id}`),

  getSecuritySettings: () => apiClient.get<PartnerSecuritySettingsResponse>('/api/v1/partner/security-settings'),
  updateSecuritySettings: (mfaRequiredForTeam: boolean) =>
    apiClient.put<PartnerSecuritySettingsResponse>('/api/v1/partner/security-settings', { mfaRequiredForTeam }),
};
