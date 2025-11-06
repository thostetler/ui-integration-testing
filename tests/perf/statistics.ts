/**
 * Statistical analysis utilities for performance data
 */

export interface Statistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  n: number;
  variance: number;
  cv: number; // Coefficient of variation (stdDev/mean)
}

/**
 * Calculate comprehensive statistics from an array of numbers
 */
export function calculateStats(values: number[]): Statistics {
  if (values.length === 0) {
    throw new Error('Cannot calculate statistics on empty array');
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // Mean
  const mean = values.reduce((a, b) => a + b, 0) / n;

  // Median
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  // Variance and standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (relative standard deviation)
  const cv = mean !== 0 ? (stdDev / mean) * 100 : 0;

  // Percentile function
  const getPercentile = (p: number): number => {
    if (p < 0 || p > 100) {
      throw new Error('Percentile must be between 0 and 100');
    }
    const index = Math.ceil((p / 100) * n) - 1;
    return sorted[Math.max(0, Math.min(index, n - 1))];
  };

  return {
    mean: round(mean),
    median: round(median),
    stdDev: round(stdDev),
    min: round(sorted[0]),
    max: round(sorted[n - 1]),
    p50: round(getPercentile(50)),
    p90: round(getPercentile(90)),
    p95: round(getPercentile(95)),
    p99: round(getPercentile(99)),
    n,
    variance: round(variance),
    cv: round(cv, 2),
  };
}

/**
 * Round to specified decimal places
 */
function round(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliers(values: number[], multiplier: number = 1.5): {
  outliers: number[];
  lowerBound: number;
  upperBound: number;
} {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);

  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  const outliers = values.filter(v => v < lowerBound || v > upperBound);

  return { outliers, lowerBound, upperBound };
}

/**
 * Calculate confidence interval
 */
export function confidenceInterval(
  values: number[],
  confidenceLevel: number = 0.95
): { lower: number; upper: number; margin: number } {
  const stats = calculateStats(values);

  // Using t-distribution approximation for 95% confidence
  // For large samples, this approximates to 1.96 * SE
  const z = confidenceLevel === 0.95 ? 1.96 : 2.576; // 95% or 99%
  const standardError = stats.stdDev / Math.sqrt(stats.n);
  const margin = z * standardError;

  return {
    lower: round(stats.mean - margin),
    upper: round(stats.mean + margin),
    margin: round(margin),
  };
}

/**
 * Compare two sets of measurements and determine if they're significantly different
 */
export function comparePerformance(
  baseline: number[],
  current: number[]
): {
  baselineStats: Statistics;
  currentStats: Statistics;
  percentChange: number;
  isSignificant: boolean;
  recommendation: string;
} {
  const baselineStats = calculateStats(baseline);
  const currentStats = calculateStats(current);

  const percentChange = ((currentStats.median - baselineStats.median) / baselineStats.median) * 100;

  // Simple significance test: check if confidence intervals overlap
  const baselineCI = confidenceInterval(baseline);
  const currentCI = confidenceInterval(current);

  const isSignificant = currentCI.lower > baselineCI.upper || currentCI.upper < baselineCI.lower;

  let recommendation: string;
  if (isSignificant) {
    if (percentChange > 0) {
      recommendation = '⚠️ REGRESSION DETECTED: Performance has significantly degraded';
    } else {
      recommendation = '✅ IMPROVEMENT: Performance has significantly improved';
    }
  } else {
    recommendation = '➡️ NO SIGNIFICANT CHANGE: Performance is within expected variance';
  }

  return {
    baselineStats,
    currentStats,
    percentChange: round(percentChange, 2),
    isSignificant,
    recommendation,
  };
}

/**
 * Format statistics as a human-readable string
 */
export function formatStats(stats: Statistics): string {
  return `
Mean: ${stats.mean}ms (±${stats.stdDev}ms, CV: ${stats.cv}%)
Median: ${stats.median}ms
Range: ${stats.min}ms - ${stats.max}ms
Percentiles:
  P50: ${stats.p50}ms
  P90: ${stats.p90}ms
  P95: ${stats.p95}ms
  P99: ${stats.p99}ms
Sample size: ${stats.n}
  `.trim();
}
