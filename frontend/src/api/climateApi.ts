/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';

export type RiskOpportunityType = 'RISK' | 'OPPORTUNITY';
export type TimeHorizon = 'SHORT' | 'MEDIUM' | 'LONG';
export type Currency = 'MYR' | 'USD' | 'EUR';
export type ReviewFrequency = 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY';
export type IntegrationLevel = 'FULLY_INTEGRATED' | 'PARTIALLY_INTEGRATED' | 'STANDALONE_PROCESS';

export interface S1ItemResponse {
  id: string;
  title: string;
  type: RiskOpportunityType;
  description: string | null;
  horizon: TimeHorizon;
  financialImpact: number | null;
  currency: Currency;
}

export interface BusinessSegmentResponse {
  id: string;
  name: string;
  items: S1ItemResponse[];
}

export interface UpsertS1ItemRequest {
  title: string;
  type: RiskOpportunityType;
  description?: string;
  horizon: TimeHorizon;
  financialImpact?: number;
  currency: Currency;
}

export interface IfrsS2Response {
  oversightDescription: string | null;
  reviewFrequency: ReviewFrequency | null;
  responsibleCommittee: string | null;
  physicalRisks: string | null;
  transitionPlan: string | null;
  climateResilience: string | null;
  identificationProcess: string | null;
  integrationLevel: IntegrationLevel | null;
  trackedMetrics: string | null;
  reductionTargets: string | null;
  carbonPricing: string | null;
  linkedTargetId: string | null;
}

export interface EmissionPoint {
  fiscalYear: number;
  value: number;
}

export interface Scope3ValuePoint {
  fiscalYear: number;
  value: number;
  transitionRelief: boolean;
}

export interface Scope3CategoryResponse {
  id: string;
  name: string;
  tooltip: string | null;
  values: Scope3ValuePoint[];
}

export interface EmissionsResponse {
  scope1: EmissionPoint[];
  scope2: EmissionPoint[];
  scope3: Scope3CategoryResponse[];
}

export type EmissionScopeType = 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';

export interface EmissionFactorResponse {
  id: string;
  name: string;
  scope: EmissionScopeType;
  activityUnit: string;
  factorValue: number;
  source: string;
  sourceYear: number;
}

export interface EmissionActivityEntryResponse {
  id: string;
  fiscalYear: number;
  emissionFactorId: string;
  emissionFactorName: string;
  quantity: number;
  calculatedTco2e: number;
}

export const climateApi = {
  listSegments: () => apiClient.get<BusinessSegmentResponse[]>('/api/v1/ifrs/s1/segments'),
  createSegment: (name: string) => apiClient.post<BusinessSegmentResponse>('/api/v1/ifrs/s1/segments', { name }),
  addItem: (segmentId: string, data: UpsertS1ItemRequest) =>
    apiClient.post<S1ItemResponse>(`/api/v1/ifrs/s1/segments/${segmentId}/items`, data),
  updateItem: (itemId: string, data: UpsertS1ItemRequest) =>
    apiClient.put<S1ItemResponse>(`/api/v1/ifrs/s1/items/${itemId}`, data),
  deleteItem: (itemId: string) => apiClient.delete<void>(`/api/v1/ifrs/s1/items/${itemId}`),

  getS2: () => apiClient.get<IfrsS2Response>('/api/v1/ifrs/s2'),
  updateS2: (data: IfrsS2Response) => apiClient.put<IfrsS2Response>('/api/v1/ifrs/s2', data),

  getEmissions: () => apiClient.get<EmissionsResponse>('/api/v1/climate/emissions'),
  setScope1: (fiscalYear: number, value: number) =>
    apiClient.put<EmissionsResponse>(`/api/v1/climate/emissions/scope1/${fiscalYear}`, { value }),
  setScope2: (fiscalYear: number, value: number) =>
    apiClient.put<EmissionsResponse>(`/api/v1/climate/emissions/scope2/${fiscalYear}`, { value }),
  createScope3Category: (name: string, tooltip?: string) =>
    apiClient.post<Scope3CategoryResponse>('/api/v1/climate/emissions/scope3/categories', { name, tooltip }),
  setScope3Value: (categoryId: string, fiscalYear: number, value: number) =>
    apiClient.put<EmissionsResponse>(`/api/v1/climate/emissions/scope3/categories/${categoryId}/values/${fiscalYear}`, { value }),

  listEmissionFactors: () => apiClient.get<EmissionFactorResponse[]>('/api/v1/climate/activity/factors'),
  listActivityEntries: (fiscalYear: number) =>
    apiClient.get<EmissionActivityEntryResponse[]>('/api/v1/climate/activity/entries', { fiscalYear }),
  addActivityEntry: (fiscalYear: number, factorId: string, quantity: number) =>
    apiClient.post<EmissionActivityEntryResponse>('/api/v1/climate/activity/entries', { fiscalYear, factorId, quantity }),
  deleteActivityEntry: (id: string) => apiClient.delete<void>(`/api/v1/climate/activity/entries/${id}`),
  applyActivityToScope: (fiscalYear: number, scope: EmissionScopeType) =>
    apiClient.post<EmissionsResponse>('/api/v1/climate/activity/entries/apply', undefined, { fiscalYear, scope }),
};
