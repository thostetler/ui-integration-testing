import { type Page, request } from '@playwright/test';
import { expect } from '@/setup/setup';
import { type UserData, userDataSchema } from 'schemas/userdata.schema';
import { getAPIToken } from '@/util/api';
import { init } from 'zod-empty';

type SubPage = {
  path: string;
  header: string;
};

const PAGES: Record<string, SubPage> = {
  importlibraries: { path: '/libraryimport', header: 'Import Libraries from Older ADS Accounts' },
  librarylink: { path: '/librarylink', header: 'Library Link Settings' },
  orcid: { path: '/orcid', header: 'ORCID Settings' },
  search: { path: '/application', header: 'Search Settings' },
  export: { path: '/export', header: 'Export Settings' },
  myads: { path: '/myads', header: 'myADS' },
  email: { path: '/email', header: 'Change Email Address' },
  password: { path: '/password', header: 'Change Your Password' },
  token: { path: '/token', header: 'API Token' },
  delete: { path: '/delete', header: 'Delete Account' },
} as const;

export class SettingsPage {
  page: Page;
  subPage: SubPage;

  constructor(page: Page) {
    this.page = page;
    this.subPage = PAGES.application;
  }

  async goto(subPage: keyof typeof PAGES) {
    this.subPage = PAGES[subPage];
    await this.page.goto(`/user/settings${this.subPage.path}`);
    await expect(this.page).toHaveURL(new RegExp(`/user/settings${this.subPage.path}`));
  }

  async assertHeader() {
    await expect(this.page.locator('.panel-heading')).toContainText(this.subPage.header);
  }

  async assertUserData(label: string, key?: keyof UserData) {
    const userData = await this.page.waitForResponse('**/v1/vault/user-data');
    const json = (await userData.json()) as UserData;
    const fileName = `user-data-${label}.json`;
    if (key) {
      expect(JSON.stringify(json[key], null, 2)).toMatchSnapshot(fileName);
    } else {
      expect(JSON.stringify(json, null, 2)).toMatchSnapshot(fileName);
    }
  }

  async resetUserData() {
    const api = await request.newContext({
      baseURL: process.env.ADS_BASE_URL,
      extraHTTPHeaders: {
        Accept: 'application/json',
        ContentType: 'application/json',
        Authorization: `Bearer ${await getAPIToken(this.page)}`,
      },
    });

    const defaultUserData = init(userDataSchema);
    const res = await api.post('/v1/vault/user-data', { data: defaultUserData });
    expect(res.status(), 'User data was reset successfully').toBe(200);
    await this.page.reload();
  }
}

export class SearchSettingsPage extends SettingsPage {
  constructor(page: Page) {
    super(page);
    this.subPage = PAGES.search;
  }

  async goto() {
    await super.goto('search');
  }

  async setAuthorsPerResult(count: number, assert: boolean = true) {
    await this.page.getByLabel('Authors Visible Per Result').selectOption(count.toString());
    if (assert) {
      await this.assertUserData('authors-per-result', 'minAuthorsPerResult');
    }
  }

  async setExternalLinkBehavior(behavior: UserData['externalLinkAction'], assert: boolean = true) {
    await this.page.getByLabel('Default Action For External Links', { exact: true }).selectOption(behavior);
    if (assert) {
      await this.assertUserData('external-link-behavior', 'externalLinkAction');
    }
  }

  async setDefaultHomePage(page: UserData['homePage'], assert: boolean = true) {
    await this.page.getByLabel('Default Home Page', { exact: true }).selectOption(page);
    if (assert) {
      await this.assertUserData('default-home-page', 'homePage');
    }
  }

  async setDefaultDatabase(database: string, assert: boolean = true) {
    await this.page.getByRole('button', { name: 'Modify' }).click();
    await this.page.getByText(database, { exact: true }).click();
    if (assert) {
      await this.assertUserData('default-database', 'defaultDatabase');
    }
  }

