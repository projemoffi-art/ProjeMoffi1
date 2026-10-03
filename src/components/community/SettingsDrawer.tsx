"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, LogOut, ChevronRight, Activity, X, Check, ShieldAlert, ShieldCheck, Palette, Smartphone,
    Sparkles, Zap, Shield, BrainCircuit, Trash2, Download, ArrowLeft, MessageSquare, Tag, Plus,
    BellRing, Type, Glasses, Layers, Crown, Building2, Store, Lock,
} from 'lucide-react';
import { cn, showToast } from '@/lib/utils';
import { useAuth, type User as AuthUser, type SettingsCategory } from '@/context/AuthContext';
import { useTheme, type ColorBlindMode } from '@/context/ThemeContext';
import { useQuestEngine } from '@/context/QuestEngineContext';
import { exportUserData } from '@/lib/utils/dataExport';
import { apiService } from '@/services/apiService';
import { useMyBusinesses, setLastPanel } from '@/hooks/useMyBusinesses';
import { adoptionService } from '@/services/adoptionService';
import { socialService, type PersonCard } from '@/services/socialService';
import { isFrameUnlocked, formatRemaining, type FrameStyle } from '@/lib/vipFrames';
import { DeleteAccountButton } from '@/components/account/AccountDeletion';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ThemePicker } from '@/components/common/ThemePicker';
import { EDGE_SHORTCUTS, MAX_EDGE_SHORTCUTS, MIN_EDGE_SHORTCUTS, readEdgeSettings, type EdgeShortcutId } from '@/components/edge/edgeCatalog';

interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

type DrawerView = 'main' | 'activity' | 'blocked' | 'words' | 'accessibility' | 'password' | 'notifications' | 'sidebar_config' | 'ai_assistant' | 'account_settings' | 'profile_personalization';

// --- Shared Interfaces ---
interface SectionProps {
    title: string;
    children: React.ReactNode;
}

interface ActionRowProps {
    icon: typeof User;
    label: string;
    desc?: string;
    onClick?: () => void;
    danger?: boolean;
    rightElement?: React.ReactNode;
}

interface ViewProps {
    user: AuthUser;
    setView: (view: DrawerView) => void;
    updateSettings: (category: string, data: SettingsCategory) => Promise<void>;
}

// --- Helper Components ---
const Section = React.memo(({ title, children }: SectionProps) => (
    <div className="mb-8 transform-gpu">
        <div className="px-3 mb-2">
            <p className="text-[11px] font-black text-secondary uppercase tracking-[0.3em]">{title}</p>
        </div>
        <div className="space-y-0 relative">
            {children}
        </div>
    </div>
));
Section.displayName = 'Section';

const ActionRow = React.memo(({ icon: Icon, label, desc, onClick, danger, rightElement }: ActionRowProps) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center justify-between py-3 px-2 hover:bg-foreground/[0.03] transition-all active:scale-[0.98] group text-left border-b border-card-border last:border-0 rounded-2xl transform-gpu will-change-transform",
            danger && "hover:bg-red-500/5"
        )}
    >
        <div className="flex items-center gap-3">
            <div className={cn(
                "flex items-center justify-center transition-transform group-hover:scale-110",
                danger ? "text-red-500" : "text-foreground/40"
            )}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <span className={cn("font-bold text-[12px] uppercase tracking-tight leading-none", danger ? "text-red-500/80" : "text-foreground/90")}>{label}</span>
                {desc && <p className="text-[8.5px] text-foreground/30 mt-0.5 leading-none font-medium">{desc}</p>}
            </div>
        </div>
        {rightElement ? rightElement : <ChevronRight className={cn("w-3 h-3 opacity-20 group-hover:opacity-60 transition-all group-hover:translate-x-0.5", danger ? "text-red-500" : "text-foreground/60")} />}
    </button>
));
ActionRow.displayName = 'ActionRow';

// --- View Components ---

