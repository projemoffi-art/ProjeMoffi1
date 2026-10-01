'use client';

// Referans Ekran 1 (Keşfet ana ekranı: hikâyeler + akış) ve Ekran 2 (akışta özel kayıp / yuva kartları).
// Gönderi kartları mevcut büyük kart ölçüsünde (Baran'ın notu). Kayıp ve Sahiplendirme ayrı panelde
// (/kayip, /sahiplendirme); eski ?tab=radar bağlantıları oraya gider.

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, MessageCircle, Plus, Search } from 'lucide-react';
import { LoadingBlocks } from '@/components/health/HealthUI';
import { PostCard } from '@/components/social/SocialUI';
import { StoriesBar } from '@/components/social/Stories';
import { AdoptionFeedCard, LostFeedCard } from '@/components/social/SpecialCards';
import { useSearchArea } from '@/components/lost/useSearchArea';
import { socialService, POSTS_CHANGED_EVENT, type SocialPost, type StoryGroup } from '@/services/socialService';
import { lostService, type LostListing } from '@/services/lostService';
import { adoptionService, type AdoptionListing } from '@/services/adoptionService';
import { supabase } from '@/lib/supabase';
import { distanceKm } from '@/lib/geo';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

type Mode = 'following' | 'for_you';
const PAGE = 12;

export default function CommunityPage() {
    return <Suspense fallback={null}><Feed /></Suspense>;
}

