import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Mağaza ödemesi başlatma (CLAUDE.md 8.41). Tutar ASLA istemciden alınmaz: fiyat ve stok veritabanından, kimlik oturumdan.
// Akış: bekleyen sipariş + kalemler (15 dk ayrılır) → PayTR jetonu → istemci PayTR güvenli çerçevesini açar →
// /api/paytr/webhook ödemeyi doğrular ve finalize_paid_order ile kesinleştirir.
// (2026-10-03: eski "mock" dalı kaldırıldı — UUID olmayan kullanıcı kimliğiyle kimlik doğrulamasını atlayıp sahte jeton dönüyordu.)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface Address { name: string; surname: string; phone: string; detail: string }
interface RequestBody { address?: Partial<Address>; items?: { productId?: unknown; quantity?: unknown }[] }
interface ProductRow { id: string; price: number | string; name: string; stock: number; owner_id: string | null }
interface PendingRow { product_id: string; quantity: number }

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

function cleanAddress(a: Partial<Address> | undefined): Address | null {
    const name = String(a?.name ?? "").trim();
    const surname = String(a?.surname ?? "").trim();
    const phone = String(a?.phone ?? "").replace(/[^\d+]/g, "");
    const detail = String(a?.detail ?? "").trim();
    if (!name || !surname || detail.length < 10 || phone.replace(/\D/g, "").length < 10) return null;
    return { name: name.slice(0, 60), surname: surname.slice(0, 60), phone: phone.slice(0, 16), detail: detail.slice(0, 400) };
}

