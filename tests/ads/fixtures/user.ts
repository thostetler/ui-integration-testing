import { expect, Page, Response } from '@playwright/test';
import { SettingsPage } from '@/ads/fixtures/settings';
import type { User } from '@/interfaces/user';

// type BootstrapResponse = {
//   access_token: string;
//   refresh_token: string;
//   expires_at: string;
//   token_type: 'bearer';
//   username: string;
//   scopes: string[];
//   anonymous: boolean;
//   client_id: string;
//   client_secret: string;
//   ratelimit: number;
//   client_name: string;
//   individual_ratelimits: number | null;
//   given_name: string | null;
//   family_name: string | null;
// };

type Credentials = {
  emailAddress: string;
  password: string;
};

export class ADSUser implements User {
  protected _email: string;
  protected _password: string;
  page: Page;

  get password(): string {
    return this._password;
  }

  set password(value: string) {
    this._password = value;
  }

  get email(): string {
    return this._email;
  }

  set email(value: string) {
    this._email = value;
  }

  constructor(page: Page, credentials: Credentials) {
    this._email = credentials.emailAddress;
    this._password = credentials.password;
    this.page = page;
  }

  async _after() {
    await this.page.goto('/');
  }

  async login() {
    let res: Response;
    await expect(async () => {
      await this.page.goto('/user/account/login');

      await this.page.locator('#email').fill(this._email);
      await this.page.locator('#password').fill(this._password);
      await this.page.locator('.submit-login').click();

      res = await this.page.waitForResponse('**/v1/accounts/user/login');
      expect(res.request().method()).toBe('POST');
    }).toPass();

    // give the this.page a little time to settle
    await this.page.waitForTimeout(1000);
    await this._after();
    return res;
  }

  async logout() {
    await this.page.goto('/');
    await this.page.getByRole('button', { name: 'Account' }).waitFor({ state: 'visible', timeout: 5000 });
    await this.page.getByRole('button', { name: 'Account' }).click();
    await this.page.getByRole('link', { name: 'Log Out' }).click();
    const res = await this.page.waitForResponse('**/v1/accounts/user/logout');
    expect(res.status()).toBe(200);
    expect(res.request().method()).toBe('POST');
    await this._after();
    return res;
  }

  async register() {
    await this.page.goto('/user/account/register');

    // fill out form
    await this.page.locator('#email').fill(this._email);
    await this.page.locator('#password1').fill(this._password);
    await this.page.locator('#password2').fill(this._password);

    // submit
    await this.page.locator("button[data-form-name='register']").click();
    const res = await this.page.waitForResponse('**/v1/accounts/user');
    await expect(res.json()).resolves.toEqual({ message: 'success' });
    await this._after();
    return res;
  }

  async changeEmail(newEmail: string) {
    const settingsPage = new SettingsPage(this.page);
    await settingsPage.goto('email');
    await this.page.getByLabel('New email address', { exact: true }).fill(newEmail);
    await this.page.getByLabel('Confirm new email address').fill(newEmail);
    await this.page.getByLabel('Password').fill(this._password);
    await this.page.getByRole('button', { name: 'Change my email' }).click();
    const res = await this.page.waitForResponse('**/v1/accounts/user/change-email');
    expect(res.status()).toBe(200);
    expect(res.request().method()).toBe('POST');
    this._email = newEmail;
    await this._after();
    return res;
  }

  async changePassword(newPassword: string) {
    const settingsPage = new SettingsPage(this.page);
    await settingsPage.goto('password');
    await this.page.getByLabel('Current password').fill(this._password);
    await this.page.getByLabel('New password', { exact: true }).fill(newPassword);
    await this.page.getByLabel('Retype new password').fill(newPassword);
    await this.page.getByRole('button', { name: 'Submit' }).click();
    const res = await this.page.waitForResponse('**/v1/accounts/user/change-password');
    expect(res.status()).toBe(200);
    expect(res.request().method()).toBe('POST');
    this._password = newPassword;
    await this._after();
    return res;
  }

  async deleteAccount() {
    const settingsPage = new SettingsPage(this.page);
    await settingsPage.goto('delete');
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.page.locator('#delete-account').click();
    const res = await this.page.waitForResponse('**/v1/accounts/user');
    expect(res.status()).toBe(200);
    expect(res.request().method()).toBe('DELETE');
    await this._after();
    return res;
  }
}
