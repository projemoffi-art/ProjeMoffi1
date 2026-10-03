'use client';

// Ana sayfa (design-reference/home-final). Bölümler src/components/home altında; bu dosya yalnızca sırayı,
// veri bağlantılarını ve ilk kurulum yönlendirmesini tutar.
// Sıra (2026-10-03, Baran onaylı): üst kart (components/home/hero, çekmeceli) → hikâyeler → (doğum günü) → bugünkü yürüyüş → hızlı erişim →
// hatırlatmalar → oyun/görev → öneriler → ilham.

import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { PetHero } from '@/components/home/hero/PetHero';
import { HomeStories } from '@/components/home/HomeStories';
import { WalkTodayCard } from '@/components/home/WalkTodayCard';
import { QuickAccess } from '@/components/home/QuickAccess';
import { HomeReminders } from '@/components/home/HomeReminders';
import { PlayCards } from '@/components/home/PlayCards';
import { HomeRecommendations } from '@/components/home/HomeRecommendations';
import { HomeInspiration } from '@/components/home/HomeInspiration';
import { AddPetFlow } from '@/components/home/AddPetFlow';
import { Skeleton, nunito } from '@/components/home/homeUI';
import { todayKey } from '@/lib/appointmentTime';
import { daysBetween } from '@/lib/health/derive';

const noopSubscribe = () => () => {};

function HomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { pets, activePet, switchPet, updatePet, isLoading: petsLoading, isInitialized } = usePet();
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
    // Gün farkı takvim günüyle (bugün istemcide okunur; sunucu çiziminde boş).
    const today = useSyncExternalStore(noopSubscribe, todayKey, () => '');
    const lastWalkDay = useMemo(() => history.reduce((max, w) => {
        const raw = w.ended_at || w.started_at;
        const key = raw ? new Date(raw).toLocaleDateString('sv-SE') : '';
        return key > max ? key : max;
    }, ''), [history]);
    const note = useDailyNote({
        care: careItems,
        weather,
        petName: activePetObj?.name || null,
        daysSinceLastWalk: lastWalkDay && today ? daysBetween(lastWalkDay, today) : null,
        goalDone: todayDistanceKm >= Math.max(0.1, dailyGoal.distance),
    });

    return (
        <div className={`theme-vet ${nunito.className} min-h-[100dvh] bg-background text-foreground overflow-x-hidden`}>
            <main className="max-w-md mx-auto px-5 pb-[calc(env(safe-area-inset-bottom)+112px)]">
                <PetHero
                    firstName={firstName}
                    userId={user?.id}
                    avatar={user?.avatar}
                    pets={pets}
                    activePet={activePetObj}
                    loading={petsLoading}
                    onSwitchPet={switchPet}
                    onUpdatePet={updatePet}
                    onAddPet={() => setAddPetOpen(true)}
                    unreadCount={unreadCount}
                    note={note}
                    careItems={careItems}
                />

                <div className="pt-3">
                    <HomeStories groups={storyGroups} />
                </div>

                {petsLoading ? (
                    <div className="mt-6 space-y-4">
                        <Skeleton className="h-[214px] rounded-[24px]" />
                        <Skeleton className="h-[96px]" />
                        <Skeleton className="h-[150px]" />
                    </div>
                ) : hasNoPets ? (
                    <div className="mt-5 space-y-7">
                        <QuickAccess lostCount={activeLostCount} cartCount={cartCount} />
                        <HomeInspiration items={inspiration} />
                    </div>
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