const ProfilePersonalizationView = ({ user, setView, updateSettings }: ViewProps) => {
    const isPrime = !!user.is_prime;
    // Faz 23: Neon/Metal artık Prime OLMADAN da Ödül Merkezi'nden alınan
    // geçici bir VIP perk'iyle açılabiliyor (bkz. src/lib/vipFrames.ts) —
    // seçim ekranı bunu da hesaba katmalı, yoksa kullanıcı PP ile satın aldığı
    // çerçeveyi burada hâlâ "Prime" kilitli görüp seçemezdi.
    const { activePerks } = useQuestEngine();
    const router = useRouter();
    const currentFrame = user.settings?.appearance?.frameStyle || 'minimal';

    const handleSelect = (style: FrameStyle, locked: boolean) => {
        if (locked) {
            window.dispatchEvent(new CustomEvent('open-premium-modal'));
            return;
        }
        updateSettings('appearance', { frameStyle: style });
        window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: 'Profil çerçeveniz güncellendi!', icon: 'Check' } }));
    };

    const frames = [
        { id: 'minimal', label: 'Minimal', icon: User, desc: 'Sade ve zarif bir profil çerçevesi.', isPremium: false },
        { id: 'glass', label: 'Glassmorphism', icon: Layers, desc: 'Yarı saydam, cam efektli modern bir görünüm.', isPremium: false },
        { id: 'neon', label: 'Neon Aura', icon: Zap, desc: 'Profilini parlat. Tüm dikkatleri üzerine çek.', isPremium: true },
        { id: 'metal', label: 'Dark Metal', icon: Shield, desc: 'Ağır, prestijli ve güçlü bir zırh çerçevesi.', isPremium: true },
    ];

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="flex-1 overflow-y-auto pr-2 custom-scrollbar scroll-smooth space-y-4"
            style={{ maxHeight: 'calc(94vh - 180px)' }}
        >
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setView('main')} className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center hover:bg-foreground/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black uppercase tracking-tighter">Profil Kişiselleştirme</h2>
            </div>

            <p className="text-[11px] text-secondary mb-6 font-medium leading-relaxed">
                Profil fotoğrafı çerçeveni seç. Neon ve Metal Aura tarzları Prime üyelerine özeldir — veya{' '}
                <button
                    onClick={() => router.push('/walk/rewards')}
                    className="underline font-black text-accent"
                >
                    Ödül Merkezi
                </button>
                {'\'nden Moffi Puanı ile birkaç günlüğüne dene!'}
            </p>

            <div className="space-y-6">
                {/* 1. Aura Çerçevesi */}
                <div>
                    <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3 px-1">1. Profil Çerçevesi</h3>
                    <div className="space-y-2">
                        {frames.map(frame => {
                            const unlockedViaVip = !isPrime && frame.isPremium && isFrameUnlocked(frame.id as FrameStyle, { isPrime: false, activePerks });
                            const isLocked = frame.isPremium && !isPrime && !unlockedViaVip;
                            const isSelected = currentFrame === frame.id;
                            const vipPerkKey = frame.id === 'neon' ? 'frame_neon' : frame.id === 'metal' ? 'frame_metal' : null;
                            return (
                                <button
                                    key={frame.id}
                                    onClick={() => handleSelect(frame.id as FrameStyle, isLocked)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-2xl border-2 transition-all relative overflow-hidden group",
                                        isSelected ? "border-accent bg-accent/5" : "border-card-border bg-foreground/[0.02] hover:bg-foreground/[0.05]",
                                        isLocked ? "opacity-70 grayscale hover:grayscale-0" : ""
                                    )}
                                >
                                    {isLocked && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#FFD700]/10 text-[#FFD700] px-2 py-1 rounded-lg">
                                            <Lock className="w-3 h-3" />
                                            <span className="text-[9px] font-black uppercase">Prime</span>
                                        </div>
                                    )}
                                    {unlockedViaVip && vipPerkKey && activePerks[vipPerkKey] && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg">
                                            <Zap className="w-3 h-3" />
                                            <span className="text-[9px] font-black uppercase">{formatRemaining(activePerks[vipPerkKey])}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-2 relative shrink-0",
                                            frame.id === 'minimal' ? "border-foreground/10 bg-background" :
                                            frame.id === 'glass' ? "border-white/40 bg-black/10 dark:bg-white/10 backdrop-blur-md" :
                                            frame.id === 'neon' ? "border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.6)] bg-white dark:bg-black" :
                                            "border-gray-500 bg-gray-900 shadow-[inset_0_4px_10px_rgba(255,255,255,0.2)]"
                                        )}>
                                            <User className={cn("w-4 h-4", frame.id === 'neon' ? "text-[#00FFFF]" : "text-secondary")} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest">{frame.label}</h4>
                                            <p className="text-[9px] text-secondary font-medium mt-0.5">{frame.desc}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>

            {!isPrime && (
                <div className="mt-8 p-5 bg-gradient-to-r from-[#FFD700]/10 to-[#B8860B]/10 border border-[#FFD700]/30 rounded-3xl text-center shadow-lg">
                    <Crown className="w-8 h-8 text-[#FFD700] mx-auto mb-2 drop-shadow-md" />
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-1">Daha Fazlasını İstiyor Musun?</h3>
                    <p className="text-[10px] text-secondary mb-4 font-bold">Aura çerçeveleri, animasyonlu rozetler ve prestijli profil görünümleri için Prime kulübüne katıl.</p>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-premium-modal'))}
                        className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#B8860B] hover:brightness-110 text-black rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                    >
                        Moffi Prime&apos;a Yükselt
                    </button>
                </div>
            )}
        </motion.div>
    );
};

// Kişi bir işletmenin üyesiyse (sahip/yönetici/personel) panele geçiş — rol değil üyelik (8.54).
// Herkes kendi hesabıyla işletme başvurusu yapabilir (hesap = kişi, işletme = ayrı kayıt).
const BusinessPortalSection = () => {
    const businesses = useMyBusinesses();
    return (
        <Section title="İşletme Portalı">
            {businesses.length > 0 && (
                <ActionRow icon={Building2} label="İşletme Paneline Geç" desc={businesses.length === 1 ? businesses[0].name : `${businesses.length} işletme`} onClick={() => { setLastPanel('business'); window.location.href = '/business/dashboard'; }} />
            )}
            <ActionRow
                icon={Store}
                label={businesses.length > 0 ? 'Yeni işletme aç' : 'İşletmeni Moffi\'ye ekle'}
                desc="Veteriner, pet shop, kuaför, eğitmen ya da barınak"
                onClick={() => { window.location.href = '/business-register'; }}
            />
        </Section>
    );
};

