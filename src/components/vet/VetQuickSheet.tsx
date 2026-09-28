"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, ChevronRight, Heart, BookOpen, ShieldAlert, Stethoscope, Syringe, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePet } from "@/context/PetContext";
import { wallParts, formatDateKeyTr } from "@/lib/appointmentTime";

interface VetQuickSheetProps {
    isOpen: boolean;
    onClose: () => void;
    petId?: string;
}

// Veteriner modülüne hızlı erişim. Kök öğe .theme-vet taşır (CLAUDE.md 8.27): global render edildiği
// için sayfanın renk ayarları buraya kendiliğinden akmaz.
export function VetQuickSheet({ isOpen, onClose }: VetQuickSheetProps) {
    const router = useRouter();
    const { appointments, pets } = usePet();

    const next = useMemo(() => {
        const now = Date.now();
        const all = Object.values(appointments || {}).flat() as any[];
        return all
            .filter(a => ['pending', 'confirmed'].includes(a.status) && a.appointment_date && new Date(a.appointment_date).getTime() > now - 3 * 3600_000)
            .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0] || null;
    }, [appointments]);

    const go = (path: string) => { router.push(path); onClose(); };

    const actions: { label: string; hint: string; icon: React.ComponentType<{ className?: string }>; tone: string; onClick: () => void }[] = [
        { label: 'Veteriner bul', hint: 'Yakındaki klinikler', icon: Stethoscope, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', onClick: () => go('/vet') },
        { label: 'Acil veteriner', hint: 'Şu an açık olanlar', icon: ShieldAlert, tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300', onClick: () => go('/vet/emergency') },
        { label: 'Sağlık karnesi', hint: 'Aşı, ilaç, kilo, belgeler', icon: Syringe, tone: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300', onClick: () => go('/health') },
        { label: 'Randevularım', hint: 'Yaklaşan ve geçmiş', icon: Calendar, tone: 'bg-accent/10 text-accent', onClick: () => go('/vet?view=appointments') },
        { label: 'Favorilerim', hint: 'Kaydettiğin klinikler', icon: Heart, tone: 'bg-accent/10 text-accent', onClick: () => go('/vet/favorites') },
        { label: 'Veteriner rehberi', hint: 'Faydalı bilgiler', icon: BookOpen, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', onClick: () => go('/vet/guide') },
    ];

    const nextWall = next ? wallParts(next.appointment_date) : null;
    const nextPet = next ? pets?.find((p: any) => p.id === next.pet_id) : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm" />
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="theme-vet fixed bottom-0 inset-x-0 z-[3001] bg-background text-foreground rounded-t-[2rem] border-t border-card-border shadow-2xl flex flex-col max-h-[90vh]"
                        role="dialog"
                        aria-label="Veteriner hızlı erişim"
                    >
                        <div className="mx-auto mt-3 w-12 h-1.5 bg-foreground/10 rounded-full" />
                        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                            <h3 className="text-xl font-black">Veteriner</h3>
                            <button onClick={onClose} aria-label="Kapat" className="w-9 h-9 bg-card rounded-full flex items-center justify-center border border-card-border">
                                <X className="w-4 h-4 text-secondary" />
                            </button>
                        </div>

                        <div className="px-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] space-y-5 overflow-y-auto no-scrollbar">
                            {next && nextWall && (
                                <button onClick={() => go('/vet?view=appointments')} className="w-full bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3 text-left">
                                    <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-accent" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-semibold text-secondary">{next.status === 'pending' ? 'Onay bekleyen randevu' : 'Sıradaki randevu'}</div>
                                        <div className="text-sm font-black truncate">{next.clinic?.business_name || next.clinic_name || 'İşletme'}</div>
                                        <div className="text-[12px] font-semibold text-secondary tabular-nums">
                                            {formatDateKeyTr(nextWall.dateKey, { day: 'numeric', month: 'long', weekday: 'short' })} · {nextWall.time}{nextPet ? ` · ${nextPet.name}` : ''}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                                </button>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                {actions.map(a => (
                                    <button key={a.label} onClick={a.onClick} className="bg-card border border-card-border rounded-2xl p-4 text-left flex flex-col gap-3 hover:border-accent/30 transition-colors">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.tone}`}>
                                            <a.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black">{a.label}</div>
                                            <div className="text-[11px] font-semibold text-secondary">{a.hint}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
