import { test, TestContext } from '../../test-base';
import { queries } from '../../queries';
import { throttlePage } from '../../throttle';
import { makePrefix } from '../../utils';

test.use({
  baseURL: 'https://devui.adsabs.harvard.edu',
  trace: 'on-first-retry',
});

type Query = (typeof queries)[number];

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
  test(prefix, { tag: ['@throttled', '@3g-4x'] }, async ({ page, performance, context }) => {
    test.slow();
    await throttlePage(context, page, '3g-4x');
    await perfTest(prefix, { page, performance }, { query, name, description });
  });
}

for (const { description, name, query } of queries) {
  const prefix = makePrefix('bbb', name, 'eth-2x');
  test(prefix, { tag: ['@throttled', '@eth-2x'] }, async ({ page, performance, context }) => {
    test.slow();
    await throttlePage(context, page, 'eth-2x');
    await perfTest(prefix, { page, performance }, { query, name, description });
  });
}
