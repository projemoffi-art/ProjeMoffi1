'use client';

// Hızlı Erişim (home-final referansı: tek sırada 5 öğe) + "Tümünü Gör" ile açılan tüm hizmetler paneli.
// Paneldeki her satır gerçek bir ekrana gider; sahte/yarım ekranlar (cüzdan, harita) burada yok.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Award, Bone, CalendarCheck, ChevronRight, Compass, Footprints, Gamepad2, HeartHandshake, HeartPulse,
    History, Home, IdCard, Pill, Scale, Shirt, ShoppingBag, ShoppingCart, Stethoscope, Syringe, Target, X,
} from 'lucide-react';
import { haptics } from '@/native';
import { SectionHeader, baloo } from './homeUI';

type Action = { path?: string; event?: [string, unknown?] };

const QUICK: { label: string; Icon: typeof Home; tint: string; action: Action; badgeKey?: 'lost' | 'cart' }[] = [
    { label: 'Kayıp & Sahiplen', Icon: Home, tint: '#EE5B3D', action: { path: '/kayip' }, badgeKey: 'lost' },
    { label: 'Market Petshop', Icon: ShoppingBag, tint: '#E0892E', action: { path: '/petshop' }, badgeKey: 'cart' },
    { label: 'Veteriner', Icon: Stethoscope, tint: '#2F9E8F', action: { path: '/vet' } },
    { label: 'Sağlık Merkezi', Icon: HeartPulse, tint: '#8B7FD9', action: { path: '/health' } },
    { label: 'Beslenme & Su', Icon: Bone, tint: '#6BAF3A', action: { event: ['open-care-hub', { tab: 'nutrition' }] } },
];

const ALL: { title: string; items: { label: string; sub: string; Icon: typeof Home; path: string }[] }[] = [
    {
        title: 'Sağlık',
        items: [
            { label: 'Sağlık Merkezi', sub: 'Karne, durum ve hatırlatmalar', Icon: HeartPulse, path: '/health' },
            { label: 'Aşılar', sub: 'Aşı takvimi ve kayıtları', Icon: Syringe, path: '/health/asilar' },
            { label: 'İlaçlar', sub: 'Tedaviler ve doz takibi', Icon: Pill, path: '/health/ilaclar' },
            { label: 'Kilo', sub: 'Kilo geçmişi', Icon: Scale, path: '/health/kilo' },
            { label: 'Pasaport', sub: 'Kimlik ve paylaşım', Icon: IdCard, path: '/pasaport' },
        ],
    },
    {
        title: 'Hizmetler',
        items: [
            { label: 'Veteriner bul', sub: 'Klinikler ve randevu', Icon: Stethoscope, path: '/vet' },
            { label: 'Randevularım', sub: 'Yaklaşan ve geçmiş randevular', Icon: CalendarCheck, path: '/vet?view=appointments' },
            { label: 'Market', sub: 'Mama, aksesuar, bakım', Icon: ShoppingBag, path: '/petshop' },
            { label: 'Sepetim', sub: 'Siparişe hazır ürünler', Icon: ShoppingCart, path: '/cart' },
        ],
    },
    {
        title: 'Topluluk',
        items: [
            { label: 'Keşfet', sub: 'Gönderiler ve hikâyeler', Icon: Compass, path: '/community' },
            { label: 'Kayıp ilanları', sub: 'Yakındaki kayıp ve bulunanlar', Icon: Home, path: '/kayip' },
            { label: 'Sahiplendirme', sub: 'Yuva arayan dostlar', Icon: HeartHandshake, path: '/sahiplendirme' },
        ],
    },
    {
        title: 'Aktivite',
        items: [
            { label: 'Yürüyüş', sub: 'İstatistikler ve hedef', Icon: Footprints, path: '/walk' },
            { label: 'Yürüyüş geçmişi', sub: 'Tüm yürüyüşlerin', Icon: History, path: '/walk/history' },
            { label: 'Görevler', sub: 'Günlük ve haftalık görevler', Icon: Target, path: '/quests' },
            { label: 'Rozetler', sub: 'Kazandıkların ve sıradakiler', Icon: Award, path: '/walk/badges' },
            { label: 'Oyunlar', sub: 'Mini oyunlar', Icon: Gamepad2, path: '/game' },
            { label: 'Kıyafet dolabı', sub: 'Maskot kombinleri', Icon: Shirt, path: '/dress-up' },
        ],
    },
];

