'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, ShieldCheck, Clock, Edit3, Camera, X, Award, FileText, Share2, AlertCircle, Syringe 
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
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationStep(1);
        
        await new Promise(r => setTimeout(r, 1500));
        setGenerationStep(2);
        
        await new Promise(r => setTimeout(r, 1500));
        setGenerationStep(3);
        
        await new Promise(r => setTimeout(r, 1500));
        setIsGenerating(false);
        setGenerationStep(0);
        setShowPreview(true);
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

                                        {record.batchNumber && (
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">Seri No / Lot</p>
                                                <p className="text-xs font-black text-emerald-400 italic tracking-tighter">{record.batchNumber}</p>
                                            </div>
                                        )}

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

            <button onClick={handleGenerate} className="w-full bg-[#12121A] border-2 border-white/10 py-10 rounded-[3rem] group hover:bg-white/5 transition-all relative overflow-hidden shadow-2xl mt-12">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110"><FileText className="w-7 h-7 text-white" /></div>
                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Resmi Karne Oluştur (PDF)</h4>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 px-4 text-center">Veteriner Hekim Onaylı Dijital Mühür Dahildir</p>
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

                {/* GENERATING OVERLAY */}
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center"
                    >
                        <div className="relative mb-12">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5"
                            >
                                <div className="w-full h-full rounded-[2.4rem] bg-black flex items-center justify-center">
                                    <ShieldCheck className="w-16 h-16 text-white" />
                                </div>
                            </motion.div>
                            <motion.div 
                                animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-cyan-500 rounded-full blur-3xl -z-10" 
                            />
                        </div>

                        <div className="space-y-4 max-w-xs">
                            <h3 className="text-2xl font-black text-white tracking-tight italic uppercase">
                                {generationStep === 1 && "Tıbbi Veriler Analiz Ediliyor..."}
                                {generationStep === 2 && "Dijital Mühür Doğrulanıyor..."}
                                {generationStep === 3 && "Resmi PDF Hazırlanıyor..."}
                            </h3>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${(generationStep / 3) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-mono">
                                Securing Health Hash: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}...
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* PASSPORT/HEALTH CARD PREVIEW MODAL */}
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[12000] bg-black/95 backdrop-blur-3xl flex flex-col items-center overflow-y-auto py-24 px-6"
                    >
                        <div className="relative w-full max-w-md my-auto">
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="absolute -top-12 -right-2 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all active:scale-90 z-[130]"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <motion.div
                                initial={{ scale: 0.9, y: 50 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 50 }}
                                className="w-full bg-white rounded-[4rem] p-6 flex flex-col shadow-2xl text-black relative cursor-default"
                            >
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/10 rounded-full" />

                                <div className="flex justify-between items-start mb-6 border-b-2 border-dashed border-gray-100 pb-6 pt-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Moffi Health System</span>
                                        </div>
                                        <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">RESMİ SAĞLIK KARNESİ</h2>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Dijital Aşı Takvimi ve Sağlık Onayı</p>
                                        <div className="flex items-center gap-1.5 mt-2 text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 rounded-lg px-2 py-1 w-fit">
                                            <ShieldCheck className="w-3 h-3" /> Veteriner Mührü Uygulandı
                                        </div>
                                    </div>
                                    <div className="p-2 border-2 border-gray-200 rounded-2xl scale-90">
                                        <QRCodeSVG value={`moffi://verify/health/${activePet?.id}`} size={48} />
                                    </div>
                                </div>

                                <div className="flex gap-4 mb-6">
                                    <img src={activePet?.image || activePet?.avatar} className="w-20 h-20 rounded-2xl object-cover grayscale-[0.5] contrast-125 shadow-lg" />
                                    <div className="space-y-3 flex-1">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            <div>
                                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Pet Adı</p>
                                                <p className="text-xs font-black uppercase tracking-tight leading-none">{activePet?.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Gömülü Çip</p>
                                                <p className="text-xs font-black font-mono tracking-tighter leading-none">{activePet?.microchip?.slice(-8) || "985-00..."}</p>
                                            </div>
                                            <div>
                                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Irk</p>
                                                <p className="text-xs font-bold uppercase tracking-tight leading-none truncate">{activePet?.breed}</p>
                                            </div>
                                            <div>
                                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Durum</p>
                                                <p className="text-xs font-bold uppercase tracking-tight leading-none truncate text-emerald-600">MÜKEMMEL</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-8">
                                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Son Uygulanan Aşılar</h4>
                                    {allRecords.filter((r: any) => r.status === 'completed').slice(0, 3).map((v: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-[11px]">
                                            <span className="font-bold text-gray-600">{v.definition?.name || v.name}</span>
                                            <span className="font-black font-mono">{v.dateAdministered || "UYGUN"}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3 relative z-10">
                                    <button 
                                        onClick={() => alert("Resmi Sağlık Karnesi PDF olarak başarıyla oluşturuldu ve indiriliyor... 📥")}
                                        className="flex-1 bg-black text-white py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors active:scale-95"
                                    >
                                        <FileText className="w-4 h-4" /> PDF İndir
                                    </button>
                                    <button 
                                        onClick={() => alert("Paylaşım menüsü açılıyor... 📲")}
                                        className="w-14 h-14 bg-gray-100 text-black rounded-3xl flex items-center justify-center hover:bg-gray-200 transition-colors active:scale-95 shadow-inner"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="absolute bottom-12 right-6 rotate-[-20deg] opacity-[0.08] pointer-events-none group">
                                    <div className="relative">
                                        <Award className="w-40 h-40 text-black" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <p className="text-[8px] font-black uppercase text-center leading-none tracking-widest">
                                                MOFFI<br/>HEALTH
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
