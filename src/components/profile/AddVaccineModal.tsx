'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Syringe, Calendar, User, Hash, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddVaccineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (record: any) => void;
}

export function AddVaccineModal({ isOpen, onClose, onAdd }: AddVaccineModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        vetName: '',
        batchNumber: '',
        status: 'completed'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        onAdd({
            id: `custom-${Date.now()}`,
            name: formData.name,
            dateAdministered: formData.date,
            vetName: formData.vetName,
            batchNumber: formData.batchNumber, // NEW FIELD
            status: formData.status,
            createdAt: new Date().toISOString()
        });
        
        onClose();
        setFormData({
            name: '',
            date: new Date().toISOString().split('T')[0],
            vetName: '',
            batchNumber: '',
            status: 'completed'
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-[#12121A] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HEADER */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-emerald-500/5 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                    <Syringe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Yeni Kayıt Ekle</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1.5 tracking-widest">Sağlık Karnesine İşle</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* FORM */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Aşı / İşlem Adı</label>
                                <div className="relative flex items-center">
                                    <Sparkles className="absolute left-4 w-4 h-4 text-emerald-500/50" />
                                    <input 
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Örn: Karma Aşı, Kuduz..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:border-emerald-500/50 focus:bg-white/10 outline-none transition-all placeholder:text-gray-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Uygulama Tarihi</label>
                                    <div className="relative flex items-center">
                                        <Calendar className="absolute left-4 w-4 h-4 text-gray-500" />
                                        <input 
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Durum</label>
                                    <select 
                                        value={formData.status}
                                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all appearance-none"
                                    >
                                        <option value="completed">Tamamlandı</option>
                                        <option value="pending">Planlandı</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Veteriner Hekim / Klinik</label>
                                <div className="relative flex items-center">
                                    <User className="absolute left-4 w-4 h-4 text-gray-500" />
                                    <input 
                                        value={formData.vetName}
                                        onChange={e => setFormData(prev => ({ ...prev, vetName: e.target.value }))}
                                        placeholder="Hekim adı veya klinik..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-gray-700"
                                    />
                                </div>
                            </div>

                            {/* BATCH / LOT NUMBER FIELD */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                    <span>Seri No / Lot</span>
                                    <span className="bg-emerald-500/10 text-[8px] px-2 py-0.5 rounded-full">YENİ</span>
                                </label>
                                <div className="relative flex items-center">
                                    <Hash className="absolute left-4 w-4 h-4 text-emerald-500/50" />
                                    <input 
                                        value={formData.batchNumber}
                                        onChange={e => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                                        placeholder="Örn: VAX-2024-X9..."
                                        className="w-full bg-white/5 border border-emerald-500/20 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:border-emerald-500/50 focus:bg-emerald-500/5 outline-none transition-all placeholder:text-gray-800"
                                    />
                                </div>
                                <p className="text-[9px] text-gray-600 italic ml-4 leading-relaxed">
                                    * Uluslararası seyahatlerde ve sağlık takibinde kritik önem taşır.
                                </p>
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-[0_15px_40px_rgba(16,185,129,0.3)] active:scale-95 transition-all mt-4"
                            >
                                KAYDI ONAYLA VE EKLE
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
