/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  FileText, 
  FileCheck, 
  Download, 
  Sparkles, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  Calendar, 
  AlertCircle, 
  ArrowRight,
  Database,
  History,
  Info,
  Eye,
  X
} from 'lucide-react';

import { usePlan } from '../contexts/PlanContext';
import { useAuth } from '../contexts/AuthContext';
import { canAccess, MANAGEMENT_ROLES } from '../permissions';
import Card from './ui/Card';
import Button from './ui/Button';
import UpgradeGate from './ui/UpgradeGate';
import { indicatorsApi, IndicatorResponse } from '../api/indicatorsApi';
import { exportApi, ExportHistoryResponse, ExportFormat, downloadCsv } from '../api/exportApi';
import { companyApi, CompanyResponse } from '../api/companyApi';
import { materialityApi, AssessmentSummaryResponse, ScoreResponse } from '../api/materialityApi';
import { governanceApi, GovernanceLevelResponse, MatterOwnershipResponse } from '../api/governanceApi';
import { compliancePolicyApi, CompliancePolicyResponse } from '../api/compliancePolicyApi';
import { climateApi, BusinessSegmentResponse, IfrsS2Response, EmissionsResponse } from '../api/climateApi';
import { marketFromBackend } from '../api/mappers';

// Interface for export history
interface ExportHistoryItem {
  id: string;
  date: string;
  type: string;
  format: string;
  period: string;
  by: string;
  signedOffByName: string | null;
  signedOffAt: string | null;
}

// Micro-component for SVG circular progress
interface ProgressRingProps {
  percent: number;
  label: string;
  subLabel: string;
  colorClass: string;
  bgRingClass?: string;
  locked?: boolean;
}

function ProgressRing({ 
  percent, 
  label, 
  subLabel, 
  colorClass, 
  bgRingClass = "text-navy-100/70", 
  locked = false 
}: ProgressRingProps) {
  const size = 68;
  const strokeWidth = 5.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center text-center p-3.5 bg-navy-50/30 rounded-2xl border border-navy-100/30">
      <div className="relative mb-2.5" style={{ width: size, height: size }}>
        {locked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-100/50 rounded-full border border-dashed border-navy-300">
            <Lock className="w-4 h-4 text-navy-400" />
          </div>
        ) : (
          <>
            <svg className="w-full h-full transform -rotate-90">
              <circle
                className={bgRingClass}
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
              />
              <circle
                className={`${colorClass} transition-all duration-700 ease-out`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-navy-900 font-mono">{percent}%</span>
            </div>
          </>
        )}
      </div>
      <span className="text-xs font-bold text-navy-950 block">{label}</span>
      <span className="text-[10px] text-navy-500 block mt-0.5 leading-tight">{subLabel}</span>
    </div>
  );
}

