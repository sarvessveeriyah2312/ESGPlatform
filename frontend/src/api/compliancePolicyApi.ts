/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';

export type ComplianceStatus = 'NOT_ESTABLISHED' | 'CURRENT' | 'DUE_SOON' | 'OVERDUE';

export interface CompliancePolicyResponse {
  policyKey: string;
  name: string;
  description: string | null;
  reviewCycleMonths: number;
  lastReviewedAt: string | null;
  nextReviewDueAt: string | null;
  documentUrl: string | null;
  status: ComplianceStatus;
}

export const compliancePolicyApi = {
  list: () => apiClient.get<CompliancePolicyResponse[]>('/api/v1/governance/compliance-policies'),

  markReviewed: (key: string, documentUrl?: string) =>
    apiClient.patch<CompliancePolicyResponse>(`/api/v1/governance/compliance-policies/${key}/review`, { documentUrl }),
};
