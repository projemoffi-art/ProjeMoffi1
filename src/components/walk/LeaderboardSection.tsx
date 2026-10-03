"use client";

// Ekran 12 · Sıralamalar (design-reference/walk-final/, v2): zaman sekmesi (Bu Hafta/Bu Ay/Tüm Zamanlar), kapsam sekmesi
// (Arkadaşlarım/Aynı Şehir/Herkes), "Aktif Patiler (Toplam Mesafe)", taçlı podyum, 4–10 listesi ve altta sabit "Sen" satırı.
// Veri: get_distance_leaderboard (yalnızca toplam km, hiçbir rota sızmaz; CLAUDE.md 8.8). PP'li lig sistemi bilerek yok.
// Kullanıcı ilk 10'da değilse kendi gerçek sırası (ilk 100'deyse) ya da "100+" ve gerçek mesafesi gösterilir.

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/social/SocialUI";
import { SegmentTabs, WalkCard } from "@/components/walk/WalkUI";

type Period = 'week' | 'month' | 'all';
type Scope = 'everyone' | 'friends' | 'city';

const PERIOD_TABS: { id: Period; label: string }[] = [
    { id: 'week', label: 'Bu Hafta' },
    { id: 'month', label: 'Bu Ay' },
    { id: 'all', label: 'Tüm Zamanlar' },
];
// Referans sırası. Varsayılan "Herkes": yeni kullanıcının arkadaş listesi boşken boş bir sıralama görmesin.
const SCOPE_TABS: { id: Scope; label: string }[] = [
    { id: 'friends', label: 'Arkadaşlarım' },
    { id: 'city', label: 'Aynı Şehir' },
    { id: 'everyone', label: 'Herkes' },
];

interface Row { id: string; name: string; avatar?: string; pet: string; km: number }
interface Board { key: string; rows: Row[]; me: { rank: number | null; km: number } | null; cityUnavailable: boolean }

const km = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

async function loadBoard(period: Period, scope: Scope, userId: string | null): Promise<Omit<Board, 'key'>> {
    let scopeUserIds: string[] | null = null;
    if (scope === 'friends' && userId) {
        const following = await apiService.getFollowing(userId);
        scopeUserIds = Array.from(new Set([userId, ...following.map(f => f.id)]));
    } else if (scope === 'city' && userId) {
        const cityIds = await apiService.getSameCityUserIds(userId);
        if (cityIds.length === 0) return { rows: [], me: null, cityUnavailable: true };
        scopeUserIds = cityIds;
    }
    const distanceRows = await apiService.getDistanceLeaderboard(period, scopeUserIds, 100);
    const profiles = await apiService.getProfilesByIds(distanceRows.map(r => r.userId));
    const byId = new Map(profiles.map(p => [p.id, p]));
    const rows: Row[] = distanceRows.map(r => {
        const p = byId.get(r.userId);
        return { id: r.userId, name: p?.name || 'Gizli Kullanıcı', avatar: p?.avatar, pet: p?.pet || 'Moffi', km: r.totalMeters / 1000 };
    });
    let me: Board['me'] = null;
    if (userId) {
        const idx = rows.findIndex(r => r.id === userId);
        if (idx >= 0) me = { rank: idx + 1, km: rows[idx].km };
        else {
            // İlk 100'de değil: gerçek mesafesi ayrıca okunur, sırası uydurulmaz ("100+")
            const mine = await apiService.getDistanceLeaderboard(period, [userId], 1);
            me = { rank: null, km: (mine[0]?.totalMeters || 0) / 1000 };
        }
    }
    return { rows, me, cityUnavailable: false };
}

