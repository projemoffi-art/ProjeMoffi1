"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/home/BottomNav";
import { FloatingControls } from "@/components/common/FloatingControls";
import { GlobalAIWidget } from "@/components/ai/GlobalAIWidget";

const HIDDEN_ROUTES = ['/studio', '/lab', '/production-studio'];

export function DynamicNavigation() {
    const pathname = usePathname();

    // Hide global components on studio/lab/walk routes
    const shouldHide = pathname && HIDDEN_ROUTES.some(route => pathname.startsWith(route));

    if (shouldHide) return null;

    const isHomePage = pathname === '/';

    return (
        <>
            {isHomePage && <BottomNav />}
            <FloatingControls />
            <GlobalAIWidget />
        </>
    );
}
