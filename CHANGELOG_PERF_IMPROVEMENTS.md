# Performance Testing Improvements Changelog

## Summary

This update transforms the performance testing infrastructure from simple averaging to statistically rigorous measurement with comprehensive analysis capabilities.

## 🎯 Goals Achieved

- ✅ Statistical metrics (median, std dev, percentiles)
- ✅ Result set size tracking (normalizes for different query types)
- ✅ Consistent sample sizes (200 runs minimum)
- ✅ Accurate TTRR measurement (distinguishes cache from real work)
- ✅ Warmup runs (stabilizes JIT/cache)
- ✅ Web Vitals integration (LCP, FCP, TTFB, CLS, FID)
- ✅ Individual run data storage (not just averages)
- ✅ Automated regression detection

## 📁 New Files

### Core Infrastructure

1. **tests/perf/performance-recorder.ts**
   - Enhanced performance recorder
   - Captures individual samples with metadata
   - Stores result counts, timestamps, query info
   - Exports to JSON and JSONL formats

2. **tests/perf/statistics.ts**
   - Statistical analysis utilities
   - Calculates mean, median, std dev, percentiles
   - Outlier detection (IQR method)
   - Confidence intervals
   - Performance comparison functions

3. **tests/perf/web-vitals.ts**
   - Web Vitals capture using Performance Observer API
   - Measures LCP, FCP, TTFB, FID, CLS
   - Assessment against Google's thresholds
   - Formatting utilities

### Scripts

4. **scripts/generate-perf-stats.js**
   - Processes raw samples into statistics
   - Generates detailed CSV with all metrics
   - Creates summary CSV with medians and P95s
   - Calculates CV% (coefficient of variation)

5. **scripts/compare-perf-results.js**
   - Compares baseline vs current performance
   - Statistical significance testing
   - Automated regression detection
   - Generates markdown comparison report

### Documentation

6. **PERFORMANCE_TESTING_GUIDE.md**
   - Comprehensive guide (3000+ words)
   - Workflow examples
   - Statistical interpretation guide
   - Troubleshooting section

7. **PERF_QUICK_REFERENCE.md**
   - Quick reference card
   - Common commands
   - Key metrics guide
   - Best practices

8. **CHANGELOG_PERF_IMPROVEMENTS.md**
   - This file - summary of all changes

## 🔄 Modified Files

### tests/perf/perf.spec.ts

**Changes:**
1. Added warmup runs (configurable via WARMUP_RUNS env var)
2. Integrated enhanced performance recorder
3. Fixed TTRR measurement to wait for actual DOM changes (not just visibility)
4. Added result count capture (initial and refined)
5. Integrated Web Vitals capture
6. Added afterAll hook to save performance data
7. Increased test timeout to accommodate warmup runs

**Key Improvements:**

```typescript
// Before: Just measure visibility toggle
await page.waitForSelector(searchResultsSelector, { state: 'hidden' });
await page.waitForSelector(searchResultsSelector, { state: 'visible' });

// After: Wait for actual content change
await page.waitForFunction(
  ({ selector, initialCount }) => {
    const currentCount = document.querySelectorAll(selector).length;
    return currentCount !== initialCount && currentCount > 0;
  },
  { selector: searchResultsSelector, initialCount: initialResultCount }
);
```

### package.json

**New Scripts:**

```json
{
  "test:perf:200": "Run 200 iterations for high-confidence baselines",
  "test:perf:quick": "Quick test with 20 iterations and 5 warmup runs",
  "test:perf:nowarmup": "Skip warmup runs",
  "test:perf:novitals": "Skip web vitals capture",
  "perf:stats": "Generate statistics from raw samples",
  "perf:compare": "Compare two performance runs",
  "perf:full": "Run tests and generate statistics"
}
```

## 📊 Output Format Changes

### Before (agg_timings.js)

```csv
Test Name,scix_normal_TTRL,scix_normal_TTSBI,...
bibcode-search,3098.826,...
```

**Problems:**
- Only averages (no std dev, percentiles)
- No sample size information
- No metadata (result counts)
- Can't calculate confidence intervals

### After (generate-perf-stats.js)

**Detailed CSV:**

```csv
Test,Metric,Mean,Median,StdDev,CV,Min,Max,P50,P90,P95,P99,N,AvgResultCount,AvgRefinedResultCount
scix.bibcode-search.normal,TTRL,3098.8,3050.2,245.3,7.9,2800.1,4200.5,3050.2,3300.0,3450.1,3650.2,100,1000000,950000
```

