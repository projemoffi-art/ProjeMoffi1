'use client';

// Mesaj fotoğrafları özel "chat-media" alanında durur; mesajda `chat-media/<gönderen>/<dosya>` olarak saklanır.
// Görmek için kısa ömürlü imzalı adres alınır (sadece gönderen ve o mesajın alıcısı alabilir).
// Eski mesajlardaki herkese açık adresler olduğu gibi gösterilir.

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { shrinkForUpload } from '@/lib/media/compress';

const PREFIX = 'chat-media/';
const TTL_SEC = 60 * 60;
const cache = new Map<string, { url: string; until: number }>();
const inflight = new Map<string, Promise<string | null>>();

export const isPrivateChatMedia = (ref?: string | null) => !!ref && ref.startsWith(PREFIX);

export async function uploadChatImage(original: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Giriş gerekli');
    const file = await shrinkForUpload(original);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('chat-media').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return PREFIX + path;
}

export async function chatMediaUrl(ref: string): Promise<string | null> {
    if (!isPrivateChatMedia(ref)) return ref;
    const hit = cache.get(ref);
    if (hit && hit.until > Date.now()) return hit.url;
    const running = inflight.get(ref);
    if (running) return running;
    const p = (async () => {
        const { data, error } = await supabase.storage.from('chat-media').createSignedUrl(ref.slice(PREFIX.length), TTL_SEC);
        inflight.delete(ref);
        if (error || !data?.signedUrl) return null;
        cache.set(ref, { url: data.signedUrl, until: Date.now() + (TTL_SEC - 120) * 1000 });
        return data.signedUrl;
    })();
    inflight.set(ref, p);
    return p;
}

/** Mesajdaki ek referansını gösterilebilir adrese çevirir (yüklenirken null). */
export function useChatMediaUrl(ref?: string | null): string | null {
    // İmzalı adres hangi referans için alındıysa onunla birlikte tutulur; referans değişince eskisi gösterilmez.
    const [signed, setSigned] = useState<{ ref: string; url: string | null } | null>(null);
    const isPrivate = isPrivateChatMedia(ref);
    useEffect(() => {
        if (!ref || !isPrivateChatMedia(ref)) return;
        let alive = true;
        chatMediaUrl(ref).then(u => { if (alive) setSigned({ ref, url: u }); });
        return () => { alive = false; };
    }, [ref]);
    if (!ref) return null;
    if (!isPrivate) return ref;
    // Hafızadaki adres de efektte okunur (süresi render sırasında denetlenmez).
    return signed && signed.ref === ref ? signed.url : null;
}
