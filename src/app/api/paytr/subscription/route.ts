import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client for inserting into subscription_intents (bypassing RLS insert restrictions)
const supabaseAdmin = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Pricing logic MUST be server-side to prevent client spoofing
const PLAN_PRICES: Record<string, number> = {
    'pro': 5000, // 50.00 TL in kuruş
    'premium': 10000 // 100.00 TL in kuruş
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { planId, email, address } = body;

        if (!planId || !PLAN_PRICES[planId]) {
            return NextResponse.json({ error: "Geçersiz abonelik planı." }, { status: 400 });
        }

        if (!supabaseAdmin || !supabaseAnonKey || !supabaseUrl) {
            return NextResponse.json(
                { error: "Sunucu bağlantı hatası." },
                { status: 500 }
            );
        }

        // 1. Session verification: NEVER trust client-provided userId
        const cookieStore = await cookies();
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set() {},
                    remove() {}
                },
            }
        );

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        
        if (authErr || !user) {
            console.error("[PayTR Sub] Yetkisiz işlem denemesi. Oturum bulunamadı.", authErr);
            return NextResponse.json({ error: "Oturum bulunamadı. Lütfen giriş yapın." }, { status: 401 });
        }

        const userId = user.id;
        const userEmail = email || user.email || "test@moffipet.com";
        const paymentAmount = PLAN_PRICES[planId]; // Strict server-side amount

        // 2. Generate an ALPHANUMERIC merchant_oid (PayTR rule: no hyphens/underscores)
        // e.g. SUB123ABC...
        const randomStr = crypto.randomBytes(8).toString('hex').toUpperCase();
        const merchant_oid = `SUB${randomStr}`;

        // 3. Create Intent in Database using Admin Client (Bypasses RLS blocks)
        const { error: intentErr } = await supabaseAdmin
            .from('subscription_intents')
            .insert({
                merchant_oid: merchant_oid,
                user_id: userId,
                plan_id: planId,
                amount: paymentAmount,
                status: 'pending'
            });

        if (intentErr) {
            console.error("[PayTR Sub] Intent creation failed:", intentErr);
            return NextResponse.json({ error: "Abonelik isteği oluşturulamadı." }, { status: 500 });
        }

        // 4. Prepare PayTR Parameters
        const merchant_id = process.env.PAYTR_MERCHANT_ID || process.env.NEXT_PUBLIC_PAYTR_MERCHANT_ID || "";
        const merchant_key = process.env.PAYTR_MERCHANT_KEY;
        const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

        if (!merchant_id || !merchant_key || !merchant_salt) {
            return NextResponse.json({ error: "PayTR ayarları eksik." }, { status: 500 });
        }

        const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
        const user_ip = rawIp.split(',')[0].trim();
        
        // user_basket: For subscriptions, just a single item
        const basketArray = [["Moffi+ Prime Abonelik", String(paymentAmount / 100), 1]];
        const user_basket = Buffer.from(JSON.stringify(basketArray)).toString("base64");

        const no_shipping = "1"; // No shipping for digital subscriptions
        const currency = "TL";
        const test_mode = process.env.PAYTR_TEST_MODE || process.env.NEXT_PUBLIC_PAYTR_TEST_MODE || "1";

        const origin = req.headers.get("origin") || "http://localhost:3000";
        const merchant_ok_url = `${origin}/profile?subscription=success`;
        const merchant_fail_url = `${origin}/profile?subscription=fail`;

        // 5. Generate HMAC-SHA256 Token Signature
        const hashString = merchant_id + user_ip + merchant_oid + userEmail + paymentAmount + user_basket + no_shipping + merchant_ok_url + merchant_fail_url + currency + test_mode + merchant_salt;
        const paytr_token = crypto
            .createHmac("sha256", merchant_key)
            .update(hashString)
            .digest("base64");

        // 6. Request token from PayTR
        const paytrParams = new URLSearchParams();
        paytrParams.append("merchant_id", merchant_id);
        paytrParams.append("user_ip", user_ip);
        paytrParams.append("merchant_oid", merchant_oid);
        paytrParams.append("email", userEmail);
        paytrParams.append("payment_amount", String(paymentAmount));
        paytrParams.append("paytr_token", paytr_token);
        paytrParams.append("user_basket", user_basket);
        paytrParams.append("debug_on", "1");
        paytrParams.append("no_shipping", no_shipping);
        paytrParams.append("client_lang", "tr");
        paytrParams.append("currency", currency);
        paytrParams.append("test_mode", test_mode);
        
        const userName = address?.name ? `${address.name} ${address.surname || ''}`.trim() : "Moffi Kullanıcısı";
        paytrParams.append("user_name", userName);
        paytrParams.append("user_address", address?.detail || "Dijital Abonelik");
        paytrParams.append("user_phone", address?.phone || "05555555555");
        
        paytrParams.append("merchant_ok_url", merchant_ok_url);
        paytrParams.append("merchant_fail_url", merchant_fail_url);
        paytrParams.append("timeout_limit", "30");

        const paytrResponse = await fetch("https://www.paytr.com/odeme/api/get-token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: paytrParams.toString()
        });

        const paytrData = await paytrResponse.json();

        if (paytrData.status === "success") {
            return NextResponse.json({
                success: true,
                token: paytrData.token,
                orderId: merchant_oid
            });
        } else {
            console.error("[PayTR Sub] Token Request Failed:", paytrData.err_msg);
            // Cleanup intent on failure
            await supabaseAdmin.from("subscription_intents").delete().eq("merchant_oid", merchant_oid);
            return NextResponse.json(
                { error: `PayTR Hatası: ${paytrData.err_msg}` },
                { status: 400 }
            );
        }

    } catch (error: any) {
        console.error("[PayTR Sub] API Error:", error);
        return NextResponse.json(
            { error: "Abonelik ödeme başlatma hatası." },
            { status: 500 }
        );
    }
}
