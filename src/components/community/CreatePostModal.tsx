"use client";

import { useState, useRef } from "react";
import { X, Image as ImageIcon, MapPin, Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (desc: string, img: string, location: string) => void;
}

export default function CreatePostModal({ isOpen, onClose, onSubmit }: CreatePostModalProps) {
    const [desc, setDesc] = useState("");
    const [location, setLocation] = useState("");
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (!desc && !preview) return; // Basic validation
        // Use placeholder image if none selected for MVP demo
        const imgToUse = preview || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600";
        onSubmit(desc, imgToUse, location);
        setDesc("");
        setPreview(null);
        setLocation("");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed inset-x-4 top-20 bottom-24 z-50 bg-[#1A1A1A] border border-card-border rounded-[2rem] p-6 flex flex-col shadow-2xl overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Yeni Gönderi</h2>
                            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>

                        {/* Image Preview / Selector */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-video rounded-2xl bg-gray-900 border-2 border-dashed border-card-border flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 transition-colors mb-6 overflow-hidden relative"
                        >
                            {preview ? (
                                <img src={preview} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-500">Fotoğraf Seç veya Çek</p>
                                </>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </div>

                        {/* Caption */}
                        <div className="flex-1 space-y-4">
                            <textarea
                                placeholder="Bugün neler yapıyorsunuz? 🐾"
                                className="w-full h-32 bg-transparent text-white placeholder:text-gray-600 outline-none resize-none text-lg"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                            />

                            {/* Location Input */}
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-3 rounded-xl">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Konum Ekle"
                                    className="bg-transparent outline-none flex-1 text-sm text-white"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>

                            {/* AI Magic Button (Visual Only) */}
                            <button className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                                <Sparkles className="w-3.5 h-3.5" /> AI ile Caption Yaz (Premium)
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={!desc && !preview}
                            className="mt-6 w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" /> Paylaş
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
