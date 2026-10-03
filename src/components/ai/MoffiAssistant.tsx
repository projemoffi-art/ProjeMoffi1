"use client";

// Moffi AI paneli. Alt menünün ortasındaki düğme (ve kenar paneli) 'open-ai-assistant' olayıyla açar;
// detail: { prompt?: string (hemen sorulur), prefill?: string (kutuya yazılır) }.
// Asistan seçili hayvanın kimlik, sağlık ve yürüyüş özetini bilir (yalnızca sahibine, kendi asistanında).
// Günlük hak sunucuda (ai_consume / ai_quota_status); bittiğinde PawCoin ile ek soru sorulabilir.
// Sohbet geçmişi bu cihazda tutulur (90 gün).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle, ArrowUp, Brain, ChevronDown, Footprints, HeartPulse, History, MessageSquarePlus,
    Sparkles, Stethoscope, Syringe, Trash2, Utensils, X,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePet, type Pet } from '@/context/PetContext';
import { useActivity } from '@/context/ActivityContext';
import { useQuestEngine } from '@/context/QuestEngineContext';
import { healthService } from '@/services/healthService';
import { supabase } from '@/lib/supabase';
import { ageText, daysLeftText, isMedicationActive, overallStatus, speciesOf, upcomingItems, weightSummary } from '@/lib/health/derive';
import { todayKey } from '@/lib/appointmentTime';
import { formatKm, petWeightKg } from '@/lib/walkMetrics';
import { haptics } from '@/native';
import { cn } from '@/lib/utils';
import type { HealthBundle } from '@/types/health';

type Action = { type: 'link'; label: string; url: string } | { type: 'pay'; label: string } | { type: 'retry'; label: string };

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    /** Bilgi/uyarı mesajı (hak bitti, bağlantı hatası); modele geçmiş olarak gönderilmez. */
    meta?: boolean;
    actions?: Action[];
    // Eski kayıtlar: tek eylem
    action?: { type: string; label: string; url?: string };
}

interface ChatSession { id: string; title: string; petId?: string | null; messages: Message[]; updatedAt: number }

interface Quota { prime: boolean; capacity_reached: boolean; message_limit: number; message_used: number; price_message: number; balance: number }

const STORAGE_KEY = 'moffi_ai_sessions';
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 30;

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function loadSessions(): ChatSession[] {
    try {
        const parsed: ChatSession[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const cutoff = Date.now() - RETENTION_MS;
        return parsed.filter(s => s.updatedAt > cutoff && Array.isArray(s.messages)).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch { return []; }
}
function saveSessions(list: ChatSession[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_SESSIONS))); } catch { /* gizli sekme vb. */ }
}

/** Sorunun konusuna göre yanıtın altına uygulama içi kısa yol. */
function suggestLinks(question: string): Action[] {
    const t = question.toLocaleLowerCase('tr-TR');
    const out: Action[] = [];
    if (/kayb|kaçtı|bulamıyorum|kayıp/.test(t)) out.push({ type: 'link', label: 'Kayıp ilanı ver', url: '/kayip/ilan-ver' });
    if (/veteriner|hasta|kusma|kusuyor|ishal|acil|kanama|kanıyor|zehir|nöbet|topall|ateş|yemiyor|halsiz/.test(t)) out.push({ type: 'link', label: 'Veteriner bul', url: '/vet' });
    if (/aşı/.test(t)) out.push({ type: 'link', label: 'Aşı takvimi', url: '/health/asilar' });
    else if (/ilaç|parazit|pire|kene|kilo/.test(t)) out.push({ type: 'link', label: 'Sağlık Merkezi', url: '/health' });
    if (/yürü|egzersiz/.test(t)) out.push({ type: 'link', label: 'Yürüyüş', url: '/walk' });
    return out.slice(0, 2);
}

