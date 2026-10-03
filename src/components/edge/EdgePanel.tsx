'use client';

// Kenar paneli (Samsung Edge'den esinlenen, Moffi'ye ait tasarım). Ekran kenarında ince bir tutamak;
// dokununca ya da içeri kaydırınca panel açılır. Panelde canlı widget'lar (yürüyüş, hava, sıradaki sağlık işi)
// ve kullanıcının seçtiği kısayollar (edgeCatalog) var. Tutamak yukarı-aşağı sürüklenerek taşınır.
// Ayarlar profiles.settings.edge'de; konum (y) bu cihazda.

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
    ArrowLeft, Check, ChevronRight, Cloud, CloudLightning, CloudRain, CloudSun, Footprints, HeartPulse,
    MapPin, Pencil, Search, Snowflake, Sun, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePet } from '@/context/PetContext';
import { useActivity } from '@/context/ActivityContext';
import { useQuestEngine } from '@/context/QuestEngineContext';
import { useNotifications } from '@/context/NotificationContext';
import { useChat } from '@/context/ChatContext';
import { useMyBusinesses, setLastPanel } from '@/hooks/useMyBusinesses';
import { useUpcomingCare } from '@/hooks/useUpcomingCare';
import { haptics } from '@/native';
import { useWeather } from '@/context/WeatherContext';
import { ThemePicker } from '@/components/common/ThemePicker';
import { daysLeftText } from '@/lib/health/derive';
import { formatClock, formatKm } from '@/lib/walkMetrics';
import { cn } from '@/lib/utils';
import {
    EDGE_HANDLE_LEVELS, EDGE_SHORTCUTS, MAX_EDGE_SHORTCUTS, MIN_EDGE_SHORTCUTS, readEdgeSettings,
    type EdgeShortcut, type EdgeShortcutId,
} from './edgeCatalog';

const HANDLE_Y_KEY = 'moffi_edge_y';
const handleYListeners = new Set<() => void>();
function subscribeHandleY(cb: () => void) { handleYListeners.add(cb); return () => { handleYListeners.delete(cb); }; }
function readHandleY() {
    try { const y = parseFloat(localStorage.getItem(HANDLE_Y_KEY) || '0'); return Number.isFinite(y) ? y : 0; } catch { return 0; }
}
function writeHandleY(y: number) {
    try { localStorage.setItem(HANDLE_Y_KEY, String(y)); } catch { /* yoksay */ }
    handleYListeners.forEach(cb => cb());
}
const WEATHER_ICON: Record<string, typeof Sun> = { Sun, CloudSun, Cloud, CloudRain, Snowflake, CloudLightning };

function Tile({ s, badge, onClick }: { s: EdgeShortcut; badge?: number; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
            <span
                className="relative w-[52px] h-[52px] rounded-[17px] flex items-center justify-center"
                style={{
                    background: `linear-gradient(160deg, ${s.color} 0%, color-mix(in srgb, ${s.color} 78%, #000) 100%)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 16px -8px ${s.color}`,
                }}
            >
                <s.Icon className="w-6 h-6 text-white" strokeWidth={2.1} />
                {!!badge && badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-emergency text-white text-[10.5px] font-extrabold flex items-center justify-center border-2 border-background">
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </span>
            <span className="text-[10.5px] font-bold text-foreground leading-tight text-center w-[58px] truncate">{s.label}</span>
        </button>
    );
}

/** Arama anahtarı: büyük/küçük harf ve Türkçe karakter farkı gözetmez ("asi" → "Aşılar"). */
function searchKey(text: string) {
    return text.toLocaleLowerCase('tr-TR').replace(/[çğıöşü]/g, ch => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[ch] as string));
}

