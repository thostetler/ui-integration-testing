#!/usr/bin/env node

/**
 * Sitespeed.io Competitor Comparison Chart Generator
 *
 * Extracts performance data from sitespeed.io results and generates
 * interactive comparison charts grouped by page type (home, search, article)
 */

const fs = require('fs');
const path = require('path');

// Competitor configuration (matches competitors.ts)
const competitors = {
  'arxiv.org': { name: 'arXiv', color: '#b31b1b' },
  'inspirehep.net': { name: 'INSPIRE-HEP', color: '#1e40af' },
  'www.semanticscholar.org': { name: 'Semantic Scholar', color: '#7c3aed' },
  'scholar.google.com': { name: 'Google Scholar', color: '#4285f4' },
  'scixplorer.org': { name: 'SciX', color: '#16a34a' },
  'pubs.geoscienceworld.org': { name: 'GeoScience World', color: '#ea580c' },
  'pubmed.ncbi.nlm.nih.gov': { name: 'PubMed', color: '#0891b2' }
};

// Determine page type from URL
function getPageType(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('/search') || urlLower.includes('?q=') || urlLower.includes('query=') || urlLower.includes('?term=')) {
    return 'search';
  } else if (urlLower.includes('/abs/') || urlLower.includes('/article') || urlLower.includes('/literature/') || urlLower.includes('/paper/')) {
    return 'article';
  }
  return 'home';
}

// Extract domain from URL (keep www. prefix for directory matching)
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

// Get display name for domain (matches without www. prefix)
function getCompetitorInfo(domain) {
  // Try exact match first
  if (competitors[domain]) return competitors[domain];
  // Try without www. prefix
  const withoutWww = domain.replace('www.', '');
  if (competitors[withoutWww]) return competitors[withoutWww];
  // Return default
  return { name: domain, color: '#666666' };
}

// Parse sitespeed.io result directory
function parseResults(resultsDir) {
  const dataDir = path.join(resultsDir, 'data');
  const urlsFile = path.join(resultsDir, 'urls.txt');

  if (!fs.existsSync(urlsFile)) {
    throw new Error(`URLs file not found: ${urlsFile}`);
  }

  // Read URLs
  const urls = fs.readFileSync(urlsFile, 'utf8')
    .split('\n')
    .filter(url => url.trim())
    .map(url => url.trim());

  console.log(`Found ${urls.length} URLs to process`);

  // Read pages directory to get individual page data
  const pagesDir = path.join(resultsDir, 'pages');
  const pageData = {};

  urls.forEach(url => {
    const domain = getDomain(url);
    const pageType = getPageType(url);

    // Find the corresponding page data directory
    const pageDirName = domain.replace(/\./g, '_');
    const pagePath = path.join(pagesDir, pageDirName);

    if (!fs.existsSync(pagePath)) {
      console.warn(`Warning: No page directory found for ${domain}`);
      return;
    }

    // Look for data subdirectories
    const pageDataPath = path.join(pagePath, 'data');

    // Try different path structures based on page type
    let dataPaths = [
      pageDataPath,
      path.join(pagePath, 'search', 'data'),
      path.join(pagePath, 'abs', '**', 'data')
    ];

    // Find browsertime.pageSummary.json files
    const findBrowsertimeData = (dir) => {
      if (!fs.existsSync(dir)) return null;

      const files = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
      const summaryFile = files.find(f => f.isFile() && f.name === 'browsertime.pageSummary.json');

      if (summaryFile) {
        const summaryPath = path.join(summaryFile.path || dir, summaryFile.name);
        try {
          const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
          return data;
        } catch (e) {
          console.warn(`Error reading ${summaryPath}:`, e.message);
        }
      }
      return null;
    };

    // Try to find data from various possible locations
    let data = null;
    for (const dataPath of dataPaths) {
      data = findBrowsertimeData(dataPath);
      if (data) break;
    }

    if (data) {
      if (!pageData[pageType]) pageData[pageType] = [];
      const competitorInfo = getCompetitorInfo(domain);
      pageData[pageType].push({
        url,
        domain,
        site: competitorInfo.name,
        color: competitorInfo.color,
        data
      });
    }
  });

  return pageData;
}

