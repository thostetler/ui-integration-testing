import { expect, type Page, request } from '@playwright/test';
import { getAPIToken } from '@scix/util/api';

const BASE_URL = process.env.ADS_BASE_URL;

export class LibrariesPage {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/user/libraries');
  }

  async clearLibraries() {
    const apiContext = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: {
        Accept: 'application/json',
        ContentType: 'application/json',
        Authorization: `Bearer ${await getAPIToken(this.page)}`,
      },
    });
    const getLibs = async () => {
      const res = await apiContext.get('/v1/biblib/libraries');
      const json = (await res.json()) as { libraries: { id: string; name: string; permission: string }[] };

      // only return libraries owned by the current user, otherwise we can't edit them
      return (json.libraries ?? []).filter((lib) => lib.permission === 'owner');
    };

    const libs = await getLibs();

    // delete all libraries, just to confirm we have a clean slate
    await Promise.all(libs.map((lib) => apiContext.delete(`/v1/biblib/documents/${lib.id}`)));

    const newLibs = await getLibs();
    expect(newLibs).toEqual([]);
  }

  async createLibrary(name: string) {
    const createLibButton = this.page.locator('button[class$="create-library"]');

    // go to the libraries this.page
    await this.page.goto('/user/libraries');
    await expect(this.page).toHaveURL(new RegExp(`${BASE_URL}/user/libraries`));

    // confirm we are on the library this.page and there are no libraries
    expect(this.page.url()).toMatch(/.*\/user\/libraries\/?$/);

    // create a new library via the prompt dialog
    this.page.once('dialog', (dialog) => dialog.accept(name));

    // create library
    await createLibButton.click();

    // confirm the request was made and grab the library id from the response
    const response = await this.page.waitForResponse((res) => {
      return res.url().match(/\/biblib\/libraries$/) && res.request().method() === 'POST';
    });
    const resData = await response.json();
    expect(resData.name).toBe(name);
    expect(resData.id).toBeTruthy();

    // confirm we are on the newly created library this.page
    await this.page.waitForURL(`**/user/libraries/${resData.id}`);
    expect(this.page.url(), 'should be on the newly created library this.page').toContain(resData.id);
    return resData as { id: string; name: string };
  }
}
