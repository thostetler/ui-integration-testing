# Performance Comparison Report

**Generated:** 2025-11-06T18:09:55.437Z

**Baseline:** baseline-jan-2025.json
**Current:** perf-results-current/performance-samples.json

## Summary

- ⚠️  **Regressions:** 0
- ⚡ **Major Improvements:** 0
- 🔻 **Slightly Slower:** 0
- 🔺 **Slightly Faster:** 0
- ➡️  **Unchanged:** 0
- 🆕 **New Tests:** 18
- ❌ **Removed Tests:** 3

## 📈 Detailed Statistics

| Test | Metric | Baseline (median ± σ) | Current (median ± σ) | P95 Change | Sample Sizes |
|------|--------|-----------------------|----------------------|------------|--------------|

## 🆕 New Tests

| Test | Metric | Median | P95 | Sample Size |
|------|--------|--------|-----|-------------|
| scix.first-author.normal | TTSBI | 2199.9ms | 2199.9ms | 1 |
| scix.first-author.normal | FCP | 804ms | 804ms | 1 |
| scix.first-author.normal | TTFB | 105.1ms | 105.1ms | 1 |
| scix.first-author.normal | TTRS | 2470.7ms | 2470.7ms | 1 |
| scix.first-author.normal | TTRL | 6206.1ms | 6206.1ms | 1 |
| scix.first-author.normal | TTRR | 1191.1ms | 1191.1ms | 1 |
| scix.title-keyword.normal | TTSBI | 2808.5ms | 2808.5ms | 1 |
| scix.title-keyword.normal | FCP | 1428ms | 1428ms | 1 |
| scix.title-keyword.normal | TTFB | 187.4ms | 187.4ms | 1 |
| scix.title-keyword.normal | TTRS | 3299ms | 3299ms | 1 |
| scix.title-keyword.normal | TTRL | 7482.5ms | 7482.5ms | 1 |
| scix.title-keyword.normal | TTRR | 1248.7ms | 1248.7ms | 1 |
| scix.bibcode-search.normal | TTSBI | 2263.4ms | 2263.4ms | 1 |
| scix.bibcode-search.normal | FCP | 236ms | 236ms | 1 |
| scix.bibcode-search.normal | TTFB | 68.4ms | 68.4ms | 1 |
| scix.bibcode-search.normal | TTRS | 2275.8ms | 2275.8ms | 1 |
| scix.bibcode-search.normal | TTRL | 5981.8ms | 5981.8ms | 1 |
| scix.bibcode-search.normal | TTRR | 1164.2ms | 1164.2ms | 1 |

## ❌ Removed Tests

| Test | Metric |
|------|--------|
| scix.abstract-keyword.6x-cpu | TTSBI |
| scix.abstract-keyword.6x-cpu | FCP |
| scix.abstract-keyword.6x-cpu | TTFB |
