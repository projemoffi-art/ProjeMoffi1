"use client";

import { useState } from "react";
import { X, Send, AlertTriangle, Info, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (mark: { type: string; emoji: string; message: string }) => void;
}

export function MarkCreationModal({ isOpen, onClose, onSubmit }: MarkCreationModalProps) {
    const [selectedType, setSelectedType] = useState<'info' | 'warning' | 'social' | 'love'>('social');
    const [message, setMessage] = useState("");
    const [selectedEmoji, setSelectedEmoji] = useState("🐾");

    if (!isOpen) return null;

    const MARK_TYPES = [
        { id: 'social', label: 'Sosyal', icon: Users, color: 'bg-blue-100 text-blue-600', emojis: ['🐾', '🐕', '👋', '🎾'] },
        { id: 'info', label: 'Bilgi', icon: Info, color: 'bg-green-100 text-green-600', emojis: ['💧', '🌳', '🚽', '💡'] },
        { id: 'warning', label: 'Uyarı', icon: AlertTriangle, color: 'bg-orange-100 text-orange-600', emojis: ['⚠️', '🐕‍🦺', '🌵', '🔇'] },
        { id: 'love', label: 'Sevgi', icon: Heart, color: 'bg-pink-100 text-pink-600', emojis: ['❤️', '✨', '🦴', '🌟'] },
    ] as const;

    const currentTypeData = MARK_TYPES.find(t => t.id === selectedType)!;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            type: selectedType,
            emoji: selectedEmoji,
            message: message
        });
        setMessage("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card dark:bg-[#1A1A1A] w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-foreground dark:text-white">İşaret Bırak</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Diğer Moffi'lere bir not bırakın.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* 1. Type Selection */}
                    <div className="grid grid-cols-4 gap-2">
                        {MARK_TYPES.map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => { setSelectedType(type.id); setSelectedEmoji(type.emojis[0]); }}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all",
                                    selectedType === type.id
                                        ? "border-[#5B4D9D] bg-[#5B4D9D]/5"
                                        : "border-card-border dark:border-card-border hover:bg-gray-50 dark:hover:bg-white/5"
                                )}
                            >
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", type.color)}>
                                    <type.icon className="w-5 h-5" />
                                </div>
                                <span className={cn("text-[10px] font-bold", selectedType === type.id ? "text-[#5B4D9D]" : "text-gray-500")}>
                                    {type.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* 2. Emoji Selection */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block ml-1">Simge Seçin</label>
                        <div className="flex gap-3 overflow-x-auto p-1">
                            {currentTypeData.emojis.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setSelectedEmoji(emoji)}
                                    className={cn(
                                        "w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all bg-gray-50 dark:bg-white/5 border-2",
                                        selectedEmoji === emoji ? "border-[#5B4D9D] scale-110" : "border-transparent hover:scale-105"
                                    )}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Message Input */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block ml-1">Mesajınız</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Örn: Buradaki çeşme çalışıyor!"
                            rows={3}
                            maxLength={80}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-card-border dark:border-card-border rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4D9D]"
                        />
                        <div className="text-right mt-1 text-[10px] text-gray-400 font-bold">{message.length}/80</div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!message.trim()}
                        className="w-full bg-[#5B4D9D] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#4a3e80] transition-colors disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                        İşareti Haritaya Bırak
                    </button>

                </form>
            </div>
        </div>
    );
}
