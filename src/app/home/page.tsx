'use client';

// Ana sayfa (design-reference/home-final). Bölümler src/components/home altında; bu dosya yalnızca sırayı,
// veri bağlantılarını ve ilk kurulum yönlendirmesini tutar.
// Sıra (2026-10-03, Baran onaylı): üst alan → hikâyeler → (doğum günü) → bugünkü yürüyüş → hızlı erişim →
// hatırlatmalar → oyun/görev → öneriler → ilham.

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePet } from '@/context/PetContext';
import { useNotifications } from '@/context/NotificationContext';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useStories } from '@/hooks/useStories';
import { usePetShop } from '@/hooks/usePetShop';
import { useUpcomingCare } from '@/hooks/useUpcomingCare';
import { useWalk } from '@/hooks/useWalk';
import { useQuestEngine } from '@/context/QuestEngineContext';
import { useWeather } from '@/context/WeatherContext';
import { useDailyNote } from '@/components/home/dailyNote';
import { BirthdayCard } from '@/components/home/BirthdayCard';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeStories } from '@/components/home/HomeStories';
import { WalkTodayCard } from '@/components/home/WalkTodayCard';
import { QuickAccess } from '@/components/home/QuickAccess';
import { HomeReminders } from '@/components/home/HomeReminders';
import { PlayCards } from '@/components/home/PlayCards';
import { HomeRecommendations } from '@/components/home/HomeRecommendations';
import { HomeInspiration } from '@/components/home/HomeInspiration';
import { AddPetFlow } from '@/components/home/AddPetFlow';
import { Skeleton, baloo, nunito } from '@/components/home/homeUI';

function HomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { pets, activePet, switchPet, isLoading: petsLoading, isInitialized } = usePet();
    const { unreadCount } = useNotifications();
    const { products, cartCount, addToCart } = usePetShop();
    const { items: careItems, loaded: careLoaded } = useUpcomingCare(pets, user?.id);
    const { storyGroups, inspiration, activeLostCount } = useStories(careItems);
    const [addPetOpen, setAddPetOpen] = useState(false);
    const { history } = useWalk();
    const { todayDistanceKm, dailyGoal } = useQuestEngine();
    const { weather } = useWeather();

    // Hiç hayvanı olmayan ve ilk kurulumu bitirmemiş kullanıcı kurulum akışına gider (design-reference/onboarding-final).
    // Kurulumu atlayan/bitiren kullanıcıya pencere zorla açılmaz; boş durum kartındaki düğmeyle eklenir.
    const { loading: onboardingLoading, completed: onboardingCompleted } = useOnboardingStatus(user?.id);
    useEffect(() => {
        if (isInitialized && !petsLoading && !onboardingLoading && pets.length === 0 && !onboardingCompleted) {
            router.replace('/onboarding');
        }
    }, [isInitialized, petsLoading, onboardingLoading, onboardingCompleted, pets.length, router]);

    // Başka ekranlardan "/home?openWalk=true" ile gelinince yürüyüş paneli açılır.
    const openedWalk = useRef(false);
    useEffect(() => {
        if (searchParams.get('openWalk') === 'true' && !openedWalk.current) {
            openedWalk.current = true;
            window.dispatchEvent(new CustomEvent('open-walk-panel'));
        }
    }, [searchParams]);

    const activePetObj = activePet || pets[0] || null;
    const hasNoPets = !petsLoading && pets.length === 0;
    const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'Dostum';
    const suggested = useMemo(() => products.filter(p => p.inStock).slice(0, 6), [products]);

    // Günün notu: önce kişiye özel durum (sağlık, hava, yürüyüş), yoksa günlük bakım bilgisi.
    const lastWalkAt = useMemo(() => history.reduce((max, w) => Math.max(max, new Date(w.ended_at || w.started_at || 0).getTime() || 0), 0), [history]);
    const [nowMs, setNowMs] = useState(0);
    useEffect(() => { setNowMs(Date.now()); }, [history]);
    const note = useDailyNote({
        care: careItems,
        weather,
        petName: activePetObj?.name || null,
        daysSinceLastWalk: lastWalkAt && nowMs ? (nowMs - lastWalkAt) / 86_400_000 : null,
        goalDone: todayDistanceKm >= Math.max(0.1, dailyGoal.distance),
    });

    return (
        <div className={`theme-vet ${nunito.className} min-h-[100dvh] bg-background text-foreground overflow-x-hidden`}>
            <main className="max-w-md mx-auto px-5 pb-[calc(env(safe-area-inset-bottom)+112px)]">
                <HomeHeader
                    firstName={firstName}
                    userId={user?.id}
                    avatar={user?.avatar}
                    pets={pets}
                    activePet={activePetObj}
                    onSwitchPet={switchPet}
                    onAddPet={() => setAddPetOpen(true)}
                    unreadCount={unreadCount}
                    note={note}
                />

                <div className="relative z-10 -mt-7 -mx-5 px-5 pt-5 rounded-t-[28px] bg-background">
                    <HomeStories groups={storyGroups} />
                </div>

                {petsLoading ? (
                    <div className="mt-6 space-y-4">
                        <Skeleton className="h-[214px] rounded-[24px]" />
                        <Skeleton className="h-[96px]" />
                        <Skeleton className="h-[150px]" />
                    </div>
                ) : hasNoPets ? (
                    <section className="mt-6 rounded-[24px] bg-card border border-card-border p-6 text-center">
                        <img src="/images/moffi_pet_trio.png" alt="" className="w-40 h-28 object-contain mx-auto" />
                        <h2 className={`${baloo.className} text-[22px] font-bold text-foreground mt-3`}>Dostunu ekleyelim</h2>
                        <p className="text-[13.5px] font-semibold text-secondary mt-1.5 leading-relaxed">
                            Aşı takvimi, yürüyüş, hatırlatmalar ve pasaport, dostunu ekledikten sonra burada.
                        </p>
                        <button
                            type="button"
                            onClick={() => setAddPetOpen(true)}
                            className="mt-5 w-full h-[52px] rounded-2xl bg-accent text-white text-[15px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                        >
                            <Plus className="w-5 h-5" strokeWidth={2.6} /> Evcil hayvan ekle
                        </button>
                    </section>
                ) : (
                    <div className="mt-5 space-y-7">
                        <BirthdayCard pets={pets} />
                        <WalkTodayCard pets={pets} activePet={activePetObj} />
                        <QuickAccess lostCount={activeLostCount} cartCount={cartCount} />
                        <HomeReminders items={careItems} loaded={careLoaded} />
                        <PlayCards />
                        <HomeRecommendations products={suggested} onAddToCart={addToCart} />
                        <HomeInspiration items={inspiration} />
                    </div>
                )}
            </main>

            <AddPetFlow isOpen={addPetOpen} onClose={() => setAddPetOpen(false)} />
        </div>
    );
}

export default function HomePage() {
    return (
        <Suspense fallback={<div className="theme-vet min-h-[100dvh] bg-background" />}>
            <HomeContent />
        </Suspense>
    );
}
