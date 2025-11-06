import fs from 'fs';
import path from 'path';

/**
 * Interface for a single performance sample with metadata
 */
export interface PerformanceSample {
  test: string;
  metric: string;
  duration: number;
  timestamp: number;
  resultCount?: number;
  refinedResultCount?: number;
  queryType?: string;
  app?: string;
  throttling?: string;
}

/**
 * Enhanced performance recorder that captures individual run data
 * instead of just averages, enabling statistical analysis
 */
export class EnhancedPerformanceRecorder {
  private samples: PerformanceSample[] = [];
  private startTimes: Map<string, number> = new Map();
  private resultsDir: string;
  private lastAppendedCount: number = 0; // Track how many samples have been appended to JSONL
  private currentTestSampleIndices: Map<string, number[]> = new Map(); // Track sample indices per test

  constructor(resultsDir: string = './perf-results') {
    this.resultsDir = resultsDir;
    // Ensure the results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  /**
   * Start timing for a specific metric
   */
  sampleStart(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  /**
   * End timing for a specific metric and record the sample
   */
  sampleEnd(name: string, metadata?: Partial<PerformanceSample>): void {
    const endTime = performance.now();
    const startTime = this.startTimes.get(name);

    if (startTime === undefined) {
      console.warn(`No start time found for metric: ${name}`);
      return;
    }

    const duration = endTime - startTime;

    // Parse the metric name (format: app.testName.throttling.metricType)
    const parts = name.split('.');
    const [app, testName, throttling, metric] = parts.length >= 4
      ? parts
      : ['unknown', 'unknown', 'unknown', name];

    const testKey = `${app}.${testName}.${throttling}`;
    const sample: PerformanceSample = {
      test: testKey,
      metric,
      duration,
      timestamp: Date.now(),
      app,
      throttling,
      queryType: testName,
      ...metadata,
    };

    const sampleIndex = this.samples.length;
    this.samples.push(sample);
    this.startTimes.delete(name);

    // Track this sample index for the test
    if (!this.currentTestSampleIndices.has(testKey)) {
      this.currentTestSampleIndices.set(testKey, []);
    }
    this.currentTestSampleIndices.get(testKey)!.push(sampleIndex);
  }

  /**
   * Record a pre-measured value (e.g., Web Vitals that are already measured)
   */
  recordValue(name: string, duration: number, metadata?: Partial<PerformanceSample>): void {
    // Parse the metric name (format: app.testName.throttling.metricType)
    const parts = name.split('.');
    const [app, testName, throttling, metric] = parts.length >= 4
      ? parts
      : ['unknown', 'unknown', 'unknown', name];

    const testKey = `${app}.${testName}.${throttling}`;
    const sample: PerformanceSample = {
      test: testKey,
      metric,
      duration,
      timestamp: Date.now(),
      app,
      throttling,
      queryType: testName,
      ...metadata,
    };

    const sampleIndex = this.samples.length;
    this.samples.push(sample);

    // Track this sample index for the test
    if (!this.currentTestSampleIndices.has(testKey)) {
      this.currentTestSampleIndices.set(testKey, []);
    }
    this.currentTestSampleIndices.get(testKey)!.push(sampleIndex);
  }

  /**
   * Record metadata for the current test run (for result counts, etc.)
   * Updates all samples recorded for this test since the last metadata call
   */
  recordMetadata(testName: string, metadata: { resultCount?: number; refinedResultCount?: number }): void {
    const indices = this.currentTestSampleIndices.get(testName);
    if (!indices || indices.length === 0) {
      console.warn(`No samples found for test: ${testName}`);
      return;
    }

    // Update all samples for this test run
    indices.forEach(index => {
      const sample = this.samples[index];
      if (sample) {
        if (metadata.resultCount !== undefined) {
          sample.resultCount = metadata.resultCount;
        }
        if (metadata.refinedResultCount !== undefined) {
          sample.refinedResultCount = metadata.refinedResultCount;
        }
      }
    });

    // Clear the tracked indices for this test now that metadata is recorded
    this.currentTestSampleIndices.delete(testName);
  }

  /**
   * Get all recorded samples
   */
  getSamples(): PerformanceSample[] {
    return [...this.samples];
  }

  /**
   * Export samples as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(this.samples, null, 2);
  }

  /**
   * Save samples to a JSON file
   */
  saveToFile(filename: string = 'performance-samples.json'): void {
    const filepath = path.join(this.resultsDir, filename);
    fs.writeFileSync(filepath, this.exportAsJSON(), 'utf-8');
    console.log(`Performance samples saved to ${filepath}`);
  }

  /**
   * Append new samples to a JSONL (JSON Lines) file for incremental recording
   * Only appends samples that haven't been appended yet
   */
  appendToJSONL(filename: string = 'performance-samples.jsonl'): void {
    const filepath = path.join(this.resultsDir, filename);

    // Only append samples that haven't been appended yet
    const newSamples = this.samples.slice(this.lastAppendedCount);
    if (newSamples.length === 0) {
      return; // Nothing new to append
    }

    const lines = newSamples.map(sample => JSON.stringify(sample)).join('\n') + '\n';
    fs.appendFileSync(filepath, lines, 'utf-8');

    // Update the count of appended samples
    this.lastAppendedCount = this.samples.length;
  }

  /**
   * Clear all recorded samples (useful between test runs)
   */
  clear(): void {
    this.samples = [];
    this.startTimes.clear();
    this.currentTestSampleIndices.clear();
    this.lastAppendedCount = 0;
  }

  /**
   * Get sample count
   */
  getSampleCount(): number {
    return this.samples.length;
  }

  /**
   * Get samples grouped by test and metric
   */
  getSamplesGrouped(): Map<string, PerformanceSample[]> {
    const grouped = new Map<string, PerformanceSample[]>();

    this.samples.forEach(sample => {
      const key = `${sample.test}.${sample.metric}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(sample);
    });

    return grouped;
  }
}

/**
 * Global instance for easy access
 */
let globalRecorder: EnhancedPerformanceRecorder | null = null;

/**
 * Get or create the global recorder instance
 */
export function getGlobalRecorder(): EnhancedPerformanceRecorder {
  if (!globalRecorder) {
    globalRecorder = new EnhancedPerformanceRecorder();
  }
  return globalRecorder;
}

/**
 * Reset the global recorder
 */
export function resetGlobalRecorder(): void {
  globalRecorder = null;
}