const MainView = ({ user, setView, onClose }: ViewProps & { onClose: () => void }) => {
    const { logout } = useAuth();
    const { totalPatiPuan } = useQuestEngine();
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState('');

    // KVKK veri paketi: hesabın gerçek kayıtları tek JSON dosyasında.
    const handleExport = async () => {
        setIsExporting(true);
        try {
            setExportStatus('Evcil hayvanlar ve gönderiler toplanıyor…');
            const [pets, posts] = await Promise.all([apiService.getPets(), socialService.myPostsForExport()]);
            setExportStatus('İlanlar, bildirimler ve mesajlar toplanıyor…');
            const [adoptions, notifications, chats] = await Promise.all([
                adoptionService.mine().catch(() => []),
                apiService.getInboxMessages(),
                apiService.getChatConversations(),
            ]);
            setExportStatus('Siparişler, yürüyüşler ve PawCoin toplanıyor…');
            const [orders, walkStats, history] = await Promise.all([apiService.getOrders(), apiService.getWalkStats(user.id), apiService.getPawCoinHistory(1000)]);
            exportUserData({ user, pets, posts, adoptions, notifications, orders, chats, walkStats, pawCoin: { balance: totalPatiPuan, history } });
        } catch (error) {
            console.error('Dışa aktarma başarısız:', error);
            showToast('Veri paketi hazırlanamadı, tekrar dene.', 'AlertCircle', 'text-red-500');
        } finally {
            setIsExporting(false);
            setExportStatus('');
        }
    };

    // Yalnızca bu cihazda tutulan tercihleri siler (oturum anahtarları korunur); hesap verisine dokunmaz.
    const handleClearDevice = () => {
        if (!confirm('Bu cihazda tutulan tercihler ve önbellek silinecek. Hesabın ve kayıtların etkilenmez. Devam edilsin mi?')) return;
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !key.startsWith('sb-')) keysToRemove.push(key);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        window.location.reload();
    };

    return (
    <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        className="flex-1 overflow-y-auto pr-2 scroll-smooth space-y-4 custom-scrollbar"
        style={{ maxHeight: 'calc(94vh - 180px)' }}
    >
        {/* PREMIUM BANNER / SUBSCRIPTION MANAGEMENT */}
        {!user.is_prime ? (
            <div className="mx-2 mb-6 mt-2 relative group overflow-hidden rounded-[2rem] border border-accent/30 bg-card p-5 shadow-lg cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-premium-modal'))}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl group-hover:bg-accent/20 transition-all rounded-full" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.2rem] bg-accent p-0.5 shadow-lg flex items-center justify-center">
                            <div className="w-full h-full bg-card rounded-xl flex items-center justify-center">
                                <Crown className="w-6 h-6 text-accent" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[13px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">Moffi Prime <Sparkles className="w-3 h-3 text-accent" /></h4>
                            <p className="text-[9px] text-accent font-medium uppercase tracking-widest mt-1">Ayrıcalıkların Kilidini Aç</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-accent/50 group-hover:text-accent transition-colors group-hover:translate-x-1 transform" />
                </div>
            </div>
        ) : (
            <div className="mx-2 mb-6 mt-2 relative group overflow-hidden rounded-[2rem] border border-green-500/30 bg-green-500/5 p-5 shadow-lg cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-subscription-management'))}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl group-hover:bg-green-500/20 transition-all rounded-full" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-green-400 to-emerald-600 p-0.5 shadow-lg flex items-center justify-center">
                            <div className="w-full h-full bg-green-50 rounded-xl flex items-center justify-center">
                                <Crown className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[13px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">Moffi Prime <Sparkles className="w-3 h-3 text-emerald-500" /></h4>
                            <p className="text-[9px] text-emerald-600/80 font-medium uppercase tracking-widest mt-1">Aboneliği Yönet / Detaylar</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-emerald-500/50 group-hover:text-emerald-500 transition-colors group-hover:translate-x-1 transform" />
                </div>
            </div>
        )}

        <BusinessPortalSection />

        <Section title="Hesap ve Profil">
            <ActionRow icon={User} label="Hesap Bilgileri" desc="E-posta, telefon, doğum tarihi, hesabı silme." onClick={() => setView('account_settings')} />
            <ActionRow icon={Palette} label="Profil Çerçevesi" desc="Profil fotoğrafının çerçevesi." onClick={() => setView('profile_personalization')} />
        </Section>

        <Section title="Görünüm">
            <ActionRow icon={Type} label="Görünüm ve tema" desc="Açık/koyu tema, yazı boyutu, görme desteği." onClick={() => setView('accessibility')} />
            <ActionRow icon={Layers} label="Kenar Paneli" desc="Kenar panelindeki kısayolları seç." onClick={() => setView('sidebar_config')} />
        </Section>

        <Section title="Moffi AI">
            <ActionRow icon={BrainCircuit} label="Moffi AI tercihleri" desc="Konuşma tonu ve yanıt uzunluğu." onClick={() => setView('ai_assistant')} />
        </Section>

        <Section title="Bildirimler">
            <ActionRow icon={BellRing} label="Anlık bildirimler" desc="Bu cihazda bildirim almayı aç ya da kapat." onClick={() => setView('notifications')} />
        </Section>

        <Section title="Sosyal">
            <ActionRow icon={ShieldAlert} label="Engellenenler" desc="Engellediğin hesaplar." onClick={() => setView('blocked')} />
            <ActionRow icon={MessageSquare} label="Gizli Kelimeler" desc="Gönderi ve yorumlarda *** olarak görünür." onClick={() => setView('words')} />
        </Section>

        <Section title="Güvenlik">
            <ActionRow icon={Lock} label="Şifre Değiştir" desc="Mevcut şifrenle doğrulanır." onClick={() => setView('password')} />
            <ActionRow icon={Smartphone} label="Oturumlar" desc="Diğer cihazlardan çıkış yap." onClick={() => setView('activity')} />
        </Section>

        <Section title="Veri">
            <ActionRow
                icon={Download}
                label="Veri Paketini İndir"
                desc={exportStatus || "Hesabındaki kayıtları KVKK kapsamında tek dosya olarak al."}
                onClick={isExporting ? undefined : handleExport}
                rightElement={isExporting ? <Activity className="w-3 h-3 animate-spin text-emerald-400" /> : undefined}
            />
            <ActionRow icon={Trash2} label="Bu cihazdaki tercihleri temizle" desc="Hesabın ve kayıtların etkilenmez." onClick={handleClearDevice} />
        </Section>

        <Section title="Oturum">
            <ActionRow danger icon={LogOut} label="Çıkış Yap" onClick={async () => { onClose(); await logout(); window.location.replace('/'); }} />
        </Section>

        <div className="h-40" />
    </motion.div>
    );
};

// Bu cihazın gerçek bildirim aboneliği (push_subscriptions). Eskiden yalnızca bir ayar işaretini değiştiriyordu;
// ana sayfadaki "Moffi Hesabım" penceresindeki izin yönetimi de buraya taşındı.
function PushSubscriptionRow({ userId }: { userId?: string }) {
    const { permission, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications(userId);
    const status = permission === 'denied'
        ? 'Tarayıcı ayarlarından engellenmiş; oradan izin vermen gerekiyor.'
        : isSubscribed ? 'Bu cihazda açık.' : 'Aşı, randevu ve kayıp uyarılarını kaçırmamak için aç.';
    return (
        <div className="bg-foreground/[0.03] rounded-[2rem] p-5 border border-card-border flex items-center justify-between gap-4">
            <div className="min-w-0">
                <p className="text-[14px] font-black text-foreground">Anlık bildirimler</p>
                <p className="text-[12px] text-secondary font-semibold mt-1 leading-snug">{status}</p>
            </div>
            {permission !== 'denied' && (
                <button
                    type="button"
                    role="switch"
                    aria-checked={isSubscribed}
                    aria-label="Anlık bildirimler"
                    disabled={loading || !userId}
                    onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
                    className={cn("w-12 h-7 shrink-0 rounded-full transition-all relative border border-card-border disabled:opacity-50", isSubscribed ? "bg-emerald-500 border-transparent" : "bg-foreground/10")}
                >
                    <span className={cn("absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all shadow", isSubscribed ? "left-[22px]" : "left-0.5")} />
                </button>
            )}
        </div>
    );
}

const NotificationsView = ({ user, setView }: ViewProps) => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
        <div className="space-y-4 pb-10 px-2">
            <div className="flex items-center gap-3 px-1">
                <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center"><BellRing className="w-4 h-4 text-accent" /></div>
                <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Bildirimler</h3>
            </div>
            <PushSubscriptionRow userId={user.id} />
            <p className="text-[12px] font-semibold text-secondary leading-relaxed px-1">
                Uygulama içi bildirimler (zil simgesi) her zaman gelir. Bu anahtar yalnızca bu cihaza gönderilen anlık bildirimleri yönetir.
            </p>
        </div>
        <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
    </motion.div>
);

