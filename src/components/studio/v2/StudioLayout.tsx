"use client";

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StudioProvider, useStudio } from './StudioEngine';
import { TopBar } from './TopBar';
import { StudioWidgets } from './StudioWidgets';
import { RightPanel } from './RightPanel';
import { AICreatorPanel } from './AICreatorPanel';
import { InfiniteCanvas } from './InfiniteCanvas';
import { BottomControlBar } from './BottomControlBar';
import { ProductSelectionScreen } from '../ProductSelectionScreen';

function StudioShellContent() {
    const { state, actions } = useStudio();
    const searchParams = useSearchParams();
    const imgParams = searchParams.get('image');

    useEffect(() => {
        if (imgParams) {
            // Check if product layer already exists to avoid duplicates
            const hasProduct = state.layers.some(l => l.isProduct);
            if (!hasProduct) {
                actions.addLayer('image', imgParams, {
                    isProduct: true,
                    id: 'main-product',
                    scale: 1,
                    x: 50, y: 50 // Center
                });
            }
        }
    }, [imgParams, actions, state.layers]);

    // If no image is selected, show the selection screen
    if (!imgParams) {
        return <ProductSelectionScreen />;
    }

    return (
        <div className="h-screen w-full bg-[#f2f2f5] dark:bg-black overflow-hidden flex flex-col font-sans select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            <TopBar />

            {/* FLOATING WIDGETS (Left) */}
            <StudioWidgets />

            <div className="flex-1 flex pt-16 relative">
                {/* Main Canvas Area - Full Width */}
                <main className="flex-1 relative h-full bg-[#f2f2f5] dark:bg-black transition-all">
                    <InfiniteCanvas />
                </main>

                {/* FLOATING PANEL (Right) */}
                <RightPanel />

                {/* AI CREATOR PANEL (Right) - New */}
                <AICreatorPanel />
            </div>

            {/* BOTTOM CONTROL BAR */}
            <BottomControlBar />
        </div>
    );
}

function StudioShell() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Yükleniyor...</div>}>
            <StudioShellContent />
        </Suspense>
    );
}

export default function StudioLayout() {
    return (
        <StudioProvider>
            <StudioShell />
        </StudioProvider>
    );
}
