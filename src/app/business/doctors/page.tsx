"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/apiService";
import { Plus, Users, Loader2, CheckCircle2, AlertCircle, Mail, X, UserPlus, Shield, Clock, UserMinus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Doctor } from "@/types/domain";
import { useBusinessType, useActiveBusiness } from "@/context/BusinessTypeContext";
import { StaffScheduleEditor } from "@/components/business/StaffScheduleEditor";

export default function BusinessDoctorsPage() {
    const { businessId, canManage } = useActiveBusiness();
    const { staffLabel, staffLabelPlural } = useBusinessType();

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [members, setMembers] = useState<Awaited<ReturnType<typeof apiService.getBusinessMembers>>>([]);
    const [invitations, setInvitations] = useState<Awaited<ReturnType<typeof apiService.getBusinessInvitations>>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"staff" | "manager">("staff");
    const [inviteDoctorId, setInviteDoctorId] = useState<string>("");
    const [isInviting, setIsInviting] = useState(false);

    const [removingUserId, setRemovingUserId] = useState<string | null>(null);
    const [cancellingInvId, setCancellingInvId] = useState<string | null>(null);

    const clearMessages = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    const showSuccess = useCallback((msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 4000);
    }, []);

    const showError = useCallback((msg: string) => {
        setError(msg);
        setTimeout(() => setError(null), 6000);
    }, []);

    const fetchAll = useCallback(async () => {
        if (!businessId) return;
        try {
            const [docs, mems, invs] = await Promise.all([
                apiService.getAllClinicDoctors(businessId),
                canManage ? apiService.getBusinessMembers(businessId) : Promise.resolve([]),
                canManage ? apiService.getBusinessInvitations(businessId) : Promise.resolve([])
            ]);
            setDoctors(docs || []);
            setMembers(mems || []);
            setInvitations((invs || []).filter(i => i.status === 'pending'));
        } catch (err) {
            console.error("Veri yüklenirken hata:", err);
            showError("Veriler yüklenemedi.");
        } finally {
            setIsLoading(false);
        }
    }, [businessId, canManage, showError]);

    useEffect(() => {
        if (businessId) fetchAll();
    }, [businessId, fetchAll]);

    const handleAddDoctor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !businessId) return;
        setIsSaving(true);
        clearMessages();
        try {
            await apiService.createDoctor({
                clinicId: businessId,
                name: newName.trim(),
                title: newTitle.trim() || undefined
            });
            showSuccess(`${staffLabel} başarıyla eklendi!`);
            setNewName("");
            setNewTitle("");
            await fetchAll();
        } catch (err) {
            showError(`${staffLabel} eklenirken bir hata oluştu.`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (doctor: Doctor) => {
        try {
            await apiService.updateDoctor(doctor.id, { isActive: !doctor.is_active });
            setDoctors(doctors.map(d => d.id === doctor.id ? { ...d, is_active: !d.is_active } : d));
        } catch (err) {
            showError(`${staffLabel} durumu güncellenemedi.`);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !businessId) return;
        setIsInviting(true);
        clearMessages();
        try {
            await apiService.inviteStaff(
                businessId,
                inviteEmail.trim(),
                inviteRole,
                inviteDoctorId || undefined
            );
            showSuccess(`${inviteEmail.trim()} adresine davet gönderildi!`);
            setInviteEmail("");
            setInviteDoctorId("");
            await fetchAll();
        } catch (err) {
            showError(err instanceof Error ? err.message : "Davet gönderilemedi.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleCancelInvitation = async (invId: string) => {
        setCancellingInvId(invId);
        try {
            await apiService.cancelInvitation(invId);
            showSuccess("Davet iptal edildi.");
            await fetchAll();
        } catch (err) {
            showError(err instanceof Error ? err.message : "Davet iptal edilemedi.");
        } finally {
            setCancellingInvId(null);
        }
    };

    const handleRemoveMember = async (userId: string, memberName: string | null) => {
        if (!businessId) return;
        if (!confirm(`${memberName || 'Bu kişi'} ekipten çıkarılacak. Emin misiniz?`)) return;
        setRemovingUserId(userId);
        try {
            await apiService.removeBusinessMember(businessId, userId);
            showSuccess(`${memberName || 'Üye'} ekipten çıkarıldı.`);
            await fetchAll();
        } catch (err) {
            showError(err instanceof Error ? err.message : "Üye çıkarılamadı.");
        } finally {
            setRemovingUserId(null);
        }
    };

    const getMemberForDoctor = (doctorId: string) => {
        return members.find(m => m.doctor_id === doctorId);
    };

    const roleLabel = (role: string) => {
        switch (role) {
            case 'owner': return 'Sahip';
            case 'manager': return 'Yönetici';
            case 'staff': return 'Personel';
            default: return role;
        }
    };

    const roleBadgeClass = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
            case 'manager': return 'bg-accent/10 text-accent';
            default: return 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    const pendingInvitations = invitations.filter(i => i.status === 'pending');
    const linkableDoctors = doctors.filter(d => !getMemberForDoctor(d.id) && !pendingInvitations.some(i => i.doctor_id === d.id));

    return (
        <div className="p-4 md:p-8 font-sans w-full max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-foreground dark:text-white tracking-tight flex items-center gap-2">
                    <Users className="w-6 h-6 text-accent" />
                    {staffLabel} Yönetimi
                </h1>
                <p className="text-secondary mt-1 text-sm font-medium">
                    İşletmenizdeki {staffLabelPlural} listesini buradan yönetin. Randevu alırken sadece aktif olanlar listelenir.
                </p>
            </div>

            {/* Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-bold">{error}</span>
                    </motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-bold">{success}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left column: doctors list + members */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Doctor records */}
                    <div className="bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-[2rem] p-6 shadow-sm">
                        <h2 className="text-lg font-black text-foreground dark:text-white mb-4">Kayıtlı {staffLabelPlural}</h2>
                        <div className="space-y-3">
                            {doctors.length === 0 ? (
                                <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
                                    <Users className="w-8 h-8 text-gray-400" />
                                    <span className="text-sm font-medium text-secondary">Henüz {staffLabel.toLowerCase()} eklenmedi.</span>
                                </div>
                            ) : (
                                doctors.map((doc) => {
                                    const linked = getMemberForDoctor(doc.id);
                                    return (
                                        <div key={doc.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="font-bold text-sm text-foreground dark:text-white flex items-center gap-2 flex-wrap">
                                                        {doc.name}
                                                        {doc.is_active ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] uppercase tracking-wider font-bold">Aktif</span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Pasif</span>
                                                        )}
                                                        {linked ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                                                <Shield className="w-3 h-3" /> {linked.user_name || 'Bağlı hesap'}
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-bold">
                                                                Hesap bağlı değil
                                                            </span>
                                                        )}
                                                    </div>
                                                    {doc.title && <div className="text-xs text-secondary font-medium mt-1">{doc.title}</div>}
                                                </div>
                                                {canManage && <div className="flex items-center gap-3 shrink-0">
                                                    <button
                                                        onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                                                        aria-expanded={expandedId === doc.id}
                                                        className="text-xs font-bold text-accent hover:underline"
                                                    >
                                                        {expandedId === doc.id ? 'Kapat' : 'Saatler ve izinler'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(doc)}
                                                        aria-label={doc.is_active ? 'Pasif yap' : 'Aktif yap'}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${doc.is_active ? 'bg-accent' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${doc.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>}
                                            </div>
                                            {canManage && expandedId === doc.id && businessId && (
                                                <StaffScheduleEditor doctorId={doc.id} clinicId={businessId} staffLabel={staffLabel} />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Team members (only if canManage) */}
                    {canManage && members.length > 0 && (
                        <div className="bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-[2rem] p-6 shadow-sm">
                            <h2 className="text-lg font-black text-foreground dark:text-white mb-4">Ekip Üyeleri</h2>
                            <div className="space-y-3">
                                {members.map((member) => (
                                    <div key={member.user_id}className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {member.user_avatar ? (
                                                <img src={member.user_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                                    <Users className="w-4 h-4 text-secondary" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="font-bold text-sm text-foreground dark:text-white flex items-center gap-2 flex-wrap">
                                                    {member.user_name || 'İsimsiz'}
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${roleBadgeClass(member.role)}`}>
                                                        {roleLabel(member.role)}
                                                    </span>
                                                </div>
                                                {member.user_email && (
                                                    <div className="text-xs text-secondary truncate mt-0.5">{member.user_email}</div>
                                                )}
                                                {member.doctor_name && (
                                                    <div className="text-xs text-secondary font-medium mt-0.5">{staffLabel}: {member.doctor_name}</div>
                                                )}
                                            </div>
                                        </div>
                                        {member.role !== 'owner' && (
                                            <button
                                                onClick={() => handleRemoveMember(member.user_id, member.user_name ?? null)}
                                                disabled={removingUserId === member.user_id}
                                                className="text-rose-500 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                                                title="Ekipten çıkar"
                                            >
                                                {removingUserId === member.user_id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <UserMinus className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pending invitations */}
                    {canManage && pendingInvitations.length > 0 && (
                        <div className="bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-[2rem] p-6 shadow-sm">
                            <h2 className="text-lg font-black text-foreground dark:text-white mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                Bekleyen Davetler
                            </h2>
                            <div className="space-y-3">
                                {pendingInvitations.map((inv) => (
                                    <div key={inv.id} className="p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm text-foreground dark:text-white flex items-center gap-2 flex-wrap">
                                                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                                                <span className="truncate">{inv.email}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${roleBadgeClass(inv.role)}`}>
                                                    {roleLabel(inv.role)}
                                                </span>
                                            </div>
                                            {inv.doctor_name && (
                                                <div className="text-xs text-secondary font-medium mt-0.5 ml-6">{staffLabel}: {inv.doctor_name}</div>
                                            )}
                                            <div className="text-xs text-secondary mt-1 ml-6">
                                                Süresi: {new Date(inv.expires_at).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleCancelInvitation(inv.id)}
                                            disabled={cancellingInvId === inv.id}
                                            className="text-rose-500 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50 shrink-0"
                                            title="Daveti iptal et"
                                        >
                                            {cancellingInvId === inv.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <X className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column: add doctor + invite */}
                <div className="space-y-6">
                    {/* Add doctor record */}
                    {canManage && <div className="sticky top-6bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-[2rem] p-6 shadow-xl shadow-accent/5">
                        <h2 className="text-lg font-black text-foreground dark:text-white mb-6">Yeni {staffLabel} Ekle</h2>
                        <form onSubmit={handleAddDoctor} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">{staffLabel} Adı Soyadı</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Örn: Ahmet Yılmaz"
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold focus:border-accent outline-none transition-all dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Ünvan (Opsiyonel)</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="Örn: Kıdemli, Uzman"
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold focus:border-accent outline-none transition-all dark:text-white"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving || !newName.trim()}
                                className="w-full mt-2 py-4 bg-foreground dark:bg-white text-background dark:text-black rounded-xl font-black text-sm uppercase tracking-wider hover:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {isSaving ? 'Ekleniyor...' : `${staffLabel} Ekle`}
                            </button>
                        </form>
                    </div>}

                    {/* Invite to team (only if canManage) */}
                    {canManage && (
                        <div className="bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-[2rem] p-6 shadow-xl shadow-accent/5">
                            <h2 className="text-lg font-black text-foreground dark:text-white mb-2 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-accent" />
                                Ekibe Davet Et
                            </h2>
                            <p className="text-xs text-secondary mb-5">
                                E-posta adresiyle bir kişiyi ekibinize davet edin. Moffi hesabı varsa bildirim alır, yoksa e-posta gönderilir.
                            </p>
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">E-posta Adresi</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="ornek@email.com"
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold focus:border-accent outline-none transition-all dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Rol</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setInviteRole("staff")}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                inviteRole === "staff"
                                                    ? "bg-foreground text-background dark:bg-white dark:text-black"
                                                    : "bg-zinc-100 text-secondary dark:bg-zinc-800 dark:text-zinc-400"
                                            }`}
                                        >
                                            Personel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInviteRole("manager")}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                inviteRole === "manager"
                                                    ? "bg-foreground text-background dark:bg-white dark:text-black"
                                                    : "bg-zinc-100 text-secondary dark:bg-zinc-800 dark:text-zinc-400"
                                            }`}
                                        >
                                            Yönetici
                                        </button>
                                    </div>
                                </div>
                                {linkableDoctors.length > 0 && (
                                    <div>
                                        <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
                                            {staffLabel} Kaydıyla Eşleştir (Opsiyonel)
                                        </label>
                                        <select
                                            value={inviteDoctorId}
                                            onChange={e => setInviteDoctorId(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold focus:border-accent outline-none transition-all dark:text-white"
                                        >
                                            <option value="">Eşleştirme yapma</option>
                                            {linkableDoctors.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}{d.title ? ` — ${d.title}` : ''}</option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-secondary mt-1.5">
                                            Eşleştirilen kişi, bu {staffLabel.toLowerCase()} kaydının takvimini ve randevularını görür.
                                        </p>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={isInviting || !inviteEmail.trim()}
                                    className="w-full mt-2 py-4 bg-accent text-white rounded-xl font-black text-sm uppercase tracking-wider hover:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    {isInviting ? 'Gönderiliyor...' : 'Davet Gönder'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
