import { test } from '@playwright/test';

test('Full session and localStorage inspection', async ({ page }) => {
    test.setTimeout(60000);

    const consoleLogs: string[] = [];
    page.on('console', msg => {
        const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
        consoleLogs.push(text);
        console.log(text);
    });

    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('supabase') && (url.includes('profiles') || url.includes('auth'))) {
            const status = response.status();
            console.log(`[NET] ${response.request().method()} ${url.split('?')[0]} -> HTTP ${status}`);
            if (status < 300) {
                try {
                    const body = await response.json();
                    console.log('[BODY]', JSON.stringify(body).substring(0, 400));
                } catch {}
            }
        }
    });

    // Go to app
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);

    console.log('\n=== INITIAL STATE ===');
    
    // Inspect all localStorage
    const storage = await page.evaluate(() => {
        const result: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) result[key] = localStorage.getItem(key) || '';
        }
        return result;
    });
    
    console.log('localStorage keys:', Object.keys(storage));
    
    // Look for Supabase auth token
    const supabaseKey = Object.keys(storage).find(k => k.includes('supabase') || k.includes('sb-'));
    if (supabaseKey) {
        console.log('SUPABASE AUTH STORAGE found:', supabaseKey);
        try {
            const parsed = JSON.parse(storage[supabaseKey]);
            console.log('  user.id:', parsed?.user?.id);
            console.log('  user.email:', parsed?.user?.email);
            console.log('  expires_at:', parsed?.expires_at);
        } catch {}
    } else {
        console.log('NO supabase auth token in localStorage');
    }
    
    // Check cookies
    const cookies = await page.context().cookies();
    console.log('\nCookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 50)}`));
    
    // Check current URL
    console.log('Current URL:', page.url());
    
    // Wait for any auth state changes
    await page.waitForTimeout(2000);
    
    // Get auth state from React context via window
    const authState = await page.evaluate(() => {
        // Try to read from any exposed debug info
        return {
            url: window.location.href,
            cookies: document.cookie
        };
    });
    console.log('Window state:', authState);

    await page.screenshot({ path: 'test-results/session_inspection.png', fullPage: true });
    console.log('\n=== ALL CONSOLE LOGS ===');
    consoleLogs.forEach(l => console.log(l));
});
