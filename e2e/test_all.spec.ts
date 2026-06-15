import { test, expect } from '@playwright/test';

const ROUTES = [
  '/community',
  '/quests',
  '/shop',
  '/walk',
  '/vet',
  '/profile/milo',
  '/petshop',
  '/ai-dressing',
  '/wallet',
  '/studio',
  '/lab',
  '/food',
  '/game',
  '/cart',
  '/checkout',
  '/business/dashboard',
  '/admin',
  '/walk/competition',
  '/walk/history',
  '/walk/leaderboard',
  '/walk/summary',
  '/walk/tracking',
  '/business/appointments',
  '/business/finance',
  '/business/orders',
  '/business/products',
  '/business/quests',
  '/admin/feedbacks',
  '/admin/market',
  '/admin/moderation',
  '/admin/platform-finance',
  '/admin/platform-settings',
  '/admin/users'
];

test.describe('Verify all routes under normal and un-onboarded storage', () => {
  for (const route of ROUTES) {
    test(`Route ${route} should not crash under normal mode`, async ({ page }) => {
      // Setup normal storage
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('moffi_force_mock', 'true');
        localStorage.setItem('moffi_onboarded', 'true');
        localStorage.setItem('moffipet_onboarding_seen', 'true');
        localStorage.setItem('moffi_active_pet_id', 'pet-1');
      });

      let hasPageError = false;
      page.on('pageerror', (err) => {
        console.error(`PAGE CRASH (NORMAL) on ${route}:`, err.message);
        hasPageError = true;
      });

      await page.goto(route);
      await page.waitForTimeout(2000);

      const globalError = page.locator('text=Kritik bir hata oluştu');
      const count = await globalError.count();
      
      expect(count).toBe(0);
      expect(hasPageError).toBe(false);
    });

    test(`Route ${route} should not crash under empty storage`, async ({ page }) => {
      // Setup empty storage
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
      });

      let hasPageError = false;
      page.on('pageerror', (err) => {
        console.error(`PAGE CRASH (EMPTY) on ${route}:`, err.message);
        hasPageError = true;
      });

      await page.goto(route);
      await page.waitForTimeout(2000);

      const globalError = page.locator('text=Kritik bir hata oluştu');
      const count = await globalError.count();
      
      expect(count).toBe(0);
      expect(hasPageError).toBe(false);
    });
  }
});
