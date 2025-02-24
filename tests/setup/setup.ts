import { test as base, expect, type Page } from '@playwright/test';
import { CacheRoute } from 'playwright-network-cache';
import * as crypto from 'node:crypto';
import { getAltTestEmailAccount, getTestEmailAccount } from '@/util/email';
import { User } from '@/fixtures/user';

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
  loggedInPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    const user = new User(page, getTestEmailAccount());
    await user.login();
    await use([page, user]);
  },
  loggedInAltPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    const user = new User(page, getAltTestEmailAccount());
    await user.login();
    await use([page, user]);
  },
});

export { expect, test };
