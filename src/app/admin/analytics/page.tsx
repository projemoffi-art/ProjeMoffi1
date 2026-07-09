"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Activity, Target, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";

const GlassCard = ({ children, className }: any) => (
    <div className={cn(
        "relative overflow-hidden bg-[#0A0A0E]/80 backdrop-blur-3xl border border-card-border rounded-[2.5rem] shadow-2xl",
        className
    )}>
        {children}
    </div>
);

export default function AnalyticsPage() {
    const { getAllUsers } = useAuth();
    const [timeframe, setTimeframe] = useState('7d');
    const [stats, setStats] = useState({
        users: 0,
        adoptions: 0,
        sos: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setIsLoading(true);
                const [users, adoptions, lostPets] = await Promise.all([
                    getAllUsers(),
                    apiService.getAdoptions(),
                    apiService.getLostPets()
                ]);
                
                setStats({
                    users: users.length,
                    adoptions: adoptions.length,
                    sos: lostPets.length
                });
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    return (
        <div className="space-y-12 pb-32 max-w-7xl mx-auto px-4 lg:px-0">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="relative flex flex-col gap-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <BarChart3 className="w-8 h-8 text-indigo-400" />
                    </div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-none"
                    >
                        Analizler
                    </motion.h1>
                    <p className="text-white/40 font-medium text-lg max-w-xl">
                        Platform metrikleri, büyüme oranları ve kullanıcı etkileşim yoğunlukları.
                    </p>
                </div>

                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1">
                    {['24h', '7d', '30d', 'All Time'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                timeframe === t ? "bg-indigo-500 text-white shadow-lg" : "text-white/40 hover:text-white"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Aktif Kullanıcı", val: stats.users, trend: "+14%", icon: Users, color: "text-cyan-400" },
                    { title: "Sahiplendirme", val: stats.adoptions, trend: "+5%", icon: Target, color: "text-emerald-400" },
                    { title: "SOS Çözüm", val: stats.sos, trend: "+22%", icon: Zap, color: "text-rose-400" },
                ].map((stat, i) => (
                    <GlassCard key={i} className="p-8">
                        <div className="flex items-start justify-between mb-8">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-[10px] font-black">{stat.trend}</span>
                        </div>
                        <h4 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{stat.title}</h4>
                        <div className="text-4xl font-black text-white">
                            {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-white/40 mt-1" /> : stat.val}
                        </div>
                    </GlassCard>
                ))}
            </div>

            <GlassCard className="p-8 h-[400px] flex flex-col">
                <h3 className="text-white font-black uppercase tracking-widest mb-8">Etkileşim Grafiği (Demo)</h3>
                <div className="flex-1 border-b border-l border-white/10 flex items-end justify-between p-4 gap-2">
                    {[40, 70, 45, 90, 65, 85, 100, 75, 50, 80, 95, 60].map((height, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.05 }}
                            className="w-full bg-gradient-to-t from-indigo-500/20 to-indigo-500 hover:to-indigo-400 rounded-t-sm relative group cursor-pointer"
                        >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {height * 120}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
