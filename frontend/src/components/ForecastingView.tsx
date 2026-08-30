/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles, Loader2, Target as TargetIcon, ListChecks } from 'lucide-react';
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
  const width = 640;
  const height = 220;
  const padding = 28;

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
        <circle key={`a-${p.fiscalYear}`} cx={toX(p.fiscalYear)} cy={toY(p.value)} r={3.5} fill="#10b981" />
      ))}
      {projectedPoints.map((p) => (
        <circle key={`p-${p.fiscalYear}`} cx={toX(p.fiscalYear)} cy={toY(p.value)} r={3.5} fill="#6366f1" />
      ))}
      {targetValue !== undefined && targetYear !== undefined && (
        <>
          <line
            x1={toX(targetYear)} y1={toY(targetValue) - 6} x2={toX(targetYear)} y2={toY(targetValue) + 6}
            stroke="#f59e0b" strokeWidth={2}
          />
          <circle cx={toX(targetYear)} cy={toY(targetValue)} r={5} fill="none" stroke="#f59e0b" strokeWidth={2} />
        </>
      )}
      {points.map((p) => (
        <text
          key={`label-${p.fiscalYear}`}
          x={toX(p.fiscalYear)} y={height - 8} fontSize="9" textAnchor="middle" fill="#94a3b8" fontFamily="monospace"
        >
          FY{p.fiscalYear}
        </text>
      ))}
    </svg>
  );
}

interface ForecastDetailProps {
  indicatorId: string;
}

/** Inline forecast detail for the selected tab — renders in the page flow, no modal. */
function ForecastDetail({ indicatorId }: ForecastDetailProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<IndicatorForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    setNarrative(null);
    setActionPlan(null);
    forecastingApi.get(indicatorId)
      .then((d) => {
        setDetail(d);
        setNarrative(d.narrative);
        setActionPlan(d.actionPlan);
      })
      .catch((err: ApiError) => showToast(err?.message || 'Failed to load forecast.', 'error'))
      .finally(() => setLoading(false));
  }, [indicatorId]);

  // One button drafts both the plain-language insight and — when a target is linked — the action
  // plan, in parallel. Each call fails independently so one provider hiccup doesn't hide the other.
  const handleGenerate = (hasTarget: boolean) => {
    setGenerating(true);
    const aiUnavailableMsg = (fallback: string) => (err: ApiError) =>
      showToast(
        err?.status === 409
          ? 'AI isn’t set up yet — ask a company admin to configure it in Settings > AI Assistant.'
          : err?.message || fallback,
        'error'
      );

    Promise.allSettled([
      forecastingApi.generateNarrative(indicatorId)
        .then((res) => setNarrative(res.text))
        .catch(aiUnavailableMsg('Failed to generate an insight.')),
      hasTarget
        ? forecastingApi.generateActionPlan(indicatorId)
            .then((res) => setActionPlan(res.text))
            .catch(aiUnavailableMsg('Failed to generate an action plan.'))
        : Promise.resolve(),
    ]).finally(() => setGenerating(false));
  };

  const canUseAi = hasPermission(user?.role, user?.permissions, 'ai.use');

  if (loading) {
    return <Card padded="lg" className="text-center text-xs font-semibold text-navy-400">Loading forecast…</Card>;
  }
  if (!detail) {
    return null;
  }

  return (
    <Card padded="lg" className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-black text-navy-950 uppercase tracking-wider">{detail.indicatorName}</h3>
          <p className="text-[10px] text-navy-400 font-semibold mt-0.5">Trend-projected forecast</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-50 text-navy-600 border border-navy-100 text-xs font-semibold">
            {TREND_ICON[detail.trendDirection]}
            {TREND_DIRECTION_LABEL[detail.trendDirection]} trend
          </span>
          {detail.targetAlignment && (
            <span className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wider ${FORECAST_STATUS_STYLES[detail.targetAlignment.status].className}`}>
              {FORECAST_STATUS_STYLES[detail.targetAlignment.status].label}
            </span>
          )}
        </div>
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
        <div className="pt-4 border-t border-navy-50 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleGenerate(!!detail.targetAlignment)}
              disabled={generating}
              icon={generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            >
              {generating
                ? 'Generating…'
                : narrative || actionPlan
                  ? 'Regenerate AI Insight'
                  : detail.targetAlignment
                    ? 'Generate AI Insight & Action Plan'
                    : 'Generate AI Insight'}
            </Button>
          </div>
          {narrative && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs leading-relaxed text-navy-700">
              {narrative}
            </div>
          )}
          {actionPlan && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs leading-relaxed text-navy-700 space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                <ListChecks className="w-3.5 h-3.5" />
                Steps to reach target
              </div>
              <ol className="space-y-2.5 list-decimal list-inside marker:font-bold marker:text-indigo-500">
                {actionPlan
                  .split('\n')
                  .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim())
                  .filter(Boolean)
                  .map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function ForecastingView() {
  const { showToast } = useToast();
  const [summaries, setSummaries] = useState<ForecastSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    forecastingApi.list()
      .then((data) => {
        setSummaries(data);
        setSelectedId((prev) => prev ?? data[0]?.indicatorId ?? null);
      })
      .catch((err: ApiError) => showToast(err?.message || 'Failed to load forecasts.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 w-full pb-16 font-sans">

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
        <>
          {/* TAB BAR — one tab per forecastable indicator */}
          <div className="flex overflow-x-auto -mb-px border-b border-navy-100">
            {summaries.map((s) => {
              const active = s.indicatorId === selectedId;
              return (
                <button
                  key={s.indicatorId}
                  onClick={() => setSelectedId(s.indicatorId)}
                  className={`px-5 py-3 text-xs font-extrabold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'border-primary-500 text-primary-600 font-black'
                      : 'border-transparent text-navy-500 hover:text-navy-900 hover:border-navy-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {TREND_ICON[s.trendDirection]}
                    <span>{s.indicatorName}</span>
                    {s.targetAlignment && (
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        s.targetAlignment.status === 'ON_TRACK' ? 'bg-emerald-500'
                          : s.targetAlignment.status === 'AT_RISK' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedId && <ForecastDetail indicatorId={selectedId} />}
        </>
      )}
    </div>
  );
}
