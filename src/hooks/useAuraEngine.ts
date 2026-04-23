"use client";

import { useMemo } from 'react';
import { useSocial } from '@/context/SocialContext';
import { usePet } from '@/context/PetContext';

export type AuraType = 'pioneer' | 'socialite' | 'guardian' | 'zen' | 'elite';

export interface AuraIdentity {
    id: AuraType;
    name: string;
    description: string;
    reason: string;
    color: string;
    icon: string;
}

const AURA_MAP: Record<AuraType, AuraIdentity> = {
    pioneer: {
        id: 'pioneer',
        name: 'Doğa Kaşifi',
        description: 'Yeni rotalar ve açık havada macera peşinde.',
        reason: 'Bugün uzun bir yürüyüş tamamladığın veya yeni bir rota keşfettiğin için.',
        color: '#10b981', // Emerald
        icon: 'Map'
    },
    socialite: {
        id: 'socialite',
        name: 'Topluluk Yıldızı',
        description: 'Moffi dünyasında sosyal etkileşimin zirvesinde.',
        reason: 'Gönderilerin yüksek etkileşim aldığı ve toplulukla iç içe olduğun için.',
        color: '#6366f1', // Indigo
        icon: 'Sparkles'
    },
    guardian: {
        id: 'guardian',
        name: 'Güvenlik Elçisi',
        description: 'Topluluğun güvenliğini ve refahını önemsiyor.',
        reason: 'SOS bildirimlerini takip ettiğin ve güvenlik ayarlarına önem verdiğin için.',
        color: '#ef4444', // Red
        icon: 'ShieldCheck'
    },
    elite: {
        id: 'elite',
        name: 'V.I.P Trendsetter',
        description: 'Moffi ekosistemindeki en şık ve seçkin üyelerden biri.',
        reason: 'Market aktivitelerin ve premium stil seçimlerin dikkat çektiği için.',
        color: '#f59e0b', // Amber
        icon: 'Crown'
    },
    zen: {
        id: 'zen',
        name: 'Sessiz Gözlemci',
        description: 'Uygulamayı vaktinde ve tadında kullanan bilge bir ruh.',
        reason: 'Bugün sakin ama düzenli bir şekilde ekosistemi takip ettiğin için.',
        color: '#a855f7', // Purple
        icon: 'Moon'
    }
};

export function useAuraEngine() {
    const { posts } = useSocial();
    const { pets, activePet } = usePet();

    // In a real app, this would use daily statistics from Supabase
    // For now, we simulate the calculation based on current state
    const currentAura = useMemo((): AuraIdentity => {
        const userPosts = posts.filter(p => p.userId === 'current_user');
        const hasWalkedToday = true; // Simulated
        const engagementRate = userPosts.reduce((acc, p) => acc + p.likes, 0);
        
        // Logic for auto-assignment
        if (activePet?.is_lost) return AURA_MAP.guardian;
        if (userPosts.length > 2 || engagementRate > 10) return AURA_MAP.socialite;
        if (hasWalkedToday) return AURA_MAP.pioneer;
        if (pets.length > 3) return AURA_MAP.elite;
        
        return AURA_MAP.zen;
    }, [posts, activePet, pets]);

    return {
        aura: currentAura,
        allAuras: Object.values(AURA_MAP)
    };
}
