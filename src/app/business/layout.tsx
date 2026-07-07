"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Clock, XCircle, LogOut } from "lucide-react";
import React from "react";

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Check approval status
    const isApproved = user.businessApproved === true || (user as any).business_approved === true || user.role === 'admin';
    const kybStatus = user.kybStatus || (user as any).kyb_status || 'pending';
    const rejectionReason = (user as any).kyb_rejection_reason || '';

    if (user.role === 'business' && !isApproved) {
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
                            <p className="text-xs text-gray-400 dark:text-gray-500">Lütfen bilgilerinizi kontrol edip yönetici ile iletişime geçin.</p>
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
                                    <div><strong>İşletme:</strong> {user.businessName}</div>
                                    <div><strong>Sahip:</strong> {user.ownerName}</div>
                                    <div><strong>Telefon:</strong> {user.phone}</div>
                                    <div><strong>Vergi No:</strong> {user.taxId}</div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Ortalama onaylanma süresi 1-2 iş günüdür.</p>
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

    return <>{children}</>;
}
