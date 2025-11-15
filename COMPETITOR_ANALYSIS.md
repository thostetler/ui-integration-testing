# Competitor Performance Analysis

Comprehensive performance testing and comparison of competitor academic search platforms using sitespeed.io.

## Overview

This toolkit provides automated performance testing and comparison of SciX against competitor platforms including arXiv, INSPIRE-HEP, Semantic Scholar, Google Scholar, GeoScience World, and PubMed.

## Features

- **Comprehensive Metrics**: Collects 40+ performance metrics including Core Web Vitals, load times, and resource metrics
- **Lighthouse Integration**: Full Lighthouse audits for Performance, Accessibility, SEO, and PWA scores
- **Multiple Iterations**: Runs 7 test iterations per URL for statistical accuracy
- **Visual Analysis**: Screenshots, video recordings, and waterfall charts
- **Automated Comparison**: Side-by-side comparison tables and rankings
- **Export Formats**: HTML reports, JSON data, and CSV exports

## Quick Start

### Prerequisites

- Docker installed and running
- At least 4GB of free disk space for results
- Stable internet connection

### Basic Usage

Run the basic performance analysis:

```bash
./run-competitor-analysis.sh
```

Run with Lighthouse (recommended for comprehensive analysis):

```bash
./run-competitor-analysis-lighthouse.sh
```

### Analyzing Results

After the tests complete, generate visual comparison charts:

```bash
# Generate interactive charts grouped by page type
node generate-charts.js ./sitespeed-results/<timestamp>

# Open the comparison charts
open ./sitespeed-results/<timestamp>/competitor-comparison.html
```

Or run the terminal-based analysis:

```bash
node analyze-results.js ./sitespeed-results/<timestamp>
```

Or view the detailed HTML reports directly:

```bash
open ./sitespeed-results/<timestamp>/index.html
```

## Competitor Sites Tested

The analysis tests three page types for each competitor:

### 1. **Home Pages**
Landing pages and main entry points

### 2. **Search Results Pages**
Search query: "black holes" (common across all platforms)

### 3. **Article Detail Pages**
Representative article pages where available

### Sites Included:

- **arXiv** - Open access preprint repository
- **INSPIRE-HEP** - High energy physics information system
- **Semantic Scholar** - AI-powered research tool
- **Google Scholar** - Academic search engine
- **SciX** - NASA's scientific explorer (our platform)
- **GeoScience World** - Earth science publications
- **PubMed** - Biomedical literature database

## Metrics Collected

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: Time to render largest content element
- **FCP (First Contentful Paint)**: Time to first content render
- **TBT (Total Blocking Time)**: Main thread blocking time
- **CLS (Cumulative Layout Shift)**: Visual stability metric

### Load Performance
- **Fully Loaded**: Total page load time
- **Speed Index**: How quickly content is visually displayed
- **Back End Time**: Server response time
- **Front End Time**: Client-side rendering time
- **Time to Interactive**: When page becomes fully interactive

### Visual Metrics
- **First Visual Change**: When first pixels change
- **Last Visual Change**: When final pixels settle
- **Visual Complete 85%**: Time to 85% visual completeness

### Resource Metrics
- **Transfer Size**: Total bytes transferred (compressed)
- **Content Size**: Total bytes after decompression
- **Request Count**: Number of HTTP requests
- **JavaScript Size**: Total JavaScript payload
- **CPU Time**: Total JavaScript execution time

### Lighthouse Scores (0-100)
- **Performance**: Overall speed and optimization
- **Accessibility**: WCAG compliance and usability
- **Best Practices**: Code quality and security
- **SEO**: Search engine optimization
- **PWA**: Progressive web app capabilities

## Configuration

### Adjusting Test Iterations

Edit the `ITERATIONS` variable in the scripts:

```bash
ITERATIONS=7  # Default: 7-11 recommended
```

More iterations = better statistical accuracy but longer runtime.

