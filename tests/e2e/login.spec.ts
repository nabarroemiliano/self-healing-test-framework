import * as allure from 'allure-js-commons';
import { expect, test } from '../../fixtures';

test.describe('Login', () => {
  test('user can log in with valid credentials', async ({ homePage, loginModal, demoblazeUser }) => {
    await allure.severity(allure.Severity.CRITICAL);
    await allure.description('Verify that a registered user can log in and is greeted by name.');

    await homePage.open();
    await homePage.openLoginModal();
    await loginModal.login(demoblazeUser.username, demoblazeUser.password);

    await expect(homePage.welcomeText()).toHaveText(`Welcome ${demoblazeUser.username}`);
  });
});
