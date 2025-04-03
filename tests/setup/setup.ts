import { test as base, expect, type Page } from '@playwright/test';
import { CacheRoute } from 'playwright-network-cache';
import * as crypto from 'node:crypto';
import { getAltTestEmailAccount, getTestEmailAccount } from '@/email';
import { User } from '@/interfaces/user';
import { ScixUser } from '@scix/fixtures/user';
import { isScix } from '@/common';
import { ADSUser } from '@ads/fixtures/user';

const hashQueryString = (url: string) => {
  const urlObj = new URL(url);
  return crypto.createHash('md5').update(urlObj.searchParams.toString()).digest('hex');
};

type Fixtures = {
  cacheRoute: CacheRoute;
  loggedInPage: [Page, User];
  loggedInAltPage: [Page, User];
};

const test = base.extend<Fixtures>({
  cacheRoute: async ({ page }, use) => {
    await use(
      new CacheRoute(page, {
        baseDir: '.network-cache',
        extraDir: (req) => hashQueryString(req.url()),
        noCache: Number(process.env.DISABLE_REQUEST_CACHE) === 1,
      }),
    );
  },
  loggedInPage: async ({ browser }, use, testInfo) => {
    const page = await browser.newPage();
    const user = isScix(testInfo)
      ? new ScixUser(page, getTestEmailAccount())
      : new ADSUser(page, getTestEmailAccount());
    await user.login();
    await use([page, user]);
  },
  loggedInAltPage: async ({ browser }, use, testInfo) => {
    const page = await browser.newPage();
    const user = isScix(testInfo)
      ? new ScixUser(page, getAltTestEmailAccount())
      : new ADSUser(page, getAltTestEmailAccount());
    await user.login();
    await use([page, user]);
  },
});

export { expect, test };
