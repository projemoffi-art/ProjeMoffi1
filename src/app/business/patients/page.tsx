"use client";

import React, { useEffect, useState } from "react";
import { apiService } from "@/services/apiService";
import { Search, Plus, PawPrint, Calendar, ArrowRight, Loader2, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function BusinessPatientsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            const data = await apiService.getClinicPatients();
            setPatients(data);
        } catch (error) {
            console.error("Failed to load clinic patients:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPatients = patients.filter(p => 
        (p.pet_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.species || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.breed || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 font-sans w-full max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white flex items-center gap-2">
                            <PawPrint className="w-6 h-6 text-indigo-500" />
                            Hastalarım
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Kliniğinize kayıtlı veya veri göçü ile aktarılan tüm evcil hayvanlar.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/business/appointments/new"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Randevu
                        </Link>
                    </div>
                </div>

                {/* Filters / Search */}
                <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="İsim, tür veya ırk ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                        />
                    </div>
                </div>

                {/* Patient List */}
                <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 flex justify-center text-indigo-500">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            <PawPrint className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Aradığınız kritere uygun hasta bulunamadı.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50/80 dark:bg-white/5 border-b border-zinc-200 dark:border-zinc-800/80">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Hasta</th>
                                        <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Tür & Irk</th>
                                        <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Son Ziyaret</th>
                                        <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                    {filteredPatients.map(p => (
                                        <tr key={p.pet_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                        {p.avatar_url ? (
                                                            <img src={p.avatar_url} alt={p.pet_name} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            p.pet_name?.charAt(0).toUpperCase() || 'P'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-foreground dark:text-white flex items-center gap-2">
                                                            {p.pet_name || 'İsimsiz'}
                                                            {p.source === 'migrated' && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" title="Veri Göçü ile eklendi">
                                                                    <LinkIcon className="w-3 h-3" /> Göç
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">Owner ID: {p.owner_id ? p.owner_id.substring(0,8) + '...' : '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                                <div className="font-medium">{p.species || '-'}</div>
                                                <div className="text-xs text-gray-400">{p.breed || '-'}</div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                                {p.last_visit ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                        {format(new Date(p.last_visit), 'dd MMM yyyy', { locale: tr })}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">Kayıt yok</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Link 
                                                    href={`/business/appointments/new?pet_id=${p.pet_id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    Randevu <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
        </div>
    );
}
