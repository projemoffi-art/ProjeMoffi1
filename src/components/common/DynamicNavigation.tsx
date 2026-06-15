"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic';
import { FloatingControls } from "@/components/common/FloatingControls";
import { MoffiSidebar } from "@/components/community/MoffiSidebar";
import { useAuth } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { MoffiBottomNav } from "@/components/common/MoffiBottomNav";

// Lazy loaded overlays — only the ones that SHOULD be overlays
const ActionHubDrawer = dynamic(() => import("@/components/community/ActionHubDrawer").then(mod => mod.ActionHubDrawer), { ssr: false });
const WalkQuickSheet = dynamic(() => import("@/components/walk/WalkQuickSheet").then(mod => mod.WalkQuickSheet), { ssr: false });
const SettingsDrawer = dynamic(() => import("@/components/community/SettingsDrawer").then(mod => mod.SettingsDrawer), { ssr: false });
const InboxModal = dynamic(() => import("@/components/community/InboxModal").then(mod => mod.InboxModal), { ssr: false });
const MoffiMapsModal = dynamic(() => import("@/components/maps/MoffiMapsModal").then(mod => mod.MoffiMapsModal), { ssr: false });
const HubOverlay = dynamic(() => import("@/components/community/HubOverlay").then(mod => mod.HubOverlay), { ssr: false });
const SOSCommandCenter = dynamic(() => import("@/components/profile/SOSCommandCenter").then(mod => mod.SOSCommandCenter), { ssr: false });
const SpotlightSearch = dynamic(() => import("@/components/community/SpotlightSearch").then(mod => mod.SpotlightSearch), { ssr: false });
const AuthModal = dynamic(() => import("@/components/auth/AuthModal").then(mod => mod.default), { ssr: false });
const NotificationDrawer = dynamic(() => import("@/components/notifications/NotificationDrawer").then(mod => mod.NotificationDrawer), { ssr: false });

const HIDDEN_ROUTES = ['/', '/studio', '/lab', '/production-studio'];

