package com.esgeasy.esg.forecasting;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

/**
 * Ordinary least-squares fit of value-over-fiscal-year, used to project an indicator's recorded
 * annual values forward. Deliberately simple (no seasonality/outlier handling) — this is a trend
 * indicator for the forecasting overview, not an accounting-grade projection.
 */
final class LinearTrend {

    private final double slope;
    private final double intercept;

    private LinearTrend(double slope, double intercept) {
        this.slope = slope;
        this.intercept = intercept;
    }

    /** Requires at least 2 distinct (fiscalYear, value) points. */
    static LinearTrend fit(Map<Integer, BigDecimal> pointsByYear) {
        int n = pointsByYear.size();
        double sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (Map.Entry<Integer, BigDecimal> e : pointsByYear.entrySet()) {
            double x = e.getKey();
            double y = e.getValue().doubleValue();
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }
        double denominator = n * sumXX - sumX * sumX;
        if (denominator == 0) {
            // All points share the same year (shouldn't happen given the caller's Map<Integer,_> keying) — flat fallback.
            return new LinearTrend(0, sumY / n);
        }
        double slope = (n * sumXY - sumX * sumY) / denominator;
        double intercept = (sumY - slope * sumX) / n;
        return new LinearTrend(slope, intercept);
    }

    BigDecimal predict(int fiscalYear) {
        double y = slope * fiscalYear + intercept;
        return BigDecimal.valueOf(y).setScale(4, RoundingMode.HALF_UP);
    }

    double slopePerYear() {
        return slope;
    }

    static List<Integer> yearsBetween(int fromExclusive, int toInclusive) {
        return java.util.stream.IntStream.rangeClosed(fromExclusive + 1, toInclusive).boxed().toList();
    }
}
