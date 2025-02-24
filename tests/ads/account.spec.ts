import { test as setup, test } from '@/setup/setup';
import { getTestEmailAccount } from '@/util/email';
import { User } from '@/fixtures/user';
import { verifyUser } from '@/util/accounts';
import { Page } from '@playwright/test';

setup.use({
  baseURL: process.env.ADS_BASE_URL,
});

const registerUser = async (page: Page, user: User) => {
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
  const user = new User(page, getTestEmailAccount(String(testInfo.workerIndex + 100)));
  await registerUser(page, user);
});