function legacyActions(m: Message): Action[] {
    if (m.actions) return m.actions;
    if (!m.action) return [];
    if (m.action.type === 'pay') return [{ type: 'pay', label: m.action.label }];
    if (m.action.type === 'sos') return [{ type: 'link', label: 'Kayıp ilanları', url: '/kayip' }];
    if (m.action.type === 'vetline') return [{ type: 'link', label: 'Veteriner bul', url: '/vet' }];
    if (m.action.url) return [{ type: 'link', label: m.action.label, url: m.action.url }];
    return [];
}

/** Kalın yazı ve madde işaretleri olan sade metin gösterimi (model markdown kullanabiliyor). */
function RichText({ text }: { text: string }) {
    const inline = (line: string, key: number) => (
        <React.Fragment key={key}>
            {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="font-extrabold">{part.slice(2, -2)}</strong> : part,
            )}
        </React.Fragment>
    );
    const blocks: React.ReactNode[] = [];
    let list: string[] = [];
    const flush = () => {
        if (list.length) {
            blocks.push(<ul key={`l${blocks.length}`} className="space-y-1 my-1.5">{list.map((li, i) => (
                <li key={i} className="flex gap-2"><span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-accent shrink-0" /><span>{inline(li, i)}</span></li>
            ))}</ul>);
            list = [];
        }
    };
    text.split('\n').forEach((raw, i) => {
        const line = raw.trim();
        const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
        if (bullet) { list.push(bullet[1]); return; }
        flush();
        if (!line) return;
        const heading = line.replace(/^#{1,6}\s+/, '');
        blocks.push(<p key={`p${i}`} className={cn('my-1', heading !== line && 'font-extrabold')}>{inline(heading, i)}</p>);
    });
    flush();
    return <>{blocks}</>;
}

function usePetContext(pet: Pet | null) {
    const [bundle, setBundle] = useState<HealthBundle | null>(null);
    useEffect(() => {
        let alive = true;
        if (!pet?.id) { setBundle(null); return; }
        setBundle(healthService.peekBundle(pet.id));
        healthService.loadBundle(pet.id, speciesOf(pet)).then(b => { if (alive) setBundle(b); }).catch(() => {});
        return () => { alive = false; };
    }, [pet?.id]); // eslint-disable-line react-hooks/exhaustive-deps
    return bundle;
}

