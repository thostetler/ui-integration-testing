# Performance Test Query Sets

## Overview

Performance tests can run with different query sets to balance coverage vs test time.

## Available Query Sets

### 🎯 CORE (Default)
**8 queries = 32 tests** (2 apps × 2 throttling levels)

**Selected for:**
- Most common search patterns
- Representative of typical user queries
- Good coverage of query complexity
- Reasonable test time

**Queries:**
1. First author search - `author:"^Solanki, Sami"`
2. Year range search - `year:2010-2020`
3. Title keyword search - `title:"black hole"`
4. Abstract keyword search - `abs:"supernova"`
5. Bibcode search - `bibcode:2020ApJ...890...86S`
6. Citations search - `citations(abs:"JWST")`
7. AND condition - `author:"Einstein, A" AND year:1916`
8. Full text search - `full:"gravitational waves"`

**Test Times:**
- 20 samples: ~10-15 min ⚡
- 100 samples: ~30-45 min
- 200 samples: ~1-2 hours

### 📚 EXTENDED
**18 queries = 72 tests**

**Additional patterns:**
- Affiliation, keyword, arxiv searches
- OR, NOT conditions
- Complex citation queries
- Multi-field combinations
- Reference searches

**Test Times:**
- 20 samples: ~20-30 min
- 100 samples: ~1-2 hours
- 200 samples: ~4-6 hours

### 🔬 FULL
**26 queries = 104 tests**

**Everything:** CORE + EXTENDED

**Test Times:**
- 20 samples: ~30-45 min
- 100 samples: ~2-4 hours
- 200 samples: ~8-12 hours 🐌

## Usage

### Using Default (CORE)

```bash
# Standard run with CORE queries (8 queries)
npm run test:perf

# Quick test with CORE queries
npm run test:perf:quick

# Baseline with CORE queries
npm run test:perf:200
```

### Using FULL Query Set

```bash
# 100 samples with all 26 queries
npm run test:perf:full

# 200 samples with all 26 queries (8-12 hours!)
npm run test:perf:full:200

# Or set environment variable
PERF_QUERY_SET=full npm run test:perf:200
```

### Using EXTENDED Query Set

```bash
# 100 samples with extended 18 queries
npm run test:perf:extended

# Or set environment variable
PERF_QUERY_SET=extended npm run test:perf:200
```

## Recommendations

### Daily/CI Testing
Use **CORE** set:
```bash
npm run test:perf:quick  # 20 samples, ~10-15 min
```

### Weekly Regression Testing
Use **CORE** set with more samples:
```bash
npm run test:perf:200     # 200 samples, ~1-2 hours
```

### Release Baselines
Use **FULL** set:
```bash
npm run test:perf:full:200  # 200 samples, ~8-12 hours
# Run overnight or on weekend
```

### Investigating Specific Query Types
Use **EXTENDED** or **FULL** as needed:
```bash
# If investigating citation query performance
PERF_QUERY_SET=full npm run test:perf
```

## Time vs Coverage Trade-off

| Query Set | Queries | Tests | Coverage | 200-Sample Time | Use Case |
|-----------|---------|-------|----------|-----------------|----------|
| **CORE** | 8 | 32 | ~70% of patterns | 1-2 hours | Regular testing |
| **EXTENDED** | 18 | 72 | ~90% of patterns | 4-6 hours | Thorough testing |
| **FULL** | 26 | 104 | 100% of patterns | 8-12 hours | Release baselines |

## Customizing Query Sets

To add/remove queries from a set, edit:
- **Core set:** `tests/perf/queries-core.ts` → `queriesCore` array
- **Extended set:** `tests/perf/queries-core.ts` → `queriesExtended` array

The `queries.ts` file automatically selects based on `PERF_QUERY_SET` environment variable.

## Environment Variables

```bash
# Query set selection (default: core)
PERF_QUERY_SET=core      # 8 queries
PERF_QUERY_SET=extended  # 18 queries
PERF_QUERY_SET=full      # 26 queries

# Can combine with other options
PERF_QUERY_SET=full WARMUP_RUNS=5 npm run test:perf:quick
```

## Best Practices

1. ✅ **Use CORE for regular testing** - Gets you 70% coverage in 1/4 the time
2. ✅ **Use FULL for baselines** - Complete coverage before releases
3. ✅ **Start with quick tests** - Use `test:perf:quick` to validate setup
4. ✅ **Scale up gradually** - CORE → EXTENDED → FULL as needed
5. ❌ **Don't run FULL tests in CI** - Too slow for regular feedback

## Query Selection Rationale

### Why these 8 for CORE?

The CORE set was chosen to represent:
1. **Different field types:** author, title, abstract, full-text
2. **Different result sizes:** Specific bibcode (1 result) vs year range (millions)
3. **Different complexity:** Simple keyword vs nested citations
4. **Common patterns:** ~70% of real user queries use these patterns
5. **Performance profiles:** Mix of fast (bibcode) and slow (full-text) queries

### Why separate EXTENDED?

EXTENDED adds:
- Less common but important patterns (arxiv, affiliation)
- Boolean operators (OR, NOT)
- Complex citation/reference queries
- Multi-field combinations

These are important for comprehensive testing but occur less frequently in real usage.

## Troubleshooting

### Tests taking too long?

```bash
# Use fewer samples
npm run test:perf:quick  # 20 samples

# Use CORE set
npm run test:perf  # 8 queries instead of 26

# Reduce warmup
WARMUP_RUNS=5 npm run test:perf

# Disable web vitals
CAPTURE_WEB_VITALS=false npm run test:perf
```

### Need more coverage?

```bash
# Step up to EXTENDED
npm run test:perf:extended

# Or go full
npm run test:perf:full

# But maybe with fewer samples for speed
PERF_QUERY_SET=full npm run test:perf:quick  # 20 samples × 26 queries
```

## Summary

- **Default:** CORE set (8 queries) - balanced coverage and speed
- **Quick check:** `npm run test:perf:quick` - 10-15 min
- **Regular testing:** `npm run test:perf:200` - 1-2 hours with CORE
- **Release baselines:** `npm run test:perf:full:200` - 8-12 hours (run overnight)

Most of the time, **CORE is all you need**. Save FULL for important baselines.
