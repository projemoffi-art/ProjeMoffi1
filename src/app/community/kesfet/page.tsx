'use client';

// Referans Ekran 3 — Keşfet ızgarası: hayvan, kişi ya da ırk araması ve konu filtreleri.
// Kedi/köpek/yavru filtreleri gönderide etiketlenen gerçek hayvanlardan, "Yakınımda" gönderinin semt konumundan gelir.

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { HealthHeader, LoadingBlocks } from '@/components/health/HealthUI';
import { PersonRow, PostGrid } from '@/components/social/SocialUI';
import { WeeklyThemeCard } from '@/components/social/WeeklyThemeCard';
import { useSearchArea } from '@/components/lost/useSearchArea';
import { AreaSheet } from '@/components/lost/AreaSheet';
import { haptics } from '@/native/haptics';
import { socialService, EXPLORE_FILTERS, type ExploreFilter, type GridPost, type PersonCard } from '@/services/socialService';
import { cn } from '@/lib/utils';

const PAGE = 30;

export default function ExplorePage() {
    return <Suspense fallback={null}><Explore /></Suspense>;
}

function Explore() {
    const router = useRouter();
    const params = useSearchParams();
    const { area, choose, detectDevice } = useSearchArea();
    const [areaOpen, setAreaOpen] = useState(false);
    const [q, setQ] = useState(params.get('q') || '');
    const [term, setTerm] = useState(params.get('q') || '');
    const [filter, setFilter] = useState<ExploreFilter>((params.get('f') as ExploreFilter) || 'all');
    const [posts, setPosts] = useState<GridPost[] | null>(null);
    const [people, setPeople] = useState<PersonCard[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sentinel = useRef<HTMLDivElement>(null);
    const loadingMore = useRef(false);

    // Yazarken bekle, sonra ara (her tuşta sunucuya gitmez).
    useEffect(() => { const t = setTimeout(() => setTerm(q.trim()), 350); return () => clearTimeout(t); }, [q]);
    useEffect(() => {
        const sp = new URLSearchParams();
        if (term) sp.set('q', term);
        if (filter !== 'all') sp.set('f', filter);
        router.replace(`/community/kesfet${sp.toString() ? `?${sp}` : ''}`, { scroll: false });
    }, [term, filter]); // eslint-disable-line react-hooks/exhaustive-deps

    const areaArg = filter === 'nearby' ? area : null;
    useEffect(() => {
        if (filter === 'nearby' && !area) return;
        let alive = true;
        setPosts(null); setError(null);
        socialService.search(term, filter, areaArg, 0, PAGE)
            .then(list => { if (alive) { setPosts(list); setHasMore(list.length === PAGE); } })
            .catch(e => { if (alive) { setError(e?.message || 'Arama yapılamadı.'); setPosts([]); } });
        if (term.length >= 2) socialService.searchPeople(term).then(p => alive && setPeople(p)); else setPeople([]);
        return () => { alive = false; };
    }, [term, filter, area]); // eslint-disable-line react-hooks/exhaustive-deps

    const more = useCallback(async () => {
        if (!posts || !hasMore || loadingMore.current) return;
        loadingMore.current = true;
        try {
            const list = await socialService.search(term, filter, areaArg, posts.length, PAGE);
            // Sıralama zamanla kaydığı için aynı gönderi iki sayfada gelebilir; tekrarlar atılır.
            setPosts(p => { const seen = new Set((p || []).map(x => x.id)); return [...(p || []), ...list.filter(x => !seen.has(x.id))]; });
            setHasMore(list.length === PAGE);
        } finally { loadingMore.current = false; }
    }, [posts, hasMore, term, filter, areaArg]);

    useEffect(() => {
        if (!sentinel.current) return;
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) more(); }, { rootMargin: '400px' });
        io.observe(sentinel.current);
        return () => io.disconnect();
    }, [more]);

    return (
        <>
            <HealthHeader title="Keşfet" backHref="/community" />
            <main className="max-w-2xl mx-auto px-4 pb-32 space-y-3">
                <label className="flex items-center gap-2 h-11 px-4 rounded-2xl bg-card border border-card-border">
                    <Search className="w-4 h-4 text-secondary shrink-0" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Hayvan, kişi veya ırk ara…" autoFocus={!!params.get('ara')}
                        className="flex-1 bg-transparent text-sm font-semibold outline-none" />
                    {q && <button onClick={() => setQ('')} aria-label="Temizle"><X className="w-4 h-4 text-secondary" /></button>}
                </label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
                    {EXPLORE_FILTERS.map(f => (
                        <button key={f.id} onClick={() => { haptics.tap(); setFilter(f.id); }}
                            className={cn('relative h-9 px-3.5 rounded-full text-xs font-bold border shrink-0', filter === f.id ? 'border-accent' : 'bg-card border-card-border')}>
                            {filter === f.id && <motion.span layoutId='explore-chip' className='absolute inset-0 rounded-full bg-accent' transition={{ type: 'spring', stiffness: 460, damping: 34 }} />}
                            <span className={cn('relative', filter === f.id ? 'text-white' : 'text-secondary')}>{f.label}</span>
                        </button>
                    ))}
                </div>
                {filter === 'nearby' && (
                    <p className="text-[11px] font-semibold text-secondary">
                        {area ? <>{area.name} çevresinde 10 km içinde, semt konumu paylaşılmış gönderiler. <button onClick={() => setAreaOpen(true)} className="font-black text-accent">Konumu değiştir</button></> : 'Konumun bulunuyor…'}
                    </p>
                )}

                {!term && filter === 'all' && <WeeklyThemeCard onBrowse={tag => setQ(`#${tag}`)} />}

                {people.length > 0 && (
                    <section>
                        <div className="text-sm font-black mb-1">Kişiler</div>
                        <div className="bg-card border border-card-border rounded-2xl px-3">{people.map(p => <PersonRow key={p.id} person={p} />)}</div>
                    </section>
                )}

                {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                {!posts ? <LoadingBlocks count={3} /> : posts.length === 0 ? (
                    <div className="bg-card border border-card-border rounded-2xl p-6 text-center space-y-1">
                        <div className="text-base font-black">Sonuç yok</div>
                        <p className="text-sm font-semibold text-secondary">
                            {filter === 'nearby' ? 'Yakınında konum paylaşılmış gönderi yok.' : 'Başka bir kelime ya da filtre dene.'}
                        </p>
                    </div>
                ) : <PostGrid posts={posts} mosaic />}
                <div ref={sentinel} />
            </main>
            {area && <AreaSheet open={areaOpen} onClose={() => setAreaOpen(false)} area={area}
                onChoose={choose} onDevice={detectDevice} />}
        </>
    );
}
