import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

    // Rol sadece Supabase oturumundan gelir. Ayrı bir rol çerezine güvenilmez (eskiden vardı ve imza anahtarı
    // tanımsızken kodda yazılı yedek anahtarla taklit edilebiliyordu).

    // Bakım Modu Kontrolü (Roller tamamen belli olduktan sonra yapılır)
    if (isSupabaseEnabled) {
        try {
            const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
                cookies: {
                    getAll() { return request.cookies.getAll(); },
                    setAll() { } // Readonly
                }
            });
            const { data: settingsData } = await supabase
                .from('platform_settings')
                .select('value')
                .eq('key', 'general')
                .single();

            if (settingsData && settingsData.value && settingsData.value.maintenanceMode === true) {
                // Sadece adminler bakım modunu geçebilir
                if (role !== 'admin' && pathname !== '/maintenance') {
                    return NextResponse.redirect(new URL("/maintenance", request.url));
                }
            } else if (pathname === '/maintenance') {
                // Bakım modu bittiyse ve kullanıcı bakım sayfasındaysa anasayfaya yönlendir
                return NextResponse.redirect(new URL("/", request.url));
            }
        } catch (e) {
            console.error("[Middleware] Platform settings lookup failed:", e);
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

    // 2. İşletme paneli: kişi en az bir işletmenin üyesi (sahip/yönetici/personel) olmalı (8.54). Rol değil üyelik
    // belirler; hangi işletmede neyi yapabileceğini veritabanı kuralları ayrıca denetler.
    if (pathname === "/business" || pathname.startsWith("/business/")) {
        if (!userId) {
            return NextResponse.redirect(new URL("/", request.url));
        }
        let isMember = false;
        try {
            const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
                cookies: {
                    getAll() { return request.cookies.getAll(); },
                    setAll() { } // Readonly
                }
            });
            const { data } = await supabase.from("business_members").select("business_id").eq("user_id", userId).limit(1);
            isMember = !!data && data.length > 0;
        } catch (e) {
            console.error("[Middleware] Business membership lookup failed:", e);
        }
        if (!isMember) {
            return NextResponse.redirect(new URL("/home", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|images|icons|icon.svg|manifest.json|sw.js).*)",
    ]
};
