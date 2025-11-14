/**
 * Script to analyze and compare Lighthouse results from competitor tests
 */

import * as fs from 'fs';
import * as path from 'path';

interface LighthouseMetric {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
}

interface AggregatedResult {
  siteName: string;
  pageType: string;
  numberOfRuns: number;
  scores: {
    performance: LighthouseMetric;
    accessibility: LighthouseMetric;
    bestPractices: LighthouseMetric;
    seo: LighthouseMetric;
  };
  metrics: {
    firstContentfulPaint: LighthouseMetric;
    largestContentfulPaint: LighthouseMetric;
    totalBlockingTime: LighthouseMetric;
    cumulativeLayoutShift: LighthouseMetric;
    speedIndex: LighthouseMetric;
    timeToInteractive: LighthouseMetric;
    interactionToNextPaint?: LighthouseMetric;
    maxPotentialFID?: LighthouseMetric;
    timeToFirstByte?: LighthouseMetric;
    totalByteWeight?: LighthouseMetric;
  };
}

function findLatestResults(dir: string, pattern: string): string | null {
  if (!fs.existsSync(dir)) {
    return null;
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.includes(pattern))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(dir, files[0]) : null;
}

function formatMetric(
  metric: LighthouseMetric,
  isScore: boolean = false,
  isBytes: boolean = false,
): string {
  let multiplier = 1;
  if (isScore) multiplier = 100;
  if (isBytes) multiplier = 1 / 1024; // Convert bytes to KB

  const mean = (metric.mean * multiplier).toFixed(isScore || isBytes ? 1 : 0);
  const stdDev = (metric.stdDev * multiplier).toFixed(isScore || isBytes ? 1 : 0);
  return `${mean} (±${stdDev})`;
}

