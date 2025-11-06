import { test, TestContext } from './test-base';
import { queries } from './queries';
import { makePrefix } from './utils';
import { throttlePage } from './throttle';
import { getGlobalRecorder, EnhancedPerformanceRecorder } from './performance-recorder';
import { captureWebVitalsAfterLoad, formatWebVitals } from './web-vitals';

type Query = (typeof queries)[number];

// Get the enhanced performance recorder
const enhancedRecorder = getGlobalRecorder();

// Number of warmup iterations before recording actual measurements
const WARMUP_ITERATIONS = Number(process.env.WARMUP_RUNS || 10);

// Whether to capture web vitals (can be disabled for faster runs)
const CAPTURE_WEB_VITALS = process.env.CAPTURE_WEB_VITALS !== 'false';

/**
 * Runs a performance test for the search functionality.
 *
 * @param prefix - A string prefix for performance sample names.
 * @param selectors - An object containing the selectors for the search bar, search button, and search results.
 * @param context - An object containing the page and performance context.
 * @param {Query} query - The search query to be used in the test.
 * @param recordResults - Whether to record this run (false for warmup runs)
 *
 * The test performs the following steps:
 * 1. Starts performance sampling for Time to Render Load (TTRL) and Time to Search Bar Input (TTSBI).
 * 2. Navigates to the home page and waits for the DOM content to be loaded.
 * 3. Verifies that the search input is editable.
 * 4. Ends the performance sampling for TTSBI.
 * 5. Fills the search input with the query and clicks the search button.
 * 6. Starts performance sampling for Time to Render Search (TTRS).
 * 7. Waits for the search results page to load and the results to be displayed.
 * 8. Ends the performance sampling for TTRS and TTRL.
 * 9. Refines the search and measures TTRR (Time To Results from Refinement)
 *
 * Timings Legend:
 * TTRL: Time To Results from Load
 * TTRS: Time To Results from Search
 * TTSBI: Time To Search Bar Interactive
 * TTRR: Time To Results from Refinement
 */
const perfTest = async (
  prefix: string,
  {
    searchBarSelector,
    searchResultsSelector,
    searchButtonSelector,
  }: { searchBarSelector: string; searchButtonSelector: string; searchResultsSelector: string },
  { page, performance }: Pick<TestContext, 'page' | 'performance'>,
  { query, refinement }: Query,
  recordResults: boolean = true,
) => {
  // Use both the standard performance API and enhanced recorder
  performance.sampleStart(`${prefix}.TTRL`);
  performance.sampleStart(`${prefix}.TTSBI`);
  if (recordResults) {
    enhancedRecorder.sampleStart(`${prefix}.TTRL`);
    enhancedRecorder.sampleStart(`${prefix}.TTSBI`);
  }

  await page.goto('/', { waitUntil: 'load' });
  await page.waitForSelector(searchBarSelector, { state: 'visible' });

  performance.sampleEnd(`${prefix}.TTSBI`);
  if (recordResults) {
    enhancedRecorder.sampleEnd(`${prefix}.TTSBI`);
  }

  // Capture web vitals after initial page load
  if (recordResults && CAPTURE_WEB_VITALS) {
    const vitals = await captureWebVitalsAfterLoad(page);
    console.log(`${prefix} - ${formatWebVitals(vitals)}`);

    // Record vitals as separate metrics using recordValue (they're pre-measured)
    if (vitals.LCP) enhancedRecorder.recordValue(`${prefix}.LCP`, vitals.LCP);
    if (vitals.FCP) enhancedRecorder.recordValue(`${prefix}.FCP`, vitals.FCP);
    if (vitals.TTFB) enhancedRecorder.recordValue(`${prefix}.TTFB`, vitals.TTFB);
    if (vitals.FID) enhancedRecorder.recordValue(`${prefix}.FID`, vitals.FID);
    if (vitals.CLS) enhancedRecorder.recordValue(`${prefix}.CLS`, vitals.CLS);
  }

  await page.locator(searchBarSelector).fill(query);
  await page.locator(searchButtonSelector).click();
  performance.sampleStart(`${prefix}.TTRS`);
  if (recordResults) {
    enhancedRecorder.sampleStart(`${prefix}.TTRS`);
  }

  await page.waitForSelector(searchResultsSelector, { state: 'visible' });
  performance.sampleEnd(`${prefix}.TTRS`);
  performance.sampleEnd(`${prefix}.TTRL`);
  if (recordResults) {
    enhancedRecorder.sampleEnd(`${prefix}.TTRS`);
    enhancedRecorder.sampleEnd(`${prefix}.TTRL`);
  }

  // Capture initial result count
  const initialResultCount = await page.locator(searchResultsSelector).count();
  if (recordResults) {
    console.log(`${prefix} - Initial results: ${initialResultCount}`);
  }

  // IMPROVED TTRR: Wait for actual content change, not just visibility toggle
  performance.sampleStart(`${prefix}.TTRR`);
  if (recordResults) {
    enhancedRecorder.sampleStart(`${prefix}.TTRR`);
  }

  await page.locator(searchBarSelector).fill(`${query} ${refinement}`);
  await page.locator(searchButtonSelector).click();

  // Wait for results to actually change (count changes)
  await page.waitForFunction(
    ({ selector, initialCount }) => {
      const elements = document.querySelectorAll(selector);
      const currentCount = elements.length;
      // Results have changed when count is different and non-zero
      return currentCount !== initialCount && currentCount > 0;
    },
    { selector: searchResultsSelector, initialCount: initialResultCount },
    { timeout: 10000 }
  );

  performance.sampleEnd(`${prefix}.TTRR`);
  if (recordResults) {
    enhancedRecorder.sampleEnd(`${prefix}.TTRR`);
  }

  // Capture refined result count
  const refinedResultCount = await page.locator(searchResultsSelector).count();
  if (recordResults) {
    console.log(`${prefix} - Refined results: ${refinedResultCount}`);

    // Record metadata with result counts
    enhancedRecorder.recordMetadata(prefix, {
      resultCount: initialResultCount,
      refinedResultCount: refinedResultCount,
    });
  }

  return {
    initialResultCount,
    refinedResultCount,
  };
};

