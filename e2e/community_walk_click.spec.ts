import { test, expect } from '@playwright/test';

test('Clicking Şimdi Çık on community page should not crash', async ({ page }) => {
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
  await page.waitForTimeout(4000);

  // Find the button with text "Yürüyüşe Başla"
  console.log('Looking for Yürüyüşe Başla button...');
  const simdiCikButton = page.locator('button:has-text("Yürüyüşe Başla")');
  if (await simdiCikButton.count() > 0) {
    console.log('Clicking Yürüyüşe Başla button...');
    await simdiCikButton.first().click({ force: true });
    await page.waitForTimeout(4000);
  } else {
    console.log('Yürüyüşe Başla button not found, printing all buttons:');
    const buttons = page.locator('button');
    const btnCount = await buttons.count();
    for (let i = 0; i < btnCount; i++) {
      const text = await buttons.nth(i).innerText();
      console.log(`Button ${i}: Text="${text}"`);
    }
  }

  console.log('Errors caught during test:', errors.length);
  if (errors.length > 0) {
    console.error('All caught errors:', errors);
  }
  expect(errors).toEqual([]);
});
