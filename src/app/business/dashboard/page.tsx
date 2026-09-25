"use client";

import { AnalyticsChart } from "@/components/business/AnalyticsChart";
import { useAuth, User } from "@/context/AuthContext";
import { ArrowUpRight, Users, Star, Calendar, Megaphone, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React from "react";

import { apiService } from "@/services/apiService"; // imported real api

// Faz 1 (işletme türü mimarisi, 2026-09-25) — bu sayfa daha önce iki gerçek
// "güven" sorunu barındırıyordu: (1) "+ Yeni Kampanya" butonu gerçek
// clinic_campaigns tablosuna hiç dokunmayan, sadece localStorage'a yazan ayrı
// bir modal açıyordu — işletme sahibi kampanya yayınladığını sanıyor ama hiçbir
// müşteri onu göremiyordu; (2) "Toplam Gösterim"/"Sayfa Tıklaması" sayıları
// gerçek değildi, sadece randevu sayısının rastgele bir katıydı (×3, ×14).
// İkisi de kaldırıldı: kampanya butonu artık gerçek Kampanyalar sayfasına
// gidiyor, sahte gösterim/tıklama yerine gerçek ortalama puan + tamamlanan
// randevu sayısı gösteriliyor. "Yakınlık Bildirimi (₺50)" kartı da tamamen
// işlevsiz (onClick'i yoktu, arkasında hiçbir sistem yoktu) olduğu için
// kaldırıldı — CLAUDE.md Bölüm 7'nin "işlevsiz UI" hassasiyeti.
export default function BusinessDashboard() {
    const { user, isSupabaseEnabled } = useAuth();
    const router = useRouter();

    const [dashboardStats, setDashboardStats] = React.useState({
        totalBalance: 0,
        totalPatients: 0,
        recentPatients: [] as any[],
        appointmentsCount: 0,
        completedCount: 0,
        averageRating: 0,
        reviewCount: 0
    });

    React.useEffect(() => {
        const fetchStats = async () => {
            if (isSupabaseEnabled && user?.id) {
                const stats = await apiService.getClinicDashboardStats(user.id);
                setDashboardStats(stats);
            }
        };
        fetchStats();
    }, [user?.id, isSupabaseEnabled]);

    const [activeCampaignsCount, setActiveCampaignsCount] = React.useState(0);

    React.useEffect(() => {
        const fetchCampaigns = async () => {
            if (isSupabaseEnabled && user?.id) {
                const campaigns = await apiService.getClinicCampaigns(user.id);
                setActiveCampaignsCount((campaigns || []).filter((c: any) => c.status === 'active').length);
            }
        };
        fetchCampaigns();
    }, [user?.id, isSupabaseEnabled]);

    // Prepare data for chart (Empty state until we have real traffic tracking)
    const chartData = [0, 0, 0, 0, 0, 0, 0];
    const chartLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    // Provide default safe values for UI
    const totalUsers = dashboardStats.totalPatients || 0;
    const recentUsers = dashboardStats.recentPatients || [];
    const completedCount = dashboardStats.completedCount || 0;
    const averageRating = dashboardStats.averageRating || 0;
    const reviewCount = dashboardStats.reviewCount || 0;

    return (
        <div className="p-4 md:p-8 font-sans w-full max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-1">Kontrol Paneli</h1>
                    <p className="text-xs md:text-base text-gray-500 font-medium">Hoşgeldin, {user?.username || 'Admin'} 👋</p>
                </div>
                <button
                    onClick={() => router.push('/business/campaigns')}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all whitespace-nowrap"
                >
                    + Yeni Kampanya
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Ortalama Puan"
                        value={reviewCount > 0 ? averageRating.toFixed(1) : '—'}
                        trend={reviewCount > 0 ? `${reviewCount} yorum` : 'Henüz yorum yok'}
                        icon={Star}
                        color="blue"
                    />
                    <StatCard
                        title="Toplam Pati Kaydı"
                        value={totalUsers.toString()}
                        trend="Toplam"
                        icon={Users}
                        color="green"
                    />
                    <StatCard
                        title="Tamamlanan Randevu"
                        value={completedCount.toString()}
                        trend="Toplam"
                        icon={Calendar}
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
                            <div className="bg-gray-50 dark:bg-[#0a0a0a] p-1 rounded-xl flex">
                                <button className="px-4 py-1.5 bg-card rounded-lg text-xs font-bold text-foreground shadow-moffi-card border border-card-border/50">Haftalık</button>
                                <button className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-foreground">Aylık</button>
                            </div>
                        </div>
                        <AnalyticsChart data={chartData} labels={chartLabels} />
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-6">
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
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Yeni</span>
                                    </div>
                                )) : (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Henüz yeni üye yok.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

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
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
            </div>
        </div>
    );
}
