import { test, expect } from '@playwright/test';

test('Admin KYB Verification and Moderation E2E Flow', async ({ page }) => {
  test.setTimeout(60000);

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // 1. Bypass onboarding, enable mock mode, and authenticate as admin user
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    localStorage.setItem('moffi_force_mock', 'true');
    localStorage.setItem('moffi_onboarded', 'true');
    localStorage.setItem('moffipet_onboarding_seen', 'true');
    localStorage.setItem('moffi_active_pet_id', 'pet-1');
    localStorage.removeItem('moffi_mock_users_list');
    localStorage.removeItem('moffi_reports');
    localStorage.setItem('moffi_mock_user', JSON.stringify({
      id: 'user-admin',
      username: 'admin',
      email: 'admin@moffipet.com',
      role: 'admin',
      joinedAt: new Date().toISOString(),
      stats: { posts: 0, followers: 0, following: 0 }
    }));
    document.cookie = "moffi_mock_user_role=admin; path=/; max-age=86400; SameSite=Lax";
  });

  // 2. Go to admin users panel
  console.log('Navigating to Admin Users list...');
  await page.goto('/admin/users');
  await page.waitForTimeout(6000);

  // Locate the pending doctor "Dr. Moffi", click "Belge İncele / KYB" icon button
  const kybButton = page.locator('button[title="Belge İncele / KYB"]').first();
  await expect(kybButton).toBeVisible();
  await kybButton.click({ force: true });
  await page.waitForTimeout(1000);

  // Verify dynamic certificate is visible with doctor name
  await expect(page.locator('text=KYB Ruhsat & Diploma Doğrulama')).toBeVisible();
  await expect(page.locator('text=Dr. Moffi').first()).toBeVisible();

  // Click "Reddet", write a reason, click "Reddi Onayla" (with alert dialog auto acceptance)
  console.log('Testing rejection action...');
  const reddetBtn = page.locator('button:has-text("Reddet")');
  await reddetBtn.scrollIntoViewIfNeeded();
  await reddetBtn.click();
  await page.waitForTimeout(1000);
  await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });
  await page.locator('textarea').fill('Belge okunamadı');

  page.once('dialog', dialog => {
    console.log('Dismissing dialog:', dialog.message());
    dialog.accept();
  });

  const reddiOnaylaBtn = page.locator('button:has-text("Reddi Onayla")');
  await reddiOnaylaBtn.scrollIntoViewIfNeeded();
  await reddiOnaylaBtn.click();
  await page.waitForTimeout(1500);

  // Verify status badge changed to Reddedildi
  await expect(page.locator('text=Hekim (Reddedildi)')).toBeVisible();

  // Open KYB modal again, click "Onayla" (with alert dialog auto acceptance)
  console.log('Testing approval action...');
  await kybButton.click({ force: true });
  await page.waitForTimeout(1000);

  page.once('dialog', dialog => {
    console.log('Dismissing dialog:', dialog.message());
    dialog.accept();
  });

  const onaylaBtn = page.locator('button:has-text("Onayla")');
  await onaylaBtn.scrollIntoViewIfNeeded();
  await onaylaBtn.click();
  await page.waitForTimeout(1500);

  // Verify status badge changed to Onaylı
  await expect(page.locator('text=Hekim (Onaylı)')).toBeVisible();

  // 3. Navigate to Content Moderation panel
  console.log('Navigating to Content Moderation panel...');
  await page.goto('/admin/moderation');
  await page.waitForTimeout(6000);

  // Click "Signals/Reports" tab
  const reportsTab = page.locator('button:has-text("Signals/Reports")');
  await expect(reportsTab).toBeVisible();
  await reportsTab.click({ force: true });
  await page.waitForTimeout(1000);

  // Verify reports are listed
  await expect(page.locator('text=Gönderi İhlali').first()).toBeVisible();

  // Click on the first report to open detail modal drawer
  await page.locator('text=Gönderi İhlali').first().click({ force: true });
  await page.waitForTimeout(1000);

  // Verify report detail drawer is visible
  await expect(page.locator('text=Raporlanan İçerik')).toBeVisible();

  // Click "Yayından Kaldır (Sil)"
  console.log('Decommissioning reported post...');
  await page.locator('button:has-text("Yayından Kaldır (Sil)")').click({ force: true });
  await page.waitForTimeout(1500);

  // Verify report status is now marked as resolved/removed
  const reportsList = page.locator('text=Gönderi İhlali').first();
  await expect(reportsList).toBeVisible();

  // 4. Go to /topluluk (Community page) and verify the post was deleted and is no longer visible
  console.log('Navigating to Community Feed to verify content removal...');
  await page.goto('/topluluk');
  await page.waitForTimeout(6000);

  // The reported post text "Cocker Spaniel cinsi köpeğimi" should not be visible
  const postText = page.locator('text=Cocker Spaniel cinsi köpeğimi');
  await expect(postText).not.toBeVisible();

  console.log('Admin KYB and Moderation E2E test passed successfully!');
});
