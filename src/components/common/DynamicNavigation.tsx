"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { FloatingControls } from "@/components/common/FloatingControls";
import { EdgePanel } from "@/components/edge/EdgePanel";
import { useAuth } from "@/context/AuthContext";
import { usePet, type Pet } from "@/context/PetContext";
import { MoffiBottomNav } from "@/components/common/MoffiBottomNav";
import { useTheme } from "@/context/ThemeContext";
import { ActiveWalkMiniWidget } from "@/components/walk/ActiveWalkMiniWidget";
import { useActivity } from "@/context/ActivityContext";

// Lazy loaded overlays — only the ones that SHOULD be overlays
const WalkQuickSheet = dynamic(() => import("@/components/walk/WalkQuickSheet").then(mod => mod.WalkQuickSheet), { ssr: false });
const SettingsDrawer = dynamic(() => import("@/components/community/SettingsDrawer").then(mod => mod.SettingsDrawer), { ssr: false });
const InboxModal = dynamic(() => import("@/components/community/InboxModal").then(mod => mod.InboxModal), { ssr: false });
const SOSCommandCenter = dynamic(() => import("@/components/profile/SOSCommandCenter").then(mod => mod.SOSCommandCenter), { ssr: false });
const SpotlightSearch = dynamic(() => import("@/components/community/SpotlightSearch").then(mod => mod.SpotlightSearch), { ssr: false });
const AuthModal = dynamic(() => import("@/components/auth/AuthModal").then(mod => mod.default), { ssr: false });
const NotificationDrawer = dynamic(() => import("@/components/notifications/NotificationDrawer").then(mod => mod.NotificationDrawer), { ssr: false });
const SubscriptionManagementModal = dynamic(() => import("@/components/community/modals/SubscriptionManagementModal").then(mod => mod.SubscriptionManagementModal), { ssr: false });
const PremiumUpgradeModal = dynamic(() => import("@/components/community/modals/PremiumUpgradeModal").then(mod => mod.PremiumUpgradeModal), { ssr: false });

const HIDDEN_ROUTES = ['/', '/onboarding', '/login', '/register', '/auth', '/walk/tracking', '/walk/summary',
    // Paylaşılan pasaport, künye ve doğrulama sayfaları uygulama dışındaki kişilere açılır.
    '/p/', '/id/', '/verify/'];
// Alt menü, ekranın altına sabit yorum/paylaşım kutusu olan sayfalarda ve işletme/yönetim panellerinde (kendi menüleri var)
// gizlenir; genel pencereler (bildirimler vb.) çalışmaya devam eder.
const BOTTOM_NAV_HIDDEN = ['/community/yeni', '/community/gonderi', '/business', '/admin'];

