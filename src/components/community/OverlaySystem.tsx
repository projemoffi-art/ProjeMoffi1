"use client";

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Grid3X3, List, Users, Coins, Globe, Package, Heart } from 'lucide-react';
import { cn, showToast } from '@/lib/utils';

// Components
import { ShareSheet } from './ShareSheet';
import { NotificationsDrawer } from './NotificationsDrawer';
import { PetSettingsModal } from '../profile/PetSettingsModal';
import { VetQuickSheet } from '../vet/VetQuickSheet';
import { WalkQuickSheet } from '../walk/WalkQuickSheet';
import { MarketQuickSheet } from '../shop/MarketQuickSheet';
import { StudioQuickSheet } from '../studio/StudioQuickSheet';
import { GameQuickSheet } from '../game/GameQuickSheet';
import { EcosystemPortal } from './EcosystemPortal';
import { SpotlightSearch } from './SpotlightSearch';
import { DiaryModal } from './DiaryModal';
import { MoffiAssistant } from '../ai/MoffiAssistant';

interface OverlaySystemProps {
    user: any;
    userPets: any[];
    activePet: any;
    switchPet: (id: string) => void;
    updatePet: (id: string, updates: any) => void;
    
    // UI States
    isProfileMenuOpen: boolean;
    setIsProfileMenuOpen: (open: boolean) => void;
    profileViewMode: string;
    setProfileViewMode: (mode: string) => void;
    
    qrModalPet: any;
    setQrModalPet: (pet: any) => void;
    isFullScreenQR: boolean;
    setIsFullScreenQR: (open: boolean) => void;
    
    selectedSharePost: any;
    setSelectedSharePost: (post: any) => void;
    
    isNotificationsOpen: boolean;
    setIsNotificationsOpen: (open: boolean) => void;
    notificationsList: any[];
    setNotificationsList: (list: any[]) => void;
    
    isPetSettingsOpen: boolean;
    setIsPetSettingsOpen: (open: boolean) => void;
    settingsPet: any;
    
    isVetQuickSheetOpen: boolean;
    setIsVetQuickSheetOpen: (open: boolean) => void;
    isWalkQuickSheetOpen: boolean;
    setIsWalkQuickSheetOpen: (open: boolean) => void;
    isMarketQuickSheetOpen: boolean;
    setIsMarketQuickSheetOpen: (open: boolean) => void;
    isStudioQuickSheetOpen: boolean;
    setIsStudioQuickSheetOpen: (open: boolean) => void;
    isGameQuickSheetOpen: boolean;
    setIsGameQuickSheetOpen: (open: boolean) => void;
    isEcosystemPortalOpen: boolean;
    setIsEcosystemPortalOpen: (open: boolean) => void;
    isSpotlightOpen: boolean;
    setIsSpotlightOpen: (open: boolean) => void;
    isDiaryOpen: boolean;
    setIsDiaryOpen: (open: boolean) => void;
    
    setActiveTab: (tab: string) => void;
}

