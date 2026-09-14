"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";
import { Plus, Users, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Doctor } from "@/types/domain";

export default function BusinessDoctorsPage() {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const [newName, setNewName] = useState("");
    const [newTitle, setNewTitle] = useState("");

    useEffect(() => {
        if (user?.id) {
            fetchDoctors();
        }
    }, [user?.id]);

    const fetchDoctors = async () => {
        try {
            const data = await apiService.getAllClinicDoctors(user!.id);
            setDoctors(data || []);
        } catch (err: any) {
            console.error("Doktorlar çekilirken hata:", err);
            setError("Doktorlarınız yüklenemedi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDoctor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !user?.id) return;
        
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await apiService.createDoctor({
                clinicId: user.id,
                name: newName.trim(),
                title: newTitle.trim() || undefined
            });
            
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            setNewName("");
            setNewTitle("");
            await fetchDoctors();
        } catch (err: any) {
            console.error("Doktor eklerken hata:", err);
            setError("Doktor eklenirken bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (doctor: Doctor) => {
        try {
            await apiService.updateDoctor(doctor.id, { isActive: !doctor.is_active });
            setDoctors(doctors.map(d => d.id === doctor.id ? { ...d, is_active: !d.is_active } : d));
        } catch (err: any) {
            console.error("Durum güncellenirken hata:", err);
            setError("Doktor durumu güncellenemedi.");
            setTimeout(() => setError(null), 3000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 font-sans w-full max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-black text-foreground dark:text-white tracking-tight flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-500" />
                    Doktor Yönetimi
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
                    Kliniğinizde çalışan doktorları buradan yönetebilir, aktif/pasif durumlarını değiştirebilirsiniz. Randevu alırken sadece aktif doktorlar listelenir.
                </p>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 mt-4">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-bold">{error}</span>
                    </motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mt-4">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-bold">Doktor başarıyla eklendi!</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-[2rem] p-6 shadow-sm">
                        <h2 className="text-lg font-black text-foreground dark:text-white mb-4">Klinik Doktorları</h2>
                        
                        <div className="space-y-3">
                            {doctors.length === 0 ? (
                                <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
                                    <Users className="w-8 h-8 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-500">Henüz doktor eklenmedi.</span>
                                </div>
                            ) : (
                                doctors.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                        <div>
                                            <div className="font-bold text-sm text-foreground dark:text-white flex items-center gap-2">
                                                {doc.name}
                                                {doc.is_active ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] uppercase tracking-wider font-bold">Aktif</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Pasif</span>
                                                )}
                                            </div>
                                            {doc.title && <div className="text-xs text-gray-500 font-medium mt-1">{doc.title}</div>}
                                        </div>
                                        <button
                                            onClick={() => handleToggleStatus(doc)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${doc.is_active ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${doc.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="sticky top-6 bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-[2rem] p-6 shadow-xl shadow-indigo-500/5">
                        <h2 className="text-lg font-black text-foreground dark:text-white mb-6">Yeni Doktor Ekle</h2>
                        
                        <form onSubmit={handleAddDoctor} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Doktor Adı Soyadı</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Örn: Dr. Ahmet Yılmaz"
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold focus:border-indigo-500 outline-none transition-all dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Ünvan (Opsiyonel)</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="Örn: Vet. Hekim, Baş Hekim"
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold focus:border-indigo-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving || !newName.trim()}
                                className="w-full mt-2 py-4 bg-foreground dark:bg-white text-background dark:text-black rounded-xl font-black text-sm uppercase tracking-wider hover:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {isSaving ? 'Ekleniyor...' : 'Doktor Ekle'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
