import { test } from '@playwright/test';
import { configDotenv } from 'dotenv';

configDotenv();

test.use({
  baseURL: process.env.ADS_BASE_URL,
});

test.fixme('Can see and modify search settings', () => {});
test.fixme('Can see and modify export settings', () => {});
test.fixme('Can see, add, and modify myADS settings', () => {});
test.fixme('Can change email address', () => {});
test.fixme('Can change password', () => {});
test.fixme('Can generate a new API token', () => {});
test.fixme('Can delete account', () => {});