export function LeaderboardSection() {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const [period, setPeriod] = useState<Period>('week');
    const [scope, setScope] = useState<Scope>('everyone');
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [board, setBoard] = useState<Board | null>(null);
    const key = `${period}:${scope}:${userId}`;

    useEffect(() => {
        let alive = true;
        loadBoard(period, scope, userId)
            .then(b => alive && setBoard({ key, ...b }))
            .catch(err => { console.error('Sıralama yüklenemedi:', err); if (alive) setBoard({ key, rows: [], me: null, cityUnavailable: false }); });
        return () => { alive = false; };
    }, [period, scope, userId, key]);

    const current = board?.key === key ? board : null;
    const rows = useMemo(() => current?.rows ?? [], [current]);
    const filtered = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr-TR');
        return q ? rows.filter(r => r.name.toLocaleLowerCase('tr-TR').includes(q)) : rows;
    }, [rows, search]);
    const searching = search.trim().length > 0;
    const me = current?.me ?? null;
    const meInTop10 = !!me?.rank && me.rank <= 10;
    const ahead = me?.rank && me.rank > 1 ? rows[me.rank - 2] : null;
    const lastListed = rows.length ? rows[rows.length - 1] : null;

    return (
        <div className="space-y-3">
            <SegmentTabs tabs={PERIOD_TABS} value={period} onChange={setPeriod} />
            <div className="flex items-center gap-2">
                {SCOPE_TABS.map(t => (
                    <button key={t.id} type="button" onClick={() => setScope(t.id)}
                        className={cn('h-8 px-3.5 rounded-full text-[12.5px] font-bold border', scope === t.id ? 'bg-accent text-white border-accent' : 'bg-card text-secondary border-card-border')}>
                        {t.label}
                    </button>
                ))}
                <button type="button" onClick={() => setShowSearch(s => !s)} aria-label="Kişi ara" aria-pressed={showSearch}
                    className={cn('ml-auto w-8 h-8 rounded-full border flex items-center justify-center shrink-0', showSearch ? 'bg-foreground text-background border-foreground' : 'bg-card border-card-border text-secondary')}>
                    <Search className="w-4 h-4" />
                </button>
            </div>
            {showSearch && (
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim ara"
                    className="w-full h-11 px-4 rounded-2xl bg-card border border-card-border text-[14px] font-semibold text-foreground outline-none focus:border-accent" />
            )}

            {!current ? (
                <div className="space-y-2 pt-2" aria-busy>{[0, 1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-card-border/50 animate-pulse" />)}</div>
            ) : current.cityUnavailable ? (
                <WalkCard className="p-5 text-center text-[13.5px] font-semibold text-secondary">Aynı şehirdeki dostları görmek için profiline şehrini ekle 📍</WalkCard>
            ) : filtered.length === 0 ? (
                <WalkCard className="p-5 text-center text-[13.5px] font-semibold text-secondary">
                    {searching ? 'Eşleşen kullanıcı yok.' : scope === 'friends' ? 'Arkadaşların bu aralıkta henüz yürümemiş. İlk sen ol! 🐾' : 'Bu aralıkta henüz kimse yürümemiş. İlk sen ol! 🐾'}
                </WalkCard>
            ) : (
                <>
                    {!searching && (
                        <WalkCard className="pt-4 pb-5 px-3">
                            <p className="text-center text-[12px] font-bold text-secondary mb-3">Aktif Patiler (Toplam Mesafe)</p>
                            <div className="flex items-end justify-center gap-3">
                                {[filtered[1], filtered[0], filtered[2]].map((r, i) => r && (
                                    <Podium key={r.id} row={r} place={i === 1 ? 1 : i === 0 ? 2 : 3} isMe={r.id === userId} />
                                ))}
                            </div>
                        </WalkCard>
                    )}

                    {(searching ? filtered : filtered.slice(3, 10)).length > 0 && (
                        <WalkCard className="divide-y divide-card-border overflow-hidden">
                            {(searching ? filtered : filtered.slice(3, 10)).map(r => (
                                <ListRow key={r.id} row={r} rank={rows.findIndex(x => x.id === r.id) + 1} isMe={r.id === userId} />
                            ))}
                        </WalkCard>
                    )}

                    {!searching && me && !meInTop10 && user && (
                        <div className="sticky bottom-[calc(108px+env(safe-area-inset-bottom,0px))]">
                            <div className="rounded-2xl bg-accent/10 border border-accent/30 px-3 py-3 flex items-center gap-3">
                                <span className="w-9 text-center text-[14px] font-black text-accent">{me.rank ?? '100+'}</span>
                                <Avatar src={user.avatar} name={user.name || 'Sen'} className="w-10 h-10 text-sm" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-[14px] font-extrabold">Sen</span>
                                    {ahead ? (
                                        <span className="block text-[11.5px] font-semibold text-accent truncate">{km(ahead.km - me.km)} km kaldı, {ahead.name} hemen önünde</span>
                                    ) : !me.rank && lastListed && lastListed.km > me.km ? (
                                        <span className="block text-[11.5px] font-semibold text-accent truncate">Listeye girmene {km(lastListed.km - me.km)} km kaldı</span>
                                    ) : null}
                                </span>
                                <span className="text-[14px] font-black text-accent">{km(me.km)} km</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function Podium({ row, place, isMe }: { row: Row; place: 1 | 2 | 3; isMe: boolean }) {
    const first = place === 1;
    return (
        <div className={cn('flex flex-col items-center w-24', first && '-mt-4')}>
            {first && <span className="text-[22px] leading-none mb-1" aria-hidden>👑</span>}
            <div className="relative">
                <Avatar src={row.avatar} name={row.name}
                    className={cn('border-4', first ? 'w-20 h-20 text-2xl border-amber-400' : 'w-16 h-16 text-xl', place === 2 && 'border-zinc-300', place === 3 && 'border-orange-300', isMe && 'ring-4 ring-accent/30')} />
                <span className={cn('absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full text-white text-[11px] font-black flex items-center justify-center shadow',
                    first ? 'bg-amber-400' : place === 2 ? 'bg-zinc-400' : 'bg-orange-400')}>{place}</span>
            </div>
            <span className={cn('mt-3 text-center font-extrabold truncate w-full', first ? 'text-[15px]' : 'text-[13px]')}>{isMe ? 'Sen' : row.name}</span>
            <span className={cn('font-black text-accent', first ? 'text-[14px]' : 'text-[12.5px]')}>{km(row.km)} km</span>
        </div>
    );
}

function ListRow({ row, rank, isMe }: { row: Row; rank: number; isMe: boolean }) {
    return (
        <div className={cn('flex items-center gap-3 px-3 py-3', isMe && 'bg-accent/5')}>
            <span className="w-7 text-center text-[13px] font-bold text-secondary">{rank}</span>
            <Avatar src={row.avatar} name={row.name} className="w-10 h-10 text-sm" />
            <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-extrabold truncate">{isMe ? 'Sen' : row.name}</span>
                <span className="block text-[11.5px] font-semibold text-secondary truncate">{row.pet}</span>
            </span>
            <span className="text-[13.5px] font-black">{km(row.km)} km</span>
        </div>
    );
}
