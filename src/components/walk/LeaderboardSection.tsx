"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { useAuth } from "@/context/AuthContext";
import { haptics } from "@/lib/haptics";

// Faz 13 (referans UI'ye göre yeniden inşa edildi, bkz. design-reference/walk-final/):
// önceki sürüm PP-tabanlı, terfi/düşmeli bir "lig" sistemiydi - Baran'ın gönderdiği
// gerçek referans görsel ("4. Sıralama Sayfası") bundan tamamen farklı: kilometre
// bazlı düz bir sıralama + zaman aralığı filtresi (Bu Hafta/Bu Ay/Tüm Zamanlar) +
// sosyal kapsam filtresi (Herkes/Arkadaşlarım/Aynı Şehir). Lig backend'i (pg_cron,
// league_tier vb.) hiç gerçek veri birikmeden geri alındı, bkz. CLAUDE.md 8.8.
type Period = 'week' | 'month' | 'all';
type Scope = 'everyone' | 'friends' | 'city';

const PERIOD_TABS: { id: Period; label: string }[] = [
    { id: 'week', label: 'Bu Hafta' },
    { id: 'month', label: 'Bu Ay' },
    { id: 'all', label: 'Tüm Zamanlar' },
];

// Ekran 12 (Sıralamalar) — design-reference/walk-final/'e göre sekme sırası
// Arkadaşlarım/Aynı Şehir/Herkes (önceden Herkes/Arkadaşlarım/Aynı Şehir'di).
const SCOPE_TABS: { id: Scope; label: string }[] = [
    { id: 'friends', label: 'Arkadaşlarım' },
    { id: 'city', label: 'Aynı Şehir' },
    { id: 'everyone', label: 'Herkes' },
];

interface Row {
    id: string;
    name: string;
    avatar?: string;
    pet: string;
    km: number;
}

