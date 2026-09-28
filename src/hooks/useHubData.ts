'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import { usePet } from '@/context/PetContext';
import { ShopOrder } from '@/services/types';
import { healthService } from '@/services/healthService';
import { speciesOf, upcomingItems } from '@/lib/health/derive';
import { todayKey } from '@/lib/appointmentTime';

export interface HubReminder {
    id: string;
    title: string;
    description: string;
    icon: string;
    isCompleted: boolean;
    type: 'food' | 'walk' | 'health' | 'other';
}

export interface HubData {
    activeOrder: ShopOrder | null;
    todayStats: {
        distanceKm: number;
        steps: number;
    };
    nextHealthAlert: {
        name: string;
        date: string;
        type: 'vaccine' | 'medication';
        daysLeft: number;
        severity: 'low' | 'medium' | 'high';
    } | null;
    dailyReminders: HubReminder[];
    unreadMessageCount: number;
    isPro: boolean;
    isLoading: boolean;
}

export function useHubData() {
    const { user } = useAuth();
    const { activePet } = usePet();
    const [data, setData] = useState<HubData>({
        activeOrder: null,
        todayStats: { distanceKm: 0, steps: 0 },
        nextHealthAlert: null,
        dailyReminders: [],
        unreadMessageCount: 0,
        isPro: false,
        isLoading: true
    });

    const fetchData = async () => {
        if (!user) return;
        
        try {
            // 1. Fetch Orders & Find active delivery
            const orders = await apiService.getOrders();
            const activeOrder = (Array.isArray(orders) ? orders : []).find(o => o.status === 'paid' || o.status === 'shipped') || null;

            // 2. Fetch Today's Walk Stats
            const history = await apiService.getWalkHistory(user.id, 50);
            const today = new Date().toISOString().split('T')[0];
            const todayWalks = (Array.isArray(history) ? history : []).filter(w => w.start_time.startsWith(today));
            const todayDistance = todayWalks.reduce((sum, w) => sum + Number(w.distance_km || 0), 0);
            
            // 3. Sıradaki sağlık işi — Sağlık Merkezi ile aynı kayıt ve aynı hesap (lib/health/derive).
            let nextAlert: HubData['nextHealthAlert'] = null;
            if (activePet) {
                const bundle = await healthService.getBundle(activePet.id, speciesOf(activePet));
                const next = upcomingItems(bundle, [], todayKey()).find(i => i.kind !== 'appointment' && i.daysLeft <= 30);
                if (next) {
                    nextAlert = {
                        name: next.title, date: next.date, type: 'vaccine', daysLeft: next.daysLeft,
                        severity: next.daysLeft < 3 ? 'high' : next.daysLeft < 7 ? 'medium' : 'low',
                    };
                }
            }

            // 4. Unread Messages Count (MOCK)
            const msgCount = 2; // Always show 2 mock notifications for UI testing

            // 5. Daily Reminders (Initial Mock for MVP)
            const reminders: HubReminder[] = [
                { id: 'rem-1', title: 'Sabah Maması', description: '08:30 • 250gr', icon: '🍗', isCompleted: true, type: 'food' },
                { id: 'rem-2', title: 'Düzenli Yürüyüş', description: '45dk • Açık Hava', icon: '🦮', isCompleted: todayDistance > 0, type: 'walk' },
                { id: 'rem-3', title: 'Vitamin / Ek Gıda', description: 'Günlük 1 doz', icon: '💊', isCompleted: false, type: 'health' },
            ];

            setData({
                activeOrder,
                todayStats: {
                    distanceKm: Math.round(todayDistance * 10) / 10,
                    steps: Math.floor(todayDistance * 1400) // Rough approximation 1km = 1400 steps
                },
                nextHealthAlert: nextAlert,
                dailyReminders: reminders,
                unreadMessageCount: msgCount,
                isPro: user.subscription_status === 'pro' || user.subscription_status === 'plus',
                isLoading: false
            });
        } catch (err) {
            console.error("Hub data fetch error:", err);
            setData(prev => ({ ...prev, isLoading: false }));
        }
    };

    useEffect(() => {
        fetchData();
        // Supabase real-time triggers removed for mock mode.
    }, [user, activePet]);

    return { ...data, refresh: fetchData };
}

