/**
 * SESSION & PROFILE KARISIKLIK DEBUG TESTI
 *
 * AMAÇ: baranbaykus@hotmail.com hesabına ait profil bilgilerinin
 * farklı kullanıcıya gösterilmesi sorununu tespit etmek.
 *
 * KONTROL EDİLENLER:
 * 1. localStorage/sessionStorage içeriği
 * 2. Login sonrası Supabase token response (kim döndü?)
 * 3. /rest/v1/profiles isteği (hangi profil çekildi?)
 * 4. AuthContext'in syncProfile davranışı
 * 5. Logout sonrası storage temizleniyor mu?
 */

import { test, expect, Page } from '@playwright/test';

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

async function dumpStorage(page: Page, label: string) {
  const storage = await page.evaluate(() => {
    const ls: Record<string, string> = {};
    const ss: Record<string, string> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      ls[key] = localStorage.getItem(key) || '';
    }
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)!;
      ss[key] = sessionStorage.getItem(key) || '';
    }

    const cookies = document.cookie;
    return { localStorage: ls, sessionStorage: ss, cookies };
  });

  console.log(`\n═══ STORAGE DUMP [${label}] ═══`);

  const relevantLS: Record<string, any> = {};
  for (const [k, v] of Object.entries(storage.localStorage)) {
    if (k.startsWith('moffi_') || k.startsWith('sb-') || k.startsWith('supabase')) {
      try { relevantLS[k] = JSON.parse(v); } catch { relevantLS[k] = v; }
    }
  }
  console.log('localStorage (ilgili keyler):', JSON.stringify(relevantLS, null, 2));

  const relevantSS: Record<string, any> = {};
  for (const [k, v] of Object.entries(storage.sessionStorage)) {
    if (k.startsWith('moffi_') || k.startsWith('sb-') || k.startsWith('supabase')) {
      try { relevantSS[k] = JSON.parse(v); } catch { relevantSS[k] = v; }
    }
  }
  console.log('sessionStorage (ilgili keyler):', JSON.stringify(relevantSS, null, 2));
  console.log('Cookies:', storage.cookies);

  return storage;
}

// ────────────────────────────────────────────────────────────────────────────
// TEST 1: SAYFA ILK YÜKLENME – DEPOLAMADA NE VAR?
// ────────────────────────────────────────────────────────────────────────────

test('1. Ilk yukleme: localStorage ve oturum durumu', async ({ page }) => {
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const storageData = await dumpStorage(page, 'ILK YUKLEME');

  const lsKeys = Object.keys(storageData.localStorage);
  const supabaseKey = lsKeys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));

  if (supabaseKey) {
    const sessionStr = storageData.localStorage[supabaseKey] as string;
    try {
      const session = typeof sessionStr === 'string' ? JSON.parse(sessionStr) : sessionStr;
      console.log('\n SUPABASE SESSION DETAYI:');
      console.log('  user.id:', session?.user?.id);
      console.log('  user.email:', session?.user?.email);
      console.log('  access_token (ilk 30):', session?.access_token?.substring(0, 30));
    } catch { /* ignore */ }
  } else {
    console.log('\n Supabase auth token localStorageda bulunamadi (kullanici giris yapmamis)');
  }

  console.log('\n CONSOLE LOGLAR:');
  consoleLogs.forEach(log => console.log(log));
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 2: AG TRAFIGINI YAKALAYARAK LOGIN – HANGI KULLANICI DONDU?
// ────────────────────────────────────────────────────────────────────────────

