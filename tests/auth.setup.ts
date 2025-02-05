import { test as setup } from '@playwright/test';
import { join } from 'path';

const authFile = join(__dirname, '../playwright/.auth/user.json');

const scixAuthUrl = `${process.env.SCIX_BASE_URL}/search?q=bibcode%3A2019ApJ...875L...1E&sort=score+desc&sort=date+desc&n=10&p=1`;
const bbbAuthUrl = `${process.env.ADS_BASE_URL}/search/q=bibcode%3A2019ApJ...875L...1E&sort=score+desc&sort=date+desc&n=10&p=1`;

setup('authenticate', async ({ page }) => {
  await page.goto(scixAuthUrl);
  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: authFile });

  await page.goto(bbbAuthUrl);
  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: authFile });
});
