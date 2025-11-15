/**
 * Native Playwright performance measurement utilities
 * Replaces playwright-lighthouse with stable, native performance APIs
 */

import { Page } from '@playwright/test';
import { performanceConfig } from './competitors-config';
import * as fs from 'fs';
import * as path from 'path';

interface LongTask {
  duration: number;
  startTime: number;
}

interface LayoutShiftEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceMetrics {
  timeToFirstByte?: number;
  domContentLoaded?: number;
  loadComplete?: number;
  firstContentfulPaint?: number;
  totalByteWeight?: number;
  resourceCount?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  totalBlockingTime?: number;
  timeToInteractive?: number;
  speedIndex?: number;
}

declare global {
  interface Window {
    __longTasks?: LongTask[];
  }
}

interface MetricStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
}

export interface PerformanceResult {
  url: string;
  siteName: string;
  pageType: 'search' | 'article';
  runNumber: number;
  timestamp: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
    speedIndex: number;
    timeToInteractive: number;
    interactionToNextPaint?: number;
    maxPotentialFID?: number;
    timeToFirstByte?: number;
    totalByteWeight?: number;
  };
  rawReport?: unknown;
}

export interface AggregatedPerformanceResult {
  siteName: string;
  pageType: string;
  numberOfRuns: number;
  scores: {
    performance: MetricStats;
    accessibility: MetricStats;
    bestPractices: MetricStats;
    seo: MetricStats;
  };
  metrics: {
    firstContentfulPaint: MetricStats;
    largestContentfulPaint: MetricStats;
    totalBlockingTime: MetricStats;
    cumulativeLayoutShift: MetricStats;
    speedIndex: MetricStats;
    timeToInteractive: MetricStats;
    interactionToNextPaint: MetricStats;
    maxPotentialFID: MetricStats;
    timeToFirstByte: MetricStats;
    totalByteWeight: MetricStats;
  };
}

/**
 * Calculates a performance score (0-1) based on key metrics
 * Uses similar weighting to Lighthouse
 */
function calculatePerformanceScore(metrics: PerformanceResult['metrics']): number {
  const lcpScore = Math.max(0, Math.min(1, (4000 - metrics.largestContentfulPaint) / 2500));
  const fcpScore = Math.max(0, Math.min(1, (3000 - metrics.firstContentfulPaint) / 2000));
  const clsScore = Math.max(0, Math.min(1, (0.25 - metrics.cumulativeLayoutShift) / 0.15));
  const tbtScore = Math.max(0, Math.min(1, (600 - metrics.totalBlockingTime) / 400));

  // Weighted average similar to Lighthouse
  return (lcpScore * 0.25 + fcpScore * 0.1 + clsScore * 0.15 + tbtScore * 0.25) / 0.75;
}

/**
 * Measures Core Web Vitals and performance metrics using native Playwright APIs
 */
export async function measurePerformance(page: Page): Promise<PerformanceResult['metrics']> {
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
    console.log('    Network idle timeout, proceeding with measurements');
  });

  // Wait a bit more for any layout shifts to settle
  await page.waitForTimeout(1000);

  // Collect performance metrics
  const metrics = await page.evaluate(() => {
    const metrics: PerformanceMetrics = {};

    // Get Navigation Timing metrics
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navTiming) {
      metrics.timeToFirstByte = navTiming.responseStart - navTiming.requestStart;
      metrics.domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;
      metrics.loadComplete = navTiming.loadEventEnd - navTiming.fetchStart;
    }

    // Get Paint Timing metrics
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      metrics.firstContentfulPaint = fcpEntry.startTime;
    }

    // Get Resource Timing for page weight
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    metrics.totalByteWeight = resources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
    metrics.resourceCount = resources.length;

    // Get Largest Contentful Paint
    let largestContentfulPaint = 0;
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
      }
    } catch {
      // LCP not available
    }
    metrics.largestContentfulPaint = largestContentfulPaint || metrics.firstContentfulPaint || 0;

    // Get Cumulative Layout Shift
    let cumulativeLayoutShift = 0;
    try {
      const clsEntries = performance.getEntriesByType('layout-shift') as unknown as LayoutShiftEntry[];
      cumulativeLayoutShift = clsEntries
        .filter((entry) => !entry.hadRecentInput)
        .reduce((sum, entry) => sum + entry.value, 0);
    } catch {
      // CLS not available
    }
    metrics.cumulativeLayoutShift = cumulativeLayoutShift;

    // Calculate Total Blocking Time from long tasks
    let totalBlockingTime = 0;
    try {
      // Check if window has longTaskEntries (set by addInitScript)
      const longTasks = window.__longTasks || [];
      totalBlockingTime = longTasks.reduce((sum: number, task: LongTask) => {
        const blockingTime = Math.max(0, task.duration - 50);
        return sum + blockingTime;
      }, 0);
    } catch {
      // Long tasks not available
    }
    metrics.totalBlockingTime = totalBlockingTime;
    metrics.timeToInteractive = metrics.loadComplete || 0;

    // Estimate Speed Index (simplified as time to visual completeness)
    metrics.speedIndex = metrics.largestContentfulPaint || metrics.loadComplete || 0;

    return metrics;
  });

  return {
    firstContentfulPaint: metrics.firstContentfulPaint || 0,
    largestContentfulPaint: metrics.largestContentfulPaint || 0,
    totalBlockingTime: metrics.totalBlockingTime || 0,
    cumulativeLayoutShift: metrics.cumulativeLayoutShift || 0,
    speedIndex: metrics.speedIndex || 0,
    timeToInteractive: metrics.timeToInteractive || 0,
    timeToFirstByte: metrics.timeToFirstByte || 0,
    totalByteWeight: metrics.totalByteWeight || 0,
  };
}

