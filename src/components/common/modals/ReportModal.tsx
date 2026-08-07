"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityType: 'post' | 'comment' | 'user' | 'pet';
    entityId: string;
}

const REPORT_REASONS = [
    { id: 'spam', label: 'Spam veya Yanıltıcı', desc: 'Sürekli tekrarlanan reklam veya anlamsız içerik.' },
    { id: 'inappropriate', label: 'Uygunsuz İçerik', desc: 'Çıplaklık, şiddet veya rahatsız edici görüntüler.' },
    { id: 'hate_speech', label: 'Nefret Söylemi veya Taciz', desc: 'Birine hakaret eden veya hedef gösteren içerik.' },
    { id: 'fraud', label: 'Dolandırıcılık', desc: 'Maddi çıkar sağlamaya yönelik sahte ilan veya mesajlar.' },
    { id: 'other', label: 'Diğer', desc: 'Yukarıdakilerden farklı bir sorun.' }
];

export function ReportModal({ isOpen, onClose, entityType, entityId }: ReportModalProps) {
    const { user } = useAuth();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, [isOpen]);

    if (!mounted) return null;

    const handleSubmit = async () => {
        if (!selectedReason) return;
        
        setIsSubmitting(true);
        try {
            const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            const reporterId = (user?.id && isValidUUID(user.id)) ? user.id : null;

            const { error } = await supabase.from('reports').insert({
                reporter_id: reporterId,
                target_type: entityType,
                target_id: entityId,
                reason: selectedReason,
                details: details.trim() || null,
                status: 'pending'
            });

            if (error) throw error;

            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setSelectedReason(null);
                setDetails('');
                onClose();
            }, 2000);
        } catch (err: any) {
            console.error("Report error:", err);
            alert("Şikayet gönderilirken bir hata oluştu: " + (err.message || JSON.stringify(err)));
            setIsSubmitting(false);
        }
    };

    if (!mounted || !isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />
            
            <div 
                className="relative w-full max-w-md bg-card border border-card-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto"
                style={{ zIndex: 1000000 }}
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-card-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Şikayet Et</h2>
                            <p className="text-xs text-secondary font-medium">Bu içeriği neden şikayet ediyorsunuz?</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-secondary hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-foreground">Şikayet Alındı</h3>
                            <p className="text-sm text-secondary mt-2">
                                Geri bildiriminiz için teşekkürler. Moderasyon ekibimiz en kısa sürede inceleyecektir.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {REPORT_REASONS.map((reason) => (
                                    <button
                                        key={reason.id}
                                        onClick={() => setSelectedReason(reason.id)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl border transition-all duration-200 group flex items-start gap-3",
                                            selectedReason === reason.id 
                                                ? "bg-red-500/10 border-red-500/30" 
                                                : "bg-black/5 dark:bg-white/5 border-transparent hover:border-card-border"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                                            selectedReason === reason.id ? "border-red-500 bg-red-500/20" : "border-gray-400 dark:border-gray-600 group-hover:border-red-400"
                                        )}>
                                            {selectedReason === reason.id && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                                        </div>
                                        <div>
                                            <div className={cn(
                                                "font-bold text-sm mb-1",
                                                selectedReason === reason.id ? "text-red-500" : "text-foreground group-hover:text-red-400 transition-colors"
                                            )}>
                                                {reason.label}
                                            </div>
                                            <div className="text-xs text-secondary leading-relaxed">
                                                {reason.desc}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6">
                                <label className="text-xs font-bold text-foreground mb-2 block">Ek Detaylar (İsteğe Bağlı)</label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Lütfen durumu daha detaylı açıklayın..."
                                    className="w-full bg-black/5 dark:bg-white/5 border border-card-border rounded-xl p-4 text-sm min-h-[100px] resize-none focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-secondary/50"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!isSuccess && (
                    <div className="p-6 pt-4 border-t border-card-border bg-black/5 dark:bg-white/5 flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl font-bold text-sm text-foreground bg-white dark:bg-[#1A1A1A] border border-card-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            İptal
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={!selectedReason || isSubmitting}
                            className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Gönderiliyor
                                </>
                            ) : (
                                "Şikayeti Gönder"
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return mounted ? modalContent : null;
}
