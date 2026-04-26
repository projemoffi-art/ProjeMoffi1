"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic';
import { FloatingControls } from "@/components/common/FloatingControls";
import { MoffiSidebar } from "@/components/community/MoffiSidebar";
import { useAuth } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { apiService } from "@/services/apiService";
import { MoffiBottomNav } from "@/components/common/MoffiBottomNav";

// Lazy loaded components for better performance
const ActionHubDrawer = dynamic(() => import("@/components/community/ActionHubDrawer").then(mod => mod.ActionHubDrawer), { ssr: false });
const WalkQuickSheet = dynamic(() => import("@/components/walk/WalkQuickSheet").then(mod => mod.WalkQuickSheet), { ssr: false });
const VetQuickSheet = dynamic(() => import("@/components/vet/VetQuickSheet").then(mod => mod.VetQuickSheet).catch(() => import("@/components/vet/VetQuickSheet").then(mod => mod.default)), { ssr: false });
const SettingsDrawer = dynamic(() => import("@/components/community/SettingsDrawer").then(mod => mod.SettingsDrawer), { ssr: false });
const InboxModal = dynamic(() => import("@/components/community/InboxModal").then(mod => mod.InboxModal), { ssr: false });
const MoffiMapsModal = dynamic(() => import("@/components/maps/MoffiMapsModal").then(mod => mod.MoffiMapsModal), { ssr: false });
const HubOverlay = dynamic(() => import("@/components/community/HubOverlay").then(mod => mod.HubOverlay), { ssr: false });
const SOSCommandCenter = dynamic(() => import("@/components/profile/SOSCommandCenter").then(mod => mod.SOSCommandCenter), { ssr: false });
const MarketQuickSheet = dynamic(() => import("@/components/shop/MarketQuickSheet").then(mod => mod.MarketQuickSheet), { ssr: false });
const StudioQuickSheet = dynamic(() => import("@/components/studio/StudioQuickSheet").then(mod => mod.StudioQuickSheet), { ssr: false });
const GameQuickSheet = dynamic(() => import("@/components/game/GameQuickSheet").then(mod => mod.GameQuickSheet), { ssr: false });
const SpotlightSearch = dynamic(() => import("@/components/community/SpotlightSearch").then(mod => mod.SpotlightSearch), { ssr: false });
const AuthModal = dynamic(() => import("@/components/auth/AuthModal").then(mod => mod.default), { ssr: false });


const HIDDEN_ROUTES = ['/studio', '/lab', '/production-studio'];