export const OverlaySystem: React.FC<OverlaySystemProps> = ({
    user, userPets, activePet, switchPet, updatePet,
    isProfileMenuOpen, setIsProfileMenuOpen, profileViewMode, setProfileViewMode,
    qrModalPet, setQrModalPet, isFullScreenQR, setIsFullScreenQR,
    selectedSharePost, setSelectedSharePost,
    isNotificationsOpen, setIsNotificationsOpen, notificationsList, setNotificationsList,
    isPetSettingsOpen, setIsPetSettingsOpen, settingsPet,
    isVetQuickSheetOpen, setIsVetQuickSheetOpen,
    isWalkQuickSheetOpen, setIsWalkQuickSheetOpen,
    isMarketQuickSheetOpen, setIsMarketQuickSheetOpen,
    isStudioQuickSheetOpen, setIsStudioQuickSheetOpen,
    isGameQuickSheetOpen, setIsGameQuickSheetOpen,
    isEcosystemPortalOpen, setIsEcosystemPortalOpen,
    isSpotlightOpen, setIsSpotlightOpen,
    isDiaryOpen, setIsDiaryOpen,
    setActiveTab
}) => {
    return (
        <>
            {/* QR CODE GENERATOR MODAL (PET-ID) */}
            <AnimatePresence>
                {qrModalPet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                        onClick={() => setQrModalPet(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-[#1C1C1E] border border-white/10 p-6 rounded-[2.5rem] w-full max-w-sm flex flex-col items-center shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img src={qrModalPet.avatar} className="absolute inset-0 w-full h-full object-cover opacity-10 blur-xl pointer-events-none" />

                            <div className="relative z-10 w-full flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full border-2 border-cyan-400 p-0.5 mb-4 shadow-lg shrink-0">
                                    <img src={qrModalPet.avatar} className="w-full h-full rounded-full object-cover" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-1">{qrModalPet.name} - Akıllı Kimlik</h3>
                                <p className="text-sm text-secondary font-medium mb-6">Bu QR Kodu Moffi Künyesine yazdırın veya tasmaya yapıştırın.</p>

                                <div 
                                    className="bg-white p-4 rounded-3xl shadow-[0_0_30px_rgba(34,211,238,0.4)] border-4 border-cyan-400/50 mb-6 active:scale-95 transition-transform cursor-pointer" 
                                    onClick={() => setIsFullScreenQR(true)}
                                >
                                    <QRCodeSVG
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/id/${qrModalPet.id}`}
                                        size={180}
                                        bgColor="#FFFFFF"
                                        fgColor="#000000"
                                        level="H"
                                    />
                                </div>

                                <div className="flex gap-2 w-full">
                                    <button className="flex-1 bg-white text-black font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs" onClick={() => showToast("İndirme Başlatıldı", "QR Kimlik PDF formatında hazırlandı.", "info")}>
                                        <Download className="w-4 h-4" />
                                        PDF İndir
                                    </button>
                                    <button className="flex-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs" onClick={() => window.open(`${window.location.origin}/id/${qrModalPet.id}`, '_blank')}>
                                        Profil Aç
                                    </button>
                                </div>
                            </div>

                            <button onClick={() => setQrModalPet(null)} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white z-20">
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FULL SCREEN QR EXPANSION */}
            <AnimatePresence>
                {isFullScreenQR && qrModalPet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6"
                        onClick={() => setIsFullScreenQR(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white p-10 rounded-[4rem] shadow-[0_0_100px_rgba(34,211,238,0.3)] flex flex-col items-center gap-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center">
                                <h3 className="text-3xl font-black text-black tracking-tighter uppercase italic">{qrModalPet.name}</h3>
                                <p className="text-xs font-bold text-cyan-600 uppercase tracking-[0.4em] mt-1">Moffi Akıllı Kimlik</p>
                            </div>

                            <div className="p-4 bg-white rounded-[2rem]">
                                <QRCodeSVG
                                    value={`${window.location.origin}/id/${qrModalPet.id}`}
                                    size={300}
                                    bgColor="#FFFFFF"
                                    fgColor="#000000"
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <button 
                                onClick={() => setIsFullScreenQR(false)}
                                className="text-black/40 font-bold uppercase text-[10px] tracking-widest hover:text-black transition-colors"
                            >
                                Kapatmak için dokun
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MOFFI BENTO SELECTOR OVERLAY */}
            <AnimatePresence>
                {isProfileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[700] backdrop-blur-3xl flex items-center justify-center p-6 bg-black/40"
                        onClick={() => setIsProfileMenuOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 100 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 100 }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.4}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 100) setIsProfileMenuOpen(false);
                            }}
                            className="w-full max-w-sm bg-[#0A0A0E]/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 pb-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div 
                                onClick={() => setIsProfileMenuOpen(false)}
                                className="absolute top-0 left-0 right-0 h-10 flex justify-center items-center cursor-pointer"
                            >
                                <div className="w-16 h-1.5 bg-white/20 rounded-full" />
                            </div>

                            <div className="text-center mb-8 mt-4">
                                <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">Profil Kategorileri</h3>
                                <p className="text-2xl font-black text-white mt-1">Nereye gitmek istersin?</p>
                            </div>

                            <div className="grid grid-cols-4 grid-rows-3 gap-3 h-[450px]">
                                {[
                                    { id: 'grid', label: 'Galeri', icon: Grid3X3, color: 'text-cyan-400', span: 'col-span-2 row-span-2' },
                                    { id: 'list', label: 'Akış', icon: List, color: 'text-purple-400', span: 'col-span-2 row-span-1' },
                                    { id: 'family', label: 'Ailem', icon: Users, color: 'text-blue-400', span: 'col-span-2 row-span-1' },
                                    { id: 'wallet', label: 'Cüzdan', icon: Coins, color: 'text-amber-400', span: 'col-span-1 row-span-1' },
                                    { id: 'passport', label: 'Kimlik', icon: Globe, color: 'text-emerald-400', span: 'col-span-1 row-span-1' },
                                    { id: 'orders', label: 'Siparişler', icon: Package, color: 'text-orange-400', span: 'col-span-2 row-span-1' },
                                    { id: 'saved', label: 'Favoriler', icon: Heart, color: 'text-red-400', span: 'col-span-2 row-span-1' },
                                ].map((tab) => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => { setProfileViewMode(tab.id); setIsProfileMenuOpen(false); }}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-[2rem] border transition-all active:scale-95 group relative overflow-hidden",
                                            tab.span,
                                            profileViewMode === tab.id 
                                                ? "bg-white border-white shadow-[0_15px_40px_rgba(255,255,255,0.2)]" 
                                                : "bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all mb-2",
                                            profileViewMode === tab.id ? "bg-black text-white" : cn("bg-black/20", tab.color)
                                        )}>
                                            <tab.icon className={cn(tab.id === 'grid' ? "w-6 h-6" : "w-5 h-5")} />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest",
                                            profileViewMode === tab.id ? "text-black" : "text-white/60"
                                        )}>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SYSTEM OVERLAYS */}
            {selectedSharePost && (
                <ShareSheet 
                    isOpen={true}
                    selectedPost={selectedSharePost} 
                    onClose={() => setSelectedSharePost(null)}
                    onSocialShare={(platform) => { showToast("Paylaşıldı", `${platform} ile paylaşıldı!`, "info"); setSelectedSharePost(null); }}
                    onAddToStory={() => { showToast("Hikaye", "Hikayenize eklendi! 📸", "info"); setSelectedSharePost(null); }}
                    onCopyLink={() => { navigator.clipboard.writeText(window.location.href); showToast("Kopyalandı", "Bağlantı kopyalandı!", "info"); setSelectedSharePost(null); }}
                />
            )}

            <NotificationsDrawer
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notificationsList}
                onMarkAllRead={() => setNotificationsList(notificationsList.map(n => ({...n, read: true})))}
                unreadCount={notificationsList.filter(n => !n.read).length}
            />

            <PetSettingsModal 
                isOpen={isPetSettingsOpen}
                onClose={() => setIsPetSettingsOpen(false)}
                pet={settingsPet}
                onSave={(updatedFields) => {
                    if (settingsPet) {
                        updatePet(settingsPet.id, updatedFields);
                    }
                    showToast("Kaydedildi", "Pasaport bilgileri Moffi Cloud'a mühürlendi! 🛡️", "info");
                }}
            />

            {isVetQuickSheetOpen && (
                <VetQuickSheet 
                    isOpen={isVetQuickSheetOpen} 
                    onClose={() => setIsVetQuickSheetOpen(false)}
                    petId={activePet?.id || 'pet-1'}
                />
            )}
            
            {isWalkQuickSheetOpen && (
                <WalkQuickSheet 
                    isOpen={isWalkQuickSheetOpen} 
                    onClose={() => setIsWalkQuickSheetOpen(false)}
                    petId={activePet?.id || 'pet-1'}
                />
            )}
            
            {isMarketQuickSheetOpen && (
                <MarketQuickSheet
                    isOpen={isMarketQuickSheetOpen}
                    onClose={() => setIsMarketQuickSheetOpen(false)}
                    petName={activePet?.name || 'Dostun'}
                />
            )}
            
            {isStudioQuickSheetOpen && (
                <StudioQuickSheet
                    isOpen={isStudioQuickSheetOpen}
                    onClose={() => setIsStudioQuickSheetOpen(false)}
                    petName={activePet?.name || 'Moffi'}
                />
            )}
            
            {isGameQuickSheetOpen && (
                <GameQuickSheet
                    isOpen={isGameQuickSheetOpen}
                    onClose={() => setIsGameQuickSheetOpen(false)}
                    petName={activePet?.name || 'Moffi'}
                />
            )}

            {isEcosystemPortalOpen && (
                <EcosystemPortal 
                    isOpen={isEcosystemPortalOpen}
                    onClose={() => setIsEcosystemPortalOpen(false)}
                />
            )}
            
            {isSpotlightOpen && (
                <SpotlightSearch 
                    isOpen={isSpotlightOpen}
                    onClose={() => setIsSpotlightOpen(false)}
                    onNavigate={(type, id) => {
                        if (type === 'pet') { 
                            switchPet(id); 
                            setActiveTab('profile'); 
                            setProfileViewMode('grid');
                        }
                        if (type === 'user') {
                            setActiveTab('profile');
                            setProfileViewMode('grid');
                        }
                        if (id === 'vax') { 
                            setActiveTab('profile');
                            setProfileViewMode('appointments'); 
                        }
                        if (id === 'vet') setIsVetQuickSheetOpen(true);
                        if (id === 'market') setIsMarketQuickSheetOpen(true);
                    }}
                />
            )}
            
            {isDiaryOpen && (
                <DiaryModal 
                    isOpen={isDiaryOpen}
                    onClose={() => setIsDiaryOpen(false)}
                />
            )}

            <MoffiAssistant />
        </>
    );
};
