import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

// RevenueCat → Moffi: mağaza satın alma / yenileme / bitiş bildirimleri.
// RevenueCat panelinde Integrations → Webhooks'ta adres https://app.moffi.net/api/revenuecat/webhook,
// "Authorization header" değeri Vercel'deki REVENUECAT_WEBHOOK_SECRET ile birebir aynı olmalı.
// Uygulama tek kaynak supabase apply_store_event (aynı bildirim iki kez işlenmez).

function authorized(request: Request) {
    const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
    const given = request.headers.get("authorization");
    if (!expected || !given) return false;
    const a = Buffer.from(given.replace(/^Bearer\s+/i, ""));
    const b = Buffer.from(expected.replace(/^Bearer\s+/i, ""));
    return a.length === b.length && timingSafeEqual(a, b);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RcEvent = {
    id?: string;
    type?: string;
    app_user_id?: string;
    original_app_user_id?: string;
    aliases?: string[];
    product_id?: string;
    expiration_at_ms?: number | null;
    environment?: string;
};

export async function POST(request: Request) {
    if (!authorized(request)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: "Supabase admin config missing" }, { status: 500 });
    }

    const body = await request.json().catch(() => null) as { event?: RcEvent } | null;
    const event = body?.event;
    if (!event?.id || !event.type) {
        return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    // Uygulama Purchases.logIn(supabaseUserId) ile giriş yaptığı için kullanıcı kimliği bu alanlardan biridir;
    // anonim ($RCAnonymousID) kimlikler kullanıcıya bağlanamaz.
    const userId = [event.app_user_id, event.original_app_user_id, ...(event.aliases || [])].find(id => id && UUID_RE.test(id)) || null;

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await admin.rpc("apply_store_event", {
        p_event_id: event.id,
        p_type: event.type,
        p_user: userId,
        p_product: event.product_id ?? null,
        p_expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
        p_environment: event.environment ?? null,
        p_payload: body,
    });
    if (error) {
        // 5xx: RevenueCat bildirimi daha sonra tekrar dener
        console.error("[revenuecat] apply_store_event:", error.message);
        return NextResponse.json({ error: "apply failed" }, { status: 500 });
    }
    return NextResponse.json({ result: data });
}
