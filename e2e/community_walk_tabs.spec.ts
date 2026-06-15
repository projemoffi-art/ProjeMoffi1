import { test, expect } from '@playwright/test';

test('Switching tabs in WalkQuickSheet should work without errors', async ({ page }) => {
  // Go to root page and configure mock storage
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('moffi_force_mock', 'true');
    localStorage.setItem('moffi_walk_simulation', 'true');
    localStorage.setItem('moffi_onboarded', 'true');
    localStorage.setItem('moffipet_onboarding_seen', 'true');
    localStorage.setItem('moffi_active_pet_id', 'pet-1');
  });

  // Track errors and logs
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    console.error('BROWSER ERROR:', err);
    errors.push(err.message + '\n' + err.stack);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  // 1. Go to community page
  console.log('Navigating to /community...');
  await page.goto('/community');
  await page.waitForTimeout(3000);

  // 2. Click "Yürüyüşe Başla" to open quick sheet
  console.log('Clicking Yürüyüşe Başla button...');
  const walkBtn = page.locator('button:has-text("Yürüyüşe Başla")');
  await expect(walkBtn.first()).toBeVisible();
  await walkBtn.first().click({ force: true });
  await page.waitForTimeout(2000);

  // 3. Verify segmented control tabs are visible
  console.log('Checking segmented tab controls...');
  const yuruyusTab = page.locator('button:has-text("Yürüyüş")');
  const istatistiklerTab = page.locator('button:has-text("İstatistikler")');
  const haritaTab = page.locator('button:has-text("Harita")');

  await expect(yuruyusTab.first()).toBeVisible();
  await expect(istatistiklerTab.first()).toBeVisible();
  await expect(haritaTab.first()).toBeVisible();

  // 4. Click "İstatistikler" tab (should redirect to walk page)
  console.log('Clicking İstatistikler tab (should redirect to walk page)...');
  await istatistiklerTab.first().click({ force: true });
  await page.waitForTimeout(3000);
  await expect(page).toHaveURL(/.*\/walk(\?.*)?$/);

  // 5. While on /walk, verify tab switcher is still visible and click "Harita" tab
  console.log('Clicking Harita tab on walk page...');
  const haritaTabOnStats = page.locator('button:has-text("Harita")');
  await expect(haritaTabOnStats.first()).toBeVisible();
  await haritaTabOnStats.first().click({ force: true });
  await page.waitForTimeout(3000);
  await expect(page).toHaveURL(/.*walk\/tracking.*/);

  // 6. While on /walk/tracking page, click "Yürüyüş" tab to return and open sheet
  console.log('Clicking Yürüyüş tab on tracking page...');
  const yuruyusTabOnMap = page.locator('button:has-text("Yürüyüş")');
  await expect(yuruyusTabOnMap.first()).toBeVisible();
  await yuruyusTabOnMap.first().click({ force: true });
  await page.waitForTimeout(3000);

  // Check that the URL contains community and openWalk=true
  await expect(page).toHaveURL(/.*community.*openWalk=true.*/);

  console.log('Errors caught during test:', errors.length);
  if (errors.length > 0) {
    console.error('All caught errors:', errors);
  }
  expect(errors).toEqual([]);
});
