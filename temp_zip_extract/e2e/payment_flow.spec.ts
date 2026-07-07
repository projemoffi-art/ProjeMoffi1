import { test, expect } from '@playwright/test';

test('Stripe/PayTR Escrow, Capture, and Refund E2E Financial Lifecycle', async ({ page }) => {
  test.setTimeout(180000);

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // ==========================================
  // PHASE 1: B2C USER - MAKE PRE-AUTHORIZED BOOKING
  // ==========================================
  console.log('PHASE 1: Setting up B2C User...');
  await page.goto('/');
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    localStorage.setItem('moffi_force_mock', 'true');
    localStorage.setItem('moffi_onboarded', 'true');
    localStorage.setItem('moffipet_onboarding_seen', 'true');
    localStorage.setItem('moffi_active_pet_id', '349b89f8-c5e5-46e8-abf7-b2e41b29d39a'); // Milo
    
    // Reset financial states
    localStorage.setItem('moffi_fiat_balance', '12450.00');
    localStorage.removeItem('moffi_fiat_transactions');
    localStorage.removeItem('moffi_pending_appointments');
    localStorage.removeItem('moffi_confirmed_appointments');
    localStorage.removeItem('moffi_business_transactions');
    
    // B2C User session
    localStorage.setItem('moffi_mock_user', JSON.stringify({
      id: 'user-uveys',
      username: 'uveys',
      email: 'uveys@moffi.com',
      role: 'user',
      joinedAt: new Date().toISOString(),
      stats: { posts: 0, followers: 0, following: 0 }
    }));
    document.cookie = "moffi_mock_user_role=user; path=/; max-age=86400; SameSite=Lax";
  });

  // Navigate to Veterinary portal
  console.log('Navigating to Veterinary Portal...');
  await page.goto('/vet');
  await page.waitForTimeout(6000);

  // Click 'Randevu Seç' on the first premium clinic
  console.log('Opening appointment slot modal...');
  const randevuSecBtn = page.locator('button:has-text("Randevu Seç")').first();
  await expect(randevuSecBtn).toBeVisible();
  await randevuSecBtn.click();
  await page.waitForTimeout(1500);

  // Select a time slot
  console.log('Selecting slot and proceeding...');
  // Click on Tomorrow button to ensure slots are available regardless of time of day
  const tomorrowBtn = page.locator('button:has-text("Yarın")');
  await expect(tomorrowBtn).toBeVisible();
  await tomorrowBtn.click();
  await page.waitForTimeout(500);

  // Find grid buttons for time slots
  const firstSlot = page.locator('button:has-text(":")').first();
  await expect(firstSlot).toBeVisible();
  await firstSlot.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await firstSlot.evaluate(el => (el as HTMLButtonElement).click());
  await page.waitForTimeout(500);

  // Click 'Ödeme Aşamasına Geç'
  const proceedToPaymentBtn = page.locator('button:has-text("Ödeme Aşamasına Geç")');
  await expect(proceedToPaymentBtn).toBeVisible();
  await proceedToPaymentBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await proceedToPaymentBtn.evaluate(el => (el as HTMLButtonElement).click());
  await page.waitForTimeout(1500);

  // Assert payment modal is visible
  await expect(page.locator('text=Güvenli Ödeme')).toBeVisible();

  // Test Case 1: Limit error check (ends in 9999)
  console.log('Testing limit insufficient card rejection...');
  await page.locator('input[placeholder="Ad Soyad"]').fill('Uveys Limit Test');
  await page.locator('input[placeholder="4242 4242 4242 4242"]').fill('4312 4312 4312 9999');
  await page.locator('input[placeholder="MM/YY"]').fill('12/29');
  await page.locator('input[placeholder="123"]').fill('555');
  
  const submitPayBtn = page.locator('button:has-text("Ödemeyi Tamamla ve Bloke Et")');
  await submitPayBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await submitPayBtn.evaluate(el => (el as HTMLButtonElement).click());
  await page.waitForTimeout(1000);
  await expect(page.locator('text=Yetersiz Limit')).toBeVisible();

  // Test Case 2: Card Blocked check (ends in 1111)
  console.log('Testing blocked card rejection...');
  await page.locator('input[placeholder="4242 4242 4242 4242"]').fill('4111 1111 1111 1111');
  await submitPayBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await submitPayBtn.evaluate(el => (el as HTMLButtonElement).click());
  await page.waitForTimeout(1000);
  await expect(page.locator('text=Kart Geçersiz / Blokeli')).toBeVisible();

  // Test Case 3: Successful Card (4242 4242 4242 4242)
  console.log('Testing successful pre-authorization (escrow)...');
  await page.locator('input[placeholder="4242 4242 4242 4242"]').fill('4242 4242 4242 4242');
  
  await submitPayBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await submitPayBtn.evaluate(el => (el as HTMLButtonElement).click());
  
  // Handle OTP verification modal
  console.log('Filling PayTR OTP verification code...');
  const otpInput = page.locator('input[placeholder="******"]');
  await expect(otpInput).toBeVisible({ timeout: 15000 });
  await otpInput.fill('123456');
  await otpInput.press('Enter');

  // Wait for success toast & modal close
  await expect(page.locator('text=Ödeme Başarılı')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(4000);

  // Navigate to /wallet to verify balance deduction and escrow record
  console.log('Navigating to B2C wallet to verify blocked transaction...');
  try {
    await page.goto('/wallet', { waitUntil: 'load', timeout: 15000 });
  } catch (e) {
    console.log('Wallet page load failed or timed out, retrying...', e);
    await page.goto('/wallet', { waitUntil: 'load', timeout: 15000 });
  }
  await page.waitForTimeout(3000);
 
  // Balance should be: 12450.00 - 350.00 = 12100.00
  const walletBalance = page.locator('text=₺12.100,00');
  try {
    await expect(walletBalance).toBeVisible({ timeout: 10000 });
  } catch (e) {
    console.log('Wallet balance not visible, reloading page for compilation sync...');
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(walletBalance).toBeVisible({ timeout: 10000 });
  }
  await expect(page.locator('text=Bloke').first()).toBeVisible();

  // ==========================================
  // PHASE 2: B2B DOCTOR - ONLAY/CAPTURE FLOW
  // ==========================================
  console.log('PHASE 2: Logging in as Doctor to Approve...');
  await page.goto('/');
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    // Authenticate as B2B Doctor
    localStorage.setItem('moffi_mock_user', JSON.stringify({
      id: 'user-hekim',
      username: 'Dr. Moffi',
      email: 'doctor@moffipet.com',
      role: 'business',
      businessType: 'vet',
      businessName: 'Moffi Veteriner Kliniği',
      businessApproved: true,
      kybStatus: 'approved'
    }));
    document.cookie = "moffi_mock_user_role=business; path=/; max-age=86400; SameSite=Lax";
  });

  // Navigate to business appointments dashboard
  console.log('Navigating to B2B appointments dashboard...');
  try {
    await page.goto('/business/appointments', { waitUntil: 'load', timeout: 15000 });
  } catch (e) {
    console.log('Appointments page load failed, retrying...', e);
    await page.goto('/business/appointments', { waitUntil: 'load', timeout: 15000 });
  }
  await page.waitForTimeout(3000);
 
  // Confirm booking is listed under pending requests
  const pendingApt = page.locator('text=Milo');
  try {
    await expect(pendingApt).toBeVisible({ timeout: 10000 });
  } catch (e) {
    console.log('Pending appointment not visible, reloading...');
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(pendingApt).toBeVisible({ timeout: 10000 });
  }

  // Click 'Onayla' to capture the funds
  console.log('Capturing payment by approving booking...');
  page.once('dialog', dialog => {
    console.log('Dismissing approval dialog:', dialog.message());
    dialog.accept();
  });
  
  const approveBtn = page.locator('button:has-text("Onayla")').first();
  await approveBtn.scrollIntoViewIfNeeded();
  await approveBtn.click();
  await page.waitForTimeout(2000);

  // Go to /business/finance to verify doctor finance updates
  console.log('Navigating to B2B Finance page...');
  try {
    await page.goto('/business/finance', { waitUntil: 'load', timeout: 15000 });
  } catch (e) {
    console.log('Finance page load failed, retrying...', e);
    await page.goto('/business/finance', { waitUntil: 'load', timeout: 15000 });
  }
  await page.waitForTimeout(3000);
 
  // Net earnings should include seeded (₺1,300 - ₺130 = ₺1,170) + new captured appointment net (₺350 * 0.9 = ₺315) = ₺1,485.00
  // Available should be same. Let's assert net earnings / available reflects this.
  const financeBalance = page.locator('text=₺1.485,00').first();
  try {
    await expect(financeBalance).toBeVisible({ timeout: 10000 });
  } catch (e) {
    console.log('Finance balance not visible, reloading...');
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(financeBalance).toBeVisible({ timeout: 10000 });
  }
  await expect(page.locator('text=Randevu Onayı #').first()).toBeVisible();

  // ==========================================
  // PHASE 3: REFUND / REJECTION LIFECYCLE
  // ==========================================
  console.log('PHASE 3: Testing Refund Lifecycle...');
  // Let's create a new booking that we will reject
  console.log('Creating second booking to test rejection...');
  await page.goto('/');
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    // Authenticate back as user
    localStorage.setItem('moffi_mock_user', JSON.stringify({
      id: 'user-uveys',
      username: 'uveys',
      email: 'uveys@moffi.com',
      role: 'user'
    }));
    document.cookie = "moffi_mock_user_role=user; path=/; max-age=86400; SameSite=Lax";
  });

  await page.goto('/vet');
  await page.waitForTimeout(6000);

  await page.locator('button:has-text("Randevu Seç")').first().click();
  await page.waitForTimeout(1500);

  // Click Tomorrow button
  const tomorrowBtn2 = page.locator('button:has-text("Yarın")');
  await expect(tomorrowBtn2).toBeVisible();
  await tomorrowBtn2.click();
  await page.waitForTimeout(500);

  // Select another time slot
  const secondSlot = page.locator('button:has-text(":")').first();
  await secondSlot.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await secondSlot.evaluate(el => (el as HTMLButtonElement).click());
  await page.waitForTimeout(500);

  const secondProceed = page.locator('button:has-text("Ödeme Aşamasına Geç")');
  await secondProceed.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await secondProceed.evaluate(el => (el as HTMLButtonElement).click());
  await page.waitForTimeout(1500);

  // Complete Stripe checkout
  await page.locator('input[placeholder="Ad Soyad"]').fill('Uveys Refund Test');
  await page.locator('input[placeholder="4242 4242 4242 4242"]').fill('4242 4242 4242 4242');
  await page.locator('input[placeholder="MM/YY"]').fill('12/29');
  await page.locator('input[placeholder="123"]').fill('555');
  
  const secondSubmitPay = page.locator('button:has-text("Ödemeyi Tamamla ve Bloke Et")');
  await secondSubmitPay.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await secondSubmitPay.evaluate(el => (el as HTMLButtonElement).click());
  
  // Handle OTP verification modal
  console.log('Filling second PayTR OTP verification code...');
  const secondOtpInput = page.locator('input[placeholder="******"]');
  await expect(secondOtpInput).toBeVisible({ timeout: 15000 });
  await secondOtpInput.fill('123456');
  await secondOtpInput.press('Enter');

  await expect(page.locator('text=Ödeme Başarılı')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(4000);

  // Authenticate back as doctor
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    localStorage.setItem('moffi_mock_user', JSON.stringify({
      id: 'user-hekim',
      username: 'Dr. Moffi',
      email: 'doctor@moffipet.com',
      role: 'business',
      businessType: 'vet',
      businessName: 'Moffi Veteriner Kliniği',
      businessApproved: true,
      kybStatus: 'approved'
    }));
    document.cookie = "moffi_mock_user_role=business; path=/; max-age=86400; SameSite=Lax";
  });

  await page.goto('/business/appointments');
  await page.waitForTimeout(6000);

  // Click 'Reddet' to reject the request and release funds back to user
  console.log('Rejecting booking to trigger automatic refund...');
  page.once('dialog', dialog => {
    console.log('Dismissing rejection dialog:', dialog.message());
    dialog.accept();
  });
  
  const rejectBtn = page.locator('button:has-text("Reddet")').first();
  await rejectBtn.scrollIntoViewIfNeeded();
  await rejectBtn.click();
  await page.waitForTimeout(2000);

  // Go to /wallet as user and check if funds are refunded
  console.log('Going back to B2C wallet to confirm refund...');
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    localStorage.setItem('moffi_mock_user', JSON.stringify({
      id: 'user-uveys',
      username: 'uveys',
      email: 'uveys@moffi.com',
      role: 'user'
    }));
    document.cookie = "moffi_mock_user_role=user; path=/; max-age=86400; SameSite=Lax";
  });

  try {
    await page.goto('/wallet', { waitUntil: 'load', timeout: 15000 });
  } catch (e) {
    console.log('Final wallet navigation failed, retrying...', e);
    await page.goto('/wallet', { waitUntil: 'load', timeout: 15000 });
  }
  await page.waitForTimeout(3000);
 
  // Balance should be restored back to: 12100.00
  const finalBalance = page.locator('text=₺12.100,00');
  try {
    await expect(finalBalance).toBeVisible({ timeout: 10000 });
  } catch (e) {
    console.log('Final balance not visible, reloading...');
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(finalBalance).toBeVisible({ timeout: 10000 });
  }
  
  // Verify the refund transaction item exists
  await expect(page.locator('text=İade Edildi').first()).toBeVisible();

  console.log('E2E payment, capture, and refund escrow flows successfully verified! 💳✨');
});
