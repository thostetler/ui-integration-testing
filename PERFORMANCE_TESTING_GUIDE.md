# Performance Testing Guide - Enhanced Edition

This guide explains how to use the improved performance testing infrastructure that provides statistically valid, reproducible results.

## 🎯 What's New

The enhanced performance testing system captures:

- ✅ **Statistical metrics** (median, std dev, percentiles)
- ✅ **Result set sizes** (normalizes for different query types)
- ✅ **Consistent sample sizes** (configurable, default 100 runs)
- ✅ **Accurate TTRR measurement** (distinguishes cache from real work)
- ✅ **Warmup runs** (stabilizes JIT/cache before measurement)
- ✅ **Web Vitals** (LCP, FCP, TTFB, CLS, FID)
- ✅ **Individual run data** (not just averages)

## 📊 Metrics Captured

### Core Performance Metrics

1. **TTRL** (Time To Results from Load) - Time from page load to search results displayed
2. **TTSBI** (Time To Search Bar Interactive) - Time until search bar is ready for input
3. **TTRS** (Time To Results from Search) - Time from search submission to results displayed
4. **TTRR** (Time To Results from Refinement) - Time to update results when refining a query

### Web Vitals (Optional)

1. **LCP** (Largest Contentful Paint) - Main content load time
2. **FCP** (First Contentful Paint) - First content appears
3. **TTFB** (Time To First Byte) - Server response time
4. **FID** (First Input Delay) - Interactivity delay
5. **CLS** (Cumulative Layout Shift) - Visual stability

### Metadata

- Initial result count
- Refined result count
- Test name, app, throttling level
- Timestamp for each sample

## 🚀 Quick Start

### Run Performance Tests

```bash
# Standard run (100 iterations with warmup)
npm run test:perf

# 200 iterations for higher confidence
npm run test:perf:200

# Quick test (20 iterations, 5 warmup runs)
npm run test:perf:quick

# Skip warmup runs
npm run test:perf:nowarmup

# Skip web vitals capture (faster)
npm run test:perf:novitals
```

### Generate Statistics

```bash
# Generate detailed statistics from raw samples
npm run perf:stats

# This creates:
# - performance-stats-detailed.csv (all statistics)
# - performance-stats-detailed-summary.csv (medians and P95s)
```

### Compare Results

```bash
# Compare baseline vs current
npm run perf:compare perf-results/jan-baseline.json perf-results/feb-current.json

# Creates performance-comparison.md with:
# - Regressions and improvements
# - Statistical significance testing
# - Detailed change breakdown
```

### Full Workflow

```bash
# Run tests and generate stats in one command
npm run perf:full
```

## 📁 File Structure

```
perf-results/
├── performance-log.txt              # Legacy format (from playwright-performance)
├── performance-samples.json         # New: Raw samples with metadata
├── performance-samples.jsonl        # New: Streaming format (one sample per line)

performance-stats-detailed.csv       # Detailed statistics
performance-stats-detailed-summary.csv  # Summary (medians and P95s)
performance-comparison.md            # Comparison report (when comparing)
```

## 🔧 Configuration

### Environment Variables

```bash
# Number of warmup iterations (default: 10)
export WARMUP_RUNS=10

# Capture web vitals (default: true)
export CAPTURE_WEB_VITALS=true
```

### Test Repetition

Configure in package.json scripts:

```json
{
  "test:perf": "playwright test 'perf/perf.spec.ts' --repeat-each 100 --project perf"
}
```

- `--repeat-each 100` means each test runs 100 times
- Each run includes warmup + 1 recorded measurement
- Total: 100 recorded samples per test

## 📈 Understanding the Results

### Detailed CSV Format

```csv
Test,Metric,Mean (ms),Median (ms),Std Dev (ms),CV (%),Min (ms),Max (ms),P50 (ms),P90 (ms),P95 (ms),P99 (ms),Sample Size,Avg Result Count,Avg Refined Result Count
scix.first-author.normal,TTRL,3098.8,3050.2,245.3,7.9,2800.1,4200.5,3050.2,3450.1,3550.2,3650.2,100,1000000,950000
```

**Key Columns:**

- **Median**: Most representative value (use this for comparisons)
- **Std Dev**: Spread of values (lower is more consistent)
- **CV (%)**: Coefficient of variation (relative consistency)
- **P95/P99**: Tail latency (worst-case performance)
- **Sample Size**: Number of measurements (higher = more confidence)

### Interpreting Statistics

