'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Settings, Sparkles, Edit3, Grid3X3, List, Bookmark, 
    Plus, Check, ShieldAlert, Heart, Users, Globe, Package, Coins, Calendar, Map, ChevronLeft 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImmersivePostCard } from './ImmersivePostCard';
import { FamilyTab } from '../profile/FamilyTab';
import { PassportTab } from '../profile/PassportTab';

interface ProfileTabProps {
    user: any;
    userPets: any[];
    onEditProfile: () => void;
    onAddPet: () => void;
    onSettings: () => void;
    onPetQR: (pet: any) => void;
    onSOSSettings?: (pet: any) => void;
    posts?: any[];
    onLike?: (id: number) => void;
    isCommentsDisabled?: boolean;
}

export function ProfileTab({
    user,
    userPets,
    onEditProfile,
    onAddPet,
    onSettings,
    onPetQR,
    onSOSSettings,
    posts = [],
    onLike = () => {},
    isCommentsDisabled = false
}: ProfileTabProps) {
    const [viewMode, setViewMode] = useState('grid'); // grid, list, saved
    const [activeSubView, setActiveSubView] = useState<'main' | 'family' | 'passport' | 'orders' | 'wallet' | 'appointments' | 'routes'>('main');

    // MOCK DATA FOR WALLET & ORDERS (Similar to [id]/page.tsx)
    const ORDERS = [
        { id: 'ord-1', item: "Premium Köpek Maması", status: "Teslim Edildi", date: "12 Ara 2025", price: "450 TL", img: "https://images.unsplash.com/photo-1589924691195-41432c84c161?q=80&w=100" },
        { id: 'ord-2', item: "Moffi Özel Tasarım Tasma", status: "Kargoda", date: "14 Ara 2025", price: "250 TL", img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=100" },
    ];

    return (
        <motion.div
            key="profile"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full w-full overflow-y-auto no-scrollbar pb-32 bg-[#0A0A0E]"
        >
            <AnimatePresence mode="wait">
                {activeSubView === 'main' ? (
                    <motion.div
                        key="main-profile"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="w-full h-48 bg-[#12121A] relative overflow-hidden">
                            {user?.cover_photo ? (
                                <img src={user.cover_photo} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-cyan-900 to-purple-900 opacity-60 mix-blend-overlay" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0E] to-transparent" />
                            <button onClick={onSettings} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 relative -mt-16 mb-6">
                            <div className="flex justify-between items-end mb-4">
                                <div className="w-28 h-28 rounded-full border-4 border-[#0A0A0E] relative bg-[#0A0A0E] overflow-hidden">
                                    <img src={user?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300"} className="w-full h-full rounded-full object-cover" />
                                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-[#0A0A0E]">
                                        <Sparkles className="w-3 h-3 text-black" />
                                    </div>
                                </div>
                                <button onClick={onEditProfile} className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 font-bold text-sm bg-white/5">
                                    <Edit3 className="w-4 h-4" /> Profili Düzenle
                                </button>
                            </div>

                            <h2 className="text-2xl font-black text-white">{user?.display_name || user?.username || 'Kullanıcı'}</h2>
                            <p className="text-cyan-400 font-medium text-sm mt-0.5">@{user?.username?.toLowerCase() || 'moffi_user'}</p>
                            <p className="text-gray-300 text-sm mt-3 leading-relaxed">{user?.bio || 'Moffi Ekosistemine Hoşgeldiniz ✨'}</p>

                            {/* BENTO QUICK ACTIONS GRID */}
                            <div className="mt-8 grid grid-cols-2 gap-3">
                                {[
                                    { id: 'family', label: 'Ailem', icon: Users, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                                    { id: 'passport', label: 'Pasaport', icon: Globe, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                                    { id: 'wallet', label: 'Cüzdan', icon: Coins, color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
                                    { id: 'orders', label: 'Siparişler', icon: Package, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                                    { id: 'appointments', label: 'Sağlık', icon: Calendar, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
                                    { id: 'routes', label: 'Rotalar', icon: Map, color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSubView(item.id as any)}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-3xl border transition-all active:scale-95 text-left",
                                            item.color
                                        )}
                                    >
                                        <div className="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-[11px] uppercase tracking-widest leading-none">{item.label}</p>
                                            <p className="text-[9px] font-bold opacity-50 mt-1 uppercase tracking-tighter">Hemen Aç</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 mb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">Petlerim</h3>
                                    <button onClick={onAddPet} className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full">+ Ekle</button>
                                </div>
                                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                                    {userPets.map((pet) => (
                                        <div key={pet.id} className="min-w-[170px] bg-gradient-to-br from-[#12121A] to-[#0A0A0E] border border-white/10 rounded-3xl p-5 flex flex-col gap-3">
                                            <img src={pet.avatar || pet.cover_photo} className="w-12 h-12 rounded-full object-cover border border-white/20" />
                                            <h4 className="font-bold text-white text-lg">{pet.name}</h4>
                                            <div className="flex gap-2">
                                                <button onClick={() => onPetQR(pet)} className="flex-1 bg-white text-black py-2 rounded-xl text-[10px] font-black uppercase tracking-tight">Kart</button>
                                                {onSOSSettings && (
                                                    <button 
                                                        onClick={() => onSOSSettings(pet)} 
                                                        className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                                    >
                                                        <ShieldAlert className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-around items-center border-b border-white/5 mb-4 sticky top-0 bg-[#0A0A0E] z-20">
                            <button onClick={() => setViewMode('grid')} className={cn("flex-1 py-3 flex justify-center", viewMode === 'grid' ? "text-white border-b-2 border-white" : "text-gray-600")}><Grid3X3 className="w-6 h-6" /></button>
                            <button onClick={() => setViewMode('list')} className={cn("flex-1 py-3 flex justify-center", viewMode === 'list' ? "text-white border-b-2 border-white" : "text-gray-600")}><List className="w-6 h-6" /></button>
                        </div>

                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-3 gap-1 px-1">
                                {posts.map((post) => (
                                    <div key={post.id} className="aspect-square bg-gray-900 relative group overflow-hidden">
                                        <img src={post.media} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key={activeSubView}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="px-4 pt-4"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <button 
                                onClick={() => setActiveSubView('main')}
                                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h3 className="text-2xl font-black text-white capitalize">{activeSubView === 'appointments' ? 'Sağlık' : activeSubView === 'routes' ? 'Rotalar' : activeSubView}</h3>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Profile Geri Dön</p>
                            </div>
                        </div>

                        {activeSubView === 'family' && <FamilyTab />}
                        {activeSubView === 'passport' && (
                            <PassportTab 
                                pet={userPets[0]} 
                                onSOSSettings={() => onSOSSettings?.(userPets[0])}
                            />
                        )}
                        
                        {activeSubView === 'orders' && (
                            <div className="space-y-4">
                                {ORDERS.map(order => (
                                    <div key={order.id} className="bg-white/5 p-4 rounded-3xl border border-white/10 flex gap-4">
                                        <img src={order.img} className="w-16 h-16 rounded-2xl object-cover" />
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <h4 className="font-bold text-white text-sm">{order.item}</h4>
                                                <span className="text-cyan-400 font-black text-xs">{order.price}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{order.date} • {order.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeSubView === 'wallet' && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-[2.5rem] shadow-xl shadow-orange-500/20 text-white">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Moffi Cüzdan Bakiyesi</p>
                                    <h4 className="text-4xl font-black italic tracking-tight">2,450 PC</h4>
                                    <div className="flex gap-2 mt-6">
                                        <button className="flex-1 bg-white/20 backdrop-blur-md py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/30">Kazan</button>
                                        <button className="flex-1 bg-white text-orange-600 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100">Harcama Yap</button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Son Hareketler</p>
                                    {[
                                        { t: "Moffi Run Ödülü", v: "+150 PC", d: "Bugün", p: true },
                                        { t: "Mama Alışverişi", v: "-450 PC", d: "Dün", p: false },
                                    ].map((tx, idx) => (
                                        <div key={idx} className="bg-white/5 p-4 mx-2 rounded-2xl flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-white text-sm">{tx.t}</p>
                                                <p className="text-[9px] text-gray-500">{tx.d}</p>
                                            </div>
                                            <span className={cn("font-black", tx.p ? "text-green-400" : "text-white")}>{tx.v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {['appointments', 'routes'].includes(activeSubView) && (
                            <div className="py-20 text-center">
                                <Sparkles className="w-12 h-12 text-cyan-400/20 mx-auto mb-4" />
                                <h4 className="text-lg font-black text-white uppercase italic">Çok Yakında</h4>
                                <p className="text-xs text-gray-500 mt-2">Bu özellik Moffi ekosistemine entegre ediliyor.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
