import type { Locator, Page } from '@playwright/test';

export class CartPage {
  private readonly selectors = {
    productNames: '#tbodyid tr td:nth-child(2)',
  };

  constructor(private readonly page: Page) {}

  productNames(): Locator {
    return this.page.locator(this.selectors.productNames);
  }
}
