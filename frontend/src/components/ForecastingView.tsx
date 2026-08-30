/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, X, Sparkles, Loader2, Target as TargetIcon } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { hasPermission } from '../permissions';
import { ApiError } from '../api/client';
import {
  forecastingApi,
  ForecastSummaryResponse,
  IndicatorForecastResponse,
  ForecastPoint,
  TrendDirection,
} from '../api/forecastingApi';
import { FORECAST_STATUS_STYLES, TREND_DIRECTION_LABEL } from '../utils/forecastStatus';

const TREND_ICON: Record<TrendDirection, React.ReactNode> = {
  INCREASING: <TrendingUp className="w-3.5 h-3.5" />,
  DECREASING: <TrendingDown className="w-3.5 h-3.5" />,
  FLAT: <Minus className="w-3.5 h-3.5" />,
};

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/**
 * Inline line chart: solid segment through recorded actuals, dashed segment through the
 * trend-projected years, with a marker at the linked target's value/year if one exists. No
 * charting dependency — same hand-rolled-SVG approach as TargetsView's glide-path chart.
 */
function ForecastChart({ points, targetValue, targetYear }: { points: ForecastPoint[]; targetValue?: number; targetYear?: number }) {
  const width = 460;
  const height = 160;
  const padding = 24;

  const years = points.map((p) => p.fiscalYear);
  const values = points.map((p) => p.value);
  if (targetValue !== undefined) values.push(targetValue);
  if (targetYear !== undefined) years.push(targetYear);

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(1, ...values);
  const yearRange = Math.max(1, maxYear - minYear);
  const valRange = Math.max(1, maxVal - minVal);

  const toX = (year: number) => padding + ((year - minYear) / yearRange) * (width - padding * 2);
  const toY = (value: number) => height - padding - ((value - minVal) / valRange) * (height - padding * 2);

  const actualPoints = points.filter((p) => !p.projected);
  const projectedPoints = points.filter((p) => p.projected);
  // The dashed projection segment should visually continue from the last actual point.
  const lastActual = actualPoints[actualPoints.length - 1];
  const projectedPath = lastActual ? [lastActual, ...projectedPoints] : projectedPoints;

  const pathFor = (pts: ForecastPoint[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.fiscalYear)} ${toY(p.value)}`).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {actualPoints.length > 1 && (
        <path d={pathFor(actualPoints)} fill="none" stroke="#10b981" strokeWidth={2} />
      )}
      {projectedPath.length > 1 && (
        <path d={pathFor(projectedPath)} fill="none" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 4" />
      )}
      {actualPoints.map((p) => (
        <circle key={`a-${p.fiscalYear}`} cx={toX(p.fiscalYear)} cy={toY(p.value)} r={3} fill="#10b981" />
      ))}
      {projectedPoints.map((p) => (
        <circle key={`p-${p.fiscalYear}`} cx={toX(p.fiscalYear)} cy={toY(p.value)} r={3} fill="#6366f1" />
      ))}
      {targetValue !== undefined && targetYear !== undefined && (
        <>
          <line
            x1={toX(targetYear)} y1={toY(targetValue) - 5} x2={toX(targetYear)} y2={toY(targetValue) + 5}
            stroke="#f59e0b" strokeWidth={2}
          />
          <circle cx={toX(targetYear)} cy={toY(targetValue)} r={4} fill="none" stroke="#f59e0b" strokeWidth={2} />
        </>
      )}
      {points.map((p) => (
        <text
          key={`label-${p.fiscalYear}`}
          x={toX(p.fiscalYear)} y={height - 6} fontSize="8" textAnchor="middle" fill="#94a3b8" fontFamily="monospace"
        >
          FY{p.fiscalYear}
        </text>
      ))}
    </svg>
  );
}

interface DetailPanelProps {
  indicatorId: string;
  onClose: () => void;
}

function DetailPanel({ indicatorId, onClose }: DetailPanelProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<IndicatorForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    setNarrative(null);
    forecastingApi.get(indicatorId)
      .then(setDetail)
      .catch((err: ApiError) => showToast(err?.message || 'Failed to load forecast.', 'error'))
      .finally(() => setLoading(false));
  }, [indicatorId]);

  const handleGenerateNarrative = () => {
    setNarrativeLoading(true);
    forecastingApi.generateNarrative(indicatorId)
      .then((res) => setNarrative(res.text))
      .catch((err: ApiError) => {
        if (err?.status === 409) {
          showToast('AI isn’t set up yet — ask a company admin to configure it in Settings > AI Assistant.', 'error');
        } else {
          showToast(err?.message || 'Failed to generate an insight.', 'error');
        }
      })
      .finally(() => setNarrativeLoading(false));
  };

  const canUseAi = hasPermission(user?.role, user?.permissions, 'ai.use');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-navy-100 relative z-10 overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 to-indigo-500" />

        <div className="flex items-start justify-between pb-4 border-b border-navy-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-primary-50 text-primary-600 rounded-xl border border-primary-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-navy-950 uppercase tracking-wider">
                {detail?.indicatorName || 'Forecast'}
              </h4>
              <p className="text-[10px] text-navy-400 font-semibold">Trend-projected forecast</p>
            </div>
          </div>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-600 p-1 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && <div className="py-12 text-center text-xs font-semibold text-navy-400">Loading forecast…</div>}

        {!loading && detail && (
          <div className="pt-4 space-y-5">
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-50 text-navy-600 border border-navy-100">
                {TREND_ICON[detail.trendDirection]}
                {TREND_DIRECTION_LABEL[detail.trendDirection]} trend
              </span>
              {detail.targetAlignment && (
                <span className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wider ${FORECAST_STATUS_STYLES[detail.targetAlignment.status].className}`}>
                  {FORECAST_STATUS_STYLES[detail.targetAlignment.status].label}
                </span>
              )}
            </div>

            <ForecastChart
              points={detail.points}
              targetValue={detail.targetAlignment?.targetValue}
              targetYear={detail.targetAlignment?.targetYear}
            />

            <div className="flex items-center gap-4 text-[10px] font-semibold text-navy-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Actual</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-500 inline-block border-b border-dashed" /> Projected</span>
              {detail.targetAlignment && (
                <span className="flex items-center gap-1.5"><TargetIcon className="w-3 h-3 text-amber-500" /> Target</span>
              )}
            </div>

            {detail.targetAlignment && (
              <div className="p-3.5 rounded-2xl bg-navy-50 border border-navy-100 text-xs font-semibold text-navy-600">
                Linked to <span className="font-bold text-navy-950">{detail.targetAlignment.targetTitle}</span> —
                projected to reach <span className="font-bold text-navy-950">{formatValue(detail.targetAlignment.projectedValueAtTargetYear)} {detail.unit}</span> by
                FY{detail.targetAlignment.targetYear}, against a target of {formatValue(detail.targetAlignment.targetValue)} {detail.unit}.
              </div>
            )}

            {canUseAi && (
              <div className="pt-2 border-t border-navy-50 space-y-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateNarrative}
                  disabled={narrativeLoading}
                  icon={narrativeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                >
                  {narrativeLoading ? 'Generating…' : narrative ? 'Regenerate AI Insight' : 'Generate AI Insight'}
                </Button>
                {narrative && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs leading-relaxed text-navy-700">
                    {narrative}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForecastingView() {
  const { showToast } = useToast();
  const [summaries, setSummaries] = useState<ForecastSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    forecastingApi.list()
      .then(setSummaries)
      .catch((err: ApiError) => showToast(err?.message || 'Failed to load forecasts.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 w-full pb-16 font-sans">

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-navy-100/40">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-primary-600 mb-1">
            <span className="px-2 py-0.5 bg-primary-50 rounded-md">Trend Analysis</span>
            <span>•</span>
            <span>AI-Assisted Insights</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-950">AI Forecasting</h2>
          <p className="text-xs text-navy-500 mt-1">
            Statistically projected future performance for indicators with recorded history, compared against your linked targets.
          </p>
        </div>
      </div>

      {loading && <div className="py-16 text-center text-xs font-semibold text-navy-400">Loading forecasts…</div>}

      {!loading && summaries.length === 0 && (
        <Card padded="lg" className="text-center">
          <TrendingUp className="w-8 h-8 text-navy-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-navy-950">Not enough history yet</h3>
          <p className="text-xs text-navy-500 mt-1 max-w-md mx-auto">
            Record at least two fiscal years of data for an indicator in Indicators to see a trend forecast here.
          </p>
        </Card>
      )}

      {!loading && summaries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {summaries.map((s) => (
            <div key={s.indicatorId} onClick={() => setSelectedId(s.indicatorId)} className="cursor-pointer">
            <Card
              padded="sm"
              hoverEffect
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-navy-950 leading-snug">{s.indicatorName}</h3>
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-navy-500 bg-navy-50 border border-navy-100 rounded-md px-1.5 py-0.5">
                  {TREND_ICON[s.trendDirection]}
                </span>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-navy-400">FY{s.lastActualYear} Actual</div>
                  <div className="text-lg font-bold text-navy-950">{formatValue(s.lastActualValue)} <span className="text-[10px] font-semibold text-navy-400">{s.unit}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-navy-400">FY{s.projectionYear} Projected</div>
                  <div className="text-lg font-bold text-indigo-600">{formatValue(s.projectedValue)} <span className="text-[10px] font-semibold text-navy-400">{s.unit}</span></div>
                </div>
              </div>

              {s.targetAlignment && (
                <div className={`mt-3 text-[10px] font-bold uppercase tracking-wider border rounded-lg px-2 py-1 inline-block ${FORECAST_STATUS_STYLES[s.targetAlignment.status].className}`}>
                  {FORECAST_STATUS_STYLES[s.targetAlignment.status].label} for {s.targetAlignment.targetTitle}
                </div>
              )}
            </Card>
            </div>
          ))}
        </div>
      )}

      {selectedId && <DetailPanel indicatorId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