#### Median vs Mean

- **Median** is more robust to outliers
- Use median for comparisons between runs
- Mean is shown for completeness

#### Standard Deviation (Std Dev)

- Shows consistency of measurements
- Lower is better (more predictable)
- If StdDev is high relative to mean, results are variable

#### Coefficient of Variation (CV%)

- Normalized measure of consistency
- CV% = (StdDev / Mean) × 100
- Lower is better
- < 10% = Very consistent
- 10-20% = Moderately consistent
- \> 20% = High variability

#### Percentiles

- **P50 (Median)**: 50% of requests are faster than this
- **P90**: 90% of requests are faster (catches slower cases)
- **P95**: 95% of requests are faster (tail latency)
- **P99**: 99% of requests are faster (worst case, excluding extreme outliers)

## 📊 CSV Output Examples

### What You Get

**Instead of this (old):**
```csv
Test Name,scix_normal_TTRL,scix_normal_TTSBI,...
bibcode-search,3098.826,1662.3,...
```

**You now get (new detailed):**
```csv
Test,Metric,Mean,Median,StdDev,CV,Min,Max,P50,P90,P95,P99,N,AvgResultCount
scix.bibcode-search.normal,TTRL,3098.8,3050.2,245.3,7.9,2800.1,4200.5,3050.2,3300.0,3450.1,3650.2,100,1000000
scix.bibcode-search.normal,TTSBI,1662.1,1650.3,82.4,5.0,1500.0,1850.0,1650.3,1750.0,1800.0,1820.0,100,1000000
scix.bibcode-search.normal,TTRS,1234.9,1220.5,105.2,8.5,1050.0,1550.0,1220.5,1350.0,1450.0,1520.0,100,1000000
scix.bibcode-search.normal,TTRR,944.9,920.3,95.1,10.1,800.0,1200.0,920.3,1050.0,1100.0,1150.0,100,900000
```

## 🔄 Workflow for Baseline Comparison

### 1. Capture Baseline (e.g., January 2025 release)

```bash
# Checkout baseline version
git checkout v0.19.96

# Install and build
pnpm install
npm run build

# Start dev server
npm run dev &

# Run performance tests
npm run test:perf:200

# Generate statistics
npm run perf:stats

# Save baseline
cp perf-results/performance-samples.json perf-results/baseline-jan-2025.json
cp performance-stats-detailed.csv baseline-jan-2025-detailed.csv
```

### 2. Test Current Version

```bash
# Return to current branch
git checkout main

# Install and build
pnpm install
npm run build

# Start dev server
npm run dev &

# Run performance tests
npm run test:perf:200

# Generate statistics
npm run perf:stats

# Save current
cp perf-results/performance-samples.json perf-results/current-feb-2025.json
cp performance-stats-detailed.csv current-feb-2025-detailed.csv
```

### 3. Compare Results

```bash
# Generate comparison report
npm run perf:compare perf-results/baseline-jan-2025.json perf-results/current-feb-2025.json

# Opens: performance-comparison.md
```

### 4. Review Comparison Report

The comparison report shows:

- ⚠️ **Regressions** - Tests that got significantly slower
- ⚡ **Improvements** - Tests that got significantly faster
- 📊 **Minor changes** - Changes within statistical noise
- 🆕 **New tests** - Tests added since baseline
- ❌ **Removed tests** - Tests removed since baseline

Example output:

```markdown
## ⚠️ Regressions

| Test | Metric | Baseline Median | Current Median | Change | Status |
|------|--------|-----------------|----------------|--------|--------|
| scix.first-author.normal | TTRL | 3050.2ms | 3450.5ms | +13.1% | ⚠️ REGRESSION |

## ⚡ Major Improvements

| Test | Metric | Baseline Median | Current Median | Change | Status |
|------|--------|-----------------|----------------|--------|--------|
| scix.bibcode-search.normal | TTRR | 920.3ms | 750.2ms | -18.5% | ✅ IMPROVED |
```

## 🎯 Best Practices

### Sample Size

- **20 samples**: Quick check, low confidence
- **100 samples**: Standard, good confidence
- **200 samples**: High confidence, recommended for baselines
- **500+ samples**: Overkill unless measuring very small differences

### Warmup Runs

- **Default (10)**: Good for most cases
- **5**: For quick tests
- **20+**: For very JIT-heavy applications

### When to Run Tests

