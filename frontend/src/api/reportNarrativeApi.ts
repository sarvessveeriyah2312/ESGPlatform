/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';

export interface ReportNarrativeResponse {
  ceoStatement: string | null;
  reportScopeDescription: string | null;
  companyOverview: string | null;
  esgStrategyNarrative: string | null;
  sustainabilityEmail: string | null;
  investorRelationsEmail: string | null;
}

export interface UpdateReportNarrativeRequest {
  ceoStatement: string;
  reportScopeDescription: string;
  companyOverview: string;
  esgStrategyNarrative: string;
  sustainabilityEmail: string;
  investorRelationsEmail: string;
}

export const reportNarrativeApi = {
  get: () => apiClient.get<ReportNarrativeResponse>('/api/v1/company/report-narrative'),

  update: (data: UpdateReportNarrativeRequest) =>
    apiClient.put<ReportNarrativeResponse>('/api/v1/company/report-narrative', data),
};