test('2. Login ag trafigi: token ve profil response analizi', async ({ page }) => {
  const consoleLogs: string[] = [];
  const networkLogs: Array<{ url: string; status: number; body: any }> = [];
  let tokenResponse: any = null;
  let profileResponse: any = null;

  page.on('console', msg => {
    consoleLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('response', async (response) => {
    const url = response.url();

    if (url.includes('supabase') || url.includes('/auth/') || url.includes('/rest/v1/')) {
      try {
        const status = response.status();
        let body: any = null;

        try {
          const text = await response.text();
          body = JSON.parse(text);
        } catch { body = '(parse edilemedi)'; }

        networkLogs.push({ url, status, body });

        if (url.includes('/auth/v1/token')) {
          tokenResponse = body;
          console.log('\n AUTH TOKEN RESPONSE:');
          console.log('  user.id:', body?.user?.id);
          console.log('  user.email:', body?.user?.email);
          console.log('  user.created_at:', body?.user?.created_at);
        }

        if (url.includes('/rest/v1/profiles') && !url.includes('follows')) {
          profileResponse = body;
          console.log('\n PROFILES RESPONSE:');
          if (Array.isArray(body) && body.length > 0) {
            console.log('  Donen profil sayisi:', body.length);
            body.forEach((p: any, i: number) => {
              console.log(`  [${i}] id: ${p.id} | username: ${p.username} | full_name: ${p.full_name} | email: ${p.email}`);
            });
          } else if (body && !Array.isArray(body)) {
            console.log('  id:', body.id);
            console.log('  username:', body.username);
            console.log('  full_name:', body.full_name);
            console.log('  email:', body.email);
          }
        }
      } catch { /* ignore */ }
    }
  });

  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  const hasEmailInput = await emailInput.count() > 0;
  const hasPasswordInput = await passwordInput.count() > 0;

  console.log('\n LOGIN FORMU:');
  console.log('  Email input bulundu:', hasEmailInput);
  console.log('  Password input bulundu:', hasPasswordInput);

  if (!hasEmailInput || !hasPasswordInput) {
    console.log('  Login formu bulunamadi. Mevcut URL:', page.url());
    await dumpStorage(page, 'GIRIS YAPILMIS DURUM');
    return;
  }

  // NOT: Test hesap bilgilerini buraya yazin
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'test123456';

  await emailInput.fill(TEST_EMAIL);
  await passwordInput.fill(TEST_PASSWORD);

  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();

  await page.waitForTimeout(5000);

  console.log('\n TUM SUPABASE AG ISTEKLERI:');
  networkLogs.forEach(log => {
    console.log(`  [${log.status}] ${log.url.substring(0, 100)}`);
  });

  await dumpStorage(page, 'LOGIN SONRASI');

  if (tokenResponse && profileResponse) {
    const tokenUserId = tokenResponse?.user?.id;
    const profileId = Array.isArray(profileResponse) ? profileResponse[0]?.id : profileResponse?.id;

    console.log('\n KRITIK KARSILASTIRMA:');
    console.log('  Tokendaki user.id:', tokenUserId);
    console.log('  Profilesdan donen id:', profileId);

    if (tokenUserId && profileId && tokenUserId !== profileId) {
      console.log('  UYUMSUZLUK TESPIT EDILDI! Farkli kullanici profili cekiliyor!');
    } else if (tokenUserId === profileId) {
      console.log('  IDler esleşiyor');
    }
  }

  console.log('\n CONSOLE LOGLAR:');
  consoleLogs.forEach(log => console.log(log));
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 3: LOGOUT SONRASI STORAGE TEMIZLENIYOR MU?
// ────────────────────────────────────────────────────────────────────────────

test('3. Logout sonrasi storage temizligi', async ({ page }) => {
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  await dumpStorage(page, 'LOGOUT ONCESI');

  const logoutBtn = page.locator(
    'button:has-text("Cikis"), button:has-text("Logout"), button:has-text("Sign Out"), ' +
    '[data-testid="logout"], #logout-btn'
  ).first();

  const hasLogout = await logoutBtn.count() > 0;
  console.log('\n LOGOUT BUTONU:', hasLogout ? 'Bulundu' : 'Bulunamadi');

  if (hasLogout) {
    await logoutBtn.click();
    await page.waitForTimeout(3000);

    const afterStorage = await dumpStorage(page, 'LOGOUT SONRASI');

    const lsKeys = Object.keys(afterStorage.localStorage);
    const supabaseStillPresent = lsKeys.some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));

    console.log('\n LOGOUT TEMIZLIK ANALİZİ:');
    console.log('  Supabase token logout sonrasi hala var mi:', supabaseStillPresent ? 'EVET (SORUN!)' : 'Hayir (temizlendi)');

    const cookies = await page.context().cookies();
    const moffiCookies = cookies.filter(c =>
      c.name.includes('moffi') || c.name.includes('supabase') || c.name.includes('sb-')
    );
    console.log('  Logout sonrasi moffi/supabase cookieleri:', JSON.stringify(moffiCookies, null, 2));
  }

  console.log('\n CONSOLE LOGLAR:');
  consoleLogs.forEach(log => console.log(log));
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 4: PROFIL SAYFASI – KIM GIRIŞ YAPIYOR VS KIM GÖSTERILIYOR?
// ────────────────────────────────────────────────────────────────────────────

test('4. GERCEK SENARYO: Profil sayfasinda gosterilen kullanici analizi', async ({ page }) => {
  const consoleLogs: string[] = [];
  const supabaseRequests: Array<{ url: string; method: string; authHeader: string }> = [];
  const supabaseResponses: Array<{ url: string; status: number; body: any }> = [];

  page.on('console', msg => {
    consoleLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('supabase') || url.includes('/rest/v1/') || url.includes('/auth/v1/')) {
      supabaseRequests.push({
        url,
        method: request.method(),
        authHeader: (request.headers()['authorization'] || '').substring(0, 60)
      });
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('supabase') || url.includes('/rest/v1/') || url.includes('/auth/v1/')) {
      try {
        const text = await response.text();
        const body = JSON.parse(text);
        supabaseResponses.push({ url, status: response.status(), body });
      } catch {
        supabaseResponses.push({ url, status: response.status(), body: '(parse edilemedi)' });
      }
    }
  });

  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('\n PROFIL SAYFASI ANALİZİ:');
  console.log('  Mevcut URL:', page.url());

  const profileInfo = await page.evaluate(() => {
    const texts: string[] = [];

    document.querySelectorAll('h1, h2, h3').forEach(el => {
      if (el.textContent?.trim()) texts.push(`HEADING: ${el.textContent.trim()}`);
    });

    document.querySelectorAll('[class*="email"], [data-testid*="email"]').forEach(el => {
      if (el.textContent?.trim()) texts.push(`EMAIL_EL: ${el.textContent.trim()}`);
    });

    document.querySelectorAll('[class*="profile"] span, [class*="profile"] p').forEach(el => {
      if (el.textContent?.trim()) texts.push(`PROFILE_TEXT: ${el.textContent.trim()}`);
    });

    return texts.slice(0, 30);
  });

  console.log('\n  DOMdaki profil bilgileri:');
  profileInfo.forEach(info => console.log('   ', info));

  console.log('\n SUPABASE REQUESTS:');
  supabaseRequests.forEach(req => {
    console.log(`  [${req.method}] ${req.url.substring(0, 120)}`);
    console.log(`    Authorization: ${req.authHeader}...`);
  });

  console.log('\n PROFILES RESPONSES:');
  supabaseResponses
    .filter(res => res.url.includes('profiles'))
    .forEach(res => {
      console.log(`  [${res.status}] ${res.url.substring(0, 100)}`);
      if (Array.isArray(res.body) && res.body.length > 0) {
        res.body.forEach((p: any) => {
          console.log(`    => id: ${p.id} | username: ${p.username} | full_name: ${p.full_name}`);
        });
      } else if (res.body && typeof res.body === 'object' && res.body.id) {
        console.log(`    => id: ${res.body.id} | username: ${res.body.username} | full_name: ${res.body.full_name}`);
      }
    });

  const sessionInLS = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          return JSON.parse(localStorage.getItem(key) || '');
        } catch { return null; }
      }
    }
    return null;
  });

  console.log('\n MEVCUT SESSION (localStorage):');
  if (sessionInLS) {
    console.log('  user.id:', sessionInLS?.user?.id);
    console.log('  user.email:', sessionInLS?.user?.email);
  } else {
    console.log('  (Session bulunamadi - kullanici giris yapmamis)');
  }

  console.log('\n [Auth] CONSOLE LOGLAR:');
  consoleLogs
    .filter(log =>
      log.includes('[Auth]') ||
      log.includes('Auth state') ||
      log.includes('profile') ||
      log.includes('Profile') ||
      log.includes('syncProfile') ||
      log.includes('getCurrentUser')
    )
    .forEach(log => console.log(log));
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 5: RLS VE PROFILES SORGU ANALIZI
// ────────────────────────────────────────────────────────────────────────────

