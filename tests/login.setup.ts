import {test as setup, expect, test, request, Page} from '@playwright/test';
import { join } from 'path';
import {getAltTestEmailAccount, getTestEmailAccount} from '../util/email';
import {loginUser} from '../util/auth';
import {getAPIToken} from '../util/api';
import * as fs from 'node:fs';

const BASE_URL = 'https://qa.adsabs.harvard.edu';
const authFile = join(__dirname, '../playwright/.auth/login.json');
const altAuthFile = join(__dirname, '../playwright/.auth/alt-login.json');

setup.use({baseURL: BASE_URL});

/**
 * Clear all libraries
 * @param {Page} page
 */
const clearLibs = async (page: Page) => {
  const apiContext= await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Accept: 'application/json',
      ContentType: 'application/json',
      Authorization: `Bearer ${await getAPIToken(page)}`,
    }
  });
  const getLibs = async () => {
    const res = await apiContext.get('/v1/biblib/libraries');
    const json = await res.json() as { libraries: { id: string, name: string, permission: string }[] };

    // only return libraries owned by the current user, otherwise we can't edit them
    return (json.libraries ?? []).filter((lib) => lib.permission === 'owner');
  }

  const libs = await getLibs();

  // delete all libraries, just to confirm we have a clean slate
  await Promise.all(libs.map((lib) => {
    return apiContext.delete(`/v1/biblib/documents/${lib.id}`);
  }));

  expect(await getLibs()).toEqual([]);
}

setup('login with default credentials', async ({ browser }) => {
  const ctx = await browser.newContext();
  if (fs.existsSync(authFile)) {
    await ctx.storageState({ path: authFile });
  }
  const page = await ctx.newPage();

  await expect(async () => {
    await loginUser(page, getTestEmailAccount());

    // ### Run any additional setup here ###

    // clear all libraries
    await clearLibs(page);
  }).toPass({intervals: [3000], timeout: 30_000});

  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: authFile });
  await ctx.close();
});

setup('login with alternative credentials', async ({ browser }) => {
  const ctx = await browser.newContext();
  if (fs.existsSync(altAuthFile)) {
    await ctx.storageState({ path: altAuthFile });
  }
  const page = await ctx.newPage();

  await expect(async () => {
    await loginUser(page, getAltTestEmailAccount());

    // ### Run any additional setup here ###

    // clear all libraries
    await clearLibs(page);
  }).toPass({intervals: [3000], timeout: 30_000});

  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: altAuthFile });
  await ctx.close();
});