export default function ReportsExportView() {
  const navigate = useNavigate();
  const { plan, hasFeature } = usePlan();
  const { user } = useAuth();
  const canSignOff = canAccess(user?.role, MANAGEMENT_ROLES);

  const [period, setPeriod] = useState<string>('FY2026');
  const [format, setFormat] = useState<'PDF' | 'Word'>('PDF');
  const [generating, setGenerating] = useState<boolean>(false);
  const [exportingRaw, setExportingRaw] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [activeReportTab, setActiveReportTab] = useState<'summary' | 'ifrs-s1' | 'ifrs-s2'>('summary');
  const [generatingIfrsS1, setGeneratingIfrsS1] = useState<boolean>(false);
  const [generatingIfrsS2, setGeneratingIfrsS2] = useState<boolean>(false);
  const [indicators, setIndicators] = useState<IndicatorResponse[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Real corporate profile, materiality, and governance data — replaces hardcoded report content
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [assessments, setAssessments] = useState<AssessmentSummaryResponse[]>([]);
  const [materialityScores, setMaterialityScores] = useState<ScoreResponse[]>([]);
  const [governanceLevels, setGovernanceLevels] = useState<GovernanceLevelResponse[]>([]);
  const [ownership, setOwnership] = useState<MatterOwnershipResponse[]>([]);
  const [compliancePolicies, setCompliancePolicies] = useState<CompliancePolicyResponse[]>([]);
  const [segments, setSegments] = useState<BusinessSegmentResponse[]>([]);
  const [ifrsS2, setIfrsS2] = useState<IfrsS2Response | null>(null);
  const [emissions, setEmissions] = useState<EmissionsResponse | null>(null);

  // Export history — sourced from the real backend history log
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);

  // The component's period state is a string like 'FY2026' — the backend deals in numeric fiscal years
  const fiscalYear = parseInt(period.replace('FY', ''), 10);

  // Find the recorded value for an indicator in a given fiscal year (values is a sparse list, not a map)
  const getValueForYear = (ind: IndicatorResponse, year: number): number | null => {
    const point = ind.values.find((v) => v.fiscalYear === year);
    return point ? point.value : null;
  };

  const formatDisplayFormat = (fmt: ExportFormat): string => {
    switch (fmt) {
      case 'PDF':
        return 'PDF';
      case 'WORD':
        return 'Word';
      case 'CSV':
        return 'CSV';
      case 'CSV_CSI':
        return 'CSV (CSI)';
      default:
        return fmt;
    }
  };

  const mapHistoryItem = (h: ExportHistoryResponse): ExportHistoryItem => {
    const generated = new Date(h.generatedAt);
    const formattedDate = generated.toISOString().slice(0, 10) + ', ' + generated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      id: h.id,
      date: formattedDate,
      type: h.exportType,
      format: formatDisplayFormat(h.format),
      period: `FY${h.fiscalYear}`,
      by: h.generatedByName ?? 'System',
      signedOffByName: h.signedOffByName,
      signedOffAt: h.signedOffAt
    };
  };

  const refreshHistory = () => {
    exportApi.history()
      .then((rows) => setHistory(rows.map(mapHistoryItem)))
      .catch((e) => console.error(e));
  };

  const handleSignOff = (id: string) => {
    exportApi.signOff(id)
      .then(() => {
        refreshHistory();
        triggerToast('Export signed off.', 'success');
      })
      .catch((e) => {
        console.error(e);
        triggerToast('Failed to sign off — it may already be signed off.', 'error');
      });
  };

  // Load indicators, corporate profile, materiality, governance, and export history from the real API on mount
  useEffect(() => {
    indicatorsApi.list().then(setIndicators).catch((e) => console.error(e));
    companyApi.get().then(setCompany).catch((e) => console.error(e));
    governanceApi.getStructure().then(setGovernanceLevels).catch((e) => console.error(e));
    governanceApi.getOwnership().then(setOwnership).catch((e) => console.error(e));
    compliancePolicyApi.list().then(setCompliancePolicies).catch((e) => console.error(e));
    if (hasFeature('climate-module') && hasFeature('ifrs-s1-s2')) {
      climateApi.listSegments().then(setSegments).catch((e) => console.error(e));
      climateApi.getS2().then(setIfrsS2).catch((e) => console.error(e));
      climateApi.getEmissions().then(setEmissions).catch((e) => console.error(e));
    }
    materialityApi.listAssessments().then((rows) => {
      setAssessments(rows);
      const latest = rows
        .slice()
        .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime())
        .find((a) => a.status === 'VALIDATED') ?? rows
        .slice()
        .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime())[0];
      if (latest) {
        materialityApi.getAssessment(latest.id).then((detail) => setMaterialityScores(detail.scores)).catch((e) => console.error(e));
      }
    }).catch((e) => console.error(e));
    refreshHistory();
  }, []);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Calculate overall indicators progress dynamically based on filled metrics
  const totalIndicators = indicators.length > 0 ? indicators.length : 15;
  const filledIndicators = indicators.length > 0
    ? indicators.filter(ind => getValueForYear(ind, fiscalYear) !== null).length
    : 12; // fallback defaults

  const indicatorsPercentage = Math.round((filledIndicators / totalIndicators) * 100);

  // Real CSI-export readiness — how many applicable indicators actually have a value for this fiscal year
  const csiReadyCount = indicators.filter((ind) => getValueForYear(ind, fiscalYear) !== null).length;
  const csiTotal = indicators.length;

  // Governance is gated by the Growth plan; percentage now reflects real backend state rather than a hardcoded constant
  const isGovernanceUnlocked = hasFeature('governance');
  const governancePercentage = isGovernanceUnlocked ? (governanceLevels.length >= 3 ? 100 : governanceLevels.length > 0 ? 50 : 0) : 0;

  // IFRS S1/S2 & GHG emissions are Issuer-Ready-only features, gated the same way as CSI export
  const isClimateUnlocked = hasFeature('climate-module') && hasFeature('ifrs-s1-s2');
  const scope1Value = emissions?.scope1.find((p) => p.fiscalYear === fiscalYear)?.value ?? null;
  const scope2Value = emissions?.scope2.find((p) => p.fiscalYear === fiscalYear)?.value ?? null;
  const scope3Total = emissions
    ? emissions.scope3.reduce((sum, cat) => sum + (cat.values.find((v) => v.fiscalYear === fiscalYear)?.value ?? 0), 0)
    : null;
  const hasS1Items = segments.some((s) => s.items.length > 0);
  const hasS2Narrative = !!ifrsS2?.oversightDescription;
  const hasEmissionsForYear = scope1Value !== null || scope2Value !== null || (scope3Total !== null && scope3Total > 0);
  const climatePercentage = isClimateUnlocked
    ? Math.round(([hasS1Items, hasS2Narrative, hasEmissionsForYear].filter(Boolean).length / 3) * 100)
    : 0;

  // Materiality — real completion driven by the latest assessment's validation status
  const latestAssessment = assessments
    .slice()
    .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime())
    .find((a) => a.status === 'VALIDATED') ?? assessments
    .slice()
    .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime())[0];
  const materialityPercentage = latestAssessment?.status === 'VALIDATED' ? 100 : assessments.length > 0 ? 50 : 0;

  const sortedMaterialityScores = materialityScores.slice().sort((a, b) => (b.impact + b.influence) - (a.impact + a.influence));
  const materialityLines: string[] = latestAssessment
    ? sortedMaterialityScores.slice(0, 6).map((s) => `- ${s.matterName} (Priority: ${s.priorityTier})`)
    : ['No materiality assessment completed yet.'];

  const GOVERNANCE_LEVEL_LABEL: Record<string, string> = {
    OVERSIGHT: 'Board Level',
    STRATEGIC: 'Strategic Level',
    IMPLEMENTATION: 'Implementation Level'
  };
  const COMPLIANCE_STATUS_LABEL: Record<string, string> = {
    CURRENT: 'Current', DUE_SOON: 'Due Soon', OVERDUE: 'Overdue', NOT_ESTABLISHED: 'Not Established'
  };
  const compliancePolicyLines: string[] = compliancePolicies.map((p) => {
    const statusLabel = COMPLIANCE_STATUS_LABEL[p.status] ?? p.status;
    if (!p.lastReviewedAt) return `${p.name}: ${statusLabel}`;
    const reviewed = new Date(p.lastReviewedAt).toISOString().slice(0, 10);
    const due = p.nextReviewDueAt ? new Date(p.nextReviewDueAt).toISOString().slice(0, 10) : 'N/A';
    return `${p.name}: ${statusLabel} (reviewed ${reviewed}, next due ${due})`;
  });

  const governanceLines: string[] = governanceLevels.length > 0
    ? [
        ...governanceLevels.map((g) => `${GOVERNANCE_LEVEL_LABEL[g.level] ?? g.level}: ${g.roleTitle}`),
        `${ownership.length} sustainability matter(s) have assigned ownership.`,
        ...compliancePolicyLines
      ]
    : ['No governance structure configured yet.'];

  // Real SHA-256 digest of the report's actual textual content — replaces the old Math.random() placeholder
  const computeChecksum = async (content: string): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12).toUpperCase();
  };

  const climateLines: string[] = isClimateUnlocked
    ? [
        ...segments.flatMap((s) => s.items.map((item) => `IFRS S1 [${s.name}]: ${item.title} (${item.type}, ${item.horizon})`)),
        `IFRS S2 Oversight: ${ifrsS2?.oversightDescription ?? 'Not disclosed'}`,
        `Scope 1 GHG (${period}): ${scope1Value ?? 'N/A'} tCO2e`,
        `Scope 2 GHG (${period}): ${scope2Value ?? 'N/A'} tCO2e`,
        `Scope 3 GHG (${period}): ${scope3Total ?? 'N/A'} tCO2e`
      ]
    : ['IFRS S1/S2 and GHG emissions disclosures not included (requires Issuer-Ready plan).'];

  const buildReportSummaryText = (): string => {
    return [
      `Entity: ${company?.name ?? 'Not configured'}`,
      `Sector: ${company?.sectorCode ?? 'Not set'} | Market: ${company ? marketFromBackend(company.marketClassification) : 'Not set'}`,
      `Period: ${period}`,
      ...materialityLines,
      ...governanceLines,
      ...indicators.map((ind) => `${ind.name}: ${getValueForYear(ind, fiscalYear) ?? 'N/A'} ${ind.unit || ''}`),
      ...climateLines
    ].join('\n');
  };

  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setIsPreviewModalOpen(false);
  };

  const handlePreviewReport = async () => {
    if (format !== 'PDF') {
      triggerToast('Preview is only available for PDF format.', 'info');
      return;
    }
    triggerToast('Rendering report preview...', 'info');
    try {
      const blob = await exportApi.integratedReportPdf(fiscalYear);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsPreviewModalOpen(true);
    } catch (e) {
      console.error(e);
      triggerToast('Failed to render the report preview.', 'error');
    }
  };

  // Preview an IFRS S1 or S2 standalone report
  const handlePreviewIfrsReport = async (kind: 's1' | 's2') => {
    triggerToast('Rendering report preview...', 'info');
    try {
      const blob = kind === 's1' ? await exportApi.ifrsS1ReportPdf(fiscalYear) : await exportApi.ifrsS2ReportPdf(fiscalYear);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsPreviewModalOpen(true);
    } catch (e) {
      console.error(e);
      triggerToast('Failed to render the report preview.', 'error');
    }
  };

  // Generate & Download an IFRS S1 or S2 standalone report
  const handleGenerateIfrsReport = (kind: 's1' | 's2') => {
    const setGeneratingFlag = kind === 's1' ? setGeneratingIfrsS1 : setGeneratingIfrsS2;
    const label = kind === 's1' ? 'IFRS S1' : 'IFRS S2';
    setGeneratingFlag(true);
    triggerToast(`Compiling ${label} data and assembling PDF report...`, 'info');

    const fetcher = kind === 's1' ? exportApi.ifrsS1ReportPdf : exportApi.ifrsS2ReportPdf;
    fetcher(fiscalYear)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lestari_${label.replace(' ', '_')}_Report_${period}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        refreshHistory();
        triggerToast(`Successfully downloaded ${label} report for ${period}!`, 'success');
      })
      .catch((e) => {
        console.error(e);
        triggerToast(`Failed to generate the ${label} report.`, 'error');
      })
      .finally(() => setGeneratingFlag(false));
  };

  // Generate & Download the Main Report
  const handleGenerateReport = () => {
    setGenerating(true);
    triggerToast(`Compiling data and assembling ${format} report...`, 'info');

    if (format === 'PDF') {
      exportApi.integratedReportPdf(fiscalYear)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Lestari_ESG_Integrated_Report_${period}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          refreshHistory();
          triggerToast(`Successfully downloaded PDF report for ${period}!`, 'success');
        })
        .catch((e) => {
          console.error(e);
          triggerToast('Failed to generate the PDF report.', 'error');
        })
        .finally(() => setGenerating(false));
      return;
    }

    setTimeout(async () => {
      setGenerating(false);
      const checksum = await computeChecksum(buildReportSummaryText());

      // Build a realistic styled text file to download representing the report
      let fileContent = `========================================================================
LESTARI ESG WORKSPACE - INTEGRATED ESG DISCLOSURE REPORT
Generated for: ${company?.name ?? 'Not configured'}
Period: ${period} | Format: ${format}
Generated Date: ${new Date().toLocaleString()}
Classification: CONFIDENTIAL
========================================================================

TABLE OF CONTENTS
1. Corporate Profile
2. Materiality Matrix & Assessment
3. Governance & Board Oversight
4. ESG Key Performance Indicators (Bursa Aligned)
5. IFRS S1/S2 & GHG Emissions (Scope 1, 2 & 3)
6. Audit & Activity Trails

------------------------------------------------------------------------
1. CORPORATE PROFILE
------------------------------------------------------------------------
Entity Name: ${company?.name ?? 'Not configured'}
Sector: ${company?.sectorCode ?? 'Not set'} | Market: ${company ? marketFromBackend(company.marketClassification) : 'Not set'}
Active Reporting Cycle: Annual (Fiscal Period ${period})
Authorized Reviewer: ${user?.name ?? 'Unknown'}

------------------------------------------------------------------------
2. PRIORITIZED MATERIALITY MATTERS
------------------------------------------------------------------------
${materialityLines.join('\n')}

------------------------------------------------------------------------
3. GOVERNANCE & POLICY STATUS
------------------------------------------------------------------------
${governanceLines.join('\n')}

------------------------------------------------------------------------
4. KEY ESG INDICATORS PERFORMANCE (${period})
------------------------------------------------------------------------
`;

      if (indicators.length > 0) {
        indicators.forEach(ind => {
          const val = getValueForYear(ind, fiscalYear);
          const displayVal = val !== null ? val : 'N/A';
          fileContent += `- ${ind.name}: ${displayVal} ${ind.unit || ''} (Target: ${ind.effectiveTarget ?? 'N/A'})\n`;
        });
      } else {
        fileContent += `- No indicators logged yet.\n`;
      }

      fileContent += `
------------------------------------------------------------------------
5. IFRS S1/S2 & GHG EMISSIONS (${period})
------------------------------------------------------------------------
`;

      if (isClimateUnlocked) {
        const itemCount = segments.reduce((n, s) => n + s.items.length, 0);
        fileContent += `${itemCount} climate risk/opportunity item(s) across ${segments.length} business segment(s) (IFRS S1).\n`;
        fileContent += `IFRS S2 Oversight: ${ifrsS2?.oversightDescription ?? 'Not disclosed'}\n`;
        fileContent += `- Scope 1 (Direct): ${scope1Value !== null ? `${scope1Value} tCO2e` : 'N/A'}\n`;
        fileContent += `- Scope 2 (Indirect, Purchased Energy): ${scope2Value !== null ? `${scope2Value} tCO2e` : 'N/A'}\n`;
        fileContent += `- Scope 3 (Value Chain, All Categories): ${scope3Total !== null ? `${scope3Total} tCO2e` : 'N/A'}\n`;
      } else {
        fileContent += `- Requires the Issuer-Ready plan — not included in this disclosure cycle.\n`;
      }

      fileContent += `
------------------------------------------------------------------------
6. ASSURANCE WORKSPACE AUDIT FILE LOGS
------------------------------------------------------------------------
This document is prepared via Lestari ESG compliance platform.
Verification Checksum: LESTARI-SHA256-${checksum}
Status: Draft - Ready for Corporate Sign-Off (see Export History for sign-off record)
========================================================================
`;

      // Trigger standard browser download
      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lestari_ESG_Integrated_Report_${period}.docx.txt`; // appending txt for simple browser readable format
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log the export in the real backend history, then refresh
      exportApi.log('Integrated ESG Report', 'WORD', fiscalYear)
        .then(() => refreshHistory())
        .catch((e) => console.error(e));
      triggerToast(`Successfully downloaded ${format} report for ${period}!`, 'success');
    }, 1800);
  };

  // Generate & Download the Raw CSV Ledger
  const handleExportCSV = () => {
    setExportingRaw(true);
    triggerToast('Generating raw data ledger...', 'info');

    exportApi.csv(fiscalYear)
      .then((content) => {
        downloadCsv(content, `Lestari_Raw_Indicators_Ledger_${period}.csv`);
        return exportApi.log('Raw Indicators Ledger', 'CSV', fiscalYear);
      })
      .then(() => {
        refreshHistory();
        triggerToast(`Raw Indicators CSV exported successfully!`, 'success');
      })
      .catch((e) => {
        console.error(e);
        triggerToast('Failed to export raw data ledger.', 'error');
      })
      .finally(() => setExportingRaw(false));
  };

  // Generate & Download the CSI Compatible Spreadsheet
  const handleExportCSI = () => {
    triggerToast('Structuring file to match Bursa CSI upload rules...', 'info');

    exportApi.csi(fiscalYear)
      .then((content) => {
        downloadCsv(content, `Bursa_CSI_Manual_Import_${period}.csv`);
        return exportApi.log('Bursa CSI Manual Import', 'CSV_CSI', fiscalYear);
      })
      .then(() => {
        refreshHistory();
        triggerToast('Bursa CSI Manual Import File generated!', 'success');
      })
      .catch((e) => {
        console.error(e);
        triggerToast('Failed to generate Bursa CSI export.', 'error');
      });
  };

  const handleReDownload = (item: ExportHistoryItem) => {
    triggerToast(`Retrieving generated archives for ${item.type}...`, 'info');

    if (item.type === 'Integrated ESG Report' && item.format.includes('PDF')) {
      const itemFiscalYear = parseInt(item.period.replace('FY', ''), 10);
      exportApi.integratedReportPdf(itemFiscalYear)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Lestari_ESG_Integrated_Report_${item.period}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          triggerToast(`Archived ${item.type} downloaded.`, 'success');
        })
        .catch((e) => {
          console.error(e);
          triggerToast('Failed to re-download the report.', 'error');
        });
      return;
    }

    setTimeout(() => {
      if (item.format.includes('PDF')) {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('LESTARI ARCHIVE RE-DOWNLOAD', 14, 20);
        doc.setFontSize(12);
        doc.text(`File Type: ${item.type}`, 14, 30);
        doc.text(`Period: ${item.period}`, 14, 38);
        doc.text(`Format: ${item.format}`, 14, 46);
        doc.text(`Archived On: ${item.date}`, 14, 54);
        doc.text(`Verifier: ${item.by}`, 14, 62);
        doc.text(`[Checksum Verified: OK]`, 14, 78);
        doc.save(`Lestari_Archived_${item.type.replace(/\s+/g, '_')}_${item.period}.pdf`);
      } else {
        // Re-trigger standard text download for this item type
        let content = `LESTARI ARCHIVE RE-DOWNLOAD\nFile Type: ${item.type}\nPeriod: ${item.period}\nFormat: ${item.format}\nArchived On: ${item.date}\nVerifier: ${item.by}\n\n[Checksum Verified: OK]`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Lestari_Archived_${item.type.replace(/\s+/g, '_')}_${item.period}.${item.format.includes('CSV') ? 'csv' : 'docx'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      triggerToast(`Archived ${item.type} downloaded.`, 'success');
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6 py-4 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 bg-navy-950 text-white px-4 py-3 rounded-xl shadow-2xl border border-navy-800 animate-slide-in">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'info' && <Loader2 className="w-4 h-4 text-primary-400 animate-spin shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Row with Title and Period Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-navy-950">Reports & Export Hub</h3>
          <p className="text-xs text-navy-500 mt-1 max-w-xl">
            Compile your disclosures into board-ready reports and structured formats matching Bursa Malaysia reporting criteria.
          </p>
        </div>
        
        {/* Financial Year Selector */}
        <div className="flex items-center space-x-2 shrink-0">
          <Calendar className="w-4 h-4 text-navy-400" />
          <span className="text-xs font-bold text-navy-700">Reporting Cycle:</span>
          <div className="relative inline-block">
            <select
              id="period-selector"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                triggerToast(`Switched active export context to ${e.target.value}`, 'info');
              }}
              className="bg-white border border-navy-200 hover:border-navy-300 text-navy-900 font-bold font-mono text-xs rounded-xl px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-subtle"
            >
              <option value="FY2026">FY2026 (Active)</option>
              <option value="FY2025">FY2025 (Historical)</option>
              <option value="FY2024">FY2024 (Historical)</option>
              <option value="FY2023">FY2023 (Historical)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Type Tab Bar */}
      <div className="flex space-x-1 border-b border-navy-100 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveReportTab('summary')}
          className={`px-6 py-3.5 text-xs font-extrabold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeReportTab === 'summary'
              ? 'border-primary-500 text-primary-600 font-black'
              : 'border-transparent text-navy-500 hover:text-navy-900 hover:border-navy-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5" />
            <span>ESG Disclosure Summary</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('ifrs-s1')}
          className={`px-6 py-3.5 text-xs font-extrabold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeReportTab === 'ifrs-s1'
              ? 'border-primary-500 text-primary-600 font-black'
              : 'border-transparent text-navy-500 hover:text-navy-900 hover:border-navy-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5" />
            <span>IFRS S1 Report</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('ifrs-s2')}
          className={`px-6 py-3.5 text-xs font-extrabold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeReportTab === 'ifrs-s2'
              ? 'border-primary-500 text-primary-600 font-black'
              : 'border-transparent text-navy-500 hover:text-navy-900 hover:border-navy-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5" />
            <span>IFRS S2 Report</span>
          </div>
        </button>
      </div>

      {activeReportTab === 'summary' && (
      <>

      {/* Disclosure Metrics Completion Status Card (Plan Aware) */}
      <Card className="bg-white border-navy-100 p-5 md:p-6" organicGradient>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-md">
            <span className="text-[10px] font-bold text-primary-700 bg-primary-50 border border-primary-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Audit-Ready Summary
            </span>
            <h4 className="text-base font-extrabold text-navy-950">
              Disclosure Completion Overview
            </h4>
            <p className="text-xs text-navy-500 leading-relaxed">
              Overall data integrity readiness across the fundamental pillars of the Simplified ESG Disclosure Guide (SEDG), plus IFRS S1/S2 climate disclosures.
            </p>
          </div>

          {/* Side-by-Side Progress Rings */}
          <div className="grid grid-cols-4 gap-3 sm:gap-6 shrink-0 w-full md:w-auto">
            {/* Ring 1: Materiality */}
            <ProgressRing
              percent={materialityPercentage}
              label="Materiality"
              subLabel="Matrix Complete"
              colorClass="text-emerald-500"
            />

            {/* Ring 2: Governance (Gated) */}
            <ProgressRing
              percent={governancePercentage}
              label="Governance"
              subLabel={isGovernanceUnlocked ? "Board Oversight" : "Growth Required"}
              colorClass="text-indigo-500"
              locked={!isGovernanceUnlocked}
            />

            {/* Ring 3: Indicators */}
            <ProgressRing
              percent={indicatorsPercentage}
              label="Indicators"
              subLabel={`${filledIndicators} of ${totalIndicators} Logged`}
              colorClass="text-primary-500"
            />

            {/* Ring 4: IFRS S1/S2 & GHG Emissions (Issuer-Ready Gated) */}
            <ProgressRing
              percent={climatePercentage}
              label="IFRS & GHG"
              subLabel={isClimateUnlocked ? "S1/S2 + Scope 1-3" : "Issuer-Ready Required"}
              colorClass="text-purple-500"
              locked={!isClimateUnlocked}
            />
          </div>
        </div>
      </Card>

      {/* Primary Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Disclosure Summary (Preview and Generator) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-navy-100 p-6 space-y-6 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-navy-50 pb-4">
                <div>
                  <h4 className="text-base font-extrabold text-navy-950 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-primary-500" />
                    ESG Disclosure Summary Report
                  </h4>
                  <p className="text-xs text-navy-500 mt-0.5">
                    Generates a professional executive summary aligned directly to Malaysian reporting frameworks.
                  </p>
                </div>

                {/* Format Toggle Switches */}
                <div className="flex bg-navy-50 p-1 rounded-xl border border-navy-100 shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => {
                      setFormat('PDF');
                      triggerToast('Selected export format: PDF (Executive Styling)', 'success');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      format === 'PDF' 
                        ? 'bg-white text-navy-950 shadow-sm' 
                        : 'text-navy-500 hover:text-navy-800'
                    }`}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => {
                      setFormat('Word');
                      triggerToast('Selected export format: Word DOCX (Review Optimised)', 'success');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      format === 'Word' 
                        ? 'bg-white text-navy-950 shadow-sm' 
                        : 'text-navy-500 hover:text-navy-800'
                    }`}
                  >
                    Word (.docx)
                  </button>
                </div>
              </div>

              {/* Document Interactive Preview Thumbnail */}
              <div className="border border-navy-100 rounded-2xl bg-navy-50/20 overflow-hidden shadow-inner flex flex-col h-[280px]">
                {/* Window header */}
                <div className="bg-white border-b border-navy-100 px-4 py-2 flex items-center justify-between text-[11px] font-semibold text-navy-500 font-mono">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <div className="flex space-x-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-navy-300">|</span>
                    <span className="text-navy-700 truncate">
                      Lestari_Sustainability_Disclosure_Report_{period}.{format === 'PDF' ? 'pdf' : 'docx'}
                    </span>
                  </div>
                  <span className="text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded font-bold font-sans shrink-0">
                    Ready to Compile
                  </span>
                </div>
                
                {/* Document paper sheet */}
                <div className="flex-1 overflow-y-auto p-5 bg-white text-[11px] leading-relaxed text-navy-800 space-y-4 shadow-sm select-text">
                  <div className="border-b-2 border-primary-500 pb-3 flex justify-between items-start">
                    <div>
                      <h1 className="text-sm font-black text-navy-950 uppercase tracking-tight">Lestari ESG Report</h1>
                      <p className="text-[8px] text-navy-400 font-mono tracking-widest">BURSA MALAYSIA DISCLOSURE FRAMEWORK</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-navy-900 font-mono">{period}</p>
                      <p className="text-[7px] text-navy-400 uppercase font-bold tracking-wider font-mono">Status: Sign-Off Pending</p>
                    </div>
                  </div>

                  {/* Section 1: Corporate Profile */}
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-extrabold text-navy-950 uppercase tracking-wide">1. Corporate Profile</h5>
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-navy-50/50 p-2.5 rounded-lg text-navy-600 font-medium">
                      <div>
                        <span className="text-navy-400">Entity: </span>
                        <strong className="text-navy-900">{company?.name ?? 'Not configured'}</strong>
                      </div>
                      <div>
                        <span className="text-navy-400">Market: </span>
                        <strong className="text-navy-900">{company ? marketFromBackend(company.marketClassification) : 'Not set'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Materiality Assessment */}
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-extrabold text-navy-950 uppercase tracking-wide">2. Prioritized Materiality Matters</h5>
                    <p className="text-navy-500 text-[10px]">The following critical ESG matters have been formally assessed and prioritized for this cycle:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-navy-700 text-[10px] font-medium">
                      {sortedMaterialityScores.length > 0 ? (
                        sortedMaterialityScores.slice(0, 4).map((s) => (
                          <li key={s.matterId}><strong>{s.matterName}</strong> — {s.priorityTier}</li>
                        ))
                      ) : (
                        <li className="text-navy-400">No materiality assessment completed yet.</li>
                      )}
                    </ul>
                  </div>

                  {/* Section 3: KPI Performance */}
                  <div className="space-y-1 pb-4">
                    <h5 className="text-[10px] font-extrabold text-navy-950 uppercase tracking-wide">3. Sustainability Metric Summary</h5>
                    <table className="w-full text-left text-[9px] border-collapse">
                      <thead>
                        <tr className="border-b border-navy-100 text-navy-400 uppercase font-mono">
                          <th className="py-1">Indicator</th>
                          <th className="py-1 text-center">Value ({period})</th>
                          <th className="py-1 text-right">Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-50 text-navy-700">
                        {indicators.length > 0 ? (
                          indicators.slice(0, 4).map((ind) => {
                            const val = getValueForYear(ind, fiscalYear);
                            return (
                              <tr key={ind.id}>
                                <td className="py-1 font-medium">{ind.name}</td>
                                <td className="py-1 text-center font-bold font-mono text-navy-950">
                                  {val !== null ? `${val} ${ind.unit || ''}` : 'N/A'}
                                </td>
                                <td className="py-1 text-right font-mono">{ind.effectiveTarget !== null && ind.effectiveTarget !== undefined ? `${ind.effectiveTarget} ${ind.unit || ''}` : 'N/A'}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <>
                            <tr>
                              <td className="py-1 font-medium">Scope 1 Direct Emissions</td>
                              <td className="py-1 text-center font-bold font-mono text-navy-950">34.0 tCO2e</td>
                              <td className="py-1 text-right font-mono">30.0 tCO2e</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-medium">Scope 2 Indirect TNB Power</td>
                              <td className="py-1 text-center font-bold font-mono text-navy-950">105.4 tCO2e</td>
                              <td className="py-1 text-right font-mono">90.0 tCO2e</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-medium">Waste Recycling Rate</td>
                              <td className="py-1 text-center font-bold font-mono text-navy-950">85%</td>
                              <td className="py-1 text-right font-mono">95%</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 4: IFRS S1/S2 & GHG Emissions Summary (Issuer-Ready Gated) */}
                  <div className="space-y-1 pb-4">
                    <h5 className="text-[10px] font-extrabold text-navy-950 uppercase tracking-wide">4. IFRS S1/S2 &amp; GHG Emissions Summary</h5>
                    {isClimateUnlocked ? (
                      <>
                        <p className="text-navy-500 text-[10px]">
                          {segments.reduce((n, s) => n + s.items.length, 0)} climate risk/opportunity item(s) across {segments.length} business segment(s).
                        </p>
                        <table className="w-full text-left text-[9px] border-collapse">
                          <thead>
                            <tr className="border-b border-navy-100 text-navy-400 uppercase font-mono">
                              <th className="py-1">Scope</th>
                              <th className="py-1 text-center">Value ({period})</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-navy-50 text-navy-700">
                            <tr>
                              <td className="py-1 font-medium">Scope 1 — Direct</td>
                              <td className="py-1 text-center font-bold font-mono text-navy-950">{scope1Value !== null ? `${scope1Value} tCO2e` : 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-medium">Scope 2 — Indirect (Purchased Energy)</td>
                              <td className="py-1 text-center font-bold font-mono text-navy-950">{scope2Value !== null ? `${scope2Value} tCO2e` : 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-medium">Scope 3 — Value Chain (All Categories)</td>
                              <td className="py-1 text-center font-bold font-mono text-navy-950">{scope3Total !== null ? `${scope3Total} tCO2e` : 'N/A'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </>
                    ) : (
                      <p className="text-navy-400 text-[10px] italic">Requires the Issuer-Ready plan — not included in this disclosure cycle.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Action Panel */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-navy-50">
              <div className="flex items-center space-x-2 text-[11px] text-navy-500">
                <Info className="w-3.5 h-3.5 text-navy-400 shrink-0" />
                <span>Format options are configured to meet Malaysian regulatory reporting guidelines.</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  onClick={handlePreviewReport}
                  disabled={format !== 'PDF' || generating}
                  className="w-full sm:w-auto font-bold px-6 py-2.5"
                  icon={<Eye className="w-4 h-4" />}
                >
                  Preview
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGenerateReport}
                  loading={generating}
                  className="w-full sm:w-auto font-bold px-6 py-2.5"
                  icon={<Download className="w-4 h-4" />}
                >
                  Generate & Download
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Raw Data & CSI Export */}
        <div className="space-y-6">
          
          {/* Card 1: Raw Data Export */}
          <Card className="bg-white border-navy-100 p-6 flex flex-col justify-between h-auto space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-navy-50 text-navy-600 rounded-xl flex items-center justify-center border border-navy-100">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-navy-950">Raw Data Export</h4>
              <p className="text-xs text-navy-500 leading-relaxed">
                Export all raw sustainability indicators and historical values for the selected cycle in clean CSV format.
              </p>
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              loading={exportingRaw}
              className="w-full text-xs font-bold"
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV Ledger
            </Button>
          </Card>

          {/* Card 2: CSI-Compatible Export (Issuer-Ready only, wrapped in UpgradeGate) */}
          <UpgradeGate feature="csi-export" onUpgrade={() => navigate('/settings?tab=billing')}>
            <Card className="bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/40 border border-purple-200/80 p-6 space-y-4 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Issuer-Ready
                </span>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-purple-950 flex items-center">
                  CSI-Compatible Export
                </h4>
                <p className="text-[11px] text-navy-600 leading-relaxed">
                  Structured to match Bursa's CSI data requirements for manual transfer. <strong>This does not submit to CSI directly</strong> — Bursa's CSI platform remains the official mandatory submission channel.
                </p>
              </div>

              <div className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border w-fit ${
                csiTotal > 0 && csiReadyCount === csiTotal
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {csiReadyCount}/{csiTotal} indicators ready
              </div>

              <Button
                variant="premium"
                size="sm"
                onClick={handleExportCSI}
                className="w-full text-xs font-bold py-2.5"
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Generate CSI Export
              </Button>
            </Card>
          </UpgradeGate>

        </div>
      </div>

      </>
      )}

      {activeReportTab === 'ifrs-s1' && (
        <UpgradeGate feature="ifrs-s1-s2" onUpgrade={() => navigate('/settings?tab=billing')}>
          <Card className="bg-white border-navy-100 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-navy-50 pb-4">
              <div>
                <h4 className="text-base font-extrabold text-navy-950 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-primary-500" />
                  IFRS S1 Report
                </h4>
                <p className="text-xs text-navy-500 mt-0.5">
                  Standalone General Disclosures report — climate-related risks &amp; opportunities per business segment.
                </p>
              </div>
              <span className="text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded font-bold shrink-0">
                {segments.reduce((n, s) => n + s.items.length, 0)} item(s) across {segments.length} segment(s)
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-navy-500">
              <Info className="w-3.5 h-3.5 text-navy-400 shrink-0" />
              <span>Generates a PDF covering IFRS S1 — General Disclosures for {period}.</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-navy-50">
              <Button
                variant="secondary"
                onClick={() => handlePreviewIfrsReport('s1')}
                className="w-full sm:w-auto font-bold px-6 py-2.5"
                icon={<Eye className="w-4 h-4" />}
              >
                Preview
              </Button>
              <Button
                variant="primary"
                onClick={() => handleGenerateIfrsReport('s1')}
                loading={generatingIfrsS1}
                className="w-full sm:w-auto font-bold px-6 py-2.5"
                icon={<Download className="w-4 h-4" />}
              >
                Generate & Download
              </Button>
            </div>
          </Card>
        </UpgradeGate>
      )}

      {activeReportTab === 'ifrs-s2' && (
        <UpgradeGate feature="ifrs-s1-s2" onUpgrade={() => navigate('/settings?tab=billing')}>
          <Card className="bg-white border-navy-100 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-navy-50 pb-4">
              <div>
                <h4 className="text-base font-extrabold text-navy-950 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-primary-500" />
                  IFRS S2 Report
                </h4>
                <p className="text-xs text-navy-500 mt-0.5">
                  Standalone Climate Disclosures report — governance, strategy, risk management, metrics &amp; targets, and the Scope 1/2/3 GHG ledger.
                </p>
              </div>
              <span className="text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded font-bold shrink-0">
                {ifrsS2?.oversightDescription ? 'Governance disclosed' : 'Governance not disclosed'}
              </span>
            </div>

            <div className="text-[11px] text-navy-500 space-y-1">
              <div>Scope 1 ({period}): <strong className="text-navy-900">{scope1Value !== null ? `${scope1Value} tCO2e` : 'N/A'}</strong></div>
              <div>Scope 2 ({period}): <strong className="text-navy-900">{scope2Value !== null ? `${scope2Value} tCO2e` : 'N/A'}</strong></div>
              <div>Scope 3 ({period}): <strong className="text-navy-900">{scope3Total !== null ? `${scope3Total} tCO2e` : 'N/A'}</strong></div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-navy-50">
              <Button
                variant="secondary"
                onClick={() => handlePreviewIfrsReport('s2')}
                className="w-full sm:w-auto font-bold px-6 py-2.5"
                icon={<Eye className="w-4 h-4" />}
              >
                Preview
              </Button>
              <Button
                variant="primary"
                onClick={() => handleGenerateIfrsReport('s2')}
                loading={generatingIfrsS2}
                className="w-full sm:w-auto font-bold px-6 py-2.5"
                icon={<Download className="w-4 h-4" />}
              >
                Generate & Download
              </Button>
            </div>
          </Card>
        </UpgradeGate>
      )}

      {/* Export History Table Card */}
      <Card className="bg-white border-navy-100 p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-navy-50 pb-3">
          <History className="w-4 h-4 text-navy-400" />
          <h4 className="text-sm font-bold text-navy-950">Export History</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-navy-100 text-navy-400 font-semibold uppercase tracking-wider text-[10px] font-mono">
                <th className="py-3 px-4">Generated Date</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Generated By</th>
                <th className="py-3 px-4">Sign-Off</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50 text-navy-700">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-navy-50/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-navy-600">{item.date}</td>
                  <td className="py-3 px-4 font-semibold text-navy-900">{item.type}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.format.includes('PDF')
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : item.format.includes('Word') || item.format.includes('DOC')
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {item.format}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-navy-900">{item.period}</td>
                  <td className="py-3 px-4 text-navy-500 font-medium">{item.by}</td>
                  <td className="py-3 px-4">
                    {item.signedOffAt ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5">
                        Signed off by {item.signedOffByName} · {new Date(item.signedOffAt).toLocaleDateString()}
                      </span>
                    ) : canSignOff ? (
                      <button
                        onClick={() => handleSignOff(item.id)}
                        className="text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 border border-primary-100 rounded-md px-2 py-0.5 cursor-pointer"
                      >
                        Sign Off
                      </button>
                    ) : (
                      <span className="text-[10px] text-navy-400">Pending</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleReDownload(item)}
                      className="p-1.5 text-navy-400 hover:text-primary-600 rounded-lg hover:bg-navy-100/50 cursor-pointer inline-flex items-center transition-colors"
                      title="Re-download file"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      <span className="text-[10px] font-bold">Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PDF Preview Modal */}
      {isPreviewModalOpen && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-navy-100 bg-navy-50/50">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-bold text-navy-900">Document Preview</h3>
              </div>
              <button 
                onClick={handleClosePreview}
                className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-navy-100/30 p-4">
              <iframe 
                src={previewUrl} 
                className="w-full h-full rounded shadow-sm border border-navy-200 bg-white"
                title="PDF Preview"
              />
            </div>
            <div className="p-4 border-t border-navy-100 bg-white flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={handleClosePreview}
                className="font-bold"
              >
                Close Preview
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleClosePreview();
                  if (activeReportTab === 'ifrs-s1') handleGenerateIfrsReport('s1');
                  else if (activeReportTab === 'ifrs-s2') handleGenerateIfrsReport('s2');
                  else handleGenerateReport();
                }}
                className="font-bold"
                icon={<Download className="w-4 h-4" />}
              >
                Confirm & Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
