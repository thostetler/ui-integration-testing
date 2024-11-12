import {test, TestContext} from './test-base';
import {queries} from './queries';
import {makePrefix} from './utils';
import {throttlePage} from './throttle';
import {expect} from '@playwright/test';

type Query = (typeof queries)[number];

/**
 * Runs a performance test for the search functionality.
 *
 * @param prefix - A string prefix for performance sample names.
 * @param selectors - An object containing the selectors for the search bar, search button, and search results.
 * @param context - An object containing the page and performance context.
 * @param {Query} query - The search query to be used in the test.
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
 *
 * Timings Legend:
 * TTRL: Time To Results from Load
 * TTRS: Time To Results from Search
 * TTSBI: Time To Search Bar Interactive
 * TTRR: Time To Results from Refinement
 */
const perfTest = async (
  prefix: string,
  { searchBarSelector, searchResultsSelector, searchButtonSelector}: { searchBarSelector: string, searchButtonSelector: string, searchResultsSelector: string },
  { page, performance }: Pick<TestContext, 'page' | 'performance'>,
  { query, refinement }: Query,
) => {
  performance.sampleStart(`${prefix}.TTRL`);
  performance.sampleStart(`${prefix}.TTSBI`);

  await page.goto('/', { waitUntil: 'load' });
  await page.waitForSelector(searchBarSelector, { state: 'visible' });
  performance.sampleEnd(`${prefix}.TTSBI`);

  await page.locator(searchBarSelector).fill(query);
  await page.locator(searchButtonSelector).click();
  performance.sampleStart(`${prefix}.TTRS`);
  await page.waitForSelector(searchResultsSelector, { state: 'visible' });
  performance.sampleEnd(`${prefix}.TTRS`);
  performance.sampleEnd(`${prefix}.TTRL`);

  performance.sampleStart(`${prefix}.TTRR`);
  await page.locator(searchBarSelector).fill(`${query} ${refinement}`);
  await page.locator(searchButtonSelector).click();
  await page.waitForSelector(searchResultsSelector, { state: 'visible' });
  performance.sampleEnd(`${prefix}.TTRR`);
};

test.describe('scixplorer.org', () => {
  test.use({ baseURL: 'https://dev.scixplorer.org' });

  // scix selectors
  const selectors = {
    searchBarSelector: '[data-testid="search-input"]',
    searchButtonSelector: '[data-testid="search-submit"]',
    searchResultsSelector: '#results a>span'
  }

  for (const {description, name, query, refinement} of queries) {
    const prefix = makePrefix('scix', name, 'normal');
    test(prefix, async ({page, performance}) => {
      await perfTest(prefix, selectors, {page, performance}, {query, name, description, refinement });
    });
  }
})

test.describe('ui.adsabs.harvard.edu', () => {
  test.use({ baseURL: 'https://dev.adsabs.harvard.edu' });

  // bbb selectors
  const selectors = {
    searchBarSelector: 'input[name="q"]',
    searchButtonSelector: 'button.s-search-submit',
    searchResultsSelector: 'h3.s-results-title'
  }

  for (const {description, name, query, refinement} of queries) {
    const prefix = makePrefix('bbb', name, 'normal');
    test(prefix, async ({page, performance}) => {
      await perfTest(prefix, selectors, {page, performance}, {query, name, description, refinement });
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