### Network Conditions

Change the connectivity profile in the scripts:

```bash
--connectivity.profile cable    # Options: cable, 3g, 3gfast, 3gslow, 2g
```

### CPU Throttling

Simulate slower devices by uncommenting:

```bash
--browsertime.chrome.CPUThrottlingRate 4  # 4x slower CPU
```

### Mobile Testing

Test mobile experience by uncommenting:

```bash
--mobile true
```

### Performance Budgets

Edit `budget.json` created during script execution to set thresholds:

```json
{
  "budget": {
    "timings": {
      "firstPaint": 1000,
      "fullyLoaded": 3000,
      "pageLoadTime": 2000,
      "LargestContentfulPaint": 2500
    },
    "requests": {
      "total": 100
    },
    "transferSize": {
      "total": 1000000
    }
  }
}
```

## Visual Comparison Charts

The `generate-charts.js` script creates interactive comparison charts from your sitespeed.io results:

### Features

- **Grouped by Page Type**: Charts are organized by Home, Search, and Article pages
- **Multiple Metrics**: Visualizes 7 key performance metrics
- **Color-Coded**: Each competitor has a distinct color for easy identification
- **Interactive**: Hover over bars to see exact values
- **Responsive**: Works on desktop and mobile browsers

### Metrics Visualized

1. **Fully Loaded (ms)** - Total page load time
2. **LCP (ms)** - Largest Contentful Paint (Core Web Vital)
3. **Speed Index (ms)** - Visual loading speed
4. **Total Blocking Time (ms)** - Main thread blocking (Core Web Vital)
5. **Cumulative Layout Shift** - Visual stability (Core Web Vital)
6. **Transfer Size (KB)** - Total bytes downloaded
7. **Request Count** - Number of HTTP requests

### Output Format

The generator creates a single HTML file (`competitor-comparison.html`) with:
- Summary cards showing test counts
- Separate sections for each page type (Home, Search, Article)
- Grid layout of bar charts for each metric
- Color-coded bars matching each competitor
- Interactive tooltips with exact values

### Example Usage

```bash
# After running sitespeed tests
node generate-charts.js ./sitespeed-results/20251114_212547

# Opens in browser
open ./sitespeed-results/20251114_212547/competitor-comparison.html
```

## Understanding Results

### HTML Reports

Open `index.html` in the results directory for:

1. **Summary Dashboard**: Aggregate statistics across all tests
2. **Pages Comparison**: Side-by-side metrics table
3. **Individual Reports**: Detailed analysis per URL
4. **Waterfall Charts**: Network timing visualizations
5. **Filmstrip Views**: Visual loading progression
6. **Lighthouse Reports**: Full audit details

### Terminal Analysis

The `analyze-results.js` script provides:

- **Comparison Tables**: Ranked by performance
- **Core Web Vitals**: Color-coded threshold compliance
- **Lighthouse Scores**: All five categories
- **Export Files**: CSV and JSON for further analysis

### Color Coding

- 🟢 **Green**: Meets good thresholds
- 🟡 **Yellow**: Needs improvement
- 🔴 **Red**: Poor performance

### Rankings

- 🏆 **1st Place**: Best performer
- 🥈 **2nd Place**: Runner up
- 🥉 **3rd Place**: Third best

## Advanced Usage

### Custom URL Lists

Modify the `competitors` array in the scripts to test different URLs:

```bash
declare -A competitors=(
  ["CustomSite_home"]="https://example.com"
  ["CustomSite_search"]="https://example.com/search?q=test"
)
```

### Integrating with CI/CD

Add to your CI pipeline:

```yaml
- name: Run Performance Tests
  run: ./run-competitor-analysis.sh

- name: Analyze Results
  run: node analyze-results.js ./sitespeed-results/latest

- name: Upload Artifacts
  uses: actions/upload-artifact@v2
  with:
    name: performance-results
    path: sitespeed-results/
```

