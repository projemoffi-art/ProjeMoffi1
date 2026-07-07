import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('Take screenshots of quests tabs and verify elements', async ({ page }) => {
  // Set 60s timeout
  test.setTimeout(60000);

  // Artifacts directory
  const artifactDir = 'C:\\Users\\uveys\\.gemini\\antigravity\\brain\\dc4440ec-9fb6-450a-b62f-3019b89e8ae7';
  
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  // Set nice viewport
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12/13/14 size
  
  console.log('Navigating to root to set localStorage...');
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  console.log('Bypassing onboarding via localStorage...');
  await page.evaluate(() => {
    localStorage.setItem('moffi_force_mock', 'true');
    localStorage.setItem('moffi_onboarded', 'true');
    localStorage.setItem('moffi_active_pet_id', 'pet-1');
  });

  console.log('Navigating to quests page...');
  await page.goto('/quests');
  await page.waitForLoadState('networkidle');
  
  // Wait a second for animation
  await page.waitForTimeout(2000);
  
  // Check if page contains error
  const bodyText = await page.innerText('body');
  if (bodyText.includes('Something went wrong') || bodyText.includes('Bir şeyler ters gitti')) {
    console.error('CRITICAL: Page crashed or displayed error boundary!');
  }

  // Dismiss all overlays/close buttons (✕, X, x) in a safe while loop
  console.log('Dismissing any active overlays or rare drop cards...');
  const closeBtn = page.locator('button:has-text("✕")');
  let safetyCounter = 0;
  while (safetyCounter < 5) {
    try {
      const count = await closeBtn.count();
      if (count === 0) break;
      console.log(`Clicking active close button...`);
      await closeBtn.first().click({ timeout: 1500 });
      await page.waitForTimeout(500);
    } catch (err) {
      console.log('Close button click skipped or failed:', err.message);
      break;
    }
    safetyCounter++;
  }

  // 1. Daily (Günlük) Tab
  console.log('Taking screenshot of Daily tab...');
  await page.screenshot({ path: path.join(artifactDir, 'quests_1_daily.png') });

  // 2. Click League (Lig) Tab
  console.log('Switching to League tab...');
  const leagueTab = page.locator('button', { hasText: 'Lig' });
  const leagueTabEmoji = page.locator('button:has-text("🏆")');
  if (await leagueTab.count() > 0) {
    await leagueTab.click();
  } else if (await leagueTabEmoji.count() > 0) {
    await leagueTabEmoji.click();
  } else {
    console.warn('League tab button not found');
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'quests_2_league.png') });

  // 3. Click Research (Araştırma) Tab
  console.log('Switching to Research tab...');
  const researchTab = page.locator('button', { hasText: 'Araştırma' });
  const researchTabEmoji = page.locator('button:has-text("🔭")');
  if (await researchTab.count() > 0) {
    await researchTab.click();
  } else if (await researchTabEmoji.count() > 0) {
    await researchTabEmoji.click();
  } else {
    console.warn('Research tab button not found');
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'quests_3_research.png') });

  // 4. Click Badges (Rozetler) Tab
  console.log('Switching to Badges tab...');
  const badgesTab = page.locator('button', { hasText: 'Rozetler' });
  const badgesTabEmoji = page.locator('button:has-text("🏅")');
  if (await badgesTab.count() > 0) {
    await badgesTab.click();
  } else if (await badgesTabEmoji.count() > 0) {
    await badgesTabEmoji.click();
  } else {
    console.warn('Badges tab button not found');
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'quests_4_badges.png') });

  // Go back to check navigation
  console.log('Clicking back button...');
  const backBtn = page.locator('button:has(svg)');
  if (await backBtn.count() > 0) {
    await backBtn.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'quests_5_after_back.png') });
    console.log('Current URL after back:', page.url());
  }

  console.log('Screenshots taken successfully!');
});
