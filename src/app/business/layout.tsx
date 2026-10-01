"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Clock, XCircle, LogOut } from "lucide-react";
import React, { useEffect, useState } from "react";
import { BusinessSidebar } from "@/components/business/Sidebar";
import { BusinessHeader } from "@/components/business/Header";
import { BusinessTypeProvider, useActiveBusiness } from "@/context/BusinessTypeContext";
import { OnboardingWizard } from "@/components/business/OnboardingWizard";
import { setLastPanel } from "@/hooks/useMyBusinesses";

const Spinner = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
);

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) return <Spinner />;
    if (!user) return null;

    return (
        <BusinessTypeProvider>
            <BusinessShell>{children}</BusinessShell>
        </BusinessTypeProvider>
    );
}

// Panel, kişinin aktif işletmesine göre açılır (8.54): üyesi olduğu işletme yoksa panel yok; işletme onaylı
// değilse inceleme/ret ekranı. Onay bilgisi kişinin profilinden değil işletme kaydından okunur.
function BusinessShell({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();
    const { business, loading } = useActiveBusiness();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (business) setLastPanel('business');
    }, [business]);

    if (loading) return <Spinner />;

    if (!business) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 font-sans">
                <div className="bg-card dark:bg-[#121212] rounded-[2.5rem] p-10 border border-card-border dark:border-[#27272a] shadow-xl text-center max-w-md w-full space-y-4">
                    <h2 className="text-xl font-black text-foreground dark:text-white">Bağlı bir işletmen yok</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        İşletme paneli, sahibi ya da çalışanı olduğun bir işletme için açılır.
                    </p>
                    <button
                        onClick={() => router.push('/home')}
                        className="w-full py-3.5 rounded-2xl bg-gray-100 dark:bg-white/5 border border-card-border dark:border-[#27272a] text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                        Ana sayfaya dön
                    </button>
                </div>
            </div>
        );
    }

    const isApproved = business.approved === true;
    const kybStatus = business.kyb_status || 'pending';
    const rejectionReason = business.kyb_rejection_reason || '';

    if (!isApproved) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-6 font-sans">
                <div className="bg-card dark:bg-[#121212] rounded-[2.5rem] p-10 border border-card-border dark:border-[#27272a] shadow-xl text-center max-w-lg w-full space-y-6">
                    {kybStatus === 'rejected' ? (
                        <>
                            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto">
                                <XCircle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
                            </div>
                            <h2 className="text-2xl font-black text-foreground dark:text-white">Başvurunuz Reddedildi ❌</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Yasal inceleme sonucunda başvurunuz ne yazık ki onaylanmadı.
                            </p>
                            {rejectionReason && (
                                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-left">
                                    <div className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">RET NEDENİ:</div>
                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{rejectionReason}</p>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Lütfen bilgilerinizi kontrol edip yönetici ile iletişime geçin.</p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-black text-foreground dark:text-white">Başvurunuz İnceleniyor 🔍</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                MoffiBusiness kaydınız başarıyla alındı. Platform yöneticisi yasal vergi numarası ve fatura/IBAN bilgilerinizi inceledikten sonra paneliniz aktif edilecektir.
                            </p>
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl text-left space-y-2">
                                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">İNCELEMEDEKİ BİLGİLERİNİZ:</div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    <div><strong>İşletme:</strong> {business.name}</div>
                                    <div><strong>Sahip:</strong> {business.owner_name}</div>
                                    <div><strong>Telefon:</strong> {business.phone}</div>
                                    <div><strong>Vergi No:</strong> {business.tax_id}</div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Ortalama onaylanma süresi 1-2 iş günüdür.</p>
                        </>
                    )}

                    <div className="pt-4 flex gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="flex-1 py-3.5 rounded-2xl bg-gray-100 dark:bg-white/5 border border-card-border dark:border-[#27272a] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors"
                        >
                            Ana Sayfa
                        </button>
                        <button
                            onClick={async () => {
                                await logout();
                                router.replace('/');
                            }}
                            className="flex-1 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" /> Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <OnboardingWizard />
            <div className="flex bg-[#F8F9FC] dark:bg-[#0a0a0a] min-h-screen">
                <BusinessSidebar
                    isMobileOpen={isMobileMenuOpen}
                    onMobileClose={() => setIsMobileMenuOpen(false)}
                />
                <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden md:pl-20 lg:pl-72 transition-all duration-300">
                    <BusinessHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
                    <main className="flex-1 overflow-y-auto no-scrollbar relative">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
