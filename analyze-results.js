#!/usr/bin/env node

/**
 * Competitor Performance Analysis Tool
 *
 * This script analyzes sitespeed.io results and generates comprehensive
 * comparison reports for competitor sites.
 *
 * Usage: node analyze-results.js <path-to-sitespeed-results-directory>
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Extract domain name from URL for cleaner display
 */
function getDomainName(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
}

/**
 * Extract page type (home, search, article) from URL
 */
function getPageType(url) {
  if (url.includes('/search') || url.includes('?q=') || url.includes('query=')) {
    return 'search';
  } else if (url.includes('/abs/') || url.includes('/article') || url.includes('/literature/') || url.includes('/paper/')) {
    return 'article';
  }
  return 'home';
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format milliseconds to seconds
 */
function formatTime(ms) {
  return (ms / 1000).toFixed(2) + 's';
}

/**
 * Get color for score (higher is better)
 */
function getScoreColor(score, thresholds = { good: 80, ok: 50 }) {
  if (score >= thresholds.good) return colors.green;
  if (score >= thresholds.ok) return colors.yellow;
  return colors.red;
}

/**
 * Get color for time (lower is better)
 */
function getTimeColor(ms, thresholds = { good: 2000, ok: 4000 }) {
  if (ms <= thresholds.good) return colors.green;
  if (ms <= thresholds.ok) return colors.yellow;
  return colors.red;
}

/**
 * Load and parse browsertime results
 */
function loadBrowsertimeData(resultsDir) {
  const pages = [];

  try {
    const indexPath = path.join(resultsDir, 'index.json');
    if (!fs.existsSync(indexPath)) {
      console.error(`${colors.red}Error: index.json not found in ${resultsDir}${colors.reset}`);
      return pages;
    }

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

    // Iterate through each page tested
    for (const [url, pageData] of Object.entries(index)) {
      const browsertimePath = path.join(resultsDir, 'pages', pageData.path, 'browsertime.json');

      if (fs.existsSync(browsertimePath)) {
        const browsertime = JSON.parse(fs.readFileSync(browsertimePath, 'utf8'));

        if (browsertime.length > 0 && browsertime[0].statistics) {
          const stats = browsertime[0].statistics;
          const domain = getDomainName(url);
          const pageType = getPageType(url);

          pages.push({
            url,
            domain,
            pageType,
            statistics: {
              // Page load metrics
              fullyLoaded: stats.timings?.fullyLoaded?.median || 0,
              backEndTime: stats.timings?.backEndTime?.median || 0,
              frontEndTime: stats.timings?.frontEndTime?.median || 0,
              pageLoadTime: stats.timings?.pageLoadTime?.median || 0,

              // Core Web Vitals
              firstContentfulPaint: stats.timings?.firstContentfulPaint?.median || 0,
              largestContentfulPaint: stats.timings?.largestContentfulPaint?.median || 0,
              cumulativeLayoutShift: stats.layoutShift?.cumulativeLayoutShift?.median || 0,
              totalBlockingTime: stats.cpu?.longTasks?.totalBlockingTime?.median || 0,

              // Visual metrics
              speedIndex: stats.visualMetrics?.SpeedIndex?.median || 0,
              firstVisualChange: stats.visualMetrics?.FirstVisualChange?.median || 0,
              lastVisualChange: stats.visualMetrics?.LastVisualChange?.median || 0,
              visualComplete85: stats.visualMetrics?.VisualComplete85?.median || 0,

              // Resource metrics
              transferSize: stats.pageinfo?.transferSize?.median || 0,
              contentSize: stats.pageinfo?.contentSize?.median || 0,
              requests: stats.pageinfo?.requests?.median || 0,

              // JavaScript metrics
              totalJavaScriptSize: stats.pageinfo?.javascriptSize?.median || 0,
              cpuTime: stats.cpu?.totalTime?.median || 0,

              // Lighthouse (if available)
              lighthouse: stats.lighthouse || null,
            }
          });
        }
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error loading browsertime data: ${error.message}${colors.reset}`);
  }

  return pages;
}

/**
 * Load Lighthouse data if available
 */
function loadLighthouseData(resultsDir) {
  const lighthouseData = {};

  try {
    const lighthouseDir = path.join(resultsDir, 'lighthouse');

    if (fs.existsSync(lighthouseDir)) {
      const files = fs.readdirSync(lighthouseDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(lighthouseDir, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          if (data.finalUrl) {
            lighthouseData[data.finalUrl] = {
              scores: {
                performance: data.categories?.performance?.score * 100 || 0,
                accessibility: data.categories?.accessibility?.score * 100 || 0,
                bestPractices: data.categories?.['best-practices']?.score * 100 || 0,
                seo: data.categories?.seo?.score * 100 || 0,
                pwa: data.categories?.pwa?.score * 100 || 0,
              },
              metrics: {
                firstContentfulPaint: data.audits?.['first-contentful-paint']?.numericValue || 0,
                largestContentfulPaint: data.audits?.['largest-contentful-paint']?.numericValue || 0,
                cumulativeLayoutShift: data.audits?.['cumulative-layout-shift']?.numericValue || 0,
                totalBlockingTime: data.audits?.['total-blocking-time']?.numericValue || 0,
                speedIndex: data.audits?.['speed-index']?.numericValue || 0,
                interactive: data.audits?.interactive?.numericValue || 0,
              }
            };
          }
        }
      }
    }
  } catch (error) {
    console.error(`${colors.yellow}Warning: Could not load Lighthouse data: ${error.message}${colors.reset}`);
  }

  return lighthouseData;
}

/**
 * Print comparison table
 */
function printComparisonTable(pages) {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}                 COMPETITOR PERFORMANCE COMPARISON${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  // Group by domain and page type
  const grouped = {};
  pages.forEach(page => {
    if (!grouped[page.domain]) grouped[page.domain] = {};
    grouped[page.domain][page.pageType] = page;
  });

  // Print each page type
  for (const pageType of ['home', 'search', 'article']) {
    const pagesOfType = pages.filter(p => p.pageType === pageType);
    if (pagesOfType.length === 0) continue;

    console.log(`\n${colors.bright}${colors.cyan}▶ ${pageType.toUpperCase()} PAGES${colors.reset}`);
    console.log(`${colors.dim}─────────────────────────────────────────────────────────────${colors.reset}`);

    // Sort by fully loaded time
    pagesOfType.sort((a, b) => a.statistics.fullyLoaded - b.statistics.fullyLoaded);

    console.log(`\n${colors.bright}Site                    | Fully Loaded | Speed Index | LCP     | Requests | Size    ${colors.reset}`);
    console.log(`${colors.dim}──────────────────────────────────────────────────────────────────────────────${colors.reset}`);

    pagesOfType.forEach((page, index) => {
      const stats = page.statistics;
      const rank = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';

      const fullyLoadedColor = getTimeColor(stats.fullyLoaded);
      const speedIndexColor = getTimeColor(stats.speedIndex);
      const lcpColor = getTimeColor(stats.largestContentfulPaint);

      console.log(
        `${rank} ${page.domain.padEnd(22)} | ` +
        `${fullyLoadedColor}${formatTime(stats.fullyLoaded).padEnd(12)}${colors.reset} | ` +
        `${speedIndexColor}${formatTime(stats.speedIndex).padEnd(11)}${colors.reset} | ` +
        `${lcpColor}${formatTime(stats.largestContentfulPaint).padEnd(7)}${colors.reset} | ` +
        `${String(stats.requests).padEnd(8)} | ` +
        `${formatBytes(stats.transferSize)}`
      );
    });
  }
}

/**
 * Print Core Web Vitals summary
 */
function printCoreWebVitals(pages) {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}                    CORE WEB VITALS SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  // Group by page type
  for (const pageType of ['home', 'search', 'article']) {
    const pagesOfType = pages.filter(p => p.pageType === pageType);
    if (pagesOfType.length === 0) continue;

    console.log(`\n${colors.bright}${colors.cyan}▶ ${pageType.toUpperCase()} PAGES - Core Web Vitals${colors.reset}`);
    console.log(`${colors.dim}─────────────────────────────────────────────────────────────${colors.reset}`);

    console.log(`\n${colors.bright}Site                    | LCP     | TBT    | CLS    | FCP    ${colors.reset}`);
    console.log(`${colors.dim}────────────────────────────────────────────────────────────────${colors.reset}`);

    // Sort by LCP
    pagesOfType.sort((a, b) => a.statistics.largestContentfulPaint - b.statistics.largestContentfulPaint);

    pagesOfType.forEach((page, index) => {
      const stats = page.statistics;
      const rank = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';

      const lcpColor = getTimeColor(stats.largestContentfulPaint, { good: 2500, ok: 4000 });
      const tbtColor = getTimeColor(stats.totalBlockingTime, { good: 200, ok: 600 });
      const clsColor = stats.cumulativeLayoutShift <= 0.1 ? colors.green :
                       stats.cumulativeLayoutShift <= 0.25 ? colors.yellow : colors.red;
      const fcpColor = getTimeColor(stats.firstContentfulPaint, { good: 1800, ok: 3000 });

      console.log(
        `${rank} ${page.domain.padEnd(22)} | ` +
        `${lcpColor}${formatTime(stats.largestContentfulPaint).padEnd(7)}${colors.reset} | ` +
        `${tbtColor}${formatTime(stats.totalBlockingTime).padEnd(6)}${colors.reset} | ` +
        `${clsColor}${stats.cumulativeLayoutShift.toFixed(3).padEnd(6)}${colors.reset} | ` +
        `${fcpColor}${formatTime(stats.firstContentfulPaint)}${colors.reset}`
      );
    });
  }

  // Print thresholds reference
  console.log(`\n${colors.dim}Thresholds: LCP: <2.5s (good), <4s (ok) | TBT: <200ms (good), <600ms (ok) | CLS: <0.1 (good), <0.25 (ok) | FCP: <1.8s (good), <3s (ok)${colors.reset}`);
}

/**
 * Print Lighthouse scores if available
 */
function printLighthouseScores(pages, lighthouseData) {
  if (Object.keys(lighthouseData).length === 0) return;

  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}                    LIGHTHOUSE SCORES${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  // Group by page type
  for (const pageType of ['home', 'search', 'article']) {
    const pagesOfType = pages.filter(p => p.pageType === pageType && lighthouseData[p.url]);
    if (pagesOfType.length === 0) continue;

    console.log(`\n${colors.bright}${colors.cyan}▶ ${pageType.toUpperCase()} PAGES - Lighthouse Scores${colors.reset}`);
    console.log(`${colors.dim}─────────────────────────────────────────────────────────────${colors.reset}`);

    console.log(`\n${colors.bright}Site                    | Perf | A11y | Best | SEO  | PWA ${colors.reset}`);
    console.log(`${colors.dim}─────────────────────────────────────────────────────────────${colors.reset}`);

    // Sort by performance score
    pagesOfType.sort((a, b) => {
      const scoreA = lighthouseData[a.url]?.scores?.performance || 0;
      const scoreB = lighthouseData[b.url]?.scores?.performance || 0;
      return scoreB - scoreA;
    });

    pagesOfType.forEach((page, index) => {
      const scores = lighthouseData[page.url]?.scores;
      if (!scores) return;

      const rank = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';

      const perfColor = getScoreColor(scores.performance);
      const a11yColor = getScoreColor(scores.accessibility);
      const bpColor = getScoreColor(scores.bestPractices);
      const seoColor = getScoreColor(scores.seo);
      const pwaColor = getScoreColor(scores.pwa);

      console.log(
        `${rank} ${page.domain.padEnd(22)} | ` +
        `${perfColor}${Math.round(scores.performance).toString().padStart(4)}${colors.reset} | ` +
        `${a11yColor}${Math.round(scores.accessibility).toString().padStart(4)}${colors.reset} | ` +
        `${bpColor}${Math.round(scores.bestPractices).toString().padStart(4)}${colors.reset} | ` +
        `${seoColor}${Math.round(scores.seo).toString().padStart(4)}${colors.reset} | ` +
        `${pwaColor}${Math.round(scores.pwa).toString().padStart(3)}${colors.reset}`
      );
    });
  }

  console.log(`\n${colors.dim}Scores: 90-100 (good), 50-89 (needs improvement), 0-49 (poor)${colors.reset}`);
}

/**
 * Export to CSV
 */
function exportToCsv(pages, lighthouseData, outputPath) {
  const csvLines = [];

  // Header
  const headers = [
    'Domain',
    'Page Type',
    'URL',
    'Fully Loaded (ms)',
    'Speed Index (ms)',
    'LCP (ms)',
    'FCP (ms)',
    'TBT (ms)',
    'CLS',
    'Requests',
    'Transfer Size (bytes)',
    'Content Size (bytes)',
    'JS Size (bytes)',
    'Lighthouse Performance',
    'Lighthouse Accessibility',
    'Lighthouse Best Practices',
    'Lighthouse SEO',
    'Lighthouse PWA'
  ];
  csvLines.push(headers.join(','));

  // Data rows
  pages.forEach(page => {
    const stats = page.statistics;
    const lighthouse = lighthouseData[page.url]?.scores || {};

    const row = [
      `"${page.domain}"`,
      page.pageType,
      `"${page.url}"`,
      stats.fullyLoaded,
      stats.speedIndex,
      stats.largestContentfulPaint,
      stats.firstContentfulPaint,
      stats.totalBlockingTime,
      stats.cumulativeLayoutShift,
      stats.requests,
      stats.transferSize,
      stats.contentSize,
      stats.totalJavaScriptSize,
      lighthouse.performance || '',
      lighthouse.accessibility || '',
      lighthouse.bestPractices || '',
      lighthouse.seo || '',
      lighthouse.pwa || ''
    ];
    csvLines.push(row.join(','));
  });

  fs.writeFileSync(outputPath, csvLines.join('\n'));
  console.log(`\n${colors.green}✓ CSV export saved to: ${outputPath}${colors.reset}`);
}

/**
 * Export to JSON
 */
function exportToJson(pages, lighthouseData, outputPath) {
  const data = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPages: pages.length,
      pageTypes: {
        home: pages.filter(p => p.pageType === 'home').length,
        search: pages.filter(p => p.pageType === 'search').length,
        article: pages.filter(p => p.pageType === 'article').length,
      }
    },
    pages: pages.map(page => ({
      ...page,
      lighthouse: lighthouseData[page.url] || null
    }))
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`${colors.green}✓ JSON export saved to: ${outputPath}${colors.reset}`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(`${colors.red}Usage: node analyze-results.js <path-to-sitespeed-results-directory>${colors.reset}`);
    process.exit(1);
  }

  const resultsDir = args[0];

  if (!fs.existsSync(resultsDir)) {
    console.error(`${colors.red}Error: Directory not found: ${resultsDir}${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.bright}${colors.blue}Analyzing sitespeed.io results from: ${resultsDir}${colors.reset}\n`);

  // Load data
  const pages = loadBrowsertimeData(resultsDir);
  const lighthouseData = loadLighthouseData(resultsDir);

  if (pages.length === 0) {
    console.error(`${colors.red}Error: No page data found in results directory${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}✓ Loaded data for ${pages.length} pages${colors.reset}`);
  if (Object.keys(lighthouseData).length > 0) {
    console.log(`${colors.green}✓ Loaded Lighthouse data for ${Object.keys(lighthouseData).length} pages${colors.reset}`);
  }

  // Print reports
  printComparisonTable(pages);
  printCoreWebVitals(pages);
  printLighthouseScores(pages, lighthouseData);

  // Export data
  const exportDir = path.join(resultsDir, 'analysis');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  exportToCsv(pages, lighthouseData, path.join(exportDir, 'comparison.csv'));
  exportToJson(pages, lighthouseData, path.join(exportDir, 'comparison.json'));

  console.log(`\n${colors.bright}${colors.green}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green}                   ANALYSIS COMPLETE!${colors.reset}`);
  console.log(`${colors.bright}${colors.green}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
}

// Run main function
main();
