import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, email, address, items, userId } = body;

        const isMock = (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId));

        if (!isMock && !supabaseAdmin) {
            return NextResponse.json(
                { error: "Veritabanı bağlantısı kurulamadı." },
                { status: 500 }
            );
        }

        let orderId = "mock-order-" + Math.floor(Math.random() * 1000000);

        if (!isMock && supabaseAdmin) {
            // 1. Create a pending order in the Supabase database
            const fullAddress = `${address.name} ${address.surname}, Tel: ${address.phone}, Adres: ${address.detail}`;
            const { data: order, error: orderErr } = await supabaseAdmin
                .from("orders")
                .insert({
                    user_id: userId,
                    total_amount: amount,
                    shipping_address: fullAddress,
                    status: "pending"
                })
                .select()
                .single();

            if (orderErr) {
                console.error("Order creation in DB failed:", orderErr);
                return NextResponse.json({ error: "Sipariş oluşturulamadı." }, { status: 400 });
            }

            // 2. Insert order items
            const orderItems = items.map((item: any) => ({
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
        const merchant_key = process.env.PAYTR_MERCHANT_KEY || "";
        const merchant_salt = process.env.PAYTR_MERCHANT_SALT || "";

        const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
        const user_ip = rawIp.split(',')[0].trim(); // Get first IP if multiple
        
        const merchant_oid = orderId; // Using order ID as our PayTR order id
        const user_email = email || "test@moffipet.com";
        const payment_amount = Math.round(amount * 100); // PayTR expects cents/kuruş (e.g. 10.00 TL -> 1000)
        
        // user_basket: base64 encoded JSON array of [ [name, price, quantity], ... ]
        const basketArray = items.map((item: any) => [item.name, String(item.price), item.quantity]);
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
