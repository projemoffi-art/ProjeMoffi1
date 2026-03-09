"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Megaphone, Map, BarChart3, Store, Settings, LogOut, Shield, Menu, X, ChevronRight, ChevronLeft, Building2, Wallet, AlertTriangle, Sliders } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
    { title: "Genel Bakış", icon: LayoutDashboard, path: "/admin" },
    { title: "İşletme Yönetimi", icon: Building2, path: "/admin/businesses" },
    { title: "Platform Finans", icon: Wallet, path: "/admin/platform-finance" },
    { title: "Moderasyon", icon: AlertTriangle, path: "/admin/moderation" },
    { title: "Kampanyalar", icon: Megaphone, path: "/admin/campaigns" },
    { title: "Walk Quest", icon: Map, path: "/admin/quests" },
    { title: "Analizler", icon: BarChart3, path: "/admin/analytics" },
    { title: "Platform Ayarları", icon: Sliders, path: "/admin/platform-settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            // Allow admin OR known admin emails
            const ADMIN_EMAILS = ['moffidestek@gmail.com', 'projemoffi@gmail.com']; // Buraya kendi e-postanı ekle
            const isAdmin = user?.role === 'admin' || ADMIN_EMAILS.includes(user?.email || '');
            if (!user || !isAdmin) {
                router.push('/');
            }
        }
    }, [user, isLoading, router]);

    if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50">Yükleniyor...</div>;
    const ADMIN_EMAILS = ['moffidestek@gmail.com', 'projemoffi@gmail.com'];
    const isAdmin = user?.role === 'admin' || ADMIN_EMAILS.includes(user?.email || '');
    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-[#F8F9FC] flex font-sans text-gray-900">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar (Business Style) */}
            <aside className={cn(
                "fixed top-0 left-0 h-screen bg-white border-r border-gray-100 z-50 transition-all duration-300 shadow-xl shadow-indigo-50/50 flex flex-col",
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                collapsed ? "lg:w-20" : "lg:w-72",
                "w-72" // Mobile width
            )}>
                {/* Logo Area */}
                <div className={cn("flex items-center gap-3 p-6", collapsed && "lg:justify-center lg:p-4")}>
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-200 flex-shrink-0">
                        ⚡
                    </div>
                    {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                        <div className={cn("flex flex-col", collapsed && "lg:hidden")}>
                            <span className="font-bold text-gray-900 text-lg leading-none">MoffiAdmin</span>
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1">Super Admin</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                                    collapsed && "lg:justify-center lg:px-0"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 transition-colors flex-shrink-0", isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
                                <span className={cn("text-sm font-medium", collapsed && "lg:hidden")}>{item.title}</span>
                                {isActive && (
                                    <div className={cn("ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600", collapsed && "lg:hidden")} />
                                )}

                                {/* Collapse Tooltip */}
                                {collapsed && (
                                    <div className="hidden lg:block absolute left-full ml-4 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                        {item.title}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-100 rounded-full items-center justify-center text-gray-400 hover:text-indigo-600 shadow-sm z-50"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>

                {/* User Profile */}
                <div className={cn("p-4 border-t border-gray-100", collapsed && "lg:p-2")}>
                    <div className={cn(
                        "flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition group",
                        collapsed && "lg:justify-center lg:p-0 lg:w-10 lg:h-10 lg:mx-auto"
                    )}>
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                            {user?.avatar ? <Image src={user.avatar} width={40} height={40} alt="" /> : <span className="font-bold text-slate-500">M</span>}
                        </div>
                        <div className={cn("flex-1 overflow-hidden", collapsed && "lg:hidden")}>
                            <div className="text-sm font-bold text-gray-900 truncate">{user?.username || 'Moffi Partner'}</div>
                            <div className="text-xs text-green-600 font-bold truncate">● Online</div>
                        </div>
                        <button onClick={() => { logout(); router.push('/'); }} className={cn("text-gray-300 hover:text-red-500 transition-colors", collapsed && "lg:hidden")}>
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={cn(
                "flex-1 min-w-0 transition-all duration-300",
                collapsed ? "lg:ml-20" : "lg:ml-72"
            )}>
                {/* Mobile Header */}
                <header className="lg:hidden bg-white h-16 border-b border-gray-100 flex items-center px-4 justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)}>
                            <Menu className="w-6 h-6 text-gray-600" />
                        </button>
                        <span className="font-bold text-gray-900">MoffiAdmin</span>
                    </div>
                </header>

                <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
