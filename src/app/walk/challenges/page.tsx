"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X, Check, Users, Clock } from "lucide-react";
// CLAUDE.md 5.6: Turbopack + OneDrive bazı lucide-react ikonlarını okurken
// panic veriyor (bilinen örnekler: Soup, HelpCircle) — "Swords" da bu listeye
// eklendi, koda hiç import edilmedi, yerine emoji kullanıldı.
import { cn } from "@/lib/utils";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";
import type { SocialChallenge } from "@/services/types";
import { haptics } from "@/lib/haptics";

// Faz 18 (Görev sistemi denetimi): "Meydan Okumalar" — Faz 11'de referans
// görsel elde değilken Faz 18'e ertelenmişti (bkz. CLAUDE.md 8.0). Görsel geri
// gelince, referansın 3 kartının da (aylık toplam mesafe / haftalık farklı
// yer / kalıcı farklı bölge) tam bir coğrafi kümeleme altyapısı olmadan,
// gerçek walkHistory GPS verisinden hesaplanabildiği görüldü — bkz.
// QuestEngineContext.tsx'teki `challenges` (haversine tabanlı basit kümeleme).
//
// Faz 24 — Baran'ın isteği: meydan okumalar sadece bireysel/global hedeflerle
// sınırlı kalmasın, GERÇEK KİŞİLERLE de yapılabilsin (Apple Fitness "Activity
// Competition" + Duolingo "Friends Quest" desenlerinden esinlenildi). Yeni
// "Sosyal" sekmesi: Düello (1v1 yarış) ve Takım Görevi (ortak hedef). Sadece
// GERÇEK karşılıklı takip edilen kişiler davet edilebiliyor (bkz.
// create_social_challenge RPC'sindeki mutual-follow kontrolü). Kullanıcılar
// arasında HİÇBİR PP transferi yok — her taraf sadece kendi performansından
// kendi PP'sini kazanıyor (bkz. CLAUDE.md Faz 24).

type MainTab = 'individual' | 'social';
type IndividualSubTab = 'active' | 'completed';

const MAIN_TABS: { key: MainTab; label: string }[] = [
    { key: 'individual', label: 'Bireysel' },
    { key: 'social', label: 'Sosyal' },
];

interface Friend { id: string; name: string; avatar?: string }
interface ResolvedChallenge extends SocialChallenge {
    creatorName: string;
    partnerName: string;
    creatorKm: number;
    partnerKm: number;
}

function formatTimeLeft(endsAt: string | null): string {
    if (!endsAt) return '';
    const ms = new Date(endsAt).getTime() - Date.now();
    if (ms <= 0) return 'süre doldu';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 24) return `${hours} saat kaldı`;
    return `${Math.floor(hours / 24)} gün kaldı`;
}