function analyzeResults() {
  const resultsDir = path.join(process.cwd(), 'lighthouse-results');

  if (!fs.existsSync(resultsDir)) {
    console.error('No results directory found. Please run the tests first.');
    process.exit(1);
  }

  const searchFile = findLatestResults(resultsDir, 'search-pages-aggregated');
  const articleFile = findLatestResults(resultsDir, 'article-pages-aggregated');

  if (!searchFile && !articleFile) {
    console.error('No aggregated results found. Please run the tests first.');
    process.exit(1);
  }

  console.log('\n=== COMPETITOR LIGHTHOUSE ANALYSIS ===\n');

  // Analyze search pages
  if (searchFile) {
    console.log('📊 SEARCH PAGES COMPARISON\n');
    const searchResults: AggregatedResult[] = JSON.parse(fs.readFileSync(searchFile, 'utf-8'));

    console.log(
      'Site'.padEnd(25),
      '| Perf Score  | LCP (ms)    | INP (ms)    | CLS         | TTFB (ms)   | Page (KB)',
    );
    console.log('-'.repeat(125));

    searchResults.forEach((result) => {
      const inp = result.metrics.interactionToNextPaint
        ? formatMetric(result.metrics.interactionToNextPaint)
        : 'N/A';
      const ttfb = result.metrics.timeToFirstByte
        ? formatMetric(result.metrics.timeToFirstByte)
        : 'N/A';
      const pageWeight = result.metrics.totalByteWeight
        ? formatMetric(result.metrics.totalByteWeight, false, true)
        : 'N/A';

      console.log(
        result.siteName.padEnd(25),
        '|',
        formatMetric(result.scores.performance, true).padEnd(11),
        '|',
        formatMetric(result.metrics.largestContentfulPaint).padEnd(11),
        '|',
        inp.padEnd(11),
        '|',
        formatMetric(result.metrics.cumulativeLayoutShift).padEnd(11),
        '|',
        ttfb.padEnd(11),
        '|',
        pageWeight,
      );
    });

    // Find best performers
    console.log('\n🏆 Best Performers (Search):');
    const bestPerf = searchResults.reduce((best, curr) =>
      curr.scores.performance.mean > best.scores.performance.mean ? curr : best,
    );
    const bestLCP = searchResults.reduce((best, curr) =>
      curr.metrics.largestContentfulPaint.mean < best.metrics.largestContentfulPaint.mean
        ? curr
        : best,
    );

    console.log(`  Performance Score: ${bestPerf.siteName}`);
    console.log(`  LCP: ${bestLCP.siteName}`);

    const withINP = searchResults.filter((r) => r.metrics.interactionToNextPaint);
    if (withINP.length > 0) {
      const bestINP = withINP.reduce((best, curr) =>
        curr.metrics.interactionToNextPaint!.mean < best.metrics.interactionToNextPaint!.mean
          ? curr
          : best,
      );
      console.log(`  INP: ${bestINP.siteName}`);
    }

    const withPageWeight = searchResults.filter((r) => r.metrics.totalByteWeight);
    if (withPageWeight.length > 0) {
      const lightestPage = withPageWeight.reduce((best, curr) =>
        curr.metrics.totalByteWeight!.mean < best.metrics.totalByteWeight!.mean ? curr : best,
      );
      console.log(`  Smallest Page Weight: ${lightestPage.siteName}`);
    }
  }

  console.log('\n');

  // Analyze article pages
  if (articleFile) {
    console.log('📄 ARTICLE PAGES COMPARISON\n');
    const articleResults: AggregatedResult[] = JSON.parse(fs.readFileSync(articleFile, 'utf-8'));

    console.log(
      'Site'.padEnd(25),
      '| Perf Score  | LCP (ms)    | INP (ms)    | CLS         | TTFB (ms)   | Page (KB)',
    );
    console.log('-'.repeat(125));

    articleResults.forEach((result) => {
      const inp = result.metrics.interactionToNextPaint
        ? formatMetric(result.metrics.interactionToNextPaint)
        : 'N/A';
      const ttfb = result.metrics.timeToFirstByte
        ? formatMetric(result.metrics.timeToFirstByte)
        : 'N/A';
      const pageWeight = result.metrics.totalByteWeight
        ? formatMetric(result.metrics.totalByteWeight, false, true)
        : 'N/A';

      console.log(
        result.siteName.padEnd(25),
        '|',
        formatMetric(result.scores.performance, true).padEnd(11),
        '|',
        formatMetric(result.metrics.largestContentfulPaint).padEnd(11),
        '|',
        inp.padEnd(11),
        '|',
        formatMetric(result.metrics.cumulativeLayoutShift).padEnd(11),
        '|',
        ttfb.padEnd(11),
        '|',
        pageWeight,
      );
    });

    // Find best performers
    console.log('\n🏆 Best Performers (Article):');
    const bestPerf = articleResults.reduce((best, curr) =>
      curr.scores.performance.mean > best.scores.performance.mean ? curr : best,
    );
    const bestLCP = articleResults.reduce((best, curr) =>
      curr.metrics.largestContentfulPaint.mean < best.metrics.largestContentfulPaint.mean
        ? curr
        : best,
    );

    console.log(`  Performance Score: ${bestPerf.siteName}`);
    console.log(`  LCP: ${bestLCP.siteName}`);

    const withINP = articleResults.filter((r) => r.metrics.interactionToNextPaint);
    if (withINP.length > 0) {
      const bestINP = withINP.reduce((best, curr) =>
        curr.metrics.interactionToNextPaint!.mean < best.metrics.interactionToNextPaint!.mean
          ? curr
          : best,
      );
      console.log(`  INP: ${bestINP.siteName}`);
    }

    const withPageWeight = articleResults.filter((r) => r.metrics.totalByteWeight);
    if (withPageWeight.length > 0) {
      const lightestPage = withPageWeight.reduce((best, curr) =>
        curr.metrics.totalByteWeight!.mean < best.metrics.totalByteWeight!.mean ? curr : best,
      );
      console.log(`  Smallest Page Weight: ${lightestPage.siteName}`);
    }
  }

  console.log('\n📁 Detailed results saved in:', resultsDir);
  console.log('\nNote: Values shown as mean (±std dev)\n');
}

// Run the analysis
analyzeResults();
