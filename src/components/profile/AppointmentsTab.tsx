'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, ShieldCheck, Clock, Edit3, Camera, X, Award, Download, AlertCircle, Syringe 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from "qrcode.react";

export function AppointmentsTab({ 
    activePet, 
    isScheduleLoading, 
    allRecords, 
    recordDocuments, 
    onAddRecord, 
    onDeleteRecord, 
    onUploadDocument, 
    onDeleteDocument,
    currentAppointments 
}: any) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfProgress, setPdfProgress] = useState(0);
    const [isPdfReady, setIsPdfReady] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleGeneratePdf = () => {
        setIsGeneratingPdf(true);
        setPdfProgress(0);
        setIsPdfReady(false);
        const interval = setInterval(() => {
            setPdfProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsGeneratingPdf(false);
                    setIsPdfReady(true);
                    return 100;
                }
                return prev + 5;
            });
        }, 50);
    };

    return (
        <div className="space-y-10 pb-32">
            <div className="px-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-500/10 border-2 border-emerald-500/30 p-1 relative">
                        <div className="w-full h-full rounded-[1.2rem] bg-emerald-500/20 flex items-center justify-center text-xl">🩺</div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Sağlık & <span className="text-emerald-400">Takvim</span></h3>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Dijital Sağlık Takibi</p>
                    </div>
                </div>
                <button onClick={onAddRecord} className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all">
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            {/* HEALTH SUMMARY WIDGET */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 rounded-[2.5rem] p-6">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Sağlık Durumu</p>
                    <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">Mükemmel</h4>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Her şey yolunda</span>
                    </div>
                </div>
                <div className="bg-[#12121A] border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Syringe className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Sıradaki Aşı</p>
                    <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                        {allRecords.find((r: any) => r.status !== 'completed')?.definition?.name.split(' ')[0] || 'Yok'}
                    </h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-2">
                        {allRecords.find((r: any) => r.status !== 'completed')?.dueDate || '-'}
                    </p>
                </div>
            </div>

            {/* UPCOMING APPOINTMENTS */}
            {currentAppointments.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] px-2 mb-2">Aktif Randevular</h4>
                    {currentAppointments.map((appt: any) => (
                        <div key={appt.id} className="bg-[#12121A] border border-white/10 rounded-[2.5rem] p-6 flex items-center justify-between group transition-all hover:bg-white/5">
                            <div className="flex items-center gap-5">
                                <div className="text-3xl bg-white/5 w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110">{appt.icon}</div>
                                <div>
                                    <h4 className="text-white font-black text-lg tracking-tight uppercase leading-none mb-1">{appt.type}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{appt.doctor} • {appt.time}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-black text-xl italic tracking-tighter">{appt.date.split(' ')[0]}</p>
                                <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">{appt.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MEDICAL RECORDS LIST */}
            <div className="mt-12 space-y-6">
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] px-2 mb-6">Resmi Sağlık Karnesi</h4>
                
                {isScheduleLoading ? (
                    <div className="p-20 text-center text-gray-500 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Takvim Yükleniyor...</div>
                ) : (
                    allRecords.map((record: any, i: number) => {
                        const isCustom = record.id && String(record.id).startsWith('custom-');
                        const isOverdue = record.status !== 'completed' && record.dueDate && new Date(record.dueDate) < new Date();
                        const isUpcoming = record.status !== 'completed' && record.dueDate && (new Date(record.dueDate).getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000;

                        return (
                            <motion.div key={record.id || `rec-${i}`} className={cn(
                                "bg-white/5 backdrop-blur-xl border rounded-[2.5rem] p-6 group transition-all relative overflow-hidden",
                                isOverdue ? "border-red-500/30 bg-red-500/5" : isUpcoming ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/5"
                            )}>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all",
                                            record.status === 'completed' ? "bg-emerald-500 text-black border-emerald-400" : 
                                            isOverdue ? "bg-red-500 text-white border-red-400" :
                                            isUpcoming ? "bg-yellow-500 text-black border-yellow-400" :
                                            "bg-white/5 text-gray-400 border-white/10 border-dashed"
                                        )}>
                                            {record.status === 'completed' ? <ShieldCheck className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-md font-black text-white uppercase tracking-tight leading-none">{record.definition?.name || record.name}</h4>
                                                {isOverdue && <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">KRİTİK</span>}
                                                {isUpcoming && !isOverdue && <span className="text-[8px] font-black bg-yellow-500 text-black px-2 py-0.5 rounded-full">YAKINDA</span>}
                                            </div>
                                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">
                                                VACCINE RECORD • {record.status === 'completed' ? 'TAMAMLANDI' : isOverdue ? 'GECİKMİŞ' : 'BEKLİYOR'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-gray-400 hover:text-white transition-all shadow-inner">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        {isCustom && (
                                            <button onClick={() => onDeleteRecord(record.id)} className="px-4 py-2 bg-red-600/10 text-red-500 hover:bg-red-500 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-red-500/20">SİL</button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6 mt-6 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Geçerlilik Tarihi</p>
                                            <p className="text-xs font-black text-white">{record.status === 'completed' ? record.dateAdministered : (record.dueDate || record.dateAdministered)}</p>
                                        </div>
                                        <button onClick={() => onUploadDocument(record.id || `custom-${i}`)} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group/btn">
                                            <Camera className="w-3.5 h-3.5 text-white/40 group-hover/btn:text-white" />
                                            <span className="text-[9px] font-black text-gray-500 group-hover/btn:text-white uppercase tracking-widest">+ Belge</span>
                                        </button>
                                    </div>

                                    {recordDocuments[record.id] && recordDocuments[record.id].length > 0 && (
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-2">
                                            {recordDocuments[record.id].map((doc: string, dIdx: number) => (
                                                <div key={dIdx} className="relative group/doc shrink-0">
                                                    <img src={doc} onClick={() => setPreviewImage(doc)} className="w-24 h-24 rounded-2xl object-cover border border-white/10 cursor-pointer hover:border-emerald-500/50 transition-all" />
                                                    <button onClick={() => onDeleteDocument(record.id, dIdx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-black opacity-0 group-hover/doc:opacity-100 transition-opacity"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            <button onClick={handleGeneratePdf} className="w-full bg-[#12121A] border-2 border-white/10 py-10 rounded-[3rem] group hover:bg-white/5 transition-all relative overflow-hidden shadow-2xl mt-12">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110"><Download className="w-7 h-7 text-white" /></div>
                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Resmi Karne Oluştur (PDF)</h4>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 px-4 text-center">Hekim Onaylı Dijital Mühür Dahildir</p>
            </button>

            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex gap-4 mt-6">
                <AlertCircle className="w-6 h-6 text-yellow-500/50 shrink-0" />
                <p className="text-[10px] text-gray-600 leading-relaxed italic">
                    Tüm kayıtlar kullanıcı beyanı esasına dayanmaktadır. Moffi, girilen verilerin doğruluğunu resmi makamlarca onaylamaz.
                </p>
            </div>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[6000] bg-black/95 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-4xl max-h-[80vh] bg-black rounded-[3rem] overflow-hidden border border-white/10 relative"><img src={previewImage} className="max-w-full max-h-full object-contain" /></motion.div>
                    </motion.div>
                )}
                {(isGeneratingPdf || isPdfReady) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8">
                        <div className="max-w-md w-full bg-[#12121A] border border-white/10 rounded-[3rem] p-10 text-center">
                            {!isPdfReady ? (
                                <div className="space-y-6">
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20"><Award className="w-10 h-10 text-emerald-400 animate-pulse" /></div>
                                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Mühürleniyor...</h3>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"><motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${pdfProgress}%` }} /></div>
                                </div>
                            ) : (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-8 text-black text-left">
                                    <div className="flex justify-between items-start mb-8"><h2 className="text-2xl font-black italic uppercase italic leading-none">PASAPORT</h2><QRCodeSVG value={`moffi://pet/${activePet?.id}`} size={48} /></div>
                                    <div className="flex gap-6 mb-8"><img src={activePet?.image || activePet?.avatar} className="w-20 h-20 rounded-2xl object-cover grayscale" /><div><h3 className="text-2xl font-black italic uppercase leading-none">{activePet?.name}</h3><span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">VERIFIED</span></div></div>
                                    <button onClick={() => setIsPdfReady(false)} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest">PDF İNDİR</button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
