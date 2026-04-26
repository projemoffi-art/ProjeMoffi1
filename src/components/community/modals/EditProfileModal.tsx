'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
                    className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center sm:px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "w-full max-w-lg bg-background border border-card-border shadow-2xl relative",
                            "rounded-t-[3rem] sm:rounded-[2.5rem] p-6 sm:p-8",
                            "pb-safe sm:pb-8 max-h-[92vh] overflow-y-auto no-scrollbar"
                        )}
                    >
                        {/* Mobile Handle */}
                        <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mb-6 sm:hidden" />

                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Profili Düzenle</h2>
                            <button 
                                onClick={onClose} 
                                className="w-10 h-10 bg-foreground/5 p-2 rounded-full hover:bg-foreground/10 transition-colors flex items-center justify-center"
                            >
                                <X className="w-5 h-5 text-secondary" />
                            </button>
                        </div>

                        {/* COVER & AVATAR EDIT SECTION */}
                        <div 
                            className="relative h-40 sm:h-48 w-full rounded-3xl overflow-hidden mb-16 group cursor-pointer border border-card-border" 
                            onClick={() => coverInputRef.current?.click()}
                        >
                            {editCoverPreview ? (
                                <img src={editCoverPreview} className="w-full h-full object-cover" alt="Cover Preview" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-cyan-900/20 to-purple-900/20 opacity-40" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white mb-2" />
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">Kapağı Değiştir</span>
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
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex justify-center z-20">
                                <label 
                                    htmlFor="edit-profile-upload" 
                                    className="w-24 h-24 rounded-full border-4 border-background flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors bg-foreground/10 overflow-hidden group shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {editAvatarPreview ? (
                                        <div className="w-full h-full relative">
                                            <img src={editAvatarPreview} className="w-full h-full object-cover" alt="Avatar Preview" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Camera className="w-6 h-6 text-secondary mb-1" />
                                            <span className="text-[8px] text-secondary font-black uppercase tracking-widest">Profil</span>
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

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">İsim (Görünen Ad)</label>
                                <input 
                                    type="text" 
                                    value={editName} 
                                    onChange={e => setEditName(e.target.value)} 
                                    className="w-full bg-foreground/5 border border-card-border rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent/50 transition-all font-bold" 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">Kullanıcı Adı</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary font-bold">@</span>
                                    <input 
                                        type="text" 
                                        value={editUsername} 
                                        onChange={e => setEditUsername(e.target.value)} 
                                        className="w-full bg-foreground/5 border border-card-border rounded-2xl pl-10 pr-5 py-4 text-foreground outline-none focus:border-accent/50 transition-all font-bold" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">Biyografi</label>
                                <textarea 
                                    value={editBio} 
                                    onChange={e => setEditBio(e.target.value)} 
                                    className="w-full h-32 bg-foreground/5 border border-card-border rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent/50 transition-all resize-none font-medium text-sm leading-relaxed" 
                                    placeholder="Kendinden bahset..."
                                />
                            </div>

                            <button
                                disabled={isSavingProfile}
                                onClick={onSave}
                                className="w-full py-5 mt-4 bg-foreground text-background rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSavingProfile ? (
                                    <div className="w-5 h-5 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Kaydet
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
