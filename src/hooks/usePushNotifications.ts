'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { push } from '@/native';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

export function usePushNotifications(userId: string | null | undefined) {
    const [permission, setPermission] = useState<push.PushPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setPermission(push.permission());
        push.currentSubscription().then(sub => setIsSubscribed(!!sub)).catch(() => {});
    }, []);

    const subscribe = useCallback(async () => {
        if (!userId || !push.isSupported()) return;
        setLoading(true);
        try {
            const { permission: result, subscription } = await push.subscribe(VAPID_PUBLIC_KEY);
            setPermission(result);
            if (!subscription) return;

            const { error } = await supabase.from('push_subscriptions').upsert(
                {
                    user_id: userId,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.p256dh,
                    auth_key: subscription.auth,
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
        const endpoint = await push.unsubscribe();
        if (endpoint) await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
        setIsSubscribed(false);
    }, []);

    return { permission, isSubscribed, loading, subscribe, unsubscribe };
}