export function DynamicNavigation() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const { pets, activePet } = usePet();
    const { seniorMode } = useTheme();
    const { walkData } = useActivity();

    // Overlay states — only for things that are genuinely overlays
    const [isWalkOpen, setIsWalkOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSOSOpen, setIsSOSOpen] = useState(false);
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    // Alt menü görünürlüğü türetilir: yerel pencere açık değil + dış pencere izin veriyor + kaydırmayla gizlenmemiş.
    const [isNavAllowedByExternalOverlays, setIsNavAllowedByExternalOverlays] = useState(true);
    const [scrollHidden, setScrollHidden] = useState(false);
    // SOS merkezi açılırken belirli bir hayvan verilirse o, yoksa seçili hayvan (ayrı kopya tutulmaz).
    const [sosPetOverride, setSosPetOverride] = useState<Pet | null>(null);
    const sosActivePet = sosPetOverride ?? activePet ?? pets[0] ?? null;

    const isAnyLocalOverlayOpen =
        isWalkOpen ||
        isSettingsOpen ||
        isSOSOpen ||
        isSpotlightOpen ||
        isAuthOpen ||
        isNotificationOpen;
    const isNavVisible = !isAnyLocalOverlayOpen && isNavAllowedByExternalOverlays && !scrollHidden;

    // Sayfa değişince menü geri gelir ve yürüyüş paneli kapanır; yerel pencere kapanınca kaydırma gizlemesi sıfırlanır.
    // (Çizim sırasında önceki değerle karşılaştırma: efektte senkron setState yerine React'in önerdiği yol.)
    const [seen, setSeen] = useState({ pathname, overlay: isAnyLocalOverlayOpen });
    if (seen.pathname !== pathname || seen.overlay !== isAnyLocalOverlayOpen) {
        setSeen({ pathname, overlay: isAnyLocalOverlayOpen });
        if (seen.pathname !== pathname) {
            setIsNavAllowedByExternalOverlays(true);
            setScrollHidden(false);
            // "Yürüyüşe Başla" paneli ancak yeni sayfa boyandığında kapanır (eski sayfa bir an görünmesin).
            if (isWalkOpen) setIsWalkOpen(false);
        } else if (!isAnyLocalOverlayOpen) {
            setScrollHidden(false);
        }
    }

    // KÖK NEDEN DÜZELTMESİ (yürüyüş modülü "geri giderken beni en başa atıyor"
    // hatası): her overlay açılışında `window.history.pushState({modal:'x'},"")`
    // ile aynı URL'i (örn. /home) taşıyan "hayalet" bir history girdisi
    // ekleniyordu, ama overlay kendi butonuyla (X, ya da bir yere navigate edip
    // kapanınca) KAPANDIĞINDA bu girdi HİÇ temizlenmiyordu — sadece React state'i
    // (`setIsWalkOpen(false)`) güncelleniyordu. Sonra kullanıcı `/walk/tracking`
    // gibi gerçek bir sayfadan `router.back()` yaptığında, tarayıcı bu temizlenmemiş
    // hayalet girdiye ("/home" + modal:'walk') geri dönüyor, handlePopState de
    // overlay'i (yanlış sayfada) yeniden açıyordu — kullanıcıya "en başa atıldım"
    // gibi görünüyordu. Düzeltme: overlay HANGİ yoldan kapanırsa kapansın (X,
    // veya bir route'a geçip kapanma), önce bu fonksiyon çağrılıp o anki history
    // girdisinin `modal` state'i (navigasyon yapmadan, `replaceState` ile)
    // temizleniyor - böylece daha sonra oraya geri dönülse bile overlay bir daha
    // yanlışlıkla açılmıyor.
    const clearModalHistoryState = () => {
        if (typeof window !== 'undefined' && window.history.state?.modal) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    };

    // Kaydırma dinleyicisi güncel durumu ref'ten okur (dinleyici her durumda yeniden kurulmasın diye).
    const overlayOpenRef = useRef(false);
    const allowedByExternalRef = useRef(true);
    useEffect(() => {
        overlayOpenRef.current = isAnyLocalOverlayOpen;
        allowedByExternalRef.current = isNavAllowedByExternalOverlays;
    }, [isAnyLocalOverlayOpen, isNavAllowedByExternalOverlays]);


    // KÖK NEDEN DÜZELTMESİ (Baran'ın bulduğu gerçek hata: "Yürüyüşe Başla"ya
    // basınca panel kapanıp bir an için altındaki sayfa (ana sayfa/işletme
    // paneli) görünüyor, SONRA yürüyüş takip ekranı geliyor — iki adımlı, sert
    // bir geçiş). Kök neden: WalkQuickSheet'in navigasyon tetikleyen aksiyonları
    // (Başla/Devam Et/Bitir) `onClose()`'u router.push() ile AYNI ANDA
    // çağırıyordu — panel kapanış animasyonu oynarken (birkaç yüz ms) yeni
    // sayfa HENÜZ boyanmamış oluyordu, bu yüzden panelin altından o anki
    // GERÇEK sayfa (ör. /home ya da /business/dashboard) kısaca görünüyordu.
    // Düzeltme: navigasyon aksiyonları artık paneli HEMEN kapatmıyor (sadece
    // history temizliğini senkron yapıyor, bkz. `onNavigate` prop'u) — panel
    // GÖRSEL olarak ancak pathname GERÇEKTEN değiştiğinde (yani yeni sayfa
    // zaten boyanmış olduğunda) kapanıyor, böylece kapanış animasyonu eski
    // değil YENİ sayfayı açığa çıkarıyor.
    // (Uygulaması yukarıda, sayfa değişimi karşılaştırmasında.)


    useEffect(() => {
        const handleOpenWalk = () => {
            // Baran'ın bulduğu gerçek hata: aktif bir yürüyüş varken "open-walk-panel"
            // (ana sayfadaki "Devam Et"/"Takibi Gör" butonları dahil) her zaman
            // WalkQuickSheet'i açıyordu — o panelin KENDİ, ayrı bir "aktif yürüyüş"
            // görünümü var (büyük km rakamı, Duraklat/Bitir) ama oradan GERÇEK harita
            // ekranına (`/walk/tracking`) dönecek hiçbir yol yoktu. Kullanıcı bir kez
            // haritadan ayrılınca bir daha asla haritaya dönemiyordu. Kök neden çözümü:
            // yürüyüş zaten aktifse panel hiç açılmıyor, doğrudan gerçek harita
            // ekranına yönlendiriliyor — WalkQuickSheet artık SADECE "henüz
            // başlamamış" hazırlık akışı için kullanılıyor.
            if (walkData.isActive) {
                router.push('/walk/tracking');
                return;
            }
            window.history.pushState({ modal: 'walk' }, "");
            setIsSettingsOpen(false);
            setIsWalkOpen(true);
        };

        const handleOpenSettings = () => {
            window.history.pushState({ modal: 'settings' }, "");
            setIsWalkOpen(false);
            setIsSettingsOpen(true);
        };

        const handleOpenSOS = (e: Event) => {
            window.history.pushState({ modal: 'sos' }, "");
            setSosPetOverride((e as CustomEvent<Pet | undefined>).detail ?? null);
            setIsSOSOpen(true);
        };

        const handleOpenSpotlight = () => {
            window.history.pushState({ modal: 'spotlight' }, "");
            setIsSpotlightOpen(true);
        };

        const handleOpenAuth = () => {
            window.history.pushState({ modal: 'auth' }, "");
            setIsAuthOpen(true);
        };

        const handleOpenNotifications = () => {
            window.history.pushState({ modal: 'notifications' }, "");
            setIsNotificationOpen(true);
        };

        // BACK BUTTON INTERCEPTOR
        const handlePopState = (e: PopStateEvent) => {
            const modal = e.state?.modal;
            setIsWalkOpen(modal === 'walk');
            setIsSettingsOpen(modal === 'settings');
            setIsSOSOpen(modal === 'sos');
            setIsSpotlightOpen(modal === 'spotlight');
            setIsAuthOpen(modal === 'auth');
            setIsNotificationOpen(modal === 'notifications');

            if (modal !== 'ai') {
                window.dispatchEvent(new CustomEvent('close-ai-assistant'));
            } else {
                window.dispatchEvent(new CustomEvent('open-ai-assistant'));
            }
        };

        // Kaydırınca alt menüyü gizle/göster (tüm kaydırılan alanlar, yakalama aşamasında). Her alanın son konumu ayrı tutulur.
        let ticking = false;
        const lastScroll = new WeakMap<object, number>();
        const handleGlobalScroll = (e: Event) => {
            // If any overlay is open, bypass scroll hide/show to keep nav hidden
            if (overlayOpenRef.current || !allowedByExternalRef.current) return;

            const target = e.target as HTMLElement;
            if (!target) return;

            // Get current scroll position of the specific target
            const isWindowScroll = (target as unknown) === document || (target as unknown) === window || target === document.body || target === document.documentElement;

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const latestCurrent = isWindowScroll ? window.scrollY : target.scrollTop;
                    const last = lastScroll.get(target) ?? latestCurrent;
                    const diff = latestCurrent - last;

                    if (latestCurrent > 60) {
                        if (diff > 5) setScrollHidden(true);
                        else if (diff < -10) setScrollHidden(false);
                    } else {
                        setScrollHidden(false);
                    }

                    lastScroll.set(target, latestCurrent);
                    ticking = false;
                });
                ticking = true;
            }
        };

        const handleOpenPostGlobal = () => router.push('/community/yeni');

        const handleToggleNav = (e: Event) => {
            const allowed = (e as CustomEvent<boolean>).detail;
            setIsNavAllowedByExternalOverlays(allowed);
            if (allowed) setScrollHidden(false);
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('open-walk-panel', handleOpenWalk);
        window.addEventListener('open-moffi-settings', handleOpenSettings);
        window.addEventListener('open-sos-center', handleOpenSOS);
        window.addEventListener('open-moffi-spotlight', handleOpenSpotlight);
        window.addEventListener('open-auth-modal', handleOpenAuth);
        window.addEventListener('open-notification-drawer', handleOpenNotifications);
        window.addEventListener('scroll', handleGlobalScroll, { capture: true, passive: true });
        window.addEventListener('moffi-toggle-nav', handleToggleNav);
        window.addEventListener('open-add-post', handleOpenPostGlobal);

        return () => {
            window.removeEventListener('open-walk-panel', handleOpenWalk);
            window.removeEventListener('open-moffi-settings', handleOpenSettings);
            window.removeEventListener('open-sos-center', handleOpenSOS);
            window.removeEventListener('open-moffi-spotlight', handleOpenSpotlight);
            window.removeEventListener('open-auth-modal', handleOpenAuth);
            window.removeEventListener('open-notification-drawer', handleOpenNotifications);
            window.removeEventListener('moffi-toggle-nav', handleToggleNav);
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('scroll', handleGlobalScroll, { capture: true });
            window.removeEventListener('open-add-post', handleOpenPostGlobal);
        };
    }, [pathname, user, walkData.isActive, router]);

    const shouldHide = pathname && HIDDEN_ROUTES.some(route =>
        route === '/' ? pathname === '/' : pathname.startsWith(route)
    );

    if (shouldHide || seniorMode) return null;

    return (
        <>
            <FloatingControls />
            <EdgePanel hidden={isAnyLocalOverlayOpen || !isNavAllowedByExternalOverlays || pathname?.startsWith('/business') || pathname?.startsWith('/admin')} />
            <ActiveWalkMiniWidget />

            {/* Walk stays as overlay — instant start makes sense */}
            <WalkQuickSheet
                isOpen={isWalkOpen}
                onClose={() => { clearModalHistoryState(); setIsWalkOpen(false); }}
                onNavigateAway={clearModalHistoryState}
            />

            <SettingsDrawer
                isOpen={isSettingsOpen}
                onClose={() => { clearModalHistoryState(); setIsSettingsOpen(false); }}
            />

            <InboxModal />

            <SOSCommandCenter
                isOpen={isSOSOpen}
                onClose={() => { clearModalHistoryState(); setIsSOSOpen(false); }}
                pet={sosActivePet}
                allPets={pets}
                onPetChange={(p) => setSosPetOverride(p)}
            />

            <SpotlightSearch
                isOpen={isSpotlightOpen}
                onClose={() => { clearModalHistoryState(); setIsSpotlightOpen(false); }}
                onNavigate={(type, id) => {
                    clearModalHistoryState();
                    setIsSpotlightOpen(false);
                    // Hayvan sonucu sahibinin profiline gider (hayvan kaydı yalnızca sahibine açık, 8.45).
                    if (type === 'user' || type === 'pet') router.push(`/profile/${id}`);
                    else if (type === 'post') router.push(`/community/gonderi/${id}`);
                }}
            />

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => { clearModalHistoryState(); setIsAuthOpen(false); }}
            />

            <NotificationDrawer
                isOpen={isNotificationOpen}
                onClose={() => { clearModalHistoryState(); setIsNotificationOpen(false); }}
            />


            <SubscriptionManagementModal />
            <PremiumUpgradeModal />

            {/* GLOBAL BOTTOM NAVIGATION */}
            {!BOTTOM_NAV_HIDDEN.some(r => pathname?.startsWith(r)) && (
            <div className={`fixed bottom-0 inset-x-0 z-[2900] transition-transform duration-300 md:hidden ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                <MoffiBottomNav
                    activeTab={
                        pathname === '/home' ? 'home' :
                        pathname === '/quests' ? 'quests' :
                        pathname?.startsWith('/profile') ? 'profile' :
                        pathname?.startsWith('/community') ? 'feed' :
                        'home'
                    }
                    isVisible={isNavVisible}
                    onTabChange={(tab) => {
                        if (tab === 'home') router.push('/home');
                        else if (tab === 'feed') router.push('/community');
                        else if (tab === 'quests') router.push('/quests');
                        else if (tab === 'profile' && user?.id) router.push(`/profile/${user.id}`);
                    }}
                />
            </div>
            )}
        </>
    );
}
