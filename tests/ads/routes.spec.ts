import { expect, type Page, test, type TestInfo } from '@playwright/test';
import { configDotenv } from 'dotenv';
import { A11Y_TAGS, MAX_A11Y_VIOLATIONS, ROUTES } from '@/constants';
import AxeBuilder from '@axe-core/playwright';

configDotenv();

test.use({
  baseURL: process.env.ADS_BASE_URL,
});

const visualCheck = (page: Page, name: string) => async () => {
  await expect(page.locator('#content-container')).toHaveScreenshot(`${name}.png`);
};

const a11yCheck = (page: Page, name: string, testInfo: TestInfo) => async () => {
  const a11yResults = await new AxeBuilder({ page }).withTags(A11Y_TAGS).analyze();
  await testInfo.attach(`a11y-results-${name}`, {
    body: JSON.stringify(a11yResults, null, 2),
    contentType: 'application/json',
  });
  expect(a11yResults.violations.length).toBeLessThanOrEqual(MAX_A11Y_VIOLATIONS);
};

test('Classic form loads properly', async ({ page }, testInfo) => {
  const name = 'classic-form';
  await page.goto(ROUTES.CLASSIC_FORM);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('#landing-page-layout')).toContainText('Limit query to:');
    await expect(page.locator('#landing-page-layout')).toContainText('Limit query to: Astronomy Physics General');
    await expect(page.getByPlaceholder('(Last, First M) one per line')).toBeEmpty();
    await expect(page.getByPlaceholder('SIMBAD object search (one per')).toBeEmpty();
    await expect(page.getByLabel('start publication month')).toBeEmpty();
    await expect(page.getByLabel('start publication year')).toBeEmpty();
    await expect(page.getByLabel('end publication month')).toBeEmpty();
    await expect(page.getByLabel('end publication year')).toBeEmpty();
    await expect(page.getByLabel('title')).toBeEmpty();
    await expect(page.getByLabel('abstract and keywords')).toBeEmpty();
    await expect(page.getByPlaceholder('Comma-separated bibstems of')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Modern form loads properly', async ({ page }, testInfo) => {
  const name = 'modern-form';
  await page.goto(ROUTES.ROOT);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.getByLabel('Start typing a query here to')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Paper form loads properly', async ({ page }, testInfo) => {
  const name = 'paper-form';
  await page.goto(ROUTES.PAPER_FORM);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('#landing-page-layout')).toContainText('Journal Search');
    await expect(page.locator('#landing-page-layout')).toContainText('Reference Query');
    await expect(page.locator('#landing-page-layout')).toContainText('Bibliographic Code Query');
    await expect(page.getByLabel('Publication')).toBeEmpty();
    await expect(page.getByLabel('Year')).toBeEmpty();
    await expect(page.getByLabel('Volume')).toBeEmpty();
    await expect(page.getByLabel('Page/ID')).toBeEmpty();
    await expect(page.getByLabel('Reference')).toBeEmpty();
    await expect(page.getByLabel('List of Bibcodes')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Search page loads properly', async ({ page }, testInfo) => {
  const name = 'search';
  await page.goto(
    `${ROUTES.SEARCH}/q=bibcode%3A1988AJ.....96.1775O%20OR%20bibcode%3A2014AJ....147..156L&sort=date%20desc%2C%20bibcode%20desc&p_=0`,
  );

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.getByLabel('Your search returned 2 results')).toContainText('Your search returned 2 results');
    await expect(page.getByLabel('Start typing a query here to')).toHaveValue(
      'bibcode:1988AJ.....96.1775O OR bibcode:2014AJ....147..156L',
    );
    await expect(page.getByLabel('list of results')).toContainText('1988AJ.....96.1775O');
    await expect(page.getByLabel('list of results')).toContainText('2014AJ....147..156L');
    await expect(
      page.locator('#results-left-column div').filter({ hasText: 'Authors Geller, M1 Huchra, J1' }).first(),
    ).toBeVisible();
    await expect(page.getByText('select all on this page Show')).toBeVisible();
    await expect(
      page.locator('#results-right-column div').filter({ hasText: 'Additional Functionality (' }),
    ).toBeVisible();
    await expect(page.getByText('Actions Explore')).toBeVisible();
    await expect(page.locator('#search-results-sort')).toBeVisible();
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Abstract page loads properly', async ({ page }, testInfo) => {
  const name = 'abs-abstract';
  await page.goto(`${ROUTES.ABS}/2014AJ....147..156L/${ROUTES.ABS_ABSTRACT}`, { waitUntil: 'domcontentloaded' });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('.resources-container')).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('#left-column')).toBeVisible();
    await expect(
      page.locator('#right-col-container div').filter({ hasText: 'Graphics Click to view more' }).nth(3),
    ).toBeVisible();
    await expect(page.getByRole('article')).toContainText('We present a detailed Chandra study');
    await expect(page.getByRole('article')).toContainText('Dynamics of 10 Clusters of Galaxies with Substructures');
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Citations page loads properly', async ({ page }, testInfo) => {
  const name = 'abs-citations';
  await page.goto(`${ROUTES.ABS}/2014AJ....147..156L/${ROUTES.ABS_CITATIONS}`, { waitUntil: 'domcontentloaded' });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('#left-column')).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('.s-right-col-widget-container').first()).toBeVisible();
    await expect(
      page.locator('#right-col-container div').filter({ hasText: 'Graphics Click to view more' }).nth(3),
    ).toBeVisible();
    await expect(page.locator('#current-subview')).toContainText(
      'Papers that cite Dynamics of 10 Clusters of Galaxies with Substructures',
    );
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('References page loads properly', async ({ page }, testInfo) => {
  const name = 'abs-references';
  await page.goto(`${ROUTES.ABS}/2014AJ....147..156L/${ROUTES.ABS_REFERENCES}`, { waitUntil: 'domcontentloaded' });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('#left-column')).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('.s-right-col-widget-container').first()).toBeVisible();
    await expect(
      page.locator('#right-col-container div').filter({ hasText: 'Graphics Click to view more' }).nth(3),
    ).toBeVisible();
    await expect(page.locator('#current-subview')).toContainText(
      'Papers referenced Dynamics of 10 Clusters of Galaxies with Substructures',
    );
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Co-reads page loads properly', async ({ page }, testInfo) => {
  const name = 'abs-coreads';
  await page.goto(`${ROUTES.ABS}/2014AJ....147..156L/${ROUTES.ABS_COREADS}`, { waitUntil: 'domcontentloaded' });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('#left-column')).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('.s-right-col-widget-container').first()).toBeVisible();
    await expect(
      page.locator('#right-col-container div').filter({ hasText: 'Graphics Click to view more' }).nth(3),
    ).toBeVisible();
    await expect(page.locator('#current-subview')).toContainText(
      'Papers also read by those who read Dynamics of 10 Clusters of Galaxies with Substructures',
    );
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Similar page loads properly', async ({ page }, testInfo) => {
  const name = 'abs-similar';
  await page.goto(`${ROUTES.ABS}/2014AJ....147..156L/${ROUTES.ABS_SIMILAR}`, { waitUntil: 'domcontentloaded' });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('#left-column')).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('.s-right-col-widget-container').first()).toBeVisible();
    await expect(
      page.locator('#right-col-container div').filter({ hasText: 'Graphics Click to view more' }).nth(3),
    ).toBeVisible();
    await expect(page.locator('#current-subview')).toContainText(
      'Papers similar to Dynamics of 10 Clusters of Galaxies with Substructures',
    );
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Volume Content page loads properly', async ({ page }, testInfo) => {
  const name = 'abs-volume-content';
  await page.goto(`${ROUTES.ABS}/2014AJ....147..156L/${ROUTES.ABS_VOLUME}`, { waitUntil: 'domcontentloaded' });

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('#left-column')).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('.s-right-col-widget-container').first()).toBeVisible();
    await expect(
      page.locator('#right-col-container div').filter({ hasText: 'Graphics Click to view more' }).nth(3),
    ).toBeVisible();
    await expect(page.locator('#current-subview')).toContainText(
      'Papers similar to Dynamics of 10 Clusters of Galaxies with Substructures',
    );
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Export tool loads properly', async ({ page }) => {
  // TODO: Navigate to the Export tool and verify it loads correctly.
});

