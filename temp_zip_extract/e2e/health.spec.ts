import { test, expect } from '@playwright/test';

test.describe('Moffi Tam Sistem Sağlık Kontrolü', () => {

  // Tarayıcıdaki tüm konsol hatalarını yakalayıp loglayalım
  test.beforeEach(({ page }) => {
    page.on('pageerror', error => {
      console.log(`CRITICAL CRASH: ${error.message}`);
    });
  });

  test('Ana Akış (Community) hatasız yükleniyor mu?', async ({ page }) => {
    // Topluluk akışına gidiyoruz
    await page.goto('/community');
    
    // React Error Boundary'nin görünür olmamasını bekliyoruz (Çökme yok)
    const errorBoundary = page.locator('text=Bu Bölümde Bir Hata Oluştu');
    await expect(errorBoundary).toHaveCount(0);

    // Next.js Runtime Hata Ekranı (Application error) gelmemeli
    const nextClientError = page.locator('text=Application error');
    await expect(nextClientError).toHaveCount(0);

    // Uygulama düzgün yüklendiyse ekranın başlığı veya bir içeriği görünür olur.
    // Şimdilik sadece çökmediğinden %100 emin olmak için ağı bekliyoruz
    await page.waitForLoadState('networkidle');
  });

  test('Keşfet (Hub) sekmesine hatasız geçiş yapılıyor mu?', async ({ page }) => {
    await page.goto('/community');
    
    // Alt bardaki "Hub" veya ilgili ikona benzer geçişi simüle et
    // Eğer buton ismini bilmesek bile zorla path atarak route çökmesini test ederiz
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    
    // Crash kontrolü
    const errorBoundary = page.locator('text=Bu Bölümde Bir Hata Oluştu');
    await expect(errorBoundary).toHaveCount(0);
  });

  test('Profil sekmesine hatasız geçiş yapılıyor mu?', async ({ page }) => {
    await page.goto('/profile/milo'); // Static ID
    await page.waitForLoadState('networkidle');
    
    // Crash kontrolü
    const errorBoundary = page.locator('text=Bu Bölümde Bir Hata Oluştu');
    await expect(errorBoundary).toHaveCount(0);
  });

});
