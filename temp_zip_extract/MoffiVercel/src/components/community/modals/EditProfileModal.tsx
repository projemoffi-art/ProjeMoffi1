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
    editAllowComments?: boolean;
    setEditAllowComments?: (val: boolean) => void;
    editCommentPrivacy?: string;
    setEditCommentPrivacy?: (val: string) => void;
    editFilterWords?: string;
    setEditFilterWords?: (val: string) => void;
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
    coverInputRef: externalCoverInputRef, // Rename or ignore since we will use local refs
    editAllowComments = true,
    setEditAllowComments,
    editCommentPrivacy = "everyone",
    setEditCommentPrivacy,
    editFilterWords = "",
    setEditFilterWords
}: EditProfileModalProps) {
    const localCoverInputRef = React.useRef<HTMLInputElement>(null);
    const profileInputRef = React.useRef<HTMLInputElement>(null);

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

                        <div 
                            className="relative h-40 sm:h-48 w-full rounded-3xl mb-16 border border-card-border" 
                        >
                            <div className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden group cursor-pointer block">
                                {editCoverPreview ? (
                                    <img src={editCoverPreview} className="w-full h-full object-cover" alt="Cover Preview" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-cyan-900/20 to-purple-900/20 opacity-40" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <Camera className="w-6 h-6 text-white mb-2" />
                                    <span className="text-[10px] text-white font-black uppercase tracking-widest">Kapağı Değiştir</span>
                                </div>
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setEditCoverFile(file);
                                            setEditCoverPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </div>

                            {/* AVATAR OVERLAP */}
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex justify-center z-20">
                                <div className="w-24 h-24 rounded-full border-4 border-background flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors bg-foreground/10 overflow-hidden group shadow-2xl relative">
                                    {editAvatarPreview ? (
                                        <div className="w-full h-full relative">
                                            <img src={editAvatarPreview} className="w-full h-full object-cover" alt="Avatar Preview" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <Camera className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Camera className="w-6 h-6 text-secondary mb-1 pointer-events-none" />
                                            <span className="text-[8px] text-secondary font-black uppercase tracking-widest pointer-events-none">Profil</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setEditAvatarFile(file);
                                                setEditAvatarPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </div>
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

                            {/* GLOBAL COMMENT ECOSYSTEM SETTINGS */}
                            <div className="pt-4 border-t border-card-border space-y-5">
                                <h3 className="text-xs font-black text-accent uppercase tracking-widest pl-2">Global Yorum & Moderasyon</h3>
                                
                                <div className="flex items-center justify-between bg-foreground/5 p-4 rounded-2xl border border-card-border">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-foreground">Yorumlara İzin Ver</span>
                                        <span className="text-[10px] text-secondary">Gönderilerine yapılan yeni yorumları aç/kapat</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditAllowComments?.(!editAllowComments)}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-colors relative p-1",
                                            editAllowComments ? "bg-accent" : "bg-foreground/20"
                                        )}
                                    >
                                        <motion.div
                                            layout
                                            className="w-4 h-4 rounded-full bg-card shadow-moffi-card"
                                            style={{ float: editAllowComments ? "right" : "left" }}
                                        />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">Kimler Yorum Yapabilir?</label>
                                    <select
                                        value={editCommentPrivacy}
                                        onChange={e => setEditCommentPrivacy?.(e.target.value)}
                                        className="w-full bg-foreground/5 border border-card-border rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent/50 transition-all font-bold text-xs"
                                    >
                                        <option value="everyone" className="bg-background text-foreground">Herkes (Genel Açık)</option>
                                        <option value="followers" className="bg-background text-foreground">Sadece Takipçilerim</option>
                                        <option value="none" className="bg-background text-foreground">Hiç Kimse</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">Otomatik Filtre / Yasaklı Kelimeler</label>
                                    <input 
                                        type="text" 
                                        value={editFilterWords} 
                                        onChange={e => setEditFilterWords?.(e.target.value)} 
                                        className="w-full bg-foreground/5 border border-card-border rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent/50 transition-all font-medium text-xs" 
                                        placeholder="spam, hakaret, reklam (virgülle ayırın)" 
                                    />
                                    <p className="text-[9px] text-secondary pl-2">Bu kelimeleri içeren yorumlar otomatik olarak onay bekleyen duruma (pending) alınır.</p>
                                </div>
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
