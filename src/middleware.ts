import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    
    // Get the mock user role cookie
    const roleCookie = request.cookies.get("moffi_mock_user_role");
    const role = roleCookie ? roleCookie.value : null;

    // 1. Admin Rotaları Koruması
    if (pathname.startsWith("/admin")) {
        if (role !== "admin") {
            // Yetkisiz ise ana sayfaya veya login'e yönlendir
            console.log(`[Middleware] Blocked unauthorized access to ${pathname} (Role: ${role})`);
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // 2. İşletme (Business) Rotaları Koruması
    if (pathname.startsWith("/business")) {
        if (role !== "business" && role !== "admin") {
            // Hekim veya Admin dışındakileri yönlendir
            console.log(`[Middleware] Blocked unauthorized access to ${pathname} (Role: ${role})`);
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

// Rotaları filtreleme (matcher)
export const config = {
    matcher: [
        "/admin/:path*",
        "/business/:path*"
    ]
};
