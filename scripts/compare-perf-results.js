#!/usr/bin/env node

/**
 * Compare two performance test results to detect regressions or improvements
 *
 * Usage:
 *   node compare-perf-results.js baseline.json current.json [output.md]
 *   node compare-perf-results.js jan-baseline.json feb-current.json comparison-report.md
 */

const fs = require('fs');
const path = require('path');

// === Configuration ===
const baselineFile = process.argv[2];
const currentFile = process.argv[3];
const outputFile = process.argv[4] || 'performance-comparison.md';

const SIGNIFICANCE_THRESHOLD = 5; // Percent change to consider significant
const REGRESSION_THRESHOLD = 10; // Percent change to flag as regression

if (!baselineFile || !currentFile) {
  console.error('Usage: node compare-perf-results.js <baseline.json> <current.json> [output.md]');
  process.exit(1);
}

// === Statistics Functions ===

function calculateStats(values) {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = mean !== 0 ? (stdDev / mean) * 100 : 0;

  const getPercentile = (p) => {
    const index = Math.ceil((p / 100) * n) - 1;
    return sorted[Math.max(0, Math.min(index, n - 1))];
  };

  return {
    mean: round(mean),
    median: round(median),
    stdDev: round(stdDev),
    min: sorted[0],
    max: sorted[n - 1],
    p95: round(getPercentile(95)),
    p99: round(getPercentile(99)),
    n,
    cv: round(cv, 2),
  };
}

function round(value, decimals = 1) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function confidenceInterval(values, confidenceLevel = 0.95) {
  const stats = calculateStats(values);
  if (!stats) return null;

  const z = confidenceLevel === 0.95 ? 1.96 : 2.576;
  const standardError = stats.stdDev / Math.sqrt(stats.n);
  const margin = z * standardError;

  return {
    lower: round(stats.mean - margin),
    upper: round(stats.mean + margin),
    margin: round(margin),
  };
}

// === Data Loading ===

function loadSamples(filepath) {
  console.log(`Loading: ${filepath}`);
  const content = fs.readFileSync(filepath, 'utf-8');
  const ext = path.extname(filepath);

  if (ext === '.jsonl') {
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } else {
    return JSON.parse(content);
  }
}

function aggregateSamples(samples) {
  const aggregated = {};

  for (const sample of samples) {
    const key = `${sample.test}|${sample.metric}`;
    if (!aggregated[key]) {
      aggregated[key] = {
        test: sample.test,
        metric: sample.metric,
        values: [],
      };
    }
    aggregated[key].values.push(sample.duration);
  }

  return aggregated;
}

// === Comparison Logic ===

function compareResults(baseline, current) {
  const comparisons = [];
  const allKeys = new Set([...Object.keys(baseline), ...Object.keys(current)]);

  for (const key of allKeys) {
    const baselineData = baseline[key];
    const currentData = current[key];

    if (!baselineData) {
      comparisons.push({
        test: currentData.test,
        metric: currentData.metric,
        status: 'NEW',
        baselineStats: null,
        currentStats: calculateStats(currentData.values),
        percentChange: null,
        isSignificant: false,
      });
      continue;
    }

    if (!currentData) {
      comparisons.push({
        test: baselineData.test,
        metric: baselineData.metric,
        status: 'REMOVED',
        baselineStats: calculateStats(baselineData.values),
        currentStats: null,
        percentChange: null,
        isSignificant: false,
      });
      continue;
    }

    const baselineStats = calculateStats(baselineData.values);
    const currentStats = calculateStats(currentData.values);

    // Use median for comparison (more robust than mean)
    const percentChange = ((currentStats.median - baselineStats.median) / baselineStats.median) * 100;

    // Check if confidence intervals overlap
    const baselineCI = confidenceInterval(baselineData.values);
    const currentCI = confidenceInterval(currentData.values);

    const isSignificant =
      Math.abs(percentChange) > SIGNIFICANCE_THRESHOLD &&
      (currentCI.lower > baselineCI.upper || currentCI.upper < baselineCI.lower);

    let status = 'UNCHANGED';
    if (isSignificant) {
      if (percentChange > REGRESSION_THRESHOLD) {
        status = 'REGRESSION';
      } else if (percentChange > 0) {
        status = 'SLOWER';
      } else if (percentChange < -REGRESSION_THRESHOLD) {
        status = 'MAJOR_IMPROVEMENT';
      } else {
        status = 'FASTER';
      }
    }

    comparisons.push({
      test: baselineData.test,
      metric: baselineData.metric,
      status,
      baselineStats,
      currentStats,
      percentChange: round(percentChange, 2),
      isSignificant,
    });
  }

  return comparisons;
}

// === Report Generation ===

