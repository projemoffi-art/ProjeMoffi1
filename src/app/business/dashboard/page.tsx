"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Users, Star, Calendar, Megaphone, type LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";
import { useBusinessType, useActiveBusiness } from "@/context/BusinessTypeContext";
import { TodaySummary } from "@/components/business/TodaySummary";

type DashboardStats = Awaited<ReturnType<typeof apiService.getClinicDashboardStats>>;

// İşletme ana ekranı: yalnızca gerçek veriler (puan, müşteri, tamamlanan randevu, aktif kampanya, son müşteriler).
// Eskiden: "Haftalık Ziyaretçi Trafiği" (hep boş, takip sistemi yok) grafiği ve müşteri e-postasını üçüncü taraf
// avatar servisine gönderen yer tutucu fotoğraf vardı; ikisi de kaldırıldı.
export default function BusinessDashboard() {
    const { user } = useAuth();
    const { businessId, business } = useActiveBusiness();
    const router = useRouter();
    const { primaryFlow } = useBusinessType();

    const [stats, setStats] = React.useState<DashboardStats | null>(null);
    const [activeCampaigns, setActiveCampaigns] = React.useState(0);

    React.useEffect(() => {
        if (!businessId) return;
        let alive = true;
        apiService.getClinicDashboardStats(businessId).then(s => { if (alive) setStats(s); }).catch(console.error);
        apiService.getClinicCampaigns(businessId)
            .then(list => { if (alive) setActiveCampaigns((list || []).filter(c => c.status === 'active').length); })
            .catch(console.error);
        return () => { alive = false; };
    }, [businessId]);

    const reviewCount = stats?.reviewCount ?? 0;
    const recent = stats?.recentPatients ?? [];

    return (
        <div className="p-4 md:p-8 font-sans w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-1">Kontrol Paneli</h1>
                    <p className="text-sm text-secondary font-medium">Hoş geldin{user?.name ? `, ${user.name}` : ''}{business?.name ? ` · ${business.name}` : ''}</p>
                </div>
                <button
                    onClick={() => router.push('/business/campaigns')}
                    className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                    + Yeni Kampanya
                </button>
            </div>

            {businessId && primaryFlow === 'appointment' && <TodaySummary clinicId={businessId} />}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard title="Ortalama puan" value={reviewCount > 0 ? (stats?.averageRating ?? 0).toFixed(1) : '—'} note={reviewCount > 0 ? `${reviewCount} yorum` : 'Henüz yorum yok'} icon={Star} />
                <StatCard title="Müşteri" value={String(stats?.totalPatients ?? 0)} note="Randevu alan Moffi üyeleri" icon={Users} />
                <StatCard title="Tamamlanan randevu" value={String(stats?.completedCount ?? 0)} note="Toplam" icon={Calendar} />
                <StatCard title="Aktif kampanya" value={String(activeCampaigns)} note="Yayında" icon={Megaphone} />
            </div>

            <div className="bg-card rounded-[1.5rem] p-6 border border-card-border">
                <h3 className="font-bold text-foreground mb-4 text-sm">Son müşteriler</h3>
                {recent.length > 0 ? (
                    <div className="space-y-3">
                        {recent.map(u => {
                            const name = u.full_name || u.username || 'Müşteri';
                            return (
                                <div key={u.id} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-foreground/[0.06] overflow-hidden flex items-center justify-center text-[13px] font-black text-secondary shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : name.charAt(0).toLocaleUpperCase('tr-TR')}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[13px] font-bold text-foreground truncate">{name}</div>
                                        {u.username && <div className="text-[11px] text-secondary truncate">@{u.username}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-[13px] text-secondary text-center py-4">Henüz randevu alan müşteri yok.</p>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, note, icon: Icon }: { title: string; value: string; note: string; icon: LucideIcon }) {
    return (
        <div className="bg-card p-5 rounded-[1.5rem] border border-card-border">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
            </div>
            <div className="text-[28px] font-black text-foreground leading-none mb-1.5">{value}</div>
            <p className="text-[12px] font-bold text-foreground/80">{title}</p>
            <p className="text-[11px] font-semibold text-secondary mt-0.5">{note}</p>
        </div>
    );
}
