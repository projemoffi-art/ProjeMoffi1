'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(userId: string | null | undefined) {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Check current subscription status on mount
    useEffect(() => {
        const checkSubscription = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            }
        };
        checkSubscription();
    }, []);

    const subscribe = useCallback(async () => {
        if (!userId) return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Bu tarayıcı push bildirimi desteklemiyor.');
            return;
        }

        setLoading(true);
        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);
            if (permissionResult !== 'granted') {
                setLoading(false);
                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const subJson = subscription.toJSON();

            const { error } = await supabase.from('push_subscriptions').upsert(
                {
                    user_id: userId,
                    endpoint: subJson.endpoint,
                    p256dh: subJson.keys?.p256dh,
                    auth_key: subJson.keys?.auth,
                    user_agent: navigator.userAgent,
                },
                { onConflict: 'endpoint' }
            );

            if (error) throw error;
            setIsSubscribed(true);
        } catch (e) {
            console.error('Push aboneliği başarısız:', e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const unsubscribe = useCallback(async () => {
        if (!('serviceWorker' in navigator)) return;
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
            await subscription.unsubscribe();
        }
        if (registration) {
            await registration.unregister(); // Tamamen temizle
        }
        setIsSubscribed(false);
    }, []);

    return { permission, isSubscribed, loading, subscribe, unsubscribe };
}
