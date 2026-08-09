"use client";

import { useState, useEffect } from "react";
import { apiService } from "@/services/apiService";
import { showToast } from "@/lib/utils";

export function PendingTransfersBanner() {
    const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadTransfers = async () => {
        try {
            const transfers = await apiService.getMyPendingTransfers();
            setPendingTransfers(transfers);
        } catch (e) {
            console.error("Failed to load transfers", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTransfers();
    }, []);

    const handleAccept = async (id: string) => {
        try {
            await apiService.acceptOwnershipTransfer(id);
            showToast("Sahiplik başarıyla devralındı!", "Check");
            loadTransfers();
        } catch (e: any) {
            showToast("Hata: " + e.message, "AlertTriangle", "text-red-500");
        }
    };

    const handleReject = async (id: string) => {
        try {
            await apiService.cancelOwnershipTransfer(id);
            showToast("Devir talebi reddedildi.", "Check");
            loadTransfers();
        } catch (e: any) {
            showToast("Hata: " + e.message, "AlertTriangle", "text-red-500");
        }
    };

    if (isLoading || pendingTransfers.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 mb-4 px-4">
            {pendingTransfers.map(t => (
                <div key={t.id} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                        {t.pets?.avatar_url && (
                            <img src={t.pets.avatar_url} alt="pet" className="w-8 h-8 rounded-full object-cover" />
                        )}
                        <span><span className="font-black">{t.pets?.name || "Bir pet"}</span> sana devrediliyor</span>
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleAccept(t.id)} 
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-black transition-colors"
                        >
                            Kabul Et
                        </button>
                        <button 
                            onClick={() => handleReject(t.id)} 
                            className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white px-4 py-2 rounded-xl text-xs font-black transition-colors"
                        >
                            Reddet
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
