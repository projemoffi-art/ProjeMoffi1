"use client";

import dynamic from "next/dynamic";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const GlobalAIWidget = dynamic(
    () => import("@/components/ai/GlobalAIWidget").then(mod => mod.GlobalAIWidget),
    { ssr: false }
);

export function AIWidgetLoader() {
    const pathname = usePathname();
    const { user } = useAuth();
    
    // Hide AI Assistant on login/landing flows, games, and full-screen walk takeovers
    // (referans mockup'ta bu ekranlarda hiç yok; ayrıca daha önce start/bitir
    // butonlarının üzerine binerek gerçek tıklama sorunlarına yol açtığı görüldü)
    const hidePaths = ['/', '/login', '/register', '/reset-password', '/walk/tracking', '/walk/summary'];
    if (hidePaths.includes(pathname) || pathname.startsWith('/game')) return null;

    // Check user preference
    const widgetEnabled = user?.settings?.ai?.widgetEnabled ?? true;
    if (!widgetEnabled) return null;

    return <GlobalAIWidget />;
}
