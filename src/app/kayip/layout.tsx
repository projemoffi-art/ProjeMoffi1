'use client';

import React from 'react';

// Kayıp & Bulunan (design-reference/community-final/kayip-bulunan-reference.jpg).
export default function LostLayout({ children }: { children: React.ReactNode }) {
    return <div className="theme-vet min-h-screen bg-background text-foreground pb-32">{children}</div>;
}
