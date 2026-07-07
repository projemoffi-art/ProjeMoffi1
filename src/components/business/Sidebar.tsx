"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Calendar,
    Wallet,
    Package,
    Store,
    Megaphone,
    LogOut,
    ArrowLeftRight,
    X,
    PawPrint,
    Gift
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/LanguageContext";

interface SidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function BusinessSidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
    const pathname = usePathname();
    const { t } = useTranslation();

    const menuItems = [
        { name: t("business.sidebar.dashboard"), path: "/business/dashboard", icon: LayoutDashboard },
        { name: t("business.sidebar.appointments"), path: "/business/appointments", icon: Calendar },
        { name: t("business.sidebar.finance"), path: "/business/finance", icon: Wallet },
        { name: t("business.sidebar.orders"), path: "/business/orders", icon: Package },
        { name: t("business.sidebar.products"), path: "/business/products", icon: Store },
        { name: "Günün Fırsatı", path: "/business/campaigns", icon: Gift },
        { name: t("business.sidebar.quests"), path: "/business/quests", icon: Megaphone },
    ];

    const sidebarContent = (isMobile = false) => (
        <div className="flex flex-col h-full bg-white dark:bg-[#111111] border-r border-zinc-200/80 dark:border-card-border/40 py-6 px-4">
            {/* LOGO */}
            <div className="flex items-center gap-3 px-2 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <PawPrint className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-black tracking-tight text-lg text-foreground dark:text-white leading-none">MoffiBusiness</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">İşletme Portalı</span>
                </div>
                {isMobile && onMobileClose && (
                    <button 
                        onClick={onMobileClose}
                        className="ml-auto w-8 h-8 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* NAV ITEMS */}
            <nav className="flex-1 space-y-1.5">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            onClick={() => isMobile && onMobileClose && onMobileClose()}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all relative group",
                                isActive 
                                    ? "text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/10" 
                                    : "text-gray-500 dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-foreground dark:group-hover:text-white")} />
                            <span className={cn(isMobile ? "block" : "hidden lg:block")}>{item.name}</span>

                            {/* Tooltip for Collapsed Mode */}
                            {!isMobile && (
                                <span className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 lg:hidden font-bold">
                                    {item.name}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* FOOTER ACTIONS */}
            <div className="border-t border-zinc-200/80 dark:border-card-border/40 pt-4 space-y-1.5">
                <Link
                    href="/vet"
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all group"
                >
                    <ArrowLeftRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:scale-110" />
                    <span className={cn(isMobile ? "block" : "hidden lg:block")}>{t("business.sidebar.client_mode")}</span>
                </Link>
                <button
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('moffi_mock_user');
                            window.location.href = '/login';
                        }
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all group"
                >
                    <LogOut className="w-5 h-5 text-red-400 group-hover:scale-110" />
                    <span className={cn(isMobile ? "block" : "hidden lg:block")}>{t("business.sidebar.logout")}</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (Left Fixed) */}
            <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-40 w-20 lg:w-72 transition-all duration-300">
                {sidebarContent(false)}
            </aside>

            {/* Mobile Drawer Sidebar */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Overlay backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            onClick={onMobileClose}
                            className="fixed inset-0 bg-black z-50 md:hidden"
                        />
                        {/* Slider Drawer */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 z-50 md:hidden shadow-2xl h-full"
                        >
                            {sidebarContent(true)}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// Fallback Default Export to avoid import breaking
export default BusinessSidebar;
