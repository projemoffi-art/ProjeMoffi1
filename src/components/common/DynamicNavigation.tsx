"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from 'next/dynamic';
import { FloatingControls } from "@/components/common/FloatingControls";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";

// Lazy loaded components for better performance
const ActionHubDrawer = dynamic(() => import("@/components/community/ActionHubDrawer").then(mod => mod.ActionHubDrawer), { ssr: false });
const AuraStyleStudio = dynamic(() => import("@/components/profile/AuraStyleStudio"), { ssr: false });
const WalkQuickSheet = dynamic(() => import("@/components/walk/WalkQuickSheet").then(mod => mod.WalkQuickSheet), { ssr: false });
const SettingsDrawer = dynamic(() => import("@/components/community/SettingsDrawer").then(mod => mod.SettingsDrawer), { ssr: false });


const HIDDEN_ROUTES = ['/studio', '/lab', '/production-studio'];

export function DynamicNavigation() {
    const pathname = usePathname();
    const { user } = useAuth();
    
    // ACTION HUB (Zap Icon) is global
    const [isActionHubOpen, setIsActionHubOpen] = useState(false);
    
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [isWalkOpen, setIsWalkOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [auraSettings, setAuraSettings] = useState({
        fontFamily: 'font-sans',
        frameStyle: 'minimal' as 'minimal' | 'glass' | 'neon' | 'metal',
        accentColor: 'default',
        badges: ['verified']
    });

    // Sync local settings with user profile - STABLE JSON DEPS
    useEffect(() => {
        if (user?.aura_settings) {
            setAuraSettings(user.aura_settings);
        }
    }, [user?.id, JSON.stringify(user?.aura_settings)]);

    const handleUpdateAuraSettings = async (newSettings: any) => {
        setAuraSettings(newSettings);
        try {
            await apiService.updateAuraSettings(newSettings);
        } catch (err) {
            console.error("Failed to persist aura settings:", err);
        }
    };

    // Global Event Listeners for Drawers
    useEffect(() => {
        const handleOpenActionHub = () => {
            setIsSettingsOpen(false);
            setIsStudioOpen(false);
            setIsWalkOpen(false);
            setIsActionHubOpen(true);
        };

        const handleOpenStudio = () => {
            setIsActionHubOpen(false);
            setIsSettingsOpen(false);
            setIsWalkOpen(false);
            setIsStudioOpen(true);
        };

        const handleOpenWalk = () => {
            setIsActionHubOpen(false);
            setIsSettingsOpen(false);
            setIsStudioOpen(false);
            setIsWalkOpen(true);
        };

        const handleOpenSettings = () => {
            setIsActionHubOpen(false);
            setIsStudioOpen(false);
            setIsWalkOpen(false);
            setIsSettingsOpen(true);
        };

        window.addEventListener('open-moffi-hub', handleOpenActionHub);
        window.addEventListener('open-aura-studio', handleOpenStudio);
        window.addEventListener('open-walk-panel', handleOpenWalk);
        window.addEventListener('open-moffi-settings', handleOpenSettings);

        return () => {
            window.removeEventListener('open-moffi-hub', handleOpenActionHub);
            window.removeEventListener('open-aura-studio', handleOpenStudio);
            window.removeEventListener('open-walk-panel', handleOpenWalk);
            window.removeEventListener('open-moffi-settings', handleOpenSettings);
        };
    }, []);

    // Hide global components on studio/lab/walk routes
    const shouldHide = pathname && HIDDEN_ROUTES.some(route => pathname.startsWith(route));

    if (shouldHide) return null;

    return (
        <>
            <FloatingControls />

            {/* (Zap) ACTION HUB - PERSONAL IDENTITY (Wallet, Passport, Family) */}
            <ActionHubDrawer 
                isOpen={isActionHubOpen}
                onClose={() => setIsActionHubOpen(false)}
                onNavigate={(id) => {
                    setIsActionHubOpen(false);
                    window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: id }));
                }}
            />

            <AuraStyleStudio 
                isOpen={isStudioOpen}
                onClose={() => setIsStudioOpen(false)}
                isPremium={user?.role === 'admin' || user?.is_pro === true}
                currentSettings={auraSettings}
                onUpdateSettings={handleUpdateAuraSettings}
            />

            <WalkQuickSheet 
                isOpen={isWalkOpen}
                onClose={() => setIsWalkOpen(false)}
            />

            <SettingsDrawer 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    );
}
