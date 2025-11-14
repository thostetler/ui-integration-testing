# Competitor Lighthouse Performance Tests

This directory contains Lighthouse performance tests for competitor academic search platforms. The tests measure Core Web Vitals and other performance metrics to establish a baseline for comparison.

## ⚠️ Environment Requirements

**IMPORTANT: These tests are designed to run locally on your development machine.**

Lighthouse requires significant system resources and stable browser control. In containerized/CI environments, you may encounter:
- Browser crashes ("Page crashed" errors)
- Resource exhaustion
- Timeout issues
- Port conflicts

**Recommended setup:**
- Run tests on your local machine (Mac, Linux, or Windows with WSL)
- Ensure Chrome/Chromium is properly installed
- Have at least 4GB RAM available
- Close other resource-intensive applications

**Configuration optimizations:**
- Tests run sequentially (1 worker) to avoid port 9222 conflicts
- 3-minute timeout per test
- Performance-only audits for speed
- No network throttling in controlled environment

## Overview

The test suite uses [playwright-lighthouse](https://github.com/abhinaba-ghosh/playwright-lighthouse) to run Lighthouse audits on competitor sites, testing both search pages and article/detail pages.

### Competitors Tested

- **arXiv** - Physics preprint archive
- **INSPIRE-HEP** - High-energy physics literature database
- **Semantic Scholar** - AI-powered research tool
- **Google Scholar** - Academic search engine (search only)
- **SciX** - NASA's modernized successor to ADS
- **GeoScience World** - Geoscience literature platform
- **PubMed** - Biomedical literature database

## Files

- `competitors-config.ts` - Configuration for competitor sites and Lighthouse settings
- `lighthouse-utils.ts` - Utility functions for running audits and aggregating results
- `search-lighthouse.spec.ts` - Tests for search pages
- `article-lighthouse.spec.ts` - Tests for article/detail pages

## Running the Tests

### Run all competitor tests

```bash
pnpm test:competitors
```

### Run only search page tests

```bash
pnpm test:competitors:search
```

### Run only article page tests

```bash
pnpm test:competitors:article
```

### Analyze results

After running the tests, analyze and compare results:

```bash
pnpm analyze:competitors
```

### Generate interactive charts

Generate an HTML page with interactive charts visualizing all metrics:

```bash
pnpm charts:competitors
```

This creates `lighthouse-results/lighthouse-charts.html` with:
- Bar charts for all collected metrics (Performance Score, LCP, TBT, CLS, TTFB, Page Weight, etc.)
- Separate sections for search and article pages
- **SciX (NASA SciX Explorer) highlighted in red** across all charts as the primary comparison baseline
- Responsive design with gradient styling
- Averages calculated from all test runs

Open the generated HTML file in your browser to explore the interactive charts.

## Test Configuration

The test configuration in `competitors-config.ts` includes:

- **Runs per URL**: 3 (configurable via `lighthouseConfig.runsPerUrl`)
- **Lighthouse categories**: Performance, Accessibility, Best Practices, SEO
- **Throttling**: Simulated 3G connection with 4x CPU slowdown (configurable)
- **Timeout**: 60 seconds per audit

### Customizing the configuration

To adjust test parameters, edit `tests/competitors/competitors-config.ts`:

```typescript
export const lighthouseConfig = {
  runsPerUrl: 3, // Change number of runs
  lighthouseOptions: {
    // Adjust Lighthouse settings
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
  },
  timeout: 60000,
};
```

## Metrics Collected

### Core Web Vitals

- **FCP (First Contentful Paint)** - Time until first content is rendered
- **LCP (Largest Contentful Paint)** - Time until largest content element is rendered
- **CLS (Cumulative Layout Shift)** - Visual stability metric
- **INP (Interaction to Next Paint)** - Responsiveness to user interactions (may not always be available)

### Additional Metrics

- **TBT (Total Blocking Time)** - Time the main thread was blocked
- **Speed Index** - How quickly content is visually displayed
- **TTI (Time to Interactive)** - Time until page is fully interactive
- **Max Potential FID** - Estimated First Input Delay
- **TTFB (Time to First Byte)** - Server response time
- **Page Weight** - Total size of all resources downloaded (HTML, CSS, JS, images, fonts, etc.) in kilobytes

> **Note on INP**: INP (Interaction to Next Paint) replaced FID as an official Core Web Vital in March 2024. However, INP requires actual user interactions during page load. Lighthouse simulates some interactions, but INP may not always be measurable for all pages. When INP is not available, it will show as "N/A" in the results.

### Lighthouse Scores

Each category is scored 0-100:

- **Performance** - Page load performance
- **Accessibility** - Accessibility best practices
- **Best Practices** - Web development best practices
- **SEO** - Search engine optimization

## Results

Results are saved to `lighthouse-results/` directory:

### Raw Results

- `search-pages-raw-TIMESTAMP.json` - All individual test runs for search pages
- `article-pages-raw-TIMESTAMP.json` - All individual test runs for article pages

### Aggregated Results

- `search-pages-aggregated-TIMESTAMP.json` - Statistical analysis (mean, median, std dev) for search pages
- `article-pages-aggregated-TIMESTAMP.json` - Statistical analysis for article pages

### Result Format

Each aggregated result includes:

```json
{
  "siteName": "arXiv",
  "pageType": "search",
  "numberOfRuns": 3,
  "scores": {
    "performance": {
      "mean": 0.85,
      "median": 0.86,
      "stdDev": 0.02,
      "min": 0.83,
      "max": 0.87
    }
    // ... other scores
  },
  "metrics": {
    "largestContentfulPaint": {
      "mean": 2456.3,
      "median": 2450.0,
      "stdDev": 45.2,
      "min": 2410,
      "max": 2500
    }
    // ... other metrics
  }
}
```

## Notes

- Tests automatically retry up to 2 times on failure to handle transient network issues
- Cookie consent popups are automatically detected and accepted when possible
- User interactions are simulated to help trigger INP measurements
- A 3-second delay is added between test runs to prevent rate limiting
- Each test suite prints a summary table after completion
- Individual test results are attached to Playwright test reports
- Google Scholar only has search page tests (no dedicated article detail pages)

## Multiple Test Runs

### How results are stored

Each time you run the tests, new result files are created with timestamps:

```
lighthouse-results/
├── search-pages-raw-2024-11-14T10-30-00.json
├── search-pages-aggregated-2024-11-14T10-30-00.json
├── article-pages-raw-2024-11-14T10-30-00.json
├── article-pages-aggregated-2024-11-14T10-30-00.json
└── lighthouse-charts.html (updated each time)
```

### Key points

- **Results don't accumulate** - Each test run creates separate timestamped files
- **Analysis and charts use the latest results** - `analyze:competitors` and `charts:competitors` automatically use the most recent files
- **Historical data is preserved** - Previous test runs remain in the directory for comparison
- **No conflicts** - Running tests multiple times won't mess up your data; each run is independent

### Comparing across runs

To compare results across multiple test runs:
1. Run tests at different times
2. Compare the timestamped JSON files manually
3. Each file contains complete data for that specific run

## Adding New Competitors

To add a new competitor site:

1. Edit `competitors-config.ts` and add to the `competitors` array:

```typescript
{
  name: 'New Site',
  url: 'https://example.com',
  search_url: 'https://example.com/search?q=black+holes',
  article_url: 'https://example.com/article/12345',
  note: 'Optional note about the site',
}
```

2. Run the tests - the new site will be automatically included

## Troubleshooting

### Chrome debugging port conflict

If you see port 9222 errors, another Chrome instance may be using the debugging port. Close other Chrome instances or modify the port in `playwright.config.ts`.

**Note**: The competitors project is configured to run with `workers: 1` (serial execution) because all Lighthouse tests share the same Chrome debugging port (9222). Running tests in parallel would cause port conflicts and timeouts.

### Timeout errors

Some sites may be slow or have long load times. Increase the timeout in `competitors-config.ts`:

```typescript
timeout: 120000, // 2 minutes
```

Tests automatically retry 2 times on failure, but if a site consistently times out, you may need to increase the timeout.

### Missing INP metrics

INP (Interaction to Next Paint) requires user interactions during page load. If INP shows as "N/A" in results:

- This is normal for pages with minimal interactive elements
- The test does simulate basic interactions (mouse movement, hover)
- Consider the page may load so fast that no meaningful interactions occur
- INP is most useful for slower, more interactive pages

### Rate limiting

If tests fail with connection errors or 429 status codes:

- Sites may be rate-limiting automated requests
- Tests include 3-second delays between runs
- Consider reducing `runsPerUrl` or adding longer delays
- Some sites may block automated browsers entirely
