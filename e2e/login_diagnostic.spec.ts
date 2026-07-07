import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('Deep login diagnostic with console capture', async ({ page }) => {
    test.setTimeout(60000);

    const logs: string[] = [];
    const errors: string[] = [];
    const networkFails: string[] = [];

    // Capture all console messages
    page.on('console', msg => {
        const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
        logs.push(text);
        if (msg.type() === 'error') errors.push(text);
        console.log(text);
    });

    // Capture page errors
    page.on('pageerror', err => {
        errors.push(`[PAGE ERROR] ${err.message}`);
        console.error('[PAGE ERROR]', err.message);
    });

    // Capture failed requests
    page.on('requestfailed', req => {
        const fail = `[NET FAIL] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`;
        networkFails.push(fail);
        console.error(fail);
    });

    // Capture all responses
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('supabase') || url.includes('auth') || url.includes('api')) {
            const status = response.status();
            const method = response.request().method();
            console.log(`[RESPONSE] ${method} ${url} -> ${status}`);
            
            if (status >= 400) {
                try {
                    const body = await response.text();
                    console.log(`[RESPONSE BODY] ${body.substring(0, 500)}`);
                    errors.push(`[HTTP ${status}] ${url}: ${body.substring(0, 200)}`);
                } catch {}
            }
        }
    });

    console.log('=== STEP 1: Navigate to login page ===');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    
    // Screenshot 1: Login page
    await page.screenshot({ path: 'test-results/diag_1_login_page.png', fullPage: true });
    console.log('Screenshot 1 saved.');

    // Wait for login form to appear
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ timeout: 10000 });
    
    console.log('=== STEP 2: Fill login form ===');
    // Use the known admin account from profiles
    await emailInput.fill('projemoffi@gmail.com'); // baran baykuş's account (projemoffi username)
    
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('test_placeholder_12345'); // placeholder - will fail but we see the error
    
    await page.screenshot({ path: 'test-results/diag_2_filled_form.png', fullPage: true });
    
    console.log('=== STEP 3: Submit form ===');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    // Wait and capture all activity
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/diag_3_after_submit.png', fullPage: true });
    
    // Check what URL we're on
    const currentUrl = page.url();
    console.log('Current URL after submit:', currentUrl);
    
    console.log('=== STEP 4: Check localStorage and session ===');
    const storageData = await page.evaluate(() => {
        const result: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const val = localStorage.getItem(key);
                if (key.includes('supabase') || key.includes('moffi')) {
                    result[key] = val ? val.substring(0, 200) : null;
                }
            }
        }
        return result;
    });
    console.log('LocalStorage (auth-related):', JSON.stringify(storageData, null, 2));
    
    // Save full log
    const report = {
        timestamp: new Date().toISOString(),
        finalUrl: currentUrl,
        consoleLogs: logs,
        errors: errors,
        networkFails: networkFails,
        localStorage: storageData
    };
    
    fs.writeFileSync('test-results/login_diagnostic_report.json', JSON.stringify(report, null, 2));
    console.log('\n=== DIAGNOSTIC REPORT SAVED to test-results/login_diagnostic_report.json ===');
    console.log('Errors found:', errors.length);
    errors.forEach(e => console.log('  ', e));
});
