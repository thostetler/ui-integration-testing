import { queries } from '../../queries';
import { test, TestContext } from '../../test-base';
import { throttlePage } from '../../throttle';
import {makePrefix} from '../../utils';

test.use({
  baseURL: 'https://dev.scixplorer.org',
  trace: 'on-first-retry',
});

type Query = (typeof queries)[number];

const perfTest = async (
  prefix: string,
  { page, performance }: Pick<TestContext, 'page' | 'performance'>,
  { query, name }: Query,
) => {
  performance.sampleStart(`${prefix}.landing.pre-load.${name}`);
  await page.goto('/', { waitUntil: 'commit' });
  await page.getByTestId('search-input').fill(query);
  performance.sampleStart(`${prefix}.landing.post-load.${name}`);
  await page.getByTestId('search-submit').click();
  await page.waitForSelector('#results a>span');
  performance.sampleEnd(`${prefix}.landing.pre-load.${name}`);
  performance.sampleEnd(`${prefix}.landing.post-load.${name}`);
};

for (const { description, name, query } of queries) {
  const prefix = makePrefix('scix', name, 'normal');
  test(prefix, async ({ page, performance }) => {
    await perfTest(
      prefix,
      { page, performance },
      { query, name, description },
    );
  });
}

for (const { description, name, query } of queries) {
  const prefix = makePrefix('scix', name, '3g-4x');
  test(prefix, {tag: ['@throttled', '@3g-4x']},
    async ({ page, performance, context }) => {
      test.slow();
      await throttlePage(context, page, '3g-4x');
      await perfTest(
        prefix,
        { page, performance },
        { query, name, description },
      );
    },
  );
}

for (const { description, name, query } of queries) {
  const prefix = makePrefix('scix', name, 'eth-2x');
  test(prefix, {tag: ['@throttled', '@eth-2x']},
    async ({ page, performance, context }) => {
      test.slow();
      await throttlePage(context, page, 'eth-2x');
      await perfTest(
        prefix,
        { page, performance },
        { query, name, description },
      );
    },
  );
}

