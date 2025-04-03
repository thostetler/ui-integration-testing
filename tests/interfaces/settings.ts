import type { Page } from '@playwright/test';
import type { UserData } from 'schemas/userdata.schema';

type SubPage = { path: string; header: string };
type Pages = {
  importlibraries: SubPage;
  librarylink: SubPage;
  orcid: SubPage;
  search: SubPage;
  export: SubPage;
  myads: SubPage;
  email: SubPage;
  password: SubPage;
  token: SubPage;
  delete: SubPage;
};

export interface Settings {
  page: Page;
  subPage: SubPage;
  goto: (subPage: keyof Pages) => Promise<void>;
  assertHeader: () => Promise<void>;
  assertUserData: (label: string, key?: keyof UserData) => Promise<void>;
  resetUserData: () => Promise<void>;
}
