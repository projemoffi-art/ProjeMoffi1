import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Double-Sided Medical Consultation and Prescription Sync Flow', async ({ page }) => {
  test.setTimeout(60000);

  // 1. Bypass onboarding and force mock mode
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('/');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    localStorage.setItem('moffi_force_mock', 'true');
    localStorage.setItem('moffi_onboarded', 'true');
    localStorage.setItem('moffipet_onboarding_seen', 'true');
    localStorage.setItem('moffi_active_pet_id', 'pet-1');
  });

  // 2. Go to Vet page to book appointment
  console.log('Navigating to Vet page...');
  await page.goto('/vet');
  // Wait 3.5 seconds to ensure full Next.js hydration and event listener attachment
  await page.waitForTimeout(3500);

  // Click on the first clinic card's appointment button
  const bookBtn = page.locator('button:has-text("Randevu Seç")').first();
  await expect(bookBtn).toBeVisible();
  await bookBtn.click({ force: true });
  
  // Wait and verify the appointment modal is actually open
  console.log('Waiting for Randevu Oluştur modal to open...');
  await expect(page.locator('h2:has-text("Randevu Oluştur")')).toBeVisible({ timeout: 5000 });

  // Select the first available dynamic time slot button (all slots have colons, e.g. "13:30")
  console.log('Selecting available time slot...');
  const timeSlot = page.locator('button:has-text(":")').first();
  await expect(timeSlot).toBeVisible();
  await timeSlot.dispatchEvent('click');
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

  // Wait for success toast to confirm booking is complete
  console.log('Waiting for success confirmation toast...');
  await page.waitForSelector('text=Randevu Oluşturuldu', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);

  // 3. Log in as business user to bypass middleware redirect
  console.log('Setting credentials for business portal...');
  await page.evaluate(() => {
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

  // 4. Go to Business Appointments page
  console.log('Navigating to Business Appointments...');
  await page.goto('/business/appointments');
  await page.waitForTimeout(2000);

  // Accept the pending request for Milo & Luna specifically
  const acceptBtn = page.locator('button:has-text("Onayla")').first();
  await expect(acceptBtn).toBeVisible();
  await acceptBtn.click({ force: true });
  await page.waitForTimeout(1000);
 
  // 5. Start Consultation
  console.log('Starting medical consultation...');
  const appointmentRow = page.locator('div.group', { hasText: 'Milo & Luna' }).first();
  const consultBtn = appointmentRow.locator('button:has-text("Muayene Et")');
  await expect(consultBtn).toBeVisible();
  await consultBtn.click({ force: true });
  await page.waitForTimeout(1500);
 
  // Fill in diagnosis
  await page.fill('input[placeholder*="Otitis"]', 'Otitis Enfeksiyonu');
 
  // Add a vaccine
  await page.fill('input[placeholder*="Aşı seçin"]', 'Mantar Aşısı');
  await page.fill('input[placeholder*="LOT-98"]', 'LOT-MNT-988');
  await page.locator('button:has-text("Aşıyı Muayene Akışına Ekle")').click({ force: true });
  await page.waitForTimeout(500);
 
  // Add prescription
  await page.fill('input[placeholder*="Amoksisilin"]', 'Kortizon Krem');
  await page.fill('input[placeholder*="Günde"]', 'Günde 1 kez');
  await page.fill('input[placeholder*="5"]', '7');
  await page.locator('button:has-text("İlacı Reçeteye Ekle")').click({ force: true });
  await page.waitForTimeout(500);
 
  // Add critical notes
  await page.fill('textarea[placeholder*="pasaportta"]', 'Alerji: Tavuk etine alerjisi var');
 
  // Complete Consultation
  console.log('Completing consultation...');
  const completeBtn = page.locator('button:has-text("Muayeneyi Tamamla ve Kaydet")');
  await completeBtn.click({ force: true });
  await page.waitForTimeout(2000);
 
  // Verify appointment status updated to completed in the list
  const statusBadge = appointmentRow.locator('span:has-text("Tamamlandı")').first();
  await expect(statusBadge).toBeVisible();
 
  // Verify details read-only modal opens
  const detailBtn = appointmentRow.locator('button:has-text("Muayene Detayı")');
  await detailBtn.click({ force: true });
  await page.waitForTimeout(1500);
  await expect(page.locator('p:has-text("Otitis Enfeksiyonu")')).toBeVisible();
  await expect(page.locator('strong:has-text("Mantar Aşısı")')).toBeVisible();
  await expect(page.locator('strong:has-text("Kortizon Krem")')).toBeVisible();
  await expect(page.locator('p:has-text("Alerji: Tavuk etine alerjisi var")')).toBeVisible();
  
  await page.locator('button.w-10.h-10').first().click({ force: true });
  console.log('Double-sided consultation E2E flow verified successfully!');
});
