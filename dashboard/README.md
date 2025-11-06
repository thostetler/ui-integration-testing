# Performance Test Dashboard

An interactive web-based dashboard for visualizing and comparing UI performance test results.

## Features

- **Interactive Charts**: Visualize performance metrics with interactive Chart.js charts
- **Multi-Run Comparison**: Compare performance across different test runs, applications, and throttling conditions
- **Advanced Filtering**: Filter by app (SCIX/BBB), throttling condition, metric type, and test name
- **Detailed Analytics**: View comprehensive statistics including min/max values, standard error, and run counts
- **Trend Analysis**: Track performance changes over time
- **Export Functionality**: Export filtered results to CSV for further analysis
- **Real-time Updates**: Automatically loads the latest test results

## Quick Start

### 1. Run the Dashboard Server

```bash
# From the project root directory
node dashboard/server.js

# Or specify a custom port
node dashboard/server.js 8080
```

### 2. Open in Browser

Navigate to `http://localhost:3000` in your web browser.

### 3. Load Data

Click the "Load Data" button to load the latest performance test results. The dashboard supports three data sources:

- **Aggregated Results (JSON)**: Recommended - loads from `perf-results/performance-results.json`
- **Aggregated CSV**: Loads from `aggregated_averages.csv`
- **Raw Performance Log**: Loads and aggregates raw data from `perf-results/performance-log.txt`

## Dashboard Sections

### Overview Tab

Shows high-level performance metrics with:
- Top 15 tests by performance metrics (bar chart)
- Test distribution by metric type (doughnut chart)
- Summary statistics cards (total tests, average times, total runs)

### Comparison Tab

Compare specific test runs:
1. Select multiple tests from the list (hold Ctrl/Cmd for multiple selection)
2. Choose the metric to compare (TTRL, TTSBI, TTRS, or TTRR)
3. Click "Generate Comparison" to create a comparison chart

### Trends Tab

View performance trends over time for the top 10 tests. Useful for:
- Identifying performance regressions
- Tracking improvements across test runs
- Spotting patterns in test execution

### Details Tab

Browse all test results in a searchable, filterable table. Includes:
- Export to CSV functionality
- Sortable columns
- All performance metrics and statistics

## Filtering Options

### Quick Filters

- **App**: Filter by SCIX or BBB (ADS)
- **Throttling**: Normal, 6x CPU, 3G 4x, or Ethernet 2x
- **Metrics**: TTRL, TTSBI, TTRS, or TTRR

### Search

Use the search box to filter tests by name (e.g., "bibcode", "title", "citations").

## Performance Metrics Explained

| Metric | Description |
|--------|-------------|
| **TTRL** | Time To Results from Load - Initial page load time |
| **TTSBI** | Time To Search Bar Interactive - Search input becomes usable |
| **TTRS** | Time To Results from Search - From search submission to results display |
| **TTRR** | Time To Results from Refinement - Time to refine search results |

## Data Sources

The dashboard can load data from multiple sources:

### 1. Performance Results JSON (`perf-results/performance-results.json`)

Aggregated test results with statistical analysis:
```json
{
  "name": "scix.bibcode-search.normal.TTRL",
  "avgTime": 4509,
  "sem": 237,
  "repeats": 121,
  "minValue": 1774,
  "maxValue": 17336
}
```

### 2. Aggregated CSV (`aggregated_averages.csv`)

Cross-tabulated results by app and throttling condition.

### 3. Performance Log (`perf-results/performance-log.txt`)

Raw JSONL data with individual test executions:
```json
{
  "name": "scix.bibcode-search.normal.TTRL",
  "duration": 5698,
  "startTime": 1731391531240,
  "endTime": 1731391536938
}
```

## npm Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dashboard": "node dashboard/server.js",
    "dashboard:dev": "node dashboard/server.js 3000"
  }
}
```

Then run:
```bash
npm run dashboard
```

## Architecture

The dashboard is built with:
- **Chart.js 4.4**: Interactive charts and visualizations
- **PapaParse 5.4**: CSV parsing
- **Vanilla JavaScript**: No build step required
- **Node.js HTTP Server**: Simple static file server

## Browser Compatibility

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- IE11: ❌ Not supported

## Troubleshooting

### Port Already in Use

If port 3000 is already taken:
```bash
node dashboard/server.js 3001
```

### Data Not Loading

1. Ensure performance test data exists in `perf-results/`
2. Check browser console for errors (F12)
3. Verify file paths are correct relative to the server root

### Charts Not Rendering

1. Check that Chart.js CDN is accessible
2. Verify browser supports Canvas API
3. Try refreshing the page

## Future Enhancements

Potential features for future versions:
- Real-time test execution monitoring
- Performance regression alerts
- Historical data comparison across multiple runs
- Custom dashboard layouts
- Advanced statistical analysis (percentiles, outliers)
- Integration with CI/CD pipelines

## Contributing

To add new features or fix bugs:
1. Create a feature branch
2. Test changes locally with `node dashboard/server.js`
3. Ensure backward compatibility with existing data formats
4. Update this README with new features

## License

Same license as the parent project.