export async function POST(req: Request) {
    if (!supabaseUrl || !supabaseAnonKey || !serviceKey) return fail("Veritabanı bağlantısı kurulamadı.", 500);
    const merchantId = process.env.PAYTR_MERCHANT_ID || process.env.NEXT_PUBLIC_PAYTR_MERCHANT_ID || "";
    const merchantKey = process.env.PAYTR_MERCHANT_KEY;
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT;
    if (!merchantId || !merchantKey || !merchantSalt) return fail("Ödeme sistemi yapılandırılmamış.", 500);

    try {
        const body = (await req.json()) as RequestBody;

        // Kimlik yalnızca oturumdan.
        const cookieStore = await cookies();
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: { get: (name: string) => cookieStore.get(name)?.value, set() {}, remove() {} },
        });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return fail("Oturum bulunamadı. Lütfen giriş yapın.", 401);

        const address = cleanAddress(body.address);
        if (!address) return fail("Teslimat bilgilerini eksiksiz doldur (ad, soyad, telefon, açık adres).", 400);

        // Aynı ürün birden çok satırda gelirse birleştirilir (stok denetimi toplam adetle).
        const wanted = new Map<string, number>();
        for (const it of body.items || []) {
            const id = typeof it.productId === "string" ? it.productId : "";
            const qty = Number(it.quantity);
            if (!id || !Number.isInteger(qty) || qty <= 0 || qty > 99) return fail("Siparişte geçersiz ürün miktarı var.", 400);
            wanted.set(id, (wanted.get(id) || 0) + qty);
        }
        if (wanted.size === 0) return fail("Sepetin boş.", 400);
        const productIds = [...wanted.keys()];

        const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
        const { data: products, error: productErr } = await admin
            .from("products").select("id, price, name, stock, owner_id").in("id", productIds);
        if (productErr || !products) return fail("Ürün bilgileri doğrulanamadı.", 400);

        // Ödemesi bekleyen (süresi dolmamış) siparişlerde ayrılmış adetler stoktan düşülür.
        const { data: pending } = await admin
            .from("order_items").select("product_id, quantity, orders!inner(status, expires_at)")
            .in("product_id", productIds).eq("orders.status", "pending").gt("orders.expires_at", new Date().toISOString());
        const reserved = new Map<string, number>();
        for (const row of (pending || []) as PendingRow[]) reserved.set(row.product_id, (reserved.get(row.product_id) || 0) + row.quantity);

        const lines: { productId: string; name: string; price: number; quantity: number; businessId: string | null }[] = [];
        for (const [productId, quantity] of wanted) {
            const p = (products as ProductRow[]).find(x => x.id === productId);
            if (!p) return fail("Sepetindeki bir ürün artık satışta değil. Sepeti yenileyip tekrar dene.", 400);
            const available = p.stock - (reserved.get(productId) || 0);
            if (quantity > available) return fail(`Yetersiz stok: "${p.name}" için en fazla ${Math.max(0, available)} adet alınabilir.`, 400);
            lines.push({ productId, name: p.name, price: Number(p.price), quantity, businessId: p.owner_id });
        }
        const amount = Math.round(lines.reduce((t, l) => t + l.price * l.quantity, 0) * 100) / 100;
        if (amount <= 0) return fail("Sipariş tutarı geçersiz.", 400);

        let commissionRate = 10;
        const { data: settings } = await admin.from("platform_settings").select("value").eq("key", "general").single();
        const configured = (settings?.value as { commissionRate?: unknown } | null)?.commissionRate;
        if (typeof configured === "number") commissionRate = configured;

        const { data: order, error: orderErr } = await admin.from("orders").insert({
            user_id: user.id,
            total_amount: amount,
            shipping_address: `${address.name} ${address.surname}, Tel: ${address.phone}, Adres: ${address.detail}`,
            status: "pending",
            commission_rate: commissionRate,
            commission_amount: Number(((amount * commissionRate) / 100).toFixed(2)),
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        }).select("id").single();
        if (orderErr || !order) return fail("Sipariş oluşturulamadı.", 400);

        const { error: itemsErr } = await admin.from("order_items").insert(lines.map(l => ({
            order_id: order.id, product_id: l.productId, quantity: l.quantity, price_at_purchase: l.price, business_id: l.businessId,
        })));
        if (itemsErr) {
            await admin.from("orders").delete().eq("id", order.id);
            return fail("Sipariş ürünleri kaydedilemedi.", 400);
        }

        // PayTR jetonu (imza: merchant_id + ip + oid + e-posta + tutar(kuruş) + sepet + no_shipping + ok/fail + para birimi + test + salt)
        const userIp = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1").split(",")[0].trim();
        const email = user.email || "";
        const paymentAmount = Math.round(amount * 100);
        const basket = Buffer.from(JSON.stringify(lines.map(l => [l.name, l.price.toFixed(2), l.quantity]))).toString("base64");
        const noShipping = "0";
        const currency = "TL";
        const testMode = process.env.PAYTR_TEST_MODE || process.env.NEXT_PUBLIC_PAYTR_TEST_MODE || "1";
        const origin = req.headers.get("origin") || new URL(req.url).origin;
        const okUrl = `${origin}/petshop?status=success&orderId=${order.id}`;
        const failUrl = `${origin}/petshop?status=fail`;
        const token = crypto.createHmac("sha256", merchantKey)
            .update(merchantId + userIp + order.id + email + paymentAmount + basket + noShipping + okUrl + failUrl + currency + testMode + merchantSalt)
            .digest("base64");

        const params = new URLSearchParams({
            merchant_id: merchantId, user_ip: userIp, merchant_oid: order.id, email, payment_amount: String(paymentAmount),
            paytr_token: token, user_basket: basket, debug_on: testMode === "1" ? "1" : "0", no_shipping: noShipping,
            client_lang: "tr", currency, test_mode: testMode, user_name: `${address.name} ${address.surname}`,
            user_address: address.detail, user_phone: address.phone, merchant_ok_url: okUrl, merchant_fail_url: failUrl, timeout_limit: "30",
        });
        const paytrRes = await fetch("https://www.paytr.com/odeme/api/get-token", {
            method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString(),
        });
        const paytr = (await paytrRes.json()) as { status?: string; token?: string; reason?: string; err_msg?: string };
        if (paytr.status === "success" && paytr.token) return NextResponse.json({ success: true, token: paytr.token, orderId: order.id });

        console.error("[PayTR] Jeton alınamadı:", paytr.reason || paytr.err_msg);
        await admin.from("orders").delete().eq("id", order.id);
        return fail("Ödeme başlatılamadı, biraz sonra tekrar dene.", 400);
    } catch (err) {
        console.error("[PayTR] Ödeme başlatma hatası:", err instanceof Error ? err.message : err);
        return fail("Ödeme başlatma hatası.", 500);
    }
}
