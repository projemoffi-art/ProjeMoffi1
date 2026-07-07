import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Screenshot PetShop and Topluluk pages to inspect layout', async ({ page }) => {
  test.setTimeout(120000);

  const artifactDir = 'C:\\Users\\uveys\\.gemini\\antigravity\\brain\\dc4440ec-9fb6-450a-b62f-3019b89e8ae7';

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

  // 1. PetShop
  console.log('Navigating to PetShop...');
  await page.goto('/petshop');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(artifactDir, 'panel_petshop.png'), fullPage: true });

  // 2. Topluluk Radar Lost
  console.log('Navigating to Topluluk Radar Lost...');
  await page.goto('/topluluk?tab=radar&mode=lost');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(artifactDir, 'panel_topluluk_lost.png'), fullPage: true });

  // 3. Topluluk Radar Adopt
  console.log('Navigating to Topluluk Radar Adopt...');
  await page.goto('/topluluk?tab=radar&mode=adopt');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(artifactDir, 'panel_topluluk_adopt.png'), fullPage: true });

  // 4. Vet Page
  console.log('Navigating to Vet Page...');
  await page.goto('/vet');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(artifactDir, 'panel_vet.png'), fullPage: true });

  console.log('Successfully captured screenshots!');
});