/**
 * Handles common page elements that might interfere with testing
 */
async function handlePageInterferences(page: Page) {
  try {
    const commonSelectors = [
      'button:has-text("Accept")',
      'button:has-text("Agree")',
      'button:has-text("I agree")',
      'button:has-text("Accept all")',
      'button:has-text("Continue")',
      '[aria-label*="cookie" i] button',
      '[aria-label*="consent" i] button',
      '.cookie-banner button',
      '#onetrust-accept-btn-handler',
    ];

    for (const selector of commonSelectors) {
      try {
        const button = await page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          await button.click({ timeout: 1000 });
          console.log(`    Clicked consent/popup: ${selector}`);
          await page.waitForTimeout(500);
          break;
        }
      } catch {
        continue;
      }
    }
  } catch {
    // Silently continue if no popups found
  }
}

/**
 * Runs a performance audit on a page using native Playwright APIs
 */
export async function runPerformanceAudit(
  page: Page,
  url: string,
  siteName: string,
  pageType: 'search' | 'article',
  runNumber: number,
  retries: number = 2,
): Promise<PerformanceResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`    Retry attempt ${attempt}/${retries}...`);
        // Wait before retry, but handle case where page might be closed
        try {
          await page.waitForTimeout(3000);
        } catch {
          // Page might be closed, continue to navigation
          console.log(`    Page closed, continuing to navigation...`);
        }
      }

      // Set up long task observer before page loads
      await page.addInitScript(() => {
        window.__longTasks = [];
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              window.__longTasks!.push({
                duration: entry.duration,
                startTime: entry.startTime,
              });
            }
          });
          observer.observe({ entryTypes: ['longtask'] });
        } catch {
          // Long task observer not supported
        }
      });

      // Navigate to the page
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: performanceConfig.timeout,
      });

      // Handle cookie consent popups
      await handlePageInterferences(page);

      // Wait a bit for the page to settle
      await page.waitForTimeout(2000);

      // Measure performance metrics
      const metrics = await measurePerformance(page);

      // Calculate performance score
      const performanceScore = calculatePerformanceScore(metrics);

      const result: PerformanceResult = {
        url,
        siteName,
        pageType,
        runNumber,
        timestamp: new Date().toISOString(),
        scores: {
          performance: performanceScore,
          accessibility: 0, // Not measured with native APIs
          bestPractices: 0, // Not measured with native APIs
          seo: 0, // Not measured with native APIs
        },
        metrics,
      };

      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`    Attempt ${attempt + 1} failed:`, error.message);

      if (attempt === retries) {
        throw new Error(`Failed after ${retries + 1} attempts. Last error: ${lastError.message}`);
      }
    }
  }

  throw lastError!;
}

/**
 * Saves performance results to a JSON file
 */
export function savePerformanceResults(results: PerformanceResult[] | AggregatedPerformanceResult[], filename: string) {
  const resultsDir = path.join(process.cwd(), 'performance-results');

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const filepath = path.join(resultsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));

  console.log(`Results saved to: ${filepath}`);
}

/**
 * Calculates statistics (mean, median, std dev) for multiple runs
 */
export function calculateStats(values: number[]) {
  if (values.length === 0) return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

/**
 * Aggregates results from multiple runs
 */
export function aggregateResults(results: PerformanceResult[]): AggregatedPerformanceResult[] {
  const groupedBySiteAndType = results.reduce(
    (acc, result) => {
      const key = `${result.siteName}-${result.pageType}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(result);
      return acc;
    },
    {} as Record<string, PerformanceResult[]>,
  );

  const aggregated = Object.entries(groupedBySiteAndType).map(([key, runs]) => {
    const [siteName, pageType] = key.split('-');

    return {
      siteName,
      pageType,
      numberOfRuns: runs.length,
      scores: {
        performance: calculateStats(runs.map((r) => r.scores.performance)),
        accessibility: calculateStats(runs.map((r) => r.scores.accessibility)),
        bestPractices: calculateStats(runs.map((r) => r.scores.bestPractices)),
        seo: calculateStats(runs.map((r) => r.scores.seo)),
      },
      metrics: {
        firstContentfulPaint: calculateStats(runs.map((r) => r.metrics.firstContentfulPaint)),
        largestContentfulPaint: calculateStats(runs.map((r) => r.metrics.largestContentfulPaint)),
        totalBlockingTime: calculateStats(runs.map((r) => r.metrics.totalBlockingTime)),
        cumulativeLayoutShift: calculateStats(runs.map((r) => r.metrics.cumulativeLayoutShift)),
        speedIndex: calculateStats(runs.map((r) => r.metrics.speedIndex)),
        timeToInteractive: calculateStats(runs.map((r) => r.metrics.timeToInteractive)),
        interactionToNextPaint: calculateStats(
          runs.map((r) => r.metrics.interactionToNextPaint).filter((v) => v !== undefined) as number[],
        ),
        maxPotentialFID: calculateStats(
          runs.map((r) => r.metrics.maxPotentialFID).filter((v) => v !== undefined) as number[],
        ),
        timeToFirstByte: calculateStats(
          runs.map((r) => r.metrics.timeToFirstByte).filter((v) => v !== undefined) as number[],
        ),
        totalByteWeight: calculateStats(
          runs.map((r) => r.metrics.totalByteWeight).filter((v) => v !== undefined) as number[],
        ),
      },
    };
  });

  return aggregated;
}