test.describe('scixplorer.org', { tag: '@perf' }, () => {
  test.use({ baseURL: 'https://dev.scixplorer.org' });

  // scix selectors
  const selectors = {
    searchBarSelector: '[data-testid="search-input"]',
    searchButtonSelector: '[data-testid="search-submit"]',
    searchResultsSelector: '#results a>span',
  };

  for (const { description, name, query, refinement } of queries) {
    const prefix = makePrefix('scix', name, 'normal');
    test(prefix, async ({ page, performance }) => {
      test.setTimeout(30000); // Increased timeout for warmup + actual test

      // Run warmup iterations (results not recorded)
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        await perfTest(prefix, selectors, { page, performance }, { query, name, description, refinement }, false);
      }

      // Run actual measured test
      await perfTest(prefix, selectors, { page, performance }, { query, name, description, refinement }, true);
    });

    const throttledPrefix = makePrefix('scix', name, '6x-cpu');
    test(throttledPrefix, async ({ page, performance, context }) => {
      test.slow();
      await throttlePage(context, page, '6x');

      // Run warmup iterations (results not recorded)
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        await perfTest(throttledPrefix, selectors, { page, performance }, { query, name, description, refinement }, false);
      }

      // Run actual measured test
      await perfTest(throttledPrefix, selectors, { page, performance }, { query, name, description, refinement }, true);
    });
  }
});

test.describe('ui.adsabs.harvard.edu', () => {
  test.use({ baseURL: 'https://dev.adsabs.harvard.edu' });

  // bbb selectors
  const selectors = {
    searchBarSelector: 'input[name="q"]',
    searchButtonSelector: 'button.s-search-submit',
    searchResultsSelector: 'h3.s-results-title',
  };

  for (const { description, name, query, refinement } of queries) {
    const prefix = makePrefix('bbb', name, 'normal');
    test(prefix, async ({ page, performance }) => {
      test.setTimeout(30000); // Increased timeout for warmup + actual test

      // Run warmup iterations (results not recorded)
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        await perfTest(prefix, selectors, { page, performance }, { query, name, description, refinement }, false);
      }

      // Run actual measured test
      await perfTest(prefix, selectors, { page, performance }, { query, name, description, refinement }, true);
    });

    const throttledPrefix = makePrefix('bbb', name, '6x-cpu');
    test(throttledPrefix, async ({ page, performance, context }) => {
      test.slow();
      await throttlePage(context, page, '6x');

      // Run warmup iterations (results not recorded)
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        await perfTest(throttledPrefix, selectors, { page, performance }, { query, name, description, refinement }, false);
      }

      // Run actual measured test
      await perfTest(throttledPrefix, selectors, { page, performance }, { query, name, description, refinement }, true);
    });
  }
});

