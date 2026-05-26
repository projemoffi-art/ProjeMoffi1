import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('Explore and screenshot app pages to verify layout and control', async ({ page }) => {
  // Set 120s timeout
  test.setTimeout(120000);

  // Current conversation artifact directory
  const artifactDir = 'C:\\Users\\uveys\\.gemini\\antigravity\\brain\\dc4440ec-9fb6-450a-b62f-3019b89e8ae7';
  
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  // Mobile Viewport size (iPhone 12/13/14)
  await page.setViewportSize({ width: 390, height: 844 });
  
  console.log('Navigating to root to bypass onboarding...');
  await page.goto('/');
  await page.waitForTimeout(3000);

  // Bypass onboarding and force mock mode via localStorage
  await page.evaluate(() => {
    localStorage.setItem('moffi_force_mock', 'true');
    localStorage.setItem('moffi_onboarded', 'true');
    localStorage.setItem('moffipet_onboarding_seen', 'true');
    localStorage.setItem('moffi_active_pet_id', 'pet-1');
  });

  // Helper to dismiss overlays
  const dismissOverlays = async () => {
    console.log('Dismissing overlays...');
    const closeBtn = page.locator('button:has-text("✕")');
    let safetyCounter = 0;
    while (safetyCounter < 5) {
      try {
        const count = await closeBtn.count();
        if (count === 0) break;
        await closeBtn.first().click({ timeout: 1500 });
        await page.waitForTimeout(500);
      } catch (err) {
        console.log('Overlay close failed:', err.message);
        break;
      }
      safetyCounter++;
    }
  };

  // 1. Dashboard/Community
  console.log('Navigating to Community Dashboard...');
  await page.goto('/community');
  await page.waitForTimeout(4000);
  await dismissOverlays();
  await page.screenshot({ path: path.join(artifactDir, 'app_1_community.png'), fullPage: true });

  // 2. Quests
  console.log('Navigating to Quests...');
  await page.goto('/quests');
  await page.waitForTimeout(4000);
  await dismissOverlays();
  await page.screenshot({ path: path.join(artifactDir, 'app_2_quests.png'), fullPage: true });

  // 3. Shop
  console.log('Navigating to Shop...');
  await page.goto('/shop');
  await page.waitForTimeout(4000);
  await dismissOverlays();
  await page.screenshot({ path: path.join(artifactDir, 'app_3_shop.png'), fullPage: true });

  // 4. Walk
  console.log('Navigating to Walk...');
  await page.goto('/walk');
  await page.waitForTimeout(4000);
  await dismissOverlays();
  await page.screenshot({ path: path.join(artifactDir, 'app_4_walk.png'), fullPage: true });

  // 5. Vet
  console.log('Navigating to Vet...');
  await page.goto('/vet');
  await page.waitForTimeout(4000);
  await dismissOverlays();
  await page.screenshot({ path: path.join(artifactDir, 'app_5_vet.png'), fullPage: true });

  // 6. Profile
  console.log('Navigating to Profile milo...');
  await page.goto('/profile/milo');
  await page.waitForTimeout(4000);
  await dismissOverlays();
  await page.screenshot({ path: path.join(artifactDir, 'app_6_profile.png'), fullPage: true });

  console.log('Successfully completed control and took screenshots!');
});
