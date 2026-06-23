import { test, expect } from '@playwright/test';

test('Pet Care Hub Modal should switch pets, award PatiPuan on goal completion, log and delete meals', async ({ page }) => {
  // Go to root page and configure mock storage
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('moffi_force_mock', 'true');
    localStorage.setItem('moffi_onboarded', 'true');
    localStorage.setItem('moffipet_onboarding_seen', 'true');
    localStorage.setItem('moffi_local_active_pet_id', '"pet-1"');
    
    // Custom pets list with custom target values
    const petsData = [
       {
          id: 'pet-1',
          name: 'Milo',
          breed: 'Golden Retriever',
          weight: '12 kg',
          gender: 'Erkek',
          image: '',
          water_target: 200,
          food_target: 400
       },
       {
          id: 'pet-2',
          name: 'Luna',
          breed: 'French Bulldog',
          weight: '8 kg',
          gender: 'Dişi',
          image: '',
          water_target: 300,
          food_target: 500
       }
    ];
    localStorage.setItem('moffi_local_pets', JSON.stringify(petsData));
    localStorage.setItem('moffi_coins_pet-1', '0');
    localStorage.setItem('moffi_coins_pet-2', '0');
  });

  // Track errors and logs
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    console.error('BROWSER ERROR:', err);
    errors.push(err.message + '\n' + err.stack);
  });
  page.on('console', (msg) => {
    console.log('PAGE LOG:', msg.text());
  });

  // 1. Go to community page
  console.log('Navigating to /community...');
  await page.goto('/community');
  await page.waitForTimeout(3000);

  // 2. Click "Günlük Hedefler" progress rings text to trigger the Care Hub modal
  console.log('Clicking daily progress rings area...');
  const ringsTrigger = page.getByText("Günlük Hedefler").first();
  await expect(ringsTrigger).toBeVisible();
  await ringsTrigger.click({ force: true });
  await page.waitForTimeout(1500);

  // 3. Verify Care Hub modal is open and has "Milo Bakım Merkezi" as default title
  console.log('Checking if Care Hub is open with Milo...');
  const careHubTitle = page.locator('h3:has-text("Milo Bakım Merkezi")');
  await expect(careHubTitle.first()).toBeVisible();

  // 4. Test Water Logging & Gamification: Add 150ml twice (total 300ml, exceeding 200ml target)
  console.log('Clicking "+150 ml" water logger twice to trigger completion...');
  const waterBtn = page.getByTestId("water-add-150").first();
  await expect(waterBtn).toBeVisible();
  await waterBtn.click({ force: true });
  await page.waitForTimeout(500);
  await waterBtn.click({ force: true });
  await page.waitForTimeout(1000);

  // Check if +10 Patipuan has been awarded in localstorage
  const miloCoins = await page.evaluate(() => localStorage.getItem('moffi_coins_pet-1'));
  console.log('Coins for Milo:', miloCoins);
  expect(miloCoins).toBe('10');

  // 5. Test Pet Switching: Switch to Luna inside the Care Hub
  console.log('Switching to Luna inside Care Hub...');
  const lunaBtn = page.getByTestId("pet-switcher-btn-pet-2").first();
  await expect(lunaBtn).toBeVisible();
  await lunaBtn.dispatchEvent('click');
  await page.waitForTimeout(1500);

  // Verify that the title updates to "Luna Bakım Merkezi"
  const lunaHubTitle = page.locator('h3:has-text("Luna Bakım Merkezi")');
  await expect(lunaHubTitle.first()).toBeVisible();

  // Switch back to Milo
  console.log('Switching back to Milo...');
  const miloBtn = page.getByTestId("pet-switcher-btn-pet-1").first();
  await expect(miloBtn).toBeVisible();
  await miloBtn.dispatchEvent('click');
  await page.waitForTimeout(1500);
  await expect(careHubTitle.first()).toBeVisible();

  // 6. Test Nutrition Logging & Deletion: Add a meal and delete it
  console.log('Logging dry food meal...');
  const mealBtn = page.locator('button:has-text("Yaş Konserve Mama")').first();
  await expect(mealBtn).toBeVisible();
  await mealBtn.click({ force: true });
  await page.waitForTimeout(1000);

  // Verify log feed shows "Yaş Konserve Mama"
  const logFeedItem = page.locator('p:has-text("Yaş Konserve Mama")');
  await expect(logFeedItem.first()).toBeVisible();

  // Intercept the confirm dialog and delete the meal
  console.log('Deleting logged meal item...');
  page.once('dialog', dialog => {
    console.log('Browser dialog shown:', dialog.message());
    dialog.accept();
  });
  
  const deleteBtn = page.locator('button[data-testid^="delete-meal-"]').first();
  await expect(deleteBtn).toBeVisible();
  await deleteBtn.click({ force: true });
  await page.waitForTimeout(1000);

  // Verify the log item is removed
  await expect(logFeedItem).not.toBeVisible();

  // 7. Close modal
  console.log('Closing Care Hub modal...');
  const closeBtn = page.getByTestId("close-care-hub").first();
  await expect(closeBtn).toBeVisible();
  await closeBtn.click({ force: true });
  await page.waitForTimeout(1000);
  
  await expect(careHubTitle).not.toBeVisible();

  console.log('Errors caught during test:', errors.length);
  expect(errors).toEqual([]);
});
