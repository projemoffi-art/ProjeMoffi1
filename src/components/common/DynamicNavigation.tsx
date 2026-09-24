"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic';
import { FloatingControls } from "@/components/common/FloatingControls";
import { MoffiSidebar } from "@/components/community/MoffiSidebar";
import { useAuth } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { MoffiBottomNav } from "@/components/common/MoffiBottomNav";
import { useTheme } from "@/context/ThemeContext";
import { ActiveWalkMiniWidget } from "@/components/walk/ActiveWalkMiniWidget";

// Lazy loaded overlays — only the ones that SHOULD be overlays
const ActionHubDrawer = dynamic(() => import("@/components/community/ActionHubDrawer").then(mod => mod.ActionHubDrawer), { ssr: false });
const WalkQuickSheet = dynamic(() => import("@/components/walk/WalkQuickSheet").then(mod => mod.WalkQuickSheet), { ssr: false });
const SettingsDrawer = dynamic(() => import("@/components/community/SettingsDrawer").then(mod => mod.SettingsDrawer), { ssr: false });
const InboxModal = dynamic(() => import("@/components/community/InboxModal").then(mod => mod.InboxModal), { ssr: false });
const MoffiMapsModal = dynamic(() => import("@/components/maps/MoffiMapsModal").then(mod => mod.MoffiMapsModal), { ssr: false });
const SOSCommandCenter = dynamic(() => import("@/components/profile/SOSCommandCenter").then(mod => mod.SOSCommandCenter), { ssr: false });
const SpotlightSearch = dynamic(() => import("@/components/community/SpotlightSearch").then(mod => mod.SpotlightSearch), { ssr: false });
const AuthModal = dynamic(() => import("@/components/auth/AuthModal").then(mod => mod.default), { ssr: false });
const NotificationDrawer = dynamic(() => import("@/components/notifications/NotificationDrawer").then(mod => mod.NotificationDrawer), { ssr: false });
const EcosystemPortal = dynamic(() => import("@/components/community/EcosystemPortal").then(mod => mod.EcosystemPortal), { ssr: false });
const MoffiUltimateHub = dynamic(() => import("@/components/community/MoffiUltimateHub").then(mod => mod.MoffiUltimateHub), { ssr: false });
const SubscriptionManagementModal = dynamic(() => import("@/components/community/modals/SubscriptionManagementModal").then(mod => mod.SubscriptionManagementModal), { ssr: false });
const PremiumUpgradeModal = dynamic(() => import("@/components/community/modals/PremiumUpgradeModal").then(mod => mod.PremiumUpgradeModal), { ssr: false });

const HIDDEN_ROUTES = ['/', '/studio', '/lab', '/production-studio', '/login', '/register', '/auth', '/walk/tracking', '/walk/summary'];

