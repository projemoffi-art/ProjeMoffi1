import { test, expect } from '@playwright/test';

test('Walk start and finish flow should not crash', async ({ page }) => {
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

  // 1. Go directly to walk tracking page
  console.log('Navigating directly to /walk/tracking...');
  await page.goto('/walk/tracking');
  await page.waitForTimeout(4000);

  // Print all visible buttons for debugging
  const buttons = page.locator('button');
  const btnCount = await buttons.count();
  console.log(`Found ${btnCount} buttons on page`);
  for (let i = 0; i < btnCount; i++) {
    const text = await buttons.nth(i).innerText();
    console.log(`Button ${i}: Text="${text}"`);
  }

  // Under mock mode, walk starts automatically or we can trigger play/pause
  console.log('Looking for play/pause button...');
  const playButton = page.locator('button:has(svg.lucide-play), button:has(svg.lucide-pause)');
  if (await playButton.count() > 0) {
    console.log('Clicking play/pause button...');
    await playButton.first().click({ force: true });
    await page.waitForTimeout(2000);
  }

  // 2. We are on tracking page. Let's trigger stop/finish walk.
  console.log('Looking for stop button...');
  const stopButton = page.locator('button:has(svg.lucide-stop-circle), button:has(.lucide-stop-circle)');
  if (await stopButton.count() > 0) {
    console.log('Clicking stop button...');
    await stopButton.first().click({ force: true });
    await page.waitForTimeout(1500);
  }

  // Look for finish confirmation button (kırmızı kare)
  const finishConfirmButton = page.locator('button:has(svg.lucide-square), button:has(.lucide-square)');
  if (await finishConfirmButton.count() > 0) {
    console.log('Clicking finish confirmation button...');
    await finishConfirmButton.first().click({ force: true });
    await page.waitForTimeout(2000);
  }

  console.log('Errors caught during test:', errors.length);
  if (errors.length > 0) {
    console.error('All caught errors:', errors);
  }
  expect(errors).toEqual([]);
});
