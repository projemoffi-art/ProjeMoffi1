'use client';

// Hikâye kanalları + tam ekran görüntüleyici (kanallar: hooks/useStories). Kırmızı nokta yalnızca gerçekten
// görülmemiş hikâye varsa yanar: İçerik Stüdyosu öğelerinde sunucudaki kayıt, otomatik kanallarda bu cihaz.
// Otomatik özet hikâyeleri görsel yerine tasarlanmış kart olarak çizilir.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, Clock, Gift, PawPrint, Stethoscope, X } from 'lucide-react';
import { device, haptics, share } from '@/native';
import { showToast } from '@/lib/utils';
import { contentService } from '@/services/contentService';
import type { Story, StoryCard, StoryChannel, UserStoryGroup } from '@/hooks/useStories';
import { baloo } from './homeUI';

const SEEN_KEY = 'moffi_seen_stories';
const STORY_MS = 5500;

const CHANNEL_STYLE: Record<StoryChannel, { color: string; Icon: typeof BellRing | null }> = {
    lost: { color: '#D9432F', Icon: BellRing },
    weekly: { color: '#6BAF3A', Icon: PawPrint },
    moffi: { color: '#EE5B3D', Icon: PawPrint },
    vet: { color: '#2F9E8F', Icon: Stethoscope },
    deal: { color: '#E8A33D', Icon: Gift },
};

const CARD_BG: Record<StoryCard['tone'], string> = {
    warm: 'linear-gradient(160deg, #F7B24A 0%, #EE5B3D 55%, #B8402A 100%)',
    green: 'linear-gradient(160deg, #A6DE72 0%, #5C9B2E 55%, #2F5E17 100%)',
    violet: 'linear-gradient(160deg, #B9A9F2 0%, #7C6AD6 55%, #463A8F 100%)',
    ink: 'linear-gradient(160deg, #4A4038 0%, #2A231D 60%, #15110D 100%)',
};

function readSeen(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
}
function writeSeen(seen: Set<string>) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen).slice(-400))); } catch { /* gizli sekme vb. */ }
}

