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

    const sample: PerformanceSample = {
      test: `${app}.${testName}.${throttling}`,
      metric,
      duration,
      timestamp: Date.now(),
      app,
      throttling,
      queryType: testName,
      ...metadata,
    };

    this.samples.push(sample);
    this.startTimes.delete(name);
  }

  /**
   * Record a sample with metadata (for result counts, etc.)
   */
  recordMetadata(testName: string, metadata: { resultCount?: number; refinedResultCount?: number }): void {
    // Find recent samples for this test and update them
    const recentSamples = this.samples
      .filter(s => s.test === testName)
      .slice(-10); // Last 10 samples for this test

    recentSamples.forEach(sample => {
      if (metadata.resultCount !== undefined) {
        sample.resultCount = metadata.resultCount;
      }
      if (metadata.refinedResultCount !== undefined) {
        sample.refinedResultCount = metadata.refinedResultCount;
      }
    });
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
   * Append samples to a JSONL (JSON Lines) file for incremental recording
   */
  appendToJSONL(filename: string = 'performance-samples.jsonl'): void {
    const filepath = path.join(this.resultsDir, filename);
    const lines = this.samples.map(sample => JSON.stringify(sample)).join('\n') + '\n';
    fs.appendFileSync(filepath, lines, 'utf-8');
  }

  /**
   * Clear all recorded samples (useful between test runs)
   */
  clear(): void {
    this.samples = [];
    this.startTimes.clear();
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
