"use client";

/**
 * MOFFI LIVE EVENTS HUD — Aşama 2
 *
 * Tüm canlı olayları kullanıcıya gösterir:
 * 1. FLASH CHALLENGE MODAL — Tam ekran ani görev
 * 2. LIVE EVENT TOASTS — Sağ üstten gelen bildirimler
 * 3. LIVE WALKER TICKER — Nav üstünde canlı sayaç
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveEvents, LiveEvent } from '@/context/LiveEventsContext';
import { useRouter } from 'next/navigation';

// ─── FLASH CHALLENGE MODAL ────────────────────────────────────────────────────

function getSecondsLeft(expiresAt: number): number {
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}

function formatCountdown(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function FlashChallengeModal({ event, onAccept, onDismiss }: {
    event: LiveEvent;
    onAccept: () => void;
    onDismiss: () => void;
}) {
    const [secsLeft, setSecsLeft] = useState(getSecondsLeft(event.expiresAt));

    useEffect(() => {
        const interval = setInterval(() => {
            const s = getSecondsLeft(event.expiresAt);
            setSecsLeft(s);
            if (s <= 0) onDismiss();
        }, 1000);
        return () => clearInterval(interval);
    }, [event.expiresAt, onDismiss]);

    const pct = Math.min(100, (secsLeft / ((event.expiresAt - Date.now() + secsLeft * 1000) / 1000)) * 100);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9200] flex items-center justify-center bg-black/75 backdrop-blur-md p-6"
        >
            <motion.div
                initial={{ scale: 0.6, rotate: -8, y: 60 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                exit={{ scale: 0.6, rotate: 8, y: 60 }}
                transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                className={`w-full max-w-sm bg-gradient-to-br ${event.color} rounded-[2.5rem] p-6 border border-card-border shadow-[0_30px_80px_rgba(0,0,0,0.6)] relative overflow-hidden`}
            >
                {/* Animated BG glow */}
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -right-16 -top-16 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none"
                />

                {/* TOP RIGHT CLOSE BUTTON */}
                <button
                    onClick={onDismiss}
                    className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/70 hover:text-white transition-all z-50"
                >
                    ✕
                </button>

                {/* Countdown ring */}
                <div className="absolute top-5 right-5">
                    <div className="relative w-14 h-14">
                        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                            <motion.circle
                                cx="28" cy="28" r="24"
                                fill="none" stroke="white" strokeWidth="4"
                                strokeDasharray={150.8}
                                strokeDashoffset={150.8 * (1 - secsLeft / Math.max(1, secsLeft + 1))}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] font-black text-white/90 font-mono">
                                {formatCountdown(secsLeft)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Icon */}
                <motion.div
                    animate={{ rotate: [-5, 5, -5], scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-6xl mb-4 inline-block"
                >
                    {event.icon}
                </motion.div>

                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 bg-black/20 rounded-full px-2.5 py-1 mb-3">
                    <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-1.5 h-1.5 bg-red-400 rounded-full"
                    />
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">CANLI GÖREV</span>
                </div>

                <h2 className="text-2xl font-black text-white mb-2 leading-tight">{event.title}</h2>
                <p className="text-sm text-white/70 font-semibold mb-5 leading-relaxed">{event.body}</p>

                {/* Reward chips */}
                {event.reward && (
                    <div className="flex gap-2 mb-5">
                        <div className="bg-black/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                            <span className="text-[10px]">⭐</span>
                            <span className="text-sm font-black text-white">+{event.reward.pp} PP</span>
                        </div>
                        <div className="bg-black/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                            <span className="text-[10px]">⚡</span>
                            <span className="text-sm font-black text-white">+{event.reward.xp} XP</span>
                        </div>
                    </div>
                )}

                {/* CTA Buttons */}
                <div className="flex gap-3">
                    <motion.button
                        whileTap={{ scale: 0.94 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={onAccept}
                        className="flex-1 bg-card text-black font-black py-3.5 rounded-2xl text-sm uppercase tracking-wider shadow-xl active:scale-95 transition-all"
                    >
                        {event.cta} →
                    </motion.button>
                    <button
                        onClick={onDismiss}
                        className="w-12 h-12 bg-black/20 hover:bg-black/30 rounded-2xl flex items-center justify-center text-white/50 hover:text-white/80 transition-all self-end"
                    >
                        ✕
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── EVENT TOAST CARD ─────────────────────────────────────────────────────────

const URGENCY_STYLES = {
    low:      { border: 'border-card-border', dot: 'bg-gray-400' },
    medium:   { border: 'border-blue-500/30', dot: 'bg-blue-400' },
    high:     { border: 'border-orange-500/40', dot: 'bg-orange-400' },
    critical: { border: 'border-red-500/50', dot: 'bg-red-400' },
};

function EventToastCard({ event, onDismiss }: { event: LiveEvent; onDismiss: () => void }) {
    const router = useRouter();
    const cfg = URGENCY_STYLES[event.urgency];

    const handleCTA = () => {
        if (event.actionKey) window.dispatchEvent(new CustomEvent(event.actionKey));
        if (event.ctaRoute) router.push(event.ctaRoute);
        onDismiss();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.85 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className={`bg-[#111115]/95 backdrop-blur-2xl border ${cfg.border} rounded-2xl p-3 shadow-2xl w-[240px]`}
        >
            <div className="flex items-start gap-2.5">
                {/* Live indicator */}
                <div className="relative shrink-0 mt-0.5">
                    <motion.div
                        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={`absolute inset-0 ${cfg.dot} rounded-full`}
                    />
                    <div className={`w-2.5 h-2.5 ${cfg.dot} rounded-full relative z-10`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                        <p className="text-[10px] font-black text-white leading-tight">{event.title}</p>
                        <button onClick={onDismiss} className="text-white/20 hover:text-white/50 text-[10px] shrink-0 mt-0.5 transition-colors">✕</button>
                    </div>
                    <p className="text-[8px] text-white/40 font-semibold mt-0.5 leading-tight">{event.body}</p>

                    {event.reward && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[7px] font-black text-orange-400 bg-orange-500/15 px-1.5 py-0.5 rounded-full">+{event.reward.pp} PP</span>
                            <span className="text-[7px] font-black text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded-full">+{event.reward.xp} XP</span>
                        </div>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCTA}
                        className={`mt-2 w-full bg-gradient-to-r ${event.color} py-1.5 rounded-xl text-[8px] font-black text-white uppercase tracking-wider`}
                    >
                        {event.cta} →
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── LIVE WALKER PULSE ────────────────────────────────────────────────────────

export function LiveWalkerPulse() {
    const { liveWalkerCount } = useLiveEvents();

    if (liveWalkerCount < 3) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/20 rounded-full px-2.5 py-1"
        >
            <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
            />
            <span className="text-[9px] font-black text-emerald-400">{liveWalkerCount} aktif</span>
        </motion.div>
    );
}

// ─── MAIN HUD COMPONENT ───────────────────────────────────────────────────────

export function LiveEventsHUD() {
    const { activeEvents, flashChallenge, dismissEvent, acceptFlashChallenge } = useLiveEvents();
    const [shownFlash, setShownFlash] = useState<typeof flashChallenge>(null);
    const [visibleToasts, setVisibleToasts] = useState<LiveEvent[]>([]);
    const shownToastIds = React.useRef<Set<string>>(new Set());

    // Flash challenge'ı bir kez göster
    useEffect(() => {
        if (flashChallenge && flashChallenge !== shownFlash) {
            setShownFlash(flashChallenge);
        }
        if (!flashChallenge) setShownFlash(null);
    }, [flashChallenge]);

    // Event toast'ları — high/critical önce, max 3
    useEffect(() => {
        const fresh = activeEvents
            .filter(e => !shownToastIds.current.has(e.id) && e.type !== 'flash_challenge')
            .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                return order[a.urgency] - order[b.urgency];
            })
            .slice(0, 3);

        if (fresh.length > 0) {
            fresh.forEach(e => shownToastIds.current.add(e.id));
            setVisibleToasts(fresh);
        }
    }, [activeEvents]);

    return (
        <>
            {/* ── Flash Challenge Modal ── */}
            <AnimatePresence>
                {shownFlash && (
                    <FlashChallengeModal
                        event={shownFlash}
                        onAccept={() => { acceptFlashChallenge(); setShownFlash(null); }}
                        onDismiss={() => { dismissEvent(shownFlash.id); setShownFlash(null); }}
                    />
                )}
            </AnimatePresence>

            {/* ── Event Toast Cards ── */}
            <div className="fixed top-16 right-3 z-[8800] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {visibleToasts.map(event => (
                        <div key={event.id} className="pointer-events-auto">
                            <EventToastCard
                                event={event}
                                onDismiss={() => {
                                    dismissEvent(event.id);
                                    setVisibleToasts(prev => prev.filter(e => e.id !== event.id));
                                }}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}
