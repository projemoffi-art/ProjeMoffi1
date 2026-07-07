"use client";

import dynamic from "next/dynamic";

import { usePathname } from "next/navigation";

const GlobalAIWidget = dynamic(
    () => import("@/components/ai/GlobalAIWidget").then(mod => mod.GlobalAIWidget),
    { ssr: false }
);

export function AIWidgetLoader() {
    const pathname = usePathname();
    
    // Hide AI Assistant on login/landing flows
    if (pathname === '/') return null;

    return <GlobalAIWidget />;
}
