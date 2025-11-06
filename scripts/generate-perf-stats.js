#!/usr/bin/env node

/**
 * Generate detailed performance statistics from raw performance samples
 *
 * This script:
 * 1. Reads raw performance samples (JSON or JSONL)
 * 2. Groups samples by test and metric
 * 3. Calculates comprehensive statistics (mean, median, std dev, percentiles)
 * 4. Outputs detailed CSV with all statistics
 *
 * Usage:
 *   node generate-perf-stats.js [input-file] [output-file]
 *   node generate-perf-stats.js perf-results/performance-samples.json stats-detailed.csv
 */

const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

// === Configuration ===
const inputFile = process.argv[2] || 'perf-results/performance-samples.json';
const outputFile = process.argv[3] || 'performance-stats-detailed.csv';
const summaryFile = outputFile.replace('.csv', '-summary.csv');

// === Statistics Functions ===

function calculateStats(values) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // Mean
  const mean = values.reduce((a, b) => a + b, 0) / n;

  // Median
  const median =
    n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  // Variance and standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (relative standard deviation as percentage)
  const cv = mean !== 0 ? (stdDev / mean) * 100 : 0;

  // Percentile function
  const getPercentile = (p) => {
    const index = Math.ceil((p / 100) * n) - 1;
    return sorted[Math.max(0, Math.min(index, n - 1))];
  };

  return {
    mean: round(mean),
    median: round(median),
    stdDev: round(stdDev),
    min: round(sorted[0]),
    max: round(sorted[n - 1]),
    p50: round(getPercentile(50)),
    p90: round(getPercentile(90)),
    p95: round(getPercentile(95)),
    p99: round(getPercentile(99)),
    n,
    variance: round(variance),
    cv: round(cv, 2),
  };
}

function round(value, decimals = 1) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// === Data Loading ===

function loadSamples(filepath) {
  console.log(`Loading samples from: ${filepath}`);

  // Check if file exists
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  const content = fs.readFileSync(filepath, 'utf-8');

  // Check if file is empty
  if (!content.trim()) {
    throw new Error(`File is empty: ${filepath}`);
  }

  const ext = path.extname(filepath);

  let samples;
  try {
    if (ext === '.jsonl') {
      // JSONL format (one JSON object per line)
      samples = content
        .split('\n')
        .filter((line) => line.trim())
        .map((line, index) => {
          try {
            return JSON.parse(line);
          } catch (e) {
            throw new Error(`Invalid JSON on line ${index + 1}: ${e.message}`);
          }
        });
    } else {
      // Regular JSON format
      samples = JSON.parse(content);
    }
  } catch (e) {
    throw new Error(`Failed to parse ${ext || 'JSON'} file: ${e.message}`);
  }

  // Validate that samples is an array
  if (!Array.isArray(samples)) {
    throw new Error(`Expected samples to be an array, got ${typeof samples}`);
  }

  console.log(`Loaded ${samples.length} samples`);
  return samples;
}

// === Data Aggregation ===

function aggregateSamples(samples) {
  const aggregated = {};

  for (const sample of samples) {
    const { test, metric, duration, resultCount, refinedResultCount } = sample;

    const key = `${test}|${metric}`;
    if (!aggregated[key]) {
      aggregated[key] = {
        test,
        metric,
        values: [],
        resultCounts: [],
        refinedResultCounts: [],
        app: sample.app,
        throttling: sample.throttling,
        queryType: sample.queryType,
      };
    }

    aggregated[key].values.push(duration);

    if (resultCount !== undefined && resultCount !== null) {
      aggregated[key].resultCounts.push(resultCount);
    }
    if (refinedResultCount !== undefined && refinedResultCount !== null) {
      aggregated[key].refinedResultCounts.push(refinedResultCount);
    }
  }

  return aggregated;
}

// === CSV Generation ===

