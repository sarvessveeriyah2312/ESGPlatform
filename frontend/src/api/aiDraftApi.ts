import { apiClient } from './client';

export interface DraftRequest {
  draftType: string;
  context: Record<string, string>;
}

export interface DraftResponse {
  text: string;
}

export const aiDraftApi = {
  draft: (request: DraftRequest) => apiClient.post<DraftResponse>('/api/v1/company/ai/draft', request),
};
