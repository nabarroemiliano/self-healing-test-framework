import type { Page } from '@playwright/test';
import { BaseActions } from './base_actions';

export class LoginModal {
  private readonly actions: BaseActions;

  private readonly selectors = {
    username: '#loginusername',
    password: '#loginpassword',
    loginButton: '#logInModal button.btn-primary',
  };

  constructor(page: Page) {
    this.actions = new BaseActions(page, __filename);
  }

  async login(username: string, password: string): Promise<void> {
    await this.actions.fill(this.selectors.username, username);
    await this.actions.fill(this.selectors.password, password);
    await this.actions.click(this.selectors.loginButton);
  }
}
