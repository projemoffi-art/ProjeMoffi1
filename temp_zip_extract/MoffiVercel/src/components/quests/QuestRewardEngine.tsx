"use client";

/**
 * MOFFI QUEST REWARD ENGINE — Aşama 1
 *
 * Duygusal katman:
 * 1. CONFETTI BURST — görev tamamlanınca patlama
 * 2. PET EMOTION SYSTEM — aktif pet yüzü değişiyor
 * 3. STREAK DRAMA — seri tehlikede kırmızı alarm
 * 4. MYSTERY BOX — %20 şansla bonus kutu
 * 5. LEVEL UP CEREMONY — seviye atlama büyük kutlama
 * 6. COMPLETION BURST — tüm görevler bitince dev animasyon
 * 7. DAILY CHALLENGE TIMER — gece yarısı geri sayım
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { usePet } from "@/context/PetContext";

// ─── CONFETTI PARTICLE ────────────────────────────────────────────────────────

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    angle: number;
    speed: number;
    spin: number;
    shape: 'circle' | 'rect' | 'star';
}

const COLORS = [
    '#f97316', '#fbbf24', '#22c55e', '#3b82f6',
    '#a855f7', '#ec4899', '#06b6d4', '#84cc16',
];

function createParticles(count: number, originX?: number, originY?: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        x: originX ?? 50,
        y: originY ?? 50,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 10 + 6,
        angle: Math.random() * 360,
        speed: Math.random() * 300 + 150,
        spin: Math.random() * 720 - 360,
        shape: ['circle', 'rect', 'star'][Math.floor(Math.random() * 3)] as any,
    }));
}

function ConfettiCanvas({ particles, containerRef }: { particles: Particle[]; containerRef?: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{
                        x: `${p.x}vw`,
                        y: `${p.y}vh`,
                        opacity: 1,
                        scale: 1,
                        rotate: 0,
                    }}
                    animate={{
                        x: `${p.x + Math.cos(p.angle * Math.PI / 180) * (p.speed / 10)}vw`,
                        y: `${p.y + Math.sin(p.angle * Math.PI / 180) * (p.speed / 10) + 40}vh`,
                        opacity: 0,
                        scale: 0.2,
                        rotate: p.spin,
                    }}
                    transition={{ duration: 1.4, ease: [0.2, 0.8, 0.4, 1] }}
                    style={{
                        position: 'absolute',
                        width: p.size,
                        height: p.shape === 'rect' ? p.size * 0.4 : p.size,
                        backgroundColor: p.color,
                        borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? 2 : 0,
                        clipPath: p.shape === 'star'
                            ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                            : undefined,
                        boxShadow: `0 0 ${p.size}px ${p.color}60`,
                    }}
                />
            ))}
        </div>
    );
}

// ─── PET EMOTION SYSTEM ───────────────────────────────────────────────────────

const PET_EMOTIONS = {
    happy: { emoji: '😄', label: 'Mutlu', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
    excited: { emoji: '🤩', label: 'Heyecanlı', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
    sad: { emoji: '😢', label: 'Üzgün', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    sleepy: { emoji: '😴', label: 'Uyuklu', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    proud: { emoji: '🏆', label: 'Gururlu', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
    love: { emoji: '🥰', label: 'Mutlu', color: 'text-pink-400', bg: 'bg-pink-500/15 border-pink-500/30' },
};

type PetEmotion = keyof typeof PET_EMOTIONS;

// ─── MYSTERY BOX ──────────────────────────────────────────────────────────────

interface MysteryBoxContent {
    icon: string;
    label: string;
    value: string;
    color: string;
}

const MYSTERY_BOX_POOL: MysteryBoxContent[] = [
    { icon: '⭐', label: 'Bonus PP', value: '+50 PP', color: 'text-yellow-400' },
    { icon: '💎', label: 'Nadir Bonus', value: '+100 PP', color: 'text-purple-400' },
    { icon: '🔥', label: 'XP Patlaması', value: '+75 XP', color: 'text-orange-400' },
    { icon: '🛡️', label: 'Seri Kalkanı', value: '1 Ekstra', color: 'text-blue-400' },
    { icon: '🎯', label: 'Pati Ödülü', value: '+30 PP', color: 'text-emerald-400' },
    { icon: '🌟', label: 'Şanslı Gün', value: '+2x PP Bugün', color: 'text-amber-400' },
];

// ─── STREAK DRAMA TIMER ───────────────────────────────────────────────────────

function getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function formatCountdown(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── LEVEL UP CEREMONY ────────────────────────────────────────────────────────

interface LevelUpData {
    newLevel: number;
    newTitle: string;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function QuestRewardEngine() {
    const {
        dailyQuests, completedCount, totalCount,
        level, levelTitle, todayEarned, currentStreak,
        totalPatiPuan
    } = useQuestEngine();

    const { activePet } = usePet();

    // States
    const [particles, setParticles] = useState<Particle[]>([]);
    const [petEmotion, setPetEmotion] = useState<PetEmotion>('happy');
    const [showPetEmote, setShowPetEmote] = useState(false);
    const [streakDanger, setStreakDanger] = useState(false);
    const [showMysteryBox, setShowMysteryBox] = useState(false);
    const [mysteryContent, setMysteryContent] = useState<MysteryBoxContent | null>(null);
    const [mysteryOpened, setMysteryOpened] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
    const [showAllComplete, setShowAllComplete] = useState(false);
    const [countdown, setCountdown] = useState(getSecondsUntilMidnight());
    const [showStreakAlert, setShowStreakAlert] = useState(false);

    // Refs for tracking changes
    const prevCompletedRef = useRef(completedCount);
    const prevLevelRef = useRef(level);
    const prevAllCompleteRef = useRef(false);
    const mysteryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Gece yarısı geri sayım ────────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const secs = getSecondsUntilMidnight();
            setCountdown(secs);

            // Seri tehlikesi: son 2 saat + hiç yürüyüş yoksa
            if (secs < 7200 && currentStreak > 0) {
                const todayWalked = dailyQuests.some(q => q.type === 'distance' && q.current > 0);
                if (!todayWalked) {
                    setStreakDanger(true);
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [currentStreak, dailyQuests]);

    // ── Streak uyarısı ────────────────────────────────────────────────────────
    useEffect(() => {
        if (streakDanger) {
            setShowStreakAlert(true);
            const t = setTimeout(() => setShowStreakAlert(false), 8000);
            return () => clearTimeout(t);
        }
    }, [streakDanger]);

    // ── Görev tamamlama detectoru ─────────────────────────────────────────────
    useEffect(() => {
        if (completedCount > prevCompletedRef.current) {
            const diff = completedCount - prevCompletedRef.current;

            // Confetti patla
            fireConfetti(40);

            // Pet emotion — tamamlama sayısına göre
            if (completedCount >= totalCount && totalCount > 0) {
                showEmotion('proud', 3500);
            } else if (completedCount >= totalCount * 0.5) {
                showEmotion('excited', 2500);
            } else {
                showEmotion('happy', 2000);
            }

            // %20 şans mystery box
            if (Math.random() < 0.25) {
                triggerMysteryBox();
            }
        }
        prevCompletedRef.current = completedCount;
    }, [completedCount, totalCount]);

    // ── Tüm görevler tamamlandı ───────────────────────────────────────────────
    useEffect(() => {
        const allDone = completedCount === totalCount && totalCount > 0;
        if (allDone && !prevAllCompleteRef.current) {
            prevAllCompleteRef.current = true;
            // Büyük kutlama — 500ms gecikme
            setTimeout(() => {
                setShowAllComplete(true);
                fireConfetti(120);
                showEmotion('love', 5000);
                setTimeout(() => setShowAllComplete(false), 5000);
            }, 500);
        }
        if (!allDone) prevAllCompleteRef.current = false;
    }, [completedCount, totalCount]);

    // ── Level up detector ─────────────────────────────────────────────────────
    useEffect(() => {
        if (level > prevLevelRef.current && prevLevelRef.current > 0) {
            setLevelUpData({ newLevel: level, newTitle: levelTitle });
            setShowLevelUp(true);
            fireConfetti(80);
            showEmotion('excited', 4000);
            setTimeout(() => setShowLevelUp(false), 5000);
        }
        prevLevelRef.current = level;
    }, [level, levelTitle]);

    // ── Sabah hatırlatması: bugün hiç görev tamamlanmadıysa üzgün pet ────────
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 19 && completedCount === 0 && totalCount > 0) {
            showEmotion('sad', 3000);
        }
    }, []); // eslint-disable-line

    // ── Quest event bus listener ──────────────────────────────────────────────
    useEffect(() => {
        const handleBadge = (e: any) => {
            fireConfetti(60);
            showEmotion('excited', 3000);
        };
        window.addEventListener('moffi-badge-earned', handleBadge);
        return () => window.removeEventListener('moffi-badge-earned', handleBadge);
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const fireConfetti = useCallback((count: number) => {
        const newParticles = createParticles(count, 50, 30);
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 1800);
    }, []);

    const showEmotion = useCallback((emotion: PetEmotion, duration: number) => {
        setPetEmotion(emotion);
        setShowPetEmote(true);
        setTimeout(() => setShowPetEmote(false), duration);
    }, []);

    const triggerMysteryBox = useCallback(() => {
        const content = MYSTERY_BOX_POOL[Math.floor(Math.random() * MYSTERY_BOX_POOL.length)];
        setMysteryContent(content);
        setMysteryOpened(false);
        setShowMysteryBox(true);
        // Otomatik kapat
        if (mysteryTimerRef.current) clearTimeout(mysteryTimerRef.current);
        mysteryTimerRef.current = setTimeout(() => setShowMysteryBox(false), 8000);
    }, []);

    const openMysteryBox = useCallback(() => {
        setMysteryOpened(true);
        fireConfetti(30);
        // Ödülü gerçekten ver (PP ekle event)
        if (mysteryContent) {
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: {
                    message: `${mysteryContent.icon} Gizli Kutu! ${mysteryContent.value} kazandın! 🎉`,
                    icon: 'Gift',
                    color: 'text-yellow-400',
                }
            }));
        }
        setTimeout(() => setShowMysteryBox(false), 2000);
    }, [mysteryContent, fireConfetti]);

    return (
        <>
            {/* ── CONFETTI ── */}
            <ConfettiCanvas particles={particles} />

            {/* ── PET EMOTION BUBBLE ── */}
            <AnimatePresence>
                {showPetEmote && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -20 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                        className={`fixed bottom-36 left-1/2 -translate-x-1/2 z-[9000] flex items-center gap-2 px-4 py-2.5 rounded-full border backdrop-blur-xl shadow-2xl ${PET_EMOTIONS[petEmotion].bg}`}
                    >
                        {activePet?.avatar && (
                            <img
                                src={activePet.avatar}
                                className="w-7 h-7 rounded-full object-cover border border-card-border"
                                alt="pet"
                            />
                        )}
                        <motion.span
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.4, repeat: 2 }}
                            className="text-xl"
                        >
                            {PET_EMOTIONS[petEmotion].emoji}
                        </motion.span>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${PET_EMOTIONS[petEmotion].color}`}>
                                {activePet?.name || 'Pati'} {PET_EMOTIONS[petEmotion].label}!
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── STREAK DRAMA ALERT ── */}
            <AnimatePresence>
                {showStreakAlert && currentStreak > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        className="fixed top-20 right-4 z-[9001] max-w-[240px]"
                    >
                        <div className="bg-red-500/95 backdrop-blur-xl border border-red-400/50 rounded-2xl p-3 shadow-2xl shadow-red-500/30">
                            <div className="flex items-start gap-2.5">
                                <motion.span
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    className="text-2xl shrink-0"
                                >
                                    🔥
                                </motion.span>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                                        {currentStreak} Günlük Serin Tehlikede!
                                    </p>
                                    <p className="text-[9px] text-white/70 mt-0.5">
                                        {formatCountdown(countdown)} kaldı — bugün yürü!
                                    </p>
                                    <button
                                        onClick={() => {
                                            window.dispatchEvent(new CustomEvent('open-walk-panel'));
                                            setShowStreakAlert(false);
                                        }}
                                        className="mt-1.5 w-full bg-white/20 hover:bg-white/30 transition-all rounded-lg py-1 text-[8px] font-black text-white uppercase tracking-wider"
                                    >
                                        Şimdi Yürüyüşe Çık →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── MYSTERY BOX ── */}
            <AnimatePresence>
                {showMysteryBox && mysteryContent && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.3, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.3, y: 100 }}
                        transition={{ type: 'spring', damping: 16, stiffness: 260 }}
                        className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[9002] w-[220px]"
                    >
                        <div className="bg-[#18181b] border border-yellow-500/40 rounded-3xl p-4 shadow-[0_0_60px_rgba(251,191,36,0.3)]">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-yellow-400/60 uppercase tracking-[0.3em] mb-2">
                                    🎁 Gizli Kutu!
                                </p>

                                <AnimatePresence mode="wait">
                                    {!mysteryOpened ? (
                                        <motion.button
                                            key="closed"
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -2, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            onClick={openMysteryBox}
                                            className="w-16 h-16 mx-auto text-5xl flex items-center justify-center cursor-pointer"
                                        >
                                            📦
                                        </motion.button>
                                    ) : (
                                        <motion.div
                                            key="opened"
                                            initial={{ scale: 0, rotate: 180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className="w-16 h-16 mx-auto text-5xl flex items-center justify-center"
                                        >
                                            {mysteryContent.icon}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!mysteryOpened ? (
                                    <div>
                                        <p className="text-xs font-black text-white mt-2">Tıkla ve Aç!</p>
                                        <p className="text-[8px] text-white/30 font-semibold mt-0.5">Görev ödülü seni bekliyor</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className={`text-base font-black mt-2 ${mysteryContent.color}`}>{mysteryContent.value}</p>
                                        <p className="text-[9px] text-white/50 font-bold">{mysteryContent.label}</p>
                                    </div>
                                )}

                                {!mysteryOpened && (
                                    <button
                                        onClick={() => setShowMysteryBox(false)}
                                        className="mt-2 text-[7px] text-white/20 hover:text-white/40 transition-all uppercase tracking-widest"
                                    >
                                        Kapat
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── LEVEL UP CEREMONY ── */}
            <AnimatePresence>
                {showLevelUp && levelUpData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.3, rotate: -15 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0.3, rotate: 15 }}
                            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                            className="bg-gradient-to-b from-[#1a0a2e] to-[#0d0d14] border border-purple-500/40 rounded-[3rem] p-8 mx-6 text-center shadow-[0_0_100px_rgba(168,85,247,0.4)]"
                        >
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                                className="text-6xl mb-4"
                            >
                                ⭐
                            </motion.div>
                            <p className="text-[9px] font-black text-purple-400/60 uppercase tracking-[0.4em] mb-1">SEVİYE ATLADI!</p>
                            <h2 className="text-4xl font-black text-white mb-2">Lv. {levelUpData.newLevel}</h2>
                            <p className="text-lg font-black text-purple-300 mb-6">{levelUpData.newTitle}</p>

                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="bg-white/5 border border-card-border rounded-2xl px-4 py-2">
                                    <div className="text-xl font-black text-orange-400">{totalPatiPuan.toLocaleString()}</div>
                                    <div className="text-[7px] text-white/30 uppercase tracking-widest">Total PP</div>
                                </div>
                                <div className="bg-white/5 border border-card-border rounded-2xl px-4 py-2">
                                    <div className="text-xl font-black text-yellow-400">+{todayEarned.pp}</div>
                                    <div className="text-[7px] text-white/30 uppercase tracking-widest">Bugün</div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowLevelUp(false)}
                                className="bg-purple-600 hover:bg-purple-500 transition-all px-8 py-3 rounded-2xl text-sm font-black text-white uppercase tracking-wider"
                            >
                                Harika! 🎉
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── ALL QUESTS COMPLETE BANNER ── */}
            <AnimatePresence>
                {showAllComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: -80 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -80 }}
                        transition={{ type: 'spring', damping: 18, stiffness: 250 }}
                        className="fixed top-0 inset-x-0 z-[9050] mx-4 mt-14"
                    >
                        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-3xl p-4 shadow-[0_8px_40px_rgba(16,185,129,0.5)] border border-emerald-400/50">
                            <div className="flex items-center gap-3">
                                <motion.span
                                    animate={{ rotate: [0, -10, 10, -5, 0] }}
                                    transition={{ duration: 0.6, repeat: 2 }}
                                    className="text-3xl shrink-0"
                                >
                                    🏆
                                </motion.span>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-emerald-100/70 uppercase tracking-[0.2em]">Mükemmel!</p>
                                    <p className="text-sm font-black text-white">Tüm Günlük Görevler Tamamlandı!</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-black text-emerald-200">+{todayEarned.pp} PP</span>
                                        <span className="text-emerald-300/40">·</span>
                                        <span className="text-[9px] font-black text-emerald-200">+{todayEarned.xp} XP</span>
                                        <span className="text-emerald-300/40">·</span>
                                        <span className="text-[9px] font-black text-emerald-200">🔥 {currentStreak} Gün</span>
                                    </div>
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                                    className="text-2xl"
                                >
                                    ✨
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── DAILY COUNTDOWN (sadece gece tehlike saatinde) ── */}
            <AnimatePresence>
                {countdown < 3600 && completedCount < totalCount && currentStreak > 2 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-28 right-4 z-[8990]"
                    >
                        <div className="bg-red-500/90 backdrop-blur-md border border-red-400/50 rounded-2xl px-3 py-1.5 shadow-lg shadow-red-500/30">
                            <div className="flex items-center gap-1.5">
                                <motion.div
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-1.5 h-1.5 bg-card rounded-full"
                                />
                                <span className="text-[9px] font-black text-white font-mono">{formatCountdown(countdown)}</span>
                                <span className="text-[7px] text-white/60 uppercase tracking-widest">kaldı</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
