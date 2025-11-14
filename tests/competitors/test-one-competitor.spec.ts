/**
 * Minimal test to verify Lighthouse setup works for a single competitor
 */

import { test, expect } from '@playwright/test';
import { lighthouseConfig } from './competitors-config';
import { runLighthouseAudit, type LighthouseResult } from './lighthouse-utils';

test.describe('Single Competitor Test - Google Scholar', () => {
  test('Run Lighthouse audit on Google Scholar search', async ({ page }, testInfo) => {
    test.setTimeout(lighthouseConfig.timeout * 3);

    const competitorName = 'Google Scholar';
    const searchUrl = 'https://scholar.google.com/scholar?q=black+holes&hl=en&as_sdt=0,5';

    console.log(`Running Lighthouse audit for ${competitorName}...`);

    const result = await runLighthouseAudit(page, searchUrl, competitorName, 'search', 1);

    console.log(`\n${competitorName} Results:`);
    console.log(`  Performance Score: ${(result.scores.performance * 100).toFixed(1)}`);
    console.log(`  Accessibility Score: ${(result.scores.accessibility * 100).toFixed(1)}`);
    console.log(`  Best Practices Score: ${(result.scores.bestPractices * 100).toFixed(1)}`);
    console.log(`  SEO Score: ${(result.scores.seo * 100).toFixed(1)}`);
    console.log(`\n  Core Web Vitals:`);
    console.log(`    FCP: ${result.metrics.firstContentfulPaint.toFixed(0)}ms`);
    console.log(`    LCP: ${result.metrics.largestContentfulPaint.toFixed(0)}ms`);
    console.log(`    CLS: ${result.metrics.cumulativeLayoutShift.toFixed(3)}`);

    await testInfo.attach('lighthouse-result.json', {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json',
    });

    expect(result.scores.performance).toBeGreaterThanOrEqual(0);
    expect(result.scores.accessibility).toBeGreaterThanOrEqual(0);
  });

  test('Run second Lighthouse audit on Google Scholar search', async ({ page }, testInfo) => {
    test.setTimeout(lighthouseConfig.timeout * 3);

    await page.waitForTimeout(5000);

    const competitorName = 'Google Scholar';
    const searchUrl = 'https://scholar.google.com/scholar?q=black+holes&hl=en&as_sdt=0,5';

    console.log(`Running second Lighthouse audit for ${competitorName}...`);

    const result = await runLighthouseAudit(page, searchUrl, competitorName, 'search', 2);

    console.log(`\n${competitorName} Run 2 Results:`);
    console.log(`  Performance Score: ${(result.scores.performance * 100).toFixed(1)}`);
    console.log(`  Accessibility Score: ${(result.scores.accessibility * 100).toFixed(1)}`);

    await testInfo.attach('lighthouse-result.json', {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json',
    });

    expect(result.scores.performance).toBeGreaterThanOrEqual(0);
    expect(result.scores.accessibility).toBeGreaterThanOrEqual(0);
  });
});
