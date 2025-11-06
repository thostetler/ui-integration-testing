import { Page } from '@playwright/test';

/**
 * Web Vitals metrics interface
 */
export interface WebVitals {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift

  // Other important metrics
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte

  // Navigation timing
  domContentLoaded?: number;
  loadComplete?: number;

  // Custom metrics
  timeToInteractive?: number;
}

/**
 * Capture Web Vitals from the page
 * Uses the Performance Observer API to get real user metrics
 */
export async function captureWebVitals(page: Page): Promise<WebVitals> {
  return await page.evaluate(() => {
    return new Promise<WebVitals>((resolve) => {
      const vitals: WebVitals = {};
      let resolved = false;

      // Timeout to ensure we don't wait forever
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(vitals);
        }
      }, 5000);

      // Capture navigation timing
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        vitals.TTFB = navigationTiming.responseStart - navigationTiming.requestStart;
        vitals.domContentLoaded = navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart;
        vitals.loadComplete = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
      }

      // Capture paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        vitals.FCP = fcpEntry.startTime;
      }

      // Track which vitals we've captured
      const captured = new Set<string>();

      const checkComplete = () => {
        // We consider it complete when we have at least FCP and navigation timing
        if (vitals.FCP && vitals.TTFB && !resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(vitals);
        }
      };

      // Use PerformanceObserver for LCP and CLS (if supported)
      if ('PerformanceObserver' in window) {
        try {
          // LCP Observer
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
            captured.add('LCP');
            checkComplete();
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

          // CLS Observer
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            vitals.CLS = clsValue;
            captured.add('CLS');
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });

          // FID Observer (First Input Delay)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const firstInput = entries[0] as any;
            vitals.FID = firstInput.processingStart - firstInput.startTime;
            captured.add('FID');
            checkComplete();
          });
          fidObserver.observe({ type: 'first-input', buffered: true });
        } catch (e) {
          // PerformanceObserver might not be fully supported
          console.warn('PerformanceObserver not fully supported:', e);
        }
      }

      // Initial check
      checkComplete();
    });
  });
}

/**
 * Wait for page to be fully loaded and stable before capturing vitals
 */
export async function captureWebVitalsAfterLoad(page: Page): Promise<WebVitals> {
  // Wait for load event
  await page.waitForLoadState('load');

  // Wait a bit more for LCP to stabilize
  await page.waitForTimeout(1000);

  return captureWebVitals(page);
}

/**
 * Format web vitals for logging
 */
export function formatWebVitals(vitals: WebVitals): string {
  const lines: string[] = ['Web Vitals:'];

  if (vitals.TTFB !== undefined) {
    lines.push(`  TTFB: ${vitals.TTFB.toFixed(1)}ms`);
  }
  if (vitals.FCP !== undefined) {
    lines.push(`  FCP: ${vitals.FCP.toFixed(1)}ms`);
  }
  if (vitals.LCP !== undefined) {
    lines.push(`  LCP: ${vitals.LCP.toFixed(1)}ms`);
  }
  if (vitals.FID !== undefined) {
    lines.push(`  FID: ${vitals.FID.toFixed(1)}ms`);
  }
  if (vitals.CLS !== undefined) {
    lines.push(`  CLS: ${vitals.CLS.toFixed(3)}`);
  }
  if (vitals.domContentLoaded !== undefined) {
    lines.push(`  DOM Content Loaded: ${vitals.domContentLoaded.toFixed(1)}ms`);
  }
  if (vitals.loadComplete !== undefined) {
    lines.push(`  Load Complete: ${vitals.loadComplete.toFixed(1)}ms`);
  }

  return lines.join('\n');
}

/**
 * Assess web vitals performance based on Google's thresholds
 */
export function assessWebVitals(vitals: WebVitals): {
  overall: 'good' | 'needs-improvement' | 'poor';
  details: Record<string, { value: number; rating: 'good' | 'needs-improvement' | 'poor' }>;
} {
  const details: Record<string, { value: number; rating: 'good' | 'needs-improvement' | 'poor' }> = {};

  // LCP thresholds: good (<2.5s), needs improvement (2.5-4s), poor (>4s)
  if (vitals.LCP !== undefined) {
    details.LCP = {
      value: vitals.LCP,
      rating: vitals.LCP <= 2500 ? 'good' : vitals.LCP <= 4000 ? 'needs-improvement' : 'poor'
    };
  }

  // FID thresholds: good (<100ms), needs improvement (100-300ms), poor (>300ms)
  if (vitals.FID !== undefined) {
    details.FID = {
      value: vitals.FID,
      rating: vitals.FID <= 100 ? 'good' : vitals.FID <= 300 ? 'needs-improvement' : 'poor'
    };
  }

  // CLS thresholds: good (<0.1), needs improvement (0.1-0.25), poor (>0.25)
  if (vitals.CLS !== undefined) {
    details.CLS = {
      value: vitals.CLS,
      rating: vitals.CLS <= 0.1 ? 'good' : vitals.CLS <= 0.25 ? 'needs-improvement' : 'poor'
    };
  }

  // FCP thresholds: good (<1.8s), needs improvement (1.8-3s), poor (>3s)
  if (vitals.FCP !== undefined) {
    details.FCP = {
      value: vitals.FCP,
      rating: vitals.FCP <= 1800 ? 'good' : vitals.FCP <= 3000 ? 'needs-improvement' : 'poor'
    };
  }

  // TTFB thresholds: good (<800ms), needs improvement (800-1800ms), poor (>1800ms)
  if (vitals.TTFB !== undefined) {
    details.TTFB = {
      value: vitals.TTFB,
      rating: vitals.TTFB <= 800 ? 'good' : vitals.TTFB <= 1800 ? 'needs-improvement' : 'poor'
    };
  }

  // Overall assessment: if any core vital is poor, overall is poor
  const coreVitals = ['LCP', 'FID', 'CLS'];
  const coreVitalsRatings = coreVitals
    .map(key => details[key]?.rating)
    .filter(Boolean);

  let overall: 'good' | 'needs-improvement' | 'poor' = 'good';
  if (coreVitalsRatings.some(r => r === 'poor')) {
    overall = 'poor';
  } else if (coreVitalsRatings.some(r => r === 'needs-improvement')) {
    overall = 'needs-improvement';
  }

  return { overall, details };
}
