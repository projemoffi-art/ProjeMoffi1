import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Safe Supabase Init
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { rating, category, comment } = body;
        const targetEmail = "projemoffi@gmail.com";

        console.log(`[FEEDBACK] New submission for ${targetEmail}:`, { rating, category, comment });

        if (!supabaseAdmin) {
            console.warn(`Feedback API: Supabase not configured. This feedback for ${targetEmail} is logged in Vercel Runtime Logs.`);
            return NextResponse.json({ 
                success: true, 
                message: `Feedback received for ${targetEmail} (No DB connected)` 
            });
        }

        // Save to Supabase (assuming a 'feedbacks' table exists or will exist)
        const { error } = await supabaseAdmin
            .from("app_feedbacks")
            .insert({
                rating,
                category,
                comment,
                created_at: new Date().toISOString(),
                metadata: {
                    user_agent: req.headers.get("user-agent"),
                }
            });

        if (error) {
            console.error("Supabase Error saving feedback:", error);
            // We still return success: true to the user so we don't break the UI
            return NextResponse.json({ success: true, warning: "DB save failed" });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Feedback API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
