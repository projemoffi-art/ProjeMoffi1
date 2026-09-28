'use client';

import React from 'react';
import { HealthProvider } from '@/components/health/HealthProvider';

// Pet Pasaportu (design-reference/passport-final): kimlik + Sağlık Kaydı'nın özeti + seçmeli paylaşım.
// Sağlık ekranlarıyla aynı kaydı paylaşır; aşı, ilaç, belge gibi alt ekranlar /health altındakilerdir.
export default function PassportLayout({ children }: { children: React.ReactNode }) {
    return (
        <HealthProvider>
            <div className="theme-vet min-h-screen bg-background text-foreground pb-32">{children}</div>
        </HealthProvider>
    );
}
