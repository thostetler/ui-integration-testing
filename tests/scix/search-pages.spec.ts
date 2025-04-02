import { API_TIMEOUT, ROUTES } from '@/constants';
import { expect, test } from '@/setup/setup';
import { a11yCheck, ariaSnapshot, searchParamsToString, visualCheck } from '@/util/helpers';
import { configDotenv } from 'dotenv';

configDotenv();

test.use({
  baseURL: process.env.SCIX_BASE_URL,
});

const BIBCODES = [
  '2001MachL..45....5B',
  '2003PASP..115..763C',
  '2000PhRvL..85.3966P',
  '2001MNRAS.322..231K',
  '2003SIAMR..45..167N',
  '2005MNRAS.364.1105S',
  '2003AnPhy.303....2K',
  '2001JGR...106.7183T',
  '2001Natur.414..338G',
  '2003MNRAS.344.1000B',
  '2002PhLB..545...23C',
  '2003Natur.424..839V',
].sort((a, b) => b.localeCompare(a));

const QUERY_STRING = new URLSearchParams({
  q: `bibcode:${BIBCODES.join(' OR bibcode:')}`,
  sort: 'date desc, bibcode desc',
  p: '1',
});
QUERY_STRING.sort();

test('Search page loads properly', { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
  const name = 'search';
  await cacheRoute.GET('**/v1/search/query*');
  await page.goto(`${ROUTES.SEARCH}?${searchParamsToString(QUERY_STRING)}`);
  await expect(page).toHaveURL((url) => {
    const searchParams = new URLSearchParams(url.search);
    return searchParams.get('q') === QUERY_STRING.get('q') && searchParams.get('sort') === QUERY_STRING.get('sort');
  });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(async () => {
      await expect(page.locator('form')).toContainText('Your search returned 12 results');
      await expect(page.getByTestId('search-input')).toHaveValue(
        'bibcode:2005MNRAS.364.1105S OR bibcode:2003SIAMR..45..167N OR bibcode:2003PASP..115..763C OR bibcode:2003Natur.424..839V OR bibcode:2003MNRAS.344.1000B OR bibcode:2003AnPhy.303....2K OR bibcode:2002PhLB..545...23C OR bibcode:2001Natur.414..338G OR bibcode:2001MNRAS.322..231K OR bibcode:2001MachL..45....5B OR bibcode:2001JGR...106.7183T OR bibcode:2000PhRvL..85.3966P',
      );
      await expect(page.getByText('QUICK FIELD: authorfirst')).toBeVisible();
      await expect(page.getByText('Select AllBulk ActionsExplore')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible();
      await expect(page.getByTestId('pagination-label').getByRole('paragraph')).toContainText(
        'Showing 1 to 10 of 12 results',
      );
      await expect(page.getByTestId('pagination-select-page')).toContainText('1 of 2');
      await expect(page.getByRole('button', { name: 'Toggle Off Author' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Toggle Off Collections' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Toggle Off Refereed' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Toggle On Institutions' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Toggle On Keywords' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Toggle On Publications' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Toggle On Bibgroups' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Toggle On SIMBAD Objects' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Toggle On NED Objects' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Toggle On Data' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Toggle On Vizier Tables' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Toggle On Publication Type' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Show hidden filters (2)' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create email notification of' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Result list settings' })).toBeVisible();
      await expect(page.getByTestId('search-submit')).toBeVisible();
    }).toPass();
  });

  await test.step('Checking for aria regressions', async () => await ariaSnapshot(page, name));
  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test('Export tool loads properly', { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
  const name = 'export';
  await cacheRoute.GET('**/v1/search/query*');
  await cacheRoute.GET('**/v1/export**');

  await page.goto(`${ROUTES.SCIX.SEARCH_EXPORT_BIBTEX}?${QUERY_STRING.toString()}`);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(async () => {
      await expect(page.getByTestId('export-heading')).toContainText('Exporting records 1 to 12 (total: 12)');
      await expect(page.getByRole('spinbutton', { name: 'Limit Records Limit Records' })).toHaveValue('12');
      await expect(page.getByTestId('export-submit')).toBeVisible();
      await expect(page.getByTestId('export-download')).toBeVisible();
      await expect(page.getByTestId('export-copy')).toBeVisible();
      await expect(page.getByTestId('export-output')).toBeVisible();
      await expect(page.getByRole('button', { name: 'More Options' })).toBeVisible();
      await page.getByRole('button', { name: 'More Options' }).click();
      await page.getByRole('button', { name: 'More Options' }).click();
      await page.getByRole('tab', { name: 'Custom Formats' }).click();
      await expect(page.getByRole('textbox', { name: 'Enter a custom format' })).toHaveValue('%1H:%Y:%q');
      await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    }).toPass();
  });

  await test.step('Checking for aria regressions', async () => await ariaSnapshot(page, name));
  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

// TODO: author affiliation is not working
test.fixme('Author affiliation loads properly', { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
  const name = 'author-affiliation';
  await cacheRoute.GET('**/v1/search/query*');
  await cacheRoute.GET('**/v1/author-affiliation/*');

  await page.goto(`${ROUTES.SCIX.SEARCH_AUTHOR_AFFILIATION}?${QUERY_STRING.toString()}`);
  console.log(`URL: ${page.url()}`);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(async () => {
      const header = await page.getByLabel('container for search results').getByRole('heading');
      await header.waitFor({ state: 'visible', timeout: API_TIMEOUT });
      expect(await header.textContent()).toMatchSnapshot('author-affiliation-title');
      expect(await page.getByLabel('container for search results').textContent()).toMatchSnapshot(
        'author-affiliation-results',
      );
    }).toPass({
      timeout: API_TIMEOUT,
    });
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test.fixme('Citation metrics loads properly', { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
  const name = 'citation-metrics';
  await cacheRoute.GET('**/v1/search/query*');
  await cacheRoute.GET('**/v1/metrics');

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(async () => {
      await expect(page.getByRole('heading', { name: 'Papers' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Citations' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Reads' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Indices' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Number of papers' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Normalized paper count' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Number of citing papers' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Total citations' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Total number of reads' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Average number of reads' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'h-index' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'g-index' })).toBeVisible();
    }).toPass({
      // metrics takes a while
      intervals: [3000],
      timeout: API_TIMEOUT,
    });
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test.fixme('Author network loads properly', { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
  const name = 'author-network';
  await cacheRoute.GET('**/v1/search/query*');
  await cacheRoute.GET('**/v1/vis/*');

  // Increase the number of papers
  const QS = new URLSearchParams(QUERY_STRING);
  QS.set('q', 'year:2000 moon crater');

  await test.step('Open the author network tool', async () => {
    // do search and wait for results
    await page.goto(`${ROUTES.SEARCH}/${searchParamsToString(QS)}`);
    const searchRes = await page.waitForResponse(
      (res) => {
        const url = res.request().url();
        const search = new URLSearchParams(url.split('?')[1]);
        if (!search.has('fl')) return false;
        return search.get('fl').includes('bibcode');
      },
      { timeout: API_TIMEOUT },
    );
    const doc = (await searchRes.json()).response.docs[0] as { bibcode: string };
    await expect(page).toHaveURL(new RegExp(`${ROUTES.SEARCH}/${searchParamsToString(QS)}`));
    await expect(page.getByLabel('list of results')).toContainText(doc.bibcode);

    await page.getByRole('button', { name: ' Explore' }).click();
    await page.getByRole('menuitem', { name: 'Author Network' }).click();
  });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(async () => {
      await expect(page.locator('#network-viz-main-chart')).toBeVisible();
      await expect(page.getByText('select an author or group of')).toBeVisible();
      await expect(page.getByText('Author Network This network')).toBeVisible();
    }).toPass({
      timeout: API_TIMEOUT,
    });
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test.fixme('Paper network loads properly', { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
  const name = 'paper-networks';
  await cacheRoute.GET('**/v1/search/query*');
  await cacheRoute.GET('**/v1/vis/*');

  // Increase the number of papers
  const QS = new URLSearchParams(QUERY_STRING);
  QS.set('q', 'year:2000 moon crater');

  await test.step('Open the paper network tool', async () => {
    // do search and wait for results
    await page.goto(`${ROUTES.SEARCH}/${searchParamsToString(QS)}`);
    const searchRes = await page.waitForResponse(
      (res) => {
        const url = res.request().url();
        const search = new URLSearchParams(url.split('?')[1]);
        if (!search.has('fl')) return false;
        return search.get('fl').includes('bibcode');
      },
      { timeout: API_TIMEOUT },
    );
    const doc = (await searchRes.json()).response.docs[0] as { bibcode: string };
    await expect(page).toHaveURL(new RegExp(`${ROUTES.SEARCH}/${searchParamsToString(QS)}`));
    await expect(page.getByLabel('list of results')).toContainText(doc.bibcode);

    await page.getByRole('button', { name: ' Explore' }).click();
    await page.getByRole('menuitem', { name: 'Paper Network' }).click();
  });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(async () => {
      await expect(page.locator('circle')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Currently viewing data for' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Size wedges based on:' })).toBeVisible();
    }).toPass({
      timeout: API_TIMEOUT,
    });
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test.fixme('Concept cloud loads properly', { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
  const name = 'concept-cloud';
  await cacheRoute.GET('**/v1/search/query*');
  await cacheRoute.GET('**/v1/vis/*');
  // Increase the number of papers
  const QS = new URLSearchParams(QUERY_STRING);
  QS.set('q', 'year:2000 moon crater');

  await test.step('Open the concept cloud tool', async () => {
    // do search and wait for results
    await page.goto(`${ROUTES.SEARCH}/${searchParamsToString(QS)}`);
    const searchRes = await page.waitForResponse(
      (res) => {
        const url = res.request().url();
        const search = new URLSearchParams(url.split('?')[1]);
        if (!search.has('fl')) return false;
        return search.get('fl').includes('bibcode');
      },
      { timeout: API_TIMEOUT },
    );
    const doc = (await searchRes.json()).response.docs[0] as { bibcode: string };
    await expect(page).toHaveURL(new RegExp(`${ROUTES.SEARCH}/${searchParamsToString(QS)}`));
    await expect(page.getByLabel('list of results')).toContainText(doc.bibcode);

    await page.getByRole('button', { name: ' Explore' }).click();
    await page.getByRole('menuitem', { name: 'Concept Cloud' }).click();
  });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(async () => {
      await expect(page.getByRole('heading', { name: 'Word Cloud' })).toBeVisible();
      await expect(page.getByLabel('wordcloud chart')).toBeVisible();
    }).toPass({
      timeout: API_TIMEOUT,
    });
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test.fixme('Results graph loads properly', { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
  const name = 'results-graph';
  await cacheRoute.GET('**/v1/search/query*');
  await cacheRoute.GET('**/v1/vis/*');

  // Increase the number of papers
  const QS = new URLSearchParams(QUERY_STRING);
  QS.set('q', 'year:2000 moon crater');

  await test.step('Open the results graph tool', async () => {
    // do search and wait for results
    await page.goto(`${ROUTES.SEARCH}/${searchParamsToString(QS)}`);
    const searchRes = await page.waitForResponse(
      (res) => {
        const url = res.request().url();
        const search = new URLSearchParams(url.split('?')[1]);
        if (!search.has('fl')) return false;
        return search.get('fl').includes('bibcode');
      },
      { timeout: API_TIMEOUT },
    );
    const doc = (await searchRes.json()).response.docs[0] as { bibcode: string };
    await expect(page).toHaveURL(new RegExp(`${ROUTES.SEARCH}/${searchParamsToString(QS)}`));
    await expect(page.getByLabel('list of results')).toContainText(doc.bibcode);

    await page.getByRole('button', { name: ' Explore' }).click();
    await page.getByRole('menuitem', { name: 'Results Graph' }).click();
  });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(async () => {
      await expect(page.locator('.s-bubble-label-container')).toBeVisible();
      await expect(page.getByLabel('bubble chart')).toBeVisible();
    }).toPass({ timeout: API_TIMEOUT });
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});