export function QuickAccess({ lostCount, cartCount }: { lostCount: number; cartCount: number }) {
    const router = useRouter();
    const [allOpen, setAllOpen] = useState(false);

    const run = (a: Action) => {
        haptics.tap();
        if (a.path) router.push(a.path);
        else if (a.event) window.dispatchEvent(new CustomEvent(a.event[0], { detail: a.event[1] }));
    };

    return (
        <section>
            <SectionHeader title="Hızlı Erişim" onAction={() => { haptics.tap(); setAllOpen(true); }} />
            <div className="grid grid-cols-5 gap-2">
                {QUICK.map(q => {
                    const badge = q.badgeKey === 'lost' ? lostCount : q.badgeKey === 'cart' ? cartCount : 0;
                    return (
                        <button
                            key={q.label}
                            type="button"
                            onClick={() => run(q.action)}
                            className="relative flex flex-col items-center gap-1.5 rounded-[18px] card-premium px-1 pt-3 pb-2.5 shadow-[0_4px_14px_-8px_rgba(32,27,22,0.18)] active:scale-95 transition-transform"
                        >
                            <span
                                className="w-11 h-11 rounded-[15px] flex items-center justify-center"
                                style={{ background: `linear-gradient(160deg, ${q.tint} 0%, color-mix(in srgb, ${q.tint} 76%, #000) 100%)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 16px -8px ${q.tint}` }}
                            >
                                <q.Icon className="w-[22px] h-[22px] text-white" strokeWidth={2.1} />
                            </span>
                            <span className="text-[11.5px] font-bold text-foreground text-center leading-[1.15]">{q.label}</span>
                            {badge > 0 && (
                                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10.5px] font-extrabold flex items-center justify-center">
                                    {badge > 99 ? '99+' : badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <AllServicesSheet open={allOpen} onClose={() => setAllOpen(false)} onGo={path => { setAllOpen(false); router.push(path); }} />
        </section>
    );
}

function AllServicesSheet({ open, onClose, onGo }: { open: boolean; onClose: () => void; onGo: (path: string) => void }) {
    useEffect(() => {
        if (!open) return;
        window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: false }));
        return () => { window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: true })); };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[4500] bg-black/40" />
                    <motion.div
                        role="dialog"
                        aria-label="Tüm hizmetler"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.4 }}
                        onDragEnd={(_, info) => { if (info.offset.y > 110) onClose(); }}
                        className="theme-vet fixed bottom-0 inset-x-0 z-[4501] mx-auto max-w-md max-h-[86vh] flex flex-col rounded-t-[28px] bg-background shadow-[0_-20px_50px_rgba(0,0,0,0.25)]"
                    >
                        <div className="pt-2.5 pb-1 flex justify-center"><span className="w-10 h-1.5 rounded-full bg-foreground/15" /></div>
                        <div className="flex items-center justify-between px-5 pb-3">
                            <h2 className={`${baloo.className} text-[22px] font-bold text-foreground`}>Tüm hizmetler</h2>
                            <button type="button" onClick={onClose} aria-label="Kapat" className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-foreground/5">
                                <X className="w-5 h-5 text-foreground" />
                            </button>
                        </div>
                        <div className="overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] space-y-5">
                            {ALL.map(group => (
                                <div key={group.title}>
                                    <h3 className="text-[12.5px] font-bold text-secondary uppercase tracking-wide mb-2 px-1">{group.title}</h3>
                                    <div className="rounded-[20px] card-premium divide-y divide-card-border overflow-hidden">
                                        {group.items.map(item => (
                                            <button
                                                key={item.path}
                                                type="button"
                                                onClick={() => { haptics.tap(); onGo(item.path); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-foreground/[0.04]"
                                            >
                                                <span className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                                                    <item.Icon className="w-[18px] h-[18px] text-accent" strokeWidth={2.1} />
                                                </span>
                                                <span className="flex-1 min-w-0">
                                                    <span className="block text-[14.5px] font-bold text-foreground">{item.label}</span>
                                                    <span className="block text-[12px] font-semibold text-secondary truncate">{item.sub}</span>
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-secondary/60 shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
