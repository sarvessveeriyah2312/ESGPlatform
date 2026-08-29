/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';

export interface PartnerResponse {
  id: string;
  name: string;
  brandName: string;
  logoAsset: string | null;
  primaryColor: string | null;
  supportEmail: string | null;
  emailFromAddress: string | null;
  subdomainSlug: string | null;
  billingModel: string | null;
  revenueSharePercent: number | null;
  stripeConnected: boolean;
  createdAt: string;
}

export interface SavePartnerRequest {
  name: string;
  brandName: string;
  logoAsset?: string;
  primaryColor?: string;
  supportEmail?: string;
  emailFromAddress?: string;
  subdomainSlug?: string;
  billingModel?: string;
  revenueSharePercent?: number | null;
}

/** WHITELABEL_PLAN.md Phase 5 — scaffolded, never exercised against a real onboarded account. */
export interface StripeConnectStatusResponse {
  connected: boolean;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

/** Returned once, at creation time — see backend CreatePartnerAdminUserResponse's own doc comment. */
export interface CreatePartnerAdminUserResponse {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  temporaryPassword: string;
}

export const partnerAdminApi = {
  list: () => apiClient.get<PartnerResponse[]>('/api/v1/admin/partners'),

  create: (request: SavePartnerRequest) => apiClient.post<PartnerResponse>('/api/v1/admin/partners', request),

  update: (id: string, request: SavePartnerRequest) => apiClient.put<PartnerResponse>(`/api/v1/admin/partners/${id}`, request),

  remove: (id: string) => apiClient.delete<void>(`/api/v1/admin/partners/${id}`),

  /** Creates the partner's own login (WHITELABEL_PLAN.md Phase 4) — no partner self-service yet. */
  createUser: (partnerId: string, name: string, email: string) =>
    apiClient.post<CreatePartnerAdminUserResponse>(`/api/v1/admin/partners/${partnerId}/users`, { name, email }),

  /** Creates (if needed) the partner's Stripe Express account and returns a fresh onboarding link — open it in a new tab. */
  startStripeConnectOnboarding: (partnerId: string) =>
    apiClient.post<{ url: string }>(`/api/v1/admin/partners/${partnerId}/stripe-connect/link`, {}),

  getStripeConnectStatus: (partnerId: string) =>
    apiClient.get<StripeConnectStatusResponse>(`/api/v1/admin/partners/${partnerId}/stripe-connect/status`),
};
