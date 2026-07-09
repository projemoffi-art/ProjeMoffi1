import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { ProductMockService } from "@/services/mock/ProductMockService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount: clientAmount, email, address, items, userId } = body;

        const isMock = (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId));

        if (!isMock && (!supabaseAdmin || !supabaseAnonKey)) {
            return NextResponse.json(
                { error: "Veritabanı bağlantısı kurulamadı." },
                { status: 500 }
            );
        }

        // KİMLİK DOĞRULAMA (Sadece gerçek kullanıcılar için)
        if (!isMock && supabaseUrl && supabaseAnonKey) {
            const cookieStore = cookies();
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
                console.error("[PayTR] Yetkisiz işlem denemesi. Oturum bulunamadı.", authErr);
                return NextResponse.json({ error: "Oturum bulunamadı. Lütfen giriş yapın." }, { status: 401 });
            }
            
            if (user.id !== userId) {
                console.error(`[PayTR] Kimlik sahtekarlığı denemesi! Login olan: ${user.id}, Talep edilen: ${userId}`);
                return NextResponse.json({ error: "Geçersiz kullanıcı kimliği." }, { status: 403 });
            }
        }

        // SECURE CALCULATION: Never trust client amount
        let calculatedAmount = 0;
        const secureItems = [];
        const productIds = items.map((i: any) => i.productId);

        if (isMock) {
            for (const item of items) {
                if (!item.quantity || item.quantity <= 0) {
                    return NextResponse.json({ error: "Siparişte geçersiz ürün miktarı tespit edildi." }, { status: 400 });
                }
                const product = await ProductMockService.getProductById(item.productId);
                if (!product) continue;
                
                let itemPrice = product.basePrice;
                if (item.sizeId) {
                    const sizeObj = product.sizes.find(s => s.id === item.sizeId);
                    if (sizeObj) itemPrice += sizeObj.priceModifier;
                } else if (item.price && item.price !== product.basePrice) {
                     const possibleModifier = product.sizes.find(s => (product.basePrice + s.priceModifier) === item.price);
                     if (possibleModifier) itemPrice = item.price;
                }
                
                calculatedAmount += itemPrice * item.quantity;
                secureItems.push({
                    ...item,
                    price: itemPrice,
                    name: product.name
                });
            }
        } else {
            // GERÇEK ÜRÜNLERİ SUPABASE'DEN ÇEK
            const { data: realProducts, error: dbErr } = await supabaseAdmin
                .from('products')
                .select('id, price, name')
                .in('id', productIds);
                
            if (dbErr || !realProducts) {
                console.error("Ürün fiyatları doğrulanamadı:", dbErr);
                return NextResponse.json({ error: "Sipariş güvenliği doğrulanamadı." }, { status: 400 });
            }
            
            for (const item of items) {
                if (!item.quantity || item.quantity <= 0) {
                    console.warn(`[PayTR] Geçersiz miktar tespiti: ${item.quantity}`);
                    return NextResponse.json({ error: "Siparişte geçersiz ürün miktarı tespit edildi." }, { status: 400 });
                }
                
                const realProduct = realProducts.find(p => p.id === item.productId);
                if (!realProduct) continue;
                
                const itemPrice = Number(realProduct.price);
                calculatedAmount += itemPrice * item.quantity;
                secureItems.push({
                    ...item,
                    price: itemPrice,
                    name: realProduct.name
                });
            }
        }

        // HİÇBİR ZAMAN CLİENT TUTARINA GÜVENME - HATA VARSA REDDET
        if (calculatedAmount <= 0) {
            return NextResponse.json({ error: "Sipariş tutarı geçersiz veya ürün bulunamadı." }, { status: 400 });
        }
        
        const amount = calculatedAmount;

        let orderId = "mock-order-" + Math.floor(Math.random() * 1000000);

        if (!isMock && supabaseAdmin) {
            // Fetch platform settings for commission
            let commissionRate = 10;
            const { data: settingsData } = await supabaseAdmin
                .from('platform_settings')
                .select('value')
                .eq('key', 'general')
                .single();
            if (settingsData && settingsData.value && typeof settingsData.value.commissionRate === 'number') {
                commissionRate = settingsData.value.commissionRate;
            }
            const commissionAmount = Number(((amount * commissionRate) / 100).toFixed(2));

            // 1. Create a pending order in the Supabase database
            const fullAddress = `${address.name} ${address.surname}, Tel: ${address.phone}, Adres: ${address.detail}`;
            const { data: order, error: orderErr } = await supabaseAdmin
                .from("orders")
                .insert({
                    user_id: userId,
                    total_amount: amount,
                    shipping_address: fullAddress,
                    status: "pending",
                    commission_rate: commissionRate,
                    commission_amount: commissionAmount
                })
                .select()
                .single();

            if (orderErr) {
                console.error("Order creation in DB failed:", orderErr);
                return NextResponse.json({ error: "Sipariş oluşturulamadı." }, { status: 400 });
            }

            // 2. Insert order items
            const orderItems = secureItems.map((item: any) => ({
                order_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                price_at_purchase: item.price
            }));

            const { error: itemsErr } = await supabaseAdmin
                .from("order_items")
                .insert(orderItems);

            if (itemsErr) {
                console.error("Order items creation failed:", itemsErr);
                // Cleanup order
                await supabaseAdmin.from("orders").delete().eq("id", order.id);
                return NextResponse.json({ error: "Sipariş ürünleri kaydedilemedi." }, { status: 400 });
            }

            orderId = order.id;
        }

        if (isMock) {
            return NextResponse.json({
                success: true,
                token: "mock-paytr-token-" + Date.now(),
                orderId: orderId
            });
        }

        // 3. Prepare parameters for PayTR API
        const merchant_id = process.env.PAYTR_MERCHANT_ID || process.env.NEXT_PUBLIC_PAYTR_MERCHANT_ID || "";
        const merchant_key = process.env.PAYTR_MERCHANT_KEY;
        const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

        if (!merchant_id || !merchant_key || !merchant_salt) {
            return NextResponse.json({ error: "PayTR API keys are missing in environment variables." }, { status: 500 });
        }

        const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
        const user_ip = rawIp.split(',')[0].trim(); // Get first IP if multiple
        
        const merchant_oid = orderId; // Using order ID as our PayTR order id
        const user_email = email || "test@moffipet.com";
        const payment_amount = Math.round(amount * 100); // PayTR expects cents/kuruş (e.g. 10.00 TL -> 1000)
        
        // user_basket: base64 encoded JSON array of [ [name, price, quantity], ... ]
        const basketArray = secureItems.map((item: any) => [item.name, String(item.price), item.quantity]);
        const user_basket = Buffer.from(JSON.stringify(basketArray)).toString("base64");

        const no_shipping = "0"; // We show shipping/address fields
        const currency = "TL";
        const test_mode = process.env.PAYTR_TEST_MODE || process.env.NEXT_PUBLIC_PAYTR_TEST_MODE || "1";

        const origin = req.headers.get("origin") || "http://localhost:3000";
        const merchant_ok_url = `${origin}/petshop?status=success&orderId=${orderId}`;
        const merchant_fail_url = `${origin}/petshop?status=fail`;

        // 4. Generate the HMAC-SHA256 Token Signature
        const hashString = merchant_id + user_ip + merchant_oid + user_email + payment_amount + user_basket + no_shipping + merchant_ok_url + merchant_fail_url + currency + test_mode + merchant_salt;
        const paytr_token = crypto
            .createHmac("sha256", merchant_key)
            .update(hashString)
            .digest("base64");

        // 5. Send POST request to PayTR API
        const paytrParams = new URLSearchParams();
        paytrParams.append("merchant_id", merchant_id);
        paytrParams.append("user_ip", user_ip);
        paytrParams.append("merchant_oid", merchant_oid);
        paytrParams.append("email", user_email);
        paytrParams.append("payment_amount", String(payment_amount));
        paytrParams.append("paytr_token", paytr_token);
        paytrParams.append("user_basket", user_basket);
        paytrParams.append("debug_on", "1");
        paytrParams.append("no_shipping", no_shipping);
        paytrParams.append("client_lang", "tr");
        paytrParams.append("currency", currency);
        paytrParams.append("test_mode", test_mode);
        paytrParams.append("user_name", `${address.name} ${address.surname}`);
        paytrParams.append("user_address", address.detail);
        paytrParams.append("user_phone", address.phone);
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
                orderId: orderId
            });
        } else {
            console.error("PayTR Token Request Failed:", paytrData.err_msg);
            // Cleanup order
            if (!isMock && supabaseAdmin) {
                await supabaseAdmin.from("orders").delete().eq("id", orderId);
            }
            return NextResponse.json(
                { error: `PayTR Hatası: ${paytrData.err_msg}` },
                { status: 400 }
            );
        }

    } catch (error: any) {
        console.error("PayTR Payment API Error:", error);
        return NextResponse.json(
            { error: "Ödeme başlatma hatası." },
            { status: 500 }
        );
    }
}
