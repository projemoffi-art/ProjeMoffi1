import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import { sendEmail, getNotificationEmailHtml } from "@/lib/notifications/email";

export const dynamic = "force-dynamic";

// Supabase pg_cron (appointment-reminders-and-emails) her 5 dakikada bir, kuyrukta bekleyen
// e-posta varsa bu uç noktayı çağırır. Anahtar Supabase vault'ta (email_cron_secret) ve
// Vercel'de EMAIL_CRON_SECRET olarak durur.
function authorized(request: Request) {
    const expected = process.env.EMAIL_CRON_SECRET;
    const given = request.headers.get("x-cron-secret");
    if (!expected || !given) return false;
    const a = Buffer.from(expected);
    const b = Buffer.from(given);
    return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
    if (!authorized(request)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!process.env.RESEND_API_KEY) {
        // Anahtar yoksa kuyruğa dokunma; e-postalar anahtar eklenince gönderilir.
        return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 503 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: "Supabase admin config missing" }, { status: 500 });
    }
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: jobs, error } = await admin.rpc("claim_email_outbox", { p_limit: 40 });
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let sent = 0;
    let failed = 0;
    for (const job of jobs || []) {
        try {
            let email: string | undefined = job.recipient_email || undefined;
            if (!email && job.user_id) {
                const { data: userData } = await admin.auth.admin.getUserById(job.user_id);
                email = userData?.user?.email;
            }
            if (!email) throw new Error("E-posta adresi bulunamadı");

            const result = await sendEmail({
                to: email,
                subject: job.subject,
                html: getNotificationEmailHtml(job.heading, job.body, job.cta_url)
            });
            if (!result.success || (result as any).simulated) {
                throw new Error(String((result as any).error?.message || (result as any).error || "Gönderim başarısız"));
            }
            await admin.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("id", job.id);
            sent++;
        } catch (err: any) {
            await admin.from("email_outbox").update({
                status: job.attempts >= 5 ? "failed" : "pending",
                last_error: String(err?.message || err).slice(0, 500)
            }).eq("id", job.id);
            failed++;
        }
    }

    return NextResponse.json({ claimed: jobs?.length || 0, sent, failed });
}
