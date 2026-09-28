"use client";

// Evcil hayvan ayarları: sadece bu pencereye ait olanlar (günlük hedefler, hayvanı silme).
// Kimlik bilgileri Pet Pasaportu → Kimlik'te, sağlık bilgileri Sağlık Merkezi'nde tek yerden düzenlenir;
// buradan oralara geçilir (eski "Passport Editor" aynı alanları ikinci kez düzenliyordu).

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Field, MODULES, ModuleIcon, PrimaryButton, Sheet, TextInput, type HealthModule } from "@/components/health/HealthUI";
import { usePet } from "@/context/PetContext";

interface PetSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: any;
    onSave: (updatedFields: any) => void;
    onDelete?: (id: string) => void | Promise<void>;
}

const LINKS: { module: HealthModule; label: string; hint: string }[] = [
    { module: 'kimlik', label: 'Kimlik bilgileri', hint: 'Ad, fotoğraf, ırk, doğum tarihi, çip ve PETVET no' },
    { module: 'acil', label: 'Acil bilgiler', hint: 'Alerji, kronik hastalık, sağlık notu, acil iletişim' },
    { module: 'pasaport', label: 'Pet Pasaportu', hint: 'Künye, paylaşım bağlantıları' },
];

export function PetSettingsModal({ isOpen, onClose, pet, onSave, onDelete }: PetSettingsModalProps) {
    const [targets, setTargets] = useState({ activity: '70', water: '1200', food: '1600' });
    const [deleting, setDeleting] = useState(false);
    const { switchPet } = usePet();

    useEffect(() => {
        if (!isOpen || !pet) return;
        setTargets({
            activity: String(pet.activity_target ?? pet.sos_settings?.activity_target ?? 70),
            water: String(pet.water_target ?? pet.sos_settings?.water_target ?? 1200),
            food: String(pet.food_target ?? pet.sos_settings?.food_target ?? 1600),
        });
    }, [isOpen, pet]);

    if (!pet) return null;

    const save = () => {
        const activity_target = Math.max(0, Number(targets.activity) || 0);
        const water_target = Math.max(0, Number(targets.water) || 0);
        const food_target = Math.max(0, Number(targets.food) || 0);
        onSave({
            activity_target, water_target, food_target,
            sos_settings: { ...(pet.sos_settings || {}), activity_target, water_target, food_target },
        });
        onClose();
    };

    const remove = async () => {
        if (!onDelete) return;
        if (!window.confirm(`${pet.name || 'Bu evcil hayvan'} ve tüm kayıtları (sağlık, pasaport, paylaşımlar) kalıcı olarak silinecek. Emin misin?`)) return;
        setDeleting(true);
        try {
            await onDelete(pet.id);
            onClose();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Sheet open={isOpen} onClose={onClose} title={`${pet.name || 'Evcil hayvan'} ayarları`}>
            <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                {LINKS.map(l => (
                    <Link key={l.module} href={MODULES[l.module].href} onClick={() => { switchPet(pet.id); onClose(); }} className="flex items-center gap-3 px-4 py-3">
                        <ModuleIcon module={l.module} size="sm" />
                        <span className="flex-1 min-w-0">
                            <span className="block text-sm font-black">{l.label}</span>
                            <span className="block text-xs font-semibold text-secondary truncate">{l.hint}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                    </Link>
                ))}
            </div>

            <div>
                <h4 className="text-sm font-black mb-2">Günlük hedefler</h4>
                <div className="grid grid-cols-3 gap-2.5">
                    <Field label="Aktivite (%)"><TextInput type="number" inputMode="numeric" value={targets.activity} onChange={e => setTargets(t => ({ ...t, activity: e.target.value }))} /></Field>
                    <Field label="Su (ml)"><TextInput type="number" inputMode="numeric" value={targets.water} onChange={e => setTargets(t => ({ ...t, water: e.target.value }))} /></Field>
                    <Field label="Mama (kcal)"><TextInput type="number" inputMode="numeric" value={targets.food} onChange={e => setTargets(t => ({ ...t, food: e.target.value }))} /></Field>
                </div>
            </div>
            <PrimaryButton onClick={save}>Kaydet</PrimaryButton>

            {onDelete && (
                <button onClick={remove} disabled={deleting}
                    className="w-full h-12 rounded-2xl border border-red-200 text-red-600 dark:border-red-500/30 dark:text-red-300 font-black text-sm disabled:opacity-50">
                    {deleting ? 'Siliniyor…' : 'Evcil hayvanı sil'}
                </button>
            )}
        </Sheet>
    );
}
