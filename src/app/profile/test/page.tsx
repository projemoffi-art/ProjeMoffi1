"use client";

import ProfileHeader from "@/components/profile/ProfileHeader";
import { Grid, Heart, Map, Settings } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Demo Data for UI Review
const MOCK_USER = {
    username: "moffi_official",
    fullName: "Moffi the Corgi",
    avatar: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400",
    cover: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200",
    bio: "Moffi'nin resmi temsilcisi! 🐾 Burada yeni rotalar keşfediyor, en iyi kemikleri puanlıyor ve sülalecek takılıyoruz. Tüm sorularınız için havlayabilirsiniz!",
    location: "İstanbul, TR",
    stats: {
        pack: 1240,
        following: 850,
        posts: 42
    },
    isOwnProfile: false
};

const TABS = [
    { id: 'posts', label: 'Anılar', icon: Grid },
    { id: 'maps', label: 'Rotalar', icon: Map },
    { id: 'liked', label: 'Favoriler', icon: Heart },
];

export default function ProfileTestPage() {
    const [activeTab, setActiveTab] = useState('posts');

    return (
        <main className="min-h-screen bg-[#050508] pt-24 pb-20 px-4">

            {/* Header Section */}
            <ProfileHeader user={MOCK_USER} />

            {/* Content Tabs */}
            <div className="max-w-4xl mx-auto mt-12">
                <div className="flex items-center justify-center gap-8 border-b border-white/5 pb-6">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 group transition-all relative",
                                activeTab === tab.id ? "text-white" : "text-gray-600 hover:text-white"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-indigo-500" : "group-hover:text-indigo-400")} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>

                            {activeTab === tab.id && (
                                <div className="absolute -bottom-6 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Empty State Grid (Showcasing Aesthetic) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="aspect-square bg-[#12121A] border border-white/5 animate-pulse relative group cursor-pointer overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-colors" />
                            <div className="absolute bottom-4 left-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="flex items-center gap-1 text-[10px] font-black text-white">
                                    <Heart className="w-3 h-3 text-red-500 fill-red-500" /> 1.2k
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </main>
    );
}
