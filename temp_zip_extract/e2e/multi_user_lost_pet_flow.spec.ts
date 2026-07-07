import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Helper function to click an element by text using page.evaluate to ensure click execution
async function clickElementByText(page: any, selector: string, text: string) {
  await page.evaluate(({ sel, txt }) => {
    const elements = Array.from(document.querySelectorAll(sel));
    const el = elements.find(e => e.textContent?.trim().includes(txt));
    if (el) {
      (el as HTMLElement).click();
    } else {
      throw new Error(`Element matching "${sel}" with text "${txt}" not found`);
    }
  }, { sel: selector, txt: text });
}

test('Multi-user lost pet workflow test', async ({ browser }) => {
  // Set 120s timeout
  test.setTimeout(120000);

  // 1. Create dummy files in the OS temp directory
  const photo1 = path.join(os.tmpdir(), 'temp_dog1.png');
  const photo2 = path.join(os.tmpdir(), 'temp_dog2.png');
  fs.writeFileSync(photo1, 'dummy image content 1');
  fs.writeFileSync(photo2, 'dummy image content 2');

  // 2. Spawn two browser contexts (Owner and Reporter)
  const ownerContext = await browser.newContext();
  const reporterContext = await browser.newContext();

  const ownerPage = await ownerContext.newPage();
  const reporterPage = await reporterContext.newPage();

  // Listen to console and errors
  ownerPage.on('console', msg => console.log('OWNER CONSOLE:', msg.text()));
  ownerPage.on('pageerror', err => console.log('OWNER PAGE ERROR:', err.message));
  reporterPage.on('console', msg => console.log('REPORTER CONSOLE:', msg.text()));
  reporterPage.on('pageerror', err => console.log('REPORTER PAGE ERROR:', err.message));

  // Set viewport sizes to mobile
  await ownerPage.setViewportSize({ width: 390, height: 844 });
  await reporterPage.setViewportSize({ width: 390, height: 844 });

  try {
    // 3. Set localstorage mock configuration for Owner Page
    console.log('--- Owner Setting Up ---');
    await ownerPage.goto('/community');
    await ownerPage.evaluate(() => {
      localStorage.setItem('moffi_force_mock', 'true');
      localStorage.setItem('moffi_onboarded', 'true');
      localStorage.setItem('moffipet_onboarding_seen', 'true');
      const user = { id: 'owner-user', username: 'IlanSahibi', role: 'user' };
      localStorage.setItem('moffi_user', JSON.stringify(user));
      localStorage.setItem('moffi_mock_user', JSON.stringify(user));
      localStorage.setItem('moffi_local_current_user', JSON.stringify({
        id: 'owner-user',
        name: 'Ilan Sahibi',
        username: 'IlanSahibi',
        avatar: undefined,
        is_verified: false,
        subscription_status: 'free',
        wallet_balance: 0,
        moffi_coins: 0
      }));
      document.cookie = "moffi_mock_user_role=user; path=/; max-age=86400; SameSite=Lax";
    });
    await ownerPage.goto('/topluluk?tab=radar&mode=lost');
    await ownerPage.waitForTimeout(3000);

    // 4. Owner creates a lost pet alert with multiple photos
    console.log('Owner clicking "+ İlan Ekle" to add lost pet...');
    await clickElementByText(ownerPage, 'button', '+ İlan Ekle');
    await ownerPage.waitForTimeout(1000);

    console.log('Filling form fields...');
    await ownerPage.fill('input[placeholder="Örn: Buster"]', 'Gofret');
    await ownerPage.fill('input[placeholder="Örn: Golden Retriever"]', 'Golden Retriever');
    await ownerPage.fill('input[placeholder="Örn: Kadıköy Moda Sahili"]', 'Moda Sahil');
    await ownerPage.fill('textarea[placeholder*="Tasma rengi"]', 'Altın sarısı, çok sevimli Golden.');

    // Upload files
    console.log('Uploading multiple files...');
    const fileChooserPromise = ownerPage.waitForEvent('filechooser');
    await ownerPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Fotoğraf Ekle'));
      if (btn) btn.click();
      else throw new Error('Fotoğraf Ekle button not found');
    });
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([photo1, photo2]);
    await ownerPage.waitForTimeout(2000);

    console.log('Owner submitting SOS...');
    await clickElementByText(ownerPage, 'button', 'S.O.S Sinyali Gönder');
    await ownerPage.waitForTimeout(4000);

    // Get owner's localStorage state to share mock db records
    console.log('Extracting owner mock state...');
    const ownerStorage = await ownerPage.evaluate(() => {
      return { ...localStorage };
    });

    // 5. Reporter visits the community radar
    console.log('--- Reporter Setting Up ---');
    await reporterPage.goto('/community');
    await reporterPage.evaluate((storage) => {
      localStorage.clear();
      for (const [key, value] of Object.entries(storage)) {
        localStorage.setItem(key, value as string);
      }
      localStorage.setItem('moffi_force_mock', 'true');
      localStorage.setItem('moffi_onboarded', 'true');
      localStorage.setItem('moffipet_onboarding_seen', 'true');
      const user = { id: 'reporter-user', username: 'IhbarciDeniz', role: 'user' };
      localStorage.setItem('moffi_user', JSON.stringify(user));
      localStorage.setItem('moffi_mock_user', JSON.stringify(user));
      localStorage.setItem('moffi_local_current_user', JSON.stringify({
        id: 'reporter-user',
        name: 'Ihbarci Deniz',
        username: 'IhbarciDeniz',
        avatar: undefined,
        is_verified: false,
        subscription_status: 'free',
        wallet_balance: 0,
        moffi_coins: 0
      }));
      document.cookie = "moffi_mock_user_role=user; path=/; max-age=86400; SameSite=Lax";
    }, ownerStorage);
    await reporterPage.goto('/topluluk?tab=radar&mode=lost');
    await reporterPage.waitForTimeout(3000);

    // Reporter clicks the new Gofret ad (the last card matching 'Gofret')
    console.log('Reporter clicking the new ad for Gofret...');
    await reporterPage.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div.cursor-pointer'));
      const gofretCards = cards.filter(card => {
        const nameEl = card.querySelector('p.font-black');
        return nameEl && nameEl.textContent?.trim() === 'Gofret';
      });
      const newGofretCard = gofretCards[gofretCards.length - 1];
      if (newGofretCard) {
        (newGofretCard as HTMLElement).click();
      } else {
        throw new Error('New Gofret card not found');
      }
    });
    await reporterPage.waitForTimeout(3000);

    // Verify full-screen immersive details modal is opened
    console.log('Verifying full-screen modal contents...');
    await expect(reporterPage.locator('h1:has-text("Gofret")')).toBeVisible();

    // Reporter clicks the photo switcher
    const switcherButtons = reporterPage.locator('div.absolute.bottom-10.left-6 button');
    const count = await switcherButtons.count();
    console.log(`Found ${count} switcher photos.`);
    if (count > 1) {
       console.log('Clicking the second photo in switcher...');
       await switcherButtons.nth(1).click({ force: true });
       await reporterPage.waitForTimeout(2000);
    }

    // Reporter reports a sighting
    console.log('Reporter clicking "Onu Gördüm!"...');
    await clickElementByText(reporterPage, 'button', 'Onu Gördüm!');
    await reporterPage.waitForTimeout(2000);

    console.log('Reporter filling sighting description...');
    const textarea = reporterPage.locator('textarea');
    console.log('Reporter: waiting for textarea to be visible...');
    await expect(textarea).toBeVisible();
    console.log('Reporter: textarea is visible. Filling it...');
    await textarea.fill('Gofret parkta çocuklarla oynuyordu!');
    console.log('Reporter: textarea filled. Clicking "Güvenli Gönder"...');
    await clickElementByText(reporterPage, 'button', 'Güvenli Gönder');
    console.log('Reporter: clicked "Güvenli Gönder". Waiting 4s...');
    await reporterPage.waitForTimeout(4000);
    console.log('E2E Flow successfully completed!');
  } finally {
    // Clean up contexts and temporary files
    await ownerContext.close();
    await reporterContext.close();
    try {
      if (fs.existsSync(photo1)) fs.unlinkSync(photo1);
      if (fs.existsSync(photo2)) fs.unlinkSync(photo2);
    } catch (e) {
      console.log('Clean up warning:', e);
    }
  }
});
