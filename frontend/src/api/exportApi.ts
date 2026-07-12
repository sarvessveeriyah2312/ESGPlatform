/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';

export type ExportFormat = 'PDF' | 'WORD' | 'CSV' | 'CSV_CSI';

export interface ExportHistoryResponse {
  id: string;
  generatedAt: string;
  exportType: string;
  format: ExportFormat;
  fiscalYear: number;
  generatedByName: string | null;
  signedOffByName: string | null;
  signedOffAt: string | null;
}

export const exportApi = {
  csv: (fiscalYear: number) => apiClient.post<string>('/api/v1/exports/csv', undefined, { fiscalYear }),

  csi: (fiscalYear: number) => apiClient.post<string>('/api/v1/exports/csi', undefined, { fiscalYear }),

  history: () => apiClient.get<ExportHistoryResponse[]>('/api/v1/exports/history'),

  integratedReportPdf: (fiscalYear: number) => apiClient.getBlob(`/api/v1/exports/integrated-report.pdf?fiscalYear=${fiscalYear}`),

  log: (exportType: string, format: ExportFormat, fiscalYear: number) =>
    apiClient.post<void>('/api/v1/exports/log', { exportType, format, fiscalYear }),

  signOff: (id: string) => apiClient.patch<ExportHistoryResponse>(`/api/v1/exports/history/${id}/sign-off`),
};

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
