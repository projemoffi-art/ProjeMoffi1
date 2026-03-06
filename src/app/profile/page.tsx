"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Settings, Edit3, MapPin, Calendar,
    Grid, Bookmark, Clock, ChevronRight,
    Package, Heart, PawPrint, LogOut,
    Trophy, Coins, ShoppingBag, CreditCard,
    Globe, ShieldCheck, Plane,
    Users, Activity, Plus, Footprints, Utensils
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocial } from "@/context/SocialContext";
import { useAuth } from "@/context/AuthContext";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { cn } from "@/lib/utils";
import { PetSwitcher } from "@/components/common/PetSwitcher";
import { FamilyTab } from "@/components/profile/FamilyTab";

// --- MOCK DATA FOR WALLET & ORDERS ---
const ORDERS = [
    { id: 'ord-1', item: "Premium Köpek Maması", status: "Teslim Edildi", date: "12 Ara 2025", price: "450 TL", img: "https://images.unsplash.com/photo-1589924691195-41432c84c161?q=80&w=100" },
    { id: 'ord-2', item: "Moffi Özel Tasarım Tasma", status: "Kargoda", date: "14 Ara 2025", price: "250 TL", img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=100" },
];

const APPOINTMENTS = [
    { id: 'apt-1', clinic: "VetLife Clinic", type: "Genel Muayene", date: "18 Ara, 14:30", status: "Onaylandı" }
];



export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, updateProfile } = useAuth();
    const { posts } = useSocial();
    const [activeTab, setActiveTab] = useState<'posts' | 'orders' | 'wallet' | 'passport' | 'family'>('posts');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Filter posts: Currently checking for 'current_user' as set in SocialContext mock logic
    // In a real integrated scenario, SocialContext would use AuthContext.user.id
    const myPosts = posts.filter(p => p.userId === 'current_user');

    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-black pb-32">

            {/* --- HEADER & HERO --- */}
            <header className="relative bg-white dark:bg-[#1A1A1A] pb-8 rounded-b-[2.5rem] shadow-xl overflow-hidden">
                {/* Cover Image */}
                <div className="h-40 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 w-full relative">
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="px-6 -mt-12 flex flex-col items-center">
                    {/* Avatar Group */}
                    <div className="relative cursor-pointer group" onClick={() => setIsEditModalOpen(true)}>
                        <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#1A1A1A] bg-gray-200 overflow-hidden shadow-lg relative">
                            <img src={user?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400"} className="w-full h-full object-cover" />
                            {/* Edit Overlay */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit3 className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        {/* Pet Switcher (Replaces Mini Icon) */}
                        <div className="absolute -bottom-2 -right-4 z-20 scale-90">
                            <PetSwitcher mode="badge" />
                        </div>
                    </div>

                    <h1 className="mt-3 text-2xl font-black text-gray-900 dark:text-white text-center">
                        {user?.username || "Moffi Dostu"}
                    </h1>

                    {user?.bio && (
                        <p className="text-gray-500 text-sm font-medium mb-1 text-center max-w-xs">{user.bio}</p>
                    )}
                    <p className="text-gray-400 text-xs font-semibold mb-4 text-center">İstanbul, Türkiye</p>

                    {/* Stats Row */}
                    <div className="flex items-center gap-8 mb-6">
                        <div className="text-center">
                            <div className="text-lg font-black text-gray-900 dark:text-white">{myPosts.length}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Gönderi</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                        <div className="text-center">
                            <div className="text-lg font-black text-gray-900 dark:text-white">
                                {user?.stats?.followers || 0}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Takipçi</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                        <div className="text-center">
                            <div className="text-lg font-black text-gray-900 dark:text-white">
                                {user?.stats?.following || 0}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Takip</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 w-full max-w-sm">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex-1 py-3 bg-[#5B4D9D] text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <Edit3 className="w-4 h-4" /> Profili Düzenle
                        </button>
                        <button
                            onClick={logout}
                            className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Level Progress */}
                <div className="mx-6 mt-6 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <Trophy className="w-6 h-6 text-yellow-900" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">Level 5</span>
                            <span className="text-[10px] font-bold text-gray-400">1250 / 2000 XP</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 w-[60%]" />
                        </div>
                    </div>
                </div>
            </header>

            {/* --- CONTENT TABS --- */}
            <main className="px-6 py-6">
                <div className="flex justify-between items-center bg-white dark:bg-[#1A1A1A] p-1.5 rounded-2xl mb-6 shadow-sm">
                    {[
                        { id: 'posts', label: 'Galeri', icon: Grid },
                        { id: 'family', label: 'Ailem', icon: Users },
                        { id: 'passport', label: 'Pasaport', icon: Globe },
                        { id: 'wallet', label: 'Cüzdan', icon: Coins },
                        { id: 'orders', label: 'Sipariş', icon: Package },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            //@ts-ignore
                            onClick={() => {
                                if (tab.id === 'wallet') {
                                    router.push('/wallet');
                                } else {
                                    setActiveTab(tab.id);
                                }
                            }}
                            className={cn(
                                "flex-1 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all",
                                activeTab === tab.id
                                    ? "bg-[#5B4D9D] text-white shadow-md"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* 1. MASONRY GALLERY */}
                    {activeTab === 'posts' && (
                        <motion.div
                            key="posts"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="columns-2 gap-4 space-y-4"
                        >
                            {/* Add New Post Placeholder */}
                            <div className="break-inside-avoid w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer hover:border-[#5B4D9D] hover:text-[#5B4D9D] transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold">Yeni Ekle</span>
                            </div>

                            {myPosts.length > 0 ? myPosts.map((post) => (
                                <div key={post.id} className="break-inside-avoid relative rounded-2xl overflow-hidden group mb-4">
                                    <img src={post.image} className="w-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                                        <div className="flex items-center gap-1 font-bold"><Heart className="w-4 h-4 fill-current" /> {post.likes}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 text-center text-gray-400 text-xs py-10">Henüz gönderi yok. Toplulukta paylaşım yap!</div>
                            )}
                        </motion.div>
                    )}


                    {/* 5. FAMILY SYNC (New Live Simulation) */}
                    {activeTab === 'family' && (
                        <FamilyTab />
                    )}

                    {activeTab === 'wallet' && (
                        <motion.div
                            key="wallet"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {/* Balance Card */}
                            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2rem] p-6 text-white shadow-xl shadow-yellow-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-1 opacity-90">
                                        <Coins className="w-5 h-5" />
                                        <span className="text-sm font-bold tracking-wide">PAWCOIN BAKİYESİ</span>
                                    </div>
                                    <div className="text-4xl font-black mb-6">2,450 PC</div>
                                    <div className="flex gap-3">
                                        <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur py-2 rounded-xl font-bold text-xs transition-colors">
                                            Kazan
                                        </button>
                                        <button className="flex-1 bg-white text-orange-600 py-2 rounded-xl font-bold text-xs shadow-md transition-colors">
                                            Harcama Yap
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Transactions */}
                            <h3 className="font-bold text-gray-900 dark:text-white px-2 mt-2">Son Hareketler</h3>
                            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-2 border border-gray-100 dark:border-white/5">
                                {[
                                    { title: "Moffi Run Ödülü", date: "Bugün", val: "+150", type: 'gain' },
                                    { title: "Yürüyüş Bonusu", date: "Dün", val: "+50", type: 'gain' },
                                    { title: "Market Alışverişi", date: "10 Ara", val: "-450", type: 'spend' },
                                ].map((t, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", t.type === 'gain' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                                                {t.type === 'gain' ? <Coins className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{t.title}</div>
                                                <div className="text-[10px] text-gray-500">{t.date}</div>
                                            </div>
                                        </div>
                                        <div className={cn("font-bold text-sm", t.type === 'gain' ? "text-green-500" : "text-gray-900 dark:text-white")}>
                                            {t.val} PC
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* 3. ORDERS & HISTORY */}
                    {activeTab === 'orders' && (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Active Orders */}
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[#5B4D9D]" /> Siparişlerim
                                </h3>
                                <div className="space-y-3">
                                    {ORDERS.map((order) => (
                                        <div key={order.id} className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-100 dark:border-white/5 flex gap-4">
                                            <img src={order.img} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{order.item}</h4>
                                                    <span className="text-xs font-black text-[#5B4D9D]">{order.price}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mb-2">{order.date}</p>
                                                <div className={cn("px-2 py-1 rounded-md text-[10px] font-bold inline-block", order.status === 'Teslim Edildi' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                                                    {order.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Appointments */}
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-red-500" /> Randevular
                                </h3>
                                {APPOINTMENTS.map((apt) => (
                                    <div key={apt.id} className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/10 rounded-xl flex items-center justify-center text-red-500">
                                                <Heart className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-gray-900 dark:text-white">{apt.clinic}</div>
                                                <div className="text-xs text-gray-500">{apt.type} • {apt.date}</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* 4. PASSPORT (New Digital ID) */}
                    {activeTab === 'passport' && (
                        <motion.div
                            key="passport"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* DIGITAL PASSPORT CARD */}
                            <div className="bg-[#1A1A2E] text-white rounded-[2rem] p-6 relative overflow-hidden shadow-2xl shadow-blue-900/40 border border-white/10 group">
                                {/* Decor */}
                                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />

                                {/* Header */}
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                                            <Globe className="w-6 h-6 text-blue-300" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl tracking-tight">MOFFI PASSPORT</h3>
                                            <p className="text-[10px] text-blue-200 font-medium tracking-widest uppercase">Republic of Moffi</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold">ACTIVE</span>
                                    </div>
                                </div>

                                {/* Pet Details Grid */}
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6 relative z-10">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Name / Surname</p>
                                        <p className="font-mono text-lg font-bold">MOCHI <span className="opacity-50">YILMAZ</span></p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Breed</p>
                                        <p className="font-mono text-sm font-bold">Golden Retriever</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Date of Birth</p>
                                        <p className="font-mono text-sm font-bold">12.04.2023</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Microchip ID</p>
                                        <p className="font-mono text-sm text-yellow-400 tracking-widest">990000012345</p>
                                    </div>
                                </div>

                                {/* Authenticity Footer */}
                                <div className="border-t border-white/10 pt-4 flex justify-between items-end relative z-10">
                                    <div>
                                        <div className="w-16 h-16 bg-white p-1 rounded-xl">
                                            {/* Fake QR for demo */}
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MoffiPassport_MOCHI_12345`} className="w-full h-full object-contain" />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Issuer Signature</p>
                                        <p className="font-handwriting text-xl text-blue-300 transform -rotate-6 opacity-80">MoffiApp</p>
                                    </div>
                                </div>
                            </div>

                            {/* VACCINE STATUS CARD */}
                            <div className="bg-white dark:bg-[#1A1A1A] p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-green-500" /> Aşı Durumu
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { name: "Karma Aşı (DHPPi)", date: "12.08.2025", status: "ok" },
                                        { name: "Kuduz (Rabies)", date: "15.01.2026", status: "ok" },
                                        { name: "Bronşin (Kc)", date: "10.02.2024", status: "expiring" },
                                    ].map((vac, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-2 h-2 rounded-full", vac.status === 'ok' ? "bg-green-500" : "bg-orange-500")} />
                                                <div>
                                                    <div className="font-bold text-sm text-gray-900 dark:text-white">{vac.name}</div>
                                                    <div className="text-[10px] text-gray-500">Geçerlilik: {vac.date}</div>
                                                </div>
                                            </div>
                                            {vac.status === 'expiring' && (
                                                <button className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-lg">Yenile</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* TRAVEL READINESS */}
                            <div className="bg-[#E3F2FD] dark:bg-blue-900/20 p-5 rounded-[2rem] border border-blue-100 dark:border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                        <Plane className="w-5 h-5 text-blue-500" /> Seyahat Modu
                                    </h3>
                                    <span className="bg-white dark:bg-black/20 text-blue-600 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded-lg">Hazır Değil</span>
                                </div>
                                <p className="text-xs text-blue-800 dark:text-blue-200 opacity-80 mb-3">
                                    Yurtdışı çıkışı için "Titre Testi" sonucu sisteme yüklenmedi.
                                </p>
                                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition-colors">
                                    Eksikleri Tamamla
                                </button>
                            </div>

                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

            {/* EDIT PROFILE MODAL */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentUser={user}
                onSave={updateProfile}
            />
        </div>
    );
}
