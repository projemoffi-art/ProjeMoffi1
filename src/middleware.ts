import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required but missing.");
}

async function verifyRoleSignature(cookieValue: string): Promise<{ role: string; userId: string } | null> {
    try {
        const parts = cookieValue.split(".");
        if (parts.length !== 2) return null;
        
        const [base64Payload, signatureHex] = parts;
        
        const encoder = new TextEncoder();
        const keyData = encoder.encode(SESSION_SECRET);
        
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: { name: "SHA-256" } },
            false,
            ["verify"]
        );
        
        const sigMatches = signatureHex.match(/.{1,2}/g);
        if (!sigMatches) return null;
        const sigBuffer = new Uint8Array(sigMatches.map(byte => parseInt(byte, 16)));
        
        const dataBuffer = encoder.encode(base64Payload);
        
        const isValid = await crypto.subtle.verify(
            "HMAC",
            cryptoKey,
            sigBuffer,
            dataBuffer
        );
        
        if (!isValid) return null;
        
        const payloadStr = atob(base64Payload);
        const payload = JSON.parse(payloadStr);
        return payload;
    } catch (e) {
        console.error("[Middleware] Signature verification exception:", e);
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    
    // Check if Supabase keys exist
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

    let role = null;
    let userId = null;

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    if (isSupabaseEnabled) {
        try {
            // Create Supabase SSR client in Middleware
            const supabase = createServerClient(
                supabaseUrl,
                supabaseAnonKey,
                {
                    cookies: {
                        getAll() {
                            return request.cookies.getAll();
                        },
                        setAll(cookiesToSet) {
                            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                            response = NextResponse.next({
                                request: {
                                    headers: request.headers,
                                },
                            });
                            cookiesToSet.forEach(({ name, value, options }) =>
                                response.cookies.set(name, value, options)
                            );
                        },
                    },
                }
            );

            // Verify JWT Token directly from Supabase
            const { data: { user }, error } = await supabase.auth.getUser();

            if (user && !error) {
                userId = user.id;
                // Query profiles table for true user role
                const { data: profile, error: dbError } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                if (!dbError && profile) {
                    role = profile.role || "user";
                } else {
                    console.error("[Middleware] Database profile role lookup failed:", dbError);
                }
            }
        } catch (e) {
            console.error("[Middleware] Supabase SSR authentication error:", e);
        }
    }

    // Fallback to cryptographic signature check for development mock mode
    if (!role) {
        const roleCookie = request.cookies.get("moffi_user_role");
        const cookieValue = roleCookie ? roleCookie.value : null;

        if (cookieValue) {
            const payload = await verifyRoleSignature(cookieValue);
            if (payload) {
                role = payload.role;
                userId = payload.userId;
            } else {
                console.warn(`[Middleware] Tampered or invalid session cookie detected for ${pathname}`);
            }
        }
    }

    // 1. Admin Rotaları Koruması
    if (pathname.startsWith("/admin")) {
        // İzin verilen tek admin rotası: access-denied (sonsuz döngüyü önlemek için)
        if (pathname === "/admin/access-denied") {
            return response;
        }

        if (!role) {
            return NextResponse.redirect(new URL("/", request.url));
        }
        
        // Defense-in-depth: RLS dışında middleware katmanında da engelleme yapıyoruz.
        if (role !== "admin") {
            return NextResponse.redirect(new URL("/admin/access-denied", request.url));
        }
    }

    // 2. İşletme (Business) Rotaları Koruması
    if (pathname.startsWith("/business")) {
        if (!role) {
            return NextResponse.redirect(new URL("/", request.url));
        }
        if (role !== "business" && role !== "admin") {
            return NextResponse.redirect(new URL("/community", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/business/:path*"
    ]
};
