"use client";

import { useState } from "react";
import { ArrowLeft, Trophy, Crown, Medal, Store, ChevronRight, Star, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Mock Data
const LEAGUES = [
    { id: "gold", name: "Altın Ligi", icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
    { id: "silver", name: "Gümüş Ligi", icon: Medal, color: "text-gray-300", bg: "bg-gray-400/20", border: "border-gray-400/30" },
    { id: "bronze", name: "Bronz Ligi", icon: Medal, color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30" },
];

const LEADERBOARD_DATA = {
    gold: [
        { id: 1, name: "Poyraz & Boncuk", points: 4250, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Poyraz" },
        { id: 2, name: "Selin & Moka", points: 3980, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Selin" },
        { id: 3, name: "Can & Duman", points: 3450, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Can" },
        { id: 4, name: "Merve & Şans", points: 2100, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Merve" },
        { id: 5, name: "Emre & Ares", points: 1950, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emre" },
    ],
    silver: [
        { id: 1, name: "Ali & Köpük", points: 2800, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali" },
        { id: 2, name: "Ayşe & Pamuk", points: 2600, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ayse" },
        { id: 3, name: "Burak & Tarçın", points: 2400, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Burak" },
    ],
    bronze: [
        { id: 1, name: "Zeynep & Limon", points: 1500, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zeynep" },
        { id: 2, name: "Mert & Çiko", points: 1200, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mert" },
        { id: 3, name: "Elif & Mia", points: 1100, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elif" },
    ]
};

const SPOTLIGHT_BUSINESSES = [
    { id: 1, name: "Espressolab Kadıköy", category: "Cafe", discount: "%20 İndirim", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop", visits: 1240 },
    { id: 2, name: "PetHaus Moda", category: "Pet Shop", discount: "2 Al 1 Öde", image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1000&auto=format&fit=crop", visits: 856 },
    { id: 3, name: "Pati Kuaför", category: "Bakım", discount: "%15 İndirim", image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1000&auto=format&fit=crop", visits: 645 },
];

export default function CompetitionPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'league' | 'spotlight'>('league');
    const [activeLeague, setActiveLeague] = useState<'bronze' | 'silver' | 'gold'>('gold');

    // Get current leaderboard data based on active league
    // @ts-ignore
    const currentData = LEADERBOARD_DATA[activeLeague];
    const top3 = currentData.slice(0, 3);
    const rest = currentData.slice(3);

    return (
        <main className="min-h-screen pb-24 font-sans max-w-md mx-auto relative overflow-hidden flex flex-col">

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/50 to-transparent pointer-events-none" />
            <div className="absolute top-[-10%] -right-20 w-80 h-80 bg-purple-600/30 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-[20%] -left-20 w-60 h-60 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 px-6 py-6 flex items-center justify-between">
                <button onClick={() => router.back()} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition border border-card-border">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full border border-card-border backdrop-blur-md">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/90">Competition Hub</span>
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </header>

            {/* Hub Switcher */}
            <div className="px-6 mb-8 relative z-10">
                <div className="flex p-1 bg-white/5 border border-card-border rounded-2xl backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('league')}
                        className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2", activeTab === 'league' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-white/50 hover:text-white")}
                    >
                        <Crown className="w-4 h-4" />
                        MoffiLeague
                    </button>
                    <button
                        onClick={() => setActiveTab('spotlight')}
                        className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2", activeTab === 'spotlight' ? "bg-card text-indigo-900 shadow-lg" : "text-white/50 hover:text-white")}
                    >
                        <Store className="w-4 h-4" />
                        Spotlight
                    </button>
                </div>
            </div>

            {activeTab === 'league' ? (
                // --- MOFFILEAGUE VIEW ---
                <div className="flex-1 px-6 relative z-10 flex flex-col">

                    {/* League Tiers Tabs */}
                    <div className="flex justify-between items-center mb-8 gap-2 relative z-30">
                        {LEAGUES.map((league) => {
                            const isActive = activeLeague === league.id;
                            return (
                                <button
                                    key={league.id}
                                    // @ts-ignore
                                    onClick={() => setActiveLeague(league.id)}
                                    className={cn(
                                        "flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                                        isActive ? `${league.bg} ${league.border}` : "bg-white/5 border-card-border hover:bg-white/10"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-full bg-white/10 mb-1", isActive ? "scale-110" : "scale-100")}>
                                        <league.icon className={cn("w-5 h-5", league.color)} />
                                    </div>
                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", isActive ? "text-white" : "text-white/40")}>
                                        {league.name.split(' ')[0]}
                                    </span>
                                    {isActive && <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />}
                                </button>
                            )
                        })}
                    </div>

                    {/* OLYMPIC PODIUM */}
                    <div className="flex items-end justify-center gap-3 mb-10 h-48">
                        {/* Silver (2nd) */}
                        <div className="flex flex-col items-center gap-2 w-1/3 animate-in slide-in-from-bottom duration-700 delay-100">
                            <div className="relative">
                                <img src={top3[1]?.avatar} className="w-14 h-14 rounded-full border-2 border-gray-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                                <div className="absolute -bottom-2 -right-1 bg-gray-300 text-foreground text-xs font-black w-5 h-5 flex items-center justify-center rounded-full border border-white">2</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-bold text-gray-300 truncate w-20">{top3[1]?.name.split(' ')[0]}</div>
                                <div className="text-[10px] font-bold text-white/50">{top3[1]?.points}p</div>
                            </div>
                            <div className="w-full h-24 bg-gradient-to-t from-gray-500/20 to-gray-500/5 rounded-t-xl border-t border-gray-500/30 backdrop-blur-sm" />
                        </div>

                        {/* Gold (1st) */}
                        <div className="flex flex-col items-center gap-2 w-1/3 -mt-6 z-10 animate-in slide-in-from-bottom duration-700">
                            <Crown className="w-6 h-6 text-yellow-400 mb-1 animate-bounce" />
                            <div className="relative">
                                <img src={top3[0]?.avatar} className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
                                <div className="absolute -bottom-3 -right-1 bg-yellow-400 text-yellow-900 text-sm font-black w-7 h-7 flex items-center justify-center rounded-full border-2 border-white">1</div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-bold text-yellow-100 truncate w-24">{top3[0]?.name.split(' ')[0]}</div>
                                <div className="text-xs font-bold text-yellow-500/80">{top3[0]?.points}p</div>
                            </div>
                            <div className="w-full h-32 bg-gradient-to-t from-yellow-500/30 to-yellow-500/10 rounded-t-xl border-t border-yellow-400/50 backdrop-blur-md relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                            </div>
                        </div>

                        {/* Bronze (3rd) */}
                        <div className="flex flex-col items-center gap-2 w-1/3 animate-in slide-in-from-bottom duration-700 delay-200">
                            <div className="relative">
                                <img src={top3[2]?.avatar} className="w-14 h-14 rounded-full border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
                                <div className="absolute -bottom-2 -right-1 bg-orange-500 text-white text-xs font-black w-5 h-5 flex items-center justify-center rounded-full border border-white">3</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-bold text-orange-200 truncate w-20">{top3[2]?.name.split(' ')[0]}</div>
                                <div className="text-[10px] font-bold text-white/50">{top3[2]?.points}p</div>
                            </div>
                            <div className="w-full h-16 bg-gradient-to-t from-orange-500/20 to-orange-500/5 rounded-t-xl border-t border-orange-500/30 backdrop-blur-sm" />
                        </div>
                    </div>

                    {/* Rank 4-10 List */}
                    <div className="flex-1 space-y-3 pb-8">
                        {rest.map((user, idx) => (
                            <div key={user.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-card-border backdrop-blur-sm hover:bg-white/10 transition group">
                                <div className="w-8 flex justify-center text-sm font-bold text-white/40">#{idx + 4}</div>
                                <img src={user.avatar} className="w-10 h-10 rounded-full border border-card-border" />
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition">{user.name}</div>
                                    <div className="text-xs text-white/40">Poodle • 2y</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-indigo-400">{user.points}</div>
                                    <div className="text-[9px] uppercase font-bold text-white/30">Puan</div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            ) : (
                // --- SPOTLIGHT VIEW ---
                <div className="flex-1 px-6 relative z-10 pb-8 space-y-6 animate-in fade-in slide-in-from-right duration-300">
                    <div className="text-center mb-2">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Haftanın Yıldız İşletmeleri</h2>
                        <p className="text-xs text-white/50">En çok ziyaret edilen premium noktalar</p>
                    </div>

                    {SPOTLIGHT_BUSINESSES.map((business, index) => (
                        <div key={business.id} className="group relative bg-[#131B2C] rounded-[2rem] overflow-hidden border border-card-border shadow-xl hover:scale-[1.02] transition-transform duration-300">
                            {/* Badge */}
                            <div className="absolute top-4 left-4 z-20 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                #{index + 1}
                            </div>

                            {/* Image */}
                            <div className="h-32 w-full relative">
                                <img src={business.image || "/api/placeholder/400/200"} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#131B2C] to-transparent" />
                                <div className="absolute bottom-3 left-4">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">{business.category}</div>
                                    <h3 className="text-lg font-black text-white">{business.name}</h3>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{business.visits}</div>
                                        <div className="text-[9px] text-white/40">Haftalık Ziyaret</div>
                                    </div>
                                </div>
                                <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition flex items-center gap-1">
                                    Fırsatı Gör
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </main>
    );
}
