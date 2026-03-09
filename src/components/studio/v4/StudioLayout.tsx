"use client";

import React from "react";
import { StudioContextProvider } from "./StudioContext";
import { BottomNav } from "@/components/home/BottomNav";
import { usePathname } from "next/navigation";

export function StudioLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // We want the global nav on the Explore page, but NOT inside the Design Canvas
    // because the canvas has its own specific bottom toolbars.
    const showGlobalNav = !pathname?.includes('/studio/design');

    return (
        <StudioContextProvider>
            <div className={`min-h-screen bg-[#F5F5F7] text-gray-900 font-sans ${showGlobalNav ? 'pb-24' : ''}`}>
                {children}

                {showGlobalNav && (
                    <BottomNav active="explore" />
                )}
            </div>
        </StudioContextProvider>
    );
}