const COLOR_FILTERS: { id: ColorBlindMode; label: string; desc: string }[] = [
    { id: 'none', label: 'Standart (YOK)', desc: 'Ekran renkleri varsayılan halindedir.' },
    { id: 'protanopia', label: 'Protanopi', desc: 'Kırmızı görme eksikliği için filtre.' },
    { id: 'deuteranopia', label: 'Döteranopi', desc: 'Yeşil görme eksikliği için filtre.' },
    { id: 'tritanopia', label: 'Tritanopi', desc: 'Mavi görme eksikliği için filtre.' },
];

const AccessibilityView = ({ setView }: Pick<ViewProps, 'setView'>) => {
    const {
        fontSize, setFontSize, colorBlindMode, setColorBlindMode,
        boldText, setBoldText, highContrast, setHighContrast,
        reduceMotion, setReduceMotion, reduceTransparency, setReduceTransparency,
        seniorMode, setSeniorMode,
    } = useTheme();
    return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar pr-1" style={{ maxHeight: 'calc(94vh - 180px)' }}>
        <div className="space-y-8 pb-10">
            {/* Tema */}
            <div className="px-2">
                <h3 className="text-[14px] font-black text-foreground mb-1">Tema</h3>
                <p className="text-[12px] font-semibold text-secondary mb-3">Sistem seçilirse telefonun açık/koyu ayarını izler.</p>
                <ThemePicker />
            </div>

            {/* Metin Boyutu Seksiyonu */}
            <div className="px-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <Type className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Ekran ve Metin Puntosu</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {(['small', 'medium', 'large'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFontSize(s)}
                            className={cn(
                                "py-6 rounded-[2.5rem] transition-all text-center flex flex-col items-center justify-center gap-3 border border-card-border overflow-hidden relative group",
                                fontSize === s
                                    ? "bg-foreground text-background shadow-2xl scale-105 z-10"
                                    : "bg-foreground/[0.03] text-secondary hover:bg-foreground/10"
                            )}
                        >
                            <span className={cn("font-black tracking-tighter italic leading-none", s === 'small' ? "text-[20px]" : s === 'medium' ? "text-[26px]" : "text-[34px]")}>Aa</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">{s === 'small' ? 'Minimal' : s === 'medium' ? 'Standart' : 'Maksimum'}</span>
                            {fontSize === s && <div className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-pulse" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Büyüklere Özel Kolay Mod */}
            <div className="px-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="text-[12px] font-black text-amber-500 uppercase tracking-[0.2em]">Büyüklere Özel Kolay Mod</h3>
                </div>
                <div className="bg-amber-500/5 rounded-[2.5rem] p-5 border-2 border-amber-500/30 mb-8">
                    <button onClick={() => setSeniorMode(!seniorMode)} className="flex items-center justify-between text-left w-full gap-4">
                        <div>
                            <p className="text-[14px] font-black text-amber-400 uppercase tracking-tight">Kolay Mod (Senior Mode)</p>
                            <p className="text-[10px] text-secondary mt-1.5 font-bold uppercase tracking-tighter">Daha büyük yazılar, basitleştirilmiş dev butonlar ve sesli Türkçe kılavuz ile uygulamayı en kolay şekilde kullanın.</p>
                        </div>
                        <div className={cn("w-14 h-7 rounded-full transition-all relative shrink-0 border border-amber-500/30", seniorMode ? "bg-amber-500 border-transparent shadow-lg shadow-amber-500/30" : "bg-foreground/5")}>
                            <div className={cn("absolute top-0.5 w-6 h-6 rounded-full bg-card transition-all shadow-md", seniorMode ? "left-7.5" : "left-0.5")} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Görsel Geliştirmeler */}
            <div className="px-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Görsel Geliştirmeler</h3>
                </div>
                <div className="space-y-1 bg-foreground/[0.02] rounded-[2.5rem] p-2 border border-card-border">
                    <button onClick={() => setBoldText(!boldText)} className="flex items-center justify-between py-4 px-4 hover:bg-foreground/[0.03] transition-all rounded-3xl border-b border-card-border last:border-0 grow text-left w-full">
                        <div>
                            <p className="text-[13px] font-black text-foreground uppercase tracking-tight">Kalın Metin</p>
                            <p className="text-[9.5px] text-secondary mt-1.5 font-bold uppercase tracking-tighter">Tüm yazıları daha belirgin hale getirir.</p>
                        </div>
                        <div className={cn("w-10 h-5.5 rounded-full transition-all relative shrink-0 border border-card-border", boldText ? "bg-emerald-500 border-transparent shadow-lg shadow-emerald-500/20" : "bg-foreground/5")}>
                            <div className={cn("absolute top-0.5 w-4.5 h-4.5 rounded-full bg-card transition-all shadow-moffi-card", boldText ? "left-5" : "left-0.5")} />
                        </div>
                    </button>
                    <button onClick={() => setHighContrast(!highContrast)} className="flex items-center justify-between py-4 px-4 hover:bg-foreground/[0.03] transition-all rounded-3xl border-b border-card-border last:border-0 grow text-left w-full">
                        <div>
                            <p className="text-[13px] font-black text-foreground uppercase tracking-tight">Kontrastı Artır</p>
                            <p className="text-[9.5px] text-secondary mt-1.5 font-bold uppercase tracking-tighter">Renkler ve çizgiler arası netliği artırır.</p>
                        </div>
                        <div className={cn("w-10 h-5.5 rounded-full transition-all relative shrink-0 border border-card-border", highContrast ? "bg-emerald-500 border-transparent shadow-lg shadow-emerald-500/20" : "bg-foreground/5")}>
                            <div className={cn("absolute top-0.5 w-4.5 h-4.5 rounded-full bg-card transition-all shadow-moffi-card", highContrast ? "left-5" : "left-0.5")} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Hareket ve Saydamlık */}
            <div className="px-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Hareket ve Saydamlık</h3>
                </div>
                <div className="space-y-1 bg-foreground/[0.02] rounded-[2.5rem] p-2 border border-card-border">
                    <button onClick={() => setReduceMotion(!reduceMotion)} className="flex items-center justify-between py-4 px-4 hover:bg-foreground/[0.03] transition-all rounded-3xl border-b border-card-border last:border-0 grow text-left w-full">
                        <div>
                            <p className="text-[13px] font-black text-foreground uppercase tracking-tight">Hareketi Azalt</p>
                            <p className="text-[9.5px] text-secondary mt-1.5 font-bold uppercase tracking-tighter">Göz yorgunluğu için animasyonları kısıtlar.</p>
                        </div>
                        <div className={cn("w-10 h-5.5 rounded-full transition-all relative shrink-0 border border-card-border", reduceMotion ? "bg-emerald-500 border-transparent shadow-lg shadow-emerald-500/20" : "bg-foreground/5")}>
                            <div className={cn("absolute top-0.5 w-4.5 h-4.5 rounded-full bg-card transition-all shadow-moffi-card", reduceMotion ? "left-5" : "left-0.5")} />
                        </div>
                    </button>
                    <button onClick={() => setReduceTransparency(!reduceTransparency)} className="flex items-center justify-between py-4 px-4 hover:bg-foreground/[0.03] transition-all rounded-3xl border-b border-card-border last:border-0 grow text-left w-full">
                        <div>
                            <p className="text-[13px] font-black text-foreground uppercase tracking-tight">Saydamlığı Azalt</p>
                            <p className="text-[9.5px] text-secondary mt-1.5 font-bold uppercase tracking-tighter">Blur efektlerini kaldırıp odaklanmayı artırır.</p>
                        </div>
                        <div className={cn("w-10 h-5.5 rounded-full transition-all relative shrink-0 border border-card-border", reduceTransparency ? "bg-emerald-500 border-transparent shadow-lg shadow-emerald-500/20" : "bg-foreground/5")}>
                            <div className={cn("absolute top-0.5 w-4.5 h-4.5 rounded-full bg-card transition-all shadow-moffi-card", reduceTransparency ? "left-5" : "left-0.5")} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Renk Körü Modu */}
            <div className="px-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <Glasses className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Renk Filtreleri</h3>
                </div>
                <div className="grid grid-cols-1 gap-2.5 px-0.5">
                    {COLOR_FILTERS.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setColorBlindMode(mode.id)}
                            className={cn(
                                "w-full p-5 rounded-[2.5rem] border text-left transition-all relative group overflow-hidden",
                                colorBlindMode === mode.id ? "bg-foreground text-background border-transparent shadow-2xl" : "bg-foreground/[0.03] border-card-border hover:bg-foreground/5"
                            )}
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <span className={cn("text-[13px] font-black uppercase tracking-widest", colorBlindMode === mode.id ? "text-background" : "text-foreground")}>{mode.label}</span>
                                    <p className={cn("text-[10px] mt-1.5 font-bold uppercase tracking-tighter", colorBlindMode === mode.id ? "text-background/50" : "text-secondary")}>{mode.desc}</p>
                                </div>
                                {colorBlindMode === mode.id && <Check className="w-5 h-5 text-background" />}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
        <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3 active:scale-95">
            <ArrowLeft className="w-4 h-4" /> Seçimleri Onayla ve Geri Dön
        </button>
    </motion.div>
    );
};

