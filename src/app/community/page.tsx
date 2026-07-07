'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { usePet } from '@/context/PetContext';
import { useQuestEngine } from '@/context/QuestEngineContext';
import { PetSettingsModal } from '@/components/profile/PetSettingsModal';
import { AddPetModal } from '@/components/community/modals/AddPetModal';
import { CareHubModal } from '@/components/community/modals/CareHubModal';
import { apiService } from '@/services/apiService';
import { 
    Bell, 
    Search, 
    MessageCircle, 
    User, 
    Home, 
    Plus, 
    MapPin, 
    Calendar, 
    Syringe, 
    AlertTriangle,
    Heart,
    HeartHandshake,
    Stethoscope,
    ShoppingBag,
    Scissors,
    CalendarDays,
    Sparkles,
    ChevronRight,
    Bone,
    Users,
    Play,
    Navigation,
    Flame,
    Droplets,
    Activity,
    Compass,
    Radio,
    Battery,
    Volume2,
    Wifi,
    Coins,
    QrCode,
    Shirt,
    ArrowUpRight,
    TrendingUp,
    CheckCircle2,
    ShoppingBag as CartIcon,
    X,
    Shield,
    TrendingDown,
    Sliders,
    VolumeX,
    Maximize2,
    RefreshCw,
    ChevronLeft,
    CreditCard,
    Zap,
    Fingerprint,
    Lock,
    Award,
    Coffee,
    Info,
    Crown,
    Trophy,
    SunMoon,
    Sun,
    Moon,
    Clock
} from 'lucide-react';

import { useStories } from '../../hooks/useStories';
import { useWalk } from '../../hooks/useWalk';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { QuestBentoCard } from '@/components/quests/QuestBentoCard';
import { cn } from '@/lib/utils';
import Mascot3DCanvas from '@/components/dressing/Mascot3DCanvas';
import { useDragScroll } from '@/hooks/useDragScroll';



const cleanDefaultTemplate = {
    name: 'Moffi',
    image: '',
    breed: 'Bilinmeyen Cins',
    health: 'İyi',
    activity: '0%',
    weight: '0 kg',
    ringProgress: { activity: 0, water: 0, food: 0 },
    status: 'GÜVENDE',
    statusColor: 'text-green-600 bg-green-100 border-green-200',
    streak: 0,
    weeklyData: [0, 0, 0, 0, 0, 0, 0],
    collar: {
        connected: false,
        battery: 0,
        signal: 'Bağlantı Yok',
        lastSync: 'Hiçbir zaman',
        rssi: 'Bağlantı Yok',
        firmware: 'v1.0.0-Moffi'
    },
    wallet: {
        patipuan: '0',
        currency: 'PATI',
        cardNumber: '•••• •••• •••• 0000',
        transactions: []
    },
    passport: {
        idCode: 'MF-000-NEW',
        nfcStatus: 'NFC Yok',
        qrcode: '',
        vaccines: []
    },
    dressing: {
        activeOutfit: 'Standart Kıyafet 👕',
        stylePoints: 0,
        avatarMock: ''
    },
    quests: [
        { id: 1, text: 'Sabah Yürüyüşü Tamamla', done: false },
        { id: 2, text: 'Günlük Su İhtiyacını Karşıla', done: false },
        { id: 3, text: 'Bugünkü Beslenme Öğünlerini Bitir', done: false }
    ],
    specialOffer: {
        title: 'Özel Fırsat 🎁',
        desc: 'Evcil hayvanınız için en kaliteli besinler ve ürünler Moffi Market\'te!',
        oldPrice: '1.200 TL',
        newPrice: '960 TL',
        discount: '%20 İNDİRİM'
    }
};

// Story Circle
const StoryCircle = ({ image, title, type = 'normal', delay = 0 }: { image: string, title: string, type?: 'normal' | 'add' | 'sos' | 'ai' | 'featured', delay?: number }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.5, type: 'spring' }}
        className="flex flex-col items-center gap-1.5 shrink-0"
    >
        <div className="relative cursor-pointer group">
            <div className={`w-16 h-16 rounded-full p-[2px] ${
                type === 'add' ? 'bg-gray-200' :
                type === 'sos' ? 'bg-red-500' :
                type === 'ai' ? 'bg-purple-400' :
                type === 'featured' ? 'bg-gradient-to-tr from-yellow-400 to-amber-500 shadow-sm' :
                'bg-green-600'
            }`}>
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                    <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt={title} />
                </div>
            </div>
            {type === 'add' && (
                <div className="absolute -bottom-1 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                    <Plus className="w-3.5 h-3.5 text-gray-800" />
                </div>
            )}
            {type === 'sos' && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm border border-white text-white animate-pulse">
                    <span className="text-[10px] font-black">!</span>
                </div>
            )}
            {type === 'ai' && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-sm border border-white text-white">
                    <Sparkles className="w-3 h-3" />
                </div>
            )}
        </div>
        <span className="text-[9.5px] font-bold text-gray-700 tracking-tight truncate max-w-[72px] text-center mt-0.5">{title}</span>
    </motion.div>
);

const BentoCard = ({ children, className = "", delay = 0, onClick, layoutId }: { children: React.ReactNode, className?: string, delay?: number, onClick?: () => void, layoutId?: string }) => (
    <motion.div 
        layoutId={layoutId}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6 }}
        className={`rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 ${className}`}
    >
        {children}
    </motion.div>
);

const QuickAccessBtn = ({ 
    icon: Icon, 
    title, 
    subtitle,
    color, 
    delay = 0, 
    onClick 
}: { 
    icon: any, 
    title: string, 
    subtitle: string,
    color: string, 
    delay?: number, 
    onClick?: () => void 
}) => (
    <motion.button 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.4 }}
        whileHover={{ scale: 1.03, y: -1.5 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className="flex items-center gap-3.5 p-3.5 rounded-[22px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.015),0_1px_2px_rgba(0,0,0,0.01)] border border-gray-100/80 transition-all duration-300 cursor-pointer group w-full text-left"
    >
        <div className="w-10 h-10 rounded-2xl bg-gray-50/50 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 shrink-0">
            <Icon className={`w-5.5 h-5.5 ${color} drop-shadow-[0_1px_2px_rgba(0,0,0,0.04)]`} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col">
            <span className="text-[12px] font-black text-gray-800 tracking-tight leading-tight">{title}</span>
            <span className="text-[9px] text-gray-400 font-semibold mt-0.5 leading-none">{subtitle}</span>
        </div>
    </motion.button>
);

const APPAREL_ITEMS = {
    body: [
        { id: 'sweatshirt', label: 'Sweatshirt 🧡', icon: '🧥', cost: 0, sp: 80, desc: 'Turuncu Sweatshirt' },
        { id: 'singlet', label: 'Spor Atlet 🎽', icon: '🎽', cost: 0, sp: 60, desc: 'Hafif ve Esnek' },
        { id: 'pajamas', label: 'Pijama 💤', icon: '👕', cost: 0, sp: 70, desc: 'Yeşil Çizgili' },
        { id: null, label: 'Doğal Hali 🐾', icon: '❌', cost: 0, sp: 0, desc: 'Kıyafetsiz' }
    ],
    head: [
        { id: 'beanie', label: 'Örme Bere 🧶', icon: '🧶', cost: 0, sp: 50, desc: 'Mavi Bere' },
        { id: 'top_hat', label: 'Şapka 🎩', icon: '🎩', cost: 150, sp: 120, desc: 'Retro Silindir' },
        { id: 'crown', label: 'Altın Taç 👑', icon: '👑', cost: 350, sp: 200, desc: 'Premium Taç' },
        { id: 'pirate_hat', label: 'Korsan 🏴‍☠️', icon: '🏴‍☠️', cost: 200, sp: 140, desc: 'Kaptan Şapkası' },
        { id: null, label: 'Şapkasız 👤', icon: '❌', cost: 0, sp: 0, desc: 'Şapkayı Çıkar' }
    ],
    eyes: [
        { id: 'glasses', label: 'Gözlük 🤓', icon: '🤓', cost: 0, sp: 30, desc: 'Optik Gözlük' },
        { id: 'sunglasses', label: 'Güneş Göz. 😎', icon: '😎', cost: 0, sp: 50, desc: 'Havalı Gözlük' },
        { id: 'eyepatch', label: 'Göz Bandı 👁️', icon: '👁️', cost: 150, sp: 110, desc: 'Korsan Bandı' },
        { id: null, label: 'Gözlüksüz 👁️', icon: '❌', cost: 0, sp: 0, desc: 'Gözlüğü Çıkar' }
    ],
    hands: [
        { id: 'gloves', label: 'Eldiven 🧤', icon: '🧤', cost: 0, sp: 40, desc: 'Yeşil Kışlık' },
        { id: 'boxing', label: 'Boks Eld. 🥊', icon: '🥊', cost: 150, sp: 90, desc: 'Kırmızı Boks' },
        { id: null, label: 'Eldivensiz 🐾', icon: '❌', cost: 0, sp: 0, desc: 'Eldiveni Çıkar' }
    ],
    feet: [
        { id: 'sneakers', label: 'Spor Ayak. 👟', icon: '👟', cost: 0, sp: 50, desc: 'Sarı Ayakkabı' },
        { id: 'boots', label: 'Kışlık Bot 🥾', icon: '🥾', cost: 120, sp: 80, desc: 'Kahverengi Bot' },
        { id: null, label: 'Yalın Ayak 🐾', icon: '❌', cost: 0, sp: 0, desc: 'Ayakkabıyı Çıkar' }
    ]
};

// ─── Profesyonel Kullanıcı Avatar Bileşeni ─────────────────────────────────
// Foto varsa gösterir, yoksa isimden deterministik renkli baş harf avatarı
const USER_AVATAR_COLORS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-sky-600',
    'from-[#527958] to-emerald-600',
];

function getAvatarColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    return USER_AVATAR_COLORS[Math.abs(hash) % USER_AVATAR_COLORS.length];
}

