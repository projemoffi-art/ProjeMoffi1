'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Check } from 'lucide-react';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    editName: string;
    setEditName: (val: string) => void;
    editUsername: string;
    setEditUsername: (val: string) => void;
    editBio: string;
    setEditBio: (val: string) => void;
    editAvatarPreview: string | null;
    setEditAvatarPreview: (val: string | null) => void;
    editCoverPreview: string | null;
    setEditCoverPreview: (val: string | null) => void;
    editAvatarFile: File | null;
    setEditAvatarFile: (val: File | null) => void;
    editCoverFile: File | null;
    setEditCoverFile: (val: File | null) => void;
    isSavingProfile: boolean;
    onSave: () => Promise<void>;
    coverInputRef: React.RefObject<HTMLInputElement>;
}

export function EditProfileModal({
    isOpen,
    onClose,
    user,
    editName,
    setEditName,
    editUsername,
    setEditUsername,
    editBio,
    setEditBio,
    editAvatarPreview,
    setEditAvatarPreview,
    editCoverPreview,
    setEditCoverPreview,
    editAvatarFile,
    setEditAvatarFile,
    editCoverFile,
    setEditCoverFile,
    isSavingProfile,
    onSave,
    coverInputRef
}: EditProfileModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center px-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-sm bg-[#12121A] border border-white/10 rounded-[2rem] p-6 shadow-2xl relative"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 bg-white/5 p-2 rounded-full hover:bg-white/10 z-10 transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-6">Profili Düzenle</h2>

                        <div className="relative h-32 w-full rounded-2xl overflow-hidden mb-12 group cursor-pointer border border-white/10" onClick={() => coverInputRef.current?.click()}>
                            {editCoverPreview ? (
                                <img src={editCoverPreview} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-cyan-900 to-purple-900 opacity-40" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-5 h-5 text-white mb-1" />
                                <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Kapağı Değiştir</span>
                            </div>
                            <input
                                type="file"
                                ref={coverInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setEditCoverFile(file);
                                        setEditCoverPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />

                            {/* AVATAR OVERLAP */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex justify-center z-20">
                                <label htmlFor="edit-profile-upload" className="w-20 h-20 rounded-full border-4 border-[#12121A] flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition-colors bg-[#1C1C1E] overflow-hidden group shadow-xl">
                                    {editAvatarPreview ? (
                                        <div className="w-full h-full relative">
                                            <img src={editAvatarPreview} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Camera className="w-5 h-5 text-gray-400 mb-0.5" />
                                            <span className="text-[8px] text-gray-500 font-bold uppercase">Profil</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        id="edit-profile-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setEditAvatarFile(file);
                                                setEditAvatarPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 font-bold ml-2">İsim (Görünen Ad)</label>
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mt-1 outline-none focus:border-cyan-400 transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold ml-2">Kullanıcı Adı</label>
                                <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mt-1 outline-none focus:border-cyan-400 transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold ml-2">Biyografi</label>
                                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mt-1 outline-none focus:border-cyan-400 transition-colors resize-none" />
                            </div>
                            <button
                                disabled={isSavingProfile}
                                onClick={onSave}
                                className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isSavingProfile ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Değişiklikleri Kaydet
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
