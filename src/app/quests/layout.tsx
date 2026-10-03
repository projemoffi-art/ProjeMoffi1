'use client';

import React from 'react';

// Görev Merkezi (design-reference/quests-final/): home-final paleti (.theme-vet), alt menünün üstünde boşluk.
export default function QuestsLayout({ children }: { children: React.ReactNode }) {
    return <div className="theme-vet min-h-[100dvh] bg-background text-foreground pb-[calc(120px+env(safe-area-inset-bottom,0px))]">{children}</div>;
}
