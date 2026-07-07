"use client";

import { useState, useRef, useEffect } from "react";
import { X, Camera, Save, User as UserIcon, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/context/AuthContext";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    onSave: (data: Partial<User>) => void;
}

export default function EditProfileModal({ isOpen, onClose, currentUser, onSave }: EditProfileModalProps) {
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.username);
            setBio(currentUser.bio || "");
            setAvatarPreview(currentUser.avatar || null);
        }
    }, [currentUser, isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onSave({
            username: name,
            bio: bio,
            avatar: avatarPreview || undefined
        });
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
                        className="fixed inset-x-4 top-20 bottom-24 z-50 bg-card dark:bg-[#1A1A1A] border border-card-border dark:border-card-border rounded-[2rem] p-6 flex flex-col shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-foreground dark:text-white">Profili Düzenle</h2>
                            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Avatar Edit */}
                        <div className="flex flex-col items-center mb-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative w-28 h-28 rounded-full border-4 border-card-border dark:border-card-border cursor-pointer group overflow-hidden"
                            >
                                <img
                                    src={avatarPreview || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400"}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            <p className="text-xs text-purple-500 font-bold mt-2">Fotoğrafı Değiştir</p>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-4 flex-1">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 ml-1">Kullanıcı Adı</label>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-card-border dark:border-card-border">
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-transparent outline-none flex-1 text-sm font-bold text-foreground dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 ml-1">Biyografi</label>
                                <div className="flex items-start gap-2 bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-card-border dark:border-card-border h-24">
                                    <Type className="w-4 h-4 text-gray-400 mt-1" />
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="bg-transparent outline-none flex-1 text-sm text-foreground dark:text-white resize-none"
                                        placeholder="Kendinden bahset..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            className="mt-6 w-full py-4 bg-[#5B4D9D] hover:bg-[#4a3e80] rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                        >
                            <Save className="w-5 h-5" /> Değişiklikleri Kaydet
                        </motion.button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
