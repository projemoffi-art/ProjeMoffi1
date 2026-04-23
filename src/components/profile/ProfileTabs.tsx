"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Grid, Heart, BookOpen, 
    ShieldCheck, Users, Map,
    Wallet, Package, HeartPulse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PassportTab } from "./PassportTab";
import { FamilyTab } from "./FamilyTab";
import { WalletTab } from "./WalletTab";
import { OrdersTab } from "./OrdersTab";
import { AppointmentsTab } from "./AppointmentsTab";
import { RoutesTab } from "./RoutesTab";
import { PetSettingsModal } from "./PetSettingsModal";

interface ProfileTabsProps {
    userId: string;
    isOwnProfile: boolean;
    themeColor?: string;
    profileSettings?: any;
}

export default function ProfileTabs({ userId, isOwnProfile, themeColor = 'cyan', profileSettings }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState<'journal' | 'passport' | 'family' | 'routes' | 'wallet' | 'orders' | 'appointments'>('journal');

    const ALL_TABS = [
        { id: 'journal', label: 'Günlük', icon: BookOpen },
        { id: 'passport', label: 'Pasaport', icon: ShieldCheck, private: true },
        { id: 'family', label: 'Aile', icon: Users, private: true },
        { id: 'wallet', label: 'Cüzdan', icon: Wallet, private: true },
        { id: 'orders', label: 'Siparişler', icon: Package, private: true },
        { id: 'appointments', label: 'Randevular', icon: HeartPulse, private: true },
        { id: 'routes', label: 'Rotalar', icon: Map, private: true },
    ];

    const TABS = ALL_TABS.filter(tab => {
        if (!tab.private) return true;
        if (isOwnProfile) return true;
        
        // Private tabs are hidden for visitors unless explicitly allowed in settings
        if (tab.id === 'passport') return profileSettings?.privacy?.showPassport;
        // Other tabs stay private by default
        return false;
    });

    // Dynamic color mapping
    const colorMap = {
        cyan: "text-cyan-400",
        purple: "text-purple-400",
        orange: "text-orange-400",
        blue: "text-blue-400"
    };
    const activeColor = colorMap[themeColor as keyof typeof colorMap] || "text-cyan-400";

    // Global Navigation Listener
    React.useEffect(() => {
        const handleNavigate = (e: any) => {
            const dest = e.detail;
            if (TABS.find(t => t.id === dest)) {
                setActiveTab(dest);
                // Smooth scroll to top of tabs if needed
                window.scrollTo({ top: 400, behavior: 'smooth' });
            }
        };

        window.addEventListener('moffi-navigate', handleNavigate);
        return () => window.removeEventListener('moffi-navigate', handleNavigate);
    }, []);

    return (
        <div className="w-full space-y-8">
            {/* Tab Navigation */}
            <div className="flex items-center justify-center gap-1.5 p-1.5 bg-white/5 border border-white/10 rounded-[2rem] w-fit mx-auto backdrop-blur-xl overflow-x-auto no-scrollbar max-w-full">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            console.log(`Switching to tab: ${tab.id}`);
                            setActiveTab(tab.id as any);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all relative overflow-hidden group shrink-0",
                            activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div 
                                layoutId="active-tab-bg"
                                className="absolute inset-0 bg-white/10 group-active:scale-95 transition-transform"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        {tab.icon && <tab.icon className={cn("w-3.5 h-3.5", activeTab === tab.id ? activeColor : "text-gray-600")} />}
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="min-h-[400px]"
                    >
                        {activeTab === 'journal' && (
                            <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-[3.5rem]">
                                <Grid className="w-12 h-12 text-gray-700 mb-6 opacity-20" />
                                <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs">Henüz Paylaşım Yok</p>
                            </div>
                        )}
                        {activeTab === 'passport' && <PassportTab isPublic={!isOwnProfile} />}
                        {activeTab === 'family' && <FamilyTab userId={userId} />}
                        {activeTab === 'wallet' && <WalletTab />}
                        {activeTab === 'orders' && <OrdersTab orders={[]} />}
                        {activeTab === 'appointments' && (
                            <AppointmentsTab 
                                userId={userId} 
                                allRecords={[]} 
                                currentAppointments={[]}
                                recordDocuments={{}}
                            />
                        )}
                        {activeTab === 'routes' && <RoutesTab userId={userId} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
