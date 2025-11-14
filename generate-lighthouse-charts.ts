/**
 * Generates an HTML page with charts comparing performance results across competitors
 */

import * as fs from 'fs';
import * as path from 'path';

interface PerformanceResult {
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

function generateHTML(searchResults: PerformanceResult[], articleResults: PerformanceResult[]) {
  // Group results by site name
  const groupBySite = (results: PerformanceResult[]) => {
    return results.reduce(
      (acc, result) => {
        if (!acc[result.siteName]) {
          acc[result.siteName] = [];
        }
        acc[result.siteName].push(result);
        return acc;
      },
      {} as Record<string, PerformanceResult[]>,
    );
  };

  const searchBySite = groupBySite(searchResults);
  const articleBySite = groupBySite(articleResults);

  const allSites = Array.from(
    new Set([...Object.keys(searchBySite), ...Object.keys(articleBySite)]),
  ).sort();

  // Helper to get color for site (highlight SciX)
  const getColor = (siteName: string, alpha: number = 1) => {
    if (siteName.includes('SciX')) {
      return `rgba(255, 99, 132, ${alpha})`; // Red for SciX
    }
    const colors = [
      `rgba(54, 162, 235, ${alpha})`, // Blue
      `rgba(75, 192, 192, ${alpha})`, // Teal
      `rgba(153, 102, 255, ${alpha})`, // Purple
      `rgba(255, 159, 64, ${alpha})`, // Orange
      `rgba(255, 205, 86, ${alpha})`, // Yellow
      `rgba(201, 203, 207, ${alpha})`, // Gray
      `rgba(83, 102, 255, ${alpha})`, // Indigo
    ];
    const index = allSites.indexOf(siteName) % colors.length;
    return colors[index];
  };

  const getBorderWidth = (siteName: string) => {
    return siteName.includes('SciX') ? 3 : 2;
  };

  // Generate datasets for each metric
  const createChartData = (
    results: Record<string, PerformanceResult[]>,
    metricGetter: (r: PerformanceResult) => number | undefined,
    label: string,
  ) => {
    return {
      labels: allSites,
      datasets: allSites.map((siteName) => {
        const siteResults = results[siteName] || [];
        const values = siteResults.map(metricGetter).filter((v) => v !== undefined) as number[];

        return {
          label: siteName,
          data: values.length > 0 ? values : [0],
          backgroundColor: getColor(siteName, 0.6),
          borderColor: getColor(siteName, 1),
          borderWidth: getBorderWidth(siteName),
        };
      }),
    };
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Competitor Analysis</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    h1 {
      text-align: center;
      color: #667eea;
      margin-bottom: 10px;
      font-size: 2.5rem;
      font-weight: 700;
    }

    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 40px;
      font-size: 1.1rem;
    }

    .scix-highlight {
      display: inline-block;
      background: rgba(255, 99, 132, 0.1);
      color: #e63946;
      padding: 4px 12px;
      border-radius: 6px;
      font-weight: 600;
      border: 2px solid rgba(255, 99, 132, 0.3);
    }

    .page-section {
      margin-bottom: 60px;
    }

    .page-section h2 {
      color: #667eea;
      margin-bottom: 30px;
      font-size: 2rem;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }

    .chart-container {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .chart-container h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.3rem;
      text-align: center;
    }

    .chart-wrapper {
      position: relative;
      height: 350px;
    }

    .legend-note {
      text-align: center;
      margin-top: 20px;
      padding: 15px;
      background: rgba(255, 99, 132, 0.1);
      border-radius: 8px;
      color: #666;
      font-size: 0.95rem;
    }

    .stats-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .stat-card .label {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-bottom: 8px;
    }

    .stat-card .value {
      font-size: 2rem;
      font-weight: 700;
    }

    .timestamp {
      text-align: center;
      color: #999;
      font-size: 0.9rem;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Performance Competitor Analysis</h1>
    <p class="subtitle">Performance benchmarking across academic search platforms</p>

    <div class="legend-note">
      <strong>Note:</strong> <span class="scix-highlight">SciX (NASA SciX Explorer)</span> is highlighted in red across all charts as the primary comparison baseline.
    </div>

    ${searchResults.length > 0 ? generatePageSection('Search Pages', searchBySite, allSites, getColor, getBorderWidth) : ''}
    ${articleResults.length > 0 ? generatePageSection('Article Pages', articleBySite, allSites, getColor, getBorderWidth) : ''}

    <div class="timestamp">
      Generated on ${new Date().toLocaleString()}
    </div>
  </div>

  <script>
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
    Chart.defaults.font.size = 12;

    ${generateChartScripts(searchBySite, articleBySite, allSites, getColor, getBorderWidth)}
  </script>
</body>
</html>`;

  return html;
}

function generatePageSection(
  title: string,
  resultsBySite: Record<string, PerformanceResult[]>,
  allSites: string[],
  getColor: (site: string, alpha: number) => string,
  getBorderWidth: (site: string) => number,
) {
  const prefix = title.toLowerCase().replace(' ', '-');

  return `
    <div class="page-section">
      <h2>📄 ${title}</h2>

      <div class="metrics-grid">
        <div class="chart-container">
          <h3>Performance Score</h3>
          <div class="chart-wrapper">
            <canvas id="${prefix}-performance-score"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <h3>Largest Contentful Paint (LCP)</h3>
          <div class="chart-wrapper">
            <canvas id="${prefix}-lcp"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <h3>Total Blocking Time (TBT)</h3>
          <div class="chart-wrapper">
            <canvas id="${prefix}-tbt"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <h3>Cumulative Layout Shift (CLS)</h3>
          <div class="chart-wrapper">
            <canvas id="${prefix}-cls"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <h3>Time to First Byte (TTFB)</h3>
          <div class="chart-wrapper">
            <canvas id="${prefix}-ttfb"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <h3>Page Weight (KB)</h3>
          <div class="chart-wrapper">
            <canvas id="${prefix}-page-weight"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <h3>Speed Index</h3>
          <div class="chart-wrapper">
            <canvas id="${prefix}-speed-index"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <h3>Time to Interactive (TTI)</h3>
          <div class="chart-wrapper">
            <canvas id="${prefix}-tti"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateChartScripts(
  searchBySite: Record<string, PerformanceResult[]>,
  articleBySite: Record<string, PerformanceResult[]>,
  allSites: string[],
  getColor: (site: string, alpha: number) => string,
  getBorderWidth: (site: string) => number,
) {
  const createChartScript = (
    canvasId: string,
    resultsBySite: Record<string, PerformanceResult[]>,
    metricGetter: (r: PerformanceResult) => number,
    title: string,
    unit: string = '',
    decimals: number = 0,
  ) => {
    // Calculate average for each site
    const data = allSites.map((siteName) => {
      const results = resultsBySite[siteName] || [];
      if (results.length === 0) return 0;
      const values = results.map(metricGetter).filter((v) => v !== undefined && v !== null);
      if (values.length === 0) return 0;
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    });

    const backgroundColors = allSites.map((site) => getColor(site, 0.6));
    const borderColors = allSites.map((site) => getColor(site, 1));
    const borderWidths = allSites.map((site) => getBorderWidth(site));

    return `
    new Chart(document.getElementById('${canvasId}'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(allSites)},
        datasets: [{
          label: '${title}',
          data: ${JSON.stringify(data)},
          backgroundColor: ${JSON.stringify(backgroundColors)},
          borderColor: ${JSON.stringify(borderColors)},
          borderWidth: ${JSON.stringify(borderWidths)}
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed.y.toFixed(${decimals}) + '${unit}';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '${title}'
            }
          }
        }
      }
    });`;
  };

  let scripts = '';

  if (Object.keys(searchBySite).length > 0) {
    scripts += createChartScript(
      'search-pages-performance-score',
      searchBySite,
      (r) => r.scores.performance * 100,
      'Performance Score',
      '',
      1,
    );
    scripts += createChartScript(
      'search-pages-lcp',
      searchBySite,
      (r) => r.metrics.largestContentfulPaint,
      'LCP (ms)',
      'ms',
      0,
    );
    scripts += createChartScript(
      'search-pages-tbt',
      searchBySite,
      (r) => r.metrics.totalBlockingTime,
      'TBT (ms)',
      'ms',
      0,
    );
    scripts += createChartScript(
      'search-pages-cls',
      searchBySite,
      (r) => r.metrics.cumulativeLayoutShift,
      'CLS Score',
      '',
      3,
    );
    scripts += createChartScript(
      'search-pages-ttfb',
      searchBySite,
      (r) => r.metrics.timeToFirstByte || 0,
      'TTFB (ms)',
      'ms',
      0,
    );
    scripts += createChartScript(
      'search-pages-page-weight',
      searchBySite,
      (r) => (r.metrics.totalByteWeight || 0) / 1024,
      'Page Weight (KB)',
      'KB',
      1,
    );
    scripts += createChartScript(
      'search-pages-speed-index',
      searchBySite,
      (r) => r.metrics.speedIndex,
      'Speed Index (ms)',
      'ms',
      0,
    );
    scripts += createChartScript(
      'search-pages-tti',
      searchBySite,
      (r) => r.metrics.timeToInteractive,
      'TTI (ms)',
      'ms',
      0,
    );
  }

  if (Object.keys(articleBySite).length > 0) {
    scripts += createChartScript(
      'article-pages-performance-score',
      articleBySite,
      (r) => r.scores.performance * 100,
      'Performance Score',
      '',
      1,
    );
    scripts += createChartScript(
      'article-pages-lcp',
      articleBySite,
      (r) => r.metrics.largestContentfulPaint,
      'LCP (ms)',
      'ms',
      0,
    );
    scripts += createChartScript(
      'article-pages-tbt',
      articleBySite,
      (r) => r.metrics.totalBlockingTime,
      'TBT (ms)',
      'ms',
      0,
    );
    scripts += createChartScript(
      'article-pages-cls',
      articleBySite,
      (r) => r.metrics.cumulativeLayoutShift,
      'CLS Score',
      '',
      3,
    );
    scripts += createChartScript(
      'article-pages-ttfb',
      articleBySite,
      (r) => r.metrics.timeToFirstByte || 0,
      'TTFB (ms)',
      'ms',
      0,
    );
    scripts += createChartScript(
      'article-pages-page-weight',
      articleBySite,
      (r) => (r.metrics.totalByteWeight || 0) / 1024,
      'Page Weight (KB)',
      'KB',
      1,
    );
    scripts += createChartScript(
      'article-pages-speed-index',
      articleBySite,
      (r) => r.metrics.speedIndex,
      'Speed Index (ms)',
      'ms',
      0,
    );
    scripts += createChartScript(
      'article-pages-tti',
      articleBySite,
      (r) => r.metrics.timeToInteractive,
      'TTI (ms)',
      'ms',
      0,
    );
  }

  return scripts;
}

function main() {
  const resultsDir = path.join(process.cwd(), 'performance-results');

  if (!fs.existsSync(resultsDir)) {
    console.error('No results directory found. Please run the tests first.');
    process.exit(1);
  }

  const searchFile = findLatestResults(resultsDir, 'search-pages-raw');
  const articleFile = findLatestResults(resultsDir, 'article-pages-raw');

  if (!searchFile && !articleFile) {
    console.error('No raw results found. Please run the tests first.');
    process.exit(1);
  }

  const searchResults: PerformanceResult[] = searchFile
    ? JSON.parse(fs.readFileSync(searchFile, 'utf-8'))
    : [];
  const articleResults: PerformanceResult[] = articleFile
    ? JSON.parse(fs.readFileSync(articleFile, 'utf-8'))
    : [];

  console.log(`\n📊 Generating charts from:`);
  if (searchFile) console.log(`  - Search results: ${path.basename(searchFile)}`);
  if (articleFile) console.log(`  - Article results: ${path.basename(articleFile)}`);

  const html = generateHTML(searchResults, articleResults);

  const outputPath = path.join(resultsDir, 'performance-charts.html');
  fs.writeFileSync(outputPath, html);

  console.log(`\n✅ Charts generated successfully!`);
  console.log(`📁 Open: ${outputPath}`);
  console.log(`\nYou can open this file in your browser to view the interactive charts.\n`);
}

main();
