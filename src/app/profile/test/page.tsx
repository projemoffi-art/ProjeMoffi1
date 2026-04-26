"use client";

import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useAuth } from "@/context/AuthContext";

// Demo Data for UI Review (Matches Milo's style)
const MOCK_USER = {
    id: 'user-test',
    username: "moffi_official",
    full_name: "Moffi the Corgi",
    avatar_url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400",
    cover_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200",
    bio: "Moffi'nin resmi temsilcisi! 🐾 Burada yeni rotalar keşfediyor, en iyi kemikleri puanlıyor ve sülalecek takılıyoruz. Tüm sorularınız için havlayabilirsiniz!",
    location: "İstanbul, TR",
    followers_count: 1240,
    following_count: 850,
    posts_count: 42,
    is_premium: true
};

const MOCK_PETS = [
    { id: 'pet-1', name: 'Milo', breed: 'Corgi', avatar: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200" },
    { id: 'pet-2', name: 'Bella', breed: 'Border Collie', avatar: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=200" }
];

export default function ProfileTestPage() {
    const { user: currentUser } = useAuth();
    const isOwnProfile = currentUser?.id === MOCK_USER.id;

    return (
        <main className="min-h-screen bg-background pb-20">
            {/* Unified Header */}
            <ProfileHeader 
                user={MOCK_USER} 
                isOwnProfile={isOwnProfile}
                isFollowingInitial={false}
            />

            <div className="max-w-7xl mx-auto px-6">
                {/* Unified PETS SECTION */}
                <section className="mt-12 mb-16">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight italic">Patiler</h3>
                    </div>
                    
                    <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                        {MOCK_PETS.map((pet) => (
                            <div 
                                key={pet.id}
                                className="min-w-[240px] bg-card border border-card-border rounded-[2.5rem] p-6 flex flex-col items-center gap-4 shadow-sm"
                            >
                                <div className="w-24 h-24 rounded-full border-2 border-accent/20 p-1 bg-background shadow-lg">
                                    <img src={pet.avatar} className="w-full h-full object-cover rounded-full" alt={pet.name} />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-xl font-black text-foreground uppercase leading-none mb-1">{pet.name}</h4>
                                    <p className="text-[9px] text-secondary font-bold uppercase tracking-widest leading-none">{pet.breed}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Unified Tabs Area */}
                <ProfileTabs 
                    userId={MOCK_USER.id} 
                    isOwnProfile={isOwnProfile}
                    themeColor="cyan"
                />
            </div>
        </main>
    );
}