function EditRow({ s, selected, onToggle, showGroup }: { s: EdgeShortcut; selected: EdgeShortcutId[]; onToggle: (id: EdgeShortcutId) => void; showGroup?: boolean }) {
    const on = selected.includes(s.id);
    const disabled = (!on && selected.length >= MAX_EDGE_SHORTCUTS) || (on && selected.length <= MIN_EDGE_SHORTCUTS);
    return (
        <button type="button" disabled={disabled} onClick={() => onToggle(s.id)} aria-pressed={on} className="w-full flex items-center gap-3 px-3 py-2.5 text-left disabled:opacity-40">
            <span className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0" style={{ backgroundColor: s.color }}>
                <s.Icon className="w-[18px] h-[18px] text-white" />
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-bold">{s.label}</span>
                <span className="block text-[11.5px] font-semibold text-secondary truncate">{showGroup ? `${s.group} · ${s.desc}` : s.desc}</span>
            </span>
            <span className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0', on ? 'bg-accent border-accent' : 'border-card-border')}>
                {on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.2} />}
            </span>
        </button>
    );
}

function Card({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
    const Comp = onClick ? 'button' : 'div';
    return (
        <Comp type={onClick ? 'button' : undefined} onClick={onClick} className={cn('w-full text-left rounded-[20px] card-premium p-3.5', onClick && 'active:scale-[0.98] transition-transform', className)}>
            {children}
        </Comp>
    );
}

/** hidden: başka bir pencere (yürüyüş hazırlığı, hikâye, ayarlar…) açıkken tutamak gizlenir. */
export function EdgePanel({ hidden = false }: { hidden?: boolean }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, updateSettings } = useAuth();
    const { pets, activePet } = usePet();
    const { walkData } = useActivity();
    const { todayDistanceKm, dailyGoal } = useQuestEngine();
    const { unreadCount } = useNotifications();
    const { unreadCount: unreadMessages, setIsInboxOpen } = useChat();
    const myBusinesses = useMyBusinesses();

    const settings = useMemo(() => readEdgeSettings(user?.settings?.edge), [user?.settings?.edge]);
    const [view, setView] = useState<'main' | 'tag' | 'edit'>('main');
    // Panel açıldığı sayfaya bağlıdır: sayfa değişince kendiliğinden kapalı sayılır (efektle kapatmaya gerek yok).
    const [openOn, setOpenOn] = useState<string | null>(null);
    const open = openOn !== null && openOn === (pathname ?? '');
    const setOpen = useCallback((v: boolean) => {
        if (v) { setView('main'); setOpenOn(pathname ?? ''); } else setOpenOn(null);
    }, [pathname]);
    // Tutamağın yüksekliği cihazda saklanır; sürüklerken geçici değer, bırakınca kaydedilir.
    const storedY = useSyncExternalStore(subscribeHandleY, readHandleY, () => 0);
    const [dragY, setHandleY] = useState<number | null>(null);
    const handleY = dragY ?? storedY;
    const [query, setQuery] = useState('');
    const pet = activePet || pets[0] || null;
    const { items: care, loaded: careLoaded } = useUpcomingCare(pets, user?.id, open);

    const buzz = useCallback(() => { if (settings.hapticsEnabled) haptics.tap(); }, [settings.hapticsEnabled]);



    // --- Hava durumu (izin zaten verilmişse kendiliğinden; değilse kullanıcı dokununca sorulur) ---
    const { weather, isLoading: weatherLoading, needsPermission, permissionDenied, requestPrecise } = useWeather();

    // --- Tutamak: dokun / içeri kaydır = aç; yukarı-aşağı sürükle = taşı ---
    const drag = useRef<{ x: number; y: number; startY: number; moved: boolean; vertical: boolean; opened: boolean } | null>(null);
    const clampY = (y: number) => Math.max(-(window.innerHeight / 2 - 90), Math.min(window.innerHeight / 2 - 130, y));
    const onHandleDown = (e: React.PointerEvent) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, startY: handleY, moved: false, vertical: false, opened: false };
    };
    const onHandleMove = (e: React.PointerEvent) => {
        const d = drag.current;
        if (!d) return;
        const dx = (e.clientX - d.x) * (settings.position === 'left' ? 1 : -1);
        const dy = e.clientY - d.y;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) d.moved = true;
        if (!d.vertical && dx > 22 && Math.abs(dx) > Math.abs(dy) && !d.opened) { d.opened = true; buzz(); setOpen(true); return; }
        if (d.vertical || (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx))) { d.vertical = true; setHandleY(clampY(d.startY + dy)); }
    };
    const onHandleUp = () => {
        const d = drag.current;
        drag.current = null;
        if (!d) return;
        if (d.vertical) { writeHandleY(handleY); setHandleY(null); return; }
        if (!d.moved && !d.opened) { buzz(); setOpen(true); }
    };

    const runShortcut = (s: EdgeShortcut) => {
        buzz();
        if (s.id === 'tag') { setView('tag'); return; }
        setOpen(false);
        if (s.id === 'messages') { setIsInboxOpen(true); return; }
        if (s.id === 'business') setLastPanel('business');
        if (s.event) window.dispatchEvent(new CustomEvent(s.event));
        else if (s.path) router.push(s.path);
    };

    const visibleShortcuts = settings.shortcuts
        .map(id => EDGE_SHORTCUTS.find(s => s.id === id)!)
        .filter(s => s && (s.id !== 'business' || myBusinesses.length > 0));
    const badgeOf = (id: EdgeShortcutId) => (id === 'notifications' ? unreadCount : id === 'messages' ? unreadMessages : 0);

    // Seçim her dokunuşta anında kaydedilir (Ayarlar → Kenar Paneli ile aynı davranış); geri dönmek değişikliği kaybettirmez.
    const toggleShortcut = (id: EdgeShortcutId) => {
        buzz();
        const current = settings.shortcuts;
        const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
        if (next.length < MIN_EDGE_SHORTCUTS || next.length > MAX_EDGE_SHORTCUTS) return;
        updateSettings('edge', { activeActions: next });
    };
    const available = EDGE_SHORTCUTS.filter(s => s.id !== 'business' || myBusinesses.length > 0);
    const q = searchKey(query.trim());
    // Kelime başından eşleşir ("asi" → Aşılar, ama "sayfası" değil); adı eşleşenler önce.
    const matches = q
        ? available
            .map(s => {
                const nameHit = searchKey(s.label).split(/\s+/).some(w => w.startsWith(q));
                const anyHit = nameHit || searchKey(`${s.desc} ${s.group} ${s.keywords || ''}`).split(/\s+/).some(w => w.startsWith(q));
                return { s, rank: nameHit ? 0 : anyHit ? 1 : -1 };
            })
            .filter(m => m.rank >= 0)
            .sort((a, b) => a.rank - b.rank)
            .map(m => m.s)
        : available;

    const side = settings.position;
    const walkActive = walkData.isActive;
    const goalKm = Math.max(0.1, dailyGoal.distance);
    const percent = Math.min(100, Math.round((todayDistanceKm / goalKm) * 100));
    const nextCare = care[0];
    const WeatherIcon = weather ? WEATHER_ICON[weather.iconKey] || Sun : Sun;

    return (
        <>
            {/* Tutamak */}
            {!open && !hidden && (
                <div
                    role="button"
                    aria-label="Kenar panelini aç"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') setOpen(true); }}
                    onPointerDown={onHandleDown}
                    onPointerMove={onHandleMove}
                    onPointerUp={onHandleUp}
                    onPointerCancel={() => { drag.current = null; }}
                    className={cn('theme-vet fixed top-1/2 z-[2950] w-6 h-24 flex items-center touch-none select-none', side === 'left' ? 'left-0 justify-start' : 'right-0 justify-end')}
                    style={{ transform: `translateY(calc(-50% + ${handleY}px))` }}
                >
                    <span
                        className={cn('block w-[5px] h-[72px] bg-accent shadow-[0_2px_10px_rgba(0,0,0,0.18)]', side === 'left' ? 'rounded-r-full' : 'rounded-l-full')}
                        style={{ opacity: settings.handleOpacity }}
                    />
                </div>
            )}

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[6500] bg-black/25" />
                        <motion.aside
                            aria-label="Kenar paneli"
                            initial={{ x: side === 'left' ? '-110%' : '110%' }}
                            animate={{ x: 0 }}
                            exit={{ x: side === 'left' ? '-110%' : '110%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={side === 'left' ? { left: 0.5, right: 0 } : { left: 0, right: 0.5 }}
                            onDragEnd={(_, info) => { if ((side === 'left' && info.offset.x < -70) || (side === 'right' && info.offset.x > 70)) setOpen(false); }}
                            className={cn(
                                'theme-vet fixed top-1/2 -translate-y-1/2 z-[6501] w-[288px] max-w-[86vw] max-h-[82vh] flex flex-col rounded-[28px] bg-background text-foreground border border-card-border shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)] overflow-hidden',
                                side === 'left' ? 'left-2.5' : 'right-2.5',
                            )}
                        >
                            {view === 'main' && (
                                <>
                                    <div className="overflow-y-auto no-scrollbar p-3 space-y-2.5">
                                        {/* Yürüyüş */}
                                        <Card onClick={() => { buzz(); setOpen(false); if (walkActive) router.push('/walk/tracking'); else window.dispatchEvent(new CustomEvent('open-walk-panel')); }}>
                                            <div className="flex items-center gap-3">
                                                <span className="relative w-14 h-14 shrink-0">
                                                    <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                                                        <circle cx="28" cy="28" r="23" fill="none" strokeWidth="6" className="stroke-foreground/10" />
                                                        <circle cx="28" cy="28" r="23" fill="none" strokeWidth="6" strokeLinecap="round" stroke="#8FD14F" strokeDasharray={`${(percent / 100) * 144.5} 144.5`} />
                                                    </svg>
                                                    <Footprints className="absolute inset-0 m-auto w-5 h-5 text-[#5C9B2E]" />
                                                </span>
                                                <span className="flex-1 min-w-0">
                                                    {walkActive ? (
                                                        <>
                                                            <span className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#4E8A23]">
                                                                <span className="w-2 h-2 rounded-full bg-[#8FD14F] animate-pulse" />{walkData.isPaused ? 'Duraklatıldı' : `${walkData.petName || pet?.name || ''} yürüyor`}
                                                            </span>
                                                            <span className="block text-[20px] font-extrabold leading-tight">{formatKm(walkData.distance / 1000)} km</span>
                                                            <span className="block text-[12px] font-semibold text-secondary">{formatClock(walkData.time)} · takibe dön</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="block text-[12px] font-bold text-secondary">Bugün</span>
                                                            <span className="block text-[20px] font-extrabold leading-tight">{formatKm(todayDistanceKm, 1)} <span className="text-[13px] text-secondary">/ {formatKm(goalKm, 1)} km</span></span>
                                                            <span className="block text-[12px] font-bold text-accent">Yürüyüşe başla</span>
                                                        </>
                                                    )}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-secondary/60 shrink-0" />
                                            </div>
                                        </Card>

                                        {/* Hava + sıradaki sağlık işi */}
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <Card
                                                onClick={weather
                                                    ? () => { buzz(); setOpen(false); window.dispatchEvent(new CustomEvent('open-weather-detail')); }
                                                    : !permissionDenied ? () => requestPrecise() : undefined}
                                                className="p-3"
                                            >
                                                {weather ? (
                                                    <>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[24px] font-extrabold leading-none">{weather.temp}°</span>
                                                            <WeatherIcon className="w-7 h-7 text-[#E8A33D]" />
                                                        </div>
                                                        <p className="text-[12px] font-bold mt-1 truncate">{weather.condition}</p>
                                                        <p className="text-[11px] font-semibold text-secondary leading-snug mt-0.5 line-clamp-2">{weather.advice}</p>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <MapPin className="w-6 h-6 text-[#E8A33D]" />
                                                        <p className="text-[12px] font-bold leading-snug">
                                                            {weatherLoading ? 'Hava durumu alınıyor…'
                                                                : permissionDenied ? 'Konum izni kapalı'
                                                                : needsPermission ? 'Hava durumunu göster'
                                                                : 'Alınamadı, tekrar dene'}
                                                        </p>
                                                        {permissionDenied && <p className="text-[11px] font-semibold text-secondary leading-snug">Telefon ayarlarından konuma izin verebilirsin.</p>}
                                                    </div>
                                                )}
                                            </Card>
                                            <Card onClick={() => { buzz(); setOpen(false); router.push(nextCare?.href || '/health'); }} className="p-3">
                                                <HeartPulse className={cn('w-6 h-6', nextCare && nextCare.daysLeft !== null && nextCare.daysLeft < 0 ? 'text-emergency' : 'text-[#8B7FD9]')} />
                                                {!careLoaded && !nextCare ? (
                                                    <p className="text-[12px] font-bold mt-1.5 text-secondary">Yükleniyor…</p>
                                                ) : nextCare ? (
                                                    <>
                                                        <p className="text-[12px] font-bold mt-1.5 leading-snug line-clamp-2">{nextCare.petName} — {nextCare.title}</p>
                                                        {nextCare.daysLeft !== null && (
                                                            <p className={cn('text-[11.5px] font-extrabold mt-0.5', nextCare.daysLeft < 0 ? 'text-emergency' : 'text-accent')}>{daysLeftText(nextCare.daysLeft)}</p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-[12px] font-bold mt-1.5">Sağlık güncel</p>
                                                        <p className="text-[11px] font-semibold text-secondary">Yaklaşan iş yok</p>
                                                    </>
                                                )}
                                            </Card>
                                        </div>

                                        {/* Kısayollar */}
                                        <div className="rounded-[20px] card-premium px-2 py-3.5">
                                            <div className="grid grid-cols-4 gap-y-3.5 justify-items-center">
                                                {visibleShortcuts.map(s => <Tile key={s.id} s={s} badge={badgeOf(s.id)} onClick={() => runShortcut(s)} />)}
                                            </div>
                                        </div>
                                        <div className="rounded-[20px] card-premium p-2">
                                            <ThemePicker compact />
                                        </div>
                                    </div>
                                    <div className="shrink-0 border-t border-card-border px-3 py-2 flex items-center justify-between">
                                        <button type="button" onClick={() => { buzz(); setQuery(''); setView('edit'); }} className="h-10 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-bold text-secondary active:bg-foreground/5">
                                            <Pencil className="w-4 h-4" /> Düzenle
                                        </button>
                                        <button type="button" onClick={() => setOpen(false)} aria-label="Kapat" className="w-10 h-10 rounded-full flex items-center justify-center text-secondary active:bg-foreground/5">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </>
                            )}

                            {view === 'tag' && (
                                <div className="p-4 flex flex-col items-center text-center">
                                    <div className="w-full flex items-center justify-between mb-2">
                                        <button type="button" onClick={() => setView('main')} aria-label="Geri" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-foreground/5"><ArrowLeft className="w-5 h-5" /></button>
                                        <span className="text-[15px] font-extrabold">Künye QR</span>
                                        <span className="w-10" />
                                    </div>
                                    {pet ? (
                                        <>
                                            <div className="p-3 bg-white rounded-[22px] shadow-sm border border-card-border">
                                                <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/id/${pet.id}`} size={176} fgColor="#201B16" bgColor="#FFFFFF" level="M" />
                                            </div>
                                            <p className="text-[16px] font-extrabold mt-3">{pet.name}</p>
                                            <p className="text-[12.5px] font-semibold text-secondary leading-snug mt-1">Okutan kişi {pet.name} için künye sayfasını açar; sana ulaşabilir ya da gördüğünü bildirebilir.</p>
                                            <button type="button" onClick={() => { setOpen(false); router.push('/pasaport'); }} className="mt-4 w-full h-11 rounded-2xl bg-accent/10 text-accent text-[14px] font-extrabold">Pasaporta git</button>
                                        </>
                                    ) : (
                                        <p className="text-[13px] font-semibold text-secondary py-6">Künye için önce bir evcil hayvan ekle.</p>
                                    )}
                                </div>
                            )}

                            {view === 'edit' && (
                                <>
                                    <div className="shrink-0 px-3 pt-3 pb-2 flex items-center justify-between">
                                        <button type="button" onClick={() => setView('main')} aria-label="Geri" className="w-10 h-10 rounded-full flex items-center justify-center active:bg-foreground/5"><ArrowLeft className="w-5 h-5" /></button>
                                        <span className="text-[15px] font-extrabold">Paneli düzenle</span>
                                        <button type="button" onClick={() => { buzz(); setView('main'); }} className="h-9 px-3.5 rounded-full bg-accent text-white text-[13px] font-extrabold">Bitti</button>
                                    </div>
                                    <div className="shrink-0 px-3 pb-2">
                                        <label className="flex items-center gap-2 h-11 px-3.5 rounded-2xl card-premium">
                                            <Search className="w-[18px] h-[18px] text-secondary shrink-0" />
                                            <input
                                                type="search"
                                                value={query}
                                                onChange={e => setQuery(e.target.value)}
                                                placeholder="Kısayol ara (ör. aşı, sepet)"
                                                aria-label="Kısayol ara"
                                                enterKeyHint="search"
                                                className="flex-1 min-w-0 bg-transparent outline-none text-[14px] font-semibold placeholder:text-secondary/70 [&::-webkit-search-cancel-button]:hidden"
                                            />
                                            {query && (
                                                <button type="button" onClick={() => setQuery('')} aria-label="Aramayı temizle" className="w-6 h-6 -mr-1 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </label>
                                        <p className="text-[11.5px] font-semibold text-secondary px-1 mt-1.5">{settings.shortcuts.length}/{MAX_EDGE_SHORTCUTS} seçili · dokununca anında kaydedilir</p>
                                    </div>
                                    <div className="overflow-y-auto no-scrollbar px-3 pb-4 space-y-4">
                                        {q ? (
                                            matches.length > 0 ? (
                                                <div className="rounded-[18px] card-premium divide-y divide-card-border overflow-hidden">
                                                    {matches.map(s => <EditRow key={s.id} s={s} selected={settings.shortcuts} onToggle={toggleShortcut} showGroup />)}
                                                </div>
                                            ) : (
                                                <p className="text-[13px] font-semibold text-secondary text-center py-6">“{query.trim()}” için kısayol bulunamadı.</p>
                                            )
                                        ) : (
                                            (['Hızlı', 'Sağlık', 'Alışveriş', 'Topluluk', 'Aktivite', 'Uygulama'] as const).map(group => {
                                                const items = available.filter(s => s.group === group);
                                                if (items.length === 0) return null;
                                                return (
                                                    <div key={group}>
                                                        <p className="text-[11.5px] font-extrabold text-secondary uppercase tracking-wide px-1 mb-1.5">{group}</p>
                                                        <div className="rounded-[18px] card-premium divide-y divide-card-border overflow-hidden">
                                                            {items.map(s => <EditRow key={s.id} s={s} selected={settings.shortcuts} onToggle={toggleShortcut} />)}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}

                                        {!q && <div>
                                            <p className="text-[11.5px] font-extrabold text-secondary uppercase tracking-wide px-1 mb-1.5">Tutamak</p>
                                            <div className="rounded-[18px] card-premium p-3 space-y-3">
                                                <div>
                                                    <p className="text-[12.5px] font-bold mb-1.5">Ekranın hangi kenarında?</p>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        {(['left', 'right'] as const).map(p => (
                                                            <button key={p} type="button" onClick={() => { buzz(); updateSettings('edge', { position: p }); }} className={cn('h-9 rounded-xl text-[13px] font-bold', side === p ? 'bg-accent text-white' : 'bg-foreground/[0.05]')}>
                                                                {p === 'left' ? 'Sol' : 'Sağ'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[12.5px] font-bold mb-1.5">Görünürlük</p>
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        {EDGE_HANDLE_LEVELS.map(l => (
                                                            <button key={l.label} type="button" onClick={() => { buzz(); updateSettings('edge', { handleOpacity: l.value }); }} className={cn('h-9 rounded-xl text-[13px] font-bold', settings.handleOpacity === l.value ? 'bg-accent text-white' : 'bg-foreground/[0.05]')}>
                                                                {l.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => updateSettings('edge', { hapticsEnabled: !settings.hapticsEnabled })} className="w-full flex items-center justify-between">
                                                    <span className="text-[12.5px] font-bold">Titreşim</span>
                                                    <span className={cn('w-11 h-6 rounded-full relative transition-colors', settings.hapticsEnabled ? 'bg-accent' : 'bg-foreground/15')}>
                                                        <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', settings.hapticsEnabled ? 'left-[22px]' : 'left-0.5')} />
                                                    </span>
                                                </button>
                                            </div>
                                        </div>}
                                    </div>
                                </>
                            )}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