// Engellenenler gerçek engelleme tablosundan (Keşfet → gönderi/profil menüsü → "Bu hesabı engelle").
const BlockedUsersView = ({ setView }: Pick<ViewProps, 'setView'>) => {
    const [list, setList] = React.useState<PersonCard[] | null>(null);
    const load = React.useCallback(() => { socialService.blockedUsers().then(setList).catch(() => setList([])); }, []);
    React.useEffect(() => { load(); }, [load]);
    const unblock = async (id: string) => {
        try { await socialService.unblock(id); load(); }
        catch (e) { showToast(e instanceof Error ? e.message : 'Engel kaldırılamadı.', 'AlertCircle', 'text-red-500'); }
    };
    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
            <div className="px-2">
                <h3 className="text-[11px] font-black text-secondary uppercase tracking-[0.3em] mb-6 px-1 flex items-center gap-3">
                    <ShieldAlert className="w-4 h-4 text-red-500" /> Engellenenler
                </h3>
                <div className="space-y-3">
                    {list === null ? <p className="text-sm text-secondary px-1">Yükleniyor…</p> : list.map(acc => (
                        <div key={acc.id} className="flex items-center justify-between p-4 rounded-[2rem] bg-foreground/[0.03] border border-card-border">
                            <div className="flex items-center gap-4 min-w-0">
                                {acc.avatar ? <img src={acc.avatar} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-card-border" alt="" /> : <span className="w-12 h-12 rounded-2xl bg-foreground/10" />}
                                <p className="text-[13px] font-black text-foreground truncate">{acc.name}</p>
                            </div>
                            <button onClick={() => unblock(acc.id)} className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] font-black text-red-500 active:scale-95">Engeli kaldır</button>
                        </div>
                    ))}
                    {list && list.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center opacity-40">
                            <ShieldCheck className="w-12 h-12 mb-4" />
                            <p className="text-[12px] font-black">Engellediğin kimse yok</p>
                        </div>
                    )}
                </div>
            </div>
            <button onClick={() => setView('main')} className="mt-8 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
        </motion.div>
    );
};