export function HomeStories({ groups }: { groups: UserStoryGroup[] }) {
    const [seen, setSeen] = useState<Set<string>>(new Set());
    const [open, setOpen] = useState<{ group: number; story: number } | null>(null);
    useEffect(() => { setSeen(readSeen()); }, []);

    const markSeen = useCallback((story: Story) => {
        if (story.contentId && !story.seen) contentService.track(story.contentId, 'view');
        setSeen(prev => {
            if (prev.has(story.id)) return prev;
            const next = new Set(prev); next.add(story.id);
            return next;
        });
    }, []);
    useEffect(() => { if (seen.size > 0) writeSeen(seen); }, [seen]);

    const isSeen = (s: Story) => !!s.seen || seen.has(s.id);

    if (groups.length === 0) return null;

    return (
        <>
            <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-5 px-4 pb-1">
                {groups.map((g, gi) => {
                    const style = CHANNEL_STYLE[g.channel];
                    const unseen = g.stories.some(s => !isSeen(s));
                    return (
                        <button
                            key={g.user_id}
                            type="button"
                            onClick={() => {
                                haptics.tap();
                                const firstUnseen = g.stories.findIndex(s => !isSeen(s));
                                setOpen({ group: gi, story: Math.max(0, firstUnseen) });
                            }}
                            className="flex flex-col items-center gap-1.5 w-[74px] shrink-0 active:scale-95 transition-transform"
                        >
                            <span className="relative">
                                <span
                                    className="block w-[62px] h-[62px] rounded-full p-[2.5px]"
                                    style={{ background: unseen ? `conic-gradient(from 210deg, ${style.color}, #F7B24A, #EE5B3D, ${style.color})` : 'color-mix(in srgb, var(--foreground) 14%, transparent)' }}
                                >
                                    <span className="block w-full h-full rounded-full border-[2.5px] border-background overflow-hidden">
                                        {g.author_avatar ? (
                                            <img src={g.author_avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${style.color} 70%, #fff) 0%, ${style.color} 55%, color-mix(in srgb, ${style.color} 80%, #000) 100%)` }}>
                                                {style.Icon && <style.Icon className="w-6 h-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" strokeWidth={2.2} />}
                                            </span>
                                        )}
                                    </span>
                                </span>
                                {unseen && <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-accent border-2 border-background" />}
                            </span>
                            <span className="text-[11.5px] font-bold text-foreground leading-[1.15] text-center w-full line-clamp-2">{g.author_name}</span>
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {open && groups[open.group] && (
                    <StoryViewer
                        group={groups[open.group]}
                        startIndex={open.story}
                        onSeen={markSeen}
                        onClose={() => setOpen(null)}
                        onNextGroup={() => setOpen(o => (o && o.group < groups.length - 1 ? { group: o.group + 1, story: 0 } : null))}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

function CardSlide({ card }: { card: StoryCard }) {
    return (
        <div className="absolute inset-0 flex flex-col justify-center px-8 text-white" style={{ background: CARD_BG[card.tone] }}>
            <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-10 bottom-24 w-56 h-56 rounded-full bg-black/10 blur-2xl" />
            {card.image && (
                <img src={card.image} alt="" className="relative w-28 h-28 rounded-[32px] object-cover border-4 border-white/80 shadow-xl mb-6" />
            )}
            {card.eyebrow && <p className="relative text-[14px] font-extrabold uppercase tracking-wide text-white/75">{card.eyebrow}</p>}
            {card.big && (
                <p className={`${baloo.className} relative mt-1 text-[54px] leading-[1.02] font-bold`}>
                    {card.big}{card.unit && <span className="text-[26px] ml-2 font-bold text-white/85">{card.unit}</span>}
                </p>
            )}
            {card.lines?.map((l, i) => <p key={i} className="relative mt-2 text-[17px] font-semibold text-white/90 leading-snug">{l}</p>)}
        </div>
    );
}

function StoryViewer({ group, startIndex, onSeen, onClose, onNextGroup }: {
    group: UserStoryGroup;
    startIndex: number;
    onSeen: (s: Story) => void;
    onClose: () => void;
    onNextGroup: () => void;
}) {
    const router = useRouter();
    const [index, setIndex] = useState(startIndex);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const pressStart = useRef(0);
    const story: Story | undefined = group.stories[index];

    useEffect(() => { setIndex(startIndex); setProgress(0); }, [group.user_id, startIndex]);
    useEffect(() => { if (story) onSeen(story); }, [story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Hikâye açıkken alt menü gizlenir.
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: false }));
        return () => { window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: true })); };
    }, []);

    const next = useCallback(() => {
        setProgress(0);
        if (index < group.stories.length - 1) setIndex(i => i + 1);
        else onNextGroup();
    }, [index, group.stories.length, onNextGroup]);
    const prev = () => { setProgress(0); if (index > 0) setIndex(i => i - 1); };

    useEffect(() => {
        if (paused || !story) return;
        const step = 50;
        const t = setInterval(() => setProgress(p => Math.min(100, p + (step / STORY_MS) * 100)), step);
        return () => clearInterval(t);
    }, [paused, story?.id]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (progress >= 100) next(); }, [progress, next]);

    if (!story) return null;

    const run = async (type: Story['ctaType'], value?: string) => {
        if (!value) return;
        haptics.tap();
        if (story.contentId) contentService.track(story.contentId, 'tap');
        if (type === 'coupon') {
            await share.copyText(value);
            showToast(`Kod kopyalandı: ${value}`, 'CheckCircle2', 'text-emerald-500');
            return;
        }
        onClose();
        if (type === 'url') device.openExternal(value);
        else if (type === 'event') window.dispatchEvent(new CustomEvent(value));
        else router.push(value);
    };

    const remaining = story.expires_at ? new Date(story.expires_at).getTime() - Date.now() : null;
    const tapZone = (dir: 'prev' | 'next') => ({
        onPointerDown: () => { pressStart.current = Date.now(); setPaused(true); },
        onPointerUp: () => { setPaused(false); if (Date.now() - pressStart.current < 250) { if (dir === 'prev') prev(); else next(); } },
        onPointerLeave: () => setPaused(false),
        onPointerCancel: () => setPaused(false),
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-black flex items-center justify-center"
        >
            <div className="relative w-full h-full md:max-w-md md:h-[820px] md:rounded-[28px] overflow-hidden bg-neutral-900">
                {story.card ? <CardSlide card={story.card} /> : (
                    <>
                        <img src={story.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/85" />
                    </>
                )}

                <div className="absolute inset-x-0 top-[110px] bottom-[190px] z-10 flex select-none touch-none">
                    <div className="w-1/3 h-full" {...tapZone('prev')} />
                    <div className="w-2/3 h-full" {...tapZone('next')} />
                </div>

                <div className="absolute top-0 inset-x-0 z-20 px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
                    <div className="flex gap-1">
                        {group.stories.map((s, i) => (
                            <div key={s.id} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
                                <div className="h-full bg-white" style={{ width: `${i < index ? 100 : i === index ? progress : 0}%` }} />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-[14px] font-bold text-white drop-shadow">{group.author_name}</span>
                        <button type="button" onClick={onClose} aria-label="Kapat" className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-white active:bg-white/10">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-[calc(env(safe-area-inset-bottom)+24px)]">
                    {!story.card && (
                        <>
                            <div className="flex flex-wrap gap-2 mb-2.5">
                                {story.badge && <span className="text-[11.5px] font-bold text-white bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">{story.badge}</span>}
                                {remaining !== null && remaining > 0 && (
                                    <span className="text-[11.5px] font-bold text-white bg-emergency/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> {remaining > 86_400_000 ? `${Math.ceil(remaining / 86_400_000)} gün kaldı` : `Son ${Math.floor(remaining / 3_600_000)} sa ${Math.floor((remaining % 3_600_000) / 60_000)} dk`}
                                    </span>
                                )}
                            </div>
                            {story.title && <h3 className="text-[20px] font-extrabold text-white leading-snug">{story.title}</h3>}
                            {story.description && <p className="text-[14px] text-white/85 font-medium leading-relaxed mt-1.5 max-h-[30vh] overflow-y-auto">{story.description}</p>}
                        </>
                    )}
                    {story.ctaText && story.ctaValue && (
                        <button
                            type="button"
                            onClick={() => run(story.ctaType, story.ctaValue)}
                            className="mt-4 w-full h-[52px] rounded-2xl bg-white text-[#201B16] text-[15px] font-extrabold active:scale-[0.98] transition-transform"
                        >
                            {story.ctaText}
                        </button>
                    )}
                    {story.secondary && (
                        <button
                            type="button"
                            onClick={() => run(story.secondary!.type, story.secondary!.value)}
                            className="mt-2 w-full h-[48px] rounded-2xl bg-white/15 backdrop-blur text-white text-[14.5px] font-bold active:scale-[0.98] transition-transform"
                        >
                            {story.secondary.text}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