export function DynamicNavigation() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    
    // ACTION HUB (Zap Icon) is global
    const [isActionHubOpen, setIsActionHubOpen] = useState(false);
    const [isWalkOpen, setIsWalkOpen] = useState(false);
    const [isVetOpen, setIsVetOpen] = useState(false);
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [isGameOpen, setIsGameOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMapsOpen, setIsMapsOpen] = useState(false);
    const [isActionHubOverlayOpen, setIsActionHubOverlayOpen] = useState(false);
    const [isSOSOpen, setIsSOSOpen] = useState(false);
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const { pets, updatePet } = usePet();
    const [sosActivePet, setSosActivePet] = useState<any>(null);

    useEffect(() => {
        if (pets.length > 0 && !sosActivePet) {
            setSosActivePet(pets[0]);
        }
    }, [pets]);

    // Global Event Listeners for Drawers
    useEffect(() => {
        const handleOpenActionHub = () => {
            setIsSettingsOpen(false);
            setIsWalkOpen(false);
            setIsActionHubOpen(true);
        };

        const handleOpenWalk = () => {
            setIsActionHubOpen(false);
            setIsSettingsOpen(false);
            setIsWalkOpen(true);
        };


        const handleOpenSettings = () => {
            setIsActionHubOpen(false);
            setIsWalkOpen(false);
            setIsMapsOpen(false);
            setIsSettingsOpen(true);
        };

        const handleOpenMaps = () => {
            setIsActionHubOpen(false);
            setIsWalkOpen(false);
            setIsSettingsOpen(false);
            setIsMapsOpen(true);
        };

        const handleOpenActionHubOverlay = () => {
            setIsActionHubOpen(false);
            setIsSettingsOpen(false);
            setIsActionHubOverlayOpen(true);
        };

        const handleOpenSOS = () => {
            setIsActionHubOverlayOpen(false);
            setIsSOSOpen(true);
        };

        const handleOpenVet = () => {
            setIsActionHubOpen(false);
            setIsSettingsOpen(false);
            setIsActionHubOverlayOpen(false);
            setIsVetOpen(true);
        };

        const handleOpenMarket = () => {
            setIsActionHubOverlayOpen(false);
            setIsMarketOpen(true);
        };

        const handleOpenStudio = () => {
            setIsActionHubOverlayOpen(false);
            setIsStudioOpen(true);
        };

        const handleOpenGame = () => {
            setIsActionHubOverlayOpen(false);
            setIsGameOpen(true);
        };

        const handleOpenSpotlight = () => {
            setIsActionHubOverlayOpen(false);
            setIsSpotlightOpen(true);
        };

        const handleOpenAuth = () => {
            setIsAuthOpen(true);
        };

        window.addEventListener('open-moffi-hub', handleOpenActionHub);
        window.addEventListener('open-walk-panel', handleOpenWalk);
        window.addEventListener('open-moffi-settings', handleOpenSettings);
        window.addEventListener('open-moffi-maps', handleOpenMaps);
        window.addEventListener('open-moffi-action-hub', handleOpenActionHubOverlay);
        window.addEventListener('open-sos-center', handleOpenSOS);
        window.addEventListener('open-vet-portal', handleOpenVet);
        window.addEventListener('open-market-portal', handleOpenMarket);
        window.addEventListener('open-studio-portal', handleOpenStudio);
        window.addEventListener('open-game-portal', handleOpenGame);
        window.addEventListener('open-moffi-spotlight', handleOpenSpotlight);
        window.addEventListener('open-auth-modal', handleOpenAuth);

        // Global window scroll listener for pages that use window scroll (like Profile)
        let lastGlobalScrollY = window.scrollY;
        let ticking = false;

        const handleGlobalScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const current = window.scrollY;
                    const diff = current - lastGlobalScrollY;

                    // Sensitivity settings
                    const hideThreshold = 40; // Hide after 40px of downscroll
                    const showThreshold = -10; // Show immediately on upscroll
                    const initialOffset = 60; // Don't hide in the very top 60px

                    if (current > initialOffset) {
                        if (diff > 5) { // Downscrolling
                            setIsNavVisible(false);
                        } else if (diff < showThreshold) { // Upscrolling
                            setIsNavVisible(true);
                        }
                    } else {
                        setIsNavVisible(true);
                    }

                    lastGlobalScrollY = current;
                    ticking = false;
                });
                ticking = true;
            }
        };

        const handleToggleNav = (e: any) => {
            setIsNavVisible(e.detail);
        };

        window.addEventListener('scroll', handleGlobalScroll, { passive: true });
        window.addEventListener('moffi-toggle-nav', handleToggleNav);

        return () => {
            window.removeEventListener('open-moffi-hub', handleOpenActionHub);
            window.removeEventListener('open-walk-panel', handleOpenWalk);
            window.removeEventListener('open-moffi-settings', handleOpenSettings);
            window.removeEventListener('open-moffi-maps', handleOpenMaps);
            window.removeEventListener('open-moffi-action-hub', handleOpenActionHubOverlay);
            window.removeEventListener('open-sos-center', handleOpenSOS);
            window.removeEventListener('open-vet-portal', handleOpenVet);
            window.removeEventListener('open-market-portal', handleOpenMarket);
            window.removeEventListener('open-studio-portal', handleOpenStudio);
            window.removeEventListener('open-game-portal', handleOpenGame);
            window.removeEventListener('open-moffi-spotlight', handleOpenSpotlight);
            window.removeEventListener('open-auth-modal', handleOpenAuth);
            window.removeEventListener('moffi-toggle-nav', handleToggleNav);
            window.removeEventListener('scroll', handleGlobalScroll);
        };
    }, []);

    // Hide global components on studio/lab/walk routes
    const shouldHide = pathname && HIDDEN_ROUTES.some(route => pathname.startsWith(route));

    if (shouldHide) return null;

    return (
        <>
            <FloatingControls />
            <MoffiSidebar />

            {/* (Zap) ACTION HUB - PERSONAL IDENTITY (Wallet, Passport, Family) */}
            <ActionHubDrawer 
                isOpen={isActionHubOpen}
                onClose={() => setIsActionHubOpen(false)}
                onNavigate={(id) => {
                    setIsActionHubOpen(false);
                    window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: id }));
                }}
            />



            <WalkQuickSheet 
                isOpen={isWalkOpen}
                onClose={() => setIsWalkOpen(false)}
            />

            <VetQuickSheet 
                isOpen={isVetOpen}
                onClose={() => setIsVetOpen(false)}
                petId={pets[0]?.id || 'pet-1'}
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
                onMarketClick={() => { setIsActionHubOverlayOpen(false); window.dispatchEvent(new CustomEvent('open-market-portal')); }}
                onWalkClick={() => { setIsActionHubOverlayOpen(false); window.dispatchEvent(new CustomEvent('open-walk-panel')); }}
                onVetClick={() => { setIsActionHubOverlayOpen(false); window.dispatchEvent(new CustomEvent('open-vet-portal')); }}
                onStudioClick={() => { setIsActionHubOverlayOpen(false); window.dispatchEvent(new CustomEvent('open-studio-portal')); }}
                onGameClick={() => { setIsActionHubOverlayOpen(false); window.dispatchEvent(new CustomEvent('open-game-portal')); }}
                onMoffinetClick={() => { setIsActionHubOverlayOpen(false); window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'moffinet' })); }}
                onSearchClick={() => { setIsActionHubOverlayOpen(false); window.dispatchEvent(new CustomEvent('open-moffi-spotlight')); }}
                onCommunityRadarClick={() => { setIsActionHubOverlayOpen(false); window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'radar' })); }}
                onAIAsistantClick={() => { setIsActionHubOverlayOpen(false); window.dispatchEvent(new CustomEvent('open-ai-assistant')); }}
                onSOSClick={() => { setIsActionHubOverlayOpen(false); setIsSOSOpen(true); }}
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

            <MarketQuickSheet 
                isOpen={isMarketOpen}
                onClose={() => setIsMarketOpen(false)}
                petName={pets[0]?.name || 'Moffi'}
            />

            <StudioQuickSheet 
                isOpen={isStudioOpen}
                onClose={() => setIsStudioOpen(false)}
                petName={pets[0]?.name || 'Moffi'}
            />

            <GameQuickSheet 
                isOpen={isGameOpen}
                onClose={() => setIsGameOpen(false)}
            />

            <SpotlightSearch 
                isOpen={isSpotlightOpen}
                onClose={() => setIsSpotlightOpen(false)}
            />

            <AuthModal 
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
            />

            {/* GLOBAL BOTTOM NAVIGATION */}
            <MoffiBottomNav 
                activeTab={searchParams?.get('tab') || (pathname?.startsWith('/profile') ? 'profile' : 'feed')}
                isVisible={isNavVisible}
                onTabChange={(tab) => {
                    if (pathname === '/community') {
                        window.dispatchEvent(new CustomEvent('moffi-change-tab', { detail: tab }));
                    } else {
                        router.push(`/community?tab=${tab}`);
                    }
                }}
            />
        </>
    );
}
