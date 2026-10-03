'use client';

// Oyun Merkezi + Görev Merkezi (home-final referansı: yan yana iki kart).
// Hayvanın seviyesi ve bugünkü görevler Görev Merkezi'nden (sunucu, quest_center); PawCoin ve seri günlük ilerlemeden. Sabit sayı yok.

import { useRouter } from 'next/navigation';
import { ArrowRight, Award, Crown, Gamepad2 } from 'lucide-react';
import { useDailyProgress } from '@/context/DailyProgressContext';
import { usePet } from '@/context/PetContext';
import { useQuestCenter } from '@/hooks/useQuestCenter';
import { haptics } from '@/native';

const GAME_COUNT = 4; // /game: Mama Yakala, Hafıza, Zıpla, Moffi Koş

export function PlayCards() {
    const router = useRouter();
    const { totalPatiPuan, currentStreak } = useDailyProgress();
    const { activePet } = usePet();
    const { data } = useQuestCenter(activePet?.id ?? null);
    const lv = data?.pet.level;
    const levelPercent = lv ? Math.min(100, Math.round(((lv.xp - lv.level_start) / Math.max(1, lv.level_next - lv.level_start)) * 100)) : 0;
    const doneCount = data?.done ?? 0;
    const totalCount = data?.total ?? 0;
    const questPercent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

    const go = (path: string) => { haptics.tap(); router.push(path); };

    return (
        <section className="grid gap-3 -mx-1" style={{ gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)' }}>
            <button
                type="button"
                onClick={() => go('/game')}
                className="relative min-h-[156px] rounded-[22px] overflow-hidden bg-[#1D2233] text-left p-3 flex flex-col justify-between active:scale-[0.98] transition-transform shadow-[0_14px_30px_-16px_rgba(32,27,22,0.5)]"
            >
                <img src="/images/game-center.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: '60% 62%' }} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/15 to-black/40" />
                <div className="relative" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.55)' }}>
                    <div className="flex items-center gap-1.5 text-white text-[15px] font-bold">
                        <Gamepad2 className="w-[18px] h-[18px]" /> Oyun Merkezi
                    </div>
                    <p className="text-white/85 text-[12px] font-semibold mt-0.5">{GAME_COUNT} oyun seni bekliyor</p>
                </div>
                <div className="relative glass-photo rounded-[16px] px-2.5 py-2">
                    <div className="flex items-center justify-between text-[12px] font-bold mb-1.5">
                        <span className="text-white">{lv ? `${activePet?.name ?? ''} · Sv. ${lv.level}` : 'Oyna, kazan'}</span>
                        <span className="text-[#F0C94E] flex items-center gap-1"><Crown className="w-3.5 h-3.5" /> {totalPatiPuan.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/25 overflow-hidden">
                            <div className="h-full rounded-full bg-[#8FD14F]" style={{ width: `${levelPercent}%` }} />
                        </div>
                        <span className="w-8 h-8 rounded-full bg-white/95 flex items-center justify-center shrink-0">
                            <ArrowRight className="w-4 h-4 text-[#201B16]" strokeWidth={2.5} />
                        </span>
                    </div>
                </div>
            </button>

            <button
                type="button"
                onClick={() => go('/quests')}
                className="min-h-[150px] rounded-[22px] card-premium text-left p-3.5 flex flex-col justify-between active:scale-[0.98] transition-transform"
            >
                <div>
                    <div className="flex items-center gap-1.5 text-foreground text-[15px] font-bold">
                        <Award className="w-[18px] h-[18px] text-accent" /> Görev Merkezi
                    </div>
                    <p className="text-secondary text-[12px] font-semibold mt-0.5 leading-snug">
                        {totalCount > 0 ? `Bugün ${doneCount}/${totalCount} görev` : activePet ? 'Görevlerin hazırlanıyor' : 'Görevler dostuna göre çıkar'}
                    </p>
                </div>
                <div>
                    <p className="text-accent text-[12.5px] font-extrabold mb-2 whitespace-nowrap">🔥 {currentStreak} günlük seri</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-foreground/[0.08] overflow-hidden">
                            <div className="h-full rounded-full bg-[#8FD14F]" style={{ width: `${questPercent}%` }} />
                        </div>
                        <span className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center shrink-0">
                            <ArrowRight className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                        </span>
                    </div>
                </div>
            </button>
        </section>
    );
}
