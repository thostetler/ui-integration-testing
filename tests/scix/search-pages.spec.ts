import { API_TIMEOUT, ROUTES } from '@/constants';
import { expect, test } from '@/setup/setup';
import { a11yCheck, searchParamsToString, visualCheck } from '@/util/helpers';
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
  p_: '0',
});
QUERY_STRING.sort();

test.fixme('Search page loads properly', { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
  const name = 'search';
  await cacheRoute.GET('**/v1/search/query*');
  await page.goto(`${ROUTES.SEARCH}/${searchParamsToString(QUERY_STRING)}`);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.SEARCH}/${searchParamsToString(QUERY_STRING)}`));

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(async () => {
      await expect(
        page.getByLabel(`Your search returned ${BIBCODES.length} results`),
        'Numfound is displayed',
      ).toContainText(`Your search returned ${BIBCODES.length} results`);
      await expect(page.getByLabel('Start typing a query here to'), 'Search bar has been filled properly').toHaveValue(
        QUERY_STRING.get('q'),
      );
      await expect(page.getByLabel('list of results'), 'Results list has results').toContainText(BIBCODES[0]);
      expect(await page.locator('#results-left-column').textContent(), 'Facets have loaded').toMatchSnapshot(
        'facet-text',
      );
      expect(await page.getByLabel('limit years graph').textContent(), 'Years graph is loaded').toMatchSnapshot(
        'years-graph',
      );
      await expect(page.getByText('select all on this page Show'), 'Select all checkbox is visible').toBeVisible();
      await expect(page.getByText('Actions Explore'), 'Actions dropdowns are visible').toBeVisible();
      await expect(page.locator('#search-results-sort'), 'Sort dropdown is visible').toBeVisible();
    }).toPass();
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test.fixme('Export tool loads properly', { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
  const name = 'export';
  const urlRegx = new RegExp(`${ROUTES.SEARCH}/${searchParamsToString(QUERY_STRING)}${ROUTES.SEARCH_EXPORT_BIBTEX}`);
  await cacheRoute.GET('**/v1/search/query*');
  await cacheRoute.GET('**/v1/export**');

  // FIXME: This goto does not work since the page redirects to the main `search` page. We can't navigate to the export tool directly.
  // await page.goto(`${ROUTES.SEARCH}/${QUERY_STRING.toString()}${ROUTES.SEARCH_EXPORT_BIBTEX}`);

  await test.step('Open the export tool', async () => {
    await page.goto(`${ROUTES.SEARCH}/${QUERY_STRING.toString()}`, { waitUntil: 'domcontentloaded' });

    // have to wait for results to load
    await expect(page.getByLabel('list of results'), 'Results list has results').toContainText(BIBCODES[0]);

    // get the export button and click it
    await page.getByRole('button', { name: ' Export' }).click();
    await page.getByRole('menuitem', { name: 'in BibTeX' }).click();

    // wait for the export container to be visible
    await page.locator("div[class$='export-container']").waitFor({ state: 'visible' });
    await page.waitForURL(urlRegx);
    await expect(page).toHaveURL(urlRegx);
  });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(async () => {
      await expect(
        page.getByLabel(`Your search returned ${BIBCODES.length} results`),
        'Numfound is displayed',
      ).toContainText(`Your search returned ${BIBCODES.length} results`);
      await expect(page.getByLabel('Start typing a query here to'), 'Search bar has been filled properly').toHaveValue(
        QUERY_STRING.get('q'),
      );
      await expect(page.getByLabel('container for search results'), 'Export content is visible').toContainText(
        `Exporting record(s) 1 to ${BIBCODES.length} (total: ${BIBCODES.length})`,
      );
      await page.getByLabel('export content').waitFor({ state: 'visible' });
      expect(await page.getByLabel('export content').inputValue(), 'Export output is seen').toMatchSnapshot(
        'export-content',
      );
    }).toPass();
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

// FIXME: This test is failing because the author affiliation tool is not loading properly.
test.fixme('Author affiliation loads properly', { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
  test.slow();
  const name = 'author-affiliation';
  await cacheRoute.GET('**/v1/search/query*');
  await cacheRoute.GET('**/v1/author-affiliation/*');

  await test.step('Open the author affiliation tool', async () => {
    // do search and wait for results
    await page.goto(`${ROUTES.SEARCH}/${searchParamsToString(QUERY_STRING)}`);
    await expect(page).toHaveURL(new RegExp(`${ROUTES.SEARCH}/${searchParamsToString(QUERY_STRING)}`));
    await expect(page.getByLabel('list of results')).toContainText(BIBCODES[0]);
    // open the author affiliation tool
    await page.getByLabel('select all on this page').check();
    await page.getByRole('button', { name: ' Export' }).click();
    await page.getByRole('menuitem', { name: 'Author Affiliation' }).click();
    await page.waitForResponse('**/v1/author-affiliation/*', { timeout: API_TIMEOUT });

    // change to ALL years to include our test bibcodes
    await page.getByLabel('Years:').selectOption('0');
    await page.waitForResponse('**/v1/author-affiliation/*', { timeout: API_TIMEOUT });
  });

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
  test.slow();
  const name = 'citation-metrics';
  await cacheRoute.GET('**/v1/search/query*');
  await cacheRoute.GET('**/v1/metrics');

  await test.step('Open the citation metrics tool', async () => {
    // do search and wait for results
    await page.goto(`${ROUTES.SEARCH}/${searchParamsToString(QUERY_STRING)}`);
    await expect(page).toHaveURL(new RegExp(`${ROUTES.SEARCH}/${searchParamsToString(QUERY_STRING)}`));
    await expect(page.getByLabel('list of results')).toContainText(BIBCODES[0]);

    await page.getByRole('button', { name: ' Explore' }).click();
    await page.getByRole('menuitem', { name: 'Citation Metrics' }).click();
    await page.waitForResponse('**/v1/metrics', { timeout: API_TIMEOUT });
  });

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
