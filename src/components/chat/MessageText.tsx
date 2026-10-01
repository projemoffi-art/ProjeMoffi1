'use client';

// Mesaj metni: bağlantıları tıklanabilir yapar; Moffi gönderi / kayıp / sahiplendirme bağlantısını önizleme
// kartına çevirir (paylaşım panelinin "Moffi'de gönder" seçeneğiyle gelen mesajlar).

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { socialService } from '@/services/socialService';
import { lostService } from '@/services/lostService';
import { adoptionService } from '@/services/adoptionService';
import { listingTitle } from '@/components/lost/LostUI';
import { useChat } from '@/context/ChatContext';

type Kind = 'post' | 'lost' | 'adoption';
interface Preview { kind: Kind; path: string; title: string; subtitle: string; image: string | null }

const URL_RE = /(https?:\/\/[^\s]+)/g;
const IS_URL = /^https?:\/\//;
const MOFFI_RE = /\/(community\/gonderi|kayip|sahiplendirme)\/([0-9a-f-]{36})/i;
const cache = new Map<string, Promise<Preview | null>>();

function resolve(kind: Kind, id: string): Promise<Preview | null> {
    const key = `${kind}:${id}`;
    if (!cache.has(key)) {
        cache.set(key, (async () => {
            try {
                if (kind === 'post') {
                    const p = await socialService.post(id);
                    return p ? { kind, path: `/community/gonderi/${id}`, title: p.author.name, subtitle: p.content.slice(0, 80) || 'Gönderi', image: p.isVideo ? null : p.media[0] || null } : null;
                }
                if (kind === 'lost') {
                    const l = await lostService.get(id);
                    return l ? { kind, path: `/kayip/${id}`, title: listingTitle(l), subtitle: l.kind === 'lost' ? 'Acil kayıp' : 'Bulundu', image: l.photos[0] || null } : null;
                }
                const a = await adoptionService.get(id);
                return a ? { kind, path: `/sahiplendirme/${id}`, title: a.petName, subtitle: 'Yuva arıyor', image: a.photos[0] || null } : null;
            } catch { return null; }
        })());
    }
    return cache.get(key)!;
}

function LinkCard({ kind, id }: { kind: Kind; id: string }) {
    const router = useRouter();
    const { setIsInboxOpen } = useChat();
    const [p, setP] = useState<Preview | null | undefined>(undefined);
    useEffect(() => { let alive = true; resolve(kind, id).then(r => alive && setP(r)); return () => { alive = false; }; }, [kind, id]);
    if (p === undefined) return <div className="mt-2 h-16 w-56 rounded-2xl bg-black/5 dark:bg-white/10 animate-pulse" />;
    if (!p) return <div className="mt-2 text-xs font-semibold opacity-70">Bu içerik artık görüntülenemiyor.</div>;
    return (
        <button onClick={() => { setIsInboxOpen(false); router.push(p.path); }}
            className="mt-2 flex items-center gap-2.5 w-60 max-w-full text-left rounded-2xl bg-white/70 dark:bg-black/30 border border-black/5 dark:border-white/10 p-2 active:scale-[0.98] transition-transform">
            {p.image ? <img src={p.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" /> : <span className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-xl shrink-0">🐾</span>}
            <span className="min-w-0">
                <span className="block text-[10px] font-black opacity-60">{p.kind === 'post' ? 'Gönderi' : p.subtitle}</span>
                <span className="block text-sm font-black truncate">{p.title}</span>
                {p.kind === 'post' && <span className="block text-xs font-semibold opacity-70 truncate">{p.subtitle}</span>}
            </span>
        </button>
    );
}

export function MessageText({ text }: { text: string }) {
    // Moffi bağlantısı kartta gösterildiği için metinden çıkarılır.
    const parts = text.split(URL_RE).filter(part => !(IS_URL.test(part) && MOFFI_RE.test(part)));
    while (parts.length && !parts[parts.length - 1].trim()) parts.pop();
    const firstMoffi = (text.match(URL_RE) || []).map(u => u.match(MOFFI_RE)).find(Boolean);
    const kind: Kind | null = firstMoffi ? (firstMoffi[1].toLowerCase() === 'kayip' ? 'lost' : firstMoffi[1].toLowerCase() === 'sahiplendirme' ? 'adoption' : 'post') : null;
    return (
        <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {parts.map((part, i) => (IS_URL.test(part)
                    ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all">{part}</a>
                    : <React.Fragment key={i}>{i === parts.length - 1 ? part.trimEnd() : part}</React.Fragment>))}
            </p>
            {firstMoffi && kind && <LinkCard kind={kind} id={firstMoffi[2]} />}
        </>
    );
}
