/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  HelpCircle,
  Info,
  Download,
  Search,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Sliders,
  Filter,
  Upload,
  X,
  FileDown,
  ArrowDown,
  ArrowUp,
  Building2,
  Compass,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { canAccess, MANAGEMENT_ROLES } from '../permissions';
import Button from './ui/Button';
import Card from './ui/Card';
import { useApplicableMatters } from '../hooks/useApplicableMatters';
import { indicatorsApi, IndicatorResponse, IndicatorValueStatus } from '../api/indicatorsApi';
import { companyApi } from '../api/companyApi';
import { TenantUserResponse } from '../api/tenantAdminApi';
import { exportApi, downloadCsv } from '../api/exportApi';
import { categoryFromBackend } from '../api/mappers';

// TypeScript Types
export interface AuditTrailEntry {
  id: string;
  value: number;
  enteredBy: string;
  timestamp: string;
  sourceDocName?: string;
  hasEvidenceFile: boolean;
  comment?: string;
}

export interface IndicatorValueCell {
  value: number;
  status: IndicatorValueStatus;
  approvedByName: string | null;
  approvedAt: string | null;
}

export interface Indicator {
  id: string;
  name: string;
  unit: string;
  matterId: string;
  category: 'Environmental' | 'Social' | 'Governance';
  isSectorSpecific?: boolean;
  sectorName?: string;
  values: Record<string, IndicatorValueCell | null>; // year e.g. "FY2023" -> cell
  target: number | null; // effective target value (tenant override or reference default)
  targetDirection: 'up' | 'down'; // 'down' means lower is better (e.g. emissions), 'up' means higher is better
  history: AuditTrailEntry[];
}

const years = ['FY2023', 'FY2024', 'FY2025', 'FY2026'];

function toFrontendIndicator(r: IndicatorResponse): Indicator {
  const values: Record<string, IndicatorValueCell | null> = {};
  years.forEach((y) => { values[y] = null; });
  r.values.forEach((v) => {
    values[`FY${v.fiscalYear}`] = v.value !== null
      ? { value: v.value, status: v.status, approvedByName: v.approvedByName, approvedAt: v.approvedAt }
      : null;
  });

  return {
    id: r.id,
    name: r.name,
    unit: r.unit,
    matterId: r.matterId,
    category: categoryFromBackend(r.category),
    isSectorSpecific: r.sectorSpecific,
    sectorName: r.sectorCode ?? undefined,
    values,
    target: r.effectiveTarget,
    targetDirection: r.effectiveTargetDirection === 'UP' ? 'up' : 'down',
    history: r.history.map((h) => ({
      id: h.id,
      value: h.value,
      enteredBy: h.enteredBy,
      timestamp: new Date(h.enteredAt).toLocaleString(),
      sourceDocName: h.sourceDocName ?? undefined,
      hasEvidenceFile: h.sourceDocPath !== null,
      comment: h.comment ?? undefined
    }))
  };
}

function fiscalYearNumber(yearKey: string): number {
  return parseInt(yearKey.replace('FY', ''), 10);
}

