import { test as setup } from '@/setup/setup';
import type { Page } from '@playwright/test';
import { ADSUser } from '@ads/fixtures/user';
import { verifyUser } from '@ads/util/accounts';
import { getAltTestEmailAccount, getTestEmailAccount } from '@/email';

setup.use({
  baseURL: process.env.ADS_BASE_URL,
});

const loginOrRegister = async (page: Page, user: ADSUser) => {
  const loginRes = await user.login();
  if (loginRes.status() === 401) {
    console.log('user not found, registering...');
    await user.register();
    await verifyUser(page, user);
  } else if (loginRes.status() === 200) {
    console.log('user found, logging out...');
  }
  await user.logout();
};

setup('Setup test accounts', async ({ browser }) => {
  console.log('Creating the default user');
  const page = await browser.newPage();
  const defaultUser = new ADSUser(page, getTestEmailAccount());
  await loginOrRegister(page, defaultUser);

  console.log('Creating the alt user');
  const altPage = await browser.newPage();
  const altUser = new ADSUser(altPage, getAltTestEmailAccount());
  await loginOrRegister(altPage, altUser);
});
