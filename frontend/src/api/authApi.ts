/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';
import { BackendMarketClassification, BackendSubscriptionPlan } from './mappers';

export interface MeResponse {
  userId: string;
  name: string;
  email: string;
  role: 'COMPANY_ADMIN' | 'COMPANY_CONTRIBUTOR' | 'CONSULTANT' | 'PLATFORM_ADMIN' | 'SUPERADMIN';
  companyId: string | null;
  companyName: string | null;
  sectorCode: string | null;
  market: BackendMarketClassification | null;
  plan: BackendSubscriptionPlan | null;
  onboardingCompleted: boolean;
  frameworks: string[];
  priorities: string[];
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  bio: string | null;
  hasAvatar: boolean;
}

export interface AuthResponse {
  token: string;
  user: MeResponse;
}

export interface InvitePreviewResponse {
  companyName: string;
  name: string;
  email: string;
  role: 'COMPANY_ADMIN' | 'COMPANY_CONTRIBUTOR' | 'CONSULTANT';
  invitedByName: string | null;
}

export const authApi = {
  register: (name: string, email: string, password: string, companyName: string) =>
    apiClient.post<AuthResponse>('/api/v1/auth/register', { name, email, password, companyName }),

  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/api/v1/auth/login', { email, password }),

  me: () => apiClient.get<MeResponse>('/api/v1/auth/me'),

  completeOnboarding: (data: {
    market: BackendMarketClassification;
    sectorCode?: string;
    frameworks: string[];
    priorities: string[];
  }) => apiClient.patch<MeResponse>('/api/v1/auth/onboarding', data),

  previewInvite: (token: string) => apiClient.get<InvitePreviewResponse>(`/api/v1/auth/invites/${token}`),

  acceptInvite: (token: string, name: string, password: string) =>
    apiClient.post<AuthResponse>(`/api/v1/auth/invites/${token}/accept`, { name, password }),

  updateProfile: (data: { name: string; email: string; phone: string; dateOfBirth: string | null; address: string; bio: string }) =>
    apiClient.patch<MeResponse>('/api/v1/auth/profile', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postFile<MeResponse>('/api/v1/auth/profile/avatar', formData);
  },

  avatarUrl: () => apiClient.getBlob('/api/v1/auth/profile/avatar'),

  removeAvatar: () => apiClient.delete<MeResponse>('/api/v1/auth/profile/avatar'),
};