export default function ChallengesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { challenges } = useQuestEngine();
    const [mainTab, setMainTab] = useState<MainTab>('individual');
    const [subTab, setSubTab] = useState<IndividualSubTab>('active');

    const [social, setSocial] = useState<ResolvedChallenge[]>([]);
    const [loadingSocial, setLoadingSocial] = useState(true);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [responding, setResponding] = useState<string | null>(null);

    const loadSocial = async () => {
        if (!user) return;
        setLoadingSocial(true);
        const [raw, mutualFriends] = await Promise.all([
            apiService.getSocialChallenges(user.id),
            apiService.getMutualFollows(user.id),
        ]);
        setFriends(mutualFriends);

        // Süresi dolmuş ama hâlâ 'active' olan meydan okumaları sonuçlandır
        // (bkz. finalize_social_challenge RPC — idempotent, kim açarsa açsın
        // güvenle çağrılabilir; gerçek bir cron/arka plan işi yok, bilinçli
        // olarak "görüntülerken sonuçlandır" deseni kullanıldı).
        const now = Date.now();
        const dueIds = raw.filter(c => c.status === 'active' && c.endsAt && new Date(c.endsAt).getTime() < now).map(c => c.id);
        if (dueIds.length > 0) {
            await Promise.all(dueIds.map(id => apiService.finalizeSocialChallengeIfDue(id).catch(() => {})));
        }
        const fresh = dueIds.length > 0 ? await apiService.getSocialChallenges(user.id) : raw;

        const otherIds = Array.from(new Set(fresh.flatMap(c => [c.creatorId, c.partnerId])));
        const profiles = otherIds.length > 0 ? await apiService.getProfilesByIds(otherIds) : [];
        const nameMap = new Map(profiles.map(p => [p.id, p.name]));

        const resolved = await Promise.all(fresh.map(async c => {
            const progress = (c.status === 'active' || c.status === 'completed')
                ? await apiService.getSocialChallengeProgress(c.id).catch(() => ({ creatorKm: 0, partnerKm: 0 }))
                : { creatorKm: 0, partnerKm: 0 };
            return {
                ...c,
                creatorName: nameMap.get(c.creatorId) || 'Moffi Kullanıcısı',
                partnerName: nameMap.get(c.partnerId) || 'Moffi Kullanıcısı',
                creatorKm: progress.creatorKm,
                partnerKm: progress.partnerKm,
            };
        }));
        setSocial(resolved);
        setLoadingSocial(false);
    };

    useEffect(() => { loadSocial(); }, [user]);

    const handleRespond = async (challengeId: string, accept: boolean) => {
        setResponding(challengeId);
        haptics.tap();
        try {
            await apiService.respondSocialChallenge(challengeId, accept);
            haptics.success();
            await loadSocial();
        } catch (err: any) {
            haptics.warn();
            window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: err?.message || 'İşlem başarısız', icon: 'AlertTriangle', color: 'text-red-400' } }));
        } finally {
            setResponding(null);
        }
    };

    const filtered = challenges.filter(c => {
        if (subTab === 'active') return c.status === 'active';
        return c.status === 'completed';
    });

    const invites = social.filter(c => c.status === 'pending' && c.partnerId === user?.id);
    const outgoing = social.filter(c => c.status === 'pending' && c.creatorId === user?.id);
    const activeSocial = social.filter(c => c.status === 'active');
    const finishedSocial = social.filter(c => c.status === 'completed' || c.status === 'declined');

    return (
        <main className="min-h-screen max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans flex flex-col border-x border-card-border">
            <div className="bg-card px-6 py-6 border-b border-card-border sticky top-0 z-20">
                <div className="flex items-center justify-between mb-5">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-gray-100 transition active:scale-90">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground font-sans">Meydan Okumalar</h1>
                    {mainTab === 'social' ? (
                        <button onClick={() => { haptics.tap(); setShowCreate(true); }} className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                            <Plus className="w-5 h-5 text-white" />
                        </button>
                    ) : <div className="w-10" />}
                </div>

                <div className="flex gap-1.5 mb-3">
                    {MAIN_TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => { haptics.tap(); setMainTab(t.key); }}
                            className={cn(
                                "flex-1 px-3.5 py-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer active:scale-95",
                                mainTab === t.key ? "bg-slate-900 text-white" : "bg-gray-100 dark:bg-white/5 text-slate-500 hover:bg-gray-200 dark:hover:bg-white/10"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {mainTab === 'individual' && (
                    <div className="flex gap-1.5">
                        {(['active', 'completed'] as IndividualSubTab[]).map(k => (
                            <button
                                key={k}
                                onClick={() => { haptics.tap(); setSubTab(k); }}
                                className={cn(
                                    "px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-0 cursor-pointer active:scale-95",
                                    subTab === k ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-white/5 text-slate-500 hover:bg-gray-200 dark:hover:bg-white/10"
                                )}
                            >
                                {k === 'active' ? 'Aktif' : 'Tamamlanan'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3.5">
                {mainTab === 'individual' ? (
                    filtered.length === 0 ? (
                        <div className="text-center py-16 px-6">
                            <span className="text-2xl block mb-2">{subTab === 'completed' ? '🏔️' : '🌱'}</span>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                {subTab === 'completed'
                                    ? 'Henüz tamamlanmış bir meydan okuman yok — Aktif sekmesinden başlayabilirsin.'
                                    : 'Şu an aktif bir meydan okuma yok.'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((c, i) => {
                            const percent = Math.round((c.current / c.target) * 100);
                            return (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: i * 0.06 }}
                                    className={cn(
                                        "bg-card rounded-2xl p-4 border shadow-moffi-card",
                                        c.status === 'completed' ? "border-emerald-200 dark:border-emerald-500/20" : "border-card-border"
                                    )}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="text-2xl leading-none">{c.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[13px] font-black text-foreground leading-tight">{c.title}</h3>
                                            <p className="text-[10.5px] font-bold text-slate-400 mt-0.5 leading-snug">{c.description}</p>
                                        </div>
                                        <span className="shrink-0 text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
                                            {c.rewardLabel}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-1.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(3, percent)}%` }}
                                            transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.06 + 0.1 }}
                                            className={cn("h-full rounded-full", c.status === 'completed' ? "bg-emerald-500" : "bg-orange-500")}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400">
                                        {c.status === 'completed' ? '🎉 Tamamlandı!' : `${c.current.toFixed(c.unit === 'km' ? 1 : 0)}/${c.target} ${c.unit}`}
                                    </span>
                                </motion.div>
                            );
                        })
                    )
                ) : loadingSocial ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                        <span className="text-2xl animate-bounce">🐾</span>
                        <span className="text-xs font-bold uppercase tracking-widest">Yükleniyor...</span>
                    </div>
                ) : (
                    <>
                        {invites.length === 0 && outgoing.length === 0 && activeSocial.length === 0 && finishedSocial.length === 0 && (
                            <div className="text-center py-16 px-6">
                                <span className="text-2xl block mb-2">🤝</span>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                    Henüz bir arkadaşını meydan okumaya davet etmedin.<br />Sağ üstteki + ile başla!
                                </p>
                            </div>
                        )}

                        {invites.length > 0 && (
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Davetler</span>
                                <div className="space-y-2.5">
                                    {invites.map(c => (
                                        <div key={c.id} className="bg-card rounded-2xl p-4 border border-orange-200 dark:border-orange-500/20 shadow-moffi-card">
                                            <div className="flex items-center gap-2 mb-2">
                                                {c.mode === 'duel' ? <span className="text-base leading-none">⚔️</span> : <Users className="w-4 h-4 text-orange-500" />}
                                                <span className="text-[12px] font-black text-foreground">
                                                    {c.creatorName} seni {c.mode === 'duel' ? 'bir düelloya' : 'bir takım görevine'} davet etti
                                                </span>
                                            </div>
                                            <p className="text-[10.5px] font-bold text-slate-400 mb-3">
                                                {c.mode === 'duel' ? `${c.durationDays} gün — kim daha çok km yürüyecek?` : `${c.durationDays} gün içinde birlikte ${c.targetKm} km`}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={responding === c.id}
                                                    onClick={() => handleRespond(c.id, true)}
                                                    className="flex-1 h-10 rounded-xl bg-orange-500 text-white text-[11px] font-black uppercase tracking-wide disabled:opacity-60"
                                                >
                                                    Kabul Et
                                                </button>
                                                <button
                                                    disabled={responding === c.id}
                                                    onClick={() => handleRespond(c.id, false)}
                                                    className="flex-1 h-10 rounded-xl bg-gray-100 dark:bg-white/5 text-slate-500 text-[11px] font-black uppercase tracking-wide disabled:opacity-60"
                                                >
                                                    Reddet
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {outgoing.length > 0 && (
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Yanıt Bekleyen</span>
                                <div className="space-y-2.5">
                                    {outgoing.map(c => (
                                        <div key={c.id} className="bg-card rounded-2xl p-3.5 border border-card-border shadow-moffi-card flex items-center gap-2.5">
                                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="text-[11px] font-bold text-slate-500">
                                                {c.partnerName}'in yanıtı bekleniyor ({c.mode === 'duel' ? 'Düello' : 'Takım Görevi'})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSocial.length > 0 && (
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Aktif</span>
                                <div className="space-y-2.5">
                                    {activeSocial.map(c => {
                                        const isCreator = c.creatorId === user?.id;
                                        const myKm = isCreator ? c.creatorKm : c.partnerKm;
                                        const otherKm = isCreator ? c.partnerKm : c.creatorKm;
                                        const otherName = isCreator ? c.partnerName : c.creatorName;
                                        const total = myKm + otherKm;
                                        const myPercent = total > 0 ? (myKm / total) * 100 : 50;
                                        return (
                                            <div key={c.id} className="bg-card rounded-2xl p-4 border border-card-border shadow-moffi-card">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        {c.mode === 'duel' ? <span className="text-base leading-none">⚔️</span> : <Users className="w-4 h-4 text-emerald-500" />}
                                                        <span className="text-[12px] font-black text-foreground">{c.mode === 'duel' ? `Düello — ${otherName}` : `Takım Görevi — ${otherName}`}</span>
                                                    </div>
                                                    <span className="text-[9.5px] font-black text-slate-400">{formatTimeLeft(c.endsAt)}</span>
                                                </div>
                                                {c.mode === 'duel' ? (
                                                    <>
                                                        <div className="flex items-center justify-between text-[10px] font-black mb-1">
                                                            <span className="text-orange-600">Sen · {myKm.toFixed(1)} km</span>
                                                            <span className="text-slate-400">{otherName} · {otherKm.toFixed(1)} km</span>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${myPercent}%` }} transition={{ duration: 0.6 }} className="h-full bg-orange-500" />
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${100 - myPercent}%` }} transition={{ duration: 0.6 }} className="h-full bg-slate-300 dark:bg-white/20" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-1.5">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (total / (c.targetKm || 1)) * 100)}%` }} transition={{ duration: 0.6 }} className="h-full bg-emerald-500 rounded-full" />
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400">{total.toFixed(1)}/{c.targetKm} km (birlikte)</span>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {finishedSocial.length > 0 && (
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Geçmiş</span>
                                <div className="space-y-2.5">
                                    {finishedSocial.map(c => {
                                        const otherName = c.creatorId === user?.id ? c.partnerName : c.creatorName;
                                        const iWon = c.status === 'completed' && c.mode === 'duel' && c.winnerId === user?.id;
                                        const declined = c.status === 'declined';
                                        return (
                                            <div key={c.id} className="bg-card rounded-2xl p-3.5 border border-card-border shadow-moffi-card flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-slate-500">
                                                    {otherName} · {c.mode === 'duel' ? 'Düello' : 'Takım Görevi'}
                                                </span>
                                                <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full",
                                                    declined ? "text-slate-400 bg-slate-100 dark:bg-white/5" :
                                                    c.mode === 'duel' ? (iWon ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : c.winnerId ? "text-slate-400 bg-slate-100 dark:bg-white/5" : "text-amber-600 bg-amber-50 dark:bg-amber-500/10") :
                                                    "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                                                )}>
                                                    {declined ? 'Reddedildi' : c.mode === 'duel' ? (c.winnerId ? (iWon ? 'Kazandın 🏆' : 'Kaybettin') : 'Berabere') : 'Tamamlandı 🎉'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <CreateChallengeSheet
                open={showCreate}
                onClose={() => setShowCreate(false)}
                friends={friends}
                onCreated={() => { setShowCreate(false); loadSocial(); }}
            />
        </main>
    );
}

function CreateChallengeSheet({ open, onClose, friends, onCreated }: { open: boolean; onClose: () => void; friends: Friend[]; onCreated: () => void }) {
    const [mode, setMode] = useState<'duel' | 'team'>('duel');
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [duration, setDuration] = useState(7);
    const [targetKm, setTargetKm] = useState(20);
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!partnerId) return;
        setCreating(true);
        try {
            await apiService.createSocialChallenge(partnerId, mode, duration, mode === 'team' ? targetKm : undefined);
            haptics.success();
            window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: '📨 Davet gönderildi!', icon: 'Send', color: 'text-emerald-400' } }));
            onCreated();
            setPartnerId(null);
        } catch (err: any) {
            haptics.warn();
            window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: err?.message || 'Davet gönderilemedi', icon: 'AlertTriangle', color: 'text-red-400' } }));
        } finally {
            setCreating(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={onClose}>
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="bg-card w-full max-w-md rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-black text-foreground">Yeni Meydan Okuma</h3>
                            <button onClick={onClose} className="w-8 h-8 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center active:scale-90">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Mod</span>
                        <div className="grid grid-cols-2 gap-2.5 mb-5">
                            <button onClick={() => setMode('duel')} className={cn("p-3.5 rounded-2xl border-2 text-left", mode === 'duel' ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10" : "border-card-border")}>
                                <span className="text-xl leading-none block mb-1.5">⚔️</span>
                                <span className="text-[11px] font-black text-foreground block">Düello</span>
                                <span className="text-[9px] font-bold text-slate-400">Kim daha çok km yürüyecek?</span>
                            </button>
                            <button onClick={() => setMode('team')} className={cn("p-3.5 rounded-2xl border-2 text-left", mode === 'team' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-card-border")}>
                                <Users className="w-5 h-5 text-emerald-500 mb-1.5" />
                                <span className="text-[11px] font-black text-foreground block">Takım Görevi</span>
                                <span className="text-[9px] font-bold text-slate-400">Birlikte ortak hedefe ulaşın</span>
                            </button>
                        </div>

                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Kime meydan okuyorsun?</span>
                        {friends.length === 0 ? (
                            <p className="text-[11px] font-bold text-slate-400 mb-5 leading-relaxed">
                                Henüz karşılıklı takipleştiğin kimse yok — bir arkadaşınla karşılıklı takipleşince burada görünecek.
                            </p>
                        ) : (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
                                {friends.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setPartnerId(f.id)}
                                        className={cn("shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2", partnerId === f.id ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10" : "border-transparent")}
                                    >
                                        <img src={f.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.id}`} className="w-12 h-12 rounded-full object-cover bg-gray-100" alt={f.name} />
                                        <span className="text-[9px] font-bold text-foreground max-w-[64px] truncate">{f.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Süre</span>
                        <div className="flex gap-2 mb-5">
                            {[3, 7, 14].map(d => (
                                <button key={d} onClick={() => setDuration(d)} className={cn("flex-1 h-10 rounded-xl text-[11px] font-black", duration === d ? "bg-slate-900 text-white" : "bg-gray-100 dark:bg-white/5 text-slate-500")}>
                                    {d} gün
                                </button>
                            ))}
                        </div>

                        {mode === 'team' && (
                            <>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Ortak Hedef (km)</span>
                                <div className="flex items-center gap-3 mb-6">
                                    <button onClick={() => setTargetKm(k => Math.max(5, k - 5))} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 text-slate-500 font-black">−</button>
                                    <span className="flex-1 text-center text-base font-black text-foreground">{targetKm} km</span>
                                    <button onClick={() => setTargetKm(k => Math.min(200, k + 5))} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 text-slate-500 font-black">+</button>
                                </div>
                            </>
                        )}

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            disabled={!partnerId || creating}
                            onClick={handleCreate}
                            className="w-full h-12 rounded-full bg-orange-500 text-white font-black text-[12px] uppercase tracking-widest disabled:opacity-40"
                        >
                            {creating ? 'Gönderiliyor...' : 'Davet Gönder'}
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