const HiddenWordsView = ({ user, setView, updateSettings }: ViewProps) => {
    const [newWord, setNewWord] = useState('');
    const raw = user.settings?.content?.hiddenWords;
    const words = Array.isArray(raw) ? raw.filter((w): w is string => typeof w === 'string') : [];
    const add = () => {
        const w = newWord.trim();
        if (!w || words.some(x => x.toLocaleLowerCase('tr-TR') === w.toLocaleLowerCase('tr-TR'))) { setNewWord(''); return; }
        updateSettings('content', { hiddenWords: [...words, w] });
        setNewWord('');
    };
    const remove = (word: string) => updateSettings('content', { hiddenWords: words.filter(w => w !== word) });
    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
            <div className="space-y-4 px-2">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center"><Tag className="w-4 h-4 text-accent" /></div>
                    <div>
                        <h3 className="text-[14px] font-black text-foreground">Gizli kelimeler</h3>
                        <p className="text-[12px] font-semibold text-secondary">Gönderi ve yorumlarda sana *** olarak görünür.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input type="text" value={newWord} maxLength={40} onChange={(e) => setNewWord(e.target.value)} placeholder="Yeni kelime" className="flex-1 bg-foreground/[0.04] border border-card-border rounded-xl px-4 py-3 text-foreground text-[14px] outline-none focus:border-accent" onKeyDown={(e) => e.key === 'Enter' && add()} />
                    <button onClick={add} aria-label="Ekle" className="w-12 rounded-xl bg-accent flex items-center justify-center text-white active:scale-95 transition-all"><Plus className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {words.map(word => (
                        <span key={word} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-foreground/[0.05] border border-card-border rounded-lg">
                            <span className="text-[13px] font-bold text-foreground">{word}</span>
                            <button onClick={() => remove(word)} aria-label={`${word} kaldır`} className="text-secondary"><X className="w-3.5 h-3.5" /></button>
                        </span>
                    ))}
                    {words.length === 0 && <p className="text-[13px] text-secondary px-1">Henüz kelime eklemedin.</p>}
                </div>
            </div>
            <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
        </motion.div>
    );
};

const LoginActivityView = ({ setView }: Pick<ViewProps, 'setView'>) => {
    const { signOutOtherDevices } = useAuth();
    const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
    const run = async () => {
        if (!confirm('Bu cihaz dışındaki tüm cihazlarda oturumun kapatılsın mı?')) return;
        setState('busy');
        const res = await signOutOtherDevices();
        setState(res?.success ? 'done' : 'error');
    };
    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 px-2">
            <div className="space-y-4">
                <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2"><Smartphone className="w-4 h-4 text-accent" /> Oturumlar</h3>
                <p className="text-sm text-secondary leading-relaxed">
                    Hesabın başka bir cihazda açık kaldıysa ya da şüpheli bir giriş fark ettiysen, bu cihaz dışındaki tüm oturumları kapatabilirsin. O cihazlarda tekrar giriş yapmak gerekir.
                </p>
                <button onClick={run} disabled={state === 'busy'} className="w-full py-4 rounded-3xl bg-foreground text-background font-semibold text-sm disabled:opacity-50">
                    {state === 'busy' ? <Activity className="w-4 h-4 animate-spin mx-auto" /> : 'Diğer cihazlardan çıkış yap'}
                </button>
                {state === 'done' && <p className="text-sm text-emerald-600">Diğer cihazlardaki oturumlar kapatıldı.</p>}
                {state === 'error' && <p className="text-sm text-red-600">İşlem yapılamadı, tekrar dene.</p>}
            </div>
            <button onClick={() => setView('main')} className="mt-8 w-full py-4 rounded-3xl bg-foreground/[0.05] text-foreground font-semibold text-sm flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
        </motion.div>
    );
};

const PasswordChangeView = ({ setView }: Pick<ViewProps, 'setView'>) => {
    const { changePassword } = useAuth();
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!oldPass || !newPass) return;
        setError('');
        if (newPass.length < 8) { setError('Yeni şifre en az 8 karakter olmalı.'); return; }
        setLoading(true);
        const res = await changePassword(oldPass, newPass);
        setLoading(false);
        if (res?.success) {
            showToast('Şifren güncellendi, diğer cihazlardaki oturumlar kapatıldı.', 'CheckCircle2', 'text-emerald-500');
            setView('main');
        } else setError(res?.error || 'Şifre güncellenemedi.');
    };

    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1">
            <div className="space-y-6 px-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-orange-400" />
                    </div>
                    <h3 className="text-[13px] font-black text-foreground dark:text-white uppercase tracking-widest leading-none">Şifre Değiştir</h3>
                </div>

                <div className="space-y-4">
                    <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-4 border border-card-border">
                        <label className="text-[10px] font-black text-black/30 dark:text-white/20 uppercase tracking-widest block mb-2 px-1">Mevcut Şifre</label>
                        <input
                            type="password"
                            value={oldPass}
                            onChange={e => setOldPass(e.target.value)}
                            className="w-full bg-transparent text-sm font-bold text-foreground dark:text-white outline-none px-1"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-4 border border-card-border">
                        <label className="text-[10px] font-black text-black/30 dark:text-white/20 uppercase tracking-widest block mb-2 px-1">Yeni Şifre</label>
                        <input
                            type="password"
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            className="w-full bg-transparent text-sm font-bold text-foreground dark:text-white outline-none px-1"
                            placeholder="••••••••"
                        />
                    </div>
                    <p className="text-[10px] text-black/30 dark:text-white/20 font-medium leading-relaxed px-4">
                        Şifren en az 8 karakter olmalı. Kaydedince diğer cihazlardaki oturumların kapanır.
                    </p>
                    {error && <p className="text-sm text-red-600 px-4">{error}</p>}
                </div>

                <button
                    disabled={loading || !oldPass || !newPass}
                    onClick={handleSave}
                    className="w-full py-4 rounded-3xl bg-card text-black font-black text-[13.5px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 mt-4 shadow-xl shadow-white/5"
                >
                    {loading ? <Activity className="w-4 h-4 animate-spin mx-auto" /> : 'Şifreyi Güncelle'}
                </button>
            </div>
            <button onClick={() => setView('main')} className="mt-8 w-full py-4 rounded-3xl bg-white/[0.05] text-black/50 dark:text-white/40 font-black text-[12px] uppercase tracking-widest hover:bg-black/10 dark:bg-white/10 transition-all flex items-center justify-center gap-2"><ArrowLeft className="w-3 h-3" /> Vazgeç ve Geri Dön</button>
        </motion.div>
    );
};

