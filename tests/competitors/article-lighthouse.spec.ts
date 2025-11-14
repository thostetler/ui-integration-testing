/**
 * Lighthouse performance tests for competitor article/abstract pages
 */

import { test, expect } from '@playwright/test';
import { competitors, lighthouseConfig } from './competitors-config';
import {
  runLighthouseAudit,
  saveLighthouseResults,
  aggregateResults,
  type LighthouseResult,
} from './lighthouse-utils';

test.describe('Competitor Article Pages - Lighthouse Audits', () => {
  const allResults: LighthouseResult[] = [];

  // Run lighthouse audits for each competitor's article page
  for (const competitor of competitors) {
    test.describe(`${competitor.name} - Article Page`, () => {
      // Run multiple times for statistical significance
      for (let run = 1; run <= lighthouseConfig.runsPerUrl; run++) {
        test(`Run ${run} - Lighthouse audit for ${competitor.name} article`, async ({
          page,
          browser,
        }, testInfo) => {
          test.setTimeout(lighthouseConfig.timeout * 2);

          console.log(
            `Running Lighthouse audit ${run}/${lighthouseConfig.runsPerUrl} for ${competitor.name} article page...`,
          );

          try {
            const result = await runLighthouseAudit(
              page,
              competitor.article_url,
              competitor.name,
              'article',
              run,
            );

            allResults.push(result);

            // Log results
            console.log(`\n${competitor.name} Article Page - Run ${run} Results:`);
            console.log(`  Performance Score: ${(result.scores.performance * 100).toFixed(1)}`);
            console.log(
              `  Accessibility Score: ${(result.scores.accessibility * 100).toFixed(1)}`,
            );
            console.log(`  Best Practices Score: ${(result.scores.bestPractices * 100).toFixed(1)}`);
            console.log(`  SEO Score: ${(result.scores.seo * 100).toFixed(1)}`);
            console.log(`\n  Core Web Vitals:`);
            console.log(`    FCP: ${result.metrics.firstContentfulPaint.toFixed(0)}ms`);
            console.log(`    LCP: ${result.metrics.largestContentfulPaint.toFixed(0)}ms`);
            console.log(`    TBT: ${result.metrics.totalBlockingTime.toFixed(0)}ms`);
            console.log(`    CLS: ${result.metrics.cumulativeLayoutShift.toFixed(3)}`);
            console.log(`    Speed Index: ${result.metrics.speedIndex.toFixed(0)}ms`);
            console.log(`    TTI: ${result.metrics.timeToInteractive.toFixed(0)}ms`);

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
            // Add note if there was an error
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
      saveLighthouseResults(allResults, `article-pages-raw-${timestamp}.json`);

      // Calculate and save aggregated statistics
      const aggregated = aggregateResults(allResults);
      saveLighthouseResults(aggregated as any, `article-pages-aggregated-${timestamp}.json`);

      // Print summary table
      console.log('\n\n=== ARTICLE PAGES PERFORMANCE SUMMARY ===\n');
      console.log(
        'Site'.padEnd(25),
        'Perf Score'.padEnd(12),
        'LCP (ms)'.padEnd(12),
        'TBT (ms)'.padEnd(12),
        'CLS',
      );
      console.log('-'.repeat(75));

      for (const agg of aggregated) {
        if (agg.pageType === 'article') {
          const perfScore = (agg.scores.performance.mean * 100).toFixed(1);
          const lcp = agg.metrics.largestContentfulPaint.mean.toFixed(0);
          const tbt = agg.metrics.totalBlockingTime.mean.toFixed(0);
          const cls = agg.metrics.cumulativeLayoutShift.mean.toFixed(3);

          console.log(
            agg.siteName.padEnd(25),
            perfScore.padEnd(12),
            lcp.padEnd(12),
            tbt.padEnd(12),
            cls,
          );
        }
      }
      console.log('\n');
    }
  });
});
