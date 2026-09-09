"use client";

import { useState, useRef } from "react";
import { X, Check, Image as ImageIcon, Sparkles } from "lucide-react";
import Image from "next/image";

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (campaign: any) => void;
}

export function CreateCampaignModal({ isOpen, onClose, onCreated }: CreateCampaignModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        image: "" as string
    });

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setIsUploading(true);
                // Dynamically import utility
                const { compressImage } = await import('@/lib/imageUtils');
                const compressedBase64 = await compressImage(file, 800, 0.8);

                setFormData(prev => ({ ...prev, image: compressedBase64 }));
            } catch (error) {
                console.error("Upload failed", error);
                alert("Resim yüklenirken hata oluştu.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newCampaign = {
            id: Date.now().toString(),
            ...formData,
            status: 'active',
            views: 0,
            createdAt: new Date().toISOString()
        };

        // Save to local storage
        const existing = JSON.parse(localStorage.getItem('moffipet_campaigns') || '[]');
        localStorage.setItem('moffipet_campaigns', JSON.stringify([newCampaign, ...existing]));

        onCreated(newCampaign);
        onClose();

        // Reset form
        setFormData({ title: "", description: "", image: "" });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">

                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Yeni Kampanya</h2>
                        <p className="text-xs text-gray-500">Milyonlarca MoffiPet kullanıcısına ulaşın</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">

                    {/* Image Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative w-full h-40 rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-colors cursor-pointer group flex flex-col items-center justify-center bg-gray-50 overflow-hidden ${!formData.image ? 'hover:bg-indigo-50/30' : ''}`}
                    >
                        {formData.image ? (
                            <Image src={formData.image} alt="Preview" fill className="object-cover" />
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    {isUploading ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                </div>
                                <span className="text-sm font-medium text-gray-600">Kampanya Görseli Yükle</span>
                                <span className="text-[10px] text-gray-400 mt-1">PNG, JPG (Max 5MB)</span>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700 ml-1">Kampanya Başlığı</label>
                        <input
                            required
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Örn: Tüm Kahvelerde %20 İndirim"
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder:text-gray-400 font-medium"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700 ml-1">Açıklama</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Kampanya detaylarını buraya yazın..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder:text-gray-400 resize-none font-medium"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={!formData.image || !formData.title}
                            className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Sparkles className="w-4 h-4 fill-white" />
                            Yayınla
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
