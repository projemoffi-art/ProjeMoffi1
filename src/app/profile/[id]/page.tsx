"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { useAuth } from "@/context/AuthContext";
import { Grid, Heart, Map, Loader2, UserX, MessageCircle, Coins, Package, Globe, Users, ShieldCheck, Plane, ChevronRight, Calendar, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PassportTab } from "@/components/profile/PassportTab";
import { SOSCommandCenter } from "@/components/profile/SOSCommandCenter";

// --- MOCK DATA FOR WALLET & ORDERS ---
const ORDERS = [
    { id: 'ord-1', item: "Premium Köpek Maması", status: "Teslim Edildi", date: "12 Ara 2025", price: "450 TL", img: "https://images.unsplash.com/photo-1589924691195-41432c84c161?q=80&w=100" },
    { id: 'ord-2', item: "Moffi Özel Tasarım Tasma", status: "Kargoda", date: "14 Ara 2025", price: "250 TL", img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=100" },
];

const APPOINTMENTS = [
    { id: 'apt-1', clinic: "VetLife Clinic", type: "Genel Muayene", date: "18 Ara, 14:30", status: "Onaylandı" }
];

export default function UserProfilePage() {
    const params = useParams();
    const id = params?.id as string;
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [isFollowing, setIsFollowing] = useState(false);
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userPets, setUserPets] = useState<any[]>([]);
    const [isSOSCommandCenterOpen, setIsSOSCommandCenterOpen] = useState(false);
    const [activeSOSPet, setActiveSOSPet] = useState<any>(null);

    const isOwnProfile = currentUser?.id === id;

    useEffect(() => {

        const fetchProfile = async () => {
            try {
                // 1. Fetch Profile Data
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error || !profileData) {
                    // Fallback to Auth state if the user's public.profiles row hasn't been created yet
                    if (currentUser && currentUser.id === id) {
                        setProfile({
                            id: currentUser.id,
                            username: currentUser.username,
                            full_name: (currentUser as any).full_name || currentUser.username,
                            avatar_url: currentUser.avatar,
                            bio: currentUser.bio,
                            location: (currentUser as any).location,
                            followers_count: 0,
                            following_count: 0,
                            posts_count: 0
                        });
                    } else {
                        setProfile(null);
                    }
                } else {
                    setProfile(profileData);

                    // 2. Check Follow Status
                    if (currentUser) {
                        const { data: followData } = await supabase
                            .from('follows')
                            .select('*')
                            .eq('follower_id', currentUser.id)
                            .eq('following_id', id)
                            .single();

                        setIsFollowing(!!followData);
                    }
                }
            } catch (err) {
                console.error("Profile load error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProfile();
            fetchUserPosts();
            fetchUserPets();
        }
    }, [id, currentUser, router]);

    const fetchUserPets = async () => {
        try {
            const { data, error } = await supabase
                .from('pets')
                .select('*')
                .eq('owner_id', id)
                .eq('is_deleted', false);
            if (!error && data) {
                setUserPets(data);
            } else {
                // Mock data if no pets found (for the design demo)
                setUserPets([{
                    id: 'pet-1',
                    name: 'Mochi',
                    breed: 'Golden Retriever',
                    birth_date: '2023-04-12',
                    microchip_id: '990000012345',
                    avatar_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200'
                }]);
            }
        } catch (err) {
            console.error("Pets load error:", err);
        }
    };

    const fetchUserPosts = async () => {
        setIsLoadingPosts(true);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error("Posts load error:", err);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--background)] text-white">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 text-indigo-400">Pati İzleri Aranıyor...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--background)] text-white p-6 text-center">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <UserX className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-2xl font-black mb-2">BU YUVA BOŞ</h1>
                <p className="text-gray-500 max-w-xs mb-8">Aradığın kullanıcı Moffi dünyasında henüz yerini almamış olabilir.</p>
                <button
                    onClick={() => router.push('/community')}
                    className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
                >
                    Topluluğa Dön
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[var(--background)] pt-24 pb-20 px-4">
            <ProfileHeader
                user={{
                    username: profile.username,
                    fullName: profile.full_name || profile.username,
                    avatar: profile.avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400",
                    cover: profile.cover_url || "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200",
                    bio: profile.bio || "Moffi Üyesi ✨",
                    location: profile.location || "Dünyanın Bir Yerinde",
                    stats: {
                        pack: profile.followers_count || 0,
                        following: profile.following_count || 0,
                        posts: profile.posts_count || 0
                    },
                    isOwnProfile: isOwnProfile
                }}
                isFollowingInitial={isFollowing}
                userId={id}
                onMessage={() => router.push('/community?chat=' + id)}
            />

            <div className="max-w-4xl mx-auto mt-12">
                <div className="flex items-center justify-center gap-8 border-b border-white/5 pb-6">
                    {[
                        { id: 'posts', label: 'Anılar', icon: Grid },
                        ...(isOwnProfile ? [
                           { id: 'family', label: 'Ailem', icon: Users },
                           { id: 'passport', label: 'Pasaport', icon: Globe },
                           { id: 'orders', label: 'Siparişler', icon: Package },
                           { id: 'wallet', label: 'Cüzdan', icon: Coins },
                        ] : []),
                        ...(!isOwnProfile ? [
                            { id: 'maps', label: 'Rotalar', icon: Map },
                            { id: 'liked', label: 'Favoriler', icon: Heart },
                        ] : [])
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 group transition-all relative",
                                activeTab === tab.id ? "text-white" : "text-gray-600 hover:text-white"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-indigo-500" : "group-hover:text-indigo-400")} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div layoutId="profile-tab" className="absolute -bottom-6 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
                    {activeTab === 'posts' && (
                        isLoadingPosts ? (
                            Array(6).fill(0).map((_, i) => (
                                <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-sm" />
                            ))
                        ) : posts.length > 0 ? (
                            posts.map((post) => (
                                <div key={post.id} className="aspect-square relative group overflow-hidden cursor-pointer" onClick={() => router.push(`/community?post=${post.id}`)}>
                                    <img src={post.media_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <div className="flex items-center gap-1.5 text-white font-bold">
                                            <Heart className="w-4 h-4 fill-white" />
                                            <span className="text-xs">{post.likes_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-white font-bold">
                                            <MessageCircle className="w-4 h-4 fill-white" />
                                            <span className="text-xs">{post.comments_count || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">Henüz Paylaşım Yok</p>
                            </div>
                        )
                    )}

                    {['maps', 'liked'].includes(activeTab) && (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">Çok Yakında</p>
                            <p className="text-gray-500 text-[10px] mt-2 italic lowercase tracking-widest opacity-50">Moffi Map ve Favoriler özelliği yolda...</p>
                        </div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {/* FAMILY SYNC */}
                    {activeTab === 'family' && isOwnProfile && (
                        <div className="mt-8">
                            <FamilyTab />
                        </div>
                    )}

                    {/* WALLET */}
                    {activeTab === 'wallet' && isOwnProfile && (
                        <motion.div
                            key="wallet"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-4 mt-8"
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
                            <h3 className="font-bold text-gray-400 px-2 mt-2">Son Hareketler</h3>
                            <div className="bg-white/5 rounded-2xl p-2 border border-white/10">
                                {[
                                    { title: "Moffi Run Ödülü", date: "Bugün", val: "+150", type: 'gain' },
                                    { title: "Yürüyüş Bonusu", date: "Dün", val: "+50", type: 'gain' },
                                    { title: "Market Alışverişi", date: "10 Ara", val: "-450", type: 'spend' },
                                ].map((t, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 hover:bg-white/10 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", t.type === 'gain' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                                {t.type === 'gain' ? <Coins className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{t.title}</div>
                                                <div className="text-[10px] text-gray-400">{t.date}</div>
                                            </div>
                                        </div>
                                        <div className={cn("font-bold text-sm", t.type === 'gain' ? "text-green-400" : "text-white")}>
                                            {t.val} PC
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ORDERS & HISTORY */}
                    {activeTab === 'orders' && isOwnProfile && (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-6 mt-8"
                        >
                            {/* Active Orders */}
                            <div>
                                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-indigo-400" /> Siparişlerim
                                </h3>
                                <div className="space-y-3">
                                    {ORDERS.map((order) => (
                                        <div key={order.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-4">
                                            <img src={order.img} className="w-16 h-16 rounded-xl object-cover bg-gray-900" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-sm text-white leading-tight">{order.item}</h4>
                                                    <span className="text-xs font-black text-indigo-400">{order.price}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 mb-2">{order.date}</p>
                                                <div className={cn("px-2 py-1 rounded-md text-[10px] font-bold inline-block", order.status === 'Teslim Edildi' ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400")}>
                                                    {order.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Appointments */}
                            <div>
                                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-red-400" /> Randevular
                                </h3>
                                {APPOINTMENTS.map((apt) => (
                                    <div key={apt.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                                                <Heart className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-white">{apt.clinic}</div>
                                                <div className="text-xs text-gray-400">{apt.type} • {apt.date}</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* PASSPORT */}
                    {activeTab === 'passport' && isOwnProfile && (
                        <div className="mt-8">
                            <PassportTab 
                                pet={userPets[0]} 
                                onClose={() => setActiveTab('posts')}
                                onSOSSettings={(pet) => {
                                    setActiveSOSPet(pet);
                                    setIsSOSCommandCenterOpen(true);
                                }}
                            />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <SOSCommandCenter 
                isOpen={isSOSCommandCenterOpen}
                onClose={() => setIsSOSCommandCenterOpen(false)}
                pet={activeSOSPet}
                onSave={(updatedConfig) => {
                    alert(`${activeSOSPet?.name} için güvenlik ayarları güncellendi ve Moffi Radar'a işlendi!`);
                    setIsSOSCommandCenterOpen(false);
                }}
            />

            {/* EDIT PROFILE MODAL */}
            {isOwnProfile && currentUser && (
                <EditProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    currentUser={currentUser}
                    onSave={(data) => {
                       console.log("Saving user profile updates", data);
                    }}
                />
            )}
        </main>
    );
}
