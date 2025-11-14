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
    interactionToNextPaint?: number;
    maxPotentialFID?: number;
    timeToFirstByte?: number;
    totalByteWeight?: number;
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
    interactionToNextPaint: audits['interaction-to-next-paint']?.numericValue,
    maxPotentialFID: audits['max-potential-fid']?.numericValue,
    timeToFirstByte: audits['server-response-time']?.numericValue,
    totalByteWeight: audits['total-byte-weight']?.numericValue,
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
  } catch (error) {
    console.log('    No consent popups detected');
  }
}

/**
 * Simulates user interactions to help trigger INP measurements
 */
async function simulateUserInteractions(page: Page) {
  try {
    await page.mouse.move(100, 100);
    await page.waitForTimeout(100);

    const interactiveElements = await page.locator('a, button, input').all();
    if (interactiveElements.length > 0) {
      const element = interactiveElements[0];
      if (await element.isVisible({ timeout: 1000 })) {
        await element.hover();
        await page.waitForTimeout(100);
      }
    }
  } catch (error) {
    console.log('    Could not simulate interactions');
  }
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
  retries: number = 2,
): Promise<LighthouseResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`    Retry attempt ${attempt}/${retries}...`);
        await page.waitForTimeout(5000);
      }

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: lighthouseConfig.timeout,
      });

      await handlePageInterferences(page);

      await page.waitForTimeout(3000);

      await simulateUserInteractions(page);

      const auditResults = await playAudit({
        page,
        port: lighthouseConfig.playwrightOptions.port,
        thresholds: {
          performance: 0,
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
    } catch (error) {
      lastError = error as Error;
      console.error(`    Attempt ${attempt + 1} failed:`, error.message);

      if (attempt === retries) {
        throw new Error(
          `Failed after ${retries + 1} attempts. Last error: ${lastError.message}`,
        );
      }
    }
  }

  throw lastError!;
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
