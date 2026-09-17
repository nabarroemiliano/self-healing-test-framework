import type { Locator, Page } from '@playwright/test';
import { BaseActions } from './base_actions';

/** demoblaze home page: navbar, category filter and product grid. */
export class HomePage {
  private readonly actions: BaseActions;

  private readonly selectors = {
    loginLink: '#login2',
    cartLink: '#cartur',
    welcomeText: '#nameofuser',
    laptopsCategory: '.list-group-item:has-text("Laptops")',
    productTitles: '#tbodyid .card-title a',
  };

  constructor(private readonly page: Page) {
    this.actions = new BaseActions(page, __filename);
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  async openLoginModal(): Promise<void> {
    await this.actions.click(this.selectors.loginLink);
  }

  async openCart(): Promise<void> {
    await this.actions.click(this.selectors.cartLink);
  }

  async filterByLaptops(): Promise<void> {
    await this.actions.click(this.selectors.laptopsCategory);
  }

  async openProduct(name: string): Promise<void> {
    await this.page.locator(this.selectors.productTitles, { hasText: name }).click();
  }

  welcomeText(): Locator {
    return this.page.locator(this.selectors.welcomeText);
  }

  productTitles(): Locator {
    return this.page.locator(this.selectors.productTitles);
  }
}
