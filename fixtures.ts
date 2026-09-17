import { randomBytes } from 'node:crypto';
import { test as base } from '@playwright/test';
import { config } from './config/config';
import { CartPage } from './pages/cart_page';
import { HomePage } from './pages/home_page';
import { LoginModal } from './pages/login_modal';
import { ProductPage } from './pages/product_page';

export interface DemoblazeUser {
  username: string;
  password: string;
}

interface Fixtures {
  dialogs: string[];
  homePage: HomePage;
  loginModal: LoginModal;
  productPage: ProductPage;
  cartPage: CartPage;
  demoblazeUser: DemoblazeUser;
}

export const test = base.extend<Fixtures>({
  dialogs: [
    async ({ page }, use) => {
      const messages: string[] = [];
      page.on('dialog', (dialog) => {
        messages.push(dialog.message());
        void dialog.accept();
      });
      await use(messages);
    },
    { auto: true },
  ],
  homePage: async ({ page }, use) => use(new HomePage(page)),
  loginModal: async ({ page }, use) => use(new LoginModal(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  demoblazeUser: async ({ request }, use) => {
    const user: DemoblazeUser = {
      username: `shf_${Date.now()}_${randomBytes(3).toString('hex')}`,
      password: randomBytes(8).toString('hex'),
    };

    const response = await request.post(`${config.apiUrl}/signup`, {
      data: { username: user.username, password: Buffer.from(user.password).toString('base64') },
    });
    if (!response.ok()) {
      throw new Error(`demoblaze signup failed with HTTP ${response.status()}: ${await response.text()}`);
    }
    await use(user);
  },
});

export { expect } from '@playwright/test';
