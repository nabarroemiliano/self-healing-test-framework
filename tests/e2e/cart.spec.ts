import * as allure from 'allure-js-commons';
import { expect, test } from '../../fixtures';

const PRODUCT = 'Samsung galaxy s6';

test.describe('Cart', () => {
  test('user can add a product to the cart', async ({ homePage, productPage, cartPage, dialogs }) => {
    await allure.severity(allure.Severity.CRITICAL);
    await allure.description('Verify that a product added from its details page is listed in the cart.');

    await homePage.open();
    await homePage.openProduct(PRODUCT);
    await expect(productPage.productName()).toHaveText(PRODUCT);

    await productPage.addToCart();
    await expect.poll(() => dialogs).toContain('Product added');

    await homePage.openCart();
    await expect(cartPage.productNames()).toHaveText([PRODUCT]);
  });
});
