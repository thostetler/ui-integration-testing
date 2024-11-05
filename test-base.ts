import { test as base } from '@playwright/test';
import type { PerformanceOptions, PerformanceWorker, PlaywrightPerformance } from 'playwright-performance';
import { playwrightPerformance } from 'playwright-performance';

const test = base.extend<PlaywrightPerformance, PerformanceOptions & PerformanceWorker>({
  performance: playwrightPerformance.performance,
  performanceOptions: [
    {
      dropResultsFromFailedTest: true,
      suppressConsoleResults: true,
    },
    { scope: 'worker' },
  ],
  worker: [playwrightPerformance.worker, { scope: 'worker', auto: true }],
});

type TestContext = Parameters<Parameters<typeof test>[2]>[0];

export { test, TestContext };