### Graphite/Grafana Integration

For continuous monitoring, uncomment in scripts:

```bash
--graphite.host "your-graphite-host"
--graphite.port "2003"
```

This sends metrics to Graphite for time-series tracking and Grafana dashboards.

### Slack Notifications

Get notified when tests complete:

```bash
--slack.hookUrl "your-slack-webhook-url"
```

## Interpreting Results for Stakeholders

### Key Questions Answered

1. **How fast is SciX compared to competitors?**
   - Check "Fully Loaded" times in comparison tables
   - Lower is better; aim for <3 seconds

2. **Do we meet Core Web Vitals thresholds?**
   - LCP: <2.5s (good), <4s (needs improvement)
   - TBT: <200ms (good), <600ms (needs improvement)
   - CLS: <0.1 (good), <0.25 (needs improvement)

3. **How do we rank for user experience?**
   - Check Lighthouse Performance score
   - 90-100: Excellent
   - 50-89: Needs improvement
   - 0-49: Poor

4. **Are we accessible?**
   - Lighthouse Accessibility score
   - Target: >90

5. **How much data do users download?**
   - Check Transfer Size metrics
   - Smaller = better, especially for mobile users

### Presenting to Leadership

1. **Executive Summary**:
   ```
   SciX ranks #X out of 7 competitors for search performance
   - Average load time: X.XXs (competitor average: X.XXs)
   - Core Web Vitals: X/3 passing (LCP: ✓/✗, TBT: ✓/✗, CLS: ✓/✗)
   - Lighthouse Performance: XX/100
   ```

2. **Visual Evidence**: Use screenshots and filmstrips from HTML reports

3. **Actionable Insights**: Point to specific Lighthouse recommendations

4. **Trend Analysis**: Run monthly and track improvements over time

## Files Created

### Scripts
- `run-competitor-analysis.sh` - Basic sitespeed.io runner
- `run-competitor-analysis-lighthouse.sh` - Enhanced with Lighthouse
- `analyze-results.js` - Terminal-based analysis tool

### Configuration
- `tests/perf/competitors.ts` - TypeScript competitor definitions

### Output
- `sitespeed-results/<timestamp>/` - Full results directory
  - `index.html` - Main dashboard
  - `pages/` - Individual page reports
  - `lighthouse/` - Lighthouse JSON reports
  - `data/` - Raw JSON data
  - `analysis/` - Exported CSV and JSON comparisons

## Troubleshooting

### Docker Issues

**Error: Cannot connect to Docker daemon**
```bash
# Start Docker service
sudo systemctl start docker
```

**Error: Permission denied**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
```

### Memory Issues

**Error: Out of memory**
```bash
# Increase Docker memory in Docker Desktop settings
# Or reduce test iterations
```

### Site Blocking

**Error: 403 Forbidden or bot detection**
```bash
# Some sites may block automated testing
# Remove problematic URLs from the competitors array
```

### Slow Performance

**Tests taking too long**
```bash
# Reduce iterations: ITERATIONS=3
# Test fewer URLs
# Use basic script instead of Lighthouse version
```

## Best Practices

1. **Run Regularly**: Monthly comparisons to track trends
2. **Consistent Conditions**: Same network profile and iterations
3. **Document Changes**: Note any site updates or changes
4. **Share Results**: Make HTML reports accessible to team
5. **Act on Insights**: Review Lighthouse recommendations and implement fixes
6. **Baseline Before Changes**: Test before major releases

## Additional Resources

- [sitespeed.io Documentation](https://www.sitespeed.io/documentation/)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring Guide](https://web.dev/performance-scoring/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

## Support

For issues or questions:
1. Check the sitespeed.io documentation
2. Review error logs in the results directory
3. Consult team performance experts
4. File an issue in the project repository

## License

This toolkit is part of the SciX UI Integration Testing suite.

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
