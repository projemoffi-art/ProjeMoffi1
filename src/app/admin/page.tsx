"use client";

import { useAuth } from "@/context/AuthContext";
import {
    Users, Eye, MousePointer2, Megaphone, Plus, Wallet, MapPin,
    Shield, Activity, Zap, MessageSquare, Heart, AlertCircle,
    TrendingUp, Globe, Sparkles, Store, Dog, Building2, Map
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// -- COMPONENTS --

const StatPulse = ({ label, value, icon: Icon, color, trend }: any) => (
    <div className="relative group bg-[#12121A] border border-white/5 rounded-[2rem] p-6 overflow-hidden transition-all hover:border-white/10 hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-[0.98]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />

        <div className="relative z-10">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", color)}>
                <Icon className="w-6 h-6" />
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-3xl font-black text-white mb-1 tracking-tight">{value}</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{label}</p>
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">
                        <TrendingUp className="w-3 h-3" />
                        {trend}
                    </div>
                )}
            </div>
        </div>
    </div>
);

export default function MoffiCommandCenter() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        users: 0,
        posts: 0,
        feedbacks: 0,
        sos: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Use Promise.all for parallel execution - much faster!
                const [userRes, postRes, fbRes] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('posts').select('*', { count: 'exact', head: true }),
                    supabase.from('feedbacks').select('*', { count: 'exact', head: true })
                ]);

                setStats({
                    users: userRes.count || 1240,
                    posts: postRes.count || 854,
                    feedbacks: fbRes.count || 42,
                    sos: 3
                });
            } catch (error) {
                console.error("Stats fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-10 pb-20">
            {/* Mission Control Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-white/5">
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">
                            Live System
                        </div>
                        <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">MCC v1.0.4</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter leading-none mb-2">
                        MOFFI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">COMMAND CENTER</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Platformun tüm kalbi ve kontrolü senin ellerinde.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-xl">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Sistem Durumu</p>
                            <p className="text-xs font-bold text-green-400">Tüm Servisler Aktif</p>
                        </div>
                    </div>
                    <button className="bg-white text-black px-8 py-4 rounded-2xl font-black text-sm shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Sistem Duyurusu Yayınla
                    </button>
                </div>
            </div>

            {/* Pulsing Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatPulse
                    label="Aktif Kullanıcı"
                    value={stats.users.toLocaleString()}
                    icon={Users}
                    color="bg-blue-500/10 text-blue-400"
                    trend="+12%"
                />
                <StatPulse
                    label="Günlük Paylaşım"
                    value={stats.posts.toLocaleString()}
                    icon={Sparkles}
                    color="bg-purple-500/10 text-purple-400"
                    trend="+18%"
                />
                <StatPulse
                    label="Geri Bildirimler"
                    value={stats.feedbacks.toLocaleString()}
                    icon={MessageSquare}
                    color="bg-cyan-500/10 text-cyan-400"
                />
                <StatPulse
                    label="SOS Alarmları"
                    value={stats.sos}
                    icon={AlertCircle}
                    color="bg-red-500/10 text-red-500"
                />
            </div>

            {/* Visual Control Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Module Control: Community */}
                <div className="xl:col-span-2 bg-[#12121A] rounded-[3rem] border border-white/5 p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Globe className="w-64 h-64 text-blue-500" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Topluluk Navigasyonu</h2>
                                <p className="text-gray-500 text-sm font-medium">Platformdaki etkileşim ve moderasyon odağı.</p>
                            </div>
                            <div className="flex gap-2">
                                <Activity className="w-6 h-6 text-indigo-500 animate-pulse" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { title: "İçerik Moderasyonu", desc: "Raporlanan postları ve yorumları incele.", icon: Shield, action: "İncele" },
                                { title: "Kullanıcı Yönetimi", desc: "Üyeleri yetkilendir veya askıya al.", icon: Users, action: "Yönet" },
                                { title: "Reklam & Sponsor", desc: "Sponsorlu içerikleri kontrol et.", icon: Megaphone, action: "Ayarlar" },
                                { title: "Trend Analizi", desc: "En popüler mood ve hashtagler.", icon: TrendingUp, action: "Görüntele" }
                            ].map((item, i) => (
                                <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                                            <item.icon className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <h4 className="font-bold text-white">{item.title}</h4>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">{item.desc}</p>
                                    <button className="w-full py-3 bg-white/5 rounded-xl text-xs font-black text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all uppercase tracking-widest">
                                        {item.action}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* System Focus Card */}
                <div className="flex flex-col gap-6">
                    <div className="flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-10 text-white relative flex flex-col justify-between shadow-2xl shadow-indigo-500/20 group">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none" />

                        <div>
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20 group-hover:scale-110 transition-transform">
                                <Heart className="w-7 h-7 text-white fill-white" />
                            </div>
                            <h3 className="text-4xl font-black mb-4 tracking-tighter leading-none">Moffi Care & SOS</h3>
                            <p className="text-indigo-100/70 text-sm leading-relaxed font-medium">
                                Acil durum bildirimleri, veteriner doğrulamaları ve pet sağlığı sistemini tek tıkla yönet.
                            </p>
                        </div>

                        <div className="mt-10 space-y-3">
                            <button className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:shadow-xl active:scale-95 transition-all">
                                Canlı SOS Haritasını Aç
                            </button>
                            <button className="w-full py-5 bg-white/10 backdrop-blur-md rounded-2xl font-bold text-sm text-white hover:bg-white/20 transition-all border border-white/10">
                                Veteriner Onayları (8)
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Second Row: Store & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Module: Store & Marketplace */}
                <div className="bg-[#12121A] rounded-[3rem] border border-white/5 p-10 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">Pazar Yeri & İlanlar</h2>
                            <p className="text-gray-500 text-sm font-medium">Sahiplendirme ve ürün trafiği kontrolü.</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                            <Store className="w-6 h-6 text-amber-500" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: "Sahiplendirme Onayları", val: "12 Bekliyor", icon: Dog, color: "text-amber-400" },
                            { title: "Mağaza Başvuruları", val: "3 Yeni", icon: Building2, color: "text-blue-400" },
                            { title: "Raporlanan İlanlar", val: "0 Temiz", icon: Shield, color: "text-green-400" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/item">
                                <div className="flex items-center gap-4">
                                    <item.icon className={cn("w-5 h-5", item.color)} />
                                    <span className="font-bold text-white group-hover/item:translate-x-1 transition-transform">{item.title}</span>
                                </div>
                                <span className="text-[10px] font-black text-gray-500 uppercase">{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Module: Walk & Activity */}
                <div className="bg-[#12121A] rounded-[3rem] border border-white/5 p-10 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">Yürüyüş & Quest</h2>
                            <p className="text-gray-500 text-sm font-medium">Aktif rotalar ve oyunlaştırılmış görevler.</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                            <Map className="w-6 h-6 text-green-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-[2rem] border border-white/5">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Canlı Rotalar</p>
                            <h4 className="text-2xl font-black text-white">42</h4>
                            <p className="text-xs text-green-500 mt-1 font-bold">Aktif Yürüyüş</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-[2rem] border border-white/5">
                            <p className="text-[10px] font-black text-black/40 uppercase mb-2">Bekleyen Quest</p>
                            <h4 className="text-2xl font-black text-white">7</h4>
                            <p className="text-xs text-indigo-400 mt-1 font-bold">Onay Bekliyor</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
