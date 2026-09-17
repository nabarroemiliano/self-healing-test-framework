import * as allure from 'allure-js-commons';
import { expect, test } from '../../fixtures';

const LAPTOP_BRANDS = /Sony vaio|MacBook|Dell/;

test.describe('Catalog', () => {
  test('user can filter products by the Laptops category', async ({ homePage }) => {
    await allure.severity(allure.Severity.NORMAL);
    await allure.description('Verify that selecting the Laptops category shows only laptop products.');

    await homePage.open();
    await expect(homePage.productTitles().first()).toHaveText('Samsung galaxy s6');

    await homePage.filterByLaptops();

    await expect(homePage.productTitles().first()).toHaveText(LAPTOP_BRANDS);
    const titles = await homePage.productTitles().allTextContents();
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) expect(title).toMatch(LAPTOP_BRANDS);
  });
});