1. **Before release**: Establish baseline
2. **After major changes**: Check for regressions
3. **Weekly/monthly**: Track trends over time
4. **After optimization work**: Validate improvements

### Statistical Significance

The comparison tool checks if confidence intervals overlap:

- **No overlap** = Statistically significant change
- **Overlap** = Could be random variation

Only flag as regression/improvement if:
- Statistically significant AND
- Change > 5% (configurable threshold)

## 🐛 Troubleshooting

### High Variability (High CV%)

**Problem**: CV% > 20%, inconsistent results

**Solutions**:
1. Increase warmup runs
2. Increase sample size
3. Check for background processes
4. Run tests in isolation (no parallel tests)
5. Use a dedicated test machine

### TTRR Always Fast (Cached)

**Problem**: TTRR shows very low times, likely cached

**Solution**: The improved TTRR measurement now waits for actual DOM changes, not just visibility toggle. If still showing cached results:

1. Check browser cache settings
2. Verify selectors are correct
3. Check if refinement actually changes results

### Web Vitals Not Captured

**Problem**: LCP, FCP, etc. are empty

**Solutions**:
1. Check `CAPTURE_WEB_VITALS` is not set to false
2. Increase wait time in `captureWebVitalsAfterLoad`
3. Check browser console for errors
4. Some vitals (FID) only trigger on user interaction

### Out of Memory

**Problem**: Tests crash with OOM errors

**Solutions**:
1. Reduce `--repeat-each` count
2. Split tests into smaller batches
3. Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run test:perf`

## 📚 Technical Details

### How It Works

1. **Test Execution**:
   - Each test runs N warmup iterations (not recorded)
   - Then runs 1 measured iteration (recorded)
   - Playwright's `--repeat-each` repeats this cycle

2. **Data Collection**:
   - `EnhancedPerformanceRecorder` captures individual samples
   - Each sample includes duration, timestamp, metadata
   - Samples saved to JSON and JSONL files

3. **Statistical Analysis**:
   - `generate-perf-stats.js` reads raw samples
   - Groups by test and metric
   - Calculates statistics for each group
   - Outputs detailed CSV

4. **Comparison**:
   - `compare-perf-results.js` loads two sample sets
   - Calculates statistics for each
   - Computes confidence intervals
   - Checks for statistical significance
   - Generates markdown report

### File Format: JSONL

Each line is a complete JSON object:

```jsonl
{"test":"scix.first-author.normal","metric":"TTRL","duration":3050.2,"timestamp":1704067200000,"resultCount":1000000,"refinedResultCount":950000}
{"test":"scix.first-author.normal","metric":"TTSBI","duration":1650.3,"timestamp":1704067200100,"resultCount":1000000,"refinedResultCount":950000}
```

Benefits:
- Streamable (can process line-by-line)
- Appendable (no need to rewrite entire file)
- Easy to grep/filter with command-line tools

## 🔬 Advanced Usage

### Custom Analysis

Read JSONL with any tool:

```bash
# Filter to specific test
grep "scix.first-author.normal" perf-results/performance-samples.jsonl

# Extract just TTRL metrics
jq 'select(.metric == "TTRL")' perf-results/performance-samples.jsonl

# Calculate median in bash
cat perf-results/performance-samples.jsonl | jq -r '.duration' | sort -n | awk '{a[NR]=$1} END {print a[int(NR/2)]}'
```

### Import to Analysis Tools

**Python (Pandas)**:

```python
import pandas as pd

# Read JSONL
df = pd.read_json('perf-results/performance-samples.jsonl', lines=True)

# Group and analyze
stats = df.groupby(['test', 'metric'])['duration'].agg(['mean', 'median', 'std', 'count'])
print(stats)
```

**R**:

```r
library(jsonlite)
library(dplyr)

# Read JSONL
data <- stream_in(file("perf-results/performance-samples.jsonl"))

# Summarize
stats <- data %>%
  group_by(test, metric) %>%
  summarise(
    median = median(duration),
    p95 = quantile(duration, 0.95)
  )
```

## 📞 Support

For issues or questions:

1. Check this guide first
2. Review the example output in `perf-results/`
3. Check the source code comments
4. Open an issue with:
   - Environment details
   - Error messages
   - Sample data (anonymized if needed)

## 🎉 Summary

You now have:

✅ Statistically valid performance measurements
✅ Reproducible baselines
✅ Automated regression detection
✅ Rich metadata for analysis
✅ Web Vitals integration
✅ Export to any analysis tool

Happy testing! 🚀