test('Author affiliation loads properly', async ({ page }) => {
  // TODO: Navigate to the Author affiliation page and verify it loads correctly.
});

test('Citation metrics loads properly', async ({ page }) => {
  // TODO: Navigate to the Citation metrics page and verify it loads correctly.
});

test('Author network loads properly', async ({ page }) => {
  // TODO: Navigate to the Author network page and verify it loads correctly.
});

test('Paper network loads properly', async ({ page }) => {
  // TODO: Navigate to the Paper network page and verify it loads correctly.
});

test('Concept cloud loads properly', async ({ page }) => {
  // TODO: Navigate to the Concept cloud page and verify it loads correctly.
});

test('Results graph loads properly', async ({ page }) => {
  // TODO: Navigate to the Results graph page and verify it loads correctly.
});

test('Feedback Correct Abstract form load properly', async ({ page }, testInfo) => {
  const name = 'feedback-correct-abstract';
  await page.goto(ROUTES.FEEDBACK_CORRECT_ABS);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('h2')).toContainText('Submit or Correct an Abstract for the ADS Abstract Service');
    await expect(page.getByPlaceholder('John Smith')).toBeEmpty();
    await expect(page.getByPlaceholder('john@example.com')).toBeEmpty();
    await expect(page.getByPlaceholder('1999ApJ...511L..65Y')).toBeEmpty();
    await expect(page.getByLabel('Title')).toBeEmpty();
    await expect(page.getByLabel('Publication *')).toBeEmpty();
    await expect(page.getByPlaceholder('YYYY-MM-DD')).toBeEmpty();
    await expect(page.getByLabel('URL 1 type')).toHaveValue('none');
    await expect(page.getByLabel('URL 1', { exact: true })).toBeEmpty();
    await expect(page.getByLabel('Abstract', { exact: true })).toBeEmpty();
    await expect(page.getByLabel('Keyword')).toBeEmpty();
    await expect(page.getByLabel('Reference')).toBeEmpty();
    await expect(page.getByLabel('User Comments')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Feedback Missing References form load properly', async ({ page }, testInfo) => {
  const name = 'feedback-missing-references';
  await page.goto(ROUTES.FEEDBACK_MISSING_REFS);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('h2')).toContainText('Submit missing references for the ADS Abstract Service');
    await expect(page.getByPlaceholder('John Smith')).toBeEmpty();
    await expect(page.getByPlaceholder('john@example.com')).toBeEmpty();
    await expect(page.getByLabel('Citing Bibcode')).toBeEmpty();
    await expect(page.getByLabel('Cited Bibcode')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Feedback Associated Articles form load properly', async ({ page }, testInfo) => {
  const name = 'feedback-associated-articles';
  await page.goto(ROUTES.FEEDBACK_ASSOCIATED_ARTICLES);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('h2')).toContainText('Submit Associated Articles for the ADS Abstract Service');
    await expect(page.getByPlaceholder('John Smith')).toBeEmpty();
    await expect(page.getByPlaceholder('john@example.com')).toBeEmpty();
    await expect(page.getByLabel('Relation type *')).toHaveValue('none');
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Login page loads properly', async ({ page }, testInfo) => {
  const name = 'login';
  await page.goto(ROUTES.LOGIN);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('legend')).toContainText('Log in to ADS');
    await expect(page.getByPlaceholder('Enter email')).toBeEmpty();
    await expect(page.getByPlaceholder('Password')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Register page loads properly', async ({ page }, testInfo) => {
  const name = 'register';
  await page.goto(ROUTES.REGISTER);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.getByText('Register for an ADS Account')).toBeVisible();
    await expect(page.getByPlaceholder('First Name')).toBeEmpty();
    await expect(page.getByPlaceholder('Last Name')).toBeEmpty();
    await expect(page.getByPlaceholder('me@example.com')).toBeEmpty();
    await expect(page.getByLabel('Password * at least 8')).toBeEmpty();
    await expect(page.getByLabel('Re-enter Password *')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});
