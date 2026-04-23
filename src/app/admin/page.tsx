"use client";

import { useAuth } from "@/context/AuthContext";
import {
    Users, Plus, Zap, MessageSquare, AlertCircle,
    TrendingUp, Globe, Sparkles, Store, Dog, Building2, Map, Activity, Shield, Megaphone,
    Cpu, Radio, Fingerprint, Database, Rocket, LayoutDashboard
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from 'next/link';

// -- PREMIUM COMPONENTS --

const GlassCard = ({ children, className, glowColor = "rgba(99, 102, 241, 0.1)" }: any) => (
    <div className={cn(
        "relative overflow-hidden bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl",
        className
    )}>
        {/* Ambient Glow */}
        <div 
            className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] pointer-events-none rounded-full"
            style={{ backgroundColor: glowColor }}
        />
        <div className="relative z-10">{children}</div>
    </div>
);

const StatPulse = ({ label, value, icon: Icon, color, trend, delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="group relative"
    >
        <GlassCard className="p-7 border-white/10 hover:border-white/20 transition-all active:scale-[0.98]">
            <div className="flex items-start justify-between mb-6">
                <div className={cn("p-3 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6", color)}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 text-[10px] font-black text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20 shadow-[0_0_15px_rgba(74,222,128,0.1)]"
                    >
                        <TrendingUp className="w-3.5 h-3.5" />
                        {trend}
                    </motion.div>
                )}
            </div>

            <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">{value}</h3>
                    <motion.div 
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                    />
                </div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-2 translate-y-0 group-hover:text-white/50 transition-colors">{label}</p>
            </div>

            {/* SCAN LINE EFFECT */}
            <motion.div 
                className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
        </GlassCard>
    </motion.div>
);

