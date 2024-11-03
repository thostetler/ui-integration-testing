import { test as base } from "@playwright/test";
import type {
  PerformanceOptions,
  PerformanceWorker,
  PlaywrightPerformance,
} from "playwright-performance";
import { playwrightPerformance } from "playwright-performance";

const test = base.extend<
  PlaywrightPerformance,
  PerformanceOptions & PerformanceWorker
>({
  performance: playwrightPerformance.performance,
  performanceOptions: [{}, { scope: "worker" }],
  worker: [playwrightPerformance.worker, { scope: "worker", auto: true }],
});

export { test };
