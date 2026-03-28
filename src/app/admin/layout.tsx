"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    LayoutDashboard, Megaphone, Map, BarChart3, Store, Settings, LogOut,
    Shield, Menu, X, ChevronRight, ChevronLeft, Building2, Wallet,
    AlertTriangle, Sliders, MessageSquare, Gamepad2, HeartPulse, Palette,
    PawPrint, Search, Users
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const MENU_GROUPS = [
    {
        group: "PLATFORM",
        items: [
            { title: "Genel Bakış", icon: LayoutDashboard, path: "/admin" },
            { title: "Analizler", icon: BarChart3, path: "/admin/analytics" },
        ]
    },
    {
        group: "ECOSYSTEM",
        items: [
            { title: "Topluluk & Keşfet", icon: Search, path: "/admin/moderation" },
            { title: "Sağlık & SOS", icon: HeartPulse, path: "/admin/health" },
            { title: "Yürüyüş & Oyun", icon: Gamepad2, path: "/admin/activity" },
        ]
    },
    {
        group: "COMMERCE",
        items: [
            { title: "Market & Mağaza", icon: Store, path: "/admin/market" },
            { title: "Sahiplendirme", icon: PawPrint, path: "/admin/adoption" },
            { title: "Moffi Studio", icon: Palette, path: "/admin/studio" },
        ]
    },
    {
        group: "ADMINISTRATION",
        items: [
            { title: "İşletme Yönetimi", icon: Building2, path: "/admin/businesses" },
            { title: "Kullanıcılar", icon: Users, path: "/admin/users" },
            { title: "Platform Finans", icon: Wallet, path: "/admin/platform-finance" },
            { title: "Geri Bildirimler", icon: MessageSquare, path: "/admin/feedbacks" },
            { title: "Sistem Ayarları", icon: Sliders, path: "/admin/platform-settings" },
        ]
    }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (!mounted || isLoading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050508] text-white">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="font-bold tracking-widest text-[10px] uppercase opacity-50">Sistem Yükleniyor...</p>
        </div>
    );

    const isAdmin = user?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-[#0A0A0E] border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full" />

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                            <Shield className="w-10 h-10 text-red-500" />
                        </div>

                        <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">ERİŞİM ENGELLENDİ</h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8">
                            Moffi Command Center'a erişim yetkiniz bulunmuyor. Lütfen yönetici hesabınızla giriş yaptığınızdan emin olun.
                        </p>

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-left mb-8">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                                <span>Mevcut Hesap</span>
                                <span className="text-red-400">Yetkisiz</span>
                            </div>
                            <p className="text-white font-bold truncate">{user?.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Rol: <span className="text-indigo-400 font-bold uppercase">{user?.role}</span></p>
                        </div>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm active:scale-95 transition-all"
                        >
                            Ana Sayfaya Dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050508] flex font-sans text-gray-400 selection:bg-indigo-500/30">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-md" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar (Command Center Style) */}
            <aside className={cn(
                "fixed top-0 left-0 h-screen bg-[#0A0A0E] border-r border-white/5 z-50 transition-all duration-300 flex flex-col overflow-hidden",
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                collapsed ? "lg:w-20" : "lg:w-72",
                "w-72" // Mobile width
            )}>
                {/* Logo Area */}
                <div className={cn("flex items-center gap-3 p-8", collapsed && "lg:justify-center lg:p-6")}>
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] flex-shrink-0 animate-pulse">
                        M
                    </div>
                    {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                        <div className={cn("flex flex-col", collapsed && "lg:hidden")}>
                            <span className="font-black text-white text-lg leading-none tracking-tighter">MOFFI</span>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">COMMAND</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto no-scrollbar">
                    {MENU_GROUPS.map((group) => (
                        <div key={group.group} className="space-y-4">
                            {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                                <h3 className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">
                                    {group.group}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            onClick={() => setSidebarOpen(false)}
                                            className={cn(
                                                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative",
                                                isActive
                                                    ? "bg-white/5 text-white border border-white/10"
                                                    : "text-gray-500 hover:text-white hover:bg-white/5",
                                                collapsed && "lg:justify-center lg:px-0"
                                            )}
                                        >
                                            <item.icon className={cn("w-5 h-5 transition-all", isActive ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" : "group-hover:text-indigo-400")} strokeWidth={isActive ? 2.5 : 2} />
                                            <span className={cn("text-sm font-bold tracking-tight", collapsed && "lg:hidden")}>{item.title}</span>

                                            {isActive && !collapsed && (
                                                <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
                                            )}

                                            {collapsed && (
                                                <div className="hidden lg:block absolute left-full ml-4 bg-[#12121A] text-white text-xs px-3 py-2 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-2xl">
                                                    {item.title}
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Profile */}
                <div className={cn("p-6 border-t border-white/5 bg-black/20 backdrop-blur-md", collapsed && "lg:p-4")}>
                    <div className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl transition-all group",
                        collapsed && "lg:justify-center lg:p-0 lg:w-12 lg:h-12 lg:mx-auto"
                    )}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center overflow-hidden border border-white/10 flex-shrink-0">
                            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : <span className="font-bold text-white">A</span>}
                        </div>
                        <div className={cn("flex-1 overflow-hidden", collapsed && "lg:hidden")}>
                            <div className="text-sm font-black text-white truncate">{user?.username || 'Admin'}</div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Secured</span>
                            </div>
                        </div>
                        <button onClick={() => { logout(); router.push('/'); }} className={cn("text-gray-600 hover:text-red-500 transition-colors", collapsed && "lg:hidden")}>
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex absolute -right-3 top-[100px] w-6 h-12 bg-[#0A0A0E] border border-white/5 rounded-full items-center justify-center text-gray-600 hover:text-white shadow-2xl z-50 transition-all hover:scale-110"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </aside>

            {/* Main Content Area */}
            <main className={
                cn(
                    "flex-1 min-w-0 transition-all duration-500 relative",
                    collapsed ? "lg:ml-20" : "lg:ml-72"
                )}>
                {/* Background Blobs for Atmosphere */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[0%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] left-[10%] w-[30%] h-[30%] bg-purple-600/5 blur-[120px] rounded-full" />
                </div>

                {/* Mobile Header */}
                <header className="lg:hidden bg-[#0A0A0E]/80 backdrop-blur-xl h-16 border-b border-white/5 flex items-center px-6 justify-between sticky top-0 z-[100]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)}>
                            <Menu className="w-6 h-6 text-white" />
                        </button>
                        <span className="font-black text-white tracking-tighter">MOFFI <span className="text-indigo-500">ADMIN</span></span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5" />
                </header>

                <div className="relative z-10 p-6 lg:p-12 max-w-[1600px] mx-auto min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    );
}
