"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, ChevronDown, Check, User } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { useBusinessType, useActiveBusiness } from "@/context/BusinessTypeContext";
import { formatRelativeTime } from "@/lib/dateUtils";
import { setLastPanel } from "@/hooks/useMyBusinesses";
import { cn } from "@/lib/utils";

interface HeaderProps {
    onMenuClick?: () => void;
}

// İşletme panelinin tüm sayfalarında sabit duran üst çubuk: sayfa adı, aktif işletmenin bildirim zili
// (NotificationContext'in işletme bildirimleri, sadece bu işletmeninkiler) ve hesap geçişi: kişinin
// üyesi olduğu işletmeler arasında ve kişisel hesaba dönüş (8.54).
export function BusinessHeader({ onMenuClick }: HeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const typeConfig = useBusinessType();
    const { businessId, business, role, businesses, switchTo } = useActiveBusiness();
    const { businessNotifications, markAsRead, markAllAsRead } = useNotifications();
    const notifications = businessNotifications.filter(n => n.business_id === businessId);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const [open, setOpen] = useState(false);
    const [switcherOpen, setSwitcherOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const switcherRef = useRef<HTMLDivElement>(null);

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
    const businessName = business?.name || 'İşletmem';
    const roleName = (r: string | null) => r === 'owner' ? 'Sahip' : r === 'manager' ? 'Yönetici' : r === 'staff' ? typeConfig.staffLabel : '';

    useEffect(() => {
        if (!open && !switcherOpen) return;
        const close = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
            if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setSwitcherOpen(false); } };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, switcherOpen]);

    const openNotification = async (id: string, type: string, isRead: boolean) => {
        if (!isRead) await markAsRead(id);
        setOpen(false);
        if (type === 'biz_appointment' || type === 'appointment') router.push('/business/calendar');
        else if (type === 'biz_order' || type === 'order') router.push('/business/orders');
    };

    const selectBusiness = async (id: string) => {
        setSwitcherOpen(false);
        if (id === businessId) return;
        await switchTo(id);
        router.push('/business/dashboard');
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
                                    <button onClick={() => businessId && markAllAsRead(businessId)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
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

                <div className="relative pl-3 border-l border-gray-100 dark:border-[#27272a]" ref={switcherRef}>
                    <button
                        onClick={() => setSwitcherOpen(v => !v)}
                        aria-label="Hesap değiştir"
                        aria-expanded={switcherOpen}
                        className="flex items-center gap-3 rounded-2xl p-1 pr-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        <span className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-sm font-black overflow-hidden shrink-0">
                            {business?.logo_url ? <img src={business.logo_url} alt="" className="w-full h-full object-cover" /> : businessName.charAt(0).toLocaleUpperCase('tr-TR')}
                        </span>
                        <span className="hidden md:block leading-tight text-left">
                            <span className="block text-sm font-bold text-foreground dark:text-white max-w-[180px] truncate">{businessName}</span>
                            <span className="block text-[11px] font-semibold text-gray-500">{typeConfig.label}{role ? ` · ${roleName(role)}` : ''}</span>
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>

                    {switcherOpen && (
                        <div className="absolute right-0 top-[calc(100%+8px)] w-[min(300px,calc(100vw-32px))] bg-white dark:bg-[#18181b] border border-gray-100 dark:border-[#27272a] rounded-2xl shadow-2xl overflow-hidden">
                            <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400">İşletmelerim</div>
                            {businesses.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => selectBusiness(b.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                    <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xs font-black overflow-hidden shrink-0">
                                        {b.logoUrl ? <img src={b.logoUrl} alt="" className="w-full h-full object-cover" /> : b.name.charAt(0).toLocaleUpperCase('tr-TR')}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-bold text-foreground dark:text-white truncate">{b.name}</span>
                                        <span className="block text-[11px] font-semibold text-gray-500">{roleName(b.role)}{!b.approved ? ' · Onay bekliyor' : ''}</span>
                                    </span>
                                    {b.id === businessId && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                                </button>
                            ))}
                            <button
                                onClick={() => { setSwitcherOpen(false); setLastPanel('personal'); router.push('/home'); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left border-t border-gray-100 dark:border-[#27272a] hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-gray-500" />
                                </span>
                                <span className="text-sm font-bold text-foreground dark:text-white">Kişisel hesabıma geç</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
