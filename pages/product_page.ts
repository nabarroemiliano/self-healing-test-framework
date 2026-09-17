import type { Locator, Page } from '@playwright/test';
import { BaseActions } from './base_actions';

export class ProductPage {
  private readonly actions: BaseActions;

  private readonly selectors = {
    productName: '.name',
    addToCartButton: 'a.btn-success:has-text("Add to cart")',
  };

  constructor(private readonly page: Page) {
    this.actions = new BaseActions(page, __filename);
  }

  productName(): Locator {
    return this.page.locator(this.selectors.productName);
  }

  async addToCart(): Promise<void> {
    await this.actions.click(this.selectors.addToCartButton);
  }
}