  async setResultsListSideBars(sideBars: UserData['defaultHideSidebars'], assert: boolean = true) {
    await this.page.getByLabel('Results List Side Bars', { exact: true }).selectOption(sideBars);
    if (assert) {
      await this.assertUserData('results-list-sidebars', 'defaultHideSidebars');
    }
  }
}

export class ExportSettingsPage extends SettingsPage {
  constructor(page: Page) {
    super(page);
    this.subPage = PAGES.export;
  }

  async goto() {
    await super.goto('export');
  }

  async setDefaultExportFormat(format: UserData['defaultExportFormat']) {
    await this.page.getByLabel('Default Export Format', { exact: true }).selectOption(format);
  }

  async addCustomFormat(name: string, format: string) {
    await this.page.getByRole('button', { name: 'Add' }).click();
    await this.page.getByPlaceholder('My New Format').fill(name);
    await this.page.getByPlaceholder('%l (%Y), %j, %V, %p.\\n').fill(format);
    await this.page.getByRole('button', { name: 'confirm edit' }).click();
  }

  async deleteCustomFormat() {
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.page.getByRole('button', { name: 'delete custom format' }).click();
  }

  async setBibTeXExportKeyFormat(format: string) {
    await this.page.getByLabel('BibTeX Default Export Key Format', { exact: true }).fill(format);
  }

  async setTeXJournalNameHandling(option: UserData['bibtexJournalFormat']) {
    await this.page.getByLabel('TeX Journal Name Handling').selectOption(option);
  }

  async setBibTeXMaxAuthors(max: string) {
    await this.page.getByLabel('BibTeX Default Export Max Authors', { exact: true }).selectOption(max);
  }

  async setBibTeXAuthorCutoff(cutoff: string) {
    await this.page.getByLabel('BibTeX Default Author Cutoff', { exact: true }).selectOption(cutoff);
  }

  async setBibTeXABSExportKeyFormat(format: string) {
    await this.page.getByLabel('BibTeX ABS Default Export Key Format', { exact: true }).fill(format);
  }

  async setBibTeXABSMaxAuthors(max: string) {
    await this.page.getByLabel('BibTeX ABS Default Export Max Authors', { exact: true }).selectOption(max);
  }

  async setBibTeXABSAuthorCutoff(cutoff: string) {
    await this.page.getByLabel('BibTeX ABS Default Author Cutoff', { exact: true }).selectOption(cutoff);
  }
}

export class MyADSSettingsPage extends SettingsPage {
  constructor(page: Page) {
    super(page);
    this.subPage = PAGES.myads;
  }

  async goto() {
    await super.goto('myads');
  }

  async createNewNotification(type: 'arxiv' | 'citations' | 'authors' | 'keywords' | 'general') {
    await this.page.getByRole('button', { name: 'Create' }).click();
    switch (type) {
      case 'arxiv':
        await this.page.getByRole('link', { name: 'arXiv Daily updates from' }).click();
        break;
      case 'citations':
        await this.page.getByRole('link', { name: 'Citations Weekly updates on' }).click();
        break;
      case 'authors':
        await this.page.getByRole('link', { name: 'Authors Weekly updates on the' }).click();
        break;
      case 'keywords':
        await this.page.getByRole('link', { name: 'Keywords Weekly updates on' }).click();
        break;
      case 'general':
        await this.page.getByRole('link', { name: 'General Notification based on' }).click();
        break;
    }
  }

  async checkArxivCategory() {
    await this.page.getByLabel('astro-ph: Astrophysics').click();
  }

  async setArxivQuery(query: string) {
    await this.page.getByPlaceholder('star OR planet').fill(query);
  }

  async submitNotification() {
    await this.page.getByRole('button', { name: 'Create notification' }).click();
  }

  async disableNotification() {
    await this.page.getByRole('button', { name: 'Actions' }).click();
    await this.page.getByRole('menu').getByText('DISABLED').click();
  }
}