test('5. RLS ve profiles sorgu analizi', async ({ page }) => {
  const profileQueries: string[] = [];
  const authTokens: string[] = [];

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/rest/v1/profiles')) {
      profileQueries.push(url);
      const authHeader = request.headers()['authorization'] || '';
      if (authHeader) authTokens.push(authHeader);
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('\n PROFILES SORGU ANALİZİ:');

  if (profileQueries.length === 0) {
    console.log('  Ilk yuklemede profiles istegi yapilmadi (kullanici giris yapmamis olabilir)');
  }

  profileQueries.forEach((url, i) => {
    console.log(`\n  [${i + 1}] URL: ${url}`);

    const hasIdFilter = url.includes('id=eq.');
    const idMatch = url.match(/id=eq\.([^&]+)/);

    console.log('    id=eq. filtresi:', hasIdFilter ? `VAR: ${idMatch?.[1] || '?'}` : 'YOK!');

    if (!hasIdFilter) {
      console.log('    UYARI: ID filtresi yok! Tum profiller cekilmis olabilir.');
    }
  });

  console.log('\n KULLANILAN AUTH TOKENLAR (ilk 60 char):');
  authTokens.forEach((token, i) => {
    console.log(`  [${i + 1}] ${token.substring(0, 60)}...`);
  });

  console.log('\n KOD ANALIZI OZETI:');
  console.log('  getCurrentUser():');
  console.log('    1. getSession() -> session.user.id alir');
  console.log('    2. getUserProfile(user.id) -> profiles tablosunu user.id ile filtreler');
  console.log('    3. SORUN: getSession() eski/stale bir token donuyorsa -> yanlis profil gelir!');
  console.log('');
  console.log('  syncProfile(session):');
  console.log('    1. apiService.getCurrentUser() cagirir (session parametresini KULLANMAZ)');
  console.log('    2. getCurrentUser() kendi icinde getSession() cagirir');
  console.log('    3. syncProfile\'a gecilen session.user.id ile getCurrentUser\'dan gelen id farkliysa sorun cikiyor');
  console.log('');
  console.log('  KOK NEDEN ADAYI:');
  console.log('    - Supabase client stale session cache nedeniyle onAuthStateChange');
  console.log('      SIGNED_IN event\'inde yeni kullanicinin id\'sini verebilirken,');
  console.log('      getSession() hala ESKI session\'i donduruyor olabilir.');
  console.log('    - Bu durumda syncProfile(newUserSession) -> getCurrentUser() -> getSession() = OLD_USER');
  console.log('      -> getUserProfile(OLD_USER_ID) -> YANLIS PROFIL!');
});