// --- Main Drawer Component ---
export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
    const { user, updateSettings } = useAuth();
    const [view, setView] = useState<DrawerView>('main');

    if (!user) return null;
    const viewProps: ViewProps = { user, setView, updateSettings };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
                    />
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 180 }}
                        className="fixed inset-x-0 bottom-0 h-[94%] bg-background/85 backdrop-blur-2xl z-[9999] rounded-t-[3.5rem] p-3 flex flex-col shadow-2xl border-t border-card-border overflow-hidden transform-gpu will-change-transform"
                    >
                        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-8 cursor-pointer" onClick={onClose} />

                        <div className="flex items-center justify-between mb-8 px-4">
                            <div className="flex items-center gap-3">
                                {view !== 'main' && (
                                    <button
                                        onClick={() => setView('main')}
                                        aria-label="Geri"
                                        className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center hover:bg-foreground/10 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 text-foreground" />
                                    </button>
                                )}
                                <h1 className="text-[29px] font-black text-foreground italic tracking-tighter uppercase leading-none">Ayarlar</h1>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Kapat"
                                className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground/10 transition-colors border border-card-border"
                            >
                                <X className="w-5 h-5 text-foreground" />
                            </button>
                        </div>

                        <div className="flex-1 relative">
                            <AnimatePresence mode="wait">
                                {view === 'main' ? (
                                    <MainView key="main" {...viewProps} onClose={onClose} />
                                ) : view === 'activity' ? (
                                    <LoginActivityView key="activity" setView={setView} />
                                ) : view === 'blocked' ? (
                                    <BlockedUsersView key="blocked" setView={setView} />
                                ) : view === 'words' ? (
                                    <HiddenWordsView key="words" {...viewProps} />
                                ) : view === 'password' ? (
                                    <PasswordChangeView key="password" setView={setView} />
                                ) : view === 'notifications' ? (
                                    <NotificationsView key="notifications" {...viewProps} />
                                ) : view === 'sidebar_config' ? (
                                    <SidebarConfigView key="sidebar" {...viewProps} />
                                ) : view === 'ai_assistant' ? (
                                    <AIAssistantView key="ai" {...viewProps} />
                                ) : view === 'account_settings' ? (
                                    <AccountSettingsView key="account" {...viewProps} />
                                ) : view === 'profile_personalization' ? (
                                    <ProfilePersonalizationView key="personalization" {...viewProps} />
                                ) : (
                                    <AccessibilityView key="accessibility" setView={setView} />
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Kenar paneli kısayolları: panelin kendi "Düzenle" ekranıyla aynı katalog ve aynı ayar (settings.edge).
const SidebarConfigView = ({ user, setView, updateSettings }: ViewProps) => {
    const edge = readEdgeSettings(user.settings?.edge);
    const toggle = (id: EdgeShortcutId) => {
        const on = edge.shortcuts.includes(id);
        if (on && edge.shortcuts.length <= MIN_EDGE_SHORTCUTS) return;
        if (!on && edge.shortcuts.length >= MAX_EDGE_SHORTCUTS) return;
        updateSettings('edge', { activeActions: on ? edge.shortcuts.filter(x => x !== id) : [...edge.shortcuts, id] });
    };

    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
            <div className="space-y-5 pb-10 px-2">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center"><Layers className="w-4 h-4 text-accent" /></div>
                    <div>
                        <h3 className="text-[14px] font-black text-foreground">Kenar paneli</h3>
                        <p className="text-[12px] font-semibold text-secondary">{edge.shortcuts.length}/{MAX_EDGE_SHORTCUTS} kısayol · ekran kenarındaki ince çubuktan açılır</p>
                    </div>
                </div>
                <div className="rounded-[1.5rem] bg-foreground/[0.02] border border-card-border divide-y divide-card-border overflow-hidden">
                    {EDGE_SHORTCUTS.filter(s => s.id !== 'business').map(s => {
                        const on = edge.shortcuts.includes(s.id);
                        return (
                            <button key={s.id} type="button" onClick={() => toggle(s.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.color }}>
                                    <s.Icon className="w-[18px] h-[18px] text-white" />
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-[14px] font-black text-foreground">{s.label}</span>
                                    <span className="block text-[12px] font-semibold text-secondary truncate">{s.desc}</span>
                                </span>
                                <span className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0", on ? "bg-accent border-accent" : "border-card-border")}>
                                    {on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.2} />}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
            <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
        </motion.div>
    );
};

// --- Moffi AI tercihleri ---
// Yalnızca sunucunun gerçekten uyguladığı iki tercih (api/ai/chat): konuşma tonu ve yanıt uzunluğu.
const AIAssistantView = ({ user, setView, updateSettings }: ViewProps) => {
    const ai = (user.settings?.ai || {}) as { personality?: string; detailLevel?: string };
    const personality = ai.personality === 'casual' ? 'friendly' : ai.personality === 'technical' ? 'professional' : ai.personality || 'friendly';
    const detailLevel = ai.detailLevel || 'medium';
    const Option = ({ active, label, desc, onClick }: { active: boolean; label: string; desc: string; onClick: () => void }) => (
        <button
            type="button"
            onClick={onClick}
            className={cn("w-full p-4 rounded-[1.5rem] border text-left transition-all flex items-center justify-between gap-3", active ? "bg-accent/10 border-accent/40" : "bg-foreground/[0.03] border-card-border")}
        >
            <span>
                <span className="block text-[14px] font-black text-foreground">{label}</span>
                <span className="block text-[12px] font-semibold text-secondary mt-0.5">{desc}</span>
            </span>
            {active && <Check className="w-5 h-5 text-accent shrink-0" />}
        </button>
    );

    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
            <div className="space-y-7 pb-10 px-2">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center"><BrainCircuit className="w-4 h-4 text-accent" /></div>
                    <div>
                        <h3 className="text-[14px] font-black text-foreground">Moffi AI</h3>
                        <p className="text-[12px] font-semibold text-secondary">Alt menünün ortasındaki düğmeden açılır.</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[12px] font-black text-secondary px-1">Konuşma tonu</p>
                    {[
                        { id: 'friendly', label: 'Samimi', desc: 'Sıcak ve cesaret verici bir dil.' },
                        { id: 'professional', label: 'Net', desc: 'Sakin, kısa ve bilgiye dayalı.' },
                        { id: 'protective', label: 'Koruyucu', desc: 'Sağlık risklerini daha açık belirtir.' },
                    ].map(p => <Option key={p.id} active={personality === p.id} label={p.label} desc={p.desc} onClick={() => updateSettings('ai', { personality: p.id })} />)}
                </div>

                <div className="space-y-2">
                    <p className="text-[12px] font-black text-secondary px-1">Yanıt uzunluğu</p>
                    {[
                        { id: 'short', label: 'Kısa', desc: 'Birkaç cümle ya da madde.' },
                        { id: 'medium', label: 'Dengeli', desc: 'Gerektiği kadar açıklama.' },
                        { id: 'long', label: 'Ayrıntılı', desc: 'Adım adım ve kapsamlı.' },
                    ].map(d => <Option key={d.id} active={detailLevel === d.id} label={d.label} desc={d.desc} onClick={() => updateSettings('ai', { detailLevel: d.id })} />)}
                </div>

                <p className="text-[12px] font-semibold text-secondary leading-relaxed px-1">
                    Moffi AI seçtiğin hayvanın kimlik bilgilerini, sağlık kaydının özetini ve yürüyüşlerini kullanır. Sohbet geçmişi yalnızca bu cihazda tutulur.
                </p>
            </div>
            <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
        </motion.div>
    );
};

// --- Hesap bilgileri ---
// Telefon, doğum tarihi ve cinsiyet profiles tablosuna yazılır (başkalarına profile_cards'ta görünmez, 8.46).
// Hesap silme gerçek 30 günlük süreçtir (DeleteAccountButton, 8.57). Eski "Meta hesap merkezi", sahte bağlı hesaplar,
// yalnızca yerel veriyi silen "kalıcı sil" ve hiçbir yerde geri açılmayan "dondur" kaldırıldı.
type AccountForm = { phone: string; birthDate: string; gender: string };
const GENDERS = ['Kadın', 'Erkek', 'Diğer'];

const AccountSettingsView = ({ user, setView }: ViewProps) => {
    const [form, setForm] = useState<AccountForm | null>(null);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    React.useEffect(() => {
        let alive = true;
        apiService.getUserProfile(user.id)
            .then(p => { if (alive) setForm({ phone: p?.phone || '', birthDate: p?.birth_date || '', gender: p?.gender || '' }); })
            .catch(() => { if (alive) setForm({ phone: '', birthDate: '', gender: '' }); });
        return () => { alive = false; };
    }, [user.id]);

    const set = (patch: Partial<AccountForm>) => { setForm(f => (f ? { ...f, ...patch } : f)); setStatus('idle'); };

    const save = async () => {
        if (!form) return;
        setStatus('saving');
        try {
            await apiService.updateProfile({ phone: form.phone.trim() || null, birth_date: form.birthDate || null, gender: form.gender || null });
            setStatus('saved');
        } catch (err) {
            console.error('Hesap bilgileri kaydedilemedi:', err);
            setStatus('error');
        }
    };

    const today = new Date().toISOString().slice(0, 10);
    const genderOptions = form?.gender && !GENDERS.includes(form.gender) ? [...GENDERS, form.gender] : GENDERS;
    const input = "w-full bg-background border border-card-border rounded-xl px-4 py-3 text-[14px] font-semibold text-foreground outline-none focus:border-accent transition-all";
    const label = "text-[12px] font-black text-secondary block mb-1.5";

    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
            <div className="space-y-6 pb-10 px-2">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center"><User className="w-4 h-4 text-accent" /></div>
                    <div>
                        <h3 className="text-[14px] font-black text-foreground">Hesap bilgileri</h3>
                        <p className="text-[12px] font-semibold text-secondary">Telefonun yalnızca sana ve randevu aldığın işletmeye görünür.</p>
                    </div>
                </div>

                <div className="space-y-4 bg-foreground/[0.02] rounded-[2rem] p-5 border border-card-border">
                    <div>
                        <span className={label}>E-posta</span>
                        <p className="px-1 text-[14px] font-semibold text-foreground break-all">{user.email}</p>
                    </div>
                    {!form ? (
                        <p className="text-[13px] text-secondary px-1">Yükleniyor…</p>
                    ) : (
                        <>
                            <label className="block">
                                <span className={label}>Telefon</span>
                                <input type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={form.phone} onChange={e => set({ phone: e.target.value })} placeholder="05xx xxx xx xx" className={input} />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className={label}>Doğum tarihi</span>
                                    <input type="date" max={today} value={form.birthDate} onChange={e => set({ birthDate: e.target.value })} className={input} />
                                </label>
                                <label className="block">
                                    <span className={label}>Cinsiyet</span>
                                    <select value={form.gender} onChange={e => set({ gender: e.target.value })} className={cn(input, "appearance-none")}>
                                        <option value="">Belirtme</option>
                                        {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </label>
                            </div>
                            {status === 'saved' && <p className="text-[13px] font-bold text-emerald-600 px-1">Kaydedildi.</p>}
                            {status === 'error' && <p className="text-[13px] font-bold text-red-600 px-1">Kaydedilemedi, tekrar dene.</p>}
                            <button onClick={save} disabled={status === 'saving'} className="w-full py-3.5 rounded-xl bg-foreground text-background font-black text-[13px] hover:opacity-90 transition-opacity disabled:opacity-50">
                                {status === 'saving' ? 'Kaydediliyor…' : 'Kaydet'}
                            </button>
                        </>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-[12px] font-black text-red-500 px-1">Hesabı silme</p>
                    <div className="bg-red-500/5 rounded-[2rem] p-2 border border-red-500/10">
                        <DeleteAccountButton />
                    </div>
                </div>
            </div>
            <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
        </motion.div>
    );
};