function generateMarkdownReport(comparisons, outputPath) {
  const lines = [];

  lines.push('# Performance Comparison Report\n');
  lines.push(`**Generated:** ${new Date().toISOString()}\n`);
  lines.push(`**Baseline:** ${baselineFile}`);
  lines.push(`**Current:** ${currentFile}\n`);

  // Summary statistics
  const regressions = comparisons.filter((c) => c.status === 'REGRESSION');
  const improvements = comparisons.filter((c) => c.status === 'MAJOR_IMPROVEMENT');
  const slower = comparisons.filter((c) => c.status === 'SLOWER');
  const faster = comparisons.filter((c) => c.status === 'FASTER');
  const unchanged = comparisons.filter((c) => c.status === 'UNCHANGED');
  const newTests = comparisons.filter((c) => c.status === 'NEW');
  const removed = comparisons.filter((c) => c.status === 'REMOVED');

  lines.push('## Summary\n');
  lines.push(`- ⚠️  **Regressions:** ${regressions.length}`);
  lines.push(`- ⚡ **Major Improvements:** ${improvements.length}`);
  lines.push(`- 🔻 **Slightly Slower:** ${slower.length}`);
  lines.push(`- 🔺 **Slightly Faster:** ${faster.length}`);
  lines.push(`- ➡️  **Unchanged:** ${unchanged.length}`);
  lines.push(`- 🆕 **New Tests:** ${newTests.length}`);
  lines.push(`- ❌ **Removed Tests:** ${removed.length}\n`);

  // Regressions (if any)
  if (regressions.length > 0) {
    lines.push('## ⚠️ Regressions\n');
    lines.push('| Test | Metric | Baseline Median | Current Median | Change | Status |');
    lines.push('|------|--------|-----------------|----------------|--------|--------|');

    regressions.forEach((c) => {
      lines.push(
        `| ${c.test} | ${c.metric} | ${c.baselineStats.median}ms | ${c.currentStats.median}ms | +${c.percentChange}% | ⚠️ REGRESSION |`
      );
    });
    lines.push('');
  }

  // Improvements
  if (improvements.length > 0) {
    lines.push('## ⚡ Major Improvements\n');
    lines.push('| Test | Metric | Baseline Median | Current Median | Change | Status |');
    lines.push('|------|--------|-----------------|----------------|--------|--------|');

    improvements.forEach((c) => {
      lines.push(
        `| ${c.test} | ${c.metric} | ${c.baselineStats.median}ms | ${c.currentStats.median}ms | ${c.percentChange}% | ✅ IMPROVED |`
      );
    });
    lines.push('');
  }

  // Minor changes
  if (slower.length > 0 || faster.length > 0) {
    lines.push('## 📊 Minor Changes (Not Statistically Significant)\n');
    lines.push('| Test | Metric | Baseline Median | Current Median | Change |');
    lines.push('|------|--------|-----------------|----------------|--------|');

    [...slower, ...faster].forEach((c) => {
      const emoji = c.status === 'SLOWER' ? '🔻' : '🔺';
      lines.push(
        `| ${c.test} | ${c.metric} | ${c.baselineStats.median}ms | ${c.currentStats.median}ms | ${emoji} ${c.percentChange}% |`
      );
    });
    lines.push('');
  }

  // Detailed statistics
  lines.push('## 📈 Detailed Statistics\n');
  lines.push(
    '| Test | Metric | Baseline (median ± σ) | Current (median ± σ) | P95 Change | Sample Sizes |'
  );
  lines.push('|------|--------|-----------------------|----------------------|------------|--------------|');

  comparisons
    .filter((c) => c.baselineStats && c.currentStats)
    .forEach((c) => {
      const p95Change = round(
        ((c.currentStats.p95 - c.baselineStats.p95) / c.baselineStats.p95) * 100,
        1
      );
      lines.push(
        `| ${c.test} | ${c.metric} | ${c.baselineStats.median}ms ± ${c.baselineStats.stdDev}ms | ${c.currentStats.median}ms ± ${c.currentStats.stdDev}ms | ${p95Change > 0 ? '+' : ''}${p95Change}% | ${c.baselineStats.n} → ${c.currentStats.n} |`
      );
    });
  lines.push('');

  // New tests
  if (newTests.length > 0) {
    lines.push('## 🆕 New Tests\n');
    lines.push('| Test | Metric | Median | P95 | Sample Size |');
    lines.push('|------|--------|--------|-----|-------------|');

    newTests.forEach((c) => {
      lines.push(
        `| ${c.test} | ${c.metric} | ${c.currentStats.median}ms | ${c.currentStats.p95}ms | ${c.currentStats.n} |`
      );
    });
    lines.push('');
  }

  // Removed tests
  if (removed.length > 0) {
    lines.push('## ❌ Removed Tests\n');
    lines.push('| Test | Metric |');
    lines.push('|------|--------|');

    removed.forEach((c) => {
      lines.push(`| ${c.test} | ${c.metric} |`);
    });
    lines.push('');
  }

  // Write to file
  const content = lines.join('\n');
  fs.writeFileSync(outputPath, content, 'utf-8');

  return { content, regressions, improvements };
}

// === Main Execution ===

async function main() {
  try {
    console.log('=== Performance Comparison Tool ===\n');

    // Load samples
    const baselineSamples = loadSamples(baselineFile);
    const currentSamples = loadSamples(currentFile);

    console.log(`Baseline samples: ${baselineSamples.length}`);
    console.log(`Current samples: ${currentSamples.length}\n`);

    // Aggregate
    console.log('Aggregating samples...');
    const baselineAgg = aggregateSamples(baselineSamples);
    const currentAgg = aggregateSamples(currentSamples);

    // Compare
    console.log('Comparing results...\n');
    const comparisons = compareResults(baselineAgg, currentAgg);

    // Generate report
    const { regressions, improvements } = generateMarkdownReport(comparisons, outputFile);

    console.log(`✅ Report generated: ${outputFile}\n`);

    // Print summary to console
    if (regressions.length > 0) {
      console.log('⚠️  WARNING: Performance regressions detected!\n');
      regressions.forEach((r) => {
        console.log(
          `  ${r.test} - ${r.metric}: ${r.baselineStats.median}ms → ${r.currentStats.median}ms (+${r.percentChange}%)`
        );
      });
      console.log('');
    }

    if (improvements.length > 0) {
      console.log('✅ Performance improvements detected!\n');
      improvements.forEach((i) => {
        console.log(
          `  ${i.test} - ${i.metric}: ${i.baselineStats.median}ms → ${i.currentStats.median}ms (${i.percentChange}%)`
        );
      });
      console.log('');
    }

    if (regressions.length === 0 && improvements.length === 0) {
      console.log('✅ No significant performance changes detected.\n');
    }

    // Exit with error code if regressions found
    process.exit(regressions.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
