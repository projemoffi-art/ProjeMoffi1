'use client';

import React from 'react';
import { HealthProvider } from '@/components/health/HealthProvider';

// Sağlık Merkezi: tüm /health ekranları aktif evcil hayvanın tek Sağlık Kaydı'nı paylaşır.
export default function HealthLayout({ children }: { children: React.ReactNode }) {
    return (
        <HealthProvider>
            <div className="theme-vet min-h-screen bg-background text-foreground pb-32">{children}</div>
        </HealthProvider>
    );
}