function IconBtn({ label, onClick, href, badge, children }: { label: string; onClick?: () => void; href?: string; badge?: number; children: React.ReactNode }) {
    const cls = 'relative w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center';
    const inner = <>{children}{!!badge && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-accent text-white text-[9px] font-black flex items-center justify-center">{badge > 9 ? '9+' : badge}</span>}</>;
    return href ? <Link href={href} aria-label={label} className={cls}>{inner}</Link> : <button onClick={onClick} aria-label={label} className={cls}>{inner}</button>;
}

function Feed() {
    const router = useRouter();
    const params = useSearchParams();
    const { user } = useAuth();
    const { unreadCount: unreadMessages, setIsInboxOpen, openChat } = useChat();
    const { unreadCount } = useNotifications();
    const { area } = useSearchArea();

    const [mode, setMode] = useState<Mode>(params.get('sekme') === 'takip' ? 'following' : 'for_you');
    const [posts, setPosts] = useState<SocialPost[] | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stories, setStories] = useState<StoryGroup[]>([]);
    const [lost, setLost] = useState<{ l: LostListing; km: number | null }[]>([]);
    const [adopt, setAdopt] = useState<{ l: AdoptionListing; km: number | null }[]>([]);
    const [fresh, setFresh] = useState(false);
    const sentinel = useRef<HTMLDivElement>(null);

    // Eski bağlantılar
    useEffect(() => {
        const tab = params.get('tab');
        if (tab === 'radar') { router.replace(params.get('mode') === 'adopt' ? '/sahiplendirme' : '/kayip'); return; }
        if (params.get('openUpload') === 'true') { router.replace('/community/yeni'); return; }
        const post = params.get('post');
        if (post) { router.replace(`/community/gonderi/${post}`); return; }
        const chat = params.get('chat');
        if (chat) openChat(chat);
    }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

    const load = useCallback(async (m: Mode) => {
        setError(null);
        try {
            const list = await socialService.feed(m, null, PAGE);
            setPosts(list); setHasMore(list.length === PAGE); setFresh(false);
        } catch (e: any) { setError(e?.message || 'Gönderiler yüklenemedi.'); setPosts([]); }
    }, []);
    const loadStories = useCallback(() => { socialService.stories().then(setStories).catch(() => {}); }, []);

    useEffect(() => { setPosts(null); load(mode); }, [mode, load]);
    useEffect(() => { loadStories(); }, [loadStories, user?.id]);

    useEffect(() => {
        const onChange = () => load(mode);
        window.addEventListener(POSTS_CHANGED_EVENT, onChange);
        // Yeni gönderi gelince kaydırmayı bozmadan haber ver.
        const ch = supabase.channel('social-feed-new')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (e: any) => { if (e.new?.user_id !== user?.id) setFresh(true); })
            .subscribe();
        return () => { window.removeEventListener(POSTS_CHANGED_EVENT, onChange); supabase.removeChannel(ch); };
    }, [mode, load, user?.id]);

    // Yakındaki gerçek kayıp ve sahiplendirme ilanları (özel kartlar)
    useEffect(() => {
        if (!area) return;
        const near = (x: { lat: number | null; lng: number | null }) => (x.lat != null && x.lng != null ? distanceKm(area, { lat: x.lat, lng: x.lng }) : null);
        lostService.list().then(list => setLost(list.filter(l => l.status === 'active' && l.photos[0])
            .map(l => ({ l, km: near(l) })).filter(x => x.km == null || x.km <= 10)
            .sort((a, b) => new Date(b.l.createdAt).getTime() - new Date(a.l.createdAt).getTime()).slice(0, 6))).catch(() => {});
        adoptionService.list().then(list => setAdopt(list.filter(l => l.photos[0])
            .map(l => ({ l, km: near(l) })).filter(x => x.km == null || x.km <= 25).slice(0, 6))).catch(() => {});
    }, [area]);

    const more = useCallback(async () => {
        if (!posts || !hasMore || loadingMore || posts.length === 0) return;
        setLoadingMore(true);
        try {
            const list = await socialService.feed(mode, posts[posts.length - 1].createdAt, PAGE);
            setPosts(p => [...(p || []), ...list.filter(x => !(p || []).some(y => y.id === x.id))]);
            setHasMore(list.length === PAGE);
        } catch { /* sonraki kaydırmada tekrar denenir */ }
        finally { setLoadingMore(false); }
    }, [posts, hasMore, loadingMore, mode]);

    useEffect(() => {
        if (!sentinel.current) return;
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) more(); }, { rootMargin: '600px' });
        io.observe(sentinel.current);
        return () => io.disconnect();
    }, [more]);

    const setPost = useCallback((p: SocialPost) => setPosts(list => (list || []).map(x => (x.id === p.id ? p : x))), []);
    const dropPost = useCallback((id: string) => setPosts(list => (list || []).filter(x => x.id !== id)), []);
    const dropAuthor = useCallback((uid: string) => { setPosts(list => (list || []).filter(x => x.userId !== uid)); loadStories(); }, [loadStories]);

    // Akışa özel kartları serpiştir: 2. gönderiden sonra kayıp, 5. gönderiden sonra yuva, sonra her 4 gönderide bir.
    const items = useMemo(() => {
        const out: React.ReactNode[] = [];
        let li = 0, ai = 0;
        (posts || []).forEach((p, i) => {
            out.push(<PostCard key={p.id} post={p} onChange={setPost} onRemoved={dropPost} onBlocked={dropAuthor} />);
            const slot = i === 1 ? 'lost' : i === 4 ? 'adopt' : i > 4 && (i - 4) % 4 === 0 ? (((i - 4) / 4) % 2 ? 'lost' : 'adopt') : null;
            if (slot === 'lost' && lost[li]) { out.push(<LostFeedCard key={`l-${lost[li].l.id}`} listing={lost[li].l} km={lost[li].km} />); li++; }
            if (slot === 'adopt' && adopt[ai]) { out.push(<AdoptionFeedCard key={`a-${adopt[ai].l.id}`} listing={adopt[ai].l} km={adopt[ai].km} />); ai++; }
        });
        return out;
    }, [posts, lost, adopt, setPost, dropPost, dropAuthor]);

    return (
        <main className="max-w-2xl mx-auto pb-32">
            <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="text-2xl font-black leading-none">Moffi <span className="text-accent">🐾</span></div>
                    <div className="flex items-center gap-2">
                        <IconBtn label="Yeni gönderi" href={user ? '/community/yeni' : '/'}><Plus className="w-5 h-5" /></IconBtn>
                        <IconBtn label="Keşfet'te ara" href="/community/kesfet"><Search className="w-4.5 h-4.5" /></IconBtn>
                        {user && <IconBtn label="Mesajlar" onClick={() => setIsInboxOpen(true)} badge={unreadMessages}><MessageCircle className="w-4.5 h-4.5" /></IconBtn>}
                        <IconBtn label="Bildirimler" onClick={() => window.dispatchEvent(new CustomEvent('open-notification-drawer'))} badge={unreadCount}><Bell className="w-4.5 h-4.5" /></IconBtn>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-card border border-card-border">
                    {([['following', 'Takip Ettiklerim'], ['for_you', 'Senin İçin']] as const).map(([m, label]) => (
                        <button key={m} onClick={() => { haptics.tap(); setMode(m); router.replace(m === 'following' ? '/community?sekme=takip' : '/community', { scroll: false }); }}
                            className='relative h-10 rounded-xl text-sm font-black'>
                            {mode === m && <motion.span layoutId='feed-tab' className='absolute inset-0 rounded-xl bg-accent' transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                            <span className={cn('relative transition-colors', mode === m ? 'text-white' : 'text-secondary')}>{label}</span>
                        </button>
                    ))}
                </div>
            </header>

            <StoriesBar groups={stories} reload={loadStories} />

            <AnimatePresence>
                {fresh && (
                    <motion.div className="sticky top-[132px] z-20 flex justify-center" initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
                        <button onClick={() => { haptics.tap(); window.scrollTo({ top: 0, behavior: 'smooth' }); load(mode); }}
                            className="mt-2 h-9 px-4 rounded-full bg-accent text-white text-xs font-black shadow-lg">Yeni gönderiler ↑</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && <p className="px-4 pt-3 text-sm font-semibold text-red-600">{error}</p>}
            {!posts ? <div className="px-4 pt-4"><LoadingBlocks count={3} /></div> : posts.length === 0 ? (
                <div className="mx-4 mt-6 bg-card border border-card-border rounded-3xl p-6 text-center space-y-2">
                    <div className="text-base font-black">{mode === 'following' ? 'Takip ettiğin kimse henüz paylaşmadı' : 'Henüz gönderi yok'}</div>
                    <p className="text-sm font-semibold text-secondary">
                        {mode === 'following' ? 'Senin İçin sekmesinde topluluğa göz at, sevdiğin hesapları takip et.' : 'İlk paylaşımı sen yap!'}
                    </p>
                    {mode === 'following'
                        ? <button onClick={() => setMode('for_you')} className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Senin İçin'e geç</button>
                        : user && <Link href="/community/yeni" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Gönderi paylaş</Link>}
                </div>
            ) : (
                <div className="divide-y divide-card-border/60">{items}</div>
            )}
            <div ref={sentinel} />
            {loadingMore && <div className="px-4 py-4"><LoadingBlocks count={1} /></div>}
            {posts && posts.length > 0 && !hasMore && <p className="text-center text-xs font-semibold text-secondary py-6">Hepsi bu kadar 🐾</p>}
        </main>
    );
}
