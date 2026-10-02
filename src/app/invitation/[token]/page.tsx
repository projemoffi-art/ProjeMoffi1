"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Users, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";
import { setLastPanel } from "@/hooks/useMyBusinesses";

interface InvitationView {
    error?: 'not_found' | 'wrong_email';
    expected_email?: string;
    business_name?: string;
    logo_url?: string | null;
    role?: 'manager' | 'staff';
    status?: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
    expires_at?: string;
    doctor_name?: string | null;
    inviter_name?: string | null;
    already_member?: boolean;
}

const ROLE_LABEL = { manager: 'Yönetici', staff: 'Personel' } as const;

const STATUS_MESSAGE: Record<string, string> = {
    accepted: 'Bu davet zaten kabul edilmiş.',
    declined: 'Bu davet reddedilmiş.',
    cancelled: 'Bu davet işletme tarafından iptal edilmiş.',
    expired: 'Bu davetin süresi dolmuş. İşletmeden yeni bir davet isteyebilirsin.',
};

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-[100dvh] bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                {children}
            </div>
        </main>
    );
}

export default function InvitationPage() {
    const { token } = useParams<{ token: string }>();
    const router = useRouter();
    const { user, isLoading: authLoading, logout } = useAuth();

    const [inv, setInv] = useState<InvitationView | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<'accepted' | 'declined' | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setInv(await apiService.getInvitationByToken(token));
        } catch (e: any) {
            setError(e?.message || 'Davet yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { setLoading(false); return; }
        load();
    }, [authLoading, user, load]);

    const goToPanel = () => {
        setLastPanel('business');
        // Tam yükleme: işletme paneli üyeliği ara katmanda ve panel düzeninde yeniden okunur.
        window.location.href = '/business/dashboard';
    };

    const respond = async (accept: boolean) => {
        setBusy(accept ? 'accept' : 'decline');
        setError(null);
        try {
            const res = await apiService.respondInvitation(token, accept);
            if (accept) {
                setDone('accepted');
                setTimeout(goToPanel, 1200);
            } else {
                setDone(res?.status === 'declined' ? 'declined' : null);
            }
        } catch (e: any) {
            setError(e?.message || 'İşlem tamamlanamadı.');
            await load();
        } finally {
            setBusy(null);
        }
    };

    const loginHref = `/?next=${encodeURIComponent(`/invitation/${token}`)}`;

    if (authLoading || loading) {
        return <Shell><div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-zinc-400" /></div></Shell>;
    }

    if (!user) {
        return (
            <Shell>
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Ekip daveti</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    Daveti görmek için, davetin gönderildiği e-posta adresiyle giriş yap. Hesabın yoksa aynı adresle kaydolabilirsin.
                </p>
                <button onClick={() => router.push(loginHref)}
                    className="w-full mt-6 py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold text-sm">
                    Giriş yap veya kaydol
                </button>
            </Shell>
        );
    }

    if (done === 'accepted') {
        return (
            <Shell>
                <div className="flex flex-col items-center text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Ekibe katıldın</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{inv?.business_name} paneline yönlendiriliyorsun…</p>
                </div>
            </Shell>
        );
    }

    if (done === 'declined') {
        return (
            <Shell>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Davet reddedildi</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">İşletmeye bilgi verildi.</p>
                <button onClick={() => router.replace('/home')}
                    className="w-full mt-6 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-sm">
                    Ana sayfaya dön
                </button>
            </Shell>
        );
    }

    if (!inv || inv.error === 'not_found') {
        return (
            <Shell>
                <AlertCircle className="w-10 h-10 text-zinc-400 mb-3" />
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Davet bulunamadı</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{error || 'Bağlantı hatalı ya da davet kaldırılmış olabilir.'}</p>
                <button onClick={() => router.replace('/home')}
                    className="w-full mt-6 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-sm">
                    Ana sayfaya dön
                </button>
            </Shell>
        );
    }

    if (inv.error === 'wrong_email') {
        return (
            <Shell>
                <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Bu davet başka bir hesaba gönderilmiş</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    Davet <span className="font-semibold">{inv.expected_email}</span> adresine gönderildi. Şu an farklı bir hesapla giriş yapmışsın.
                </p>
                <button onClick={async () => { await logout(); window.location.href = loginHref; }}
                    className="w-full mt-6 py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold text-sm">
                    Çıkış yap ve doğru hesapla gir
                </button>
            </Shell>
        );
    }

    const role = inv.role ? ROLE_LABEL[inv.role] : '';
    const closed = inv.status && inv.status !== 'pending';

    return (
        <Shell>
            <div className="flex items-center gap-3 mb-5">
                {inv.logo_url ? (
                    <img src={inv.logo_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                ) : (
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Users className="w-6 h-6 text-zinc-500" />
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-xs text-zinc-500">Ekip daveti</p>
                    <h1 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{inv.business_name}</h1>
                </div>
            </div>

            <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {inv.inviter_name ? <><span className="font-semibold">{inv.inviter_name}</span> seni </> : 'Seni '}
                bu işletmenin ekibine <span className="font-semibold">{role.toLowerCase()}</span> olarak davet ediyor.
            </p>

            <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-zinc-500">Rol</dt><dd className="font-medium text-zinc-900 dark:text-white">{role}</dd></div>
                {inv.doctor_name && (
                    <div className="flex justify-between gap-4"><dt className="text-zinc-500">Takvim</dt><dd className="font-medium text-zinc-900 dark:text-white text-right">{inv.doctor_name}</dd></div>
                )}
                {inv.expires_at && !closed && (
                    <div className="flex justify-between gap-4"><dt className="text-zinc-500">Son geçerlilik</dt><dd className="font-medium text-zinc-900 dark:text-white">{new Date(inv.expires_at).toLocaleDateString('tr-TR')}</dd></div>
                )}
            </dl>

            <p className="text-xs text-zinc-500 mt-4">
                {inv.role === 'manager'
                    ? 'Yönetici olarak randevuları, hizmetleri, kampanyaları ve ekibi yönetebilirsin.'
                    : 'Personel olarak kendi takvimini ve randevularını görür, randevuları onaylayıp tamamlayabilirsin.'}
            </p>

            {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

            {closed ? (
                <>
                    <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">{STATUS_MESSAGE[inv.status!]}</p>
                    {inv.already_member ? (
                        <button onClick={goToPanel} className="w-full mt-4 py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold text-sm">
                            İşletme paneline git
                        </button>
                    ) : (
                        <button onClick={() => router.replace('/home')} className="w-full mt-4 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-sm">
                            Ana sayfaya dön
                        </button>
                    )}
                </>
            ) : (
                <div className="flex gap-3 mt-6">
                    <button onClick={() => respond(false)} disabled={!!busy}
                        className="flex-1 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-sm disabled:opacity-50">
                        {busy === 'decline' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Reddet'}
                    </button>
                    <button onClick={() => respond(true)} disabled={!!busy}
                        className="flex-1 py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold text-sm disabled:opacity-50">
                        {busy === 'accept' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Kabul et'}
                    </button>
                </div>
            )}
        </Shell>
    );
}