export function DynamicNavigation() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { pets, updatePet, activePet } = usePet();
    const { seniorMode } = useTheme();

    // Overlay states — only for things that are genuinely overlays
    const [isActionHubOpen, setIsActionHubOpen] = useState(false);
    const [isWalkOpen, setIsWalkOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMapsOpen, setIsMapsOpen] = useState(false);
    const [isSOSOpen, setIsSOSOpen] = useState(false);
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isEcosystemPortalOpen, setIsEcosystemPortalOpen] = useState(false);
    const [isAIHubOpen, setIsAIHubOpen] = useState(false);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const [isNavAllowedByExternalOverlays, setIsNavAllowedByExternalOverlays] = useState(true);
    const [sosActivePet, setSosActivePet] = useState<any>(null);

    const isAnyLocalOverlayOpen = 
        isActionHubOpen || 
        isWalkOpen || 
        isSettingsOpen || 
        isMapsOpen ||
        isSOSOpen ||
        isSpotlightOpen || 
        isAuthOpen || 
        isNotificationOpen ||
        isEcosystemPortalOpen ||
        isAIHubOpen;

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

    const overlayOpenRef = useRef(false);
    overlayOpenRef.current = isAnyLocalOverlayOpen;
    
    const allowedByExternalRef = useRef(true);
    allowedByExternalRef.current = isNavAllowedByExternalOverlays;

    useEffect(() => {
        // Always restore nav visibility when navigating to a new page
        setIsNavAllowedByExternalOverlays(true);
        setIsNavVisible(true);
    }, [pathname]);

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
    const prevPathnameForWalkRef = useRef(pathname);
    useEffect(() => {
        if (pathname !== prevPathnameForWalkRef.current) {
            prevPathnameForWalkRef.current = pathname;
            if (isWalkOpen) setIsWalkOpen(false);
        }
    }, [pathname, isWalkOpen]);

    useEffect(() => {
        if (isAnyLocalOverlayOpen) {
            setIsNavVisible(false);
        } else if (isNavAllowedByExternalOverlays) {
            setIsNavVisible(true);
        }
    }, [isAnyLocalOverlayOpen, isNavAllowedByExternalOverlays]);

    useEffect(() => {
        if (activePet) {
            setSosActivePet(activePet);
        } else if (pets.length > 0 && !sosActivePet) {
            setSosActivePet(pets[0]);
        }
    }, [activePet, pets]);

    useEffect(() => {
        const handleOpenActionHub = () => {
            window.history.pushState({ modal: 'action-hub' }, "");
            setIsSettingsOpen(false);
            setIsWalkOpen(false);
            setIsActionHubOpen(true);
        };

        const handleOpenWalk = () => {
            window.history.pushState({ modal: 'walk' }, "");
            setIsActionHubOpen(false);
            setIsSettingsOpen(false);
            setIsWalkOpen(true);
        };

        const handleOpenSettings = () => {
            window.history.pushState({ modal: 'settings' }, "");
            setIsActionHubOpen(false);
            setIsWalkOpen(false);
            setIsMapsOpen(false);
            setIsSettingsOpen(true);
        };

        const handleOpenMaps = () => {
            window.history.pushState({ modal: 'maps' }, "");
            setIsActionHubOpen(false);
            setIsWalkOpen(false);
            setIsSettingsOpen(false);
            setIsMapsOpen(true);
        };

        const handleOpenSOS = (e: any) => {
            window.history.pushState({ modal: 'sos' }, "");
            if (e?.detail) {
                setSosActivePet(e.detail);
            } else if (activePet) {
                setSosActivePet(activePet);
            }
            setIsSOSOpen(true);
        };

        const handleOpenAIHub = () => {
            window.history.pushState({ modal: 'ai-hub' }, "");
            setIsAIHubOpen(true);
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

        const handleOpenEcosystem = () => {
            window.history.pushState({ modal: 'ecosystem' }, "");
            setIsEcosystemPortalOpen(true);
        };

        // BACK BUTTON INTERCEPTOR
        const handlePopState = (e: PopStateEvent) => {
            const modal = e.state?.modal;
            setIsActionHubOpen(modal === 'action-hub');
            setIsWalkOpen(modal === 'walk');
            setIsSettingsOpen(modal === 'settings');
            setIsMapsOpen(modal === 'maps');
            setIsSOSOpen(modal === 'sos');
            setIsSpotlightOpen(modal === 'spotlight');
            setIsAuthOpen(modal === 'auth');
            setIsNotificationOpen(modal === 'notifications');
            setIsEcosystemPortalOpen(modal === 'ecosystem');
            setIsAIHubOpen(modal === 'ai-hub');

            if (modal !== 'ai') {
                window.dispatchEvent(new CustomEvent('close-ai-assistant'));
            } else {
                window.dispatchEvent(new CustomEvent('open-ai-assistant'));
            }
        };

        // Global navigation handler — now routes pages directly
        const handleGlobalNavigate = (e: any) => {
            const id = e.detail;
            if (!id) return;

            if (pathname === '/community') {
                if (id === 'feed' || id === 'radar') {
                    window.dispatchEvent(new CustomEvent('moffi-change-tab', { detail: id }));
                    return;
                }
            }

            const profileViews = ['wallet', 'passport', 'family', 'orders', 'appointments', 'routes', 'bookmarks', 'identity'];

            if (id === 'carehub' || id === 'nutrition') {
                if (pathname !== '/home' && pathname !== '/community' && pathname !== '/vet') {
                    router.push('/home');
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('open-care-hub', { detail: { tab: id === 'nutrition' ? 'nutrition' : 'health' } }));
                    }, 500);
                } else {
                    window.dispatchEvent(new CustomEvent('open-care-hub', { detail: { tab: id === 'nutrition' ? 'nutrition' : 'health' } }));
                }
            } else if (id === 'feed' || id === 'radar') {
                router.push(`/community?tab=${id}`);
            } else if (id === 'profile') {
                if (user?.id) router.push(`/profile/${user.id}`);
            } else if (id === 'passport') {
                if (user?.id) router.push(`/profile/${user.id}?view=passport`);
                else window.dispatchEvent(new CustomEvent('open-auth-modal'));
            } else if (profileViews.includes(id)) {
                if (user?.id) router.push(`/profile/${user.id}?view=${id}`);
                else window.dispatchEvent(new CustomEvent('open-auth-modal'));
            } else if (id === 'settings') {
                handleOpenSettings();
            } else if (id === 'maps') {
                handleOpenMaps();
            } else if (id === 'market') {
                router.push('/petshop');           // ← Sayfa
            } else if (id === 'studio') {
                router.push('/studio');            // ← Sayfa
            } else if (id === 'vet') {
                router.push('/vet');               // ← Sayfa
            } else if (id === 'game') {
                router.push('/game');              // ← Sayfa
            } else if (id === 'quests') {
                router.push('/quests');            // ← Sayfa
            } else if (id === 'moffinet') {
                handleOpenEcosystem();
            }
        };

        // Scroll hide/show nav
        // Scroll hide/show nav (Capturing globally)
        let ticking = false;
        const handleGlobalScroll = (e: Event) => {
            // If any overlay is open, bypass scroll hide/show to keep nav hidden
            if (overlayOpenRef.current || !allowedByExternalRef.current) return;

            const target = e.target as HTMLElement;
            if (!target) return;

            // Get current scroll position of the specific target
            const isWindowScroll = target === document || (target as any) === window || target === document.body || target === document.documentElement;
            const current = isWindowScroll ? window.scrollY : target.scrollTop;

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const latestCurrent = isWindowScroll ? window.scrollY : target.scrollTop;
                    const last = (target as any)._moffiLastScrollY !== undefined ? (target as any)._moffiLastScrollY : latestCurrent;
                    const diff = latestCurrent - last;

                    if (latestCurrent > 60) {
                        if (diff > 5) setIsNavVisible(false);
                        else if (diff < -10) setIsNavVisible(true);
                    } else {
                        setIsNavVisible(true);
                    }

                    (target as any)._moffiLastScrollY = latestCurrent;
                    ticking = false;
                });
                ticking = true;
            }
        };

        const handleOpenPostGlobal = () => {
            if (pathname === '/community') {
                window.dispatchEvent(new CustomEvent('moffi-open-upload-modal'));
            } else {
                router.push('/community?openUpload=true');
            }
        };

        const handleToggleNav = (e: any) => {
            const allowed = e.detail;
            setIsNavAllowedByExternalOverlays(allowed);
            setIsNavVisible(allowed);
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('open-moffi-hub', handleOpenActionHub);
        window.addEventListener('open-walk-panel', handleOpenWalk);
        window.addEventListener('open-moffi-settings', handleOpenSettings);
        window.addEventListener('open-moffi-maps', handleOpenMaps);
        window.addEventListener('open-sos-center', handleOpenSOS);
        window.addEventListener('open-moffi-spotlight', handleOpenSpotlight);
        window.addEventListener('open-auth-modal', handleOpenAuth);
        window.addEventListener('open-notification-drawer', handleOpenNotifications);
        window.addEventListener('open-ecosystem-portal', handleOpenEcosystem);
        window.addEventListener('open-moffi-ai-hub', handleOpenAIHub);
        window.addEventListener('moffi-navigate', handleGlobalNavigate);
        window.addEventListener('scroll', handleGlobalScroll, { capture: true, passive: true });
        window.addEventListener('moffi-toggle-nav', handleToggleNav);
        window.addEventListener('open-add-post', handleOpenPostGlobal);

        return () => {
            window.removeEventListener('open-moffi-hub', handleOpenActionHub);
            window.removeEventListener('open-walk-panel', handleOpenWalk);
            window.removeEventListener('open-moffi-settings', handleOpenSettings);
            window.removeEventListener('open-moffi-maps', handleOpenMaps);
            window.removeEventListener('open-sos-center', handleOpenSOS);
            window.removeEventListener('open-moffi-spotlight', handleOpenSpotlight);
            window.removeEventListener('open-auth-modal', handleOpenAuth);
            window.removeEventListener('open-notification-drawer', handleOpenNotifications);
            window.removeEventListener('open-ecosystem-portal', handleOpenEcosystem);
            window.removeEventListener('open-moffi-ai-hub', handleOpenAIHub);
            window.removeEventListener('moffi-navigate', handleGlobalNavigate);
            window.removeEventListener('moffi-toggle-nav', handleToggleNav);
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('scroll', handleGlobalScroll, { capture: true });
            window.removeEventListener('open-add-post', handleOpenPostGlobal);
        };
    }, [pathname, user]);

    const shouldHide = pathname && HIDDEN_ROUTES.some(route =>
        route === '/' ? pathname === '/' : pathname.startsWith(route)
    );

    if (shouldHide || seniorMode) return null;

    return (
        <>
            <FloatingControls />
            <MoffiSidebar />
            <ActiveWalkMiniWidget />

            <ActionHubDrawer
                isOpen={isActionHubOpen}
                onClose={() => { clearModalHistoryState(); setIsActionHubOpen(false); }}
                onNavigate={(id) => {
                    clearModalHistoryState();
                    setIsActionHubOpen(false);
                    window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: id }));
                }}
            />

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

            <MoffiMapsModal
                isOpen={isMapsOpen}
                onClose={() => { clearModalHistoryState(); setIsMapsOpen(false); }}
            />

            <SOSCommandCenter
                isOpen={isSOSOpen}
                onClose={() => { clearModalHistoryState(); setIsSOSOpen(false); }}
                pet={sosActivePet}
                allPets={pets}
                onPetChange={(p) => setSosActivePet(p)}
                sosData={null}
                onUpdate={(newSosData) => {
                    if (sosActivePet) {
                        updatePet(sosActivePet.id, { is_lost: newSosData.status === 'lost' });
                    }
                    clearModalHistoryState();
                    setIsSOSOpen(false);
                }}
            />

            <SpotlightSearch
                isOpen={isSpotlightOpen}
                onClose={() => { clearModalHistoryState(); setIsSpotlightOpen(false); }}
                onNavigate={(type, id) => {
                    clearModalHistoryState();
                    setIsSpotlightOpen(false);
                    if (type === 'action') {
                        window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: id }));
                    } else if (type === 'pet') {
                        window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'passport' }));
                    } else if (type === 'user') {
                        router.push(`/profile/${id}`);
                    } else if (type === 'link') {
                        if (id === 'market') router.push('/petshop');
                    }
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

            <EcosystemPortal
                isOpen={isEcosystemPortalOpen}
                onClose={() => { clearModalHistoryState(); setIsEcosystemPortalOpen(false); }}
            />

            <MoffiUltimateHub
                isOpen={isAIHubOpen}
                onClose={() => { clearModalHistoryState(); setIsAIHubOpen(false); }}
            />

            <SubscriptionManagementModal />
            <PremiumUpgradeModal />

            {/* GLOBAL BOTTOM NAVIGATION */}
            <div className={`fixed bottom-0 inset-x-0 z-[2900] transition-transform duration-300 md:hidden ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                <MoffiBottomNav
                    activeTab={
                        pathname === '/home' ? 'home' :
                        pathname === '/quests' ? 'quests' :
                        pathname?.startsWith('/profile') ? 'profile' :
                        pathname === '/community' ? (searchParams?.get('tab') || 'feed') :
                        'home'
                    }
                    isVisible={isNavVisible}
                    onTabChange={(tab) => {
                        if (tab === 'home') {
                            router.push('/home');
                        } else if (tab === 'feed') {
                            router.push('/community?tab=feed');
                        } else if (tab === 'quests') {
                            router.push('/quests');
                        } else if (tab === 'profile') {
                            if (user?.id) router.push(`/profile/${user.id}`);
                        } else {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('tab', tab);
                            router.replace(`${pathname}?${params.toString()}`, { scroll: false });

                            if (pathname === '/community') {
                                window.dispatchEvent(new CustomEvent('moffi-change-tab', { detail: tab }));
                            }
                        }
                    }}
                />
            </div>
        </>
    );
}
