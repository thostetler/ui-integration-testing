import { test as setup, test } from '@/setup/setup';
import { ADSUser } from '@/ads/fixtures/user';
import { Page } from '@playwright/test';
import { verifyUser } from '@ads/util/accounts';
import { getTestEmailAccount } from '@/email';

setup.use({
  baseURL: process.env.ADS_BASE_URL,
});

const registerUser = async (page: Page, user: ADSUser) => {
  const loginRes = await user.login();
  if (loginRes.status() === 401) {
    await user.register();
    await verifyUser(page, user);
  } else if (loginRes.status() === 200) {
    await user.deleteAccount();
    await user.register();
    await verifyUser(page, user);
  }
  await user.deleteAccount();
};

test('Can register a new account', { tag: ['@stress', '@accounts'] }, async ({ page }, testInfo) => {
  const user = new ADSUser(page, getTestEmailAccount(String(testInfo.workerIndex + 100)));
  await registerUser(page, user);
});
