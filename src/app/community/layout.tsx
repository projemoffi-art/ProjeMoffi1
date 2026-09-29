'use client';

import React from 'react';

// Keşfet (design-reference/community-final/kesfet-reference.jpg).
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    return <div className="theme-vet min-h-screen bg-background text-foreground">{children}</div>;
}