export default function IndicatorsView() {
  const { user } = useAuth();
  const { matters: allApplicableMatters, refetch: refetchApplicableMatters } = useApplicableMatters();
  const canApprove = canAccess(user?.role, MANAGEMENT_ROLES);

  // --- COMPONENT STATE ---
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [focusYear, setFocusYear] = useState<string>('FY2026');
  const [activeTab, setActiveTab] = useState<'common' | 'sector'>('common');
  const [isSectorEnabled, setIsSectorEnabled] = useState<boolean>(false);

  // Slide-over Audit Trail state
  const [selectedIndicatorForHistory, setSelectedIndicatorForHistory] = useState<Indicator | null>(null);
  const [newAuditVal, setNewAuditVal] = useState<string>('');
  const [newAuditComment, setNewAuditComment] = useState<string>('');
  const [newAuditUser, setNewAuditUser] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSavingAudit, setIsSavingAudit] = useState<boolean>(false);

  // Editing state for table cells
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Search/Filters within active tab
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Environmental' | 'Social' | 'Governance'>('All');

  // Real company users, for the "Authorizing Officer" picker (used to be a hardcoded fake list)
  const [companyUsers, setCompanyUsers] = useState<TenantUserResponse[]>([]);

  const refreshIndicators = () => {
    indicatorsApi.list().then((data) => setIndicators(data.map(toFrontendIndicator)));
  };

  useEffect(() => {
    refreshIndicators();
    companyApi.get().then((c) => setIsSectorEnabled(c.sectorModuleEnabled));
    companyApi.listUsers().then((users) => {
      setCompanyUsers(users);
      setNewAuditUser((prev) => prev || user?.name || users[0]?.name || '');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSectorModule = () => {
    const newVal = !isSectorEnabled;
    setIsSectorEnabled(newVal);
    companyApi.updateProfile({ sectorModuleEnabled: newVal }).then(() => {
      refreshIndicators();
      refetchApplicableMatters();
    });
    if (!newVal && activeTab === 'sector') {
      setActiveTab('common');
    }
  };

  // --- DATA SELECTION HELPER ---
  // Matters are resolved server-side from the company's real plan + market classification.
  const activeMatters = activeTab === 'sector'
    ? allApplicableMatters.filter((m) => m.id === 'SECTOR-MFG')
    : allApplicableMatters.filter((m) => m.id !== 'SECTOR-MFG');

  // Filters indicators based on active tab and filters
  const getFilteredIndicators = (): Indicator[] => {
    let list = indicators;

    if (activeTab === 'sector') {
      list = list.filter(ind => ind.isSectorSpecific);
    } else {
      list = list.filter(ind => !ind.isSectorSpecific);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(ind =>
        ind.name.toLowerCase().includes(q) ||
        ind.id.toLowerCase().includes(q) ||
        ind.unit.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'All') {
      list = list.filter(ind => ind.category === categoryFilter);
    }

    return list;
  };

  const activeFilteredIndicators = getFilteredIndicators();

  // --- Collapsible Sections Smart Logic ---
  useEffect(() => {
    if (activeFilteredIndicators.length === 0 || activeMatters.length === 0) return;

    const initialCollapsibleState: Record<string, boolean> = {};

    activeMatters.forEach(matter => {
      const matterIndicators = activeFilteredIndicators.filter(ind => ind.matterId === matter.id);
      if (matterIndicators.length === 0) return;

      const isAllComplete = matterIndicators.every(ind => ind.values[focusYear] !== null);
      initialCollapsibleState[matter.id] = isAllComplete;
    });

    setCollapsedSections(initialCollapsibleState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, focusYear, indicators.length]);

  const toggleSection = (matterId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [matterId]: !prev[matterId]
    }));
  };

  // --- Dynamic Completion Metrics ---
  // `indicators` already reflects exactly what's applicable to this company (plan + market +
  // sector-module toggle), resolved server-side — no need to re-derive relevance here.
  const completedCount = indicators.filter(ind => ind.values[focusYear] !== null).length;
  const totalCount = indicators.length;

  // --- INLINE EDITING COMMITS & VALIDATION ---
  const startEditing = (indicatorId: string, type: 'year' | 'target', yearKey?: string) => {
    const key = type === 'year' ? `${indicatorId}-${yearKey}` : `${indicatorId}-target`;
    setEditingCell(key);

    const indicator = indicators.find(ind => ind.id === indicatorId);
    if (indicator) {
      if (type === 'year' && yearKey) {
        const cell = indicator.values[yearKey];
        setEditValue(cell !== null ? String(cell.value) : '');
      } else {
        const targetVal = indicator.target;
        setEditValue(targetVal !== null ? String(targetVal) : '');
      }
    }
    setEditError(null);
  };

  const handleInlineSave = (indicatorId: string, type: 'year' | 'target', yearKey?: string) => {
    if (editValue.trim() === '') {
      setEditError('A value is required — clearing an entered value is not supported.');
      return;
    }

    const num = Number(editValue.trim());
    if (isNaN(num)) {
      setEditError('Must be a number');
      return;
    }
    if (num < 0) {
      setEditError('Cannot be negative');
      return;
    }

    commitInlineChange(indicatorId, type, num, yearKey);
  };

  const commitInlineChange = (indicatorId: string, type: 'year' | 'target', value: number, yearKey?: string) => {
    const indicator = indicators.find(ind => ind.id === indicatorId);
    if (!indicator) return;

    const request = type === 'year' && yearKey
      ? indicatorsApi.setValue(indicatorId, fiscalYearNumber(yearKey), value)
      : indicatorsApi.setTarget(indicatorId, value, indicator.targetDirection === 'up' ? 'UP' : 'DOWN');

    request.then((updated) => {
      const converted = toFrontendIndicator(updated);
      setIndicators(prev => prev.map(ind => (ind.id === indicatorId ? converted : ind)));
      if (selectedIndicatorForHistory && selectedIndicatorForHistory.id === indicatorId) {
        setSelectedIndicatorForHistory(converted);
      }
    });

    setEditingCell(null);
  };

  // --- AUDIT TRAIL SIDEBAR PANEL OPERATIONS ---
  const handleAddManualAuditLog = () => {
    if (!selectedIndicatorForHistory) return;
    const num = Number(newAuditVal.trim());
    if (newAuditVal.trim() === '' || isNaN(num) || num < 0) {
      alert('Please enter a valid non-negative numeric value.');
      return;
    }

    const baseComment = newAuditComment.trim() || 'Manual adjustment override';
    const comment = `${baseComment} | Authorizing officer: ${newAuditUser}`;
    const indicatorId = selectedIndicatorForHistory.id;
    const fileToUpload = pendingFile;

    setIsSavingAudit(true);
    indicatorsApi.setValue(indicatorId, fiscalYearNumber(focusYear), num, undefined, comment)
      .then((updated) => {
        const newEntryId = updated.history[0]?.id;
        if (fileToUpload && newEntryId) {
          return indicatorsApi.uploadEvidence(newEntryId, fileToUpload).then(() => indicatorsApi.get(indicatorId));
        }
        return updated;
      })
      .then((finalIndicator) => {
        const converted = toFrontendIndicator(finalIndicator);
        setIndicators(prev => prev.map(ind => (ind.id === finalIndicator.id ? converted : ind)));
        setSelectedIndicatorForHistory(converted);
      })
      .catch(() => alert('Failed to save — check your value and evidence file, then try again.'))
      .finally(() => setIsSavingAudit(false));

    setNewAuditVal('');
    setNewAuditComment('');
    setPendingFile(null);
  };

  const handleApproveValue = (indicatorId: string, yearKey: string) => {
    indicatorsApi.approveValue(indicatorId, fiscalYearNumber(yearKey)).then((updated) => {
      const converted = toFrontendIndicator(updated);
      setIndicators(prev => prev.map(ind => (ind.id === updated.id ? converted : ind)));
      if (selectedIndicatorForHistory && selectedIndicatorForHistory.id === indicatorId) {
        setSelectedIndicatorForHistory(converted);
      }
    });
  };

  const handleDownloadEvidence = (auditEntryId: string, filename: string) => {
    indicatorsApi.downloadEvidence(auditEntryId).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  };

  // --- CSV DATA EXPORT (backed by the real /exports/csv endpoint) ---
  const exportToCSV = () => {
    if (activeFilteredIndicators.length === 0) {
      alert('No indicators visible in this view to export.');
      return;
    }
    exportApi.csv(fiscalYearNumber(focusYear)).then((csv) => {
      downloadCsv(csv, `Lestari_ESG_Indicators_${focusYear}_Export.csv`);
    });
  };

  // --- COMPUTE DELTA MARKER UTILITY ---
  const renderDeltaMarker = (indicator: Indicator) => {
    const actualCell = indicator.values[focusYear];
    const target = indicator.target;

    if (actualCell === null || target === null || target === undefined) {
      return (
        <span className="text-[10px] text-navy-300 font-mono font-semibold">—</span>
      );
    }
    const actual = actualCell.value;

    const diff = actual - target;
    const isTargetAchieved = indicator.targetDirection === 'down'
      ? actual <= target
      : actual >= target;

    const percentDiff = target !== 0 ? ((diff / target) * 100).toFixed(1) : '0';
    const absPercent = Math.abs(Number(percentDiff));

    if (isTargetAchieved) {
      return (
        <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-[10px] font-bold font-mono">
          {indicator.targetDirection === 'down' ? <ArrowDown className="w-3 h-3 text-emerald-600" /> : <ArrowUp className="w-3 h-3 text-emerald-600" />}
          <span>{absPercent}% Achieved</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100/50 text-[10px] font-bold font-mono">
          {indicator.targetDirection === 'down' ? <ArrowUp className="w-3 h-3 text-rose-600" /> : <ArrowDown className="w-3 h-3 text-rose-600" />}
          <span>{absPercent}% Over limit</span>
        </span>
      );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl w-full mx-auto pb-24 font-sans relative">

      {/* 1. HEADER SECTION WITH METRICS AND ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-navy-100/40">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-primary-600 mb-1">
            <span className="px-2 py-0.5 bg-primary-50 rounded-md uppercase font-mono">Stage 4A Compliance</span>
            <span>•</span>
            <span>Malaysian SME Guide</span>
            <span>•</span>
            <span>Bursa ESG Portal Integration</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-navy-950">
            ESG Indicators Log
          </h2>
          <p className="text-xs text-navy-500 mt-1">
            Maintain high-fidelity sustainability logs, verify data history with secure audit trails, and prepare compliance proofs.
          </p>
        </div>

        {/* TOP-RIGHT METRIC BADGES, YEAR SELECT, AND CSV BUTTON */}
        <div className="flex flex-wrap items-center gap-4 shrink-0">

          {/* Dynamic Completion Stat */}
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-navy-100 flex items-center space-x-3.5 shadow-sm">
            <div className="relative flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-[10px] font-black text-primary-700">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </div>
            </div>
            <div>
              <span className="text-[10px] text-navy-400 font-bold uppercase tracking-wider block">Period Completion</span>
              <span className="text-xs font-black text-navy-950">
                {completedCount} of {totalCount} indicators complete
              </span>
            </div>
          </div>

          {/* Past Financial Year focus dropdown */}
          <div className="flex items-center bg-white border border-navy-100 rounded-2xl p-1 shadow-sm">
            <span className="text-[10px] text-navy-400 font-bold uppercase tracking-wider px-2.5">Focus Year:</span>
            <select
              value={focusYear}
              onChange={(e) => setFocusYear(e.target.value)}
              className="text-xs font-black text-navy-900 bg-transparent border-0 outline-none pr-6 pl-1 py-1 cursor-pointer"
            >
              <option value="FY2026">FY 2026 (Active)</option>
              <option value="FY2025">FY 2025</option>
              <option value="FY2024">FY 2024</option>
              <option value="FY2023">FY 2023</option>
            </select>
          </div>

          {/* CSV Export Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={exportToCSV}
            icon={<FileDown className="w-4 h-4 text-primary-600" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* 2. DYNAMIC TAB BAR & SECTOR MODULE ACTIVATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-navy-100 gap-4">

        {/* Plan driven Tabs */}
        <div className="flex space-x-1 -mb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab('common')}
            className={`px-5 py-3 text-xs font-extrabold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'common'
                ? 'border-primary-500 text-primary-600 font-black'
                : 'border-transparent text-navy-500 hover:text-navy-900 hover:border-navy-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>Common Matters Disclosures</span>
              <span className="px-1.5 py-0.5 bg-navy-100 text-navy-600 text-[9px] rounded font-mono font-bold">
                {indicators.filter(i => !i.isSectorSpecific).length}
              </span>
            </div>
          </button>

          {/* Sector specific Tab if enabled */}
          {isSectorEnabled && (
            <button
              onClick={() => setActiveTab('sector')}
              className={`px-5 py-3 text-xs font-extrabold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'sector'
                  ? 'border-primary-500 text-primary-600 font-black'
                  : 'border-transparent text-navy-500 hover:text-navy-900 hover:border-navy-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building2 className="w-3.5 h-3.5 text-primary-500" />
                <span>Sector Disclosures: Manufacturing</span>
                <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[9px] rounded font-mono font-bold">
                  {indicators.filter(i => i.isSectorSpecific).length}
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Sector Module Toggle */}
        <div className="flex flex-wrap items-center gap-3 py-2">
          <label className="flex items-center space-x-2 bg-navy-50 border border-navy-100 hover:bg-navy-100/30 px-3 py-1.5 rounded-xl cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isSectorEnabled}
              onChange={toggleSectorModule}
              className="rounded text-primary-600 focus:ring-primary-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[11px] font-bold text-navy-700 select-none">
              Sector Module Enabled (Manufacturing)
            </span>
          </label>
        </div>
      </div>

      {/* 3. TABLE FILTER BAR */}
      <div className="bg-white border border-navy-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">

        {/* Left search */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-navy-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indicators by name, ID or metric unit..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold text-navy-900 bg-navy-50/40 border border-navy-100 rounded-xl focus:bg-white focus:ring-1 focus:ring-primary-500 outline-none transition-all"
          />
        </div>

        {/* Right categories filters */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-navy-400 shrink-0" />
          <span className="text-[10px] text-navy-400 font-bold uppercase tracking-wider shrink-0">Category:</span>

          {['All', 'Environmental', 'Social', 'Governance'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat as any)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer shrink-0 ${
                categoryFilter === cat
                  ? 'bg-primary-50 border-primary-200 text-primary-700 font-black'
                  : 'bg-white border-navy-100 text-navy-500 hover:text-navy-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ==========================================
          4. INDICATORS DATA TABLES (Active Tabs)
         ========================================== */}
      <div className="space-y-6">
          {activeMatters.map((matter) => {
            const matterIndicators = activeFilteredIndicators.filter(ind => ind.matterId === matter.id);
            if (matterIndicators.length === 0) return null;

            const isCollapsed = collapsedSections[matter.id];

            return (
              <div
                key={matter.id}
                className="bg-white border border-navy-100 rounded-3xl overflow-hidden shadow-sm transition-all"
              >
                {/* COLLAPSIBLE MATTER HEADER */}
                <button
                  type="button"
                  onClick={() => toggleSection(matter.id)}
                  className="w-full flex items-center justify-between px-6 py-4.5 bg-navy-50/40 hover:bg-navy-50/70 text-left cursor-pointer transition-colors border-b border-navy-100/50"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className={`text-navy-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
                      <ChevronDown className="w-4 h-4" />
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase ${
                      matter.category === 'Environmental' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' :
                      matter.category === 'Social' ? 'bg-blue-50 text-blue-700 border-blue-100/50' :
                      'bg-purple-50 text-purple-700 border-purple-100/50'
                    }`}>
                      {matter.category}
                    </span>
                    <h3 className="text-xs font-black text-navy-900 truncate leading-tight uppercase tracking-wider">
                      {matter.name}
                    </h3>
                    <span className="text-[10px] text-navy-400 font-mono font-bold shrink-0">
                      ({matterIndicators.length} indicator{matterIndicators.length > 1 ? 's' : ''})
                    </span>
                  </div>

                  {/* Status checklist indicator */}
                  <div className="flex items-center space-x-2">
                    {matterIndicators.every(ind => ind.values[focusYear] !== null && ind.values[focusYear] !== undefined) ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center space-x-1 font-mono">
                        <Check className="w-3 h-3" />
                        <span>Completed Section</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center space-x-1 font-mono">
                        <AlertCircle className="w-3 h-3" />
                        <span>Incomplete</span>
                      </span>
                    )}
                  </div>
                </button>

                {/* MATTER INDICATORS TABLE */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-navy-100 bg-navy-50/10 text-[10px] font-bold text-navy-400 uppercase tracking-wider font-mono">
                          <th className="px-6 py-3.5">Indicator ID</th>
                          <th className="px-6 py-3.5 min-w-[280px]">Indicator Name & Unit</th>

                          {years.map((y) => (
                            <th
                              key={y}
                              className={`px-4 py-3.5 text-center cursor-help transition-all ${
                                y === focusYear ? 'bg-primary-50/40 text-primary-800 font-extrabold' : ''
                              }`}
                              title={y === focusYear ? 'Current selected focus year' : ''}
                            >
                              {y}
                            </th>
                          ))}

                          <th className="px-6 py-3.5 text-center min-w-[120px]">Target</th>
                          <th className="px-6 py-3.5 text-center">Delta (vs Target)</th>
                          <th className="px-6 py-3.5 text-center">Audit Log</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-50 text-xs">
                        {matterIndicators.map((indicator) => {
                          return (
                            <tr key={indicator.id} className="hover:bg-navy-50/20 transition-all group">

                              <td className="px-6 py-4.5 font-mono text-[10px] font-bold text-navy-400 select-none">
                                {indicator.id}
                              </td>

                              <td className="px-6 py-4.5">
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-navy-950 block leading-tight">
                                    {indicator.name}
                                  </span>
                                  <span className="inline-block px-1.5 py-0.5 bg-navy-100/50 text-navy-500 rounded font-mono text-[9px] font-bold">
                                    Unit: {indicator.unit}
                                  </span>
                                </div>
                              </td>

                              {years.map((y) => {
                                const cellKey = `${indicator.id}-${y}`;
                                const cell = indicator.values[y];
                                const isEditing = editingCell === cellKey;
                                const isFocus = y === focusYear;

                                return (
                                  <td
                                    key={y}
                                    className={`px-4 py-4.5 text-center transition-all ${
                                      isFocus ? 'bg-primary-50/10' : ''
                                    }`}
                                  >
                                    {isEditing ? (
                                      <div className="flex flex-col items-center space-y-1 max-w-[100px] mx-auto">
                                        <input
                                          type="text"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleInlineSave(indicator.id, 'year', y);
                                            if (e.key === 'Escape') setEditingCell(null);
                                          }}
                                          autoFocus
                                          className="w-full text-center px-1.5 py-1 text-xs font-bold text-navy-900 border border-primary-400 rounded-md outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                                        />

                                        <div className="flex items-center space-x-1">
                                          <button
                                            onClick={() => handleInlineSave(indicator.id, 'year', y)}
                                            className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                            title="Save"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => setEditingCell(null)}
                                            className="p-0.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                                            title="Cancel"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        {editError && (
                                          <span className="text-[8px] font-bold text-rose-600 font-mono">
                                            {editError}
                                          </span>
                                        )}
                                      </div>
                                    ) : cell !== null ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <button
                                          onClick={() => startEditing(indicator.id, 'year', y)}
                                          className="w-full py-2 text-center rounded-xl cursor-pointer transition-all font-bold font-mono text-navy-900 hover:bg-navy-50"
                                        >
                                          {cell.value}
                                        </button>
                                        <span
                                          title={cell.status === 'APPROVED' && cell.approvedByName ? `Approved by ${cell.approvedByName}` : undefined}
                                          className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                            cell.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                          }`}
                                        >
                                          {cell.status === 'APPROVED' ? 'Approved' : 'Draft'}
                                        </span>
                                        {cell.status === 'DRAFT' && canApprove && (
                                          <button
                                            onClick={() => handleApproveValue(indicator.id, y)}
                                            className="text-[8px] font-bold text-primary-600 hover:text-primary-800 hover:underline cursor-pointer"
                                          >
                                            Approve
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => startEditing(indicator.id, 'year', y)}
                                        className="w-full py-2.5 text-center rounded-xl cursor-pointer transition-all border border-dashed border-navy-200 hover:border-primary-400 bg-slate-50/50 hover:bg-primary-50/10"
                                      >
                                        <span className="text-[10px] text-navy-400 font-mono font-bold flex items-center justify-center space-x-0.5">
                                          <Plus className="w-3 h-3 text-primary-500" />
                                          <span>Add</span>
                                        </span>
                                      </button>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Target Column */}
                              <td className="px-6 py-4.5 text-center">
                                {editingCell === `${indicator.id}-target` ? (
                                  <div className="flex flex-col items-center space-y-1 max-w-[100px] mx-auto">
                                    <input
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleInlineSave(indicator.id, 'target');
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                      autoFocus
                                      className="w-full text-center px-1.5 py-1 text-xs font-bold text-navy-900 border border-primary-400 rounded-md outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                                    />
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={() => handleInlineSave(indicator.id, 'target')}
                                        className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setEditingCell(null)}
                                        className="p-0.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {editError && (
                                      <span className="text-[8px] font-bold text-rose-600 font-mono">
                                        {editError}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditing(indicator.id, 'target')}
                                    className="px-3 py-1.5 text-xs font-extrabold text-navy-800 bg-navy-50/50 hover:bg-navy-100 rounded-xl cursor-pointer font-mono"
                                  >
                                    {indicator.target !== null ? indicator.target : 'Set Target'}
                                  </button>
                                )}
                              </td>

                              <td className="px-6 py-4.5 text-center">
                                {renderDeltaMarker(indicator)}
                              </td>

                              <td className="px-6 py-4.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedIndicatorForHistory(indicator)}
                                  className="p-1.5 text-navy-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg cursor-pointer transition-colors"
                                  title="Open audit logs"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {activeFilteredIndicators.length === 0 && (
            <Card className="bg-white border-navy-100 p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-navy-300 mx-auto" />
              <h4 className="text-sm font-bold text-navy-950">No indicators match filters</h4>
              <p className="text-xs text-navy-400">Try clearing your search queries or selecting different category filters.</p>
            </Card>
          )}
        </div>

      {/* ========================================================
          6. RIGHT SLIDE-OVER PANEL: AUDIT TRAIL & DOCUMENT PROOFS
         ======================================================== */}
      {selectedIndicatorForHistory && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setSelectedIndicatorForHistory(null)}
            className="absolute inset-0 bg-navy-950/40 backdrop-blur-xs transition-opacity"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-navy-100 flex flex-col justify-between">

              <div className="p-6 border-b border-navy-100 bg-navy-50/50">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[9px] font-bold rounded uppercase tracking-wider font-mono border border-primary-100">
                      INDICATOR {selectedIndicatorForHistory.id}
                    </span>
                    <h3 className="text-base font-black text-navy-950 pr-4">
                      {selectedIndicatorForHistory.name}
                    </h3>
                    <p className="text-[11px] text-navy-500">
                      Complete reporting log trail for assurance auditors.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedIndicatorForHistory(null)}
                    className="text-navy-400 hover:text-navy-600 p-1 rounded-lg cursor-pointer hover:bg-navy-100/50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                <div className="grid grid-cols-2 gap-4 bg-navy-50/50 p-4 rounded-2xl border border-navy-100/40">
                  <div>
                    <span className="text-[9px] font-bold text-navy-400 uppercase tracking-wider block">{focusYear} Actual</span>
                    <span className="text-sm font-black text-navy-950 font-mono">
                      {selectedIndicatorForHistory.values[focusYear] !== null
                        ? `${selectedIndicatorForHistory.values[focusYear]!.value} ${selectedIndicatorForHistory.unit}`
                        : 'Not logged'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-navy-400 uppercase tracking-wider block">Corporate Target</span>
                    <span className="text-sm font-black text-navy-950 font-mono">
                      {selectedIndicatorForHistory.target !== null
                        ? `${selectedIndicatorForHistory.target} ${selectedIndicatorForHistory.unit}`
                        : 'No limit'
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-navy-400 uppercase tracking-widest block font-mono">
                    Historical Audit Logs
                  </h4>

                  <div className="space-y-4">
                    {selectedIndicatorForHistory.history.map((entry, idx) => (
                      <div key={entry.id} className="relative pl-5 pb-1 group/timeline">
                        {idx !== selectedIndicatorForHistory.history.length - 1 && (
                          <div className="absolute left-[5px] top-4 bottom-0 w-0.5 bg-navy-100 group-hover/timeline:bg-navy-200 transition-colors" />
                        )}
                        <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-white ring-1 ring-primary-100" />

                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-navy-900 font-mono text-[11px]">
                              Value: {entry.value} {selectedIndicatorForHistory.unit}
                            </span>
                            <span className="text-[10px] text-navy-400 font-mono font-bold">
                              {entry.timestamp}
                            </span>
                          </div>

                          <div className="text-[11px] text-navy-600 font-medium">
                            {entry.comment || 'System correction'}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-navy-400 font-semibold pt-1">
                            <span>Logged by: <strong className="text-navy-700">{entry.enteredBy}</strong></span>

                            {entry.sourceDocName && (
                              entry.hasEvidenceFile ? (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadEvidence(entry.id, entry.sourceDocName!)}
                                  className="inline-flex items-center space-x-1 text-primary-600 font-extrabold hover:underline cursor-pointer"
                                  title="Download evidence file"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span className="truncate max-w-[120px]">{entry.sourceDocName}</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-navy-400 font-extrabold">
                                  <FileText className="w-3 h-3" />
                                  <span className="truncate max-w-[120px]">{entry.sourceDocName}</span>
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {selectedIndicatorForHistory.history.length === 0 && (
                      <p className="text-xs text-navy-400 italic">No historical audit events logged yet.</p>
                    )}
                  </div>
                </div>

                {/* ADD ADJUSTMENT LOG FORM */}
                <div className="border-t border-navy-100 pt-6 space-y-4">
                  <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <span>Post Audited Adjustment</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Corrected Value ({selectedIndicatorForHistory.unit})</label>
                      <input
                        type="text"
                        value={newAuditVal}
                        onChange={(e) => setNewAuditVal(e.target.value)}
                        placeholder="e.g. 380"
                        className="w-full px-3 py-2 text-xs font-semibold text-navy-900 bg-navy-50/50 border border-navy-100 rounded-xl focus:bg-white focus:ring-1 focus:ring-primary-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Authorizing Officer</label>
                      <select
                        value={newAuditUser}
                        onChange={(e) => setNewAuditUser(e.target.value)}
                        className="w-full px-2 py-2 text-xs font-semibold text-navy-900 bg-navy-50/50 border border-navy-100 rounded-xl focus:bg-white outline-none"
                      >
                        {companyUsers.length === 0 && <option value="">No team members found</option>}
                        {companyUsers.map((member) => (
                          <option key={member.id} value={member.name}>{member.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Commentary / Auditor Notes</label>
                    <input
                      type="text"
                      value={newAuditComment}
                      onChange={(e) => setNewAuditComment(e.target.value)}
                      placeholder="e.g. Adjusted based on audited May Tenaga invoice."
                      className="w-full px-3 py-2 text-xs font-semibold text-navy-900 bg-navy-50/50 border border-navy-100 rounded-xl focus:bg-white focus:ring-1 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-navy-400 uppercase tracking-wider block">Auditable Proof Document</label>
                    <div className="border border-dashed border-navy-200 bg-slate-50/30 p-4.5 rounded-2xl text-center space-y-2">
                      <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-navy-100 text-[11px] font-bold text-navy-700 hover:bg-navy-50 rounded-xl cursor-pointer shadow-xs">
                        <Upload className="w-3.5 h-3.5 text-primary-500" />
                        <span>Upload evidence document</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv,.docx"
                          className="hidden"
                          onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
                        />
                      </label>

                      {pendingFile ? (
                        <div className="text-[10px] text-emerald-600 font-extrabold flex items-center justify-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Selected: {pendingFile.name}</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-navy-400 font-medium">PDF, image, XLSX, CSV, or DOCX — up to 10MB. Attach utility invoice receipts or ISO certifications.</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              <div className="p-6 border-t border-navy-100 bg-navy-50/30 flex justify-end gap-3 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedIndicatorForHistory(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddManualAuditLog}
                  icon={<Check className="w-4 h-4" />}
                  loading={isSavingAudit}
                >
                  {isSavingAudit ? 'Saving…' : 'Save Audited Log'}
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 7. BOTTOM DISCLAIMER */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start space-x-3.5 shadow-xs">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-navy-950">Malaysian ESG Disclosure Standard compliance guidelines</h4>
          <p className="text-[11px] text-navy-600 leading-relaxed">
            Data entry cells accept only positive numeric input values. Non-logged variables are dynamically identified using a dashed border `+ Add` cell placeholder. Once values are logged, section cards will automatically collapse to optimize space, drawing attention to remaining gaps.
          </p>
        </div>
      </div>

    </div>
  );
}
