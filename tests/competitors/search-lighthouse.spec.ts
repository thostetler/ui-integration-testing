/**
 * Lighthouse performance tests for competitor search pages
 */

import { test, expect } from '@playwright/test';
import { competitors, lighthouseConfig } from './competitors-config';
import {
  runLighthouseAudit,
  saveLighthouseResults,
  aggregateResults,
  type LighthouseResult,
} from './lighthouse-utils';

test.describe('Competitor Search Pages - Lighthouse Audits', () => {
  const allResults: LighthouseResult[] = [];

  // Run lighthouse audits for each competitor's search page
  for (const competitor of competitors) {
    test.describe(`${competitor.name} - Search Page`, () => {
      // Run multiple times for statistical significance
      for (let run = 1; run <= lighthouseConfig.runsPerUrl; run++) {
        test(`Run ${run} - Lighthouse audit for ${competitor.name} search`, async ({
          page,
          browser,
        }, testInfo) => {
          test.setTimeout(lighthouseConfig.timeout * 3);

          if (run > 1) {
            await page.waitForTimeout(5000);
          }

          console.log(
            `Running Lighthouse audit ${run}/${lighthouseConfig.runsPerUrl} for ${competitor.name} search page...`,
          );

          try {
            const result = await runLighthouseAudit(
              page,
              competitor.search_url,
              competitor.name,
              'search',
              run,
            );

            allResults.push(result);

            // Log results
            console.log(`\n${competitor.name} Search Page - Run ${run} Results:`);
            console.log(`  Performance Score: ${(result.scores.performance * 100).toFixed(1)}`);
            console.log(
              `  Accessibility Score: ${(result.scores.accessibility * 100).toFixed(1)}`,
            );
            console.log(`  Best Practices Score: ${(result.scores.bestPractices * 100).toFixed(1)}`);
            console.log(`  SEO Score: ${(result.scores.seo * 100).toFixed(1)}`);
            console.log(`\n  Core Web Vitals:`);
            console.log(`    FCP: ${result.metrics.firstContentfulPaint.toFixed(0)}ms`);
            console.log(`    LCP: ${result.metrics.largestContentfulPaint.toFixed(0)}ms`);
            console.log(`    CLS: ${result.metrics.cumulativeLayoutShift.toFixed(3)}`);
            if (result.metrics.interactionToNextPaint !== undefined) {
              console.log(`    INP: ${result.metrics.interactionToNextPaint.toFixed(0)}ms`);
            }
            console.log(`\n  Other Metrics:`);
            console.log(`    TBT: ${result.metrics.totalBlockingTime.toFixed(0)}ms`);
            console.log(`    Speed Index: ${result.metrics.speedIndex.toFixed(0)}ms`);
            console.log(`    TTI: ${result.metrics.timeToInteractive.toFixed(0)}ms`);
            if (result.metrics.maxPotentialFID !== undefined) {
              console.log(`    Max Potential FID: ${result.metrics.maxPotentialFID.toFixed(0)}ms`);
            }
            if (result.metrics.timeToFirstByte !== undefined) {
              console.log(`    TTFB: ${result.metrics.timeToFirstByte.toFixed(0)}ms`);
            }
            if (result.metrics.totalByteWeight !== undefined) {
              console.log(`    Page Weight: ${(result.metrics.totalByteWeight / 1024).toFixed(1)} KB`);
            }

            // Attach the result to the test report
            await testInfo.attach('lighthouse-result.json', {
              body: JSON.stringify(result, null, 2),
              contentType: 'application/json',
            });

            // Basic sanity checks (not strict thresholds)
            expect(result.scores.performance).toBeGreaterThanOrEqual(0);
            expect(result.scores.accessibility).toBeGreaterThanOrEqual(0);
          } catch (error) {
            console.error(`Error running Lighthouse audit for ${competitor.name}:`, error);
            if (competitor.note) {
              console.log(`Note: ${competitor.note}`);
            }
            throw error;
          }
        });
      }
    });
  }

  // Save and aggregate results after all tests
  test.afterAll(async () => {
    if (allResults.length > 0) {
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

      // Save raw results
      saveLighthouseResults(allResults, `search-pages-raw-${timestamp}.json`);

      // Calculate and save aggregated statistics
      const aggregated = aggregateResults(allResults);
      saveLighthouseResults(aggregated as any, `search-pages-aggregated-${timestamp}.json`);

      // Print summary table
      console.log('\n\n=== SEARCH PAGES PERFORMANCE SUMMARY ===\n');
      console.log(
        'Site'.padEnd(25),
        'Perf Score'.padEnd(12),
        'LCP (ms)'.padEnd(12),
        'INP (ms)'.padEnd(12),
        'CLS'.padEnd(8),
        'TTFB (ms)'.padEnd(12),
        'Page Weight (KB)',
      );
      console.log('-'.repeat(105));

      for (const agg of aggregated) {
        if (agg.pageType === 'search') {
          const perfScore = (agg.scores.performance.mean * 100).toFixed(1);
          const lcp = agg.metrics.largestContentfulPaint.mean.toFixed(0);
          const inp = agg.metrics.interactionToNextPaint?.mean
            ? agg.metrics.interactionToNextPaint.mean.toFixed(0)
            : 'N/A';
          const cls = agg.metrics.cumulativeLayoutShift.mean.toFixed(3);
          const ttfb = agg.metrics.timeToFirstByte?.mean
            ? agg.metrics.timeToFirstByte.mean.toFixed(0)
            : 'N/A';
          const pageWeight = agg.metrics.totalByteWeight?.mean
            ? (agg.metrics.totalByteWeight.mean / 1024).toFixed(1)
            : 'N/A';

          console.log(
            agg.siteName.padEnd(25),
            perfScore.padEnd(12),
            lcp.padEnd(12),
            inp.toString().padEnd(12),
            cls.padEnd(8),
            ttfb.toString().padEnd(12),
            pageWeight,
          );
        }
      }
      console.log('\n');
    }
  });
});
