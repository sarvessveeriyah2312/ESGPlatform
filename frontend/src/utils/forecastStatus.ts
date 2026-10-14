import { ForecastStatus, TrendDirection } from '../api/forecastingApi';

export const FORECAST_STATUS_STYLES: Record<ForecastStatus, { label: string; className: string }> = {
  ON_TRACK: { label: 'On Track', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  AT_RISK: { label: 'At Risk', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  OFF_TRACK: { label: 'Off Track', className: 'bg-rose-50 text-rose-700 border-rose-100' },
};

export const TREND_DIRECTION_LABEL: Record<TrendDirection, string> = {
  INCREASING: 'Increasing',
  DECREASING: 'Decreasing',
  FLAT: 'Flat',
};
