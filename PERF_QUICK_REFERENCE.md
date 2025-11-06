# Performance Testing - Quick Reference

## 🚀 Common Commands

```bash
# Run tests with CORE set (8 queries, ~30-45 min for 100 samples)
npm run test:perf

# Run with 200 iterations (recommended for baselines, ~1-2 hours)
npm run test:perf:200

# Quick test (20 iterations, 5 warmup, ~10-15 min)
npm run test:perf:quick

# Full query set (26 queries, ~2-4 hours for 100 samples)
npm run test:perf:full

# Full query set with 200 samples (~8-12 hours, run overnight!)
npm run test:perf:full:200

# Generate statistics
npm run perf:stats

# Compare two runs
npm run perf:compare baseline.json current.json

# Full workflow (test + stats)
npm run perf:workflow
```

## 📦 Query Sets

Tests now run with configurable query sets for faster execution:

| Set | Queries | Tests | Time (200 samples) | Use For |
|-----|---------|-------|-------------------|---------|
| **CORE** (default) | 8 | 32 | ~1-2 hours | Regular testing |
| **EXTENDED** | 18 | 72 | ~4-6 hours | Thorough testing |
| **FULL** | 26 | 104 | ~8-12 hours | Release baselines |

```bash
# Use different query sets
npm run test:perf              # CORE (default)
npm run test:perf:full         # FULL set
npm run test:perf:extended     # EXTENDED set

# Or set via environment variable
PERF_QUERY_SET=full npm run test:perf:200
```

See [tests/perf/QUERY_SETS.md](tests/perf/QUERY_SETS.md) for details.

## 📊 Output Files

| File | Description |
|------|-------------|
| `perf-results/performance-samples.json` | Raw samples with metadata |
| `perf-results/performance-samples.jsonl` | Same, streamable format |
| `performance-stats-detailed.csv` | Full statistics |
| `performance-stats-detailed-summary.csv` | Medians and P95s only |
| `performance-comparison.md` | Regression report |

## 📈 Key Metrics

| Metric | What It Measures | Good Value |
|--------|------------------|------------|
| **TTRL** | Time from load to results | < 3s |
| **TTSBI** | Time to search bar ready | < 1s |
| **TTRS** | Time from search to results | < 2s |
| **TTRR** | Time to refine search | < 1s |
| **LCP** | Largest content paint | < 2.5s |
| **FCP** | First content paint | < 1.8s |
| **TTFB** | Server response time | < 800ms |

## 📊 Statistics Guide

| Stat | Use For | Notes |
|------|---------|-------|
| **Median** | Primary comparison | Most robust |
| **P95** | Tail latency | 95% users faster |
| **Std Dev** | Consistency check | Lower = better |
| **CV%** | Relative consistency | < 10% = very consistent |

## ⚙️ Environment Variables

```bash
# Configure warmup runs (default: 10)
export WARMUP_RUNS=10

# Enable/disable web vitals (default: true)
export CAPTURE_WEB_VITALS=true
```

## 🔄 Baseline Workflow

```bash
# 1. Capture baseline
git checkout v1.0.0
npm run test:perf:200
cp perf-results/performance-samples.json baseline.json

# 2. Test current
git checkout main
npm run test:perf:200
cp perf-results/performance-samples.json current.json

# 3. Compare
npm run perf:compare baseline.json current.json

# 4. Review performance-comparison.md
```

## 🎯 Interpreting Results

### CV% (Coefficient of Variation)
- **< 10%**: Very consistent, high confidence
- **10-20%**: Moderately consistent, acceptable
- **> 20%**: High variability, investigate

### Regression Detection
- **Change > 10%** + **Statistically significant** = 🚨 Regression
- **Change 5-10%** + **Statistically significant** = ⚠️ Watch
- **Change < 5%** or **Not significant** = ✅ OK

### Sample Size Recommendations
- **20**: Quick check
- **100**: Standard (default)
- **200**: High confidence baselines
- **500+**: Only if measuring < 5% changes

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| High CV% (> 20%) | Increase warmup, check for background processes |
| TTRR too fast | Check if results actually changed (fixed in new implementation) |
| No web vitals | Check CAPTURE_WEB_VITALS env var |
| OOM errors | Reduce --repeat-each count |
| Slow tests | Set CAPTURE_WEB_VITALS=false |

## 📚 CSV Column Reference

| Column | Description |
|--------|-------------|
| Test | Test identifier (app.query.throttling) |
| Metric | Metric name (TTRL, TTRS, etc.) |
| Mean | Average value |
| Median | Middle value (preferred for comparison) |
| Std Dev | Standard deviation (consistency) |
| CV | Coefficient of variation (%) |
| Min/Max | Range of values |
| P50/P90/P95/P99 | Percentiles |
| N | Sample size |
| Avg Result Count | Average number of search results |

## 🎓 Best Practices

1. ✅ Always run warmup iterations
2. ✅ Use >= 100 samples for comparisons
3. ✅ Use median, not mean, for comparisons
4. ✅ Check CV% to validate consistency
5. ✅ Save baselines before releases
6. ✅ Compare with statistical significance
7. ❌ Don't compare single runs
8. ❌ Don't ignore high variability (CV > 20%)

## 📞 Need Help?

See [PERFORMANCE_TESTING_GUIDE.md](./PERFORMANCE_TESTING_GUIDE.md) for detailed documentation.