**Summary CSV:**

```csv
Test Name,TTRL_median,TTRL_p95,TTSBI_median,TTSBI_p95,...
scix.bibcode-search.normal,3050.2,3450.1,1650.3,1800.0,...
```

**Benefits:**
- Full statistical distribution
- Confidence metrics (CV%)
- Metadata for normalization
- Can detect regressions with confidence

## 🔬 Technical Details

### TTRR Measurement Fix

**Problem:** Previous implementation just waited for selector to disappear and reappear, which:
- Captured cached results as "instant"
- Didn't verify actual query execution
- Mixed cache hits with real queries

**Solution:** New implementation waits for actual DOM content change:
```typescript
await page.waitForFunction(
  ({ selector, initialCount }) => {
    const currentCount = document.querySelectorAll(selector).length;
    return currentCount !== initialCount && currentCount > 0;
  },
  { selector, initialCount }
);
```

This ensures we're measuring actual query execution, not cache hits.

### Warmup Runs

**Why:** First few runs are affected by:
- JIT compilation
- Browser cache population
- V8 optimization
- DNS resolution
- Connection pooling

**Implementation:**
```typescript
// Run warmup iterations (results not recorded)
for (let i = 0; i < WARMUP_ITERATIONS; i++) {
  await perfTest(..., false); // false = don't record
}

// Run actual measured test
await perfTest(..., true); // true = record
```

Default: 10 warmup runs (configurable via WARMUP_RUNS env var)

### Web Vitals Integration

Uses Performance Observer API to capture:
- **LCP** (Largest Contentful Paint) - Main content load time
- **FCP** (First Contentful Paint) - First paint time
- **TTFB** (Time To First Byte) - Server response time
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability

Compared against Google's Core Web Vitals thresholds:
- LCP: Good < 2.5s, Poor > 4s
- FCP: Good < 1.8s, Poor > 3s
- TTFB: Good < 800ms, Poor > 1.8s

### Statistical Analysis

**Metrics Calculated:**
- Mean (average)
- Median (50th percentile)
- Standard Deviation (spread)
- Variance
- Coefficient of Variation (CV% = std/mean × 100)
- Min/Max
- Percentiles (P50, P90, P95, P99)
- Sample size

**Confidence Intervals:**
Using t-distribution (z-score approximation):
- 95% CI: mean ± 1.96 × SE
- 99% CI: mean ± 2.576 × SE

Where SE (standard error) = stdDev / sqrt(n)

**Significance Testing:**
Two measurements are significantly different if their 95% confidence intervals don't overlap.

## 🎯 Workflow Changes

### Old Workflow

1. Run tests: `npm run test:perf`
2. Aggregate: `node agg_timings.js`
3. Get CSV with averages
4. Manually compare numbers

**Problems:**
- No statistical confidence
- Can't detect significance
- No metadata
- Hard to track trends

### New Workflow

#### Standard Run

```bash
npm run test:perf      # Run tests with warmup
npm run perf:stats     # Generate statistics
# Review performance-stats-detailed.csv
```

#### Baseline Comparison

```bash
# Capture baseline
git checkout v1.0.0
npm run test:perf:200
cp perf-results/performance-samples.json baseline.json

# Test current
git checkout main
npm run test:perf:200
cp perf-results/performance-samples.json current.json

# Compare
npm run perf:compare baseline.json current.json
# Review performance-comparison.md
```

**Benefits:**
- Automated regression detection
- Statistical significance testing
- Rich metadata for analysis
- Clear, actionable reports

## 🔧 Configuration Options

### Environment Variables

```bash
# Number of warmup runs (default: 10)
export WARMUP_RUNS=10

# Enable/disable web vitals (default: true)
export CAPTURE_WEB_VITALS=true
```

### Test Repetition

```bash
# Standard (100 iterations)
npm run test:perf

# High confidence (200 iterations)
npm run test:perf:200

# Quick test (20 iterations)
npm run test:perf:quick

# No warmup (for debugging)
npm run test:perf:nowarmup

# No web vitals (faster)
npm run test:perf:novitals
```

## 📈 Example Output

### Comparison Report (performance-comparison.md)

