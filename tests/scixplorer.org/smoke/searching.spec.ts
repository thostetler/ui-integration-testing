import { test, expect } from '@playwright/test';

test.use({
    baseURL: 'https://dev.scixplorer.org'
})

test('Basic Searching', async ({ page }) => {
  await page.goto('/', { waitUntil: 'commit'});
  await page.getByTestId('search-input').fill('year:1978 author:"Kurtz, M."');
  expect(await page.screenshot()).toMatchSnapshot();
  await page.getByTestId('search-submit').click();
  expect(await page.getByRole('link', { name: 'Aquila X-' })).toBeVisible();
  expect(await page.screenshot()).toMatchSnapshot();
  await page.getByRole('link', { name: 'Aquila X-' }).click();
  expect(await page.getByText('Aquila X-1', { exact: true })).toBeVisible();
  expect(await page.screenshot()).toMatchSnapshot();
});