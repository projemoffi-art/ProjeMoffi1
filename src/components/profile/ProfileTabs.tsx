'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Grid, Heart, BookOpen, 
    ShieldCheck, Users, Map,
    Wallet, Package, HeartPulse,
    PawPrint, Route, Gift, List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PassportTab } from "./PassportTab";
import { FamilyTab } from "./FamilyTab";
import { WalletTab } from "./WalletTab";
import { OrdersTab } from "./OrdersTab";
import { AppointmentsTab } from "./AppointmentsTab";
import { RoutesTab } from "./RoutesTab";
import { getMockPosts } from "@/lib/mockData";
import { PostViewerOverlay } from "./PostViewerOverlay";

interface ProfileTabsProps {
    userId: string;
    isOwnProfile: boolean;
    themeColor?: string;
    profileSettings?: any;
}

export default function ProfileTabs({ userId, isOwnProfile, themeColor = 'cyan', profileSettings }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState<'journal' | 'passport' | 'family' | 'activity' | 'wallet' | 'orders' | 'appointments'>('journal');
    const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

    const ALL_TABS = [
        { id: 'journal', label: 'Günlük', icon: Grid },
        { id: 'passport', label: 'Pasaport', icon: ShieldCheck, private: true },
        { id: 'family', label: 'Aile', icon: Users, private: true },
        { id: 'activity', label: 'Aktivite', icon: Route, private: true },
        { id: 'wallet', label: 'Cüzdan', icon: Wallet, private: true },
        { id: 'orders', label: 'Siparişler', icon: Gift, private: true },
        { id: 'appointments', label: 'Randevular', icon: HeartPulse, private: true },
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
            const targetTab = TABS.find(t => t.id === dest);
            if (targetTab) {
                setActiveTab(dest as any);
                if (window.innerWidth < 768) {
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                }
            }
        };

        window.addEventListener('moffi-navigate', handleNavigate);
        return () => window.removeEventListener('moffi-navigate', handleNavigate);
    }, [TABS]);

    const userPosts = getMockPosts(userId);

    return (
        <div className="w-full">
            {/* STICKY TAB BAR */}
            <div className="sticky top-0 bg-background/80 backdrop-blur-xl z-40 border-b border-card-border overflow-x-auto no-scrollbar">
                <div className="max-w-screen-xl mx-auto px-4">
                    <div className="flex items-center gap-1 sm:gap-4 min-w-max py-2">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id as any);
                                        if (window.innerWidth < 768) {
                                            window.scrollTo({ top: 380, behavior: 'smooth' });
                                        }
                                    }}
                                    className={cn(
                                        "relative flex items-center gap-2 px-4 py-4 group transition-all active:scale-95 shrink-0",
                                        isActive ? "text-foreground" : "text-secondary hover:text-foreground"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                                        isActive ? "bg-accent/10 text-accent scale-110" : "bg-foreground/5 text-secondary group-hover:bg-foreground/10"
                                    )}>
                                        <Icon className={cn("w-4.5 h-4.5", isActive ? "stroke-[2.5]" : "stroke-2")} />
                                    </div>
                                    
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
                                        isActive ? "opacity-100" : "opacity-0 w-0 overflow-hidden sm:opacity-50 sm:w-auto"
                                    )}>
                                        {tab.label}
                                    </span>

                                    {isActive && (
                                        <motion.div
                                            layoutId="profileTabIndicator"
                                            className="absolute bottom-0 left-4 right-4 h-1 bg-accent rounded-t-full shadow-[0_-4px_12px_rgba(var(--accent-rgb),0.5)]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[400px] mt-8 px-4 sm:px-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {activeTab === 'journal' && (
                            <div className="grid grid-cols-3 gap-1 md:gap-6">
                                {userPosts.length > 0 ? (
                                    userPosts.map((post, index) => (
                                        <motion.div 
                                            key={post.id}
                                            whileHover={{ scale: 0.98 }}
                                            onClick={() => setSelectedPostIndex(index)}
                                            className="aspect-square rounded-2xl sm:rounded-[2.5rem] overflow-hidden bg-white/5 border border-card-border relative group cursor-pointer"
                                        >
                                            <img src={post.media_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={post.caption} />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <div className="flex items-center gap-1.5 text-white">
                                                    <Heart className="w-4 h-4 fill-white" />
                                                    <span className="text-xs font-black">{post.likes_count}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full flex flex-col items-center justify-center py-24 bg-foreground/5 border border-card-border rounded-[3.5rem]">
                                        <Grid className="w-12 h-12 text-secondary mb-6 opacity-20" />
                                        <p className="text-secondary font-black uppercase tracking-[0.3em] text-[10px]">Henüz Paylaşım Yok</p>
                                    </div>
                                )}
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
                        {activeTab === 'activity' && <RoutesTab routes={[]} activePet={{ name: 'Pati' }} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {selectedPostIndex !== null && (
                <PostViewerOverlay 
                    posts={userPosts}
                    initialIndex={selectedPostIndex} 
                    onClose={() => setSelectedPostIndex(null)} 
                />
            )}
        </div>
    );
}