function generateDetailedCSV(aggregated, outputPath) {
  console.log(`\nGenerating detailed CSV: ${outputPath}`);

  const headers = [
    { id: 'test', title: 'Test' },
    { id: 'metric', title: 'Metric' },
    { id: 'mean', title: 'Mean (ms)' },
    { id: 'median', title: 'Median (ms)' },
    { id: 'stdDev', title: 'Std Dev (ms)' },
    { id: 'cv', title: 'CV (%)' },
    { id: 'min', title: 'Min (ms)' },
    { id: 'max', title: 'Max (ms)' },
    { id: 'p50', title: 'P50 (ms)' },
    { id: 'p90', title: 'P90 (ms)' },
    { id: 'p95', title: 'P95 (ms)' },
    { id: 'p99', title: 'P99 (ms)' },
    { id: 'n', title: 'Sample Size' },
    { id: 'avgResultCount', title: 'Avg Result Count' },
    { id: 'avgRefinedResultCount', title: 'Avg Refined Result Count' },
  ];

  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: headers,
  });

  const records = [];

  for (const key in aggregated) {
    const data = aggregated[key];
    const stats = calculateStats(data.values);

    if (!stats) continue;

    const avgResultCount =
      data.resultCounts.length > 0
        ? Math.round(data.resultCounts.reduce((a, b) => a + b, 0) / data.resultCounts.length)
        : '';

    const avgRefinedResultCount =
      data.refinedResultCounts.length > 0
        ? Math.round(
            data.refinedResultCounts.reduce((a, b) => a + b, 0) / data.refinedResultCounts.length
          )
        : '';

    records.push({
      test: data.test,
      metric: data.metric,
      mean: stats.mean,
      median: stats.median,
      stdDev: stats.stdDev,
      cv: stats.cv,
      min: stats.min,
      max: stats.max,
      p50: stats.p50,
      p90: stats.p90,
      p95: stats.p95,
      p99: stats.p99,
      n: stats.n,
      avgResultCount,
      avgRefinedResultCount,
    });
  }

  // Sort records by test name and metric
  records.sort((a, b) => {
    if (a.test < b.test) return -1;
    if (a.test > b.test) return 1;
    if (a.metric < b.metric) return -1;
    if (a.metric > b.metric) return 1;
    return 0;
  });

  return csvWriter.writeRecords(records).then(() => {
    console.log(`✅ Detailed CSV written: ${records.length} rows`);
    return records;
  });
}

function generateSummaryCSV(aggregated, outputPath) {
  console.log(`\nGenerating summary CSV: ${outputPath}`);

  // Group by test
  const testGroups = {};

  for (const key in aggregated) {
    const data = aggregated[key];
    const stats = calculateStats(data.values);

    if (!stats) continue;

    if (!testGroups[data.test]) {
      testGroups[data.test] = { testName: data.test };
    }

    // Use median for summary (more robust than mean)
    testGroups[data.test][`${data.metric}_median`] = stats.median;
    testGroups[data.test][`${data.metric}_p95`] = stats.p95;
  }

  // Dynamically create headers based on available metrics
  const allMetrics = new Set();
  for (const key in aggregated) {
    allMetrics.add(aggregated[key].metric);
  }

  const headers = [
    { id: 'testName', title: 'Test Name' },
    ...Array.from(allMetrics).flatMap((metric) => [
      { id: `${metric}_median`, title: `${metric} Median (ms)` },
      { id: `${metric}_p95`, title: `${metric} P95 (ms)` },
    ]),
  ];

  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: headers,
  });

  const records = Object.values(testGroups);

  // Sort by test name
  records.sort((a, b) => (a.testName < b.testName ? -1 : 1));

  return csvWriter.writeRecords(records).then(() => {
    console.log(`✅ Summary CSV written: ${records.length} rows`);
  });
}

// === Main Execution ===

async function main() {
  try {
    console.log('=== Performance Statistics Generator ===\n');

    // Load samples
    const samples = loadSamples(inputFile);

    if (samples.length === 0) {
      console.error('❌ No samples found in input file');
      process.exit(1);
    }

    // Aggregate samples
    console.log('\nAggregating samples by test and metric...');
    const aggregated = aggregateSamples(samples);
    console.log(`Aggregated into ${Object.keys(aggregated).length} test-metric combinations`);

    // Generate detailed CSV
    const records = await generateDetailedCSV(aggregated, outputFile);

    // Generate summary CSV
    await generateSummaryCSV(aggregated, summaryFile);

    // Print summary statistics
    console.log('\n=== Summary Statistics ===');
    console.log(`Total samples processed: ${samples.length}`);
    console.log(`Unique test-metric combinations: ${Object.keys(aggregated).length}`);

    // Print sample statistics for first few tests
    console.log('\n=== Sample Results (first 5) ===');
    records.slice(0, 5).forEach((record) => {
      console.log(
        `${record.test} - ${record.metric}: ${record.median}ms (±${record.stdDev}ms, n=${record.n})`
      );
    });

    console.log('\n✅ Done!');
    console.log(`\nOutput files:`);
    console.log(`  - Detailed: ${outputFile}`);
    console.log(`  - Summary:  ${summaryFile}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
