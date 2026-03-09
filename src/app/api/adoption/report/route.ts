import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Adoption Ad Report Endpoint
 * Allows users to report suspicious listings
 */
export async function POST(req: Request) {
    try {
        const { adId, reportedBy, reason, details } = await req.json();

        if (!adId || !reason) {
            return NextResponse.json({ error: "adId and reason required" }, { status: 400 });
        }

        // Save report to adoption_reports table
        const { error: reportError } = await supabaseAdmin
            .from("adoption_reports")
            .insert({
                ad_id: adId,
                reported_by: reportedBy || null,
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
                .from("adoption_ads")
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
