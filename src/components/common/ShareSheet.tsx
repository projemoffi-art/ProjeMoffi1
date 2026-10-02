'use client';

// Uygulamanın ortak paylaşım paneli: gönderi, kayıp ilanı, sahiplendirme ilanı, profil.
// Moffi içinde mesajla gönder, WhatsApp/Telegram/X/Facebook/e-posta, bağlantıyı kopyala, QR kod ve
// (görseli olan içerikte) hikâye boyutunda paylaşım kartı. Her yerden openShare({...}) ile açılır.

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, MessageCircle, Send, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Sheet } from '@/components/health/HealthUI';
import { Avatar } from '@/components/social/SocialUI';
import { socialService, type PersonCard } from '@/services/socialService';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { haptics, share as shareApi, device } from '@/native';
import { cn, showToast } from '@/lib/utils';

export interface SharePayload {
    /** Paylaşılan şeyin başlığı (ör. "Zeytin yuva arıyor"). */
    title: string;
    /** Kısa açıklama; dış uygulamalarda bağlantının önüne yazılır. */
    text?: string;
    url: string;
    image?: string | null;
    /** Hikâye kartında başlığın üstündeki küçük etiket (ör. "Acil kayıp", "Yuva arıyor"). */
    badge?: string;
}

const OPEN_EVENT = 'moffi-open-share';

/** Paylaşım panelini açar. Göreli adres verilirse site adresiyle tamamlanır. */
export function openShare(p: SharePayload) {
    if (typeof window === 'undefined') return;
    const url = p.url.startsWith('http') ? p.url : `${window.location.origin}${p.url.startsWith('/') ? '' : '/'}${p.url}`;
    window.dispatchEvent(new CustomEvent<SharePayload>(OPEN_EVENT, { detail: { ...p, url } }));
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
    const words = text.split(/\s+/); const lines: string[] = []; let line = '';
    for (const w of words) {
        const next = line ? `${line} ${w}` : w;
        if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = w; if (lines.length === maxLines) break; } else line = next;
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
    return lines;
}

/** 1080×1920 hikâye kartı: görsel, başlık, açıklama ve bağlantı. Instagram/WhatsApp durumunda paylaşılabilir. */
async function storyCard(p: SharePayload): Promise<Blob> {
    const W = 1080, H = 1920;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#F7F3EA'; ctx.fillRect(0, 0, W, H);
    const img = await loadImage(p.image!);
    const bx = 90, by = 260, bw = W - 180, bh = 1100, r = 56;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, r); ctx.clip();
    const s = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
    ctx.restore();
    ctx.fillStyle = '#201B16'; ctx.font = '900 64px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('Moffi 🐾', bx, 170);
    let y = by + bh + 110;
    if (p.badge) {
        ctx.font = '800 40px system-ui, -apple-system, Segoe UI, sans-serif';
        const tw = ctx.measureText(p.badge).width;
        ctx.fillStyle = '#EE5B3D'; ctx.beginPath(); ctx.roundRect(bx, y - 52, tw + 56, 72, 36); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.fillText(p.badge, bx + 28, y - 4);
        y += 100;
    }
    ctx.fillStyle = '#201B16'; ctx.font = '900 72px system-ui, -apple-system, Segoe UI, sans-serif';
    for (const l of wrap(ctx, p.title, bw, 2)) { ctx.fillText(l, bx, y); y += 88; }
    if (p.text) {
        ctx.fillStyle = '#6F675B'; ctx.font = '600 44px system-ui, -apple-system, Segoe UI, sans-serif';
        for (const l of wrap(ctx, p.text, bw, 2)) { ctx.fillText(l, bx, y); y += 60; }
    }
    ctx.fillStyle = '#6F675B'; ctx.font = '700 38px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText(p.url.replace(/^https?:\/\//, ''), bx, H - 110);
    return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Kart oluşturulamadı.'))), 'image/png'));
}

