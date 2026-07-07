"use client";

import { BusinessSidebar } from "@/components/business/Sidebar";
import { AnalyticsChart } from "@/components/business/AnalyticsChart";
import { CreateCampaignModal } from "@/components/business/CreateCampaignModal";
import { useAuth, User } from "@/context/AuthContext";
import { ArrowUpRight, Users, Eye, MousePointerClick, Wallet, Megaphone, LucideIcon, Map as MapIcon, Bell, Calendar, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

export default function BusinessDashboard() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = React.useState(false); // Modal State
    const { user, getAllUsers } = useAuth();

    const allUsers: User[] = getAllUsers();
    // Filter out admin from the count if desired, or keep total
    const totalUsers = allUsers.filter(u => u.role !== 'admin').length;

    // Check new users from today
    const today = new Date().toDateString();
    const newUsersToday = allUsers.filter(u => new Date(u.joinedAt).toDateString() === today && u.role !== 'admin').length;

    // Get active campaigns count (read from local storage safely)
    const [activeCampaignsCount, setActiveCampaignsCount] = React.useState(0);

    React.useEffect(() => {
        const stored = localStorage.getItem('moffipet_campaigns');
        if (stored) {
            const campaigns = JSON.parse(stored);
            setActiveCampaignsCount(campaigns.filter((c: any) => c.status === 'active').length);
        }
    }, []); // Run once on mount

    // Callback when new campaign is created
    const handleCampaignCreated = () => {
        const stored = localStorage.getItem('moffipet_campaigns');
        if (stored) {
            const campaigns = JSON.parse(stored);
            setActiveCampaignsCount(campaigns.filter((c: any) => c.status === 'active').length);
        }
    };

    // Get recent 5 users for activity feed
    const recentUsers = [...allUsers].filter(u => u.role !== 'admin').sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()).slice(0, 5);

    return (
        <div className="flex min-h-screen bg-gray-50/50 font-sans">
            {/* Modal */}
            <CreateCampaignModal
                isOpen={isCampaignModalOpen}
                onClose={() => setIsCampaignModalOpen(false)}
                onCreated={handleCampaignCreated}
            />

            {/* Sidebar */}
            <BusinessSidebar
                isMobileOpen={isMobileMenuOpen}
                onMobileClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 md:pl-80 transition-all duration-300 w-full">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 md:mb-10">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="w-10 h-10 rounded-xl bg-card border border-card-border/50 flex items-center justify-center text-foreground shadow-moffi-card md:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-1">Kontrol Paneli</h1>
                            <p className="text-xs md:text-base text-gray-500 font-medium">Hoşgeldin, {user?.username || 'Admin'} 👋</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-xl border border-card-border/50 shadow-moffi-card text-gray-500 text-xs md:text-sm font-medium whitespace-nowrap">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <button className="w-10 h-10 rounded-xl bg-card border border-card-border/50 flex flex-shrink-0 items-center justify-center text-gray-500 shadow-moffi-card relative hover:bg-gray-50">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                        <div className="h-8 w-[1px] bg-gray-200 hidden md:block" />
                        <div className="bg-card px-5 py-2.5 rounded-xl border border-card-border/50 shadow-moffi-card flex flex-shrink-0 items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bakiye</span>
                                <span className="text-sm font-black text-foreground">₺4,250.00</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCampaignModalOpen(true)}
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all whitespace-nowrap hidden md:block"
                        >
                            + Yeni Kampanya
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Toplam Gösterim"
                        value="24.5K"
                        trend="+12%"
                        icon={Eye}
                        color="blue"
                    />
                    <StatCard
                        title="Toplam Kullanıcı"
                        value={totalUsers.toString()}
                        trend={`+${newUsersToday} Yeni`}
                        icon={Users}
                        color="green"
                    />
                    <StatCard
                        title="Sayfa Tıklaması"
                        value="3,240"
                        trend="+18%"
                        icon={MousePointerClick}
                        color="purple"
                    />
                    <StatCard
                        title="Aktif Kampanya"
                        value={activeCampaignsCount.toString()}
                        trend="Aktif"
                        icon={Megaphone}
                        color="orange"
                    />
                </div>

                {/* Charts & Activity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-card rounded-[2rem] p-8 border border-card-border shadow-xl shadow-gray-200/40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Haftalık Ziyaretçi Trafiği</h3>
                                <p className="text-sm text-gray-500 mt-1">Mağazanızın önünden geçen MoffiWalk kullanıcıları</p>
                            </div>
                            <div className="bg-gray-50 p-1 rounded-xl flex">
                                <button className="px-4 py-1.5 bg-card rounded-lg text-xs font-bold text-foreground shadow-moffi-card border border-card-border/50">Haftalık</button>
                                <button className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-foreground">Aylık</button>
                            </div>
                        </div>
                        <AnalyticsChart />
                    </div>

                    {/* Proximity Alerts & Live Feed */}
                    <div className="space-y-6">
                        {/* Proximity Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-6 text-white shadow-2xl shadow-indigo-300 relative overflow-hidden flex flex-col justify-between h-[240px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-card-border">
                                        <MapIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold border border-card-border animate-pulse">Canlı</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2">Yakınlık Bildirimi</h3>
                                <p className="text-indigo-100 text-sm opacity-90 leading-relaxed font-medium">
                                    Şu an mağazanızın <strong>100m</strong> yakınında <strong>{Math.floor(Math.random() * 5) + 8}</strong> potansiyel müşteri yürüyor.
                                </p>
                            </div>

                            <button className="w-full bg-card text-indigo-700 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition shadow-lg flex items-center justify-center gap-2">
                                <Bell className="w-4 h-4" />
                                Bildirim Gönder (₺50)
                            </button>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-card rounded-[2rem] p-6 border border-card-border shadow-lg shadow-gray-100">
                            <h3 className="font-bold text-foreground mb-4 text-sm">Son Aktiviteler (Yeni Üyeler)</h3>
                            <div className="space-y-4">
                                {recentUsers.length > 0 ? recentUsers.map((u, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-card-border overflow-hidden">
                                            <img src={u.avatar || `https://i.pravatar.cc/100?u=${u.email}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-foreground">@{u.username}</div>
                                            <div className="text-[10px] text-gray-500">MoffiPet'e katıldı</div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400">Yeni</span>
                                    </div>
                                )) : (
                                    <div className="text-xs text-gray-400 text-center py-4">Henüz yeni üye yok.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}

// Helper Component for Stats
interface StatCardProps {
    title: string;
    value: string;
    trend: string;
    icon: LucideIcon;
    color: "blue" | "green" | "purple" | "orange";
}

function StatCard({ title, value, trend, icon: Icon, color }: StatCardProps) {
    const colorStyles = {
        blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
        green: "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white",
        purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
        orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
    };

    return (
        <div className="bg-card p-6 rounded-[2rem] border border-card-border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 group hover:-translate-y-1 cursor-default">
            <div className="flex justify-between items-start mb-6">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300", colorStyles[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend.includes("+") ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                        <ArrowUpRight className="w-3 h-3" /> {trend}
                    </div>
                ) : (
                    <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-black text-foreground tracking-tight leading-none mb-2">{value}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
            </div>
        </div>
    );
}
