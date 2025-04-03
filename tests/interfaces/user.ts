import { Page, Response } from '@playwright/test';

export interface User {
  email: string;
  password: string;
  page: Page;

  _after(): Promise<void>;

  login(): Promise<Response>;

  logout(): Promise<Response>;

  register(): Promise<Response>;

  changeEmail(newEmail: string): Promise<Response>;

  changePassword(newPassword: string): Promise<Response>;

  deleteAccount(): Promise<Response>;
}
