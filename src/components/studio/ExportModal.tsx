"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Image as LucideImage, FileText, Share2, ShoppingCart, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    canvasRef: React.RefObject<HTMLDivElement | null>;
    designData: { layers: any[]; product: any };
}

type ExportFormat = 'png' | 'jpg';
type Resolution = '1x' | '2x' | '4x';

export function ExportModal({ isOpen, onClose, canvasRef, designData }: ExportModalProps) {
    const [format, setFormat] = useState<ExportFormat>('png');
    const [resolution, setResolution] = useState<Resolution>('2x');
    const [isExporting, setIsExporting] = useState(false);
    const [exported, setExported] = useState(false);
    const [savedDesignId, setSavedDesignId] = useState<string | null>(null);

    const exportCanvas = useCallback(async () => {
        if (!canvasRef.current) return;
        setIsExporting(true);

        try {
            // Dynamic import to avoid SSR issues
            const { toPng, toJpeg } = await import('html-to-image');
            const scale = resolution === '1x' ? 1 : resolution === '2x' ? 2 : 4;

            const options = {
                quality: 0.95,
                pixelRatio: scale,
                backgroundColor: '#ffffff',
                style: { transform: 'scale(1)', transformOrigin: 'top left' },
            };

            const fn = format === 'png' ? toPng : toJpeg;
            const dataUrl = await fn(canvasRef.current, options);

            // Download
            const link = document.createElement('a');
            link.download = `moffi-design-${Date.now()}.${format}`;
            link.href = dataUrl;
            link.click();

            setExported(true);
            setTimeout(() => setExported(false), 3000);
        } catch (err) {
            console.error('Export error:', err);
            alert('Dışa aktarma sırasında bir hata oluştu. Canvas\'ı tekrar deneyin.');
        } finally {
            setIsExporting(false);
        }
    }, [canvasRef, format, resolution]);

    const saveDesign = () => {
        const id = `design_${Date.now()}`;
        const data = {
            id, ...designData,
            createdAt: new Date().toISOString(),
        };
        const designs = JSON.parse(localStorage.getItem('moffipet_designs') || '[]');
        designs.push(data);
        localStorage.setItem('moffipet_designs', JSON.stringify(designs));
        setSavedDesignId(id);
        setTimeout(() => setSavedDesignId(null), 3000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}>
                <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                    className="bg-white dark:bg-[#111] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-white/10"
                    onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black dark:text-white">Dışa Aktar</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><X className="w-5 h-5 dark:text-white" /></button>
                    </div>

                    {/* Format Selection */}
                    <div className="mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase block mb-2">Format</span>
                        <div className="flex gap-2">
                            {(['png', 'jpg'] as ExportFormat[]).map(f => (
                                <button key={f} onClick={() => setFormat(f)}
                                    className={cn("flex-1 py-3 rounded-xl text-sm font-bold border-2 flex items-center justify-center gap-2 transition",
                                        format === f ? "bg-purple-50 dark:bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300" : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400"
                                    )}>
                                    <LucideImage className="w-4 h-4" /> .{f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Resolution */}
                    <div className="mb-6">
                        <span className="text-xs font-bold text-gray-400 uppercase block mb-2">Çözünürlük</span>
                        <div className="flex gap-2">
                            {([
                                { key: '1x', label: 'Normal', desc: '500×667' },
                                { key: '2x', label: 'Yüksek', desc: '1000×1333' },
                                { key: '4x', label: 'Ultra', desc: '2000×2667' },
                            ] as { key: Resolution; label: string; desc: string }[]).map(r => (
                                <button key={r.key} onClick={() => setResolution(r.key)}
                                    className={cn("flex-1 py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition",
                                        resolution === r.key ? "bg-purple-50 dark:bg-purple-500/20 border-purple-500" : "border-gray-200 dark:border-white/10"
                                    )}>
                                    <span className={cn("text-sm font-bold", resolution === r.key ? "text-purple-700 dark:text-purple-300" : "text-gray-500 dark:text-gray-400")}>{r.label}</span>
                                    <span className="text-[10px] text-gray-400">{r.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button onClick={exportCanvas} disabled={isExporting}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50">
                            {isExporting ? <><Loader2 className="w-5 h-5 animate-spin" /> Dışa aktarılıyor...</> :
                                exported ? <><Check className="w-5 h-5" /> İndirildi!</> :
                                    <><Download className="w-5 h-5" /> PNG İndir</>}
                        </button>

                        <div className="flex gap-2">
                            <button onClick={saveDesign}
                                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 transition dark:text-white">
                                {savedDesignId ? <><Check className="w-4 h-4 text-green-500" /> Kaydedildi</> : <><Share2 className="w-4 h-4" /> Kaydet</>}
                            </button>
                            <button className="flex-1 py-3 bg-gray-100 dark:bg-white/5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 transition dark:text-white">
                                <ShoppingCart className="w-4 h-4" /> Sipariş Ver
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
