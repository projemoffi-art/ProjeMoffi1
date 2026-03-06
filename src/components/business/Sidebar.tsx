"use client";

import {
    LayoutDashboard, Store, Megaphone, Settings, LogOut,
    BarChart3, Map, ChevronLeft, ChevronRight,
    Package, ClipboardList, Calendar, Wallet, ShieldCheck
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

// Menu items with businessType filter
const ALL_MENU_ITEMS = [
    { title: "Genel Bakış", icon: LayoutDashboard, path: "/business/dashboard", types: ['all'] },
    { title: "Ürünler", icon: Package, path: "/business/products", types: ['petshop'] },
    { title: "Siparişler", icon: ClipboardList, path: "/business/orders", types: ['petshop'] },
    { title: "Randevular", icon: Calendar, path: "/business/appointments", types: ['vet', 'grooming'] },
    { title: "Kampanyalar", icon: Megaphone, path: "/business/campaigns", types: ['all'] },
    { title: "Walk Quest", icon: Map, path: "/business/quests", types: ['all'] },
    { title: "Finans", icon: Wallet, path: "/business/finance", types: ['all'] },
    { title: "Analizler", icon: BarChart3, path: "/business/analytics", types: ['all'] },
    { title: "Ayarlar", icon: Settings, path: "/business/settings", types: ['all'] },
];

interface BusinessSidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function BusinessSidebar({ isMobileOpen = false, onMobileClose }: BusinessSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const businessType = user?.businessType || 'petshop';

    // Filter menu based on business type
    const menuItems = ALL_MENU_ITEMS.filter(
        item => item.types.includes('all') || item.types.includes(businessType)
    );

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    onClick={onMobileClose}
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                />
            )}

            <aside className={cn(
                "bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 shadow-xl shadow-indigo-50/30",
                collapsed ? "md:w-20" : "md:w-72",
                "w-72",
                isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Logo Area */}
                <div className={cn("flex items-center gap-3 p-6", collapsed && "md:justify-center md:p-4")}>
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200 flex-shrink-0">
                        M
                    </div>
                    <div className={cn("flex flex-col", collapsed && "md:hidden")}>
                        <span className="font-bold text-gray-900 text-lg leading-none">MoffiBusiness</span>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-1">Partner Panel</span>
                    </div>
                </div>

                {/* Approval Badge */}
                {user?.businessApproved === false && (
                    <div className={cn("mx-3 mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl", collapsed && "md:mx-2 md:px-1")}>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span className={cn("text-[10px] font-bold text-amber-700", collapsed && "md:hidden")}>Onay Bekleniyor</span>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    router.push(item.path);
                                    if (onMobileClose) onMobileClose();
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                                    collapsed && "md:justify-center md:px-0"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 transition-colors flex-shrink-0",
                                    isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                                )} />
                                <span className={cn("text-sm font-medium", collapsed && "md:hidden")}>{item.title}</span>
                                {isActive && (
                                    <div className={cn("ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600", collapsed && "md:hidden")} />
                                )}
                                {collapsed && (
                                    <div className="hidden md:block absolute left-full ml-4 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                        {item.title}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-100 rounded-full items-center justify-center text-gray-400 hover:text-indigo-600 shadow-sm z-50"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>

                {/* User Profile / Logout */}
                <div className={cn("p-4 border-t border-gray-100", collapsed && "md:p-2")}>
                    <div className={cn(
                        "flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition group",
                        collapsed && "md:justify-center md:p-0 md:w-10 md:h-10 md:mx-auto"
                    )}>
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm border-2 border-white shadow-sm flex-shrink-0">
                            {user?.businessName?.charAt(0) || user?.username?.charAt(0) || 'B'}
                        </div>
                        <div className={cn("flex-1 overflow-hidden", collapsed && "md:hidden")}>
                            <div className="text-sm font-bold text-gray-900 truncate">{user?.businessName || user?.username || 'İşletme'}</div>
                            <div className="text-xs text-green-600 font-bold truncate">● Online</div>
                        </div>
                        <button onClick={handleLogout} className={cn("text-gray-300 hover:text-red-500 transition-colors", collapsed && "md:hidden")}>
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
