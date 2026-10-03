'use client';

// iPhone'da uygulama ekranın en üstüne kadar çizilir (viewport-fit=cover, black-translucent): saat/pil göstergeleri ve çentik
// içeriğin üstünde durur. Büyük uygulamalardaki gibi çentik yüksekliğinde sabit bir şerit: sayfa en üstteyken şeffaf (fotoğraflı
// başlıklar çentiğin altına uzanır), kaydırınca sayfa renginde dolar; kaydırılan içerik bu şeridin altından geçer, göstergeler
// her zaman okunur. Çentiği olmayan cihazda yüksekliği 0'dır. Alt menünün (2900) üstünde, alt panel/pencerelerin (3100+) altında.

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/** Sayfa düzeyinde kaydırma: belge ya da ekranı kaplayan bir kaydırma kutusu (alt panellerin iç listeleri sayılmaz). */
function pageScrollTop(target: EventTarget | null): number | null {
    if (target === document || target === document.documentElement || target === document.body) return window.scrollY;
    if (target instanceof HTMLElement) {
        const r = target.getBoundingClientRect();
        if (r.top <= 1 && r.height >= window.innerHeight * 0.8) return target.scrollTop;
    }
    return null;
}

export function StatusBarScrim() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = (e: Event) => {
            const top = pageScrollTop(e.target);
            if (top !== null) setScrolled(top > 6);
        };
        document.addEventListener('scroll', onScroll, { capture: true, passive: true });
        return () => document.removeEventListener('scroll', onScroll, { capture: true });
    }, []);

    return (
        <div aria-hidden
            className={cn('theme-vet pointer-events-none fixed inset-x-0 top-0 z-[2950] h-[env(safe-area-inset-top,0px)] transition-colors duration-200',
                scrolled ? 'bg-background shadow-[0_1px_0_rgba(0,0,0,0.04)]' : 'bg-transparent')} />
    );
}
