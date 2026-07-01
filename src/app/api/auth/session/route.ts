import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key to query profiles bypassing RLS, or fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
    : null;

const SESSION_SECRET = process.env.SESSION_SECRET || "moffi_default_secure_session_secret_key_2026";

function signRole(role: string, userId: string): string {
    const payload = JSON.stringify({ role, userId });
    const base64Payload = Buffer.from(payload).toString("base64");
    const signature = crypto
        .createHmac("sha256", SESSION_SECRET)
        .update(base64Payload)
        .digest("hex");
    return `${base64Payload}.${signature}`;
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

        if (!token) {
            return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
        }

        // 1. Verify token server-side (with mock fallback in development)
        let userId = "";
        let role = "user";

        const isDevMock = process.env.NODE_ENV !== "production" && token.startsWith("mock-token-");

        if (isDevMock) {
            userId = token;
            role = token.includes("admin") ? "admin" : (token.includes("business") ? "business" : "user");
            console.log(`[Session API] Development Mock Token accepted: user=${userId}, role=${role}`);
        } else {
            if (!supabaseAdmin) {
                return NextResponse.json({ error: "Database configuration error" }, { status: 500 });
            }

            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
            if (authError || !user) {
                console.error("[Session API] Auth token verification failed:", authError);
                return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
            }
            userId = user.id;

            // 2. Fetch the user's true role from the database profiles table
            const { data: profile, error: profileError } = await supabaseAdmin
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profileError || !profile) {
                console.error("[Session API] Profile role lookup failed:", profileError);
                return NextResponse.json({ error: "Profile not found" }, { status: 404 });
            }

            role = profile.role || "user";
        }

        const signedValue = signRole(role, userId);

        // 3. Set httpOnly signed cookie
        const response = NextResponse.json({ success: true, role });
        
        // Next.js cookie setting API
        response.cookies.set({
            name: "moffi_user_role",
            value: signedValue,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 86400 // 1 day
        });

        console.log(`[Session API] Successfully set signed cookie for user ${userId} with role: ${role}`);
        return response;

    } catch (error: any) {
        console.error("[Session API] Error setting session:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const response = NextResponse.json({ success: true });
        
        // Delete the cookie
        response.cookies.delete("moffi_user_role");
        
        console.log("[Session API] Successfully deleted signed role cookie");
        return response;
    } catch (error: any) {
        console.error("[Session API] Error clearing session:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
