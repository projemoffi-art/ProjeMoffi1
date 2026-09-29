'use client';

import React from 'react';

// Sahiplendirme (design-reference/community-final/sahiplendirme-reference.jpg).
export default function AdoptionLayout({ children }: { children: React.ReactNode }) {
    return <div className="theme-vet min-h-screen bg-background text-foreground pb-32">{children}</div>;
}
