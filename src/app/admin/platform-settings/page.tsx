"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Sliders, Percent, Banknote, Shield, ToggleLeft, ToggleRight,
    Save, CheckCircle, Loader2, AlertTriangle, Store, Stethoscope,
    Scissors, GraduationCap, Heart, Plus, Trash2
} from "lucide-react";
import { motion } from "framer-motion";

const DEFAULT_SETTINGS = {
    commissionRate: 10,
    minPayoutAmount: 100,
    maintenanceMode: false,
    newRegistrations: true,
    autoApprove: false,
    businessTypes: [
        { key: 'petshop', label: 'Pet Shop', icon: Store, enabled: true },
        { key: 'vet', label: 'Veteriner', icon: Stethoscope, enabled: true },
        { key: 'grooming', label: 'Pet Kuaför', icon: Scissors, enabled: true },
        { key: 'trainer', label: 'Eğitmen', icon: GraduationCap, enabled: true },
        { key: 'shelter', label: 'Barınak', icon: Heart, enabled: true },
    ],
};

export default function AdminPlatformSettingsPage() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const update = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const toggleBusinessType = (key: string) => {
        setSettings(prev => ({
            ...prev,
            businessTypes: prev.businessTypes.map(bt => bt.key === key ? { ...bt, enabled: !bt.enabled } : bt)
        }));
        setSaved(false);
    };

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => { setSaving(false); setSaved(true); }, 1200);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Platform Ayarları</h1>
                    <p className="text-sm text-gray-500 mt-1">Komisyon oranları, ödeme limitleri ve platform kontrolleri</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all self-start",
                        saved
                            ? "bg-green-500 text-white"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 hover:-translate-y-0.5"
                    )}
                >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor</> : saved ? <><CheckCircle className="w-4 h-4" /> Kaydedildi</> : <><Save className="w-4 h-4" /> Kaydet</>}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Commission Settings */}
                <SettingsCard title="Komisyon Ayarları" icon={Percent}>
                    <div className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-2 block">Platform Komisyon Oranı (%)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min={1} max={30}
                                    value={settings.commissionRate}
                                    onChange={e => update('commissionRate', Number(e.target.value))}
                                    className="flex-1 accent-indigo-600"
                                />
                                <div className="w-16 text-center bg-indigo-50 text-indigo-700 font-black text-lg rounded-xl py-2">
                                    %{settings.commissionRate}
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Tüm işletme satışlarından kesilecek oran</p>
                        </div>
                    </div>
                </SettingsCard>

                {/* Payout Settings */}
                <SettingsCard title="Ödeme Ayarları" icon={Banknote}>
                    <div className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Minimum Ödeme Tutarı (₺)</label>
                            <input
                                type="number"
                                value={settings.minPayoutAmount}
                                onChange={e => update('minPayoutAmount', Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">İşletmelerin çekim yapabilmesi için gereken minimum bakiye</p>
                        </div>
                    </div>
                </SettingsCard>

                {/* Platform Controls */}
                <SettingsCard title="Platform Kontrolleri" icon={Shield}>
                    <div className="space-y-4">
                        <ToggleRow
                            label="Bakım Modu"
                            description="Açıkken platform kullanıcılara kapalı olur"
                            enabled={settings.maintenanceMode}
                            onToggle={() => update('maintenanceMode', !settings.maintenanceMode)}
                            danger
                        />
                        <ToggleRow
                            label="Yeni Kayıtlar"
                            description="Yeni işletme başvurularının kabul edilmesi"
                            enabled={settings.newRegistrations}
                            onToggle={() => update('newRegistrations', !settings.newRegistrations)}
                        />
                        <ToggleRow
                            label="Otomatik Onay"
                            description="Yeni başvuruların otomatik olarak onaylanması"
                            enabled={settings.autoApprove}
                            onToggle={() => update('autoApprove', !settings.autoApprove)}
                        />
                    </div>
                </SettingsCard>

                {/* Business Types */}
                <SettingsCard title="İşletme Türleri" icon={Store}>
                    <div className="space-y-3">
                        {settings.businessTypes.map(bt => {
                            const BtIcon = bt.icon;
                            return (
                                <div key={bt.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <BtIcon className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-900">{bt.label}</span>
                                    </div>
                                    <button onClick={() => toggleBusinessType(bt.key)} className="transition">
                                        {bt.enabled
                                            ? <ToggleRight className="w-7 h-7 text-indigo-600" />
                                            : <ToggleLeft className="w-7 h-7 text-gray-300" />
                                        }
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </SettingsCard>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 bg-red-50 border-2 border-red-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-red-700">Tehlikeli Bölge</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button className="px-5 py-2.5 border-2 border-red-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-100 transition">
                        Tüm Önbelleği Temizle
                    </button>
                    <button className="px-5 py-2.5 border-2 border-red-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-100 transition">
                        Mock Verileri Sıfırla
                    </button>
                </div>
            </div>
        </div>
    );
}

function SettingsCard({ title, icon: Icon, children }: { title: string; icon: typeof Sliders; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
                <Icon className="w-4 h-4 text-gray-400" />
                <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function ToggleRow({ label, description, enabled, onToggle, danger }: {
    label: string; description: string; enabled: boolean; onToggle: () => void; danger?: boolean
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <div className={cn("text-sm font-medium", danger ? "text-red-700" : "text-gray-900")}>{label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{description}</div>
            </div>
            <button onClick={onToggle} className="transition">
                {enabled
                    ? <ToggleRight className={cn("w-7 h-7", danger ? "text-red-500" : "text-indigo-600")} />
                    : <ToggleLeft className="w-7 h-7 text-gray-300" />
                }
            </button>
        </div>
    );
}
