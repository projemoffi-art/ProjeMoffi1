"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ["/", "/business-register", "/production-studio", "/sandbox-studio", "/terms", "/privacy", "/cookies"];

// Uygulama dışındaki kişilere açık sayfalar: künye (/id), paylaşılan pasaport (/p), doğrulama kodu (/verify).
// Künyeyi okutan kişinin Moffi hesabı olmayabilir; önceden bu sayfalar giriş ekranına atıyordu.
const PUBLIC_PREFIXES = ["/id/", "/p/", "/verify/"];
// Paylaşılan kayıp/bulunan ve sahiplendirme ilanları: ilan, "Gördüm" bildirimi ve el ilanı hesapsız açılır.
// İlan verme, başvuru ve yönetim girişi gerektirir.
const PUBLIC_PATTERNS = [
    /^\/kayip\/[0-9a-f-]{36}(\/(gordum|el-ilani))?\/?$/i,
    /^\/sahiplendirme\/[0-9a-f-]{36}(\/el-ilani)?\/?$/i,
    // Paylaşılan Keşfet gönderisi ve yorumları (beğeni/yorum giriş ister)
    /^\/community\/gonderi\/[0-9a-f-]{36}(\/yorumlar)?\/?$/i,
];

// Routes that require business role
const BUSINESS_ROUTES_PREFIX = "/business";

// Routes that require admin role
const ADMIN_ROUTES_PREFIX = "/admin";

interface Props {
    children: React.ReactNode;
}

export function ClientAuthWrapper({ children }: Props) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname() ?? "";
    const router = useRouter();

    const isDemoRoute = pathname.startsWith("/demo");
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || isDemoRoute || PUBLIC_PREFIXES.some(p => pathname.startsWith(p)) || PUBLIC_PATTERNS.some(r => r.test(pathname));
    const isBusinessRoute = pathname.startsWith(BUSINESS_ROUTES_PREFIX);
    const isAdminRoute = pathname.startsWith(ADMIN_ROUTES_PREFIX);

    useEffect(() => {
        if (isLoading) return;

        // Public routes — no check
        if (isPublicRoute) return;

        // Not logged in → auth page
        if (!user) {
            router.replace("/");
            return;
        }

        // Business routes → need business role + approval
        if (isBusinessRoute) {
            if (user.role !== 'business' && user.role !== 'admin') {
                router.replace("/home");
                return;
            }
            // Business user but not approved → show pending page (handled within business layout)
        }
    }, [user, isLoading, isPublicRoute, isBusinessRoute, isAdminRoute, pathname, router]);

    // Public routes always render immediately
    if (isPublicRoute) {
        return <>{children}</>;
    }

    // Loading
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] dark:bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!user) return null;

    // Wrong role for business routes
    if (isBusinessRoute && user.role !== 'business' && user.role !== 'admin') return null;

    return <>{children}</>;
}
