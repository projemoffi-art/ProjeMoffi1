"use client";

import { useAuth, User } from "@/context/AuthContext";
import { Search, Trash2, KeyRound, Shield, MoreVertical, Check, FileText, X, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { showToast } from "@/lib/utils";

export default function AdminUsersPage() {
    const { getAllUsers, deleteUser, forgotPassword, approveBusiness, rejectBusiness } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    // KYB Modal State
    const [selectedKybUser, setSelectedKybUser] = useState<User | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);

    const refreshUsers = async () => {
        const data = await getAllUsers();
        setUsers(data);
    };

    useEffect(() => {
        refreshUsers();
    }, [getAllUsers]);

    const handleApprove = async (id: string, name: string) => {
        if (confirm(`${name} isimli hekimin işletme kaydını onaylamak istiyor musunuz?`)) {
            setLoading(true);
            await approveBusiness(id);
            setLoading(false);
            refreshUsers();
            showToast('İşletme başarıyla onaylandı! 🛡️', 'CheckCircle2', 'text-emerald-400 font-bold');
            if (selectedKybUser && selectedKybUser.id === id) {
                setSelectedKybUser(prev => prev ? { ...prev, businessApproved: true, kybStatus: 'approved' } : null);
            }
        }
    };

    const handleReject = async (id: string, name: string, reason: string) => {
        if (!reason.trim()) {
            showToast('Lütfen bir red gerekçesi girin.', 'AlertCircle', 'text-amber-500 font-bold');
            return;
        }
        if (confirm(`${name} isimli hekimin kaydını reddetmek istediğinize emin misiniz?`)) {
            setLoading(true);
            await rejectBusiness(id, reason);
            setLoading(false);
            refreshUsers();
            showToast('İşletme kaydı reddedildi. ❌', 'XCircle', 'text-red-400 font-bold');
            if (selectedKybUser && selectedKybUser.id === id) {
                setSelectedKybUser(prev => prev ? { ...prev, businessApproved: false, kybStatus: 'rejected', kybRejectionReason: reason } : null);
            }
            setShowRejectInput(false);
            setRejectReason("");
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (email === 'admin@moffipet.com') {
            showToast('Ana admin hesabı silinemez! 🛑', 'ShieldAlert', 'text-red-500 font-bold');
            return;
        }
        if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
            await deleteUser(id);
            refreshUsers();
        }
    };

    const handleReset = async (email: string) => {
        setLoading(true);
        await forgotPassword(email);
        setLoading(false);
        showToast('Sıfırlama bağlantısı (simülasyon) gönderildi. 📧', 'Send', 'text-indigo-400 font-bold');
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-card rounded-3xl border border-card-border shadow-moffi-card overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 border-b border-card-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-foreground">Kullanıcı Listesi ({filteredUsers.length})</h2>
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="İsim veya e-posta ara..."
                        className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-slate-900 w-full md:w-64"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Kullanıcı</th>
                            <th className="px-6 py-4">Rol</th>
                            <th className="px-6 py-4">Kayıt Tarihi</th>
                            <th className="px-6 py-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden relative border border-card-border">
                                            {u.avatar ? (
                                                <Image src={u.avatar} fill alt="" className="object-cover" />
                                            ) : (
                                                <span className="absolute inset-0 flex items-center justify-center font-bold text-gray-400 text-sm">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground">{u.username}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {u.role === 'admin' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs font-bold">
                                            <Shield className="w-3 h-3" /> Admin
                                        </span>
                                    ) : u.role === 'business' ? (
                                        u.kybStatus === 'approved' || (u.businessApproved && u.kybStatus !== 'rejected') ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold">
                                                Hekim (Onaylı)
                                            </span>
                                        ) : u.kybStatus === 'rejected' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold" title={`Red Gerekçesi: ${u.kybRejectionReason || 'Belirtilmedi'}`}>
                                                Hekim (Reddedildi)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs font-bold animate-pulse">
                                                Hekim (Onay Bekliyor)
                                            </span>
                                        )
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">
                                            User
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(u.joinedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {u.role === 'business' && (
                                            <button
                                                onClick={() => setSelectedKybUser(u)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Belge İncele / KYB"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        )}
                                        {u.role === 'business' && !u.businessApproved && u.kybStatus !== 'rejected' && (
                                            <button
                                                onClick={() => handleApprove(u.id, u.username)}
                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="İşletmeyi Onayla"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleReset(u.email)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Şifre Sıfırla"
                                        >
                                            <KeyRound className="w-4 h-4" />
                                        </button>
                                        {u.email !== 'admin@moffipet.com' && (
                                            <button
                                                onClick={() => handleDelete(u.id, u.email)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Kullanıcıyı Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredUsers.length === 0 && (
                                                <div className="p-10 text-center text-gray-400">
                                                    Kullanıcı bulunamadı.
                                                </div>
                                            )}

                                            {/* KYB Document Modal */}
                                            {selectedKybUser && (
                                                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 overflow-y-auto">
                                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative">
                                                        {/* Close button */}
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedKybUser(null);
                                                                setShowRejectInput(false);
                                                                setRejectReason("");
                                                            }}
                                                            className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors"
                                                        >
                                                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                                        </button>

                                                        <div className="mb-6">
                                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                                <FileText className="w-5 h-5 text-indigo-600" /> KYB Ruhsat & Diploma Doğrulama
                                                            </h3>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {selectedKybUser.username} tarafından sunulan yasal belgelerin platform uygunluk incelemesi.
                                                            </p>
                                                        </div>

                                                        {/* Simulated Official Document (SVG / Rich UI) */}
                                                        <div className="relative border-4 border-double border-amber-800/40 bg-amber-50/10 dark:bg-zinc-950 rounded-2xl p-6 mb-6 shadow-inner overflow-hidden select-none">
                                                            {/* Gold Seal Watermark background */}
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                                                                <svg width="300" height="300" viewBox="0 0 100 100" fill="currentColor" className="text-amber-800">
                                                                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" />
                                                                    <path d="M50 15 L60 35 L80 35 L65 50 L70 70 L50 60 L30 70 L35 50 L20 35 L40 35 Z" />
                                                                </svg>
                                                            </div>

                                                            {/* Certificate Frame/Antet */}
                                                            <div className="text-center border-b border-amber-800/20 pb-4 mb-4">
                                                                <h4 className="text-[10px] font-bold tracking-widest text-amber-800 dark:text-amber-600 uppercase">T.C. TARIM VE ORMAN BAKANLIĞI</h4>
                                                                <h5 className="text-[8px] font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase mt-0.5">VETERİNER HEKİMLİK FAALİYET VE KLİNİK İZİN BELGESİ</h5>
                                                            </div>

                                                            {/* Certificate Content */}
                                                            <div className="space-y-3 text-gray-800 dark:text-gray-200 text-xs">
                                                                <p className="leading-relaxed text-center italic text-[11px] mb-4 text-gray-600 dark:text-gray-400">
                                                                    &quot;Aşağıda tescilli bilgileri yer alan veteriner hekimin ilgili kanun ve yönetmelikler uyarınca klinik işletme ve veteriner hekimlik faaliyeti yürütme yetkisi onaylanmıştır.&quot;
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                                                                    <div>
                                                                        <span className="font-bold text-gray-400 dark:text-zinc-500 uppercase text-[9px] block">HEKİM ADI SOYADI</span>
                                                                        <span className="font-semibold text-gray-900 dark:text-white">{selectedKybUser.ownerName || selectedKybUser.username}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-bold text-gray-400 dark:text-zinc-500 uppercase text-[9px] block">KLİNİK UNVANI</span>
                                                                        <span className="font-semibold text-gray-900 dark:text-white">{selectedKybUser.businessName || 'Moffi Kliniği'}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-bold text-gray-400 dark:text-zinc-500 uppercase text-[9px] block">VERGİ DAİRESİ & NO</span>
                                                                        <span className="font-semibold text-gray-900 dark:text-white">Kadıköy V.D. / {selectedKybUser.taxId || '8765432109'}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-bold text-gray-400 dark:text-zinc-500 uppercase text-[9px] block">DİPLOMA VE TESCİL NO</span>
                                                                        <span className="font-semibold text-gray-900 dark:text-white">DIP-{selectedKybUser.id.split('-')[1]?.toUpperCase() || '76543210'}</span>
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <span className="font-bold text-gray-400 dark:text-zinc-500 uppercase text-[9px] block">BANKA HESAP IBAN</span>
                                                                        <span className="font-mono text-gray-900 dark:text-white text-[10px]">{selectedKybUser.iban || 'Belirtilmedi'}</span>
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <span className="font-bold text-gray-400 dark:text-zinc-500 uppercase text-[9px] block">KLİNİK ADRESİ</span>
                                                                        <span className="font-semibold text-gray-900 dark:text-white">{selectedKybUser.address || 'Belirtilmedi'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Bottom Certificate Area */}
                                                            <div className="flex items-end justify-between border-t border-amber-800/10 pt-4 mt-6">
                                                                {/* Simulated Barcode */}
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="flex gap-0.5 h-6 items-end">
                                                                        {[2,1,3,1,2,3,1,2,1,3,2,1,1,2,3,1,2,1].map((w, i) => (
                                                                            <div key={i} className="bg-gray-900 dark:bg-gray-100" style={{ width: `${w}px`, height: '100%' }} />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-[7px] font-mono tracking-widest text-gray-400 dark:text-zinc-500">
                                                                        *MOFFI-KYB-{selectedKybUser.id.substring(0,8).toUpperCase()}*
                                                                    </span>
                                                                </div>

                                                                {/* Gold Seal */}
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-600 flex items-center justify-center bg-amber-500/10 rotate-12">
                                                                        <span className="text-[7px] font-black text-amber-600 tracking-widest uppercase">MOFFI SEAL</span>
                                                                    </div>
                                                                    <div className="text-right text-[8px] text-gray-400 dark:text-zinc-500">
                                                                        <div className="font-bold">E-İmza Yetkilisi</div>
                                                                        <div>T.C. Sağlık İşleri Dir.</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Status indicators */}
                                                        {selectedKybUser.kybStatus === 'approved' && (
                                                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3 mb-6">
                                                                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                                                    Bu hekimin yasal belgeleri incelenmiş ve <strong>Onaylanmıştır</strong>.
                                                                </span>
                                                            </div>
                                                        )}

                                                        {selectedKybUser.kybStatus === 'rejected' && (
                                                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex flex-col gap-1 mb-6">
                                                                <div className="flex items-center gap-3">
                                                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                                                    <span className="text-xs font-semibold text-red-800 dark:text-red-300">
                                                                        Bu hekimin kaydı <strong>Reddedilmiştir</strong>.
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-red-700 dark:text-red-400 pl-8 font-medium">
                                                                    Gerekçe: {selectedKybUser.kybRejectionReason}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Rejection input form */}
                                                        {showRejectInput && (
                                                            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-3 mb-6 animate-fadeIn">
                                                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block">Red Gerekçesi</label>
                                                                <textarea
                                                                    value={rejectReason}
                                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                                    placeholder="Belge üzerindeki mühür eksik veya vergi kimlik numarası yasal kayıtlarda doğrulanmadı..."
                                                                    rows={3}
                                                                    className="w-full text-xs p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setShowRejectInput(false);
                                                                            setRejectReason("");
                                                                        }}
                                                                        className="px-3 py-1.5 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-300"
                                                                    >
                                                                        İptal
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReject(selectedKybUser.id, selectedKybUser.username, rejectReason)}
                                                                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                                                                    >
                                                                        Reddi Onayla
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Control actions */}
                                                        {!showRejectInput && (
                                                            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-6">
                                                                <div className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                                                                    Karar Durumu: <span className="font-bold text-gray-700 dark:text-zinc-300 uppercase">{selectedKybUser.kybStatus || 'PENDING'}</span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {selectedKybUser.kybStatus !== 'rejected' && (
                                                                        <button
                                                                            onClick={() => setShowRejectInput(true)}
                                                                            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all"
                                                                        >
                                                                            Reddet
                                                                        </button>
                                                                    )}
                                                                    {selectedKybUser.kybStatus !== 'approved' && (
                                                                        <button
                                                                            onClick={() => handleApprove(selectedKybUser.id, selectedKybUser.username)}
                                                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 dark:shadow-none"
                                                                        >
                                                                            Onayla
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
    );
}
