package com.esgeasy.esg.export;

import com.esgeasy.esg.climate.dto.EmissionPointDto;
import com.esgeasy.esg.climate.dto.EmissionsResponse;
import com.esgeasy.esg.indicators.dto.IndicatorResponse;
import com.esgeasy.esg.indicators.dto.IndicatorValuePointDto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/** Shared helpers for the PDF report generators in this package — emissions lookups and content checksums. */
final class ReportSupport {

    private ReportSupport() {
    }

    static BigDecimal valueForYear(List<EmissionPointDto> points, int fiscalYear) {
        return points.stream()
                .filter(v -> v.fiscalYear() == fiscalYear)
                .map(EmissionPointDto::value)
                .findFirst()
                .orElse(null);
    }

    static BigDecimal scope3TotalForYear(EmissionsResponse emissions, int fiscalYear) {
        if (emissions == null) {
            return null;
        }
        return emissions.scope3().stream()
                .flatMap(cat -> cat.values().stream())
                .filter(v -> v.fiscalYear() == fiscalYear)
                .map(v -> v.value())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    static Map<UUID, BigDecimal> scope3ValueByCategoryId(EmissionsResponse emissions, int fiscalYear) {
        Map<UUID, BigDecimal> result = new HashMap<>();
        if (emissions == null) {
            return result;
        }
        for (var cat : emissions.scope3()) {
            cat.values().stream()
                    .filter(v -> v.fiscalYear() == fiscalYear)
                    .map(v -> v.value())
                    .findFirst()
                    .ifPresent(v -> result.put(cat.id(), v));
        }
        return result;
    }

    /** The last {@code count} fiscal years up to and including {@code fiscalYear}, ascending — for multi-year trend tables. */
    static List<Integer> recentYears(int fiscalYear, int count) {
        List<Integer> years = new ArrayList<>();
        for (int y = fiscalYear - count + 1; y <= fiscalYear; y++) {
            years.add(y);
        }
        return years;
    }

    /** Indicator id -> (fiscal year -> value), for looking up a multi-year value in the Environmental/Social/Performance Data Summary tables. */
    static Map<String, Map<Integer, BigDecimal>> indicatorYearValues(List<IndicatorResponse> indicators) {
        Map<String, Map<Integer, BigDecimal>> result = new HashMap<>();
        for (IndicatorResponse ind : indicators) {
            Map<Integer, BigDecimal> byYear = new HashMap<>();
            for (IndicatorValuePointDto v : ind.values()) {
                byYear.put(v.fiscalYear(), v.value());
            }
            result.put(ind.id(), byYear);
        }
        return result;
    }

    /** One year's worth of GHG bars for the Environmental Performance chart — bar heights (in pt,
     *  against a {@code maxBarHeightPt}-tall track) are precomputed here rather than in the
     *  template, since Thymeleaf/SpringEL's BigDecimal division throws on non-terminating decimals. */
    record GhgChartPoint(int fiscalYear, BigDecimal scope1Value, BigDecimal scope2Value, BigDecimal scope3Value,
                          int scope1BarPt, int scope2BarPt, int scope3BarPt) {
    }

    static List<GhgChartPoint> buildGhgChart(List<Integer> recentYears, Map<Integer, BigDecimal> scope1ByYear,
                                              Map<Integer, BigDecimal> scope2ByYear, Map<Integer, BigDecimal> scope3ByYear,
                                              int maxBarHeightPt) {
        BigDecimal max = java.util.stream.Stream.of(scope1ByYear, scope2ByYear, scope3ByYear)
                .flatMap(m -> m.values().stream())
                .filter(v -> v != null)
                .max(java.util.Comparator.naturalOrder())
                .orElse(BigDecimal.ONE);

        List<GhgChartPoint> chart = new ArrayList<>();
        for (Integer y : recentYears) {
            BigDecimal s1 = scope1ByYear.get(y);
            BigDecimal s2 = scope2ByYear.get(y);
            BigDecimal s3 = scope3ByYear.get(y);
            chart.add(new GhgChartPoint(y, s1, s2, s3,
                    barHeightPt(s1, max, maxBarHeightPt), barHeightPt(s2, max, maxBarHeightPt), barHeightPt(s3, max, maxBarHeightPt)));
        }
        return chart;
    }

    /** Zero height for a null/absent value or when nothing in the whole chart has data yet — a
     *  uniform "minimum sliver" fallback here would draw identical fake-looking bars everywhere
     *  regardless of whether a scope actually has any recorded value, which reads as broken. */
    private static int barHeightPt(BigDecimal value, BigDecimal max, int maxBarHeightPt) {
        if (value == null || max.signum() <= 0) {
            return 0;
        }
        if (value.signum() <= 0) {
            return 1; // a genuinely reported zero still gets a visible sliver
        }
        int pt = value.multiply(BigDecimal.valueOf(maxBarHeightPt)).divide(max, 0, RoundingMode.HALF_UP).intValue();
        return Math.max(pt, 1);
    }

    /** True once at least one value in the three per-year maps is a real recorded number greater
     *  than zero — used to decide whether the GHG chart has anything meaningful to draw at all. */
    static boolean hasPositiveGhgValue(Map<Integer, BigDecimal> scope1ByYear, Map<Integer, BigDecimal> scope2ByYear,
                                        Map<Integer, BigDecimal> scope3ByYear) {
        return java.util.stream.Stream.of(scope1ByYear, scope2ByYear, scope3ByYear)
                .flatMap(m -> m.values().stream())
                .anyMatch(v -> v != null && v.signum() > 0);
    }

    /** Collapses a company name into a filename-safe token (letters/digits/underscore only) for use in generated report filenames. */
    static String filenameSlug(String companyName) {
        if (companyName == null || companyName.isBlank()) {
            return "Company";
        }
        String slug = companyName.trim().replaceAll("[^A-Za-z0-9]+", "_").replaceAll("^_+|_+$", "");
        return slug.isEmpty() ? "Company" : slug;
    }

    static String computeChecksum(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.substring(0, 12).toUpperCase(Locale.ROOT);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
