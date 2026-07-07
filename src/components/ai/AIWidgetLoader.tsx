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
    
    // Hide AI Assistant on login/landing flows
    const hidePaths = ['/', '/login', '/register', '/reset-password'];
    if (hidePaths.includes(pathname)) return null;

    // Check user preference
    const widgetEnabled = user?.settings?.ai?.widgetEnabled ?? true;
    if (!widgetEnabled) return null;

    return <GlobalAIWidget />;
}
