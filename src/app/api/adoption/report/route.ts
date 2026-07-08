import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

/**
 * Adoption Ad Report Endpoint
 * Allows users to report suspicious listings
 */
export async function POST(req: Request) {
    try {
        const { adId, reason, details } = await req.json();

        if (!adId || !reason) {
            return NextResponse.json({ error: "adId and reason required" }, { status: 400 });
        }

        if (!supabaseAdmin || !supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
        }

        // KİMLİK DOĞRULAMA (Kimliği belirsiz kişilerin şikayet etmesi engellendi)
        const cookieStore = cookies();
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value; },
                    set() {},
                    remove() {}
                },
            }
        );

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        
        if (authErr || !user) {
            console.error("[Adoption Report] Yetkisiz şikayet denemesi.");
            return NextResponse.json({ error: "Oturum bulunamadı. Şikayet etmek için giriş yapmalısınız." }, { status: 401 });
        }

        // KULLANICI BAŞINA TEK ŞİKAYET KONTROLÜ (Brigading/Spam engellendi)
        const { data: existingReport } = await supabaseAdmin
            .from("adoption_reports")
            .select("id")
            .eq("ad_id", adId)
            .eq("reported_by", user.id)
            .single();

        if (existingReport) {
            return NextResponse.json({ error: "Bu ilanı zaten şikayet ettiniz." }, { status: 429 });
        }

        // Şikayeti kaydet
        const { error: reportError } = await supabaseAdmin
            .from("adoption_reports")
            .insert({
                ad_id: adId,
                reported_by: user.id, // Sadece doğrulanmış kullanıcı ID'si
                reason,
                details: details || null,
                status: "pending",
                created_at: new Date().toISOString()
            });

        if (reportError) throw reportError;

        // Count how many times this ad has been reported
        const { count } = await supabaseAdmin
            .from("adoption_reports")
            .select("*", { count: "exact", head: true })
            .eq("ad_id", adId)
            .eq("status", "pending");

        // Auto-remove if reported 3+ times
        if (count && count >= 3) {
            await supabaseAdmin
                .from("adoption_pets")
                .update({ status: "removed", moderation_result: "Birden fazla kullanıcı tarafından bildirildi" })
                .eq("id", adId);
        }

        return NextResponse.json({ success: true, reportCount: count });

    } catch (error: any) {
        console.error("Report Error:", error);
        return NextResponse.json(
            { error: "Report failed", details: error.message },
            { status: 500 }
        );
    }
}