function getInitials(name?: string, username?: string, email?: string): string {
    const source = name || username || email || '';
    const parts = source.split(/[\s@_.-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return source.charAt(0).toUpperCase() || 'M';
}

function UserAvatar({ 
    avatar, 
    name, 
    username, 
    email, 
    size = 'sm',
    className = ''
}: { 
    avatar?: string | null; 
    name?: string; 
    username?: string; 
    email?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const seed = username || name || email || 'moffi';
    const colorClass = getAvatarColor(seed);
    const initials = getInitials(name, username, email);
    const textSize = size === 'sm' ? 'text-[11px]' : size === 'md' ? 'text-sm' : 'text-xl';

    // Mock/placeholder URL'leri reddet — başharf avatarı tercih et
    const PLACEHOLDER_DOMAINS = ['pravatar.cc', 'dicebear.com', 'ui-avatars.com', 'robohash.org'];
    const isPlaceholder = avatar && PLACEHOLDER_DOMAINS.some(d => avatar.includes(d));

    if (avatar && !isPlaceholder) {
        return (
            <img 
                src={avatar} 
                className={`w-full h-full object-cover ${className}`}
                alt="Profil"
                onError={(e) => {
                    // Foto yüklenemezse baş harf göster
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                        e.currentTarget.style.display = 'none';
                        const div = document.createElement('div');
                        div.className = `w-full h-full bg-gradient-to-tr ${colorClass} flex items-center justify-center text-white ${textSize} font-black`;
                        div.textContent = initials;
                        parent.appendChild(div);
                    }
                }}
            />
        );
    }
    return (
        <div className={`w-full h-full bg-gradient-to-tr ${colorClass} flex items-center justify-center text-white ${textSize} font-black select-none ${className}`}>
            {initials}
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────────

// Tema Toggle Butonu — community header'ında kullanılır (Sade, çerçevesiz ve klas tasarım)
function ThemeToggleButton() {
    const { theme, setTheme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-amber-500 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={isDark ? 'Gündüz moduna geç' : 'Gece moduna geç'}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={isDark ? 'dark' : 'light'}
                    initial={{ y: 5, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -5, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center"
                >
                    {isDark ? (
                        <Sun className="w-5 h-5" />
                    ) : (
                        <Moon className="w-5 h-5" />
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
}

export default function LegendaryLightDashboard() {
    const router = useRouter();
    const communityCardScroll = useDragScroll();
    const storiesScroll = useDragScroll();
    const petSwitcherScroll = useDragScroll();
    const searchParams = useSearchParams();
    const { user: authUser, updateProfile } = useAuth();
    const { pets: userPets, activePet: globalActivePet, switchPet, updatePet, addPet, deletePet, isLoading: isPetLoading, isInitialized } = usePet();
    const { activeSession, history: walkHistory, stats: walkStats, isLoading: isWalkLoading, startWalk, endWalk } = useWalk();
    const { currentStreak, weeklyStamps } = useQuestEngine();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Dynamic 3D Parallax Tilt & Specular Shine Motion Values
    const tiltX = useMotionValue(200);
    const tiltY = useMotionValue(200);
    const rotateX = useTransform(tiltY, [0, 400], [5, -5]);
    const rotateY = useTransform(tiltX, [0, 400], [-5, 5]);
    
    const shineX = useTransform(tiltX, [0, 400], ['0%', '100%']);
    const shineY = useTransform(tiltY, [0, 400], ['0%', '100%']);

    const handleMouseMoveCard = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        tiltX.set((mouseX / rect.width) * 400);
        tiltY.set((mouseY / rect.height) * 400);
    };

    const handleMouseLeaveCard = () => {
        tiltX.set(200);
        tiltY.set(200);
    };

    const todayIdx = useMemo(() => {
        const day = new Date().getDay();
        return day === 0 ? 6 : day - 1; // Mon=0, Tue=1, ... Sun=6
    }, []);

    // Kullanıcının aktif peti: önce globalActivePet, sonra ilk pet, son olarak null
    const activePetObj = globalActivePet || userPets[0] || null;

    const hasNoPets = !isPetLoading && userPets.length === 0;

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const walkedDistanceToday = useMemo(() => {
        const historyToday = walkHistory
            .filter(w => w.created_at && w.created_at.startsWith(todayStr))
            .reduce((sum, w) => sum + (w.distance_meters || 0), 0);
        const activeMeters = activeSession ? (activeSession.distance_meters || 0) : 0;
        return (historyToday + activeMeters) / 1000; // in km
    }, [activeSession, walkHistory, todayStr]);

    const targetActivityKm = useMemo(() => {
        const target = typeof activePetObj?.activity_target === 'number' 
            ? activePetObj.activity_target 
            : (activePetObj?.sos_settings?.activity_target ?? 70); // default target 70
        return target > 0 ? (target / 20) : 3.5;
    }, [activePetObj?.activity_target, activePetObj?.sos_settings?.activity_target]);

    const activityPercent = useMemo(() => {
        return targetActivityKm > 0 ? Math.min(100, Math.round((walkedDistanceToday / targetActivityKm) * 100)) : 0;
    }, [walkedDistanceToday, targetActivityKm]);

    // PREMIUM DIJITAL GARDROP STATE YAPISI & COIN ENTEGRASYONU


    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [isCareHubOpen, setIsCareHubOpen] = useState(false);
    const [activeCareHubTab, setActiveCareHubTab] = useState<'nutrition' | 'health' | 'vet'>('nutrition');
    const [walletBalance, setWalletBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [vaccines, setVaccines] = useState<any[]>([]);

    const [goalsTrigger, setGoalsTrigger] = useState(0);

    useEffect(() => {
        const handleGoalsUpdate = () => {
            setGoalsTrigger(prev => prev + 1);
        };
        const handleOpenCareHub = (e: any) => {
            const tab = e.detail?.tab || 'nutrition';
            setActiveCareHubTab(tab);
            setIsCareHubOpen(true);
        };
        window.addEventListener('moffi-daily-goals-update', handleGoalsUpdate);
        window.addEventListener('open-care-hub', handleOpenCareHub);
        return () => {
            window.removeEventListener('moffi-daily-goals-update', handleGoalsUpdate);
            window.removeEventListener('open-care-hub', handleOpenCareHub);
        };
    }, []);

    useEffect(() => {
        if (searchParams.get('openWalk') === 'true') {
            window.dispatchEvent(new CustomEvent('open-walk-panel'));
        }
    }, [searchParams]);

    const waterCurrent = useMemo(() => {
        if (!activePetObj?.id) return 0;
        return Number(localStorage.getItem(`moffi_water_${activePetObj.id}_${todayStr}`) || '0');
    }, [activePetObj?.id, todayStr, goalsTrigger]);

    const waterTarget = useMemo(() => {
        if (!activePetObj?.id) return 1200;
        return typeof activePetObj?.water_target === 'number'
            ? activePetObj.water_target
            : (activePetObj?.sos_settings?.water_target ?? 1200);
    }, [activePetObj?.water_target, activePetObj?.sos_settings?.water_target, activePetObj?.id]);

    const waterPercent = useMemo(() => {
        return waterTarget > 0 ? Math.min(100, Math.round((waterCurrent / waterTarget) * 100)) : 0;
    }, [waterCurrent, waterTarget]);

    const foodCurrent = useMemo(() => {
        if (!activePetObj?.id) return 0;
        return Number(localStorage.getItem(`moffi_calories_${activePetObj.id}_${todayStr}`) || '0');
    }, [activePetObj?.id, todayStr, goalsTrigger]);

    const foodTarget = useMemo(() => {
        if (!activePetObj?.id) return 1600;
        return typeof activePetObj?.food_target === 'number'
            ? activePetObj.food_target
            : (activePetObj?.sos_settings?.food_target ?? 1600);
    }, [activePetObj?.food_target, activePetObj?.sos_settings?.food_target, activePetObj?.id]);

    const foodPercent = useMemo(() => {
        return foodTarget > 0 ? Math.min(100, Math.round((foodCurrent / foodTarget) * 100)) : 0;
    }, [foodCurrent, foodTarget]);


    useEffect(() => {
        if (!activePetObj?.id) return;
        
        // 1. Balance
        const savedCoins = localStorage.getItem(`moffi_coins_${activePetObj.id}`);
        if (savedCoins !== null) {
            setWalletBalance(Number(savedCoins));
        } else {
            setWalletBalance(0);
            localStorage.setItem(`moffi_coins_${activePetObj.id}`, '0');
        }

        // 2. Transactions
        const savedTx = localStorage.getItem(`moffi_transactions_${activePetObj.id}`);
        if (savedTx) {
            setTransactions(JSON.parse(savedTx));
        } else {
            setTransactions([]);
            localStorage.setItem(`moffi_transactions_${activePetObj.id}`, JSON.stringify([]));
        }

        // 3. Vaccines
        const savedVaccines = localStorage.getItem(`moffi_vaccines_${activePetObj.id}`);
        if (savedVaccines) {
            setVaccines(JSON.parse(savedVaccines));
        } else {
            setVaccines([]);
            localStorage.setItem(`moffi_vaccines_${activePetObj.id}`, JSON.stringify([]));
        }
    }, [activePetObj?.id, goalsTrigger]);

    // Save balance on changes
    useEffect(() => {
        if (activePetObj?.id) {
            localStorage.setItem(`moffi_coins_${activePetObj.id}`, String(walletBalance));
        }
    }, [walletBalance, activePetObj?.id]);

    const addTransaction = useCallback((type: 'gelir' | 'gider', title: string, amount: number) => {
        if (!activePetObj?.id) return;
        const newTx = {
            id: Date.now(),
            type,
            title,
            amount: `${type === 'gelir' ? '+' : '-'}${amount} PATI`,
            date: 'Şimdi'
        };
        setTransactions(prev => {
            const next = [newTx, ...prev];
            localStorage.setItem(`moffi_transactions_${activePetObj.id}`, JSON.stringify(next));
            return next;
        });
    }, [activePetObj?.id]);

    const [expandedPanel, setExpandedPanel] = useState<'wallet' | 'passport' | 'collar' | 'dressing' | 'quests' | 'shop' | 'profile' | 'events' | null>(null);
    const [isNfcScanning, setIsNfcScanning] = useState(false);

    const handleNfcScan = () => {
        setExpandedPanel(null); // Profile çekmecesini kapat
        setIsNfcScanning(true);
        setTimeout(() => {
            setIsNfcScanning(false);
            setExpandedPanel('passport');
        }, 1500);
    };
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>(['glasses', 'scarf']);
    const [unlockedAccessories, setUnlockedAccessories] = useState<string[]>(['glasses', 'scarf']);
    const [selectedApparel, setSelectedApparel] = useState<{
        body: 'sweatshirt' | 'singlet' | 'pajamas' | null;
        head: 'crown' | 'pirate_hat' | 'top_hat' | 'beanie' | null;
        eyes: 'sunglasses' | 'glasses' | 'eyepatch' | null;
        hands: 'gloves' | 'boxing' | null;
        feet: 'sneakers' | 'boots' | null;
    }>({
        body: 'sweatshirt',
        head: null,
        eyes: 'glasses',
        hands: null,
        feet: null
    });
    const [unlockedApparel, setUnlockedApparel] = useState<string[]>([
        'sweatshirt', 'singlet', 'pajamas',
        'beanie',
        'glasses', 'sunglasses',
        'gloves',
        'sneakers'
    ]);
    const [activeApparelTab, setActiveApparelTab] = useState<'body' | 'head' | 'eyes' | 'hands' | 'feet'>('body');
    const [activeOutfitName, setActiveOutfitName] = useState('Havalı Gözlük 😎 & Kırmızı Boyunluk 🧣');
    const [stylePoints, setStylePoints] = useState(120);

    // TALKING TOM STYLE DRESSING GAME STATES
    const [dressingStep, setDressingStep] = useState<'clean' | 'dry' | 'accessorize' | 'photo' | 'completed'>('accessorize');
    const [cleanProgress, setCleanProgress] = useState(0);
    const [dryProgress, setDryProgress] = useState(0);
    const [activeStudioBg, setActiveStudioBg] = useState<'stage' | 'cyber' | 'park' | 'space'>('stage');
    const [isBlinking, setIsBlinking] = useState(false);
    const [isFlashActive, setIsFlashActive] = useState(false);
    const [isShowerActive, setIsShowerActive] = useState(false);
    const [isDryerActive, setIsDryerActive] = useState(false);
    const [activeTool, setActiveTool] = useState<'styling' | 'comb' | 'scissors' | 'grow' | 'walk'>('styling');

    const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number, emoji: string }>>([]);

    // NEW LEGENDARY DRESSING STATES
    const [petSpeech, setPetSpeech] = useState<string | null>(null);
    const [isChestOpening, setIsChestOpening] = useState(false);
    const [chestResult, setChestResult] = useState<string | null>(null);
    const [photoAlbum, setPhotoAlbum] = useState<Array<{ id: string, bg: string, accessories: string[], date: string, theme: string, sp: number }>>([
        {
            id: 'photo-default-1',
            bg: 'stage',
            accessories: ['glasses', 'scarf'],
            date: '03.06.2026',
            theme: 'Tanıtım Kombini ✨',
            sp: 120
        }
    ]);

    const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const triggerSpeechBubble = useCallback((text: string) => {
        setPetSpeech(text);
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = setTimeout(() => {
            setPetSpeech(null);
        }, 2500);
    }, []);

    const handlePetInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (dressingStep !== 'clean' && dressingStep !== 'dry') return;

        const rect = e.currentTarget.getBoundingClientRect();
        let clientX = 0;
        let clientY = 0;

        if ('touches' in e) {
            if (e.touches.length === 0) return;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            if (e.type === 'mousemove' && e.buttons !== 1) return;
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        const newParticle = {
            id: Date.now() + Math.random(),
            x,
            y,
            emoji: dressingStep === 'clean' ? '🫧' : '💨'
        };

        if (dressingStep === 'clean') {
            setParticles(prev => [...prev, newParticle]);
        } else {
            setParticles(prev => [...prev.slice(-20), newParticle]);
        }

        if (dressingStep === 'clean') {
            setCleanProgress(prev => {
                const next = Math.min(100, prev + 1.5);
                if (prev < 25 && next >= 25) triggerSpeechBubble("Çok gıdıklandım! 😂");
                if (prev < 50 && next >= 50) triggerSpeechBubble("Köpükler harika! 🫧");
                if (prev < 75 && next >= 75) triggerSpeechBubble("Her yerim bembeyaz oldu! 🛁");
                if (prev < 100 && next >= 100) triggerSpeechBubble("Gıcır gıcır temizlendim! ✨");
                return next;
            });
        } else if (dressingStep === 'dry') {
            setDryProgress(prev => {
                const next = Math.min(100, prev + 1.5);
                if (prev < 25 && next >= 25) triggerSpeechBubble("Fön çok sıcakmış! 💨");
                if (prev < 50 && next >= 50) triggerSpeechBubble("Tüylerim havalanıyor! 🌬️");
                if (prev < 75 && next >= 75) triggerSpeechBubble("Pofuduk oluyorum! ✨");
                if (prev < 100 && next >= 100) triggerSpeechBubble("Kupkuru ve yumuşacığım! 🦁");
                return next;
            });
        }
    };

    const handleSelectApparel = (category: keyof typeof selectedApparel, item: any) => {
        const itemId = item?.id;
        const cost = item?.cost || 0;

        if (itemId && !unlockedApparel.includes(itemId)) {
            if (walletBalance >= cost) {
                setWalletBalance(prev => prev - cost);
                setUnlockedApparel(prev => [...prev, itemId]);
                setToastMsg(`🎉 Tebrikler! "${item.label}" açıldı. Cüzdandan ${cost} MoffiCoin harcandı.`);
                triggerSpeechBubble("Yeni kıyafetime bayıldım! 😍");
            } else {
                setToastMsg(`❌ Yetersiz MoffiCoin! Bu kıyafet için ${cost} Coin gerekiyor.`);
                return;
            }
        }

        setSelectedApparel(prev => {
            const next = { ...prev, [category]: itemId };

            // Synchronize with selectedAccessories so that bonuses, daily theme, and polaroid details work!
            const newAccs: string[] = [];
            
            // Map body items
            if (next.body === 'sweatshirt') newAccs.push('scarf');
            if (next.body === 'pajamas') newAccs.push('bowtie');
            
            // Map head items
            if (next.head === 'crown') newAccs.push('crown');
            if (next.head === 'pirate_hat') newAccs.push('hat');
            if (next.head === 'top_hat') newAccs.push('hat');
            if (next.head === 'beanie') newAccs.push('hat');
            
            // Map eye items
            if (next.eyes === 'glasses') newAccs.push('glasses');
            if (next.eyes === 'sunglasses') newAccs.push('glasses');
            if (next.eyes === 'eyepatch') newAccs.push('pirate');
            
            // Map hands
            if (next.hands === 'gloves') newAccs.push('bowtie');
            if (next.hands === 'boxing') newAccs.push('pirate');
            
            // Map feet
            if (next.feet === 'sneakers') newAccs.push('glasses');
            if (next.feet === 'boots') newAccs.push('hat');

            const uniqueAccs = Array.from(new Set(newAccs));
            setSelectedAccessories(uniqueAccs);

            // Speech reactions
            if (category === 'body') {
                if (itemId === 'sweatshirt') triggerSpeechBubble("Turuncu sweatshirtüm harika! 🧡");
                else if (itemId === 'singlet') triggerSpeechBubble("Atletle çok rahatım! 🎽");
                else if (itemId === 'pajamas') triggerSpeechBubble("Pijama partisi başlasın! 💤");
                else triggerSpeechBubble("Biraz serinledim sanki! 🥶");
            } else if (category === 'head') {
                if (itemId === 'crown') triggerSpeechBubble("Taçsız kral olur mu hiç! 👑");
                else if (itemId === 'pirate_hat') triggerSpeechBubble("Korsan şapkam hazır! 🏴‍☠️");
                else if (itemId === 'top_hat') triggerSpeechBubble("Sihirli bir numara ister misin? 🎩");
                else if (itemId === 'beanie') triggerSpeechBubble("Sıcacık tutuyor! 🧶");
                else triggerSpeechBubble("Şapkamı çıkardım.");
            } else if (category === 'eyes') {
                if (itemId === 'sunglasses') triggerSpeechBubble("Geleceğim çok parlak! 😎");
                else if (itemId === 'eyepatch') triggerSpeechBubble("Kaptan Moffi denizlerde! 🏴‍☠️");
                else if (itemId === 'glasses') triggerSpeechBubble("Şimdi daha net görüyorum! 🤓");
            } else if (category === 'hands') {
                if (itemId === 'boxing') triggerSpeechBubble("Hazır ol, sol kroşe geliyor! 🥊");
                else if (itemId === 'gloves') triggerSpeechBubble("Kışa hazırım! 🧤");
            } else if (category === 'feet') {
                if (itemId === 'sneakers') triggerSpeechBubble("Koşuya hazırız! 👟");
                else if (itemId === 'boots') triggerSpeechBubble("Çamurlara basabilirim! 🥾");
            }

            return next;
        });
    };

    const handleOpenChest = () => {
        if (walletBalance < 100) {
            setToastMsg("❌ Sandık açmak için 100 MoffiCoin gerekiyor! Yetersiz bakiye.");
            return;
        }

        setWalletBalance(prev => prev - 100);
        setIsChestOpening(true);
        setChestResult(null);

        // After 1.5 seconds shaking animation, roll reward item
        setTimeout(() => {
            setIsChestOpening(false);
            const availableDrops = [];
            if (!unlockedAccessories.includes('pirate')) availableDrops.push('pirate');
            if (!unlockedAccessories.includes('bowtie')) availableDrops.push('bowtie');

            let reward = '';
            if (availableDrops.length > 0) {
                reward = availableDrops[Math.floor(Math.random() * availableDrops.length)];
            } else {
                reward = Math.random() > 0.5 ? 'pirate' : 'bowtie';
            }

            setUnlockedAccessories(prev => {
                if (prev.includes(reward)) return prev;
                return [...prev, reward];
            });

            setChestResult(reward);
            
            if (reward === 'pirate') {
                triggerSpeechBubble("🏴‍☠️ Ayyay Kaptan! Korsan oldum!");
                setToastMsg("🏴‍☠️ Tebrikler! Efsanevi Korsan Göz Bandı kazandın! (+140 SP, XP/Like boost)");
                setUnlockedApparel(prev => [...prev, 'eyepatch', 'pirate_hat']);
            } else {
                triggerSpeechBubble("🎀 Çok centilmen bir beyefendi oldum!");
                setToastMsg("🎀 Tebrikler! Centilmen Papyon kazandın! (+90 SP, Coin/XP boost)");
                setUnlockedApparel(prev => [...prev, 'bowtie']);
            }
        }, 1500);
    };

    const activeBonus = useMemo(() => {
        let xpBonus = 0;
        let walkCoinBonus = 0;
        let likeBoost = 0;
        let vipActive = false;

        if (selectedAccessories.includes('glasses')) xpBonus += 15;
        if (selectedAccessories.includes('scarf')) walkCoinBonus += 10;
        if (selectedAccessories.includes('hat')) likeBoost += 20;
        if (selectedAccessories.includes('crown')) {
            vipActive = true;
            walkCoinBonus += 25;
            xpBonus += 10;
        }
        if (selectedAccessories.includes('pirate')) {
            xpBonus += 30;
            likeBoost += 35;
        }
        if (selectedAccessories.includes('bowtie')) {
            walkCoinBonus += 20;
            xpBonus += 25;
        }

        return { xpBonus, walkCoinBonus, likeBoost, vipActive };
    }, [selectedAccessories]);

    const handleToggleAccessory = (id: string) => {
        if (!unlockedAccessories.includes(id)) {
            const costs: Record<string, number> = { hat: 150, crown: 350 };
            const cost = costs[id] || 0;
            if (walletBalance >= cost) {
                setWalletBalance(prev => prev - cost);
                setUnlockedAccessories(prev => [...prev, id]);
                setSelectedAccessories(prev => [...prev, id]);
                setToastMsg(`🎉 Tebrikler! Premium eşya açıldı. Cüzdandan ${cost} MoffiCoin harcandı.`);
                triggerSpeechBubble("Yeni eşyama bayıldım! 😍");
            } else {
                setToastMsg(`❌ Yetersiz MoffiCoin! Bu eşya için ${cost} Coin gerekiyor.`);
            }
            return;
        }

        setSelectedAccessories(prev => {
            const isRemoving = prev.includes(id);
            const next = isRemoving ? prev.filter(a => a !== id) : [...prev, id];

            // Cute speech reactions when wearing/removing accessories
            if (id === 'glasses') triggerSpeechBubble(isRemoving ? "Gözlerim kamaşıyordu zaten! 😎" : "Çok havalı oldum! 😎");
            else if (id === 'scarf') triggerSpeechBubble(isRemoving ? "Boynum rahatladı! 🧣" : "Beni sıcacık tutuyor! 🧣");
            else if (id === 'hat') triggerSpeechBubble(isRemoving ? "Şapkasız daha iyiyim 🎩" : "Retro tarzı severim! 🎩");
            else if (id === 'crown') triggerSpeechBubble(isRemoving ? "Kraliyet bitti 👑" : "Kraliyet üyesi gibiyim! 👑");
            else if (id === 'pirate') triggerSpeechBubble(isRemoving ? "Denizler beni bekler! 🌊" : "Ayyay kaptan! 🏴‍☠️");
            else if (id === 'bowtie') triggerSpeechBubble(isRemoving ? "Gündelik tarza döndüm 🎀" : "Çok şık bir beyefendiyim! 🎀");

            return next;
        });
    };

        const handleSaveOutfit = () => {
        let totalSP = 0;
        const names: string[] = [];

        // Body
        if (selectedApparel.body === 'sweatshirt') { totalSP += 80; names.push('Turuncu Sweatshirt 🧡'); }
        else if (selectedApparel.body === 'singlet') { totalSP += 60; names.push('Spor Atlet 🎽'); }
        else if (selectedApparel.body === 'pajamas') { totalSP += 70; names.push('Çizgili Pijama 💤'); }

        // Head
        if (selectedApparel.head === 'beanie') { totalSP += 50; names.push('Örme Bere 🧶'); }
        else if (selectedApparel.head === 'top_hat') { totalSP += 120; names.push('Silindir Şapka 🎩'); }
        else if (selectedApparel.head === 'crown') { totalSP += 200; names.push('Altın Taç 👑'); }
        else if (selectedApparel.head === 'pirate_hat') { totalSP += 140; names.push('Korsan Şapkası 🏴‍☠️'); }

        // Eyes
        if (selectedApparel.eyes === 'glasses') { totalSP += 30; names.push('Optik Gözlük 🤓'); }
        else if (selectedApparel.eyes === 'sunglasses') { totalSP += 50; names.push('Güneş Gözlüğü 😎'); }
        else if (selectedApparel.eyes === 'eyepatch') { totalSP += 110; names.push('Göz Bandı 👁️'); }

        // Hands
        if (selectedApparel.hands === 'gloves') { totalSP += 40; names.push('Sıcak Eldiven 🧤'); }
        else if (selectedApparel.hands === 'boxing') { totalSP += 90; names.push('Boks Eldiveni 🥊'); }

        // Feet
        if (selectedApparel.feet === 'sneakers') { totalSP += 50; names.push('Spor Ayakkabı 👟'); }
        else if (selectedApparel.feet === 'boots') { totalSP += 80; names.push('Kışlık Bot 🥾'); }

        setStylePoints(totalSP);
        const joinedName = names.length > 0 ? names.join(' & ') : 'Sade Tarz 🐾';
        setActiveOutfitName(joinedName);

        // Daily Challenge Theme check: "Korsan Balosu 🏴‍☠️👑" (Requires crown OR pirate_hat OR eyepatch)
        const meetsTheme = selectedApparel.head === 'crown' || selectedApparel.head === 'pirate_hat' || selectedApparel.eyes === 'eyepatch';
        let dailyThemeCoins = 0;
        if (meetsTheme) {
            dailyThemeCoins = 50;
            setWalletBalance(prev => prev + 50);
        }

        // Add to polaroid album
        const newPhotoId = 'photo-' + Date.now();
        const formattedDate = new Date().toLocaleDateString('tr-TR');
        const newPhoto = {
            id: newPhotoId,
            bg: activeStudioBg,
            accessories: [...names],
            date: formattedDate,
            theme: meetsTheme ? 'Korsan Balosu 🏴‍☠️👑' : 'Serbest Tarz ✨',
            sp: totalSP
        };
        setPhotoAlbum(prev => [newPhoto, ...prev]);

        if (meetsTheme) {
            setToastMsg(`✨ Kombin başarıyla kaydedildi! Tarz Puanı: ${totalSP} P. Günlük Tema "Korsan Balosu 🏴‍☠️👑" Başarıyla Tamamlandı! +50 MoffiCoin Kazanıldı! 🔥`);
        } else {
            setToastMsg(`✨ Kombin başarıyla kaydedildi! Tarz Puanı: ${totalSP} P. Ekstra bonuslar aktif edildi!`);
        }
        setExpandedPanel(null);
    };



    const baseMockTemplate = cleanDefaultTemplate;

    const resolvedStreak = typeof activePetObj?.streak === 'number' 
        ? activePetObj.streak 
        : (activePetObj?.sos_settings?.streak ?? baseMockTemplate.streak);
    
    const resolvedActivityTarget = typeof activePetObj?.activity_target === 'number' 
        ? activePetObj.activity_target 
        : (activePetObj?.sos_settings?.activity_target ?? baseMockTemplate.ringProgress.activity);

    // Streak değerine göre haftalık aktivite grafiği üret — Math.random yerine deterministik seed
    const weeklyData = useMemo(() => {
        const seed = (activePetObj?.id || 'default').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return Array.from({ length: 7 }, (_, i) => {
            const pseudoRand = ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;
            if (i < resolvedStreak) {
                // Tamamlanmış günler: hedef etrafında stabil varyasyon
                return Math.min(100, Math.round(resolvedActivityTarget + (pseudoRand * 20) - 5));
            }
            // Tamamlanmamış günler: düşük aktivite
            return Math.round(resolvedActivityTarget * 0.3 + pseudoRand * 15);
        });
    }, [activePetObj?.id, resolvedStreak, resolvedActivityTarget]);


    const pet = {
        ...baseMockTemplate,
        id: activePetObj?.id,
        name: activePetObj?.name || baseMockTemplate.name,
        image: activePetObj?.image || activePetObj?.avatar || '',
        breed: activePetObj?.breed || baseMockTemplate.breed,
        weight: activePetObj?.weight || activePetObj?.sos_settings?.weight || baseMockTemplate.weight,
        gender: activePetObj?.gender || '',
        health: activePetObj?.health || activePetObj?.sos_settings?.health || baseMockTemplate.health,
        streak: resolvedStreak,
        weeklyData,
        ringProgress: {
            activity: resolvedActivityTarget,
            water: typeof activePetObj?.water_target === 'number' ? activePetObj.water_target : (activePetObj?.sos_settings?.water_target ?? baseMockTemplate.ringProgress.water),
            food: typeof activePetObj?.food_target === 'number' ? activePetObj.food_target : (activePetObj?.sos_settings?.food_target ?? baseMockTemplate.ringProgress.food),
        },
        passport: {
            ...baseMockTemplate.passport,
            idCode: activePetObj?.microchip || activePetObj?.microchip_id || baseMockTemplate.passport.idCode,
            qrcode: activePetObj?.id ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=moffi-passport-${activePetObj.id}` : baseMockTemplate.passport.qrcode,
        },
        dressing: {
            activeOutfit: activeOutfitName,
            stylePoints: stylePoints,
            avatarMock: activePetObj?.image || activePetObj?.avatar || '',
        }
    };

    const [isPetSettingsOpen, setIsPetSettingsOpen] = useState(false);
    const [isAddPetOpen, setIsAddPetOpen] = useState(false);
    const [selectedAnn, setSelectedAnn] = useState<any | null>(null);
    const [addPetStep, setAddPetStep] = useState(1);
    const [newPetName, setNewPetName] = useState("");
    const [newPetType, setNewPetType] = useState("🐶");
    const [newPetBreed, setNewPetBreed] = useState("");
    const [newPetAge, setNewPetAge] = useState("");
    const [newPetGender, setNewPetGender] = useState("Erkek");
    const [newPetNeutered, setNewPetNeutered] = useState("Evet");
    const [newPetSize, setNewPetSize] = useState("Orta");
    const [newPetFeatures, setNewPetFeatures] = useState("");
    const [newPetHealth, setNewPetHealth] = useState("");
    const [newPetCharacter, setNewPetCharacter] = useState("");
    const [newPetMicrochip, setNewPetMicrochip] = useState("");
    const [newPetShowPhone, setNewPetShowPhone] = useState(true);
    const [newPetPhotos, setNewPetPhotos] = useState<any[]>([]);
    const [isSavingPet, setIsSavingPet] = useState(false);

    const [newPetWeight, setNewPetWeight] = useState("");
    const [newPetHealthStatus, setNewPetHealthStatus] = useState("İyi");
    const [newPetActivityTarget, setNewPetActivityTarget] = useState("70");
    const [newPetWaterTarget, setNewPetWaterTarget] = useState("1200");
    const [newPetFoodTarget, setNewPetFoodTarget] = useState("1600");
    const isAnyModalOpen = !!expandedPanel || isPetSettingsOpen || isAddPetOpen || isCareHubOpen;

    const handleSavePetSettings = async (updatedFields: any) => {
        try {
            if (activePetObj && activePetObj.id) {
                // Mevcut sos_settings ile birleştir, weight, sağlık, renk, veli bilgisi ve hedefleri ekle
                const mergedSosSettings = {
                    ...(activePetObj.sos_settings || {}),
                    weight: updatedFields.weight ? `${updatedFields.weight} kg` : (activePetObj.sos_settings?.weight || ''),
                    health: updatedFields.healthStatus || updatedFields.health || (activePetObj.sos_settings?.health || 'İyi'),
                    color: updatedFields.color || (activePetObj.sos_settings?.color || ''),
                    activity_target: typeof updatedFields.activityTarget !== 'undefined' ? Number(updatedFields.activityTarget) : (activePetObj.sos_settings?.activity_target ?? 70),
                    water_target: typeof updatedFields.waterTarget !== 'undefined' ? Number(updatedFields.waterTarget) : (activePetObj.sos_settings?.water_target ?? 1200),
                    food_target: typeof updatedFields.foodTarget !== 'undefined' ? Number(updatedFields.foodTarget) : (activePetObj.sos_settings?.food_target ?? 1600),
                    // Parazit tarihleri sos_settings JSON'unda saklanıyor
                    parasiteInternal: updatedFields.parasiteInternal || (activePetObj.sos_settings?.parasiteInternal || ''),
                    parasiteExternal: updatedFields.parasiteExternal || (activePetObj.sos_settings?.parasiteExternal || ''),
                    // Doğum tarihi
                    birthday: updatedFields.birthday || (activePetObj.sos_settings?.birthday || ''),
                    // Yeni alanlar
                    size: updatedFields.size || (activePetObj.sos_settings?.size || ''),
                    character: updatedFields.character || (activePetObj.sos_settings?.character || ''),
                    features: updatedFields.features || (activePetObj.sos_settings?.features || ''),
                    owner: {
                        name: updatedFields.ownerName || '',
                        phone: updatedFields.ownerPhone || '',
                        address: updatedFields.ownerAddress || '',
                    }
                };

                const petUpdates = {
                    ...updatedFields,
                    // Fotoğraf güncellemesi
                    image: updatedFields.image || activePetObj.image || activePetObj.avatar || '',
                    avatar: updatedFields.avatar || updatedFields.image || activePetObj.avatar || '',
                    // Alan normalizasyonları
                    microchip_id: updatedFields.microchip || updatedFields.microchip_id,
                    microchip: updatedFields.microchip || updatedFields.microchip_id,
                    is_neutered: updatedFields.neutered,
                    // Yeni alanlar direkt yazılıyor
                    type: updatedFields.type || activePetObj.type || '',
                    size: updatedFields.size || '',
                    health: mergedSosSettings.health,
                    health_notes: updatedFields.healthNotes || '',
                    character: updatedFields.character || '',
                    color: mergedSosSettings.color,
                    owner: mergedSosSettings.owner,
                    activity_target: mergedSosSettings.activity_target,
                    water_target: mergedSosSettings.water_target,
                    food_target: mergedSosSettings.food_target,
                    sos_settings: mergedSosSettings,
                };

                await apiService.updatePet(activePetObj.id, petUpdates);
                updatePet(activePetObj.id, {
                    ...petUpdates,
                    weight: mergedSosSettings.weight,
                    health: mergedSosSettings.health,
                });
                setToastMsg("Pasaport bilgileri Moffi Cloud'a mühürlendi! 🛡️");
            }
            setIsPetSettingsOpen(false);
        } catch (err) {
            console.error(err);
            setToastMsg("Pati bilgileri güncellenirken bir hata oluştu.");
        }
    };

    const handleAddPetSave = async () => {
        setIsSavingPet(true);
        try {
            let imageUrl = "";
            if (newPetPhotos.length > 0) {
                try {
                    // 'avatars' bucket: pet profil fotoğrafları için doğru bucket
                    imageUrl = await apiService.uploadMedia(newPetPhotos[0].file, 'avatars');
                } catch (uploadErr) {
                    console.warn('Fotoğraf yüklenemedi, pet fotoğrafsız kaydedilecek:', uploadErr);
                    // Upload başarısız olsa bile devam et
                    imageUrl = "";
                }
            }

            const newPetData = {
                name: newPetName,
                type: newPetType,
                breed: newPetBreed,
                age: newPetAge,
                gender: newPetGender,
                is_neutered: newPetNeutered === 'Evet',
                size: newPetSize,
                health_notes: newPetHealth,
                character: newPetCharacter,
                microchip_id: newPetMicrochip,
                show_phone: newPetShowPhone,
                // Fotoğraf: kullanıcı yüklemediyse boş bırak (avatar_url boş olur, UI placeholder gösterir)
                image: imageUrl || '',
                // Pet tipine göre tema rengi
                themeColor: newPetType === '🐱' ? '#A78BFA' : newPetType === '🦜' ? '#34D399' : newPetType === '🐰' ? '#F472B6' : '#FBBF24',
                
                weight: newPetWeight ? `${newPetWeight} kg` : '',
                health: newPetHealthStatus,
                streak: 0,
                activity_target: Number(newPetActivityTarget) || 70,
                water_target: Number(newPetWaterTarget) || 1200,
                food_target: Number(newPetFoodTarget) || 1600,
                
                sos_settings: {
                    auto_post_sos: true,
                    sos_radius: '5km' as const,
                    secure_proxy_only: false,
                    location_precision: 'exact' as const,
                    emergency_sms_number: "",
                    reward_amount: 0,
                    reward_currency: "TL",
                    critical_health_note: newPetHealth,
                    finder_message: "",
                    reward_enabled: false,
                    header_sos_alert_enabled: true,
                    
                    weight: newPetWeight ? `${newPetWeight} kg` : '',
                    health: newPetHealthStatus,
                    streak: 0,
                    activity_target: Number(newPetActivityTarget) || 70,
                    water_target: Number(newPetWaterTarget) || 1200,
                    food_target: Number(newPetFoodTarget) || 1600,
                }
            };

            const savedPet = await apiService.addPet(newPetData as any);
            
            // savedPet.image: DB'den gelen avatar_url. Yoksa imageUrl (upload URL) kullan.
            // Her iki durumda da doğru fotoğraf context'te geri kazanılır.
            const finalImage = savedPet.image || imageUrl || '';
            
            // Eğer DB'de avatar_url boş kaldıysa ve elimizde bir imageUrl varsa, DB'ye yaz
            if (imageUrl && !savedPet.image && savedPet.id) {
                try {
                    await apiService.updatePet(savedPet.id, { image: imageUrl, avatar: imageUrl });
                } catch (updateErr) {
                    console.warn('Pet avatar_url güncellenemedi:', updateErr);
                }
            }
            
            addPet({
                ...newPetData,
                id: savedPet.id,
                image: finalImage,
                avatar: finalImage,
            } as any);

            setIsAddPetOpen(false);
            setToastMsg(`🎉 ${newPetName} aileye hoş geldin! 🐾`);
            
            setAddPetStep(1);
            setNewPetName("");
            setNewPetPhotos([]);
            setNewPetWeight("");
            setNewPetHealthStatus("İyi");
            setNewPetActivityTarget("70");
            setNewPetWaterTarget("1200");
            setNewPetFoodTarget("1600");
        } catch (err: any) {
            console.error('Pet kayıt hatası:', err);
            const msg = err?.message || err?.details || 'Bilinmeyen hata';
            setToastMsg(`❌ Pati kaydedilemedi: ${msg.slice(0, 80)}`);
        } finally {
            setIsSavingPet(false);
        }
    };

    const [profileOrdersTab, setProfileOrdersTab] = useState<'active' | 'past' | 'cart' | 'settings'>('active');
    const [cartQty1, setCartQty1] = useState(1);
    const [cartQty2, setCartQty2] = useState(1);
    
    useEffect(() => {
        if (isInitialized && !isPetLoading && userPets.length === 0) {
            setIsAddPetOpen(true);
        }
    }, [isInitialized, isPetLoading, userPets.length]);

    const [showLiveMap, setShowLiveMap] = useState(false);
    const [geofenceAlerts, setGeofenceAlerts] = useState(true);
    const [collarLowBattery, setCollarLowBattery] = useState(true);
    const [anomaliesSms, setAnomaliesSms] = useState(false);
    const [activeOrders, setActiveOrders] = useState<Array<{id: string, name: string, desc: string, timeRemaining: string, status: string, progress: number}>>([
        { id: 'order-1', name: 'Somonlu Premium Mama (15 kg)', desc: 'Moda Dağıtım Noktası • Kurye: Walky Emre', timeRemaining: '8 dk kaldı', status: 'Kurye Yaklaşıyor', progress: 65 }
    ]);

    // Roadmap States
    const [nfcPaymentLocked, setNfcPaymentLocked] = useState(false);
    const [dailySpendLimit, setDailySpendLimit] = useState(250);
    const [lostPetMode, setLostPetMode] = useState(false);

    useEffect(() => {
        if (activePetObj) {
            setLostPetMode(!!activePetObj.is_lost);
        }
    }, [activePetObj?.is_lost, activePetObj?.id]);




    // Yürüyüş canlı zamanlayıcı
    const [walkElapsedSeconds, setWalkElapsedSeconds] = useState(0);
    const walkTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (activeSession) {
            // Başlangıç zamanından geçen süreyi hesapla
            const startMs = new Date(activeSession.startTime || Date.now()).getTime();
            setWalkElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
            
            walkTimerRef.current = setInterval(() => {
                setWalkElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
            }, 1000);
        } else {
            if (walkTimerRef.current) clearInterval(walkTimerRef.current);
            setWalkElapsedSeconds(0);
        }
        return () => { if (walkTimerRef.current) clearInterval(walkTimerRef.current); };
    }, [activeSession?.id]);

    // Maskot göz kırpma efekti (Blinking effect)
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setIsBlinking(true);
            setTimeout(() => {
                setIsBlinking(false);
            }, 180);
        }, 3500 + Math.random() * 2500); // 3.5 - 6 saniyede bir göz kırpar
        return () => clearInterval(blinkInterval);
    }, []);

    const formatWalkTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    };

    const handleStartWalk = useCallback(async () => {
        const session = await startWalk();
        if (session) setToastMsg(`🐾 ${pet.name} ile yürüyüş başladı! GPS aktif.`);
        else setToastMsg('⚠️ Yürüyüş başlatılamadı. Konuma izin verdiğinizden emin olun.');
    }, [startWalk, pet.name]);

    const handleEndWalk = useCallback(async () => {
        const result = await endWalk('happy');
        if (result) {
            const distM = result.distance_meters || 0;
            const distKm = (distM / 1000).toFixed(2);
            const patiEarned = Math.round(distM * 0.05); // ~50 PATI/km
            if (patiEarned > 0) {
                setWalletBalance(prev => prev + patiEarned);
                addTransaction('gelir', 'Yürüyüş Ödülü 🐾', patiEarned);
            }
            setToastMsg(`🎉 Yürüyüş tamamlandı! ${distKm} KM • +${patiEarned} PATI kazanıldı 🔥`);
        }
    }, [endWalk, addTransaction]);



    // Dynamic Stories Hook & States
    const { storyGroups } = useStories();
    const [viewerStoryGroupIndex, setViewerStoryGroupIndex] = useState<number | null>(null);
    const [viewerStoryIndex, setViewerStoryIndex] = useState(0);
    const [storyProgress, setStoryProgress] = useState(0);
    const [isStoryPaused, setIsStoryPaused] = useState(false);
    const storyPressStartTime = useRef<number>(0);

    const activeGroup = viewerStoryGroupIndex !== null ? storyGroups[viewerStoryGroupIndex] : null;
    const activeStory = activeGroup ? activeGroup.stories[viewerStoryIndex] : null;

    const handleCtaClick = () => {
        if (!activeStory) return;
        
        const ctaVal = activeStory.ctaValue?.trim() || "";
        const ctaType = activeStory.ctaType;
        
        // 1. If it is a coupon, copy to clipboard & show toast
        if (ctaType === 'coupon') {
            try {
                navigator.clipboard.writeText(ctaVal);
                setToastMsg(`🎟️ Kupon Kodu Kopyalandı: ${ctaVal}`);
            } catch (e) {
                setToastMsg(`Kupon: ${ctaVal}`);
            }
            closeStoryViewer();
            return;
        }
        
        // 2. If it is a map link
        if (ctaType === 'map' || ctaVal.startsWith('map:')) {
            const cleanCoords = ctaVal.replace('map:', '');
            setToastMsg(`📍 Konum Haritada Gösteriliyor...`);
            setShowLiveMap(true);
            closeStoryViewer();
            return;
        }
        
        // 3. If it is an internal application route
        if (ctaType === 'link' || ctaVal.startsWith('/')) {
            router.push(ctaVal);
            closeStoryViewer();
            return;
        }

        // 4. If it is an external URL link
        if (ctaType === 'url' || ctaVal.startsWith('http://') || ctaVal.startsWith('https://')) {
            window.open(ctaVal, '_blank', 'noopener,noreferrer');
            closeStoryViewer();
            return;
        }

        // 5. Fallback: If it's a general informational message (toast type with no url/path), open the detailed modal
        setSelectedAnn(activeStory);
        closeStoryViewer();
    };

    const closeStoryViewer = () => {
        setViewerStoryGroupIndex(null);
        setViewerStoryIndex(0);
        setStoryProgress(0);
    };

    const nextStory = () => {
        setStoryProgress(0);
        if (viewerStoryGroupIndex === null) return;
        const group = storyGroups[viewerStoryGroupIndex];
        if (viewerStoryIndex < group.stories.length - 1) {
            setViewerStoryIndex(prev => prev + 1);
        } else {
            closeStoryViewer();
        }
    };

    const prevStory = () => {
        setStoryProgress(0);
        if (viewerStoryGroupIndex === null) return;
        if (viewerStoryIndex > 0) {
            setViewerStoryIndex(prev => prev - 1);
        } else {
            closeStoryViewer();
        }
    };

    useEffect(() => {
        if (viewerStoryGroupIndex === null) return;
        if (isStoryPaused) return;

        const intervalTime = 50;
        const timer = setInterval(() => {
            setStoryProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    nextStory();
                    return 0;
                }
                return prev + 1;
            });
        }, intervalTime);

        return () => {
            clearInterval(timer);
        };
    }, [viewerStoryGroupIndex, viewerStoryIndex, isStoryPaused, storyGroups]);

    const formatTimeAgo = (dateStr?: string) => {
        if (!dateStr) return "şimdi";
        const diffInSeconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        if (diffInSeconds < 60) return `${Math.max(0, diffInSeconds)}s`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}d`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}sa`;
        return `${Math.floor(diffInHours / 24)}g`;
    };



    useEffect(() => {
        if (toastMsg) {
            const timer = setTimeout(() => {
                setToastMsg(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toastMsg]);

    if (isPetLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-green-100 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#527958] animate-spin" />
                    <span className="text-xl">🐾</span>
                </div>
                <h3 className="text-sm font-black text-gray-805 animate-pulse">Moffi Dünyası Yükleniyor...</h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Evcil hayvan verileri güvenli şekilde çekiliyor</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-green-500/30 overflow-x-hidden pb-32">
            
            {/* Top Floating Toast Notification */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div 
                        initial={{ y: -60, opacity: 0, scale: 0.95 }}
                        animate={{ y: 16, opacity: 1, scale: 1 }}
                        exit={{ y: -60, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="fixed top-4 inset-x-0 mx-auto w-[90%] max-w-xs bg-gray-900 text-white text-[11px] font-bold py-3 px-4.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 z-[99999] pointer-events-auto"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm shrink-0">🐾</span>
                            <span className="leading-snug text-left">{toastMsg}</span>
                        </div>
                        <button 
                            onClick={() => setToastMsg(null)} 
                            className="text-gray-400 hover:text-white font-bold text-sm shrink-0 px-1 cursor-pointer"
                        >
                            ×
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Dashboard Wrapper */}
            <motion.div 
                animate={{ 
                    scale: isAnyModalOpen ? 0.93 : 1,
                    filter: isAnyModalOpen ? 'blur(16px)' : 'blur(0px)',
                    opacity: isAnyModalOpen ? 0.05 : 1,
                    pointerEvents: isAnyModalOpen ? 'none' : 'auto'
                }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="max-w-md mx-auto pt-6 px-5"
            >
                
                {/* 1. Header */}
                <header className="flex justify-between items-center mb-6">
                    {hasNoPets ? (
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#527958] to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 text-white">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[14px] font-black text-gray-905 tracking-tight leading-none">Moffi</span>
                                <span className="text-[9px] font-bold text-gray-400 mt-0.5 leading-none">Süper App</span>
                            </div>
                        </div>
                    ) : (
                        <motion.div 
                            layoutId="collar-card-container"
                            onClick={() => setExpandedPanel('collar')}
                            className="flex items-center gap-2.5 cursor-pointer group"
                        >
                            <div className="relative">
                                <div className="w-9 h-9 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg shadow-gray-900/10 text-green-400">
                                    <Radio className="w-5 h-5" />
                                </div>
                                {pet.collar.connected && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                                )}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">TASMA DURUMU</span>
                                <span className="text-[10px] font-bold text-gray-700 mt-0.5 flex items-center gap-1.5 leading-none">
                                    {pet.collar.connected ? `Bağlı (%${pet.collar.battery})` : 'Bağlantı Yok'}
                                </span>
                            </div>
                        </motion.div>
                    )}
                    
                    <div className="flex items-center gap-3">
                        {!hasNoPets && (
                            <motion.button 
                                whileTap={{ scale: 0.9 }}
                                onClick={() => window.dispatchEvent(new CustomEvent('open-sos-center'))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm relative overflow-hidden group cursor-pointer border ${
                                    lostPetMode 
                                        ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                                        : 'bg-red-50 border-red-200/60 text-red-600 hover:bg-red-100/50'
                                 }`}
                            >
                                <span className="absolute inset-0 bg-red-500/10 animate-pulse rounded-full" />
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute left-3" />
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                <span className={`text-[10px] font-black tracking-wider uppercase ml-1 ${lostPetMode ? 'text-white' : 'text-red-600'}`}>SOS</span>
                            </motion.button>
                        )}

                        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <Bell className="w-5 h-5" />
                            <div className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                        </button>

                        {/* Tema Toggle — sadece community'de */}
                        <ThemeToggleButton />

                        <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setExpandedPanel('profile')}
                            className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:border-gray-400 transition-colors"
                        >
                            <UserAvatar
                                avatar={authUser?.avatar}
                                name={authUser?.name}
                                username={authUser?.username}
                                email={authUser?.email}
                                size="sm"
                            />
                        </motion.button>
                    </div>
                </header>

                {hasNoPets ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, type: 'spring' }}
                        className="bg-gradient-to-br from-white/95 to-gray-50/90 backdrop-blur-xl rounded-[40px] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.04)] border border-gray-100/80 mb-6 text-center relative overflow-hidden"
                    >
                        {/* Glow effects */}
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

                        <div className="relative z-10 flex flex-col items-center">
                            {/* Animated Paw Icon Container */}
                            <motion.div 
                                animate={{ 
                                    scale: [1, 1.05, 1],
                                    rotate: [0, 2, -2, 0]
                                }}
                                transition={{ 
                                    repeat: Infinity,
                                    duration: 4,
                                    ease: "easeInOut"
                                }}
                                className="w-24 h-24 rounded-[32px] bg-gradient-to-tr from-[#EAF5EC] to-emerald-50 border border-green-100 flex items-center justify-center shadow-lg shadow-green-100/40 mb-6"
                            >
                                <span className="text-4xl filter drop-shadow-md">🐾</span>
                            </motion.div>

                            <h2 className="text-2xl font-black text-gray-805 tracking-tight leading-tight">
                                Moffi Dünyasına<br />Hoş Geldiniz!
                            </h2>

                            <p className="text-xs font-semibold text-gray-450 mt-4 max-w-[280px] leading-relaxed">
                                Evcil hayvanınızın pasaport kaydını oluşturarak aşı takvimi, akıllı tasma özellikleri, beslenme hedefleri ve topluluk aktivitelerini hemen yönetmeye başlayın.
                            </p>

                            {/* Benefit badges */}
                            <div className="grid grid-cols-2 gap-2 w-full my-6">
                                <div className="bg-white/60 border border-gray-100/50 p-2.5 rounded-2xl flex items-center gap-2">
                                    <span className="text-base">📍</span>
                                    <div className="text-left">
                                        <span className="text-[9px] font-black text-gray-800 block leading-tight">Canlı Takip</span>
                                        <span className="text-[7.5px] text-gray-400 font-semibold block leading-none mt-0.5">GPS & Konum</span>
                                    </div>
                                </div>
                                <div className="bg-white/60 border border-gray-100/50 p-2.5 rounded-2xl flex items-center gap-2">
                                    <span className="text-base">📅</span>
                                    <div className="text-left">
                                        <span className="text-[9px] font-black text-gray-800 block leading-tight">Sağlık Takibi</span>
                                        <span className="text-[7.5px] text-gray-400 font-semibold block leading-none mt-0.5">Aşı & Randevu</span>
                                    </div>
                                </div>
                                <div className="bg-white/60 border border-gray-100/50 p-2.5 rounded-2xl flex items-center gap-2">
                                    <span className="text-base">🥣</span>
                                    <div className="text-left">
                                        <span className="text-[9px] font-black text-gray-800 block leading-tight">Beslenme</span>
                                        <span className="text-[7.5px] text-gray-400 font-semibold block leading-none mt-0.5">Kalori & Su</span>
                                    </div>
                                </div>
                                <div className="bg-white/60 border border-gray-100/50 p-2.5 rounded-2xl flex items-center gap-2">
                                    <span className="text-base">👗</span>
                                    <div className="text-left">
                                        <span className="text-[9px] font-black text-gray-800 block leading-tight">Gardırop</span>
                                        <span className="text-[7.5px] text-gray-400 font-semibold block leading-none mt-0.5">AI Stil & Kombin</span>
                                    </div>
                                </div>
                            </div>

                            {/* Large Premium Add Pet Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsAddPetOpen(true)}
                                className="w-full bg-[#527958] hover:bg-[#436448] text-white text-[13px] font-black py-4 rounded-3xl shadow-lg shadow-green-900/10 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                            >
                                <Plus className="w-4.5 h-4.5 stroke-[3]" />
                                <span>Evcil Hayvan Ekle</span>
                            </motion.button>
                        </div>
                    </motion.div>
                ) : (
                    <>

                {/* 2. Hikayeler (Stories) - Dynamic from useStories */}
                <section className="mb-6">
                    {/* Hikayeler başlığı kaldırıldı */}
                    <div 
                        ref={storiesScroll.ref}
                        onMouseDown={storiesScroll.onMouseDown}
                        onMouseLeave={storiesScroll.onMouseLeave}
                        onMouseUp={storiesScroll.onMouseUp}
                        onMouseMove={storiesScroll.onMouseMove}
                        className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-5 px-5 items-center cursor-grab active:cursor-grabbing select-none"
                    >
                        {storyGroups.map((group, index) => {
                            let customType: 'normal' | 'sos' | 'ai' | 'featured' = 'normal';
                            if (group.user_id === 'system_sos') customType = 'sos';
                            if (group.user_id === 'system_announcements') customType = 'ai';
                            if (group.user_id === 'system_featured_pets') customType = 'featured';
                            
                            // Get last word or a clean subtitle
                            const cleanTitle = group.author_name.split(' ').slice(1).join(' ') || group.author_name;

                            return (
                                <div 
                                    key={group.user_id} 
                                    className="cursor-pointer"
                                    onClick={() => {
                                        setViewerStoryGroupIndex(index);
                                        setViewerStoryIndex(0);
                                        setStoryProgress(0);
                                    }}
                                >
                                    <StoryCircle 
                                        image={group.author_avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} 
                                        title={cleanTitle} 
                                        type={customType} 
                                        delay={0.1 + index * 0.05} 
                                    />
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 9. Hero Pet Identity Card - Premium 3D Parallax Card */}
                <div 
                    className="relative"
                    onMouseMove={handleMouseMoveCard}
                    onMouseLeave={handleMouseLeaveCard}
                >
                    {/* Breathing Organic Glow Blobs behind the Card */}
                    <div className="absolute top-4 left-6 w-36 h-36 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0 animate-pulse" />
                    <div className="absolute bottom-6 right-8 w-36 h-36 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none z-0 animate-pulse" />

                    <motion.div 
                        layout
                        style={{
                            rotateX,
                            rotateY,
                            transformStyle: "preserve-3d",
                            perspective: 1000,
                            background: isDark 
                                ? 'linear-gradient(135deg, rgba(28, 28, 33, 0.95) 0%, rgba(20, 20, 25, 0.98) 100%)' 
                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.90) 0%, rgba(248, 250, 247, 0.95) 100%)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(34, 197, 94, 0.15)',
                        }}
                        className="rounded-[36px] p-5 mb-6 border relative overflow-hidden transition-all duration-300 z-10 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)]"
                    >
                        {/* Specular Light Reflection Overlay */}
                        <motion.div 
                            className="absolute inset-0 pointer-events-none z-20"
                            style={{
                                background: `radial-gradient(circle at ${shineX} ${shineY}, ${
                                    isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.20)'
                                } 0%, transparent 60%)`
                            }}
                        />

                        {/* Switcher & Badges */}
                        <div className="flex justify-between items-start mb-4 relative z-10" style={{ transform: "translateZ(25px)" }}>
                            <div 
                                ref={petSwitcherScroll.ref}
                                onMouseDown={petSwitcherScroll.onMouseDown}
                                onMouseLeave={petSwitcherScroll.onMouseLeave}
                                onMouseUp={petSwitcherScroll.onMouseUp}
                                onMouseMove={petSwitcherScroll.onMouseMove}
                                className="flex items-center gap-2 bg-black/5 dark:bg-white/10 p-1.5 rounded-full border border-black/10 dark:border-white/10 shadow-inner max-w-[240px] overflow-x-auto no-scrollbar shrink-0 cursor-grab active:cursor-grabbing select-none"
                            >
                                {userPets.map((p) => (
                                    <motion.button
                                        key={p.id}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => switchPet(p.id)}
                                        className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                                            activePetObj?.id === p.id 
                                                ? 'border-green-600 scale-105 shadow-sm' 
                                                : 'border-transparent opacity-60'
                                        }`}
                                    >
                                        {p.image || p.avatar ? (
                                            <img src={p.image || p.avatar} className="w-full h-full object-cover" alt={p.name} />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-tr from-gray-150 to-gray-250 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                                    {p.name ? p.name[0] : '🐾'}
                                                </span>
                                            </div>
                                        )}
                                    </motion.button>
                                ))}
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsAddPetOpen(true)}
                                    className="w-8 h-8 rounded-full bg-white/20 dark:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors shrink-0 shadow-sm"
                                >
                                    <Plus className="w-4.5 h-4.5" />
                                </motion.button>
                            </div>

                            <motion.div 
                                key={lostPetMode ? "KAYIP" : pet.status}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`px-3 py-1 rounded-full border text-[9px] font-black tracking-widest uppercase ${
                                    lostPetMode 
                                        ? "text-white bg-red-600 border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" 
                                        : "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 shadow-sm"
                                }`}
                            >
                                {lostPetMode ? "KAYIP 🚨" : pet.status}
                            </motion.div>
                        </div>

                        <div className="flex items-center gap-5 relative z-10" style={{ transform: "translateZ(35px)" }}>
                            <div className="relative">
                                <div className="w-20 h-20 rounded-[28px] overflow-hidden shadow-md border-2 border-white/50 dark:border-zinc-700/50 relative group bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                    {pet.image ? (
                                        <motion.img 
                                            key={pet.image}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                            src={pet.image} 
                                            className="w-full h-full object-cover animate-fade-in" 
                                            alt={pet.name} 
                                        />
                                    ) : (
                                        <span className="text-gray-400 dark:text-zinc-500 text-3xl font-black select-none uppercase">
                                            {pet.name ? pet.name[0] : '🐾'}
                                        </span>
                                    )}
                                    <div className="absolute inset-0 bg-black/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[28px] cursor-pointer">
                                        <Shirt className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <motion.h2 
                                        key={pet.name}
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-2xl font-black text-gray-800 dark:text-white tracking-tight"
                                    >
                                        {pet.name} <span className="text-sm opacity-50">🦴</span>
                                    </motion.h2>
                                    <button 
                                        onClick={() => setIsPetSettingsOpen(true)}
                                        className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-emerald-450 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                                    >
                                        <Sliders className="w-4.5 h-4.5" />
                                    </button>
                                </div>
                                <motion.p 
                                    key={pet.breed}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-[11px] font-semibold text-gray-400 dark:text-zinc-400 mt-0.5"
                                >
                                    {pet.breed}
                                </motion.p>
                            </div>
                        </div>

                        {/* AI Dressing Closet Portal */}
                        <motion.div 
                            layoutId="dressing-card-container"
                            onClick={() => setExpandedPanel('dressing')}
                            style={{ transform: "translateZ(25px)" }}
                            className="mt-4 p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 flex justify-between items-center cursor-pointer group hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-300 relative z-10 shadow-inner"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-650 dark:text-purple-400">
                                    <Shirt className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[8.5px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest block">AI TARZI & GARDIROP</span>
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-zinc-300 mt-0.5 block group-hover:text-purple-800 dark:group-hover:text-purple-300 transition-colors">{pet.dressing.activeOutfit}</span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (typeof window !== 'undefined') {
                                        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                                        const query = `petName=${encodeURIComponent(pet.name || 'Zeytin')}&petBreed=${encodeURIComponent(pet.breed || 'Dog')}`;
                                        window.location.href = isLocal ? `http://localhost:5173/?${query}` : `/kombinle?${query}`;
                                    }
                                }}
                                className="flex items-center gap-1 bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/50 text-[9.5px] font-black px-2.5 py-1.5 rounded-xl cursor-pointer transition-all hover:scale-95 shadow-sm shrink-0"
                            >
                                <span>Kombinle</span>
                                <Plus className="w-3 h-3" />
                            </button>
                        </motion.div>

                        {/* Integrated Rings & Quick Stats */}
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-black/10 dark:border-white/10 relative z-10" style={{ transform: "translateZ(30px)" }}>
                            <div onClick={() => window.dispatchEvent(new CustomEvent('open-care-hub', { detail: { tab: 'nutrition' } }))} className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity duration-200">
                                <div className="relative w-12 h-12 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={isDark ? "rgba(34, 197, 94, 0.08)" : "#F0FDF4"} strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${activityPercent}, 100`} />
                                        
                                        <path d="M18 6.0845 a 11.9155 11.9155 0 0 1 0 23.831 a 11.9155 11.9155 0 0 1 0 -23.831" fill="none" stroke={isDark ? "rgba(59, 130, 246, 0.08)" : "#EFF6FF"} strokeWidth="3" />
                                        <path d="M18 6.0845 a 11.9155 11.9155 0 0 1 0 23.831 a 11.9155 11.9155 0 0 1 0 -23.831" fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${waterPercent}, 100`} />
                                        
                                        <path d="M18 10.0845 a 7.9155 7.9155 0 0 1 0 15.831 a 7.9155 7.9155 0 0 1 0 -15.831" fill="none" stroke={isDark ? "rgba(249, 115, 22, 0.08)" : "#FFF7ED"} strokeWidth="3" />
                                        <path d="M18 10.0845 a 7.9155 7.9155 0 0 1 0 15.831 a 7.9155 7.9155 0 0 1 0 -15.831" fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${foodPercent}, 100`} />
                                    </svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-zinc-300 tracking-tight">Günlük Hedefler</span>
                                    <span className="text-[9px] font-semibold text-gray-400 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Gezi
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Su
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Beslenme
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-950/50 flex items-center justify-center">
                                        <Heart className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="currentColor" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Sağlık</span>
                                        <span className="text-[10px] font-black text-gray-750 dark:text-zinc-300">{pet.health}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-zinc-800/50 flex items-center justify-center">
                                        <span className="text-gray-500 dark:text-zinc-400 font-black text-[9px]">KG</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Ağırlık</span>
                                        <span className="text-[10px] font-black text-gray-750 dark:text-zinc-300">{pet.weight}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Integrated Weekly Streak Grid */}
                        <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 flex justify-between items-center relative z-10" style={{ transform: "translateZ(20px)" }}>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">İstikrar Serisi</span>
                                <span className="text-[10px] font-bold text-gray-600 dark:text-zinc-450 mt-0.5">Haftalık Gezi</span>
                            </div>
                            <div className="flex gap-1.5">
                                {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((day, idx) => {
                                    const isCompleted = idx < weeklyStamps;
                                    const isCurrentDay = idx === todayIdx;
                                    return (
                                        <div key={idx} className="flex flex-col items-center">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                                                isCompleted 
                                                    ? 'bg-[#EAF5EC] dark:bg-green-950/40 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 shadow-sm shadow-green-100 dark:shadow-none' 
                                                    : isCurrentDay
                                                        ? 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30 dark:border-purple-500/40 text-purple-600 dark:text-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                                                        : 'bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-700/30 text-gray-300 dark:text-zinc-650'
                                            }`}>
                                                {isCompleted ? '✓' : day}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/30 shrink-0">
                                <span className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">{currentStreak} GÜN 🔥</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ⚡ QUEST ENGINE - Günlük Görevler Bento */}
                <section className="mb-6 px-0">
                    <motion.button
                        whileHover={{ scale: 1.015, y: -1.5, boxShadow: isDark ? '0 12px 30px rgba(139, 92, 246, 0.12)' : '0 12px 30px rgba(99, 102, 241, 0.08)' }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => router.push('/quests')}
                        className={cn(
                            "w-full flex items-center justify-between p-4 rounded-[24px] relative overflow-hidden transition-all duration-300 border cursor-pointer",
                            isDark 
                                ? "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/20 text-white shadow-lg shadow-black/20" 
                                : "bg-gradient-to-r from-indigo-50/70 via-purple-50/70 to-indigo-50/70 border-indigo-200/60 text-slate-800 shadow-[0_12px_32px_rgba(99,102,241,0.04)]"
                        )}
                    >
                        {/* Background glow effects */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl" />
                        
                        {/* Left Content (Icon + Texts) */}
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                                <Trophy className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] animate-pulse" />
                            </div>
                            <div className="flex flex-col text-left">
                                <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                        "text-[13px] font-black tracking-tight transition-colors duration-300",
                                        isDark ? "text-white group-hover:text-amber-300" : "text-slate-800 group-hover:text-indigo-650"
                                    )}>
                                        Görev Merkezi
                                    </span>
                                    <span className={cn(
                                        "text-[8px] font-black px-1.5 py-0.5 rounded-full border transition-colors duration-300",
                                        isDark 
                                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                                            : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    )}>
                                        AKTİF GÖREVLER
                                    </span>
                                </div>
                                <span className={cn(
                                    "text-[9.5px] font-medium mt-1 leading-normal transition-colors duration-300",
                                    isDark ? "text-slate-400" : "text-slate-500"
                                )}>
                                    Günlük hedefleri tamamla, ekstra PatiPuan ve ödüller kazan!
                                </span>
                            </div>
                        </div>

                        {/* Right Content (Chevron/Arrow) */}
                        <div className="flex items-center gap-1.5 relative z-10">
                            <div className={cn(
                                "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300",
                                isDark 
                                    ? "bg-white/5 border-white/10 group-hover:bg-white/10 group-hover:border-white/20 text-slate-300 group-hover:text-white" 
                                    : "bg-slate-200/50 border-slate-200/80 group-hover:bg-slate-200/80 group-hover:border-slate-300 text-slate-500 group-hover:text-slate-700"
                            )}>
                                <ChevronRight className="w-5 h-5 transition-colors" />
                            </div>
                        </div>
                    </motion.button>
                </section>

                {/* 3. Live Walk Tracking Widget - useWalk hook ile canlı */}
                <section className="mb-6">
                    <BentoCard className="bg-white !p-4 flex flex-col gap-4 relative overflow-hidden border border-gray-100/50 shadow-sm transition-all">
                        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-green-500/[0.03] rounded-full pointer-events-none" />
                        
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${activeSession ? 'bg-green-500 animate-ping' : 'bg-gray-300'}`} />
                                    <span className={`text-[10px] font-black tracking-wider uppercase ${activeSession ? 'text-green-700' : 'text-gray-500'}`}>
                                        {activeSession ? 'CANLI • YÜRÜYÜŞTESİN' : 'YÜRÜYÜŞ RADARI'}
                                    </span>
                                </div>
                                <h4 className="text-base font-black text-gray-800 mt-1">
                                    {activeSession ? `${pet.name} Yürüyor! 🐾` : 'Yürüyüşü Başlat'}
                                </h4>
                                <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                                    {activeSession
                                        ? `GPS aktif • ${walkStats?.totalWalks || 0} toplam yürüyüş`
                                        : `${pet.name}'in günlük gezi hedefini tamamlayın`}
                                </p>
                            </div>
                            {activeSession && (
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border bg-green-500 text-white border-green-400">
                                    <Navigation className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        {/* Rota Haritası */}
                        <div className="h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center p-3 relative overflow-hidden shadow-inner">
                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                            <svg className="w-full h-full relative z-10" viewBox="0 0 300 60">
                                {/* Zemin yolu */}
                                <path d="M 10 30 Q 80 10 150 40 T 290 20" fill="none" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
                                {/* Tamamlanan yol — mesafeye göre dolduruluyor */}
                                <path 
                                    d="M 10 30 Q 80 10 150 40 T 290 20" 
                                    fill="none" 
                                    stroke="#22C55E" 
                                    strokeWidth="4" 
                                    strokeLinecap="round" 
                                    strokeDasharray={`${Math.min(280, (activeSession?.distanceKm || 0) * 80)}, 300`}
                                    style={{ transition: 'stroke-dasharray 1s ease' }}
                                />
                                {/* Başlangıç noktası */}
                                <circle cx="10" cy="30" r="4" fill="#22C55E" stroke="white" strokeWidth="2" />
                                {/* Canlı konum noktası */}
                                {activeSession ? (
                                    <>
                                        <circle 
                                            cx={Math.min(280, 10 + (activeSession.distanceKm || 0) * 80)} 
                                            cy={30 - Math.sin((activeSession.distanceKm || 0) * 1.5) * 10}
                                            r="6" fill="#22C55E" stroke="white" strokeWidth="3" 
                                        />
                                        <circle 
                                            cx={Math.min(280, 10 + (activeSession.distanceKm || 0) * 80)} 
                                            cy={30 - Math.sin((activeSession.distanceKm || 0) * 1.5) * 10}
                                            r="12" fill="none" stroke="#22C55E" strokeWidth="1.5" 
                                            className="animate-ping" 
                                        />
                                    </>
                                ) : (
                                    <circle cx="10" cy="30" r="5" fill="#D1D5DB" stroke="white" strokeWidth="2" />
                                )}
                            </svg>
                            <span className="absolute right-4 bottom-2.5 text-[9px] font-bold text-gray-400">
                                {activeSession
                                    ? `${(activeSession.distanceKm || 0).toFixed(2)} / ${pet.ringProgress.activity > 0 ? (pet.ringProgress.activity / 28).toFixed(1) : '3.5'} KM`
                                    : 'GPS ile canlı takip'}
                            </span>
                        </div>

                        {/* İstatistikler & Buton */}
                        <div className="flex justify-between items-center gap-3">
                            <div className="flex gap-4">
                                <div>
                                    <span className="text-[8px] font-bold text-gray-400 uppercase">Süre</span>
                                    <h5 className={`text-[13px] font-black mt-0.5 ${activeSession ? 'text-green-700' : 'text-gray-400'}`}>
                                        {activeSession ? formatWalkTime(walkElapsedSeconds) : '--:--'}
                                    </h5>
                                </div>
                                <div>
                                    <span className="text-[8px] font-bold text-gray-400 uppercase">Mesafe</span>
                                    <h5 className={`text-[13px] font-black mt-0.5 ${activeSession ? 'text-green-700' : 'text-gray-400'}`}>
                                        {activeSession ? `${(activeSession.distanceKm || 0).toFixed(2)} KM` : '— KM'}
                                    </h5>
                                </div>
                                {walkStats && walkStats.totalWalks > 0 && (
                                    <div>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase">Toplam</span>
                                        <h5 className="text-[13px] font-black text-gray-700 mt-0.5">{walkStats.totalDistanceKm?.toFixed(1) || '0'} KM</h5>
                                    </div>
                                )}
                            </div>
                            {activeSession ? (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-walk-panel')); }}
                                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-red-900/10 transition-colors cursor-pointer"
                                >
                                    <span className="w-3.5 h-3.5 bg-white rounded-sm block shrink-0" />
                                    <span>Bitir</span>
                                </button>
                            ) : (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-walk-panel')); }}
                                    className="flex items-center gap-2 bg-[#527958] hover:bg-[#436448] text-white text-[11px] font-black px-4.5 py-2.5 rounded-2xl shadow-md shadow-green-900/10 transition-all hover:scale-[1.02] cursor-pointer"
                                >
                                    <Compass className="w-3.5 h-3.5" />
                                    <span>Yürüyüşe Başla</span>
                                </button>
                            )}
                        </div>

                        {/* Geçmiş yürüyüşler özeti */}
                        {walkHistory.length > 0 && !activeSession && (
                            <div className="pt-3 border-t border-gray-100 flex gap-3 overflow-x-auto no-scrollbar">
                                {walkHistory.slice(0, 3).map((w: any, i: number) => (
                                    <div key={w.id || i} className="shrink-0 bg-gray-50 rounded-2xl px-3 py-2 flex items-center gap-2 border border-gray-100">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                            <Navigation className="w-3 h-3 text-green-600" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-gray-700 block">
                                                {((w.distance_meters || 0) / 1000).toFixed(2)} KM
                                            </span>
                                            <span className="text-[8px] font-semibold text-gray-400">
                                                {w.ended_at ? (() => {
                                                    try {
                                                        const d = new Date(w.ended_at);
                                                        if (isNaN(d.getTime())) return 'Tamamlandı';
                                                        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                                                    } catch {
                                                        return 'Tamamlandı';
                                                    }
                                                })() : 'Tamamlandı'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </BentoCard>
                </section>

                {/* 4. Mini Trends & Comparison Chart (Sağlık Gelişim) - MOVED TO THE TOP */}
                <section className="mb-6">
                    <div className="flex justify-between items-end mb-3 px-1">
                        <h3 className="text-[15px] font-bold text-gray-800 tracking-tight">Haftalık Sağlık & Gelişim</h3>
                        <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" /> +12% Gelişim
                        </span>
                    </div>
                    
                    <BentoCard className="bg-white !p-4 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">Aktivite Seviyesi</h4>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Son 7 günlük gezi ve hareket karşılaştırması</p>
                            </div>
                            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">DENGELİ</span>
                        </div>
                        
                        <div className="h-28 w-full flex items-end relative pt-2">
                            <div className="absolute inset-x-0 top-1/4 border-b border-gray-100/60" />
                            <div className="absolute inset-x-0 top-2/4 border-b border-gray-100/60" />
                            <div className="absolute inset-x-0 top-3/4 border-b border-gray-100/60" />
                            
                            <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 340 100">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#22C55E" stopOpacity="0.15" />
                                        <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                <path d={`M 10 90 L 10 ${100 - pet.weeklyData[0]} Q 60 ${100 - pet.weeklyData[1]} 110 ${100 - pet.weeklyData[2]} T 210 ${100 - pet.weeklyData[4]} T 330 ${100 - pet.weeklyData[6]} L 330 90 Z`} fill="url(#chartGradient)" />
                                <path d={`M 10 ${100 - pet.weeklyData[0]} Q 60 ${100 - pet.weeklyData[1]} 110 ${100 - pet.weeklyData[2]} T 210 ${100 - pet.weeklyData[4]} T 330 ${100 - pet.weeklyData[6]}`} fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
                                
                                {pet.weeklyData.map((val, i) => (
                                    <circle key={i} cx={10 + i * 53} cy={100 - val} r={4} fill="#22C55E" stroke="white" strokeWidth="1.5" />
                                ))}
                            </svg>
                        </div>
                        <div className="flex justify-between mt-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">
                            <span>Pzt</span>
                            <span>Sal</span>
                            <span>Çar</span>
                            <span>Per</span>
                            <span>Cum</span>
                            <span>Cmt</span>
                            <span>Paz</span>
                        </div>
                    </BentoCard>
                </section>

                <section className="mb-6">
                    <h3 className="text-[15px] font-bold text-gray-800 tracking-tight mb-3 px-1">Bugün senin için</h3>
                    <div 
                        ref={communityCardScroll.ref}
                        onMouseDown={communityCardScroll.onMouseDown}
                        onMouseLeave={communityCardScroll.onMouseLeave}
                        onMouseUp={communityCardScroll.onMouseUp}
                        onMouseMove={communityCardScroll.onMouseMove}
                        className="flex gap-3.5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none px-1 cursor-grab active:cursor-grabbing select-none"
                    >
                        
                        {/* Aşı Kartı */}
                        <motion.div 
                            initial={{ opacity: 0, x: 25 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            onClick={() => window.dispatchEvent(new CustomEvent('open-care-hub', { detail: { tab: 'health' } }))}
                            className="w-[160px] h-[140px] shrink-0 snap-start bg-white shadow-[0_4px_12px_rgba(0,0,0,0.015),0_1px_2px_rgba(0,0,0,0.01)] border border-gray-100/80 rounded-[22px] p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:scale-[1.02]"
                        >
                            <div className="flex justify-between items-start">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <Syringe className="w-5 h-5 text-emerald-600" />
                                </div>
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Aşı</span>
                            </div>
                            <div>
                                <h4 className="text-[12px] font-black text-gray-800 leading-tight">Karma Aşı Vakti</h4>
                                <p className="text-[10px] text-gray-400 font-semibold mt-1">3 Gün Kaldı</p>
                            </div>
                        </motion.div>

                        {/* Veteriner Kartı */}
                        <motion.div 
                            initial={{ opacity: 0, x: 25 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            onClick={() => router.push('/vet')}
                            className="w-[160px] h-[140px] shrink-0 snap-start bg-white shadow-[0_4px_12px_rgba(0,0,0,0.015),0_1px_2px_rgba(0,0,0,0.01)] border border-gray-100/80 rounded-[22px] p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:scale-[1.02]"
                        >
                            <div className="flex justify-between items-start">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-orange-500" />
                                </div>
                                <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Randevu</span>
                            </div>
                            <div>
                                <h4 className="text-[12px] font-black text-gray-800 leading-tight">Vet Muayenesi</h4>
                                <p className="text-[10px] text-gray-400 font-semibold mt-1">Yarın • 11:30</p>
                            </div>
                        </motion.div>

                        {/* Kayıp İlanı Kartı */}
                        <motion.div 
                            initial={{ opacity: 0, x: 25 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            onClick={() => router.push('/topluluk?tab=radar&mode=lost')}
                            className="w-[160px] h-[140px] shrink-0 snap-start bg-white shadow-[0_4px_12px_rgba(0,0,0,0.015),0_1px_2px_rgba(0,0,0,0.01)] border border-gray-100/80 rounded-[22px] p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:scale-[1.02]"
                        >
                            <div className="flex justify-between items-start">
                                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-red-500" />
                                </div>
                                <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Kayıp</span>
                            </div>
                            <div>
                                <h4 className="text-[12px] font-black text-gray-800 leading-tight">Çevrede Kayıp</h4>
                                <p className="text-[10px] text-gray-400 font-semibold mt-1">1.2 KM Yakınında</p>
                            </div>
                        </motion.div>

                        {/* Aktivite / Yürüyüş Kartı */}
                        <motion.div 
                            initial={{ opacity: 0, x: 25 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="w-[160px] h-[140px] shrink-0 snap-start bg-white shadow-[0_4px_12px_rgba(0,0,0,0.015),0_1px_2px_rgba(0,0,0,0.01)] border border-gray-100/80 rounded-[22px] p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:scale-[1.02]"
                        >
                            <div className="flex justify-between items-start">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-blue-500" />
                                </div>
                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Hedef</span>
                            </div>
                            <div>
                                <h4 className="text-[12px] font-black text-gray-800 leading-tight">Yürüyüş Hedefi</h4>
                                <p className="text-[10px] text-gray-400 font-semibold mt-1">240 Adım Kaldı</p>
                            </div>
                        </motion.div>

                    </div>
                </section>

                <section className="mb-6">
                    <h3 className="text-[15px] font-bold text-gray-800 tracking-tight mb-3 px-1">Hızlı erişim</h3>
                    <div className="grid grid-cols-2 gap-3.5">
                        <QuickAccessBtn icon={Radio} title="Kayıp & Sahiplen" subtitle="İlan Merkezi" color="text-red-500" delay={0.1} onClick={() => router.push('/topluluk?tab=radar')} />
                        <QuickAccessBtn icon={Compass} title="Topluluk" subtitle="Moffi Kaşif Dünyası" color="text-blue-500" delay={0.2} onClick={() => router.push('/topluluk')} />
                        <QuickAccessBtn icon={ShoppingBag} title="Moffi Market" subtitle="Online Alışveriş" color="text-rose-500" delay={0.3} onClick={() => window.open('https://moffi.net', '_blank')} />
                        <QuickAccessBtn icon={Scissors} title="Bakım Merkezi" subtitle="Mama, Su ve Sağlık Hub" color="text-teal-600" delay={0.6} onClick={() => window.dispatchEvent(new CustomEvent('open-care-hub', { detail: { tab: 'nutrition' } }))} />
                    </div>
                </section>

                {/* 7. Promotional Banner - MOVED TO THE TOP */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative bg-[#F4EFE7] rounded-[28px] p-6 overflow-hidden flex justify-between items-center shadow-sm border border-orange-100/20 mb-8"
                >
                    <div className="relative z-10">
                        <h4 className="text-lg font-black text-gray-800 tracking-tight mb-1">Onlar bize emanet.</h4>
                        <p className="text-xs text-gray-600 font-medium mb-4">Biz de onlara.</p>
                        <button className="bg-gray-700 hover:bg-gray-800 text-white text-[11px] font-bold px-4 py-2 rounded-full cursor-pointer transition-colors">Keşfet</button>
                    </div>
                    <div className="absolute right-0 bottom-0 h-[120%] w-[60%] pointer-events-none">
                        <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=400" className="w-full h-full object-cover object-left-bottom mix-blend-multiply opacity-90" alt="Dog and Owner" />
                    </div>
                    <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/30 backdrop-blur-md rounded-full">
                        <Heart className="w-4 h-4 text-gray-700" />
                    </button>
                </motion.div>



                {/* Eski Akıllı Tasma Durumu kartı buradan kaldırıldı (header alanına taşındı) */}


                {/* 12. Dynamic Shop Live Offer */}
                <section className="mb-6">
                    <div className="flex justify-between items-end mb-3 px-1">
                        <h3 className="text-[15px] font-bold text-gray-800 tracking-tight">Kişiselleştirilmiş Alışveriş Fırsatı</h3>
                        <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Akıllı Takip
                        </span>
                    </div>

                    <BentoCard 
                        layoutId="shop-card-container"
                        onClick={() => setExpandedPanel('shop')}
                        className="bg-gradient-to-br from-amber-50/70 to-orange-50/50 !p-4 border border-orange-100/30 flex gap-4 items-center relative overflow-hidden cursor-pointer group hover:scale-[1.01] transition-transform duration-300"
                    >
                        <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-orange-400/5 rounded-full blur-xl pointer-events-none" />
                        <div className="w-16 h-16 rounded-2xl bg-white border border-orange-100/60 p-2 flex items-center justify-center shadow-sm shrink-0">
                            <ShoppingBag className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">{pet.specialOffer.discount}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            </div>
                            <h4 className="text-xs font-black text-gray-800 mt-0.5">{pet.name}'in {pet.specialOffer.title}</h4>
                            <p className="text-[10px] font-semibold text-gray-500 mt-0.5 leading-snug">{pet.specialOffer.desc}</p>
                            
                            <div className="mt-2.5 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 line-through">{pet.specialOffer.oldPrice}</span>
                                <span className="text-xs font-black text-orange-600">{pet.specialOffer.newPrice}</span>
                            </div>
                        </div>
                    </BentoCard>
                </section>

                {/* 13. AI Assistant Advice Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/60 rounded-3xl p-4 flex items-start gap-3 shadow-sm relative overflow-hidden"
                >
                    <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/40 blur-xl rounded-full pointer-events-none" />
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 text-white shrink-0">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black tracking-widest text-purple-700 uppercase">MOFFI AI ÖNERİSİ</span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[8px] font-black text-purple-700 uppercase tracking-widest">Canlı</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-700 mt-1 leading-relaxed">
                            Hava bugün Kadıköy'de çok sıcak. {pet.name}'in patilerini korumak için yürüyüşünüzü akşam 19:30 sonrasına planlayabilirsiniz.
                        </p>
                    </div>
                </motion.div>
                    </>
                )}

            </motion.div>



            {/* 3D FLUID CARD MORPHING OVERLAYS */}
            <AnimatePresence>
                {expandedPanel && (
                    <>
                        {/* Dim Backdrop with Blur */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setExpandedPanel(null)}
                            className="fixed inset-0 bg-black/35 backdrop-blur-md z-[100] cursor-pointer"
                        />

                        {/* MORPHED FULL CONTAINER SHEET */}
                        <div className={`fixed inset-0 z-[101] flex items-center justify-center pointer-events-none ${expandedPanel === 'profile' ? 'p-0' : 'p-4'}`}>
                            <motion.div
                                layoutId={`${expandedPanel}-card-container`}
                                transition={{ type: 'spring', damping: 22, stiffness: 180 }}
                                className={expandedPanel === 'profile' 
                                    ? "w-full md:max-w-md h-full md:h-[95vh] md:max-h-[850px] bg-[#FBFBFB] rounded-none md:rounded-[40px] shadow-[0_25px_60px_rgba(0,0,0,0.18)] border-0 md:border border-gray-100 overflow-hidden pointer-events-auto flex flex-col overflow-y-auto no-scrollbar"
                                    : "w-full max-w-sm bg-white rounded-[38px] shadow-[0_25px_60px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden pointer-events-auto flex flex-col max-h-[80vh] overflow-y-auto"
                                }
                            >
                                {/* Drag Indicator & Close Pill */}
                                {expandedPanel === 'profile' ? (
                                    <div className="flex justify-between items-center px-6 py-4.5 bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20 shadow-[0_2px_15px_rgba(0,0,0,0.01)] shrink-0">
                                        <motion.button 
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setExpandedPanel(null)}
                                            className="flex items-center gap-1 text-[11px] font-black text-gray-800 cursor-pointer"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-gray-850" strokeWidth={2.5} />
                                            <span>Geri</span>
                                        </motion.button>
                                        <span className="text-sm font-black text-gray-900 tracking-tight">Moffi Hesabım</span>
                                        <motion.button 
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => window.dispatchEvent(new CustomEvent('open-moffi-settings'))}
                                            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl cursor-pointer transition-colors"
                                        >
                                            <Sliders className="w-4.5 h-4.5" />
                                        </motion.button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center px-6 pt-5 pb-3 bg-gray-50/50 border-b border-gray-100/50 shrink-0">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase">Moffi Smartwatch OS</span>
                                        </div>
                                        <motion.button 
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setExpandedPanel(null)}
                                            className="p-1.5 bg-gray-200/60 hover:bg-gray-200 text-gray-600 rounded-full cursor-pointer transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                )}

                                {/* Deep Modular Expanded Views */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15, duration: 0.3 }}
                                    className="p-6 flex-1 flex flex-col gap-5"
                                >
                                    
                                    {/* 1. Wallet Morph Screen */}
                                    {expandedPanel === 'wallet' && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Coins className="w-6 h-6 text-yellow-500" />
                                                    <h3 className="text-lg font-black text-gray-800">Cüzdan Analizi</h3>
                                                </div>
                                                <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 px-2.5 py-0.5 rounded-full border border-yellow-200">
                                                    {pet.wallet.currency}
                                                </span>
                                            </div>

                                            {/* Bank Card Graphic */}
                                            <div className="bg-gradient-to-tr from-gray-950 to-gray-850 text-white p-5 rounded-[26px] border border-gray-800/80 shadow-md relative overflow-hidden">
                                                <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
                                                <span className="text-[8px] font-black tracking-widest text-gray-400 block">CARDMEMBERSHIP</span>
                                                <h4 className="text-2xl font-black mt-4 tracking-tight flex items-baseline gap-1">
                                                    {walletBalance.toLocaleString('tr-TR')} <span className="text-xs text-yellow-400 font-bold">{pet.wallet.currency}</span>
                                                </h4>
                                                <div className="flex justify-between items-end mt-6">
                                                    <span className="text-[10px] text-gray-400 font-mono tracking-wider">{pet.wallet.cardNumber}</span>
                                                    <span className="text-[9px] font-black bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider">{pet.name} Pass</span>
                                                </div>
                                            </div>

                                            {/* Advanced Action Panel */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <button className="flex items-center justify-center gap-1 bg-[#EAF5EC] hover:bg-green-100 border border-green-200 p-3 rounded-2xl text-[11px] font-black text-green-700 transition-all cursor-pointer">
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Bakiye Yükle</span>
                                                </button>
                                                <button className="flex items-center justify-center gap-1 bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 p-3 rounded-2xl text-[11px] font-black text-blue-700 transition-all cursor-pointer">
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                    <span>Patipuan Yolla</span>
                                                </button>
                                            </div>

                                            {/* Transaction Feed */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Son Hesap Hareketleri</h4>
                                                <div className="flex flex-col gap-2">
                                                    {pet.wallet.transactions.map((tx) => (
                                                        <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100/50">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                                    tx.type === 'gider' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                                                }`}>
                                                                    {tx.type === 'gider' ? <CartIcon className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-[10.5px] font-bold text-gray-800">{tx.title}</h5>
                                                                    <span className="text-[8.5px] text-gray-400 font-semibold">{tx.date}</span>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[11px] font-black ${
                                                                tx.type === 'gider' ? 'text-orange-600' : 'text-green-600'
                                                            }`}>{tx.amount}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* 2. Passport Morph Screen */}
                                    {expandedPanel === 'passport' && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <QrCode className="w-6 h-6 text-orange-600" />
                                                <h3 className="text-lg font-black text-gray-800">{pet.name}'in Sağlık Pasaportu</h3>
                                            </div>

                                            {/* NFC Interactive Tag Card */}
                                            <div className="bg-[#FAF5EF] border border-orange-200/55 p-5 rounded-[26px] flex flex-col items-center gap-4 text-center">
                                                <motion.div 
                                                    animate={{ rotateY: 360 }}
                                                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                                                    className="w-24 h-24 bg-white rounded-2xl p-2.5 shadow-sm border border-orange-100 flex items-center justify-center"
                                                >
                                                    <img src={pet.passport.qrcode} className="w-full h-full object-contain" alt="QR" />
                                                </motion.div>
                                                <div>
                                                    <span className="text-[8px] font-black text-orange-800 tracking-widest uppercase">NFC AKILLI ÇİP AKTİF</span>
                                                    <h4 className="text-lg font-black text-gray-800 mt-1">{pet.passport.idCode}</h4>
                                                </div>
                                            </div>

                                            {/* Vaccine Checkboxes */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Aşılama Kayıtları</h4>
                                                <div className="flex flex-col gap-2">
                                                    {pet.passport.vaccines.map((v, i) => (
                                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100/50">
                                                            <div>
                                                                <h5 className="text-[11px] font-bold text-gray-850">{v.name}</h5>
                                                                <span className="text-[8.5px] text-gray-400 font-semibold">Tarih: {v.date}</span>
                                                            </div>
                                                            <span className={`text-[10px] font-black uppercase tracking-wider ${v.color}`}>{v.status}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <button className="w-full bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-black py-3.5 rounded-2xl cursor-pointer transition-colors shadow-md shadow-gray-900/10">
                                                Çip Bilgilerini Paylaş
                                            </button>
                                        </>
                                    )}

                                    {/* 3. Smart Collar Morph Screen */}
                                    {expandedPanel === 'collar' && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Radio className="w-6 h-6 text-green-600" />
                                                    <h3 className="text-lg font-black text-gray-800">Tasma Kontrolü</h3>
                                                </div>
                                                <span className="text-[9px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                                    {pet.collar.signal}
                                                </span>
                                            </div>

                                            {/* Real-time battery status */}
                                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <Battery className="w-8 h-8 text-green-600" />
                                                    <div>
                                                        <span className="text-[9px] font-bold text-gray-400 block">KALAN BATARYA</span>
                                                        <h4 className="text-base font-black text-gray-800 mt-0.5">%{pet.collar.battery}</h4>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] font-bold text-gray-400 block">SON SENKRONİZASYON</span>
                                                    <span className="text-[10.5px] font-bold text-gray-700 mt-0.5 block">{pet.collar.lastSync}</span>
                                                </div>
                                            </div>

                                            {/* Hardware Signal Waves Simulation */}
                                            <div className="h-24 bg-gray-950 rounded-2xl flex flex-col items-center justify-center p-4 text-center font-mono text-[9px] text-green-400 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-green-500/[0.02] flex items-center justify-center">
                                                    <span className="w-16 h-16 rounded-full border border-green-50/20 animate-ping absolute" />
                                                    <span className="w-8 h-8 rounded-full border border-green-50/35 animate-ping absolute" />
                                                </div>
                                                <span className="text-[8px] text-gray-500 uppercase tracking-widest mb-1.5 block">Live Bluetooth RSSI</span>
                                                <span className="text-xs font-black">{pet.collar.rssi}</span>
                                                <span className="text-[8px] text-gray-500 mt-2 block">Firmware: {pet.collar.firmware}</span>
                                            </div>

                                            {/* Alarm buzzer buttons */}
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Uzaktan Akustik Komutlar</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button className="flex items-center justify-center gap-1.5 p-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl transition-all cursor-pointer text-xs font-bold text-gray-700">
                                                    <Volume2 className="w-4 h-4 text-gray-600" />
                                                    <span>Ses Sinyali Gönder</span>
                                                </button>
                                                <button className="flex items-center justify-center gap-1.5 p-3.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all cursor-pointer text-xs font-bold text-red-700">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span>Tasmayı Çaldır</span>
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {/* 4. AI Dressing Morph Screen (Talking Tom Interactive Dressing Studio) */}
                                    {expandedPanel === 'dressing' && (
                                        <div className="relative w-full h-[650px] bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-150 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col">
                                            {/* Header bar with Back button */}
                                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-950">
                                                <span className="text-xs font-black text-foreground dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                                                    👕 Moffi Kombinle
                                                </span>
                                                <button 
                                                    onClick={() => setExpandedPanel(null)}
                                                    className="px-4 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                                >
                                                    Geri Dön
                                                </button>
                                            </div>
                                            {/* Kombinle Iframe */}
                                            <div className="flex-1 w-full h-full relative">
                                                <iframe 
                                                    src="http://localhost:5173" 
                                                    className="absolute inset-0 w-full h-full border-0"
                                                    title="Moffi Kombinle"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* 5. Quests Morph Screen */}
                                    {expandedPanel === 'quests' && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Coins className="w-6 h-6 text-yellow-500" />
                                                    <h3 className="text-lg font-black text-gray-800">Ödül Avı</h3>
                                                </div>
                                                <span className="text-[9px] font-black text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                                                    2 / 3 Bitti
                                                </span>
                                            </div>

                                            {/* Detailed quest progress card */}
                                            <div className="p-4 bg-gradient-to-tr from-yellow-500/10 to-yellow-600/5 border border-yellow-200/40 rounded-2xl mb-1 text-center">
                                                <span className="text-[9px] font-black text-yellow-700 tracking-wider uppercase block">BU HAFTAKİ HEDEF</span>
                                                <h4 className="text-base font-black text-gray-800 mt-0.5">+150 PATIPUAN Sandığı</h4>
                                                <div className="w-full h-2.5 bg-gray-150 rounded-full overflow-hidden mt-3 relative">
                                                    <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full" style={{ width: '66%' }} />
                                                </div>
                                                <span className="text-[9.5px] font-semibold text-gray-500 mt-2 block">1000 Patipuana son 150 P kaldı!</span>
                                            </div>

                                            {/* Quests status lists */}
                                            
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Günlük Görev Çizelgesi</h4>
                                            <div className="flex flex-col gap-2.5">
                                                {pet.quests.map((q) => (
                                                    <div key={q.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100/50">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className={`w-4 h-4 ${q.done ? 'text-green-600' : 'text-gray-300'}`} fill={q.done ? 'currentColor' : 'none'} />
                                                            <span className={`text-[10.5px] font-bold ${q.done ? 'text-gray-550 line-through' : 'text-gray-700'}`}>{q.text}</span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-yellow-600 bg-yellow-50/50 px-1.5 py-0.5 rounded border border-yellow-100">+50 P</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* 6. Shop Morph Screen */}
                                    {expandedPanel === 'shop' && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag className="w-6 h-6 text-orange-600" />
                                                <h3 className="text-lg font-black text-gray-800">Kişiselleştirilmiş Fırsat</h3>
                                            </div>
 
                                            {/* Special card */}
                                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-[26px] border border-orange-100/60 shadow-sm flex flex-col gap-4 text-center">
                                                <div className="w-16 h-16 rounded-2xl bg-white border border-orange-100 p-2 flex items-center justify-center shadow-sm mx-auto">
                                                    <ShoppingBag className="w-8 h-8 text-orange-600" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-orange-700 tracking-wider block uppercase">{pet.specialOffer.discount}</span>
                                                    <h4 className="text-base font-black text-gray-800 mt-1">{pet.name}'in {pet.specialOffer.title}</h4>
                                                    <p className="text-xs text-gray-550 font-semibold mt-1 leading-snug">{pet.specialOffer.desc}</p>
                                                </div>
                                            </div>
 
                                            {/* Buy buttons */}
                                            <div className="flex justify-between items-center p-4 bg-gray-50 border border-gray-150 rounded-2xl">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Toplam Fiyat</span>
                                                    <span className="text-lg font-black text-orange-600">{pet.specialOffer.newPrice} <span className="text-[10px] text-gray-400 line-through font-bold">{pet.specialOffer.oldPrice}</span></span>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => setExpandedPanel(null)}
                                                    className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black tracking-wider uppercase cursor-pointer transition-colors"
                                                >
                                                    Hemen Sipariş Ver
                                                </button>
                                            </div>
                                        </>
                                    )}



                                    {/* 8. Etkinlikler (Events) Panel */}
                                    {expandedPanel === 'events' && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="w-6 h-6 text-indigo-500" />
                                                    <h3 className="text-lg font-black text-gray-800">Etkinlik Biletlerim</h3>
                                                </div>
                                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                                                    1 Bilet Aktif
                                                </span>
                                            </div>

                                            {/* Barcode Ticket */}
                                            <div className="bg-gradient-to-tr from-indigo-950 via-indigo-900 to-indigo-850 text-white p-5 rounded-[28px] border border-indigo-800/80 shadow-[0_12px_25px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col gap-4">
                                                <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                                                
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-[8px] font-black tracking-widest text-indigo-300 block">MOFFI KULÜP BİLETİ</span>
                                                        <h4 className="text-sm font-black mt-1 leading-snug">Kadıköy Patimaratonu</h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-black bg-indigo-500/30 text-indigo-350 border border-indigo-500/30 px-2 py-0.5 rounded">
                                                            STANDART
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 border-t border-b border-white/10 py-3 text-[10px] font-mono">
                                                    <div>
                                                        <span className="text-indigo-300 block text-[8px] font-sans font-bold">TARİH & SAAT</span>
                                                        <span className="font-bold text-white block mt-0.5">24 Mayıs 2026, 14:00</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-indigo-300 block text-[8px] font-sans font-bold">KONUM</span>
                                                        <span className="font-bold text-white block mt-0.5">Caddebostan Sahil Parkı</span>
                                                    </div>
                                                </div>

                                                {/* Barcode */}
                                                <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-inner">
                                                    {/* Barcode lines */}
                                                    <div className="flex w-full justify-between h-9 items-stretch px-2">
                                                        {[2, 4, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1].map((w, i) => (
                                                            <div 
                                                                key={i} 
                                                                className="bg-gray-905 rounded-sm"
                                                                style={{ width: `${w}px` }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[9px] font-mono text-gray-500 tracking-[0.3em] font-semibold leading-none">MF-2026-9901A</span>
                                                </div>
                                            </div>

                                            {/* Nearby Events List */}
                                            <div className="flex flex-col gap-2.5">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Yakındaki Diğer Etkinlikler</h4>
                                                
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100/50">
                                                        <div>
                                                            <h5 className="text-[11px] font-black text-gray-800">☕ Patili Yoga & Kahve</h5>
                                                            <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Moda Parkı • 28 Mayıs Cumartesi</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => setToastMsg("🎟️ Patili Yoga bilet talebi alındı!")}
                                                            className="text-[9.5px] font-black text-indigo-650 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1.5 rounded-xl cursor-pointer"
                                                        >
                                                            Kayıt Ol
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100/50">
                                                        <div>
                                                            <h5 className="text-[11px] font-black text-gray-800">🌭 Sosis Arama Yarışması</h5>
                                                            <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Göztepe Parkı • 30 Mayıs Pazar</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => setToastMsg("🎟️ Sosis Arama Yarışması bilet talebi alındı!")}
                                                            className="text-[9.5px] font-black text-indigo-650 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1.5 rounded-xl cursor-pointer"
                                                        >
                                                            Kayıt Ol
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {expandedPanel === 'profile' && (
                                        <div className="flex flex-col gap-6 pb-24">
                                            {/* 1. Header: User Greeting & VIP Status */}
                                            <div className="flex items-center gap-4 p-4.5 bg-gradient-to-tr from-gray-900 to-gray-800 rounded-3xl border border-gray-700/30 text-white shadow-lg relative overflow-hidden shrink-0">
                                                <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
                                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-green-400 shadow-md shrink-0 relative group cursor-pointer"
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = 'image/*';
                                                        input.onchange = async (e: any) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            try {
                                                                const { apiService: api } = await import('@/services/apiService');
                                                                const url = await api.uploadMedia(file, 'avatars');
                                                                await updateProfile({ avatar: url });
                                                                setToastMsg('✅ Profil fotoğrafı güncellendi!');
                                                            } catch {
                                                                setToastMsg('❌ Fotoğraf yüklenemedi.');
                                                            }
                                                        };
                                                        input.click();
                                                    }}
                                                >
                                                    <UserAvatar
                                                        avatar={authUser?.avatar}
                                                        name={authUser?.name}
                                                        username={authUser?.username}
                                                        email={authUser?.email}
                                                        size="lg"
                                                    />
                                                    {/* Hover overlay — fotoğraf yükle */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                                        <span className="text-white text-[9px] font-black text-center leading-tight px-1">Değiştir</span>
                                                    </div>
                                                    <div className="absolute bottom-0 right-0 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-black tracking-tight leading-tight">
                                                            Merhaba, {authUser?.username || authUser?.name || authUser?.email?.split('@')[0] || 'Moffi Kullanıcısı'}! 👋
                                                        </h3>
                                                        <span className="text-[8px] font-black text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 uppercase tracking-widest flex items-center gap-0.5">
                                                            <Award className="w-2.5 h-2.5" /> {authUser?.is_prime ? 'PRIME' : authUser?.subscription_status || 'FREE'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-300 font-semibold mt-1">
                                                        {authUser?.email ? authUser.email.replace(/(.{2}).*(@.*)/, '$1***$2') : ''} • {authUser?.is_prime ? 'Prime Üye' : authUser?.subscription_status === 'premium' ? 'Premium' : 'Üye'}
                                                    </p>
                                                    {!hasNoPets && (
                                                        <div className="mt-2 text-[9px] text-green-300 font-bold bg-green-500/15 border border-green-500/25 px-2 py-0.5 rounded-md inline-block">
                                                            🐾 {pet.name} • {pet.breed || 'Kayıtlı Pet'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Profil Fotoğrafı Yönetimi */}
                                            <div className="flex items-center gap-2 px-1">
                                                <button
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = 'image/*';
                                                        input.onchange = async (e: any) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            try {
                                                                const { apiService: api } = await import('@/services/apiService');
                                                                const url = await api.uploadMedia(file, 'avatars');
                                                                await updateProfile({ avatar: url });
                                                                setToastMsg('✅ Profil fotoğrafı güncellendi!');
                                                            } catch {
                                                                setToastMsg('❌ Fotoğraf yüklenemedi.');
                                                            }
                                                        };
                                                        input.click();
                                                    }}
                                                    className="text-[9px] text-gray-400 font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
                                                >
                                                    📷 Fotoğraf Değiştir
                                                </button>
                                                {authUser?.avatar && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await updateProfile({ avatar: undefined });
                                                                setToastMsg('✅ Fotoğraf kaldırıldı.');
                                                            } catch {
                                                                setToastMsg('❌ İşlem başarısız.');
                                                            }
                                                        }}
                                                        className="text-[9px] text-red-400 font-bold bg-red-500/5 border border-red-500/20 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                                                    >
                                                        🗑 Kaldır
                                                    </button>
                                                )}
                                            </div>


                                            {hasNoPets ? (
                                                <div className="p-6 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-green-500/10 rounded-[2rem] text-center flex flex-col items-center gap-4 my-2 shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
                                                    <div className="w-16 h-16 rounded-[1.8rem] bg-gradient-to-tr from-emerald-450 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white text-3xl">
                                                        🐾
                                                    </div>
                                                    <h4 className="text-base font-black text-gray-805 tracking-tight leading-tight">Henüz Evcil Hayvanınız Yok</h4>
                                                    <p className="text-xs font-semibold text-gray-450 leading-relaxed max-w-[280px]">
                                                        Moffi'nin akıllı tasma, pasaport, dijital kimlik ve cüzdan özelliklerini kullanabilmek için ilk dostunuzu kaydetmeniz gerekir.
                                                    </p>
                                                    <button 
                                                        onClick={() => {
                                                            setExpandedPanel(null);
                                                            setIsAddPetOpen(true);
                                                        }}
                                                        className="w-full py-4.5 bg-[#527958] hover:bg-[#436448] text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-green-900/10 cursor-pointer"
                                                    >
                                                        Evcil Hayvan Ekle
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                            {/* 2. Moffi Pay & Contactless Collar Card (Pati-Kart) */}
                                            <div className="flex flex-col gap-3">
                                                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase px-1">FINANSAL PORTFÖY & TEMASSIZ PATİ-KART</span>
                                                
                                                {/* The Interactive Black/Gold Card */}
                                                <div className="bg-gradient-to-tr from-gray-950 via-gray-900 to-gray-850 text-white p-5 rounded-[28px] border border-gray-800/80 shadow-[0_12px_30px_rgba(0,0,0,0.12)] relative overflow-hidden group">
                                                    <div className="absolute right-[-20px] top-[-20px] w-36 h-36 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-1.5">
                                                            <CreditCard className="w-5 h-5 text-yellow-450" />
                                                            <span className="text-[9px] font-black text-gray-300 tracking-widest">MOFFI PATİ-KART (NFC)</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                                                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                                            <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Aktif</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-8 flex justify-between items-end">
                                                        <div>
                                                            <span className="text-[9px] font-bold text-gray-455 uppercase block">Cüzdan Bakiyesi</span>
                                                            <h3 className="text-2xl font-black tracking-tight mt-0.5 flex items-baseline gap-1">
                                                                {walletBalance.toLocaleString('tr-TR')} <span className="text-xs font-black text-yellow-400">{pet.wallet.currency}</span>
                                                            </h3>
                                                        </div>
                                                        <div className="text-right font-mono">
                                                            <span className="text-[9px] font-bold text-gray-455 block">{pet.name} Smartcollar Pay</span>
                                                            <span className="text-[9px] font-semibold text-gray-500 tracking-wider mt-0.5 block">{pet.wallet.cardNumber}</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                                                        <span className="text-[12px] shrink-0">📶</span>
                                                        <p className="text-[9px] text-gray-400 font-semibold leading-normal">
                                                            **Temassız Ödeme (NFC)** aktif! {pet.name} anlaşmalı pet-friendly kafe ve marketlerde ödemeyi tasmasındaki akıllı çiple patisini dokundurarak saniyeler içinde tamamlasın!
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <button 
                                                        onClick={() => {
                                                            setWalletBalance(prev => prev + 500);
                                                            setToastMsg("💳 Hesabınıza 500 Patipuan başarıyla yüklendi!");
                                                        }}
                                                        className="flex items-center justify-center gap-1.5 bg-[#EAF5EC] hover:bg-green-100 border border-green-200/60 p-3.5 rounded-2xl text-[11px] font-black text-green-700 transition-all cursor-pointer shadow-sm"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>Bakiye Yükle</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setToastMsg("💸 Puan transfer arayüzü başlatılıyor...");
                                                        }}
                                                        className="flex items-center justify-center gap-1.5 bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200/60 p-3.5 rounded-2xl text-[11px] font-black text-blue-700 transition-all cursor-pointer shadow-sm"
                                                    >
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                        <span>Puan Transferi</span>
                                                    </button>
                                                </div>

                                                {/* Pati-Kart Security Settings */}
                                                <div className="bg-white border border-gray-100 rounded-3xl p-4.5 shadow-[0_4px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-650 shrink-0">
                                                                <Lock className="w-4.5 h-4.5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[11.5px] font-black text-gray-800">Pati-Kart Güvenlik Kilidi</h4>
                                                                <p className="text-[9.5px] text-gray-400 font-semibold mt-0.5">Tasmanın NFC ödemelerini geçici olarak kilitle</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                setNfcPaymentLocked(!nfcPaymentLocked);
                                                                setToastMsg(nfcPaymentLocked ? "🔓 Pati-Kart ödeme kilidi kaldırıldı!" : "🔒 Pati-Kart geçici olarak kilitlendi!");
                                                            }}
                                                            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 duration-300 ${nfcPaymentLocked ? 'bg-red-500' : 'bg-gray-200'}`}
                                                        >
                                                            <motion.div 
                                                                layout 
                                                                className="w-5 h-5 bg-white rounded-full shadow-sm" 
                                                                animate={{ x: nfcPaymentLocked ? 20 : 0 }}
                                                            />
                                                        </button>
                                                    </div>

                                                    <div className="border-t border-gray-100 pt-3">
                                                        <div className="flex justify-between items-center mb-2.5">
                                                            <span className="text-[10.5px] font-black text-gray-700">Günlük Limit</span>
                                                            <span className="text-xs font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">{dailySpendLimit} PATI</span>
                                                        </div>
                                                        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200/40 gap-1">
                                                            {[100, 250, 500, 1000].map((limit) => (
                                                                <button 
                                                                    key={limit}
                                                                    onClick={() => {
                                                                        setDailySpendLimit(limit);
                                                                        setToastMsg(`💸 Günlük limit ${limit} PATI olarak güncellendi.`);
                                                                    }}
                                                                    className={`flex-1 text-[9.5px] font-black py-2 rounded-xl transition-all cursor-pointer text-center relative ${
                                                                        dailySpendLimit === limit 
                                                                            ? 'bg-white text-gray-900 shadow-sm' 
                                                                            : 'text-gray-400 hover:text-gray-650'
                                                                    }`}
                                                                >
                                                                    {limit} P
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 3. Moffi Link™ Akıllı Tasma OS & AI Çevirmen */}
                                            <div className="flex flex-col gap-3">
                                                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase px-1">AKILLI TASMA (IoT) OS & AI SES ANALİZİ</span>
                                                
                                                <div className="bg-white border border-gray-100 rounded-3xl p-4.5 shadow-[0_4px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                                                    {/* Tasma Konfigürasyonu */}
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                                                <Radio className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[11.5px] font-black text-gray-800">Moffi Link™ Akıllı Tasma</h4>
                                                                <p className="text-[9.5px] text-gray-400 font-semibold mt-0.5">Sinyal Gücü: {pet.collar.signal} • GSM %88</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-black text-green-700 bg-green-50 border border-green-200/60 px-2 py-0.5 rounded-full uppercase">
                                                            BAĞLI
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3.5 bg-gray-55 border border-gray-100/50 p-3 rounded-2xl text-center">
                                                        <div>
                                                            <span className="text-[8px] font-bold text-gray-400 block uppercase">TASMA İÇİ SICAKLIK</span>
                                                            <span className="text-[12px] font-black text-gray-750 mt-1 block">🌡️ 24.2°C • İdeal</span>
                                                        </div>
                                                        <div className="border-l border-gray-200/70">
                                                            <span className="text-[8px] font-bold text-gray-400 block uppercase">GÜVENLİK ÇİTİ (GPS)</span>
                                                            <span className="text-[12px] font-black text-green-600 mt-1 block">📍 Güvenli Çember</span>
                                                        </div>
                                                    </div>

                                                    {/* AI Translator & Bark Logger */}
                                                    <div className="p-3.5 bg-purple-50/50 border border-purple-100/80 rounded-2xl flex flex-col gap-2">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-1.5">
                                                                <Sparkles className="w-4 h-4 text-purple-600" />
                                                                <span className="text-[9px] font-black text-purple-700 uppercase tracking-widest">AI SES TERCÜMANI (HAV-GÜNLÜĞÜ)</span>
                                                            </div>
                                                            <span className="text-[8px] font-black text-purple-600 bg-purple-100/40 px-1.5 py-0.5 rounded">4 Kayıt</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-gray-700 mt-1 leading-normal">
                                                            📢 **{pet.name} en son 11:20'de havladı.** AI Ses Teşhisi: **"Açlık veya İlgi Arayışı" (%85 güvenilirlik)**. Son 24 saat stres skoru stabil.
                                                        </p>
                                                    </div>

                                                    {/* SOS / Lost Mode warning and activator */}
                                                    <div className={`p-3.5 border rounded-2xl flex flex-col gap-2 transition-all ${
                                                        lostPetMode 
                                                            ? 'bg-red-50 border-red-200 text-red-700 shadow-sm animate-pulse' 
                                                            : 'bg-gray-50 border-gray-100 text-gray-550'
                                                    }`}>
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-1.5 font-black text-[9.5px]">
                                                                <span>🚨</span>
                                                                <span className={lostPetMode ? 'text-red-700' : 'text-gray-600'}>ACİL SOS / KAYIP MODU</span>
                                                            </div>
                                                            <button 
                                                                onClick={async () => {
                                                                    if (lostPetMode) {
                                                                        updatePet(pet.id, { is_lost: false });
                                                                        try {
                                                                            await apiService.togglePetSosStatus(pet.id, 'safe');
                                                                        } catch (e) {
                                                                            console.error(e);
                                                                        }
                                                                        setToastMsg(`🔕 Kayıp Modu Kapatıldı. ${pet.name} güvende.`);
                                                                    } else {
                                                                        window.dispatchEvent(new CustomEvent('open-sos-center', { detail: pet }));
                                                                    }
                                                                }}
                                                                className={`text-[9px] font-black px-2.5 py-1.5 rounded-xl cursor-pointer transition-all border ${
                                                                    lostPetMode 
                                                                        ? 'bg-red-600 text-white border-red-700 shadow-sm' 
                                                                        : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                                                                }`}
                                                            >
                                                                {lostPetMode ? "Kayıp Modunu Kapat" : "Kayıp Modunu Aç"}
                                                            </button>
                                                        </div>
                                                        <p className="text-[9.5px] font-semibold leading-normal text-gray-500">
                                                            {lostPetMode 
                                                                ? `⚠️ KAYIP MODU AKTİF! ${pet.name} için GPS konum güncellemeleri saniyelik sıklığa çıkartıldı, tasmadaki kırmızı SOS led ışığı yanıp sönüyor ve çevredeki tüm Moffi üyelerine bildirim gönderildi.` 
                                                                : `${pet.name} kaybolursa bu modu aktif edin. GPS güncelleme hızı artar, tasmanın kırmızı SOS ledi yanar ve çevredeki kullanıcılara kayıp ihbarı iletilir.`
                                                            }
                                                        </p>
                                                    </div>

                                                    {/* Acoustic Controls */}
                                                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                                                        <button 
                                                            onClick={() => setToastMsg("🔊 Tasmaya ses sinyali gönderildi.")}
                                                            className="flex flex-col items-center justify-center p-2.5 bg-gray-55 hover:bg-gray-100 border border-gray-150 rounded-xl transition-all cursor-pointer text-center gap-1"
                                                        >
                                                            <Volume2 className="w-4 h-4 text-gray-600" />
                                                            <span className="text-[8.5px] font-black text-gray-700">Ses Sinyali</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => setToastMsg("📳 Tasmaya hafif titreşim gönderildi.")}
                                                            className="flex flex-col items-center justify-center p-2.5 bg-gray-55 hover:bg-gray-100 border border-gray-150 rounded-xl transition-all cursor-pointer text-center gap-1"
                                                        >
                                                            <Zap className="w-4 h-4 text-gray-600" />
                                                            <span className="text-[8.5px] font-black text-gray-700">Hafif Titreşim</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => setToastMsg("🚨 Acil Durum Sinyali: Tasma çaldırılıyor!")}
                                                            className="flex flex-col items-center justify-center p-2.5 bg-red-50 hover:bg-red-100/85 border border-red-100 rounded-xl transition-all cursor-pointer text-center gap-1"
                                                        >
                                                            <AlertTriangle className="w-4 h-4 text-red-600" />
                                                            <span className="text-[8.5px] font-black text-red-600">Tasmayı Çaldır</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 4. Smart Food & Service Subscriptions (Abonelikler) */}
                                            <div className="flex flex-col gap-3">
                                                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase px-1">MAMA & HİZMET ABONELİKLERİM</span>
                                                
                                                <div className="bg-white border border-gray-100 rounded-3xl p-4.5 shadow-[0_4px_15px_rgba(0,0,0,0.01)] flex flex-col gap-3">
                                                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-655 shrink-0">
                                                                <ShoppingBag className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[11.5px] font-black text-gray-800">Düzenli Somonlu Mama (12kg)</h4>
                                                                <p className="text-[9.5px] text-gray-400 font-semibold mt-0.5">Her ayın 25'inde teslimat • %20 İndirimli</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[11.5px] font-black text-orange-600 block">960 TL</span>
                                                            <span className="text-[8px] font-bold text-gray-400 block uppercase font-sans">Mama Aboneliği</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                                                                <Scissors className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[11.5px] font-black text-gray-800">Moffi Premium Tüy Bakımı</h4>
                                                                <p className="text-[9.5px] text-gray-400 font-semibold mt-0.5">Her 60 günde bir pet kuaför seansı</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[11.5px] font-black text-indigo-650 block">450 TL</span>
                                                            <span className="text-[8px] font-bold text-gray-400 block uppercase font-sans">Hizmet Paketi</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 5. Health & Vaccine Passport Center */}
                                            <div className="flex flex-col gap-3">
                                                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase px-1">MEDİKAL SAĞLIK & DİJİTAL PASAPORT</span>
                                                
                                                <div className="bg-white border border-gray-100 rounded-3xl p-4.5 shadow-[0_4px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                                                    
                                                    {/* Glowing Telehealth Consultation Banner */}
                                                    <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-100 rounded-2xl relative overflow-hidden group">
                                                        <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-emerald-500/5 rounded-full blur-xl animate-pulse" />
                                                        <div className="flex items-center gap-2.5 relative z-10">
                                                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0">
                                                                <Stethoscope className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[11.5px] font-black text-emerald-800 leading-tight">7/24 Canlı Veteriner Destek</h4>
                                                                <p className="text-[9.5px] text-emerald-600 font-semibold mt-0.5">Gold Üye Ayrıcalıklı Canlı Konsültasyon</p>
                                                            </div>
                                                        </div>
                                                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-black px-3.5 py-2 rounded-xl shadow-sm cursor-pointer transition-colors relative z-10">
                                                            Bağlan
                                                        </button>
                                                    </div>

                                                    {/* Passport Detail Ring and upcoming vaccines */}
                                                    <div className="flex justify-between items-center p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative w-10 h-10 flex items-center justify-center">
                                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                                                                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="80, 100" />
                                                                </svg>
                                                                <span className="absolute text-[8.5px] font-black text-emerald-700">80%</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[8.5px] font-black text-gray-400 block uppercase">AŞILAMA TAMAMLIK ORANI</span>
                                                                <h5 className="text-[11.5px] font-black text-gray-805 mt-0.5">Karma ve Kuduz Aşısı Aktif</h5>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setExpandedPanel('passport')}
                                                            className="text-[9.5px] font-black text-emerald-650 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100/50 px-2.5 py-1.5 rounded-xl cursor-pointer shrink-0"
                                                        >
                                                            Pasaportu Aç
                                                        </button>
                                                    </div>

                                                    {/* Allergy & Diet Information */}
                                                    <div className="p-3.5 bg-amber-50/40 border border-amber-100 rounded-2xl flex flex-col gap-2">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">ALERJİ & BESLENME PROFİLİ</span>
                                                            </div>
                                                            <span className="text-[8px] font-black text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded">Hassas Diyet</span>
                                                        </div>
                                                        <p className="text-[9.5px] font-semibold text-gray-700 leading-relaxed">
                                                            ❌ **Yasaklı Besinler:** Çikolata 🍫, Sarımsak 🧄, Üzüm 🍇. Tahılsız ve yüksek somon proteini diyeti aktif. Günlük kalori hedefi: **1,200 kcal**.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 6. Moffi Club™ & Sosyalleşme */}
                                            <div className="flex flex-col gap-3">
                                                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase px-1">MOFFI CLUB™ SOSYALLEŞME REHBERİ</span>
                                                
                                                <div className="bg-white border border-gray-100 rounded-3xl p-4.5 shadow-[0_4px_15px_rgba(0,0,0,0.01)] flex flex-col gap-3.5">
                                                    
                                                    {/* Playdate Matcher */}
                                                    <div className="flex justify-between items-center p-3.5 bg-rose-50/50 border border-rose-100/60 rounded-2xl">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl shrink-0">🐕‍🦺</span>
                                                            <div>
                                                                <h5 className="text-[11.5px] font-black text-rose-800 leading-tight">Pati Flört & Oyun Arkadaşı</h5>
                                                                <p className="text-[9.5px] text-rose-600 font-semibold mt-0.5">Kadıköy'de **3 yeni oyun adayı** seni bekliyor!</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setExpandedPanel('match')}
                                                            className="bg-rose-500 hover:bg-rose-600 text-white text-[9.5px] font-black px-3 py-2 rounded-xl shadow-sm cursor-pointer transition-all shrink-0"
                                                        >
                                                            Eşleştir
                                                        </button>
                                                    </div>

                                                    {/* Pet Friendly Places */}
                                                    <div className="flex justify-between items-center p-3.5 bg-amber-50/40 border border-amber-100/50 rounded-2xl">
                                                        <div className="flex items-center gap-3">
                                                            <Coffee className="w-5 h-5 text-amber-600 shrink-0" strokeWidth={2.5} />
                                                            <div>
                                                                <h5 className="text-[11.5px] font-black text-amber-800 leading-tight">Patili Mekanlar Keşfi</h5>
                                                                <p className="text-[9.5px] text-amber-600 font-semibold mt-0.5">Moda Pet Cafe'de Pati-Kart sahiplerine **%15 indirim**.</p>
                                                            </div>
                                                        </div>
                                                        <button className="bg-amber-650 hover:bg-amber-700 text-white text-[9.5px] font-black px-3 py-2 rounded-xl shadow-sm cursor-pointer transition-all shrink-0">
                                                            Keşfet
                                                        </button>
                                                    </div>

                                                    {/* Event Ticket */}
                                                    <div className="p-3.5 bg-indigo-50/50 border border-indigo-100/60 rounded-2xl flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <QrCode className="w-5 h-5 text-indigo-650 shrink-0" />
                                                            <div>
                                                                <h5 className="text-[11.5px] font-black text-indigo-850 leading-tight">Etkinlik Biletlerim</h5>
                                                                <p className="text-[9.5px] text-indigo-600 font-semibold mt-0.5">Moffi Kadıköy Patimaratonu (24 Mayıs) • 1 Bilet</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setExpandedPanel('events')}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] font-black px-2.5 py-1.5 rounded-xl shadow-sm cursor-pointer transition-all shrink-0"
                                                        >
                                                            Göster
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 7. Trendyol-Style Interactive Orders & Cart System */}
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">SİPARİŞLERİM & SEPETİM</span>
                                                    <span className="text-[9.5px] font-black text-green-700 bg-green-50 border border-green-200/50 px-2 py-0.5 rounded-full">
                                                        {cartQty1 + cartQty2 > 0 ? `${cartQty1 + cartQty2} Ürün` : 'Sepet Boş'}
                                                    </span>
                                                </div>
                                                
                                                {/* Tab Selector Bar */}
                                                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200/40">
                                                    <button 
                                                        onClick={() => setProfileOrdersTab('active')}
                                                        className={`flex-1 text-[9.5px] font-black py-2 rounded-xl transition-all cursor-pointer text-center ${
                                                            profileOrdersTab === 'active' 
                                                                ? 'bg-white text-gray-900 shadow-sm' 
                                                                : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                    >
                                                        Aktif Takip
                                                    </button>
                                                    <button 
                                                        onClick={() => setProfileOrdersTab('past')}
                                                        className={`flex-1 text-[9.5px] font-black py-2 rounded-xl transition-all cursor-pointer text-center ${
                                                            profileOrdersTab === 'past' 
                                                                ? 'bg-white text-gray-900 shadow-sm' 
                                                                : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                    >
                                                        Geçmiş
                                                    </button>
                                                    <button 
                                                        onClick={() => setProfileOrdersTab('cart')}
                                                        className={`flex-1 text-[9.5px] font-black py-2 rounded-xl transition-all cursor-pointer text-center relative ${
                                                            profileOrdersTab === 'cart' 
                                                                ? 'bg-white text-gray-900 shadow-sm' 
                                                                : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                    >
                                                        Sepetim
                                                        {cartQty1 + cartQty2 > 0 && (
                                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                                                                {cartQty1 + cartQty2}
                                                            </span>
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => setProfileOrdersTab('settings')}
                                                        className={`flex-1 text-[9.5px] font-black py-2 rounded-xl transition-all cursor-pointer text-center ${
                                                            profileOrdersTab === 'settings' 
                                                                ? 'bg-white text-gray-900 shadow-sm' 
                                                                : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                    >
                                                        Ayarlar
                                                    </button>
                                                </div>

                                                {/* TAB 1: AKTİF SİPARİŞLER */}
                                                {profileOrdersTab === 'active' && (
                                                    <div className="flex flex-col gap-3">
                                                        {/* Simulated Live Map */}
                                                        {showLiveMap && (
                                                            <div className="p-4 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col gap-3 relative overflow-hidden">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] font-black tracking-widest text-[#527958] uppercase">CANLI KURYE HARİTASI</span>
                                                                    <button 
                                                                        onClick={() => setShowLiveMap(false)}
                                                                        className="text-[9.5px] font-black text-gray-400 hover:text-gray-650 cursor-pointer animate-none"
                                                                    >
                                                                        Gizle ×
                                                                    </button>
                                                                </div>
                                                                
                                                                {/* Map container */}
                                                                <div className="relative h-40 bg-green-50/10 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                                                                    <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
                                                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160">
                                                                        {/* Streets */}
                                                                        <path d="M 0 30 L 300 30" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                                                                        <path d="M 0 110 L 300 110" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                                                                        <path d="M 80 0 L 80 160" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                                                                        <path d="M 200 0 L 200 160" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                                                                        
                                                                        {/* Active path */}
                                                                        <path d="M 80 30 L 200 30 L 200 110" fill="none" stroke="#527958" strokeWidth="3" strokeDasharray="6 6" />
                                                                        
                                                                        {/* Address marker */}
                                                                        <circle cx="200" cy="110" r="10" fill="#EAF5EC" stroke="#22C55E" strokeWidth="2" />
                                                                        
                                                                        {/* Courier */}
                                                                        <motion.circle 
                                                                            cx="80" 
                                                                            cy="30" 
                                                                            r="7" 
                                                                            fill="#F97316" 
                                                                            stroke="white" 
                                                                            strokeWidth="2"
                                                                            animate={{
                                                                                cx: [80, 200, 200],
                                                                                cy: [30, 30, 110]
                                                                            }}
                                                                            transition={{
                                                                                duration: 6,
                                                                                repeat: Infinity,
                                                                                ease: "linear"
                                                                            }}
                                                                        />
                                                                    </svg>
                                                                    <div className="absolute top-2.5 left-2.5 bg-white/95 border border-gray-100 px-2 py-0.5 rounded-lg shadow-sm text-[8px] font-black text-gray-600">
                                                                        📍 Caferağa Mah. Moda
                                                                    </div>
                                                                    <div className="absolute bottom-2.5 right-2.5 bg-[#527958] text-white px-2 py-0.5 rounded-lg shadow-sm text-[8px] font-black">
                                                                        🛵 Kurye Can yolda
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Shipping tracker list */}
                                                        {activeOrders.length === 0 ? (
                                                            <div className="p-8 bg-white border border-gray-100 rounded-3xl text-center flex flex-col items-center justify-center gap-2">
                                                                <span className="text-2xl">📦</span>
                                                                <h5 className="text-xs font-black text-gray-800">Aktif Sipariş Yok</h5>
                                                                <p className="text-[9.5px] text-gray-400 font-semibold">Şu an aktif takipte olan bir siparişiniz bulunmuyor.</p>
                                                            </div>
                                                        ) : (
                                                            activeOrders.map((ord) => (
                                                                <div key={ord.id} className="p-4 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.01)] flex flex-col gap-3.5">
                                                                    <div className="flex justify-between items-center">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping shrink-0" />
                                                                            <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-wider ml-1">Kurye Yolda • Sipariş Takibi</h4>
                                                                        </div>
                                                                        <span className="text-[8.5px] font-black text-green-700 bg-green-55 border border-green-200/50 px-2 py-0.5 rounded-full">{ord.status}</span>
                                                                    </div>
                                                                    
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <h5 className="text-[12px] font-black text-gray-805 leading-tight">{ord.name}</h5>
                                                                            <p className="text-[9.5px] text-gray-400 font-semibold mt-0.5">{ord.desc}</p>
                                                                        </div>
                                                                        <span className="text-[12px] font-black text-green-700 shrink-0">{ord.timeRemaining}</span>
                                                                    </div>

                                                                    {/* Process progress steps */}
                                                                    <div className="flex justify-between items-center gap-2 mt-1 px-1">
                                                                        <div className="flex-1 flex flex-col gap-1 items-center">
                                                                            <div className={`w-full h-1.5 rounded-full ${ord.progress >= 30 ? 'bg-green-600' : 'bg-gray-200'}`} />
                                                                            <span className="text-[7.5px] font-black text-green-700 uppercase">Hazırlık</span>
                                                                        </div>
                                                                        <div className="flex-1 flex flex-col gap-1 items-center">
                                                                            <div className={`w-full h-1.5 rounded-full ${ord.progress >= 65 ? 'bg-green-600' : 'bg-gray-200'}`} />
                                                                            <span className="text-[7.5px] font-black text-green-700 uppercase">Dağıtımda</span>
                                                                        </div>
                                                                        <div className="flex-1 flex flex-col gap-1 items-center">
                                                                            <div className={`w-full h-1.5 rounded-full ${ord.progress >= 100 ? 'bg-green-600' : 'bg-gray-200'}`} />
                                                                            <span className="text-[7.5px] font-black text-gray-400 uppercase">Teslimat</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                                                        <button 
                                                                            onClick={() => setShowLiveMap(true)}
                                                                            className="py-2.5 rounded-xl bg-[#527958] hover:bg-[#436448] text-white text-[10px] font-black cursor-pointer text-center transition-colors shadow-sm"
                                                                        >
                                                                            Haritada Göster 📍
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => setToastMsg("📞 Kurye Can ile bağlantı kuruluyor...")}
                                                                            className="py-2.5 rounded-xl bg-gray-50 border border-gray-150 hover:bg-gray-100 text-[10px] font-black text-gray-700 cursor-pointer text-center transition-colors"
                                                                        >
                                                                            Kuryeyi Ara
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}

                                                        {/* Booking management */}
                                                        <div className="p-4 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.01)] flex flex-col gap-3">
                                                            <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                                                                <div>
                                                                    <span className="text-[8px] font-bold text-gray-400 block uppercase">REZERVASYON 1</span>
                                                                    <h5 className="text-[11.5px] font-black text-gray-800 mt-0.5">Dog Walker (Gezdirici)</h5>
                                                                    <p className="text-[9.5px] text-gray-400 font-semibold mt-0.5">Bugün, 18:00 • 60 dk • Emre Kaplan</p>
                                                                </div>
                                                                <span className="text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded-full shrink-0 h-fit">ONAYLANDI</span>
                                                            </div>

                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <span className="text-[8px] font-bold text-gray-400 block uppercase">REZERVASYON 2</span>
                                                                    <h5 className="text-[11.5px] font-black text-gray-800 mt-0.5">Premium Pet Groomer</h5>
                                                                    <p className="text-[9.5px] text-gray-400 font-semibold mt-0.5">20 Mayıs Çarşamba, 14:00 • Tıraş ve Banyo</p>
                                                                </div>
                                                                <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full shrink-0 h-fit">BEKLEMEDE</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TAB 2: GEÇMİŞ SİPARİŞLER */}
                                                {profileOrdersTab === 'past' && (
                                                    <div className="flex flex-col gap-3">
                                                        <div className="p-4 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.01)] flex flex-col gap-3">
                                                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                                                <div>
                                                                    <span className="text-[9px] font-black text-gray-400">SİPARİŞ #928374</span>
                                                                    <span className="text-[9.5px] text-gray-500 font-bold block mt-0.5">12 Mayıs 2026</span>
                                                                </div>
                                                                <span className="text-[9px] font-black text-green-700 bg-green-50 border border-green-200/55 px-2.5 py-0.5 rounded-full">
                                                                    Teslim Edildi ✓
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-3 my-1">
                                                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 border border-orange-100/40">
                                                                    <ShoppingBag className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h5 className="text-[11.5px] font-bold text-gray-800 leading-tight">Tahılsız Somonlu Kuru Köpek Maması (15kg)</h5>
                                                                    <p className="text-[9.5px] text-gray-400 font-semibold mt-0.5">Moffi Premium Satıcı • 1,450 TL</p>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                                                <button className="py-2 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl text-[9.5px] font-black text-gray-700 cursor-pointer text-center transition-colors">
                                                                    Değerlendir (5 ⭐)
                                                                </button>
                                                                <button className="py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[9.5px] font-black cursor-pointer text-center transition-colors">
                                                                    Tekrar Satın Al
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="p-4 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.01)] flex flex-col gap-3">
                                                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                                                <div>
                                                                    <span className="text-[9px] font-black text-gray-450">SİPARİŞ #837261</span>
                                                                    <span className="text-[9.5px] text-gray-500 font-bold block mt-0.5">28 Nisan 2026</span>
                                                                </div>
                                                                <span className="text-[9px] font-black text-green-700 bg-green-50 border border-green-200/55 px-2.5 py-0.5 rounded-full">
                                                                    Teslim Edildi ✓
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-3 my-1">
                                                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0 border border-green-100/40">
                                                                    <Radio className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h5 className="text-[11.5px] font-bold text-gray-800 leading-tight">Moffi Link™ Akıllı Tasma v2 - Orman Yeşili</h5>
                                                                    <p className="text-[9.5px] text-gray-400 font-semibold mt-0.5">Moffi Donanım A.Ş. • 2,490 TL</p>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                                                <button className="py-2 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl text-[9.5px] font-black text-gray-700 cursor-pointer text-center transition-colors">
                                                                    Fatura İndir (PDF)
                                                                </button>
                                                                <button className="py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[9.5px] font-black cursor-pointer text-center transition-colors">
                                                                    Destek Talebi Aç
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TAB 3: SEPETİM */}
                                                {profileOrdersTab === 'cart' && (
                                                    <div className="flex flex-col gap-3">
                                                        {cartQty1 + cartQty2 === 0 ? (
                                                            <div className="p-8 bg-white border border-gray-100 rounded-3xl text-center flex flex-col items-center justify-center gap-2">
                                                                <span className="text-3xl">🛒</span>
                                                                <h5 className="text-xs font-black text-gray-800">Sepetiniz Boş</h5>
                                                                <p className="text-[10px] text-gray-400 font-semibold max-w-[200px]">{pet.name || 'Petiniz'} için eklediğiniz ürünler burada görünür.</p>
                                                                <button 
                                                                    onClick={() => setProfileOrdersTab('active')}
                                                                    className="mt-2 bg-[#527958] text-white text-[10px] font-black px-4 py-2 rounded-xl"
                                                                >
                                                                    Alışverişe Başla
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-3">
                                                                {/* Cart items list */}
                                                                <div className="p-4 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.01)] flex flex-col gap-3.5">
                                                                    {cartQty1 > 0 && (
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="flex gap-2.5 items-center">
                                                                                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/35 flex items-center justify-center text-orange-600 shrink-0">
                                                                                    <ShoppingBag className="w-5 h-5" />
                                                                                </div>
                                                                                <div>
                                                                                    <h5 className="text-[11.5px] font-black text-gray-800">Somonlu Mama (12kg)</h5>
                                                                                    <span className="text-[9.5px] font-black text-orange-600 block mt-0.5">960 TL <span className="text-[8px] text-gray-400 line-through">1,200 TL</span></span>
                                                                                </div>
                                                                            </div>
                                                                            {/* Quantity Controls */}
                                                                            <div className="flex items-center gap-2 bg-gray-55 border border-gray-150 px-2 py-1 rounded-xl">
                                                                                <button 
                                                                                    onClick={() => setCartQty1(Math.max(0, cartQty1 - 1))}
                                                                                    className="text-[12px] font-black text-gray-650 w-4 text-center cursor-pointer"
                                                                                >
                                                                                    -
                                                                                </button>
                                                                                <span className="text-[11px] font-black text-gray-800 w-3 text-center">{cartQty1}</span>
                                                                                <button 
                                                                                    onClick={() => setCartQty1(cartQty1 + 1)}
                                                                                    className="text-[12px] font-black text-gray-650 w-4 text-center cursor-pointer"
                                                                                >
                                                                                    +
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {cartQty2 > 0 && (
                                                                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                                                            <div className="flex gap-2.5 items-center">
                                                                                <div className="w-10 h-10 rounded-xl bg-purple-55 border border-purple-100/35 flex items-center justify-center text-purple-650 shrink-0">
                                                                                    <Shirt className="w-5 h-5" />
                                                                                </div>
                                                                                <div>
                                                                                    <h5 className="text-[11.5px] font-black text-gray-800">Moffi Diş Oyuncağı</h5>
                                                                                    <span className="text-[9.5px] font-black text-purple-700 block mt-0.5">180 TL</span>
                                                                                </div>
                                                                            </div>
                                                                            {/* Quantity Controls */}
                                                                            <div className="flex items-center gap-2 bg-gray-55 border border-gray-150 px-2 py-1 rounded-xl">
                                                                                <button 
                                                                                    onClick={() => setCartQty2(Math.max(0, cartQty2 - 1))}
                                                                                    className="text-[12px] font-black text-gray-655 w-4 text-center cursor-pointer"
                                                                                >
                                                                                    -
                                                                                </button>
                                                                                <span className="text-[11px] font-black text-gray-800 w-3 text-center">{cartQty2}</span>
                                                                                <button 
                                                                                    onClick={() => setCartQty2(cartQty2 + 1)}
                                                                                    className="text-[12px] font-black text-gray-655 w-4 text-center cursor-pointer"
                                                                                >
                                                                                    +
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Checkout calculation */}
                                                                <div className="p-4 bg-[#FBFBFB] border border-gray-100 rounded-3xl flex flex-col gap-2">
                                                                    <div className="flex justify-between text-[10px] font-bold text-gray-500">
                                                                        <span>Sepet Toplamı</span>
                                                                        <span>{cartQty1 * 1200 + cartQty2 * 180} TL</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-[10px] font-bold text-green-700">
                                                                        <span>Moffi Gold İndirimi</span>
                                                                        <span>-{cartQty1 * 240} TL</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-[10px] font-bold text-gray-500">
                                                                        <span>Kargo Ücreti</span>
                                                                        <span className="text-green-600 font-black">Bedava</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-[11px] font-black text-gray-800 pt-2 border-t border-gray-200">
                                                                        <span>Ödenecek Tutar</span>
                                                                        <span className="text-orange-600 text-sm font-black">{cartQty1 * 960 + cartQty2 * 180} TL</span>
                                                                    </div>
                                                                </div>

                                                                {/* Complete order button */}
                                                                <button 
                                                                    onClick={() => {
                                                                        const totalAmt = cartQty1 * 960 + cartQty2 * 180;
                                                                        if (nfcPaymentLocked) {
                                                                            setToastMsg("❌ Ödeme Başarısız: Pati-Kartınız güvenlik nedeniyle kilitli! (Kilidi profilden açabilirsiniz)");
                                                                            return;
                                                                        }
                                                                        if (totalAmt > dailySpendLimit) {
                                                                            setToastMsg(`❌ Ödeme Başarısız: Günlük harcama limitinizi (${dailySpendLimit} PATI) aştınız!`);
                                                                            return;
                                                                        }
                                                                        if (walletBalance < totalAmt) {
                                                                            setToastMsg("❌ Yetersiz Bakiye! Lütfen Pati-Kartınıza bakiye yükleyin.");
                                                                            return;
                                                                        }
                                                                        
                                                                        setWalletBalance(prev => prev - totalAmt);
                                                                        
                                                                        const items = [];
                                                                        if (cartQty1 > 0) items.push(`Somonlu Mama (${cartQty1} ad.)`);
                                                                        if (cartQty2 > 0) items.push(`Diş Oyuncağı (${cartQty2} ad.)`);
                                                                        
                                                                        const newOrder = {
                                                                            id: `order-${Date.now()}`,
                                                                            name: items.join(" + "),
                                                                            desc: "Moda Dağıtım Noktası • Kurye: Walky Can",
                                                                            timeRemaining: "12 dk kaldı",
                                                                            status: "Hazırlanıyor",
                                                                            progress: 30
                                                                        };
                                                                        
                                                                        setActiveOrders(prev => [newOrder, ...prev]);
                                                                        setCartQty1(0);
                                                                        setCartQty2(0);
                                                                        setToastMsg(`🎉 Sipariş alındı! Kurye Can yola çıkıyor. -${totalAmt} PatiPuan`);
                                                                        setProfileOrdersTab('active');
                                                                    }}
                                                                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl cursor-pointer shadow-md shadow-orange-500/10 hover:opacity-95 transition-opacity text-center"
                                                                >
                                                                    Pati-Kart ile Öde ve Siparişi Tamamla
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* TAB 4: SİPARİŞ AYARLARI */}
                                                {profileOrdersTab === 'settings' && (
                                                    <div className="flex flex-col gap-3">
                                                        <div className="p-4 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                                                            
                                                            {/* Address section */}
                                                            <div>
                                                                <h5 className="text-[9.5px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">KAYITLI ADRESLERİM</h5>
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-start">
                                                                        <div>
                                                                            <span className="text-[10px] font-black text-gray-800 block">🏠 Ev (Birincil)</span>
                                                                            <span className="text-[9.5px] text-gray-450 font-semibold mt-1 block leading-snug">Moda Cd. No: 12, D: 4, Caferağa Mah. Kadıköy / İstanbul</span>
                                                                        </div>
                                                                        <span className="text-[8px] font-black text-green-705 bg-green-50 px-1.5 py-0.5 rounded border border-green-150">Varsayılan</span>
                                                                    </div>
                                                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-start">
                                                                        <div>
                                                                            <span className="text-[10px] font-black text-gray-800 block">💼 İş Adresi</span>
                                                                            <span className="text-[9.5px] text-gray-450 font-semibold mt-1 block leading-snug">Levent Plaza Kat: 8, Büyükdere Cd. Şişli / İstanbul</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button className="mt-2 text-[9.5px] font-black text-[#527958] flex items-center gap-1 cursor-pointer">
                                                                    <Plus className="w-3.5 h-3.5" /> Yeni Adres Ekle
                                                                </button>
                                                            </div>

                                                            {/* Payment section */}
                                                            <div className="pt-3 border-t border-gray-100">
                                                                <h5 className="text-[9.5px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">KAYITLI KARTLARIM</h5>
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center">
                                                                        <div className="flex items-center gap-2">
                                                                            <CreditCard className="w-4.5 h-4.5 text-gray-600" />
                                                                            <div>
                                                                                <span className="text-[10px] font-black text-gray-800 block">Moffi Pati-Kart (NFC)</span>
                                                                                <span className="text-[8.5px] text-gray-400 font-semibold">Bakiye: {walletBalance.toLocaleString()} Patipuan</span>
                                                                            </div>
                                                                        </div>
                                                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                                                    </div>
                                                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center">
                                                                        <div className="flex items-center gap-2">
                                                                            <CreditCard className="w-4.5 h-4.5 text-gray-400" />
                                                                            <div>
                                                                                <span className="text-[10px] font-bold text-gray-700 block">Yapı Kredi Play Card</span>
                                                                                <span className="text-[8.5px] text-gray-450 font-mono">•••• 4820</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button className="mt-2 text-[9.5px] font-black text-[#527958] flex items-center gap-1 cursor-pointer">
                                                                    <Plus className="w-3.5 h-3.5" /> Yeni Ödeme Yöntemi Ekle
                                                                </button>
                                                            </div>

                                                            <div className="pt-3 border-t border-gray-100">
                                                                <h5 className="text-[9.5px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">TASMA IOT & BİLDİRİM AYARLARI</h5>
                                                                <div className="flex flex-col gap-2 text-[9.5px] font-bold text-gray-750">
                                                                    <label className="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50/70 cursor-pointer">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span>Akıllı Tasma Geofence (Güvenli Çember)</span>
                                                                            <span className="text-[8px] text-gray-400 font-medium">{pet.name} çember dışına çıkarsa anında bildirim gönder.</span>
                                                                        </div>
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={geofenceAlerts} 
                                                                            onChange={(e) => {
                                                                                setGeofenceAlerts(e.target.checked);
                                                                                setToastMsg(e.target.checked ? "🔔 Geofence (Güvenli Çember) bildirimi aktif edildi!" : "🔕 Geofence bildirimi devredışı bırakıldı.");
                                                                            }}
                                                                            className="rounded border-gray-300 text-[#527958] focus:ring-[#527958] w-4 h-4 cursor-pointer animate-none" 
                                                                        />
                                                                    </label>
                                                                    <label className="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50/70 cursor-pointer">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span>Düşük Pil Uyarısı</span>
                                                                            <span className="text-[8px] text-gray-400 font-medium">Tasma şarjı %15 altına inerse bildirim gönder.</span>
                                                                        </div>
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={collarLowBattery} 
                                                                            onChange={(e) => {
                                                                                setCollarLowBattery(e.target.checked);
                                                                                setToastMsg(e.target.checked ? "🔋 Düşük pil uyarısı aktif edildi!" : "🔕 Düşük pil uyarısı devredışı bırakıldı.");
                                                                            }}
                                                                            className="rounded border-gray-300 text-[#527958] focus:ring-[#527958] w-4 h-4 cursor-pointer animate-none" 
                                                                        />
                                                                    </label>
                                                                    <label className="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50/70 cursor-pointer">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span>Sağlık Anomalisi SMS Uyarısı</span>
                                                                            <span className="text-[8px] text-gray-400 font-medium">Stres, kalp ritmi veya anormal havlama durumunda SMS gönder.</span>
                                                                        </div>
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={anomaliesSms} 
                                                                            onChange={(e) => {
                                                                                setAnomaliesSms(e.target.checked);
                                                                                setToastMsg(e.target.checked ? "📲 Sağlık anomalisi SMS bildirimi aktif!" : "🔕 Sağlık anomalisi SMS uyarısı devredışı.");
                                                                            }}
                                                                            className="rounded border-gray-300 text-[#527958] focus:ring-[#527958] w-4 h-4 cursor-pointer animate-none" 
                                                                        />
                                                                    </label>
                                                                    <label className="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50/70 cursor-pointer">
                                                                        <span>Anlık Kurye ve Sipariş Takip Bildirimleri</span>
                                                                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#527958] focus:ring-[#527958] w-4 h-4 cursor-pointer animate-none" />
                                                                    </label>
                                                                    <label className="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50/70 cursor-pointer">
                                                                        <span>Fatura ve Kampanya E-Postaları</span>
                                                                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#527958] focus:ring-[#527958] w-4 h-4 cursor-pointer animate-none" />
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                                </>
                                            )}

                                            {/* 8. Menu: Account Safety, OTP, and Support */}
                                            <div className="flex flex-col gap-3">
                                                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase px-1">HESAP GÜVENLİĞİ & DESTEK</span>
                                                
                                                <div className="flex flex-col gap-2">
                                                    <button className="flex items-center justify-between p-4.5 rounded-3xl bg-white border border-gray-100 hover:bg-gray-50/80 transition-all text-left group cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
                                                        <div className="flex items-center gap-3">
                                                            <Shield className="w-5 h-5 text-gray-500" />
                                                            <div>
                                                                <div className="text-[11.5px] font-black text-gray-800">OTP Güvenlik ve E-Posta Ayarları</div>
                                                                <div className="text-[9px] text-gray-450 font-semibold mt-0.5">OTP şifresiz doğrulama durumu ve iki adımlı güvenlik</div>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                                    </button>

                                                    <button onClick={handleNfcScan} className="flex items-center justify-between p-4.5 rounded-3xl bg-white border border-gray-100 hover:bg-gray-50/80 transition-all text-left group cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
                                                        <div className="flex items-center gap-3">
                                                            <Fingerprint className="w-5 h-5 text-gray-500" />
                                                            <div>
                                                                <div className="text-[11.5px] font-black text-gray-800">Biometrik Giriş ve Akıllı Pasaport Eşleme</div>
                                                                <div className="text-[9px] text-gray-450 font-semibold mt-0.5">FaceID/TouchID ile hızlı erişim ve NFC çip entegrasyonu</div>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                                    </button>

                                                    <button className="flex items-center justify-between p-4.5 rounded-3xl bg-white border border-gray-100 hover:bg-gray-50/80 transition-all text-left group cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
                                                        <div className="flex items-center gap-3">
                                                            <Info className="w-5 h-5 text-gray-500" />
                                                            <div>
                                                                <div className="text-[11.5px] font-black text-gray-800">Moffi Club™ Yardım & Destek Hattı</div>
                                                                <div className="text-[9px] text-gray-450 font-semibold mt-0.5">Kullanım rehberleri, tasmamı bul desteği ve destek talepleri</div>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 9. Secure Logout Button */}
                                            <button 
                                                onClick={() => setExpandedPanel(null)}
                                                className="w-full py-4 rounded-2.5xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black tracking-wider uppercase border border-red-100/60 cursor-pointer transition-colors text-center shadow-sm"
                                            >
                                                Güvenli Çıkış Yap
                                            </button>
                                        </div>
                                    )}

                                </motion.div>

                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* FULLSCREEN STORY VIEWER OVERLAY */}
            <AnimatePresence>
                {viewerStoryGroupIndex !== null && activeGroup && activeStory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-0 md:p-4 backdrop-blur-lg"
                    >
                        {/* Background Blur Image */}
                        <div className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-30 select-none pointer-events-none" style={{ backgroundImage: `url(${activeStory.media_url})` }} />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full h-full md:max-w-md md:h-[800px] md:rounded-[32px] bg-gray-950 overflow-hidden shadow-2xl flex flex-col justify-between"
                        >
                            {/* Left/Right click/hold handlers for navigation & pausing (restricted to middle height to keep header close button and footer CTA clickable) */}
                            <div className="absolute inset-x-0 top-[80px] bottom-[120px] z-10 flex select-none touch-none">
                                <div 
                                    className="w-1/2 h-full cursor-w-resize" 
                                    onMouseDown={() => {
                                        storyPressStartTime.current = Date.now();
                                        setIsStoryPaused(true);
                                    }}
                                    onMouseUp={() => {
                                        setIsStoryPaused(false);
                                        const duration = Date.now() - storyPressStartTime.current;
                                        if (duration < 250) prevStory();
                                    }}
                                    onMouseLeave={() => {
                                        setIsStoryPaused(false);
                                    }}
                                    onTouchStart={() => {
                                        storyPressStartTime.current = Date.now();
                                        setIsStoryPaused(true);
                                    }}
                                    onTouchEnd={() => {
                                        setIsStoryPaused(false);
                                        const duration = Date.now() - storyPressStartTime.current;
                                        if (duration < 250) prevStory();
                                    }}
                                    onTouchCancel={() => {
                                        setIsStoryPaused(false);
                                    }}
                                />
                                <div 
                                    className="w-1/2 h-full cursor-e-resize" 
                                    onMouseDown={() => {
                                        storyPressStartTime.current = Date.now();
                                        setIsStoryPaused(true);
                                    }}
                                    onMouseUp={() => {
                                        setIsStoryPaused(false);
                                        const duration = Date.now() - storyPressStartTime.current;
                                        if (duration < 250) nextStory();
                                    }}
                                    onMouseLeave={() => {
                                        setIsStoryPaused(false);
                                    }}
                                    onTouchStart={() => {
                                        storyPressStartTime.current = Date.now();
                                        setIsStoryPaused(true);
                                    }}
                                    onTouchEnd={() => {
                                        setIsStoryPaused(false);
                                        const duration = Date.now() - storyPressStartTime.current;
                                        if (duration < 250) nextStory();
                                    }}
                                    onTouchCancel={() => {
                                        setIsStoryPaused(false);
                                    }}
                                />
                            </div>

                            {/* Top Story Header & Bars */}
                            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex flex-col gap-3">
                                {/* Progress Bars */}
                                <div className="flex gap-1.5 w-full">
                                    {activeGroup.stories.map((s, idx) => {
                                        let pct = 0;
                                        if (idx < viewerStoryIndex) pct = 100;
                                        else if (idx === viewerStoryIndex) pct = storyProgress;
                                        return (
                                            <div key={s.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-white rounded-full"
                                                    style={{ 
                                                        width: `${pct}%`,
                                                        transition: idx === viewerStoryIndex && !isStoryPaused ? 'width 50ms linear' : 'none'
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Author Profile info */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/80 shadow-md">
                                            <img src={activeGroup.author_avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} className="w-full h-full object-cover" alt="Author" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-black text-white leading-tight tracking-tight drop-shadow-sm">{activeGroup.author_name}</span>
                                            <span className="text-[9px] font-semibold text-white/70 leading-none drop-shadow-sm">Duyuru Kanalı</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={closeStoryViewer}
                                        className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer z-30 transition-colors"
                                    >
                                        <X className="w-4.5 h-4.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Main Story Image */}
                            <div className="flex-1 w-full h-full flex items-center justify-center bg-gray-900 select-none">
                                <img src={activeStory.media_url} className="w-full h-full object-cover" alt="Story Media" />
                            </div>

                            {/* Bottom Story Content */}
                            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-25 flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5 text-white">
                                    <div className="flex gap-2">
                                        {activeStory.badge && (
                                            <span className="self-start text-[8px] font-black tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-450/20 px-2 py-0.5 rounded-md uppercase">
                                                {activeStory.badge}
                                            </span>
                                        )}
                                        {activeStory.expires_at && (
                                            <span className="self-start text-[8px] font-black tracking-widest text-red-400 bg-red-400/10 border border-red-450/20 px-2 py-0.5 rounded-md uppercase flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" /> 
                                                {(() => {
                                                    const diff = new Date(activeStory.expires_at).getTime() - Date.now();
                                                    if (diff <= 0) return 'SÜRESİ DOLDU';
                                                    const h = Math.floor(diff / 3600000);
                                                    const m = Math.floor((diff % 3600000) / 60000);
                                                    return `SON ${h} SAAT ${m} DK`;
                                                })()}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-base font-black tracking-tight drop-shadow-sm leading-snug">{activeStory.title}</h3>
                                    <p className="text-[11px] text-white/80 font-medium leading-relaxed drop-shadow-sm">{activeStory.description}</p>
                                </div>

                                {activeStory.ctaText && (
                                    <button
                                        onClick={handleCtaClick}
                                        className="w-full py-3.5 bg-white hover:bg-gray-100 text-gray-950 text-xs font-black uppercase tracking-wider rounded-2xl cursor-pointer shadow-md transition-colors z-30 text-center"
                                    >
                                        {activeStory.ctaText}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <PetSettingsModal 
                isOpen={isPetSettingsOpen}
                onClose={() => setIsPetSettingsOpen(false)}
                pet={activePetObj}
                onSave={handleSavePetSettings}
                onDelete={deletePet}
            />

            {/* ANNOUNCEMENT DETAIL MODAL */}
            <AnimatePresence>
                {selectedAnn && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedAnn(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white/95 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl p-6 flex flex-col gap-4 text-zinc-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header image/banner */}
                            <div className="w-full h-48 rounded-3xl overflow-hidden relative shadow-inner">
                                <img src={selectedAnn.media_url} className="w-full h-full object-cover" alt="Announcement" />
                                <span className="absolute top-4 left-4 text-[9px] font-black tracking-widest text-purple-700 bg-purple-100/90 border border-purple-200 px-2.5 py-1 rounded-md uppercase shadow-sm">
                                    {selectedAnn.badge || 'Duyuru'}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col gap-2">
                                <h3 className="text-xl font-black text-zinc-900 tracking-tight leading-snug">
                                    {selectedAnn.title}
                                </h3>
                                <p className="text-sm text-zinc-600 font-medium leading-relaxed max-h-60 overflow-y-auto pr-1">
                                    {selectedAnn.description}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex flex-col gap-2 mt-2">
                                {selectedAnn.ctaValue && selectedAnn.ctaValue !== "Moffi'ye hoş geldiniz!" && (
                                    <div className="text-[10px] font-bold text-purple-600 bg-purple-50 rounded-xl p-3 text-center border border-purple-100/50">
                                        ✨ {selectedAnn.ctaValue}
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedAnn(null)}
                                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-[0_10px_25px_-5px_rgba(124,58,237,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                                >
                                    Kapat
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AddPetModal 
                isOpen={isAddPetOpen}
                onClose={() => setIsAddPetOpen(false)}
                step={addPetStep}
                setStep={setAddPetStep}
                newPetName={newPetName}
                setNewPetName={setNewPetName}
                newPetType={newPetType}
                setNewPetType={setNewPetType}
                newPetBreed={newPetBreed}
                setNewPetBreed={setNewPetBreed}
                newPetAge={newPetAge}
                setNewPetAge={setNewPetAge}
                newPetGender={newPetGender}
                setNewPetGender={setNewPetGender}
                newPetNeutered={newPetNeutered}
                setNewPetNeutered={setNewPetNeutered}
                newPetSize={newPetSize}
                setNewPetSize={setNewPetSize}
                newPetFeatures={newPetFeatures}
                setNewPetFeatures={setNewPetFeatures}
                newPetHealth={newPetHealth}
                setNewPetHealth={setNewPetHealth}
                newPetCharacter={newPetCharacter}
                setNewPetCharacter={setNewPetCharacter}
                newPetMicrochip={newPetMicrochip}
                setNewPetMicrochip={setNewPetMicrochip}
                newPetShowPhone={newPetShowPhone}
                setNewPetShowPhone={setNewPetShowPhone}
                newPetPhotos={newPetPhotos}
                setNewPetPhotos={setNewPetPhotos}
                isSaving={isSavingPet}
                onSave={handleAddPetSave}
                newPetWeight={newPetWeight}
                setNewPetWeight={setNewPetWeight}
                newPetHealthStatus={newPetHealthStatus}
                setNewPetHealthStatus={setNewPetHealthStatus}
                newPetActivityTarget={newPetActivityTarget}
                setNewPetActivityTarget={setNewPetActivityTarget}
                newPetWaterTarget={newPetWaterTarget}
                setNewPetWaterTarget={setNewPetWaterTarget}
                newPetFoodTarget={newPetFoodTarget}
                setNewPetFoodTarget={setNewPetFoodTarget}
            />

            <CareHubModal 
                isOpen={isCareHubOpen}
                onClose={() => setIsCareHubOpen(false)}
                defaultTab={activeCareHubTab}
                petName={activePetObj?.name || 'Petin'}
                activityPercent={activityPercent}
                activityCurrent={walkedDistanceToday}
                activityTarget={targetActivityKm}
                waterPercent={waterPercent}
                waterCurrent={waterCurrent}
                waterTarget={waterTarget}
                foodPercent={foodPercent}
                foodCurrent={foodCurrent}
                foodTarget={foodTarget}
            />

            {/* NFC Smart Chip Reading / Data Sync Premium Animation Overlay */}
            <AnimatePresence>
                {isNfcScanning && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[8000] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center text-white"
                    >
                        <div className="relative w-56 h-56 flex flex-col items-center justify-center bg-gray-900/50 rounded-[3rem] border border-gray-800 shadow-2xl p-6 overflow-hidden animate-none">
                            {/* Scanning Laser Line */}
                            <motion.div 
                                animate={{ y: [-70, 70, -70] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#0EA5E9] animate-none"
                            />

                            {/* Concentric Expanding NFC Waves */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <motion.div 
                                    animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                                    className="absolute w-24 h-24 rounded-full border border-cyan-500/25 animate-none"
                                />
                                <motion.div 
                                    animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 0.6 }}
                                    className="absolute w-24 h-24 rounded-full border border-cyan-500/20 animate-none"
                                />
                                <motion.div 
                                    animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 1.2 }}
                                    className="absolute w-24 h-24 rounded-full border border-cyan-500/15 animate-none"
                                />
                            </div>

                            {/* Center Icon: QrCode / NFC Chip */}
                            <motion.div 
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                                className="z-10 w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 animate-none"
                            >
                                <Fingerprint size={38} className="animate-pulse" />
                            </motion.div>
                        </div>
                        
                        <h3 className="mt-8 text-base font-black tracking-wider uppercase italic text-cyan-400 animate-pulse">NFC Akıllı Çip Okunuyor</h3>
                        <p className="text-[9px] font-bold text-gray-500 tracking-[0.25em] uppercase mt-2">Moffi Cloud Akıllı Eşleşme</p>

                        {/* Progress Bar */}
                        <div className="w-48 h-1 bg-gray-800 rounded-full mt-6 overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 shadow-[0_0_8px_#0EA5E9]"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