export function ShareSheetHost() {
    const { user } = useAuth();
    const { inboxMessages } = useChat();
    const [p, setP] = useState<SharePayload | null>(null);
    const [people, setPeople] = useState<PersonCard[] | null>(null);
    const [picked, setPicked] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const [query, setQuery] = useState('');
    const [sending, setSending] = useState(false);
    const [qr, setQr] = useState(false);
    const [making, setMaking] = useState(false);

    useEffect(() => {
        const on = (e: Event) => { setP((e as CustomEvent<SharePayload>).detail); setPicked([]); setNote(''); setQuery(''); setQr(false); };
        window.addEventListener(OPEN_EVENT, on);
        return () => window.removeEventListener(OPEN_EVENT, on);
    }, []);

    // Son sohbet edilenler önce, sonra takip edilenler.
    useEffect(() => {
        if (!p || !user) return;
        socialService.following().then(list => {
            const recent: PersonCard[] = (inboxMessages || []).map((m: any) => ({ id: m.userId, name: m.partnerName, username: null, avatar: m.avatar || null, isBusiness: false }));
            const seen = new Set<string>(); const out: PersonCard[] = [];
            for (const x of [...recent, ...list]) if (x.id && x.id !== user.id && !seen.has(x.id)) { seen.add(x.id); out.push(x); }
            setPeople(out);
        }).catch(() => setPeople([]));
    }, [p, user]); // eslint-disable-line react-hooks/exhaustive-deps

    const shown = useMemo(() => {
        const q = query.trim().toLocaleLowerCase('tr-TR');
        return (people || []).filter(x => !q || `${x.name} ${x.username || ''}`.toLocaleLowerCase('tr-TR').includes(q));
    }, [people, query]);

    if (!p) return null;
    const close = () => setP(null);
    const message = [p.text || p.title, p.url].filter(Boolean).join('\n');
    const enc = encodeURIComponent;

    const external = (href: string) => { device.openExternal(href); haptics.tap(); };
    const copy = async () => {
        if (await shareApi.copyText(p.url)) { showToast('Bağlantı kopyalandı.', 'CheckCircle2', 'text-emerald-500 font-bold'); haptics.success(); }
        else showToast('Kopyalanamadı; bağlantıyı elle seçip kopyala.', 'AlertCircle', 'text-red-500 font-bold');
    };
    const native = async () => {
        await shareApi.share({ title: p.title, text: p.text, url: p.url });
    };
    const send = async () => {
        if (!picked.length || sending) return;
        setSending(true);
        const failed = await socialService.sendInMessages(picked, [note.trim(), p.title, p.url].filter(Boolean).join('\n'));
        setSending(false);
        if (failed === picked.length) { showToast('Gönderilemedi, tekrar dene.', 'AlertCircle', 'text-red-500 font-bold'); return; }
        haptics.success();
        showToast(failed ? `${picked.length - failed} kişiye gönderildi, ${failed} kişiye gönderilemedi.` : picked.length === 1 ? 'Gönderildi.' : `${picked.length} kişiye gönderildi.`, 'CheckCircle2', 'text-emerald-500 font-bold');
        close();
    };
    const card = async () => {
        if (!p.image || making) return;
        setMaking(true);
        try {
            const blob = await storyCard(p);
            const file = new File([blob], 'moffi-paylasim.png', { type: 'image/png' });
            if (shareApi.canShare({ files: [file] })) {
                await shareApi.share({ files: [file], title: p.title });
            } else {
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'moffi-paylasim.png'; a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 2000);
                showToast('Kart indirildi; Instagram ya da WhatsApp hikâyende paylaşabilirsin.', 'CheckCircle2', 'text-emerald-500 font-bold');
            }
        } catch { showToast('Kart oluşturulamadı.', 'AlertCircle', 'text-red-500 font-bold'); }
        finally { setMaking(false); }
    };

    const Target = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} className="flex flex-col items-center gap-1.5">
            <span className="w-14 h-14 rounded-2xl bg-card border border-card-border flex items-center justify-center text-lg font-black">{children}</span>
            <span className="text-[11px] font-bold text-secondary">{label}</span>
        </motion.button>
    );

    return (
        <Sheet open={!!p} onClose={close} title="Paylaş">
            <div className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-2.5">
                {p.image ? <img src={p.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" /> : <span className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">🐾</span>}
                <span className="min-w-0">
                    <span className="block text-sm font-black truncate">{p.title}</span>
                    <span className="block text-xs font-semibold text-secondary truncate">{p.url.replace(/^https?:\/\//, '')}</span>
                </span>
            </div>

            {user && (
                <section className="space-y-2.5">
                    <div className="text-sm font-black">Moffi'de gönder</div>
                    {people === null ? (
                        <div className="h-20 rounded-2xl bg-card-border/40 animate-pulse" />
                    ) : people.length === 0 ? (
                        <p className="text-xs font-semibold text-secondary">Takip ettiğin ya da mesajlaştığın biri olunca burada görünür.</p>
                    ) : (
                        <>
                            {people.length > 8 && (
                                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Kişi ara"
                                    className="w-full h-10 px-4 rounded-full bg-card border border-card-border text-sm font-semibold outline-none focus:border-accent" />
                            )}
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                {shown.map(x => {
                                    const on = picked.includes(x.id);
                                    return (
                                        <motion.button key={x.id} whileTap={{ scale: 0.9 }} onClick={() => { haptics.tap(); setPicked(s => (on ? s.filter(i => i !== x.id) : s.length >= 10 ? s : [...s, x.id])); }}
                                            className="w-16 shrink-0 flex flex-col items-center gap-1">
                                            <span className="relative">
                                                <Avatar src={x.avatar} name={x.name} className={cn('w-14 h-14 border-2 transition-colors', on ? 'border-accent' : 'border-transparent')} />
                                                <AnimatePresence>
                                                    {on && (
                                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                                            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent text-white text-[11px] font-black flex items-center justify-center border-2 border-background">✓</motion.span>
                                                    )}
                                                </AnimatePresence>
                                            </span>
                                            <span className="text-[11px] font-bold truncate w-full text-center">{x.name}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                            <AnimatePresence>
                                {picked.length > 0 && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 overflow-hidden">
                                        <input value={note} onChange={e => setNote(e.target.value)} maxLength={300} placeholder="Bir not ekle (isteğe bağlı)"
                                            className="flex-1 h-11 px-4 rounded-full bg-card border border-card-border text-sm font-semibold outline-none focus:border-accent" />
                                        <button onClick={send} disabled={sending} className="h-11 px-5 rounded-full bg-accent text-white text-sm font-black disabled:opacity-50">
                                            {sending ? 'Gönderiliyor…' : picked.length > 1 ? `${picked.length} kişiye gönder` : 'Gönder'}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </section>
            )}

            <section className="space-y-2.5">
                <div className="text-sm font-black">Diğer uygulamalar</div>
                <div className="grid grid-cols-4 gap-y-3">
                    <Target label="WhatsApp" onClick={() => external(`https://wa.me/?text=${enc(message)}`)}><MessageCircle className="w-6 h-6" /></Target>
                    <Target label="Telegram" onClick={() => external(`https://t.me/share/url?url=${enc(p.url)}&text=${enc(p.text || p.title)}`)}><Send className="w-6 h-6" /></Target>
                    <Target label="X" onClick={() => external(`https://twitter.com/intent/tweet?text=${enc(p.text || p.title)}&url=${enc(p.url)}`)}>𝕏</Target>
                    <Target label="Facebook" onClick={() => external(`https://www.facebook.com/sharer/sharer.php?u=${enc(p.url)}`)}>f</Target>
                    <Target label="E-posta" onClick={() => { window.location.href = `mailto:?subject=${enc(p.title)}&body=${enc(message)}`; }}>@</Target>
                    <Target label="Kopyala" onClick={copy}><ClipboardList className="w-6 h-6" /></Target>
                    <Target label="QR kod" onClick={() => setQr(v => !v)}>▦</Target>
                    {shareApi.canShare() && <Target label="Diğer" onClick={native}><Share2 className="w-6 h-6" /></Target>}
                </div>
                <AnimatePresence>
                    {qr && (
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                            className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 border border-card-border">
                            <QRCodeSVG value={p.url} size={176} />
                            <span className="text-xs font-semibold text-zinc-600">Telefon kamerasıyla okutunca açılır</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {p.image && (
                <button onClick={card} disabled={making} className="w-full h-12 rounded-2xl bg-foreground text-background text-sm font-black disabled:opacity-60">
                    {making ? 'Kart hazırlanıyor…' : 'Hikâye kartı oluştur'}
                </button>
            )}
        </Sheet>
    );
}