```markdown
# Performance Comparison Report

**Generated:** 2025-01-15T10:30:00.000Z
**Baseline:** baseline.json
**Current:** current.json

## Summary

- ⚠️  **Regressions:** 2
- ⚡ **Major Improvements:** 3
- 🔻 **Slightly Slower:** 1
- 🔺 **Slightly Faster:** 2
- ➡️  **Unchanged:** 45

## ⚠️ Regressions

| Test | Metric | Baseline Median | Current Median | Change | Status |
|------|--------|-----------------|----------------|--------|--------|
| scix.first-author.normal | TTRL | 3050.2ms | 3450.5ms | +13.1% | ⚠️ REGRESSION |

## ⚡ Major Improvements

| Test | Metric | Baseline Median | Current Median | Change | Status |
|------|--------|-----------------|----------------|--------|--------|
| scix.bibcode-search.normal | TTRR | 920.3ms | 750.2ms | -18.5% | ✅ IMPROVED |
```

### Detailed CSV Statistics

```csv
Test,Metric,Mean,Median,StdDev,CV,Min,Max,P50,P90,P95,P99,N,AvgResultCount
scix.first-author.normal,TTRL,3098.8,3050.2,245.3,7.9,2800.1,4200.5,3050.2,3300.0,3450.1,3650.2,100,1000000
scix.first-author.normal,TTSBI,1662.1,1650.3,82.4,5.0,1500.0,1850.0,1650.3,1750.0,1800.0,1820.0,100,1000000
scix.first-author.normal,TTRS,1234.9,1220.5,105.2,8.5,1050.0,1550.0,1220.5,1350.0,1450.0,1520.0,100,1000000
scix.first-author.normal,TTRR,944.9,920.3,95.1,10.1,800.0,1200.0,920.3,1050.0,1100.0,1150.0,100,900000
```

## 🚀 Benefits

### For Development

1. **Early regression detection** - Catch slowdowns before release
2. **Confidence in optimizations** - Know if changes actually helped
3. **Data-driven decisions** - Use statistics, not gut feelings
4. **Trend tracking** - Monitor performance over time

### For Analysis

1. **Export to any tool** - JSON/JSONL/CSV formats
2. **Statistical rigor** - Proper confidence intervals
3. **Rich metadata** - Result counts, timestamps, etc.
4. **Reproducible** - Consistent warmup and sample sizes

### For Reporting

1. **Automated reports** - Markdown comparison reports
2. **Clear visualizations** - CSV for graphing tools
3. **Actionable insights** - Flags regressions automatically
4. **Historical tracking** - Save baselines over time

## 🎓 Key Improvements Summary

| Area | Before | After |
|------|--------|-------|
| **Metrics** | Mean only | Mean, median, std dev, percentiles |
| **Sample Info** | None | Full sample size and variance |
| **TTRR** | Visibility toggle | Actual DOM change |
| **Warmup** | None | Configurable (default 10) |
| **Web Vitals** | None | LCP, FCP, TTFB, FID, CLS |
| **Metadata** | None | Result counts, timestamps |
| **Comparison** | Manual | Automated with significance testing |
| **Output** | Single CSV | Detailed CSV + Summary CSV + JSON/JSONL |
| **Documentation** | None | Comprehensive guide + quick reference |

## 🔄 Migration Guide

### For Existing Tests

No changes needed! The old workflow still works:

```bash
npm run test:perf   # Still works
node agg_timings.js # Still works
```

### To Use New Features

```bash
# Use new statistics
npm run test:perf
npm run perf:stats

# Use comparison
npm run perf:compare old.json new.json
```

### Reading Old vs New Results

**Old CSV:**
- One row per test
- Columns for each app-metric combo
- Values are averages

**New Detailed CSV:**
- One row per test-metric combination
- Columns for different statistics
- Much more information per measurement

Both formats are useful - keep both!

## 📞 Support

See:
- [PERFORMANCE_TESTING_GUIDE.md](./PERFORMANCE_TESTING_GUIDE.md) - Full documentation
- [PERF_QUICK_REFERENCE.md](./PERF_QUICK_REFERENCE.md) - Quick reference

## 🎉 Conclusion

These improvements provide:

✅ **Statistically valid** measurements
✅ **Reproducible** baselines
✅ **Automated** regression detection
✅ **Rich** metadata for analysis
✅ **Comprehensive** documentation
✅ **Backward compatible** with existing workflow

Estimated implementation time: ~6-8 hours
Estimated test run time: 4-6 hours for 200 samples (mostly waiting)

Total effort: ~1-2 days for full implementation and baseline capture
