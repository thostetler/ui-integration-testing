/**
 * Utilities for running Lighthouse tests and aggregating results
 */

import { Page } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import { lighthouseConfig } from './competitors-config';
import * as fs from 'fs';
import * as path from 'path';

export interface LighthouseResult {
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
  };
  rawReport?: any;
}

/**
 * Extracts key metrics from Lighthouse audit results
 */
export function extractLighthouseMetrics(auditResults: any): LighthouseResult['metrics'] {
  const audits = auditResults.lhr?.audits || auditResults.audits;

  return {
    firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
    largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
    totalBlockingTime: audits['total-blocking-time']?.numericValue || 0,
    cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0,
    speedIndex: audits['speed-index']?.numericValue || 0,
    timeToInteractive: audits['interactive']?.numericValue || 0,
  };
}

/**
 * Extracts category scores from Lighthouse audit results
 */
export function extractLighthouseScores(
  auditResults: any,
): LighthouseResult['scores'] {
  const categories = auditResults.lhr?.categories || auditResults.categories;

  return {
    performance: categories.performance?.score || 0,
    accessibility: categories.accessibility?.score || 0,
    bestPractices: categories['best-practices']?.score || 0,
    seo: categories.seo?.score || 0,
  };
}

/**
 * Runs a single Lighthouse audit on a page
 */
export async function runLighthouseAudit(
  page: Page,
  url: string,
  siteName: string,
  pageType: 'search' | 'article',
  runNumber: number,
): Promise<LighthouseResult> {
  await page.goto(url, { waitUntil: 'networkidle', timeout: lighthouseConfig.timeout });

  // Wait a bit for any lazy-loaded content
  await page.waitForTimeout(2000);

  const auditResults = await playAudit({
    page,
    port: lighthouseConfig.playwrightOptions.port,
    thresholds: {
      performance: 0, // Don't fail tests based on thresholds
      accessibility: 0,
      'best-practices': 0,
      seo: 0,
    },
    opts: lighthouseConfig.lighthouseOptions,
  });

  const result: LighthouseResult = {
    url,
    siteName,
    pageType,
    runNumber,
    timestamp: new Date().toISOString(),
    scores: extractLighthouseScores(auditResults),
    metrics: extractLighthouseMetrics(auditResults),
    rawReport: auditResults,
  };

  return result;
}

/**
 * Saves Lighthouse results to a JSON file
 */
export function saveLighthouseResults(results: LighthouseResult[], filename: string) {
  const resultsDir = path.join(process.cwd(), 'lighthouse-results');

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
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
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
export function aggregateResults(results: LighthouseResult[]) {
  const groupedBySiteAndType = results.reduce(
    (acc, result) => {
      const key = `${result.siteName}-${result.pageType}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(result);
      return acc;
    },
    {} as Record<string, LighthouseResult[]>,
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
        largestContentfulPaint: calculateStats(
          runs.map((r) => r.metrics.largestContentfulPaint),
        ),
        totalBlockingTime: calculateStats(runs.map((r) => r.metrics.totalBlockingTime)),
        cumulativeLayoutShift: calculateStats(
          runs.map((r) => r.metrics.cumulativeLayoutShift),
        ),
        speedIndex: calculateStats(runs.map((r) => r.metrics.speedIndex)),
        timeToInteractive: calculateStats(runs.map((r) => r.metrics.timeToInteractive)),
      },
    };
  });

  return aggregated;
}
