"use client";

import { useState, useEffect } from "react";
import { Store, ChevronRight, MapPin } from "lucide-react";
import { walkService, WalkDeal } from "@/services/WalkService";

export function WalkDeals() {
    const [deals, setDeals] = useState<WalkDeal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDeals = async () => {
            try {
                const data = await walkService.getNearbyDeals();
                setDeals(data);
            } catch (err) {
                console.error("Failed to load deals", err);
            } finally {
                setLoading(false);
            }
        };
        loadDeals();
    }, []);

    if (loading) {
        return <div className="pl-6 mb-8 text-sm text-gray-400">Fırsatlar yükleniyor...</div>;
    }

    return (
        <div className="mb-8 pl-6">
            <div className="flex items-center justify-between pr-6 mb-3">
                <h3 className="text-sm font-black text-foreground dark:text-white flex items-center gap-2 transition-colors">
                    <Store className="w-4 h-4 text-indigo-500" />
                    Walk Deals
                </h3>
                <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/50 px-2 py-1 rounded-lg transition-colors">Tümü</button>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex gap-4 overflow-x-auto pb-4 pr-6 scrollbar-hide">
                {deals.map((deal) => (
                    <div
                        key={deal.id}
                        className="min-w-[200px] h-[120px] rounded-[1.5rem] relative overflow-hidden flex-shrink-0 shadow-lg group cursor-pointer"
                    >
                        {/* Background Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${deal.color}`} />

                        {/* Content */}
                        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <span className="text-2xl">{deal.icon}</span>
                                <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                                    <MapPin className="w-2 h-2 text-white" />
                                    <span className="text-[9px] font-bold text-white">{deal.distance}</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-white font-bold text-sm leading-tight mb-1">{deal.title}</h4>
                                <p className="text-white/80 text-[10px] font-medium">{deal.business}</p>
                            </div>
                        </div>

                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-card opacity-0 group-hover:opacity-10 transition-opacity" />
                    </div>
                ))}
            </div>
        </div>
    );
}