export function LeaderboardSection() {
    const { user: currentUser } = useAuth();

    const [period, setPeriod] = useState<Period>('week');
    const [scope, setScope] = useState<Scope>('everyone');
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<Row[]>([]);
    const [myRankFallback, setMyRankFallback] = useState<{ rank: number; km: number } | null>(null);
    const [cityUnavailable, setCityUnavailable] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setCityUnavailable(false);
            try {
                let scopeUserIds: string[] | null = null;
                if (scope === 'friends' && currentUser) {
                    const following = await apiService.getFollowing(currentUser.id);
                    scopeUserIds = Array.from(new Set([currentUser.id, ...following.map(f => f.id)]));
                } else if (scope === 'city' && currentUser) {
                    const cityIds = await apiService.getSameCityUserIds(currentUser.id);
                    if (cityIds.length === 0) {
                        if (!cancelled) { setCityUnavailable(true); setRows([]); setMyRankFallback(null); setLoading(false); }
                        return;
                    }
                    scopeUserIds = cityIds;
                }

                const distanceRows = await apiService.getDistanceLeaderboard(period, scopeUserIds, 100);
                if (cancelled) return;

                const profiles = await apiService.getProfilesByIds(distanceRows.map(r => r.userId));
                if (cancelled) return;
                const profileMap = new Map(profiles.map(p => [p.id, p]));

                const merged: Row[] = distanceRows.map(r => {
                    const p = profileMap.get(r.userId);
                    return {
                        id: r.userId,
                        name: p?.name || 'Gizli Kullanıcı',
                        avatar: p?.avatar,
                        pet: p?.pet || 'Moffi',
                        km: r.totalMeters / 1000,
                    };
                });
                setRows(merged);

                // Baran'ın bulduğu gerçek hata: kullanıcı ilk 100'de değilse, burada
                // HER ZAMAN "0 km" gösteriliyordu — gerçekten o hafta 5km yürümüş olsa
                // bile! Kullanıcının kendi mesafesini SAHTE bir sıfırla değil, aynı
                // güvenli RPC'yi (sadece kendi ID'siyle) tekrar çağırıp GERÇEK toplamını
                // çekerek gösteriyoruz. Rank için de uydurma bir sayı ("ilk 100 + 1")
                // yerine dürüstçe "100+." deniyor — tam sırasını bilmiyoruz, olduğu gibi.
                if (currentUser && !merged.some(r => r.id === currentUser.id)) {
                    const myRow = await apiService.getDistanceLeaderboard(period, [currentUser.id], 1);
                    if (!cancelled) {
                        setMyRankFallback({ rank: merged.length, km: (myRow[0]?.totalMeters || 0) / 1000 });
                    }
                } else {
                    setMyRankFallback(null);
                }
            } catch (err) {
                console.error("Leaderboard fetch error:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [period, scope, currentUser]);

    const filteredRows = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.trim().toLocaleLowerCase('tr-TR');
        return rows.filter(r => r.name.toLocaleLowerCase('tr-TR').includes(q));
    }, [rows, search]);

    const top3 = filteredRows.slice(0, 3);
    const rest = filteredRows.slice(3, 10);
    const isSearching = search.trim().length > 0;

    return (
        <div className="bg-transparent font-sans py-6 relative">

            <div className="flex justify-between items-center px-2 mb-4">
                <h3 className="text-sm font-black text-foreground dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-orange-500" /> Sıralamalar
                </h3>
                <button
                    onClick={() => setShowSearch(s => !s)}
                    className="w-8 h-8 rounded-full bg-card dark:bg-white/5 border border-card-border/50 flex items-center justify-center cursor-pointer"
                >
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                </button>
            </div>

            {showSearch && (
                <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="İsim ara..."
                    className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-card dark:bg-white/5 border border-card-border/50 text-[12px] font-bold text-foreground placeholder:text-slate-400 outline-none"
                />
            )}

            {/* Zaman aralığı filtresi */}
            <div className="flex gap-1.5 mb-2.5">
                {PERIOD_TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => { haptics.tap(); setPeriod(t.id); }}
                        className={cn(
                            "px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer active:scale-95",
                            period === t.id ? "bg-orange-500 text-white" : "bg-card dark:bg-white/5 text-slate-500 border border-card-border/50"
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Sosyal kapsam filtresi */}
            <div className="flex gap-1.5 mb-6">
                {SCOPE_TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => { haptics.tap(); setScope(t.id); }}
                        className={cn(
                            "px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer active:scale-95",
                            scope === t.id ? "bg-slate-900 text-white" : "bg-card dark:bg-white/5 text-slate-500 border border-card-border/50"
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-60">
                    <span className="text-xl animate-bounce">🐾</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sıralama hazırlanıyor...</span>
                </div>
            ) : cityUnavailable ? (
                <div className="text-center py-10 text-gray-500 text-[11px] font-bold px-6 leading-relaxed">
                    Aynı şehirdeki dostları görebilmek için profiline bir konum eklemen yeterli 📍
                </div>
            ) : filteredRows.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs font-bold uppercase tracking-widest px-6 leading-relaxed">
                    {isSearching ? 'Eşleşen kullanıcı bulamadık.' : 'Bu aralıkta henüz kimse yürümemiş — ilk sen ol! 🏃'}
                </div>
            ) : (
                <>
                    {/* --- PODIUM (TOP 3) --- */}
                    {!isSearching && (
                        <>
                        {/* Ekran 12: skor biriminin ne olduğunu açıklayan etiket
                            (design-reference/walk-final/'de podyumun üstünde var,
                            bizde yoktu — "km" rakamının ne temsil ettiği belirsizdi) */}
                        <div className="text-center mb-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aktif Patiler (Toplam Mesafe)</span>
                        </div>
                        <div className="mb-8 flex items-end justify-center gap-3">
                            {top3[1] && (
                                <div className="flex flex-col items-center">
                                    <div className={cn("w-14 h-14 rounded-full border-4 border-slate-300 relative mb-2 shadow-lg", currentUser?.id === top3[1].id ? "border-orange-500" : "")}>
                                        <img src={top3[1].avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[1].id}`} className="w-full h-full rounded-full object-cover bg-gray-100" />
                                        <div className="absolute -bottom-2 inset-x-0 mx-auto w-5 h-5 bg-slate-300 text-white font-bold rounded-full flex items-center justify-center text-[10px] shadow">2</div>
                                    </div>
                                    <div className="text-[10px] font-bold text-foreground dark:text-gray-200 text-center line-clamp-1 w-16">{currentUser?.id === top3[1].id ? 'Sen' : top3[1].name}</div>
                                    <div className="text-[9px] font-black text-orange-600 mt-0.5">{top3[1].km.toFixed(1).replace('.', ',')} km</div>
                                </div>
                            )}

                            {top3[0] && (
                                <div className="flex flex-col items-center -mt-6">
                                    <span className="text-xl mb-1">👑</span>
                                    <div className={cn("w-20 h-20 rounded-full border-4 border-amber-400 relative mb-2 shadow-xl shadow-amber-500/20", currentUser?.id === top3[0].id ? "ring-4 ring-orange-500/30" : "")}>
                                        <img src={top3[0].avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[0].id}`} className="w-full h-full rounded-full object-cover bg-gray-100" />
                                        <div className="absolute -bottom-2.5 inset-x-0 mx-auto w-6 h-6 bg-amber-400 text-white font-bold rounded-full flex items-center justify-center text-[11px] shadow">1</div>
                                    </div>
                                    <div className="text-xs font-black text-foreground dark:text-white text-center line-clamp-1 w-20">{currentUser?.id === top3[0].id ? 'Sen' : top3[0].name}</div>
                                    <div className="text-[10px] font-black text-orange-600 mt-0.5">{top3[0].km.toFixed(1).replace('.', ',')} km</div>
                                </div>
                            )}

                            {top3[2] && (
                                <div className="flex flex-col items-center">
                                    <div className={cn("w-14 h-14 rounded-full border-4 border-orange-300 relative mb-2 shadow-lg", currentUser?.id === top3[2].id ? "border-orange-500" : "")}>
                                        <img src={top3[2].avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[2].id}`} className="w-full h-full rounded-full object-cover bg-gray-100" />
                                        <div className="absolute -bottom-2 inset-x-0 mx-auto w-5 h-5 bg-orange-400 text-white font-bold rounded-full flex items-center justify-center text-[10px] shadow">3</div>
                                    </div>
                                    <div className="text-[10px] font-bold text-foreground dark:text-gray-200 text-center line-clamp-1 w-16">{currentUser?.id === top3[2].id ? 'Sen' : top3[2].name}</div>
                                    <div className="text-[9px] font-black text-orange-600 mt-0.5">{top3[2].km.toFixed(1).replace('.', ',')} km</div>
                                </div>
                            )}
                        </div>
                        </>
                    )}

                    {/* --- LIST --- */}
                    <div className="space-y-2.5">
                        {(isSearching ? filteredRows : rest).map((item, i) => {
                            const isMe = currentUser?.id === item.id;
                            const rank = isSearching ? rows.findIndex(r => r.id === item.id) + 1 : i + 4;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className={cn("bg-card dark:bg-[#1A1A1A] p-3.5 rounded-[1.25rem] flex items-center shadow-sm border transform transition-all",
                                        isMe ? "border-orange-500/50 bg-orange-500/5" : "border-card-border/50 dark:border-white/5"
                                    )}
                                >
                                    <div className="font-bold text-gray-500 dark:text-gray-400 w-6 text-center text-xs">{rank}</div>
                                    <div className="w-10 h-10 rounded-full mx-3">
                                        <img src={item.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.id}`} className="w-full h-full rounded-full object-cover bg-gray-100" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-black text-[11px] text-foreground dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                                            {isMe ? 'Sen' : item.name}
                                            {isMe && <span className="bg-orange-500 text-white text-[7px] px-1.5 py-0.5 rounded">SEN</span>}
                                        </div>
                                        {/* Baran'ın "sıralama tatlı bir yarış gibi hissettirmeli" isteği —
                                            "Sen" satırında pet adı yerine, hemen üstteki GERÇEK kişiyle
                                            aradaki gerçek mesafe farkı gösteriliyor (uydurma bir hedef değil). */}
                                        {isMe && !isSearching && rank > 1 && rows[rank - 2] ? (
                                            <div className="text-[9px] font-bold text-orange-500/80 mt-0.5">
                                                {(rows[rank - 2].km - item.km).toFixed(1).replace('.', ',')} km kaldı — {rows[rank - 2].name}'i geçebilirsin! 🔥
                                            </div>
                                        ) : (
                                            <div className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">{item.pet}</div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-xs text-orange-600">{item.km.toFixed(1).replace('.', ',')} km</div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Kullanıcı ilk 100'de değilse (bu aralıkta hiç yürümemiş olabilir) ayrı, sabit satır.
                        Baran'ın bulduğu gerçek hata: rank uydurmaydı ("ilk 100 + 1"), km her zaman 0
                        gösteriliyordu. Artık gerçek mesafe (yukarıdaki ikinci RPC çağrısından) ve dürüst
                        bir "100+" etiketi — tam sırasını iddia etmiyoruz, olmayan bir kesinlik vermiyoruz. */}
                    {!isSearching && myRankFallback && currentUser && (
                        <div className="mt-4">
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-3.5 flex items-center">
                                <div className="font-black w-9 text-center text-orange-600 text-xs">{myRankFallback.rank}+</div>
                                <div className="w-10 h-10 rounded-full mx-3 overflow-hidden">
                                    <img src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 font-black text-[11px] text-foreground dark:text-white uppercase tracking-wide">Sen</div>
                                <div className="font-black text-xs text-orange-600">{myRankFallback.km.toFixed(1).replace('.', ',')} km</div>
                            </div>
                            {/* Teşvik edici, gerçek veriye dayalı bir mesaj — Baran'ın "sıralama tatlı
                                bir yarış gibi hissettirmeli" isteği. Uydurma bir hedef değil: listede
                                görünen son kişinin GERÇEK mesafesiyle karşılaştırılıyor. */}
                            {rows.length > 0 && rows[rows.length - 1].km > myRankFallback.km && (
                                <p className="text-[10.5px] font-bold text-orange-600/80 text-center mt-2 px-4">
                                    Sıralamaya girmene sadece {(rows[rows.length - 1].km - myRankFallback.km).toFixed(1).replace('.', ',')} km kaldı — hadi bir yürüyüşe çık! 🐾
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
