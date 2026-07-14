/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';
import { BackendMarketClassification, BackendSubscriptionPlan } from './mappers';
import { TenantUserResponse, BackendRole } from './tenantAdminApi';

export interface CreateTenantUserResponse extends TenantUserResponse {
  temporaryPassword: string;
}

export interface TeamInviteResponse {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
  invitedByName: string | null;
  createdAt: string;
  expiresAt: string;
  expired: boolean;
  inviteUrl: string;
}

export interface CompanyResponse {
  id: string;
  name: string;
  sectorCode: string | null;
  sizeBand: 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE' | null;
  marketClassification: BackendMarketClassification;
  subscriptionPlan: BackendSubscriptionPlan;
  sectorModuleEnabled: boolean;
  onboardingCompleted: boolean;
}

export interface CompanyGroupMember {
  id: string;
  name: string;
  sectorCode: string | null;
  marketClassification: BackendMarketClassification;
  subscriptionPlan: BackendSubscriptionPlan;
  current: boolean;
}

export const companyApi = {
  get: () => apiClient.get<CompanyResponse>('/api/v1/company'),

  updatePlan: (plan: BackendSubscriptionPlan) =>
    apiClient.patch<CompanyResponse>('/api/v1/company/plan', { plan }),

  updateProfile: (data: { sectorCode?: string; sizeBand?: string; sectorModuleEnabled?: boolean }) =>
    apiClient.patch<CompanyResponse>('/api/v1/company/profile', data),

  listUsers: () => apiClient.get<TenantUserResponse[]>('/api/v1/company/users'),

  createUser: (name: string, email: string, role: BackendRole) =>
    apiClient.post<CreateTenantUserResponse>('/api/v1/company/users', { name, email, role }),

  updateUserRole: (userId: string, role: BackendRole) =>
    apiClient.patch<TenantUserResponse>(`/api/v1/company/users/${userId}/role`, { role }),

  setUserActive: (userId: string, active: boolean) =>
    apiClient.patch<TenantUserResponse>(`/api/v1/company/users/${userId}/active?active=${active}`),

  listInvites: () => apiClient.get<TeamInviteResponse[]>('/api/v1/company/invites'),

  createInvite: (name: string, email: string, role: BackendRole) =>
    apiClient.post<TeamInviteResponse>('/api/v1/company/invites', { name, email, role }),

  resendInvite: (inviteId: string) =>
    apiClient.post<TeamInviteResponse>(`/api/v1/company/invites/${inviteId}/resend`),

  revokeInvite: (inviteId: string) =>
    apiClient.delete<void>(`/api/v1/company/invites/${inviteId}`),

  getGroup: () => apiClient.get<CompanyGroupMember[]>('/api/v1/company/group'),

  createSubsidiary: (name: string) =>
    apiClient.post<CompanyGroupMember>('/api/v1/company/subsidiaries', { name }),

  switchCompany: (companyId: string) =>
    apiClient.post<CompanyGroupMember>(`/api/v1/company/switch/${companyId}`),

  deleteSubsidiary: (companyId: string) =>
    apiClient.delete<void>(`/api/v1/company/subsidiaries/${companyId}`),
};
