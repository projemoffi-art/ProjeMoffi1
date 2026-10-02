import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function POST(req: NextRequest) {
    try {
        const text = await req.text();
        const params = new URLSearchParams(text);

        const merchant_oid = params.get("merchant_oid") || "";
        const status = params.get("status") || "";
        const total_amount = params.get("total_amount") || "";
        const hash = params.get("hash") || "";

        console.log(`[PAYTR WEBHOOK] Received payload for order ${merchant_oid}: status=${status}, amount=${total_amount}`);

        const merchant_key = process.env.PAYTR_MERCHANT_KEY;
        const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

        if (!merchant_key || !merchant_salt) {
            console.error("[PAYTR WEBHOOK] Server misconfiguration: PayTR API keys are missing.");
            return new Response("Fail: Server misconfiguration", { status: 500 });
        }

        // 1. Verify PayTR HMAC-SHA256 Hash signature
        const hashString = merchant_oid + merchant_salt + status + total_amount;
        const calculatedHash = crypto
            .createHmac("sha256", merchant_key)
            .update(hashString)
            .digest("base64");

        if (calculatedHash !== hash) {
            console.error("[PAYTR WEBHOOK] Signature verification failed! Mismatch hashes.");
            return new Response("Fail: signature mismatch", { status: 400 });
        }

        if (!supabaseAdmin) {
            console.error("[PAYTR WEBHOOK] Database connection is null. Cannot update order.");
            return new Response("Fail: Database misconfiguration", { status: 500 });
        }

        // 2. Process transaction result
        // Prime web'de satılmaz (Baran kararı 2026-10-02; sadece App Store/Google Play, bkz. 8.61).
        if (merchant_oid.startsWith("SUB")) {
            console.warn(`[PAYTR WEBHOOK] Web aboneliği artık yok, yok sayıldı: ${merchant_oid}`);
        } else {
            // --- SHOP ORDER PROCESSING ---
            // Stok düşümü, sepet temizliği, müşteri/satıcı bildirimi ve e-posta (kuyruk) tek
            // transaction'da finalize_paid_order içinde; tekrarlanan webhook "duplicate" döner.
            if (status === "success") {
                const { data: result, error: finalizeErr } = await supabaseAdmin.rpc("finalize_paid_order", {
                    p_order_id: merchant_oid,
                    p_amount_kurus: Number(total_amount)
                });
                if (finalizeErr) {
                    console.error("[PAYTR WEBHOOK] Order finalize failed:", finalizeErr);
                    return new Response("Fail: finalize failed", { status: 500 });
                }
                console.log(`[PAYTR WEBHOOK] Order ${merchant_oid}: ${result}`);
            } else {
                const failed_reason_code = params.get("failed_reason_code") || "";
                const failed_reason_msg = params.get("failed_reason_msg") || "Unknown error";
                console.warn(`[PAYTR WEBHOOK] Payment failed for order ${merchant_oid}: ${failed_reason_msg} (${failed_reason_code})`);
                await supabaseAdmin.rpc("mark_order_payment_failed", { p_order_id: merchant_oid });
            }
        }

        // PayTR expects exactly "OK" returned in case of successful webhook acknowledgement.
        return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });

    } catch (error: any) {
        console.error("[PAYTR WEBHOOK] Error:", error);
        return new Response(`Fail: ${error.message || "error"}`, { status: 500 });
    }
}
