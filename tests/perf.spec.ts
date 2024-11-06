import {test, TestContext} from '../test-base';
import {queries} from '../queries';
import {makePrefix} from '../utils';
import {throttlePage} from '../throttle';

type Query = (typeof queries)[number];

test.describe('ui.adsabs.harvard.edu', () => {
  test.use({
    baseURL: 'https://devui.adsabs.harvard.edu',
  });

  const perfTest = async (
    prefix: string,
    { page, performance }: Pick<TestContext, 'page' | 'performance'>,
    { query }: Query,
  ) => {
    performance.sampleStart(`${prefix}.pre-load`);
    await page.goto('/', { waitUntil: 'commit' });
    await page.fill('input[name="q"]', query);
    performance.sampleStart(`${prefix}.post-load`);
    await page.getByLabel('submit').click();
    await page.waitForSelector('h3.s-results-title');
    performance.sampleEnd(`${prefix}.pre-load`);
    performance.sampleEnd(`${prefix}.post-load`);
  };

  for (const { description, name, query } of queries) {
    const prefix = makePrefix('bbb', name, 'normal');
    test(prefix, async ({ page, performance }) => {
      await perfTest(prefix, { page, performance }, { query, name, description });
    });
  }

  for (const { description, name, query } of queries) {
    const prefix = makePrefix('bbb', name, '3g-4x');
    test(prefix, async ({ page, performance, context }) => {
      await throttlePage(context, page, '3g-4x');
      await perfTest(prefix, { page, performance }, { query, name, description });
    });
  }

  for (const { description, name, query } of queries) {
    const prefix = makePrefix('bbb', name, 'eth-2x');
    test(prefix, async ({ page, performance, context }) => {
      await throttlePage(context, page, 'eth-2x');
      await perfTest(prefix, { page, performance }, { query, name, description });
    });
  }
});

test.describe('scixplorer.org', () => {
  test.use({
    baseURL: 'https://dev.scixplorer.org',
  });

  const perfTest = async (
    prefix: string,
    { page, performance }: Pick<TestContext, 'page' | 'performance'>,
    { query }: Query,
  ) => {
    performance.sampleStart(`${prefix}.pre-load`);
    await page.goto('/', { waitUntil: 'commit' });
    await page.getByTestId('search-input').fill(query);
    performance.sampleStart(`${prefix}.post-load`);
    await page.getByTestId('search-submit').click();
    await page.waitForSelector('#results a>span');
    performance.sampleEnd(`${prefix}.pre-load`);
    performance.sampleEnd(`${prefix}.post-load`);
  };

  for (const { description, name, query } of queries) {
    const prefix = makePrefix('scix', name, 'normal');
    test(prefix, async ({ page, performance }) => {
      await perfTest(prefix, { page, performance }, { query, name, description });
    });
  }

  for (const { description, name, query } of queries) {
    const prefix = makePrefix('scix', name, '3g-4x');
    test(prefix, async ({ page, performance, context }) => {
      await throttlePage(context, page, '3g-4x');
      await perfTest(prefix, { page, performance }, { query, name, description });
    });
  }

  for (const { description, name, query } of queries) {
    const prefix = makePrefix('scix', name, 'eth-2x');
    test(prefix, async ({ page, performance, context }) => {
      await throttlePage(context, page, 'eth-2x');
      await perfTest(prefix, { page, performance }, { query, name, description });
    });
  }
});
