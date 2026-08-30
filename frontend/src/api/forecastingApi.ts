/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';

export type TrendDirection = 'INCREASING' | 'DECREASING' | 'FLAT';
export type ForecastStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';

export interface ForecastPoint {
  fiscalYear: number;
  value: number;
  projected: boolean;
}

export interface TargetAlignment {
  targetId: string;
  targetTitle: string;
  targetYear: number;
  targetValue: number;
  projectedValueAtTargetYear: number;
  status: ForecastStatus;
}

export interface ForecastSummaryResponse {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  lastActualYear: number;
  lastActualValue: number;
  trendDirection: TrendDirection;
  projectionYear: number;
  projectedValue: number;
  targetAlignment: TargetAlignment | null;
}

export interface IndicatorForecastResponse {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  points: ForecastPoint[];
  trendDirection: TrendDirection;
  targetAlignment: TargetAlignment | null;
  narrative: string | null;
  actionPlan: string | null;
}

export interface ForecastNarrativeResponse {
  text: string;
}

export const forecastingApi = {
  list: () => apiClient.get<ForecastSummaryResponse[]>('/api/v1/forecasting'),

  get: (indicatorId: string) => apiClient.get<IndicatorForecastResponse>(`/api/v1/forecasting/${indicatorId}`),

  generateNarrative: (indicatorId: string) =>
    apiClient.post<ForecastNarrativeResponse>(`/api/v1/forecasting/${indicatorId}/narrative`),

  generateActionPlan: (indicatorId: string) =>
    apiClient.post<ForecastNarrativeResponse>(`/api/v1/forecasting/${indicatorId}/action-plan`),
};
