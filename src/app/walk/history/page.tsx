"use client";

import { useState } from "react";
import { ArrowLeft, Trophy, Calendar, TrendingUp, Lock, MapPin, Clock, Footprints, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSocial } from "@/context/SocialContext";
import { useActivity } from "@/context/ActivityContext";
import { cn } from "@/lib/utils";

// Mock History Data with "Map" visuals
// Mock History Data (Fallback)
const MOCK_HISTORY_WALKS = [
    { id: 'm1', date: "Dün, 18:15", duration: "32dk", distance: "2.1km", steps: 3800, mapImage: "https://img.freepik.com/free-vector/gps-navigation-screen-design_23-2148512133.jpg" },
    { id: 'm2', date: "7 Ara, 08:00", duration: "60dk", distance: "5.5km", steps: 8200, mapImage: "https://img.freepik.com/free-vector/dashboard-interface-user-panel-template_23-2148545800.jpg" },
];

export default function WalkHistoryPage() {
    const router = useRouter();
    const { currentUser } = useSocial();
    const { walkHistory } = useActivity();
    const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');

    // Combine real history with mock data for a richer look
    const displayWalks = [...walkHistory, ...MOCK_HISTORY_WALKS];

    return (
        <main className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans flex flex-col border-x border-gray-100">

            {/* Header */}
            <div className="bg-white px-6 py-6 border-b border-gray-100 sticky top-0 z-20">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 font-poppins">Yürüyüş Geçmişi</h1>
                    <div className="w-10" />
                </div>

                {/* Tabs */}
                <div className="p-1 bg-gray-100 rounded-2xl flex relative">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-xs font-bold transition-all relative z-10",
                            activeTab === 'list' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Yürüyüşlerim
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-xs font-bold transition-all relative z-10",
                            activeTab === 'stats' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        İstatistikler
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">

                {activeTab === 'list' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {displayWalks.map((walk) => (
                            <div key={walk.id} className="bg-white rounded-[2rem] p-3 shadow-md border border-gray-100 group hover:scale-[1.02] transition-transform">
                                {/* Map Visual Area */}
                                <div className="h-32 w-full rounded-[1.5rem] bg-gray-100 relative overflow-hidden mb-3">
                                    <img src={(walk as any).mapImage || "https://img.freepik.com/free-vector/city-map-navigation-app_23-2148530386.jpg"} className="w-full h-full object-cover opacity-80 mix-blend-multiply" />

                                    {/* Overlay Path (Simulated or Real Path visualization) */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M10,90 Q30,60 50,50 T90,20" fill="none" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" strokeDasharray="5,5" className="animate-pulse" />
                                        <circle cx="90" cy="20" r="3" fill="#4F46E5" />
                                        <circle cx="10" cy="90" r="3" fill="#10B981" />
                                    </svg>

                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-gray-800 shadow-sm border border-gray-100">
                                        {walk.date}
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="flex items-center justify-between px-2 pb-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                                            <Footprints className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-gray-800">{walk.steps}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Adım</div>
                                        </div>
                                    </div>

                                    <div className="h-8 w-px bg-gray-100" />

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-gray-800">{walk.duration}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Süre</div>
                                        </div>
                                    </div>

                                    <div className="h-8 w-px bg-gray-100" />

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-gray-800">{walk.distance}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Mesafe</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="text-center py-20 opacity-50">
                        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-sm font-bold text-gray-500">Detaylı grafikler hazırlanıyor...</p>
                    </div>
                )}

            </div>
        </main>
    );
}
