import { apiClient } from './client';

export interface IndicatorPromptResponse {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  systemPrompt: string;
  userPromptTemplate: string;
  isCustomized: boolean;
}

export interface UpdateIndicatorPromptRequest {
  systemPrompt: string;
  userPromptTemplate: string;
}

export const indicatorPromptApi = {
  list: () => apiClient.get<IndicatorPromptResponse[]>('/api/v1/company/ai/indicator-prompts'),

  update: (indicatorId: string, data: UpdateIndicatorPromptRequest) =>
    apiClient.put<IndicatorPromptResponse>(`/api/v1/company/ai/indicator-prompts/${indicatorId}`, data),

  resetToDefault: (indicatorId: string) =>
    apiClient.delete<IndicatorPromptResponse>(`/api/v1/company/ai/indicator-prompts/${indicatorId}/override`),
};