// Generate HTML with Chart.js visualizations
function generateHTML(pageData, outputPath) {
  const metrics = [
    { key: 'statistics.timings.fullyLoaded', label: 'Fully Loaded (ms)', unit: 'ms' },
    { key: 'statistics.timings.largestContentfulPaint.renderTime', label: 'LCP (ms)', unit: 'ms' },
    { key: 'statistics.visualMetrics.SpeedIndex', label: 'Speed Index (ms)', unit: 'ms' },
    { key: 'statistics.googleWebVitals.totalBlockingTime', label: 'Total Blocking Time (ms)', unit: 'ms' },
    { key: 'statistics.googleWebVitals.cumulativeLayoutShift', label: 'Cumulative Layout Shift', unit: '' },
    { key: 'statistics.pageinfo.documentSize.transferSize', label: 'Transfer Size (KB)', unit: 'KB', divisor: 1024 },
    { key: 'statistics.pageinfo.resources.count', label: 'Request Count', unit: '' }
  ];

  // Get value from nested object path
  const getValue = (obj, path) => {
    const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
    return value?.median !== undefined ? value.median : value;
  };

  // Generate chart data for each metric and page type
  const generateChartData = (pageType, metric) => {
    const pages = pageData[pageType] || [];
    const sites = [...new Set(pages.map(p => p.site))].sort();

    const data = sites.map(site => {
      const page = pages.find(p => p.site === site);
      if (!page) return null;

      let value = getValue(page.data, metric.key);
      if (value && metric.divisor) value = value / metric.divisor;
      return value;
    });

    const colors = sites.map(site => {
      const page = pages.find(p => p.site === site);
      return page?.color || '#666666';
    });

    return { labels: sites, data, colors };
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Competitor Performance Comparison</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .header {
      background: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-bottom: 10px; }
    .subtitle { color: #666; font-size: 16px; }
    .page-type {
      background: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .page-type h2 {
      color: #0095d2;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #0095d2;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 30px;
      margin-top: 20px;
    }
    .chart-container {
      background: #fafafa;
      padding: 20px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    .chart-title {
      font-weight: 600;
      margin-bottom: 15px;
      color: #555;
      text-align: center;
    }
    canvas { max-height: 400px !important; }
    .note {
      background: #e3f2fd;
      padding: 15px;
      margin-top: 20px;
      border-radius: 6px;
      border-left: 4px solid #2196f3;
      font-size: 14px;
      color: #1565c0;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .summary-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #0095d2;
    }
    .summary-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .summary-value { font-size: 24px; font-weight: 600; color: #333; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Competitor Performance Comparison</h1>
    <p class="subtitle">Comprehensive performance metrics grouped by page type</p>
    <div class="summary">
      <div class="summary-card">
        <div class="summary-label">Page Types</div>
        <div class="summary-value">${Object.keys(pageData).length}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Total Pages Tested</div>
        <div class="summary-value">${Object.values(pageData).reduce((sum, pages) => sum + pages.length, 0)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Competitors</div>
        <div class="summary-value">${Object.keys(competitors).length}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Metrics</div>
        <div class="summary-value">${metrics.length}</div>
      </div>
    </div>
  </div>

  ${Object.keys(pageData).sort().map(pageType => {
    const pageTypeName = pageType.charAt(0).toUpperCase() + pageType.slice(1);
    const pagesCount = pageData[pageType].length;

    return `
  <div class="page-type">
    <h2>📄 ${pageTypeName} Pages <span style="font-weight: normal; font-size: 16px; color: #666;">(${pagesCount} sites)</span></h2>
    <div class="charts-grid">
      ${metrics.map((metric, idx) => {
        const chartData = generateChartData(pageType, metric);
        const chartId = `chart_${pageType}_${idx}`;

        return `
      <div class="chart-container">
        <div class="chart-title">${metric.label}</div>
        <canvas id="${chartId}"></canvas>
        <script>
          new Chart(document.getElementById('${chartId}'), {
            type: 'bar',
            data: {
              labels: ${JSON.stringify(chartData.labels)},
              datasets: [{
                label: '${metric.label}',
                data: ${JSON.stringify(chartData.data)},
                backgroundColor: ${JSON.stringify(chartData.colors)},
                borderColor: ${JSON.stringify(chartData.colors)},
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.parsed.y;
                      return value !== null ? \`\${value.toFixed(2)} ${metric.unit}\` : 'N/A';
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: '${metric.unit}'
                  }
                },
                x: {
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45
                  }
                }
              }
            }
          });
        </script>
      </div>
        `;
      }).join('\n')}
    </div>
    <div class="note">
      📊 Lower values are better for all time-based metrics (ms). For CLS, lower is better (target < 0.1).
    </div>
  </div>
    `;
  }).join('\n')}

  <div class="note" style="background: #fff3cd; border-color: #ffc107; color: #856404;">
    <strong>Note:</strong> This comparison uses median values from multiple test runs.
    Results may vary based on network conditions, server performance, and other factors.
  </div>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
  console.log(`\n✅ Chart generated successfully: ${outputPath}`);
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node generate-charts.js <sitespeed-results-directory>');
    console.error('Example: node generate-charts.js ./sitespeed-results/20251114_212547');
    process.exit(1);
  }

  const resultsDir = args[0];

  if (!fs.existsSync(resultsDir)) {
    console.error(`Error: Directory not found: ${resultsDir}`);
    process.exit(1);
  }

  console.log(`📊 Generating comparison charts from: ${resultsDir}\n`);

  try {
    const pageData = parseResults(resultsDir);

    console.log('\nData summary:');
    Object.keys(pageData).forEach(pageType => {
      console.log(`  ${pageType}: ${pageData[pageType].length} pages`);
    });

    const outputPath = path.join(resultsDir, 'competitor-comparison.html');
    generateHTML(pageData, outputPath);

    console.log(`\n🎉 Open the file in your browser to view the charts!`);
    console.log(`   file://${path.resolve(outputPath)}`);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

main();