export function DynamicNavigation() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { pets, updatePet, activePet } = usePet();

    // Overlay states — only for things that are genuinely overlays
    const [isActionHubOpen, setIsActionHubOpen] = useState(false);
    const [isWalkOpen, setIsWalkOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMapsOpen, setIsMapsOpen] = useState(false);
    const [isActionHubOverlayOpen, setIsActionHubOverlayOpen] = useState(false);
    const [isSOSOpen, setIsSOSOpen] = useState(false);
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const [isNavAllowedByExternalOverlays, setIsNavAllowedByExternalOverlays] = useState(true);
    const [sosActivePet, setSosActivePet] = useState<any>(null);

    const isAnyLocalOverlayOpen = 
        isActionHubOpen || 
        isWalkOpen || 
        isSettingsOpen || 
        isMapsOpen || 
        isActionHubOverlayOpen || 
        isSOSOpen || 
        isSpotlightOpen || 
        isAuthOpen || 
        isNotificationOpen;

    const overlayOpenRef = useRef(false);
    overlayOpenRef.current = isAnyLocalOverlayOpen;
    
    const allowedByExternalRef = useRef(true);
    allowedByExternalRef.current = isNavAllowedByExternalOverlays;

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

        const handleOpenActionHubOverlay = () => {
            window.history.pushState({ modal: 'action-overlay' }, "");
            setIsActionHubOpen(false);
            setIsSettingsOpen(false);
            setIsActionHubOverlayOpen(true);
        };

        const handleOpenSOS = (e: any) => {
            window.history.pushState({ modal: 'sos' }, "");
            setIsActionHubOverlayOpen(false);
            if (e?.detail) {
                setSosActivePet(e.detail);
            } else if (activePet) {
                setSosActivePet(activePet);
            }
            setIsSOSOpen(true);
        };

        const handleOpenSpotlight = () => {
            window.history.pushState({ modal: 'spotlight' }, "");
            setIsActionHubOverlayOpen(false);
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
            setIsActionHubOpen(modal === 'action-hub');
            setIsWalkOpen(modal === 'walk');
            setIsSettingsOpen(modal === 'settings');
            setIsMapsOpen(modal === 'maps');
            setIsActionHubOverlayOpen(modal === 'action-overlay');
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

        // Global navigation handler — now routes pages directly
        const handleGlobalNavigate = (e: any) => {
            const id = e.detail;
            if (!id) return;

            if (pathname === '/topluluk') {
                if (id === 'feed' || id === 'radar') {
                    window.dispatchEvent(new CustomEvent('moffi-change-tab', { detail: id }));
                    return;
                }
            }

            const profileViews = ['wallet', 'passport', 'family', 'orders', 'appointments', 'routes', 'bookmarks', 'identity'];

            if (id === 'feed' || id === 'radar') {
                router.push(`/topluluk?tab=${id}`);
            } else if (id === 'profile') {
                if (user?.id) router.push(`/profile/${user.id}`);
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
                window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: 'MoffiNet yakında sizlerle! 🌐', icon: 'Zap' } }));
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
            if (pathname === '/topluluk') {
                window.dispatchEvent(new CustomEvent('moffi-open-upload-modal'));
            } else {
                router.push('/topluluk?openUpload=true');
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
        window.addEventListener('open-moffi-action-hub', handleOpenActionHubOverlay);
        window.addEventListener('open-sos-center', handleOpenSOS);
        window.addEventListener('open-moffi-spotlight', handleOpenSpotlight);
        window.addEventListener('open-auth-modal', handleOpenAuth);
        window.addEventListener('open-notification-drawer', handleOpenNotifications);
        window.addEventListener('moffi-navigate', handleGlobalNavigate);
        window.addEventListener('scroll', handleGlobalScroll, { capture: true, passive: true });
        window.addEventListener('moffi-toggle-nav', handleToggleNav);
        window.addEventListener('open-add-post', handleOpenPostGlobal);

        return () => {
            window.removeEventListener('open-moffi-hub', handleOpenActionHub);
            window.removeEventListener('open-walk-panel', handleOpenWalk);
            window.removeEventListener('open-moffi-settings', handleOpenSettings);
            window.removeEventListener('open-moffi-maps', handleOpenMaps);
            window.removeEventListener('open-moffi-action-hub', handleOpenActionHubOverlay);
            window.removeEventListener('open-sos-center', handleOpenSOS);
            window.removeEventListener('open-moffi-spotlight', handleOpenSpotlight);
            window.removeEventListener('open-auth-modal', handleOpenAuth);
            window.removeEventListener('open-notification-drawer', handleOpenNotifications);
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

    if (shouldHide) return null;

    return (
        <>
            <FloatingControls />
            <MoffiSidebar />

            <ActionHubDrawer
                isOpen={isActionHubOpen}
                onClose={() => setIsActionHubOpen(false)}
                onNavigate={(id) => {
                    setIsActionHubOpen(false);
                    window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: id }));
                }}
            />

            {/* Walk stays as overlay — instant start makes sense */}
            <WalkQuickSheet
                isOpen={isWalkOpen}
                onClose={() => setIsWalkOpen(false)}
            />

            <SettingsDrawer
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <InboxModal />

            <MoffiMapsModal
                isOpen={isMapsOpen}
                onClose={() => setIsMapsOpen(false)}
            />

            <HubOverlay
                isOpen={isActionHubOverlayOpen}
                onClose={() => setIsActionHubOverlayOpen(false)}
                onMarketClick={() => { setIsActionHubOverlayOpen(false); router.push('/petshop'); }}
                onWalkClick={() => { setIsActionHubOverlayOpen(false); window.dispatchEvent(new CustomEvent('open-walk-panel')); }}
                onVetClick={() => { setIsActionHubOverlayOpen(false); router.push('/vet'); }}
                onStudioClick={() => { setIsActionHubOverlayOpen(false); router.push('/studio'); }}
                onGameClick={() => { setIsActionHubOverlayOpen(false); router.push('/game'); }}
                onMoffinetClick={() => window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: 'MoffiNet yakında! 🌐', icon: 'Zap' } }))}
                onSearchClick={() => window.dispatchEvent(new CustomEvent('open-moffi-spotlight'))}
                onCommunityRadarClick={() => { setIsActionHubOverlayOpen(false); router.push('/topluluk?tab=radar'); }}
                onAIAsistantClick={() => {
                    window.history.pushState({ modal: 'ai' }, "");
                    setIsActionHubOverlayOpen(false);
                    window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                }}
                onSOSClick={() => window.dispatchEvent(new CustomEvent('open-sos-center'))}
            />

            <SOSCommandCenter
                isOpen={isSOSOpen}
                onClose={() => setIsSOSOpen(false)}
                pet={sosActivePet}
                allPets={pets}
                onPetChange={(p) => setSosActivePet(p)}
                sosData={null}
                onUpdate={(newSosData) => {
                    if (sosActivePet) {
                        updatePet(sosActivePet.id, { is_lost: newSosData.status === 'lost' });
                    }
                    setIsSOSOpen(false);
                }}
            />

            <SpotlightSearch
                isOpen={isSpotlightOpen}
                onClose={() => setIsSpotlightOpen(false)}
                onNavigate={(type, id) => {
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
                onClose={() => setIsAuthOpen(false)}
            />

            <NotificationDrawer
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
            />

            {/* GLOBAL BOTTOM NAVIGATION */}
            <div className={`fixed bottom-0 inset-x-0 z-[2900] transition-transform duration-300 ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                <MoffiBottomNav
                    activeTab={
                        pathname === '/community' ? 'home' :
                        pathname === '/quests' ? 'quests' :
                        pathname?.startsWith('/profile') ? 'profile' :
                        pathname === '/topluluk' ? (searchParams?.get('tab') || 'feed') :
                        'home'
                    }
                    isVisible={isNavVisible}
                    onTabChange={(tab) => {
                        if (tab === 'home') {
                            router.push('/community');
                        } else if (tab === 'feed') {
                            router.push('/topluluk?tab=feed');
                        } else if (tab === 'quests') {
                            router.push('/quests');
                        } else if (tab === 'profile') {
                            if (user?.id) router.push(`/profile/${user.id}`);
                        } else {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('tab', tab);
                            router.replace(`${pathname}?${params.toString()}`, { scroll: false });

                            if (pathname === '/topluluk') {
                                window.dispatchEvent(new CustomEvent('moffi-change-tab', { detail: tab }));
                            }
                        }
                    }}
                />
            </div>
        </>
    );
}
