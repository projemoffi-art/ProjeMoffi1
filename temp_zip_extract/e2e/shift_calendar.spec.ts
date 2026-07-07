import { test, expect } from '@playwright/test';

test('Shift Configuration and Dynamic Reactive Calendar Collision Flow', async ({ page }) => {
  test.setTimeout(60000);

  // 1. Bypass onboarding, enable mock mode, and authenticate as business user
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    localStorage.setItem('moffi_force_mock', 'true');
    localStorage.setItem('moffi_onboarded', 'true');
    localStorage.setItem('moffipet_onboarding_seen', 'true');
    localStorage.setItem('moffi_active_pet_id', 'pet-1');
    localStorage.setItem('moffi_mock_user', JSON.stringify({
      id: 'user-hekim',
      username: 'Dr. Moffi',
      email: 'doctor@moffipet.com',
      role: 'business',
      joinedAt: new Date().toISOString(),
      stats: { posts: 0, followers: 0, following: 0 }
    }));
    document.cookie = "moffi_mock_user_role=business; path=/; max-age=86400; SameSite=Lax";
  });

  // 2. Go to business appointments settings tab
  console.log('Navigating to Business Appointments settings...');
  await page.goto('/business/appointments');
  await page.waitForTimeout(2500);

  // Click on Vardiya & Takvim Ayarları tab
  const settingsTab = page.locator('button:has-text("Vardiya & Takvim Ayarları")');
  await expect(settingsTab).toBeVisible();
  await settingsTab.click({ force: true });
  await page.waitForTimeout(1000);

  // Configure Mesai Saatleri: Start=10:00 (Select 0), End=16:00 (Select 1), Slot=30 (Select 4)
  console.log('Configuring shifts (10:00 - 16:00, 30 min duration)...');
  const selects = page.locator('select');
  await selects.nth(0).selectOption('10:00'); // Mesai Başlangıç
  await selects.nth(1).selectOption('16:00'); // Mesai Bitiş
  await selects.nth(4).selectOption('30');    // Randevu Muayene Süresi

  // Register dialog handler to automatically accept save confirmation alert
  page.once('dialog', dialog => {
    console.log('Dismissing alert:', dialog.message());
    dialog.accept();
  });

  // Save Settings
  const saveBtn = page.locator('button:has-text("Ayarları Kaydet")');
  await saveBtn.click({ force: true });
  await page.waitForTimeout(1000);

  // 3. Switch to Customer Mode & Go to /vet page
  console.log('Navigating to Vet portal...');
  await page.goto('/vet');
  await page.waitForTimeout(3500);

  // Open randevu modal
  const bookBtn = page.locator('button:has-text("Randevu Seç")').first();
  await expect(bookBtn).toBeVisible();
  await bookBtn.click({ force: true });
  await page.waitForTimeout(1000);

  // Select tomorrow's date to avoid today's past hours filter
  console.log('Selecting tomorrow for clean slot listing...');
  const tomorrowBtn = page.locator('button:has-text("Yarın")').first();
  await expect(tomorrowBtn).toBeVisible();
  await tomorrowBtn.click({ force: true });
  await page.waitForTimeout(500);

  // Verify that slots are dynamically generated based on 10:00 - 16:00 work hours, excluding 12:00 - 13:00 lunch break
  console.log('Checking generated slots...');
  const slots = page.locator('button:has-text(":")');
  const slotCount = await slots.count();
  console.log(`Found ${slotCount} active slot buttons.`);
  
  // 10:00 - 12:00 (10:00, 10:30, 11:00, 11:30) = 4 slots
  // 12:00 - 13:00 lunch break = skipped
  // 13:00 - 16:00 (13:00, 13:30, 14:00, 14:30, 15:00, 15:30) = 6 slots
  // Total expected = 10 slots
  expect(slotCount).toBe(10);
  await expect(slots.nth(0)).toHaveText('10:00');
  await expect(slots.nth(1)).toHaveText('10:30');
  await expect(slots.nth(2)).toHaveText('11:00');
  await expect(slots.nth(3)).toHaveText('11:30');
  await expect(slots.nth(4)).toHaveText('13:00'); // Check lunch break skip

  // Book the 10:30 slot
  console.log('Booking 10:30 slot...');
  await slots.nth(1).dispatchEvent('click');
  await page.waitForTimeout(500);

  // Click Proceed to Payment
  const proceedBtn = page.locator('button:has-text("Ödeme Aşamasına Geç")');
  await expect(proceedBtn).toBeEnabled({ timeout: 5000 });
  await proceedBtn.dispatchEvent('click');
  await page.waitForTimeout(1000);

  // Fill simulated payment checkout details
  await page.fill('input[placeholder="Ad Soyad"]', 'Milo Luna');
  await page.fill('input[placeholder="4242 4242 4242 4242"]', '4242424242424242');
  await page.fill('input[placeholder="MM/YY"]', '12/29');
  await page.fill('input[placeholder="123"]', '123');
  await page.waitForTimeout(500);

  // Click complete payment button
  const confirmBtn = page.locator('button:has-text("Ödemeyi Tamamla ve Bloke Et")');
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
  await confirmBtn.dispatchEvent('click');

  // Wait for success toast
  console.log('Waiting for confirmation toast...');
  await page.waitForSelector('text=Randevu Oluşturuldu', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(1000);

  // 4. Re-open modal to verify that 10:30 is now filtered out (booked)
  console.log('Re-opening Randevu modal to verify collision filtering...');
  await bookBtn.click({ force: true });
  await page.waitForTimeout(1000);

  await expect(tomorrowBtn).toBeVisible();
  await tomorrowBtn.click({ force: true });
  await page.waitForTimeout(500);

  // Count slot buttons again
  const nextSlotCount = await slots.count();
  console.log(`Found ${nextSlotCount} active slot buttons after booking.`);
  
  // Expect exactly 9 slots now - 10:30 should be filtered out
  expect(nextSlotCount).toBe(9);
  await expect(slots.nth(0)).toHaveText('10:00');
  await expect(slots.nth(1)).toHaveText('11:00'); // 10:30 skipped, nth(1) is now 11:00
  await expect(slots.nth(2)).toHaveText('11:30');

  console.log('Reactive dynamic shift calendar E2E test passed successfully!');
});
