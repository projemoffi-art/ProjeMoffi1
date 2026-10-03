'use client';

import React from 'react';

// Sahiplendirme (design-reference/community-final/sahiplendirme-reference.jpg).
export default function AdoptionLayout({ children }: { children: React.ReactNode }) {
    return <div className="theme-vet min-h-screen bg-background text-foreground pb-[calc(176px+env(safe-area-inset-bottom,0px))]">{children}</div>;
}
