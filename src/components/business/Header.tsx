"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { useBusinessType } from "@/context/BusinessTypeContext";
import { formatRelativeTime } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface HeaderProps {
    onMenuClick?: () => void;
}

// İşletme panelinin tüm sayfalarında sabit duran üst çubuk: sayfa adı, işletme kimliği ve
// uygulamanın tek bildirim kaynağına (NotificationContext, Realtime) bağlı bildirim zili.
export function BusinessHeader({ onMenuClick }: HeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const typeConfig = useBusinessType();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const titles: Record<string, string> = {
        '/business/dashboard': 'Kontrol Paneli',
        '/business/calendar': 'Takvim',
        '/business/appointments': 'Randevu Yönetimi',
        '/business/patients': typeConfig.hasMedicalRecords ? 'Hastalarım' : 'Müşterilerim',
        '/business/migration': 'Veri Taşıma',
        '/business/finance': 'Finans',
        '/business/orders': 'Siparişler',
        '/business/services': 'Hizmetlerim',
        '/business/profile': 'İşletme profili',
        '/business/doctors': typeConfig.staffLabelPlural,
        '/business/products': 'Ürünler',
        '/business/campaigns': 'Kampanyalar',
        '/business/quests': 'Görevler',
    };
    const title = Object.entries(titles).find(([path]) => pathname?.startsWith(path))?.[1] || 'İşletme Paneli';
    const businessName = user?.businessName || user?.name || user?.username || 'İşletmem';

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const openNotification = async (id: string, type: string, isRead: boolean) => {
        if (!isRead) await markAsRead(id);
        setOpen(false);
        if (type === 'appointment') router.push('/business/calendar');
    };

    return (
        <header className="h-16 md:h-20 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-[#27272a] px-4 md:px-6 flex items-center justify-between gap-4 shrink-0 sticky top-0 z-[2000]">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    onClick={onMenuClick}
                    aria-label="Menüyü aç"
                    className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                >
                    <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <h1 className="text-lg md:text-xl font-black text-foreground dark:text-white truncate">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative" ref={panelRef}>
                    <button
                        onClick={() => setOpen(v => !v)}
                        aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : 'Bildirimler'}
                        aria-expanded={open}
                        className="w-11 h-11 rounded-2xl border border-gray-100 dark:border-[#27272a] flex items-center justify-center relative hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 border-2 border-white dark:border-[#121212] text-[10px] font-black text-white flex items-center justify-center tabular-nums">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {open && (
                        <div className="absolute right-0 top-[calc(100%+8px)] w-[min(360px,calc(100vw-32px))] bg-white dark:bg-[#18181b] border border-gray-100 dark:border-[#27272a] rounded-2xl shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#27272a]">
                                <span className="text-sm font-black text-foreground dark:text-white">Bildirimler</span>
                                {unreadCount > 0 && (
                                    <button onClick={() => markAllAsRead()} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                        Tümünü okundu say
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <p className="p-6 text-center text-sm font-medium text-gray-500">Henüz bildirim yok.</p>
                                ) : notifications.slice(0, 30).map(n => (
                                    <button
                                        key={n.id}
                                        onClick={() => openNotification(n.id, n.type, n.is_read)}
                                        className={cn("w-full text-left px-4 py-3 border-b border-gray-50 dark:border-[#27272a] last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 flex gap-3",
                                            n.is_read && "opacity-60")}
                                    >
                                        <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", n.is_read ? "bg-transparent" : "bg-indigo-500")} />
                                        <span className="min-w-0">
                                            <span className="block text-sm font-bold text-foreground dark:text-white">{n.title}</span>
                                            {n.content && <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 break-words">{n.content}</span>}
                                            <span className="block text-[11px] font-semibold text-gray-400 mt-1">{formatRelativeTime(n.created_at, 'tr')}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-100 dark:border-[#27272a]">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-sm font-black overflow-hidden">
                        {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : businessName.charAt(0).toLocaleUpperCase('tr-TR')}
                    </div>
                    <div className="leading-tight">
                        <div className="text-sm font-bold text-foreground dark:text-white max-w-[180px] truncate">{businessName}</div>
                        <div className="text-[11px] font-semibold text-gray-500">{typeConfig.label}</div>
                    </div>
                </div>
            </div>
        </header>
    );
}
