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
        if (merchant_oid.startsWith("SUB")) {
            // --- SUBSCRIPTION PROCESSING ---
            if (status === "success") {
                const { data: intent, error: intentErr } = await supabaseAdmin
                    .from("subscription_intents")
                    .select("*")
                    .eq("merchant_oid", merchant_oid)
                    .single();

                if (intentErr || !intent) {
                    console.error("[PAYTR WEBHOOK] Intent not found for subscription:", merchant_oid);
                    return new Response("Fail: Intent not found", { status: 400 });
                }

                if (intent.status === "completed") {
                    console.log("[PAYTR WEBHOOK] Subscription already processed:", merchant_oid);
                    return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
                }

                // Get current profile
                const { data: profile, error: profileErr } = await supabaseAdmin
                    .from("profiles")
                    .select("is_prime, prime_until")
                    .eq("id", intent.user_id)
                    .single();

                if (profileErr) {
                    console.error("[PAYTR WEBHOOK] Profile fetch failed:", profileErr);
                    return new Response("Fail: Profile not found", { status: 500 });
                }

                // Calculate new prime_until (max(now, old_prime_until) + 30 days)
                const now = new Date();
                let currentPrimeUntil = now;
                if (profile.is_prime && profile.prime_until) {
                    const oldDate = new Date(profile.prime_until);
                    if (oldDate > now) {
                        currentPrimeUntil = oldDate;
                    }
                }
                const newPrimeUntil = new Date(currentPrimeUntil.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

                // Update profile
                await supabaseAdmin
                    .from("profiles")
                    .update({
                        is_prime: true,
                        subscription_tier: intent.plan_id,
                        prime_until: newPrimeUntil,
                        cancel_at_period_end: false
                    })
                    .eq("id", intent.user_id);

                // Mark intent as completed
                await supabaseAdmin
                    .from("subscription_intents")
                    .update({ status: "completed" })
                    .eq("merchant_oid", merchant_oid);
                
                console.log(`[PAYTR WEBHOOK] Successfully processed subscription success: ${merchant_oid}`);
            } else {
                // Payment failed
                const failed_reason_code = params.get("failed_reason_code") || "";
                const failed_reason_msg = params.get("failed_reason_msg") || "Unknown error";
                console.warn(`[PAYTR WEBHOOK] Payment failed for subscription ${merchant_oid}: ${failed_reason_msg} (${failed_reason_code})`);
                
                await supabaseAdmin
                    .from("subscription_intents")
                    .update({ status: "failed" })
                    .eq("merchant_oid", merchant_oid);
            }
        } else {
            // --- SHOP ORDER PROCESSING ---
            if (status === "success") {
                // Update order status to 'paid' in Supabase
                const { data: order, error: orderErr } = await supabaseAdmin
                    .from("orders")
                    .update({ status: "paid" })
                    .eq("id", merchant_oid)
                    .select()
                    .single();

                if (orderErr) {
                    console.error("[PAYTR WEBHOOK] Database update failed for order:", orderErr);
                    return new Response("Fail: DB update failed", { status: 500 });
                }

                // Clear the shopping cart in DB for the user who owns this order
                if (order && order.user_id) {
                    const { error: cartErr } = await supabaseAdmin
                        .from("cart_items")
                        .delete()
                        .eq("user_id", order.user_id);

                    if (cartErr) {
                        console.error("[PAYTR WEBHOOK] Failed to clear cart items for user:", order.user_id, cartErr);
                    } else {
                        console.log(`[PAYTR WEBHOOK] Successfully cleared cart items for user: ${order.user_id}`);
                    }
                }
                
                // --- B1: Send Order Confirmation Email ---
                try {
                    if (order && order.user_id) {
                        const { sendEmail, getOrderConfirmationHtml } = await import("@/lib/notifications/email");
                        const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
                        
                        if (!userErr && userData?.user?.email) {
                            const { data: items } = await supabaseAdmin.from("order_items").select("quantity, price_at_purchase, products(name)").eq("order_id", merchant_oid);
                            const mappedItems = (items || []).map((i: any) => ({
                                name: i.products?.name || "Ürün",
                                quantity: i.quantity,
                                price: Number(i.price_at_purchase)
                            }));
                            
                            await sendEmail({
                                to: userData.user.email,
                                subject: "Moffi - Siparişiniz Onaylandı 🎉",
                                html: getOrderConfirmationHtml(merchant_oid, Number(total_amount), mappedItems)
                            });
                        }
                    }
                } catch (emailErr) {
                    console.error("[PAYTR WEBHOOK] Failed to send confirmation email:", emailErr);
                }
                // --- END B1 ---
                
                console.log(`[PAYTR WEBHOOK] Successfully processed order success: ${merchant_oid}`);
            } else {
                // Update order status to 'failed'
                const failed_reason_code = params.get("failed_reason_code") || "";
                const failed_reason_msg = params.get("failed_reason_msg") || "Unknown error";
                
                console.warn(`[PAYTR WEBHOOK] Payment failed for order ${merchant_oid}: ${failed_reason_msg} (${failed_reason_code})`);
                
                await supabaseAdmin
                    .from("orders")
                    .update({ status: "cancelled" })
                    .eq("id", merchant_oid);
            }
        }

        // PayTR expects exactly "OK" returned in case of successful webhook acknowledgement.
        return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });

    } catch (error: any) {
        console.error("[PAYTR WEBHOOK] Error:", error);
        return new Response(`Fail: ${error.message || "error"}`, { status: 500 });
    }
}