// test.describe('ui.adsabs.harvard.edu', () => {
//   test.use({
//     baseURL: 'https://devui.adsabs.harvard.edu',
//   });
//
//   const perfTest = async (
//     prefix: string,
//     {page, performance}: Pick<TestContext, 'page' | 'performance'>,
//     {query, name}: Query,
//   ) => {
//     performance.sampleStart(`${prefix}.pre-load`);
//     await page.goto('/', {waitUntil: 'domcontentloaded'});
//     await page.fill('input[name="q"]', query);
//     performance.sampleStart(`${prefix}.post-load`);
//     await page.getByLabel('submit').click();
//     await page.waitForSelector('h3.s-results-title');
//     performance.sampleEnd(`${prefix}.pre-load`);
//     performance.sampleEnd(`${prefix}.post-load`);
//   };
//
//   for (const {description, name, query} of queries) {
//     const prefix = makePrefix('bbb', name, 'normal');
//     test(prefix, async ({page, performance}) => {
//       await perfTest(prefix, {page, performance}, {query, name, description});
//     });
//   }
//
//   for (const {description, name, query} of queries) {
//     const prefix = makePrefix('bbb', name, '3g-4x');
//     test(prefix, async ({page, performance, context}) => {
//       test.slow();
//       await throttlePage(context, page, '3g-4x');
//       await perfTest(prefix, {page, performance}, {query, name, description});
//     });
//   }
//
//   for (const {description, name, query} of queries) {
//     const prefix = makePrefix('bbb', name, 'eth-2x');
//     test(prefix, async ({page, performance, context}) => {
//       test.slow();
//       await throttlePage(context, page, 'eth-2x');
//       await perfTest(prefix, {page, performance}, {query, name, description});
//     });
//   }
// });
//
// test.describe('scixplorer.org', () => {
//   test.use({
//     baseURL: 'https://dev.scixplorer.org',
//   });
//
//   const perfTest = async (
//     prefix: string,
//     {page, performance}: Pick<TestContext, 'page' | 'performance'>,
//     {query, name}: Query,
//   ) => {
//     performance.sampleStart(`${prefix}.pre-load`);
//     await page.goto('/', {waitUntil: 'domcontentloaded'});
//     await page.getByTestId('search-input').fill(query);
//     performance.sampleStart(`${prefix}.post-load`);
//     await page.getByTestId('search-submit').click();
//     await page.waitForSelector('#results a>span');
//     performance.sampleEnd(`${prefix}.pre-load`);
//     performance.sampleEnd(`${prefix}.post-load`);
//   };
//
//   for (const {description, name, query} of queries) {
//     const prefix = makePrefix('scix', name, 'normal');
//     test(prefix, async ({page, performance}) => {
//       await perfTest(prefix, {page, performance}, {query, name, description});
//     });
//   }
//
//   for (const {description, name, query} of queries) {
//     const prefix = makePrefix('scix', name, '3g-4x');
//     test(prefix, async ({page, performance, context}) => {
//       test.slow();
//       await throttlePage(context, page, '3g-4x');
//       await perfTest(prefix, {page, performance}, {query, name, description});
//     });
//   }
//
//   for (const {description, name, query} of queries) {
//     const prefix = makePrefix('scix', name, 'eth-2x');
//     test(prefix, async ({page, performance, context}) => {
//       test.slow();
//       await throttlePage(context, page, 'eth-2x');
//       await perfTest(prefix, {page, performance}, {query, name, description});
//     });
//   }
// });

// Save enhanced performance data after all tests complete
test.afterAll(async () => {
  console.log(`\n=== Performance Test Summary ===`);
  console.log(`Total samples collected: ${enhancedRecorder.getSampleCount()}`);

  // Save to JSON file
  enhancedRecorder.saveToFile('performance-samples.json');

  // Also save as JSONL for easier streaming/processing
  enhancedRecorder.appendToJSONL('performance-samples.jsonl');

  console.log(`Performance data saved to perf-results/`);
  console.log(`=================================\n`);
});