export function MoffiAssistant() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const { pets, activePet } = usePet();
    const { walkHistory } = useActivity();
    const { todayDistanceKm, dailyGoal } = useQuestEngine();

    const [isOpen, setIsOpen] = useState(false);
    // Bileşen yalnızca tarayıcıda yüklenir (AIWidgetLoader, ssr:false); geçmiş ilk durumda okunur.
    const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showPets, setShowPets] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [quota, setQuota] = useState<Quota | null>(null);
    const [petId, setPetId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const pendingPrompt = useRef<string | null>(null);

    const pet = pets.find(p => p.id === petId) || activePet || pets[0] || null;
    const bundle = usePetContext(isOpen ? pet : null);
    const firstName = (user?.name || '').trim().split(/\s+/)[0] || '';
    const prefs = useMemo(() => {
        const ai = (user?.settings?.ai || {}) as { personality?: string; detailLevel?: string };
        const personality = ai.personality === 'casual' ? 'friendly' : ai.personality === 'technical' ? 'professional' : ai.personality || 'friendly';
        return { personality, detailLevel: ai.detailLevel || 'medium' };
    }, [user?.settings?.ai]);

    const session = sessions.find(s => s.id === sessionId) || null;
    const messages = session?.messages || [];

    const refreshQuota = useCallback(async () => {
        const { data, error } = await supabase.rpc('ai_quota_status');
        if (!error && data) setQuota(data as Quota);
    }, []);

    // Açma/kapama olayları
    useEffect(() => {
        const open = (e: Event) => {
            const detail = (e as CustomEvent).detail || {};
            setIsOpen(true);
            setShowHistory(false);
            if (detail.prefill) { setSessionId(null); setInput(detail.prefill); }
            if (detail.prompt) { setSessionId(null); pendingPrompt.current = detail.prompt; }
        };
        const close = () => setIsOpen(false);
        window.addEventListener('open-ai-assistant', open);
        window.addEventListener('close-ai-assistant', close);
        return () => { window.removeEventListener('open-ai-assistant', open); window.removeEventListener('close-ai-assistant', close); };
    }, []);

    // Açıkken: geri tuşu paneli kapatır, alt menü gizlenir, sayfa kaymaz.
    useEffect(() => {
        if (!isOpen) return;
        window.history.pushState({ modal: 'ai' }, '');
        window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: false }));
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        refreshQuota();
        return () => {
            document.body.style.overflow = prevOverflow;
            window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: true }));
        };
    }, [isOpen, refreshQuota]);

    const close = () => {
        if (window.history.state?.modal === 'ai') window.history.replaceState(null, '', window.location.pathname + window.location.search);
        setIsOpen(false);
    };

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages.length, busy]);

    const persist = (updater: (list: ChatSession[]) => ChatSession[]) => {
        setSessions(prev => updater(prev));
    };
    useEffect(() => { saveSessions(sessions); }, [sessions]);

    const buildPetData = () => {
        if (!pet) return null;
        const today = todayKey();
        const weekAgo = Date.now() - 7 * 86_400_000;
        const week = walkHistory.filter(w => (!w.petId || String(w.petId) === String(pet.id)) && new Date(w.ended_at || w.started_at || 0).getTime() >= weekAgo);
        const data: Record<string, unknown> = {
            name: pet.name,
            species: speciesOf(pet) === 'cat' ? 'kedi' : speciesOf(pet) === 'dog' ? 'köpek' : pet.type || undefined,
            breed: pet.breed || undefined,
            age: ageText(pet.birthday, pet.age, today) || undefined,
            sex: pet.gender || undefined,
            neutered: typeof pet.neutered === 'boolean' ? pet.neutered : undefined,
            weightKg: bundle ? weightSummary(bundle.weights, today).latest?.weightKg ?? petWeightKg(pet) : petWeightKg(pet),
            walks: { todayKm: todayDistanceKm, goalKm: dailyGoal.distance, weekCount: week.length, weekKm: week.reduce((s, w) => s + (w.distanceKm || 0), 0) },
        };
        if (bundle) {
            data.health = {
                status: overallStatus(bundle, today).title,
                upcoming: upcomingItems(bundle, [], today).slice(0, 6).map(i => ({ title: i.title, when: daysLeftText(i.daysLeft) })),
                activeMedications: bundle.medications.filter(m => isMedicationActive(m, today)).map(m => [m.name, m.dosage, m.frequency].filter(Boolean).join(' · ')),
                allergies: bundle.profile?.allergies || [],
                chronicConditions: bundle.profile?.chronicConditions || [],
                notes: bundle.profile?.notes || null,
            };
        }
        return data;
    };

    const ask = async (sid: string, history: Message[], pay: boolean) => {
        setBusy(true);
        const question = [...history].reverse().find(m => m.role === 'user')?.content || '';
        let reply: Message;
        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history.filter(m => !m.meta).map(m => ({ role: m.role, content: m.content })),
                    petData: buildPetData(),
                    prefs,
                    page: pathname,
                    pay,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                reply = { id: uid(), role: 'assistant', content: data.message, actions: suggestLinks(question) };
                haptics.tap();
            } else if (res.status === 402) {
                const canPay = data.reason === 'quota' && data.price != null;
                const extra = data.reason === 'quota'
                    ? ` Bu soruyu ${data.price} PawCoin ile yanıtlayabilirim (bakiyen: ${data.balance}).${data.prime ? '' : ' Prime üyelerin günlük hakkı daha fazla.'}`
                    : data.reason === 'balance' ? ` Gereken: ${data.price}, bakiyen: ${data.balance}. Yürüyüş ve görevlerle PawCoin kazanabilirsin.` : '';
                reply = { id: uid(), role: 'assistant', meta: true, content: `${data.message}${extra}`, actions: canPay ? [{ type: 'pay', label: `${data.price} PawCoin ile yanıtla` }] : [] };
            } else {
                reply = { id: uid(), role: 'assistant', meta: true, content: data.message || 'Şu an yanıt veremedim. Birazdan tekrar dener misin?', actions: [{ type: 'retry', label: 'Tekrar dene' }] };
            }
        } catch {
            reply = { id: uid(), role: 'assistant', meta: true, content: 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dener misin?', actions: [{ type: 'retry', label: 'Tekrar dene' }] };
        }
        persist(list => list.map(s => (s.id === sid ? { ...s, messages: [...history, reply], updatedAt: Date.now() } : s)));
        setBusy(false);
        refreshQuota();
    };

    const send = async (text: string) => {
        const content = text.trim();
        if (!content || busy) return;
        haptics.tap();
        const userMsg: Message = { id: uid(), role: 'user', content };
        let sid = sessionId;
        let history: Message[];
        if (!session) {
            sid = uid();
            history = [userMsg];
            const created: ChatSession = { id: sid, title: content.slice(0, 48), petId: pet?.id || null, messages: history, updatedAt: Date.now() };
            persist(list => [created, ...list]);
            setSessionId(sid);
        } else {
            history = [...session.messages, userMsg];
            persist(list => list.map(s => (s.id === sid ? { ...s, messages: history, updatedAt: Date.now() } : s)));
        }
        setInput('');
        await ask(sid!, history, false);
    };

    // Kenar panelinden ya da başka ekrandan hazır soruyla açıldıysa
    useEffect(() => {
        if (isOpen && pendingPrompt.current && !busy) {
            const p = pendingPrompt.current;
            pendingPrompt.current = null;
            send(p);
        }
    });

    const runAction = (a: Action, msg: Message) => {
        if (!session) return;
        if (a.type === 'link') { haptics.tap(); close(); router.push(a.url); return; }
        const history = session.messages.filter(m => m.id !== msg.id);
        ask(session.id, history, a.type === 'pay');
    };

    const newChat = () => { haptics.tap(); setSessionId(null); setShowHistory(false); setInput(''); };

    const remaining = quota ? Math.max(0, quota.message_limit - quota.message_used) : null;
    const quotaText = !quota ? null
        : quota.capacity_reached ? 'Moffi AI bu ay kapasitesine ulaştı'
        : remaining! > 0 ? `Bugün ${remaining}/${quota.message_limit} soru hakkın var${quota.prime ? ' · Prime' : ''}`
        : `Günlük hakkın bitti · ek soru ${quota.price_message} PawCoin`;

    const petName = pet?.name || 'dostun';
    const prompts = [
        { Icon: HeartPulse, title: 'Sağlık özeti', hint: 'Durum ve sıradaki işler', send: `${petName} için sağlık durumunu kısaca özetler misin? Yaklaşan ya da geciken bir şey var mı?` },
        { Icon: Stethoscope, title: 'Belirti sor', hint: 'Ne zaman veterinere?', prefill: `${petName}'da şu belirti var: ` },
        { Icon: Utensils, title: 'Beslenme', hint: 'Günlük miktar ve öğün', send: `${petName} için günlük mama miktarı ve öğün sayısı ne olmalı? Kilosuna ve yaşına göre yaklaşık hesapla.` },
        { Icon: Footprints, title: 'Egzersiz', hint: 'Bu hafta yeterli mi?', send: `${petName}'ın bu haftaki yürüyüşleri yeterli mi? Irkı ve yaşı için ideal günlük egzersiz ne kadar?` },
        { Icon: Syringe, title: 'Aşı ve parazit', hint: 'Takvimi açıkla', send: `${petName}'ın aşı ve parazit takvimini açıklar mısın? Sıradaki uygulama ne zaman ve neden önemli?` },
        { Icon: Brain, title: 'Davranış', hint: 'Eğitim önerisi al', prefill: `${petName}'ın şu davranışıyla ilgili yardım istiyorum: ` },
    ];

    const health = bundle ? overallStatus(bundle, todayKey()) : null;
    const nextCare = bundle ? upcomingItems(bundle, [], todayKey())[0] : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="moffi-ai"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                    className="theme-vet fixed inset-0 z-[7000] bg-background text-foreground flex flex-col md:inset-auto md:bottom-6 md:right-6 md:w-[420px] md:h-[720px] md:max-h-[90vh] md:rounded-[28px] md:border md:border-card-border md:shadow-2xl overflow-hidden"
                    role="dialog"
                    aria-label="Moffi AI"
                >
                    {/* Başlık */}
                    <header className="shrink-0 border-b border-card-border bg-background/95 backdrop-blur pt-[env(safe-area-inset-top)]">
                        <div className="h-14 px-2 flex items-center gap-1">
                            <button type="button" onClick={close} aria-label="Kapat" className="w-11 h-11 rounded-full flex items-center justify-center active:bg-foreground/5">
                                <X className="w-6 h-6" />
                            </button>
                            <button type="button" onClick={() => pets.length > 1 && setShowPets(v => !v)} className="flex-1 min-w-0 flex flex-col items-center">
                                <span className="text-[16px] font-extrabold flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-accent" /> Moffi AI</span>
                                <span className="text-[12px] font-semibold text-secondary flex items-center gap-0.5 truncate max-w-full">
                                    {pet ? `${pet.name} hakkında` : 'Evcil hayvan bakımı'}
                                    {pets.length > 1 && <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showPets && 'rotate-180')} />}
                                </span>
                            </button>
                            <button type="button" onClick={() => setShowHistory(v => !v)} aria-label="Sohbet geçmişi" className={cn('w-11 h-11 rounded-full flex items-center justify-center active:bg-foreground/5', showHistory && 'text-accent')}>
                                <History className="w-[21px] h-[21px]" />
                            </button>
                            <button type="button" onClick={newChat} aria-label="Yeni sohbet" className="w-11 h-11 rounded-full flex items-center justify-center active:bg-foreground/5">
                                <MessageSquarePlus className="w-[21px] h-[21px]" />
                            </button>
                        </div>
                        <AnimatePresence initial={false}>
                            {showPets && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
                                        {pets.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => { haptics.tap(); setPetId(p.id); setShowPets(false); if (session && session.petId !== p.id) setSessionId(null); }}
                                                className={cn('flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border text-[13px] font-bold shrink-0', p.id === pet?.id ? 'border-accent bg-accent/10 text-accent' : 'border-card-border bg-card')}
                                            >
                                                {p.image ? <img src={p.image} alt="" className="w-7 h-7 rounded-full object-cover" /> : <span className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center">{p.name.charAt(0)}</span>}
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </header>

                    <div className="relative flex-1 min-h-0">
                        {/* Mesajlar ya da karşılama */}
                        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto px-4 pt-4 pb-6">
                            {messages.length === 0 ? (
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="w-12 h-12 rounded-2xl bg-accent/12 flex items-center justify-center"><Sparkles className="w-6 h-6 text-accent" /></span>
                                        <div>
                                            <h2 className="text-[20px] font-extrabold leading-tight">Merhaba{firstName ? ` ${firstName}` : ''}!</h2>
                                            <p className="text-[13.5px] font-semibold text-secondary">{pet ? `${pet.name} için ne öğrenmek istersin?` : 'Evcil hayvan bakımıyla ilgili her şeyi sorabilirsin.'}</p>
                                        </div>
                                    </div>

                                    {pet && (
                                        <div className="mt-4 rounded-[20px] bg-card border border-card-border p-3.5 grid grid-cols-3 divide-x divide-card-border text-center">
                                            <div className="px-1">
                                                <p className="text-[11px] font-bold text-secondary">Sağlık</p>
                                                <p className={cn('text-[13.5px] font-extrabold mt-0.5 truncate', health?.tone === 'overdue' ? 'text-emergency' : health?.tone === 'attention' ? 'text-[#C98A1B]' : 'text-[#4E8A23]')}>
                                                    {health ? (health.tone === 'good' ? 'Güncel' : health.tone === 'attention' ? 'Yaklaşan var' : 'Gecikmiş') : '—'}
                                                </p>
                                            </div>
                                            <div className="px-1">
                                                <p className="text-[11px] font-bold text-secondary">Sıradaki</p>
                                                <p className="text-[13.5px] font-extrabold mt-0.5 truncate">{nextCare ? daysLeftText(nextCare.daysLeft) : 'Yok'}</p>
                                            </div>
                                            <div className="px-1">
                                                <p className="text-[11px] font-bold text-secondary">Bugün</p>
                                                <p className="text-[13.5px] font-extrabold mt-0.5 truncate">{formatKm(todayDistanceKm, 1)} km</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                                        {prompts.map(p => (
                                            <button
                                                key={p.title}
                                                type="button"
                                                onClick={() => {
                                                    if (p.send) send(p.send);
                                                    else { setInput(p.prefill || ''); setTimeout(() => inputRef.current?.focus(), 50); }
                                                }}
                                                className="text-left rounded-[18px] bg-card border border-card-border p-3 active:scale-[0.98] transition-transform"
                                            >
                                                <span className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center"><p.Icon className="w-[18px] h-[18px] text-accent" /></span>
                                                <span className="block mt-2 text-[14px] font-extrabold">{p.title}</span>
                                                <span className="block text-[12px] font-semibold text-secondary">{p.hint}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => { close(); router.push('/vet'); }}
                                        className="mt-4 w-full flex items-start gap-3 rounded-[18px] bg-emergency/[0.08] border border-emergency/20 p-3.5 text-left"
                                    >
                                        <AlertTriangle className="w-5 h-5 text-emergency shrink-0 mt-0.5" />
                                        <span className="text-[12.5px] font-semibold leading-snug">
                                            <span className="font-extrabold text-emergency">Acil durumda beklemeyin.</span> Nefes darlığı, zehirlenme şüphesi, nöbet ya da durmayan kanamada hemen bir veterinere gidin. <span className="font-extrabold underline">Klinik bul</span>
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map(m => {
                                        const actions = legacyActions(m);
                                        return (
                                            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                                                <div className={cn(
                                                    'max-w-[86%] rounded-[20px] px-4 py-2.5 text-[15px] leading-relaxed',
                                                    m.role === 'user' ? 'bg-accent text-white rounded-br-md whitespace-pre-wrap'
                                                        : m.meta ? 'bg-[#F0C94E]/15 border border-[#E8A33D]/30 rounded-bl-md'
                                                        : 'bg-card border border-card-border rounded-bl-md',
                                                )}>
                                                    {m.role === 'user' ? m.content : <RichText text={m.content} />}
                                                    {actions.length > 0 && (
                                                        <div className="mt-2.5 flex flex-wrap gap-2">
                                                            {actions.map(a => (
                                                                <button
                                                                    key={a.label}
                                                                    type="button"
                                                                    disabled={busy && a.type !== 'link'}
                                                                    onClick={() => runAction(a, m)}
                                                                    className={cn('h-9 px-3.5 rounded-full text-[13px] font-extrabold disabled:opacity-50', a.type === 'link' ? 'bg-accent/10 text-accent' : 'bg-accent text-white')}
                                                                >
                                                                    {a.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    {busy && (
                                        <div className="flex justify-start">
                                            <div className="rounded-[20px] rounded-bl-md bg-card border border-card-border px-4 py-3.5 flex gap-1.5">
                                                {[0, 1, 2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-accent/70 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Geçmiş */}
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute inset-0 z-10 bg-background overflow-y-auto px-4 py-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-[17px] font-extrabold">Sohbet geçmişi</h3>
                                        <span className="text-[12px] font-semibold text-secondary">Bu cihazda 90 gün saklanır</span>
                                    </div>
                                    {sessions.length === 0 ? (
                                        <p className="text-[14px] font-semibold text-secondary py-8 text-center">Henüz sohbet yok.</p>
                                    ) : (
                                        <div className="rounded-[20px] bg-card border border-card-border divide-y divide-card-border overflow-hidden">
                                            {sessions.map(s => (
                                                <div key={s.id} className="flex items-center">
                                                    <button type="button" onClick={() => { setSessionId(s.id); setShowHistory(false); }} className="flex-1 min-w-0 text-left px-4 py-3">
                                                        <span className={cn('block text-[14.5px] font-bold truncate', s.id === sessionId && 'text-accent')}>{s.title}</span>
                                                        <span className="block text-[12px] font-semibold text-secondary">{new Date(s.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                                                    </button>
                                                    <button type="button" aria-label="Sohbeti sil" onClick={() => { persist(list => list.filter(x => x.id !== s.id)); if (s.id === sessionId) setSessionId(null); }} className="w-12 h-12 flex items-center justify-center text-secondary active:text-emergency">
                                                        <Trash2 className="w-[18px] h-[18px]" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {sessions.length > 0 && (
                                        confirmClear ? (
                                            <div className="mt-4 rounded-[18px] border border-emergency/30 bg-emergency/[0.06] p-3.5">
                                                <p className="text-[13.5px] font-bold">Tüm sohbetler bu cihazdan silinsin mi?</p>
                                                <div className="mt-3 flex gap-2">
                                                    <button type="button" onClick={() => setConfirmClear(false)} className="flex-1 h-11 rounded-xl bg-card border border-card-border text-[14px] font-bold">Vazgeç</button>
                                                    <button type="button" onClick={() => { persist(() => []); setSessionId(null); setConfirmClear(false); }} className="flex-1 h-11 rounded-xl bg-emergency text-white text-[14px] font-extrabold">Sil</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button type="button" onClick={() => setConfirmClear(true)} className="mt-4 w-full h-11 rounded-xl text-[14px] font-bold text-emergency">Tümünü sil</button>
                                        )
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Yazma alanı */}
                    <footer className="shrink-0 border-t border-card-border bg-background px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)]">
                        {quotaText && <p className="text-[11.5px] font-semibold text-secondary text-center mb-2">{quotaText}</p>}
                        <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); send(input); } }}
                                rows={1}
                                maxLength={2000}
                                placeholder={pet ? `${pet.name} hakkında sor…` : 'Bir şey sor…'}
                                className="flex-1 resize-none max-h-32 min-h-[48px] rounded-[22px] bg-card border border-card-border px-4 py-3 text-[15px] font-medium focus:outline-none focus:border-accent/60 placeholder:text-secondary/70"
                                style={{ height: Math.min(128, 48 + Math.max(0, input.split('\n').length - 1) * 22) }}
                            />
                            <button
                                type="submit"
                                aria-label="Gönder"
                                disabled={!input.trim() || busy}
                                className="w-12 h-12 shrink-0 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
                            >
                                <ArrowUp className="w-6 h-6" strokeWidth={2.6} />
                            </button>
                        </form>
                        <p className="text-[11px] font-medium text-secondary/80 text-center mt-2">Moffi AI yanılabilir; veteriner muayenesinin yerini tutmaz.</p>
                    </footer>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