export default function MoffiCoreDashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats] = useState({
        users: 1240,
        posts: 854,
        feedbacks: 42,
        sos: 3
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="space-y-12 pb-32 max-w-7xl mx-auto px-4 lg:px-0">
            {/* --- CORE CONTROL HEADER --- */}
            <div className="relative group">
                <div className="absolute -inset-10 bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-purple-500/10 blur-[80px] opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Core Active</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                                <Fingerprint className="w-3.5 h-3.5 text-white/40" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Admin Authorization: Valid</span>
                            </div>
                            <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                                {currentTime.toLocaleTimeString()} • {currentTime.toLocaleDateString()}
                            </div>
                        </div>

                        <div>
                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-6xl lg:text-8xl font-black text-white tracking-tighter flex flex-col uppercase leading-none"
                            >
                                <span className="opacity-40">Moffi</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40 italic drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                    Core Center
                                </span>
                            </motion.h1>
                            <p className="text-white/40 font-medium text-lg mt-4 max-w-xl">
                                Ecosystem synchronization and planetary synchronization protocol active. All systems within nominal parameters.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-5 bg-white text-black rounded-[2rem] font-black text-sm shadow-[0_20px_60px_rgba(255,255,255,0.2)] flex items-center gap-3 transition-all hover:pr-10 group"
                        >
                            <Megaphone className="w-5 h-5 transition-transform group-hover:-rotate-12" />
                            System Broadcast
                        </motion.button>
                        <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl relative group cursor-help">
                            <Activity className="w-6 h-6 text-white/40" />
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 rounded-[1.5rem] transition-opacity" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SYNCHRONIZED STATS GRID --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatPulse
                    label="Active Guardians"
                    value={stats.users.toLocaleString()}
                    icon={Users}
                    color="bg-cyan-500/10 text-cyan-400"
                    trend="+12%"
                    delay={0.1}
                />
                <StatPulse
                    label="Planetary Stories"
                    value={stats.posts.toLocaleString()}
                    icon={Database}
                    color="bg-purple-500/10 text-purple-400"
                    trend="+18%"
                    delay={0.2}
                />
                <StatPulse
                    label="Neural Feedback"
                    value={stats.feedbacks.toLocaleString()}
                    icon={Cpu}
                    color="bg-emerald-500/10 text-emerald-400"
                    delay={0.3}
                />
                <StatPulse
                    label="SOS Priority"
                    value={stats.sos}
                    icon={Rocket}
                    color="bg-red-500/10 text-red-500"
                    delay={0.4}
                />
            </div>

            {/* --- THE HUB: ACTION MATRICES --- */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* --- MODULE: MODERATION MATRIX --- */}
                <GlassCard className="xl:col-span-2 p-1 pt-12 group/matrix" glowColor="rgba(34, 211, 238, 0.05)">
                    <div className="px-10 pb-10">
                        <div className="flex items-center justify-between mb-12">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Moderation Matrix</h2>
                                <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em]">Synchronization Level: 99.8%</p>
                            </div>
                            <div className="flex gap-1">
                                {[1,2,3,4].map(i => <motion.div key={i} animate={{ height: [4, 12, 4] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }} className="w-1 bg-cyan-500/30 rounded-full" />)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { title: "Content Moderation", desc: "Review reported data nodes and social echoes.", icon: Shield, action: "Launch", href: "/admin/moderation" },
                                { title: "Guardian Control", desc: "Authorize or suspend planetary agents.", icon: Fingerprint, action: "Access", href: "/admin/users" },
                                { title: "Ecosystem Alerts", desc: "Manage priority broadcasts and SOS signals.", icon: Radio, action: "Sync", href: "/admin/alerts" },
                                { title: "Nexus Metrics", desc: "Deep dive into behavioral trend analysis.", icon: TrendingUp, action: "Analyze", href: "/admin/analytics" }
                            ].map((item, i) => (
                                <Link href={item.href || '#'} key={i} className="group/item">
                                    <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.08] hover:border-white/10 transition-all active:scale-[0.97]">
                                        <div className="flex items-center gap-5 mb-5">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover/item:bg-white/10 group-hover/item:border-white/20 transition-all">
                                                <item.icon className="w-5 h-5 text-white/60 group-hover/item:text-white" />
                                            </div>
                                            <div className="flex flex-col">
                                                <h4 className="font-black text-white text-[15px] uppercase tracking-wide">{item.title}</h4>
                                                <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Sub-Module 0{i+1}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/30 mb-8 leading-relaxed font-medium">{item.desc}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{item.action} Matrix</span>
                                            <Plus className="w-4 h-4 text-white/20 group-hover/item:rotate-90 group-hover/item:text-white transition-all" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </GlassCard>

                {/* --- MODULE: SYSTEM STATUS --- */}
                <div className="flex flex-col gap-8">
                    <GlassCard className="flex-1 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black p-10 group" glowColor="rgba(139, 92, 246, 0.2)">
                        <div className="h-full flex flex-col justify-between">
                            <div>
                                <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center mb-10 border border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-4 uppercase">Care Protocol</h3>
                                <p className="text-white/40 text-sm leading-relaxed font-medium">
                                    Manage veterinary verifications, health credentials, and priority medical signals.
                                </p>
                            </div>

                            <div className="mt-16 space-y-4">
                                <motion.button 
                                    whileHover={{ y: -5 }}
                                    className="w-full py-5 bg-white text-black rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all"
                                >
                                    Live SOS Interface
                                </motion.button>
                                <motion.button 
                                    whileHover={{ y: -5 }}
                                    className="w-full py-5 bg-white/5 border border-white/10 rounded-[1.5rem] font-black text-xs text-white/60 uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Vet Credentials (8)
                                </motion.button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* --- BOTTOM GRID: COMMERCE & EXPLORATORY --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* --- MODULE: MARKET NODE --- */}
                <GlassCard className="p-10" glowColor="rgba(245, 158, 11, 0.05)">
                    <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Market Node</h2>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Commerce Synchronization active</p>
                        </div>
                        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <Store className="w-7 h-7 text-amber-500" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: "Adoption Verifications", val: "12 Node", icon: Dog, color: "text-amber-400" },
                            { title: "Merchant Admissions", val: "3 Node", icon: Building2, color: "text-blue-400" },
                            { title: "Reported Exchanges", val: "Status: Nominal", icon: Shield, color: "text-green-400" }
                        ].map((item, i) => (
                            <motion.div 
                                key={i} 
                                whileHover={{ x: 5 }}
                                className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-colors group-hover:bg-white/10">
                                        <item.icon className={cn("w-5 h-5", item.color)} />
                                    </div>
                                    <span className="font-black text-white/80 text-sm uppercase tracking-wide group-hover:text-white transition-colors">{item.title}</span>
                                </div>
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">{item.val}</span>
                            </motion.div>
                        ))}
                    </div>
                </GlassCard>

                {/* --- MODULE: EXPLORATION MATRIX --- */}
                <GlassCard className="p-10" glowColor="rgba(34, 197, 94, 0.05)">
                    <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Quest Matrix</h2>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Active route monitoring protocol</p>
                        </div>
                        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                            <Map className="w-7 h-7 text-green-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.08] transition-all">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Live Reroutes</p>
                            <h4 className="text-5xl font-black text-white tracking-tighter">42</h4>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-green-500 font-bold uppercase">Active Pathing</span>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.08] transition-all">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Pending Quests</p>
                            <h4 className="text-5xl font-black text-white tracking-tighter">7</h4>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                <span className="text-[10px] text-cyan-500 font-bold uppercase">Awaiting Sync</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>

            </div>
        </div>
    );
}
