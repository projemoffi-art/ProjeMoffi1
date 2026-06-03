'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePet } from '@/context/PetContext';
import { PetSettingsModal } from '@/components/profile/PetSettingsModal';
import { AddPetModal } from '@/components/community/modals/AddPetModal';
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
    Trophy
} from 'lucide-react';

import { useStories } from '../../hooks/useStories';
import { useWalk } from '../../hooks/useWalk';
import { QuestBentoCard } from '@/components/quests/QuestBentoCard';
import { cn } from '@/lib/utils';

const MATCH_CANDIDATES = [
    {
        name: "Max",
        breed: "Golden Retriever",
        age: "2 Yaşında",
        gender: "Erkek",
        aura: "Uysal & Sosyal 🌟",
        auraMatch: 95,
        image: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=350",
        bio: "Top oynamayı çok sever, diğer köpeklerle arası harikadır!"
    },
    {
        name: "Bella",
        breed: "French Bulldog",
        age: "1.5 Yaşında",
        gender: "Dişi",
        aura: "Enerjik & Oyuncu ⚡",
        auraMatch: 88,
        image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=350",
        bio: "Moda sahilinde koşmayı ve çimlerde yuvarlanmayı çok sever."
    },
    {
        name: "Coco",
        breed: "Pomeranian Boo",
        age: "3 Yaşında",
        gender: "Dişi",
        aura: "Sakin & Kucaksever 🌸",
        auraMatch: 92,
        image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=350",
        bio: "Tüyleri yumuşacık, kafe buluşmalarına bayılır."
    }
];

const PETS_DATA = {
    luna: {
        name: 'Luna',
        image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300',
        breed: 'Golden Retriever • 2 yaşında • Dişi',
        health: 'İyi',
        activity: '68%',
        weight: '24.5 kg',
        ringProgress: { activity: 68, water: 80, food: 55 },
        status: 'GÜVENDE',
        statusColor: 'text-green-600 bg-green-100 border-green-200',
        streak: 4,
        weeklyData: [60, 45, 55, 75, 90, 80, 85],
        collar: {
            connected: true,
            battery: 84,
            signal: 'Mükemmel',
            lastSync: '1 dk önce',
            rssi: '-45 dBm (Çok Yakın)',
            firmware: 'v3.1.2-MoffiLink'
        },
        wallet: {
            patipuan: '2,450',
            currency: 'PATI',
            cardNumber: '•••• •••• •••• 4892',
            transactions: [
                { id: 1, type: 'gider', title: 'Yaş Mama Alımı', amount: '-180 PATI', date: 'Bugün, 10:20' },
                { id: 2, type: 'gelir', title: 'Sabah Yürüyüşü Ödülü 🔥', amount: '+50 PATI', date: 'Bugün, 08:15' },
                { id: 3, type: 'gelir', title: 'AI Tarz Paylaşım Bonusu', amount: '+20 PATI', date: 'Dün, 19:40' }
            ]
        },
        passport: {
            idCode: 'MF-892-LNA',
            nfcStatus: 'Aktif Sinyal',
            qrcode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=moffi-passport-luna',
            vaccines: [
                { name: 'Kuduz Aşısı', date: '04.02.2026', status: 'Aşılı', color: 'text-green-600' },
                { name: 'Karma Aşı', date: '18.03.2026', status: 'Aşılı', color: 'text-green-600' },
                { name: 'Parazit Tedavisi', date: 'Ömrü bitiyor', status: '3 gün kaldı', color: 'text-red-500 font-bold' }
            ]
        },
        dressing: {
            activeOutfit: 'Havalı Gözlük 😎 & Kırmızı Boyunluk 🧣',
            stylePoints: 120,
            avatarMock: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300'
        },
        quests: [
            { id: 1, text: 'Luna ile Yürüyüşü Tamamla (3.5 KM)', done: true },
            { id: 2, text: 'Akşam Yemeği Mama Kabını Doldur', done: false },
            { id: 3, text: 'Gardıropta yeni bir tarz dene', done: true }
        ],
        specialOffer: {
            title: 'Maması Azalıyor! 📉',
            desc: 'Luna için en çok satılan Somonlu Premium Yetişkin Maması (12kg)',
            oldPrice: '1.200 TL',
            newPrice: '960 TL',
            discount: '%20 İNDİRİM'
        }
    },
    max: {
        name: 'Max',
        image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=300',
        breed: 'Beagle • 1 yaşında • Erkek',
        health: 'Mükemmel',
        activity: '92%',
        weight: '12.2 kg',
        ringProgress: { activity: 92, water: 95, food: 90 },
        status: 'YÜRÜYÜŞTE',
        statusColor: 'text-blue-600 bg-blue-100 border-blue-200',
        streak: 6,
        weeklyData: [80, 85, 90, 95, 100, 92, 95],
        collar: {
            connected: true,
            battery: 48,
            signal: 'Güçlü',
            lastSync: 'Şimdi',
            rssi: '-62 dBm (Orta Mesafe)',
            firmware: 'v3.1.2-MoffiLink'
        },
        wallet: {
            patipuan: '4,120',
            currency: 'PATI',
            cardNumber: '•••• •••• •••• 9921',
            transactions: [
                { id: 1, type: 'gelir', title: '5 KM Koşu Görevi Ödülü ⚡', amount: '+100 PATI', date: 'Bugün, 09:12' },
                { id: 2, type: 'gelir', title: 'Haftalık Seri Bonusu 🔥', amount: '+150 PATI', date: 'Dün, 18:00' },
                { id: 3, type: 'gider', title: 'Tasma Aksesuar Satın Alımı', amount: '-200 PATI', date: '15 Mayıs' }
            ]
        },
        passport: {
            idCode: 'MF-121-MAX',
            nfcStatus: 'Aktif Sinyal',
            qrcode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=moffi-passport-max',
            vaccines: [
                { name: 'Kuduz Aşısı', date: '12.01.2026', status: 'Aşılı', color: 'text-green-600' },
                { name: 'Karma Aşı', date: '05.02.2026', status: 'Aşılı', color: 'text-green-600' },
                { name: 'Corona Aşısı', date: '10.03.2026', status: 'Aşılı', color: 'text-green-600' }
            ]
        },
        dressing: {
            activeOutfit: 'Yeşil Yağmurluk 🧥 & Deri Tasma 🐕‍Gl',
            stylePoints: 240,
            avatarMock: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=300'
        },
        quests: [
            { id: 1, text: 'Yürüyüşte 5.0 KM sınırını aş', done: true },
            { id: 2, text: 'Max için günlük su takibini gir', done: true },
            { id: 3, text: 'Yeni Gezi Arkadaşı Bul', done: false }
        ],
        specialOffer: {
            title: 'Enerjisi Çok Yüksek! ⚡',
            desc: 'Max için Ekstra Mukavemetli Deri Yürüyüş Tasması (Beagle Özel)',
            oldPrice: '450 TL',
            newPrice: '380 TL',
            discount: '%15 İNDİRİM'
        }
    },
    mila: {
        name: 'Mila',
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=300',
        breed: 'Scottish Fold • 3 yaşında • Dişi',
        health: 'Hassas',
        activity: '40%',
        weight: '4.8 kg',
        ringProgress: { activity: 40, water: 50, food: 75 },
        status: 'EVDE',
        statusColor: 'text-amber-600 bg-amber-100 border-amber-200',
        streak: 2,
        weeklyData: [30, 40, 35, 45, 50, 40, 42],
        collar: {
            connected: false,
            battery: 0,
            signal: 'Bağlantı Yok',
            lastSync: '2 saat önce',
            rssi: 'Sinyal Yok',
            firmware: 'Bilinmiyor'
        },
        wallet: {
            patipuan: '850',
            currency: 'PATI',
            cardNumber: '•••• •••• •••• 1056',
            transactions: [
                { id: 1, type: 'gelir', title: 'Tüy Macunu Alım Bonusu', amount: '+50 PATI', date: '16 Mayıs' },
                { id: 2, type: 'gider', title: 'Oyuncak Lazer Fare Alımı', amount: '-120 PATI', date: '12 Mayıs' }
            ]
        },
        passport: {
            idCode: 'MF-056-MLA',
            nfcStatus: 'Pasif',
            qrcode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=moffi-passport-mila',
            vaccines: [
                { name: 'Kuduz Aşısı', date: '01.03.2026', status: 'Aşılı', color: 'text-green-600' },
                { name: 'Lösemi Aşısı', date: 'Aşılama bekliyor', status: 'Randevu Al', color: 'text-amber-500 font-bold' }
            ]
        },
        dressing: {
            activeOutfit: 'Pembe Papyon 🎀 & Simli Kolye 💎',
            stylePoints: 310,
            avatarMock: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=300'
        },
        quests: [
            { id: 1, text: 'Mila için tüy bakım seansı kaydet', done: false },
            { id: 2, text: '150 ml yaş mama servisini onayla', done: true },
            { id: 3, text: 'Mila ile interaktif lazer oyunu oyna', done: false }
        ],
        specialOffer: {
            title: 'Hassas Sindirim Desteği 🐱',
            desc: 'Mila için Premium Tüy Yumağı Önleyici Malt Macun (100g)',
            oldPrice: '280 TL',
            newPrice: '210 TL',
            discount: '%25 İNDİRİM'
        }
    }
};

type PetKey = 'luna' | 'max' | 'mila';

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

export default function LegendaryLightDashboard() {
    const router = useRouter();
    const { pets: userPets, activePet: globalActivePet, switchPet, updatePet, addPet } = usePet();
    const { activeSession, history: walkHistory, stats: walkStats, isLoading: isWalkLoading, startWalk, endWalk } = useWalk();

    // PREMIUM DIJITAL GARDROP STATE YAPISI & COIN ENTEGRASYONU
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [walletBalance, setWalletBalance] = useState(2450);
    const [expandedPanel, setExpandedPanel] = useState<'wallet' | 'passport' | 'collar' | 'dressing' | 'quests' | 'shop' | 'profile' | 'match' | 'events' | null>(null);
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>(['glasses', 'scarf']);
    const [unlockedAccessories, setUnlockedAccessories] = useState<string[]>(['glasses', 'scarf']);
    const [activeOutfitName, setActiveOutfitName] = useState('Havalı Gözlük 😎 & Kırmızı Boyunluk 🧣');
    const [stylePoints, setStylePoints] = useState(120);

    // TALKING TOM STYLE DRESSING GAME STATES
    const [dressingStep, setDressingStep] = useState<'clean' | 'dry' | 'accessorize' | 'photo' | 'completed'>('clean');
    const [cleanProgress, setCleanProgress] = useState(0);
    const [dryProgress, setDryProgress] = useState(0);
    const [activeStudioBg, setActiveStudioBg] = useState<'stage' | 'cyber' | 'park' | 'space'>('stage');
    const [isFlashActive, setIsFlashActive] = useState(false);
    const [isShowerActive, setIsShowerActive] = useState(false);
    const [isDryerActive, setIsDryerActive] = useState(false);

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

        setParticles(prev => [...prev.slice(-20), newParticle]);

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
            } else {
                triggerSpeechBubble("🎀 Çok centilmen bir beyefendi oldum!");
                setToastMsg("🎀 Tebrikler! Centilmen Papyon kazandın! (+90 SP, Coin/XP boost)");
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

        if (selectedAccessories.includes('glasses')) {
            totalSP += 50;
            names.push('Havalı Gözlük 😎');
        }
        if (selectedAccessories.includes('scarf')) {
            totalSP += 70;
            names.push('Kırmızı Boyunluk 🧣');
        }
        if (selectedAccessories.includes('hat')) {
            totalSP += 120;
            names.push('Retro Şapka 🎩');
        }
        if (selectedAccessories.includes('crown')) {
            totalSP += 200;
            names.push('Altın Taç 👑');
        }
        if (selectedAccessories.includes('pirate')) {
            totalSP += 140;
            names.push('Korsan Bandı 🏴‍☠️');
        }
        if (selectedAccessories.includes('bowtie')) {
            totalSP += 90;
            names.push('Centilmen Papyon 🎀');
        }

        setStylePoints(totalSP);
        const joinedName = names.length > 0 ? names.join(' & ') : 'Sade Tarz 🐕';
        setActiveOutfitName(joinedName);

        // Daily Challenge Theme check: "Korsan Balosu 🏴‍☠️👑" (Requires crown OR pirate)
        const meetsTheme = selectedAccessories.includes('crown') || selectedAccessories.includes('pirate');
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
            accessories: [...selectedAccessories],
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

    // Map global activePet to our local state/mock templates
    const activePetObj = globalActivePet || userPets[0] || {
        id: 'mock-luna',
        name: 'Luna',
        image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300',
        breed: 'Golden Retriever • 2 yaşında • Dişi',
        gender: 'Dişi',
        weight: '24.5',
        microchip: 'MF-892-LNA'
    };

    const baseMockTemplate = PETS_DATA[activePetObj.name.toLowerCase() as PetKey] || PETS_DATA.luna;

    const resolvedStreak = typeof activePetObj.streak === 'number' 
        ? activePetObj.streak 
        : (activePetObj.sos_settings?.streak ?? baseMockTemplate.streak);
    
    const resolvedActivityTarget = typeof activePetObj.activity_target === 'number' 
        ? activePetObj.activity_target 
        : (activePetObj.sos_settings?.activity_target ?? baseMockTemplate.ringProgress.activity);

    // Streak değerine göre haftalık aktivite grafiği üret
    // Tamamlanmış günler yüksek aktivite, diğerleri düşük aktivite gösterir
    const generateWeeklyData = (streak: number, activityTarget: number) => {
        return Array.from({ length: 7 }, (_, i) => {
            if (i < streak) {
                // Tamamlanmış günler: hedef etrafında varyasyon
                return Math.min(100, activityTarget + Math.round((Math.random() * 20) - 5));
            }
            // Tamamlanmamış günler: düşük aktivite
            return Math.round(activityTarget * 0.3 + Math.random() * 20);
        });
    };

    // Eğer mock şablonda eşleşen bir template varsa onu kullan, yoksa streak'ten türet
    const hasMockTemplate = !!(PETS_DATA[activePetObj.name.toLowerCase() as PetKey]);
    const weeklyData = hasMockTemplate 
        ? baseMockTemplate.weeklyData 
        : generateWeeklyData(resolvedStreak, resolvedActivityTarget);

    const pet = {
        ...baseMockTemplate,
        id: activePetObj.id,
        name: activePetObj.name,
        image: activePetObj.image || activePetObj.avatar || baseMockTemplate.image,
        breed: activePetObj.breed || baseMockTemplate.breed,
        weight: activePetObj.weight || activePetObj.sos_settings?.weight || baseMockTemplate.weight,
        gender: activePetObj.gender || '',
        health: activePetObj.health || activePetObj.sos_settings?.health || baseMockTemplate.health,
        streak: resolvedStreak,
        weeklyData,
        ringProgress: {
            activity: resolvedActivityTarget,
            water: typeof activePetObj.water_target === 'number' ? activePetObj.water_target : (activePetObj.sos_settings?.water_target ?? baseMockTemplate.ringProgress.water),
            food: typeof activePetObj.food_target === 'number' ? activePetObj.food_target : (activePetObj.sos_settings?.food_target ?? baseMockTemplate.ringProgress.food),
        },
        passport: {
            ...baseMockTemplate.passport,
            idCode: activePetObj.microchip || activePetObj.microchip_id || baseMockTemplate.passport.idCode,
            qrcode: activePetObj.id ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=moffi-passport-${activePetObj.id}` : baseMockTemplate.passport.qrcode,
        },
        dressing: {
            activeOutfit: activeOutfitName,
            stylePoints: stylePoints,
            avatarMock: activePetObj.image || activePetObj.avatar || baseMockTemplate.image,
        }
    };

    const [isPetSettingsOpen, setIsPetSettingsOpen] = useState(false);
    const [isAddPetOpen, setIsAddPetOpen] = useState(false);
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
    const [newPetWaterTarget, setNewPetWaterTarget] = useState("80");
    const [newPetFoodTarget, setNewPetFoodTarget] = useState("60");
    const [newPetStreak, setNewPetStreak] = useState("0");

    const handleSavePetSettings = async (updatedFields: any) => {
        try {
            if (activePetObj && activePetObj.id) {
                // Mevcut sos_settings ile birleştir, weight ve sağlık verilerini ekle
                const mergedSosSettings = {
                    ...(activePetObj.sos_settings || {}),
                    weight: updatedFields.weight ? `${updatedFields.weight} kg` : (activePetObj.sos_settings?.weight || ''),
                    health: updatedFields.health || (activePetObj.sos_settings?.health || 'İyi'),
                    streak: activePetObj.sos_settings?.streak ?? 0,
                    activity_target: activePetObj.sos_settings?.activity_target ?? 70,
                    water_target: activePetObj.sos_settings?.water_target ?? 80,
                    food_target: activePetObj.sos_settings?.food_target ?? 60,
                };

                const petUpdates = {
                    ...updatedFields,
                    microchip_id: updatedFields.microchip,
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
                imageUrl = await apiService.uploadMedia(newPetPhotos[0].file, 'posts');
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
                image: imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400",
                themeColor: '#EAB308',
                
                weight: newPetWeight ? `${newPetWeight} kg` : "10 kg",
                health: newPetHealthStatus,
                streak: Number(newPetStreak) || 0,
                activity_target: Number(newPetActivityTarget) || 70,
                water_target: Number(newPetWaterTarget) || 80,
                food_target: Number(newPetFoodTarget) || 60,
                
                sos_settings: {
                    auto_post_sos: true,
                    sos_radius: '5km' as const,
                    secure_proxy_only: false,
                    location_precision: 'exact' as const,
                    emergency_sms_number: "",
                    reward_amount: 0,
                    reward_currency: "TL",
                    critical_health_note: newPetHealth,
                    finder_message: "Lütfen bahçeye kapatıp beni arayın.",
                    reward_enabled: false,
                    header_sos_alert_enabled: true,
                    
                    weight: newPetWeight ? `${newPetWeight} kg` : "10 kg",
                    health: newPetHealthStatus,
                    streak: Number(newPetStreak) || 0,
                    activity_target: Number(newPetActivityTarget) || 70,
                    water_target: Number(newPetWaterTarget) || 80,
                    food_target: Number(newPetFoodTarget) || 60,
                }
            };

            const savedPet = await apiService.addPet(newPetData as any);
            
            addPet({
                ...newPetData,
                id: savedPet.id,
                image: savedPet.image || newPetData.image
            } as any);

            setIsAddPetOpen(false);
            setToastMsg(`🎉 ${newPetName} aileye hoş geldin! 🐾`);
            
            setAddPetStep(1);
            setNewPetName("");
            setNewPetPhotos([]);
            setNewPetWeight("");
            setNewPetHealthStatus("İyi");
            setNewPetActivityTarget("70");
            setNewPetWaterTarget("80");
            setNewPetFoodTarget("60");
            setNewPetStreak("0");
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

    const [matchIndex, setMatchIndex] = useState(0);

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
            setToastMsg(`🎉 Yürüyüş tamamlandı! ${distKm} KM • +${patiEarned} PATI kazanıldı 🔥`);
        }
    }, [endWalk]);
    const [isMatched, setIsMatched] = useState(false);

    // Dynamic Stories Hook & States
    const { storyGroups } = useStories();
    const [viewerStoryGroupIndex, setViewerStoryGroupIndex] = useState<number | null>(null);
    const [viewerStoryIndex, setViewerStoryIndex] = useState(0);
    const [storyProgress, setStoryProgress] = useState(0);

    const activeGroup = viewerStoryGroupIndex !== null ? storyGroups[viewerStoryGroupIndex] : null;
    const activeStory = activeGroup ? activeGroup.stories[viewerStoryIndex] : null;

    const handleCtaClick = () => {
        if (!activeStory) return;
        if (activeStory.ctaType === 'toast') {
            setToastMsg(`🎉 ${activeStory.ctaValue}`);
        } else if (activeStory.ctaType === 'coupon') {
            setToastMsg(`🎟️ Kupon Kodu Kopyalandı: ${activeStory.ctaValue}`);
        } else if (activeStory.ctaType === 'map') {
            setToastMsg(`📍 Konum Haritada Gösteriliyor: ${activeStory.ctaValue}`);
            setShowLiveMap(true);
        } else if (activeStory.ctaType === 'chat') {
            setToastMsg(`💬 Sohbet Başlatılıyor...`);
        } else {
            setToastMsg(activeStory.ctaValue || "İşlem yapıldı.");
        }
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
        setStoryProgress(0);
        const animationTimer = setTimeout(() => {
            setStoryProgress(100);
        }, 50);

        const autoAdvanceTimer = setTimeout(() => {
            nextStory();
        }, 5050);

        return () => {
            clearTimeout(animationTimer);
            clearTimeout(autoAdvanceTimer);
        };
    }, [viewerStoryGroupIndex, viewerStoryIndex, storyGroups]);

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
        const val = parseInt(pet.wallet.patipuan.replace(/[^0-9]/g, ''));
        setWalletBalance(val);
    }, [activePetObj.id]);

    useEffect(() => {
        if (toastMsg) {
            const timer = setTimeout(() => {
                setToastMsg(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toastMsg]);

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
                    scale: expandedPanel ? 0.95 : 1,
                    filter: expandedPanel ? 'blur(6px)' : 'blur(0px)',
                    opacity: expandedPanel ? 0.6 : 1
                }}
                transition={{ duration: 0.5, type: 'spring', damping: 25 }}
                className="max-w-md mx-auto pt-6 px-5"
            >
                
                {/* 1. Header */}
                <header className="flex justify-between items-center mb-6">
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
                    
                    <div className="flex items-center gap-3">
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

                        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <Bell className="w-5 h-5" />
                            <div className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                        </button>

                        <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setExpandedPanel('profile')}
                            className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:border-gray-400 transition-colors"
                        >
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100" className="w-full h-full object-cover" alt="User" />
                        </motion.button>
                    </div>
                </header>

                {/* 2. Hikayeler (Stories) - Dynamic from useStories */}
                <section className="mb-6">
                    {/* Hikayeler başlığı kaldırıldı */}
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-5 px-5 items-center">
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

                {/* 9. Hero Pet Identity Card */}
                <motion.div 
                    layout
                    className="bg-white rounded-[36px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)] border border-gray-100/60 mb-6 relative overflow-hidden"
                >
                    {/* Switcher & Badges */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-100 shadow-inner max-w-[240px] overflow-x-auto no-scrollbar shrink-0">
                            {userPets.map((p) => (
                                <motion.button
                                    key={p.id}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => switchPet(p.id)}
                                    className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                                        activePetObj.id === p.id 
                                            ? 'border-green-600 scale-105 shadow-sm' 
                                            : 'border-transparent opacity-60'
                                    }`}
                                >
                                    <img src={p.image || p.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} className="w-full h-full object-cover" alt={p.name} />
                                </motion.button>
                            ))}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsAddPetOpen(true)}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-600 transition-colors shrink-0 shadow-sm"
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
                                    : pet.statusColor
                            }`}
                        >
                            {lostPetMode ? "KAYIP 🚨" : pet.status}
                        </motion.div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-[28px] overflow-hidden shadow-md border-2 border-white relative group">
                                <motion.img 
                                    key={pet.image}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    src={pet.image} 
                                    className="w-full h-full object-cover" 
                                    alt={pet.name} 
                                />
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
                                    className="text-2xl font-black text-gray-850 tracking-tight"
                                >
                                    {pet.name} <span className="text-sm opacity-50">🦴</span>
                                </motion.h2>
                                <button 
                                    onClick={() => setIsPetSettingsOpen(true)}
                                    className="p-1.5 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-50 transition-all cursor-pointer"
                                >
                                    <Sliders className="w-4.5 h-4.5" />
                                </button>
                            </div>
                            <motion.p 
                                key={pet.breed}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[11px] font-semibold text-gray-400 mt-0.5"
                            >
                                {pet.breed}
                            </motion.p>
                        </div>
                    </div>

                    {/* AI Dressing Closet Portal */}
                    <motion.div 
                        layoutId="dressing-card-container"
                        onClick={() => setExpandedPanel('dressing')}
                        className="mt-4 p-3 bg-purple-50/50 rounded-2xl border border-purple-100/30 flex justify-between items-center cursor-pointer group hover:bg-purple-50 transition-colors duration-300"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                <Shirt className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-[8.5px] font-black text-purple-700 uppercase tracking-widest block">AI TARZI & GARDIROP</span>
                                <span className="text-[10px] font-bold text-gray-700 mt-0.5 block group-hover:text-purple-800 transition-colors">{pet.dressing.activeOutfit}</span>
                            </div>
                        </div>
                        <button className="flex items-center gap-1 bg-white text-purple-700 border border-purple-200/50 text-[9.5px] font-black px-2.5 py-1.5 rounded-xl cursor-pointer transition-all shadow-sm shrink-0">
                            <span>Kombinle</span>
                            <Plus className="w-3 h-3" />
                        </button>
                    </motion.div>

                    {/* Integrated Rings & Quick Stats */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F0FDF4" strokeWidth="3" />
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${pet.ringProgress.activity}, 100`} />
                                    
                                    <path d="M18 6.0845 a 11.9155 11.9155 0 0 1 0 23.831 a 11.9155 11.9155 0 0 1 0 -23.831" fill="none" stroke="#EFF6FF" strokeWidth="3" />
                                    <path d="M18 6.0845 a 11.9155 11.9155 0 0 1 0 23.831 a 11.9155 11.9155 0 0 1 0 -23.831" fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${pet.ringProgress.water}, 100`} />
                                    
                                    <path d="M18 10.0845 a 7.9155 7.9155 0 0 1 0 15.831 a 7.9155 7.9155 0 0 1 0 -15.831" fill="none" stroke="#FFF7ED" strokeWidth="3" />
                                    <path d="M18 10.0845 a 7.9155 7.9155 0 0 1 0 15.831 a 7.9155 7.9155 0 0 1 0 -15.831" fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${pet.ringProgress.food}, 100`} />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-700 tracking-tight">Günlük Hedefler</span>
                                <span className="text-[9px] font-semibold text-gray-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Gezi
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Su
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Beslenme
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                                    <Heart className="w-3.5 h-3.5 text-green-600" fill="currentColor" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Sağlık</span>
                                    <span className="text-[10px] font-black text-gray-750">{pet.health}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center">
                                    <span className="text-gray-500 font-black text-[9px]">KG</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Ağırlık</span>
                                    <span className="text-[10px] font-black text-gray-750">{pet.weight}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Weekly Streak Grid */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">İstikrar Serisi</span>
                            <span className="text-[10px] font-bold text-gray-600 mt-0.5">Haftalık Gezi</span>
                        </div>
                        <div className="flex gap-1.5">
                            {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((day, idx) => {
                                const isCompleted = idx < pet.streak;
                                return (
                                    <div key={idx} className="flex flex-col items-center">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                                            isCompleted 
                                                ? 'bg-[#EAF5EC] border-green-200 text-green-700 shadow-sm shadow-green-100' 
                                                : 'bg-gray-50 border-gray-100 text-gray-300'
                                        }`}>
                                            {isCompleted ? '✓' : day}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 shrink-0">
                            <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider">{pet.streak} GÜN 🔥</span>
                        </div>
                    </div>
                </motion.div>

                {/* ⚡ QUEST ENGINE - Günlük Görevler Bento */}
                <section className="mb-6 px-0">
                    <QuestBentoCard />
                </section>

                {/* 3. Live Walk Tracking Widget - useWalk hook ile canlı */}
                <section className="mb-6">
                    <BentoCard onClick={() => window.dispatchEvent(new CustomEvent('open-walk-panel'))} className="bg-white !p-4 flex flex-col gap-4 relative overflow-hidden cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all">
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
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border transition-colors ${
                                activeSession ? 'bg-green-500 text-white border-green-400' : 'bg-green-50 text-green-600 border-green-100/30'
                            }`}>
                                <Navigation className="w-5 h-5" />
                            </div>
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
                                    className="flex items-center gap-1.5 bg-[#527958] hover:bg-[#436448] text-white text-[11px] font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-green-900/10 transition-colors cursor-pointer"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>Şimdi Çık</span>
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
                                                {w.ended_at ? new Date(w.ended_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : 'Tamamlandı'}
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
                    <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none px-1">
                        
                        {/* Aşı Kartı */}
                        <motion.div 
                            initial={{ opacity: 0, x: 25 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
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
                        <QuickAccessBtn icon={Radio} title="Kayıp İlanı" subtitle="Acil Bildirim Gönder" color="text-red-500" delay={0.1} onClick={() => router.push('/topluluk?tab=radar&mode=lost')} />
                        <QuickAccessBtn icon={Compass} title="Topluluk" subtitle="Moffi Kaşif Dünyası" color="text-blue-500" delay={0.2} onClick={() => router.push('/topluluk')} />
                        <QuickAccessBtn icon={Flame} title="Eşleştir" subtitle={`${pet.name} için Flört Bul`} color="text-rose-500" delay={0.3} onClick={() => setExpandedPanel('match')} />
                        <QuickAccessBtn icon={Activity} title="Veteriner" subtitle="Sağlık ve Aşılama" color="text-emerald-600" delay={0.4} onClick={() => router.push('/vet')} />
                        <QuickAccessBtn icon={ShoppingBag} title="Market" subtitle="Mama ve Ekipman" color="text-amber-500" delay={0.5} onClick={() => router.push('/petshop')} />
                        <QuickAccessBtn icon={Scissors} title="Bakım" subtitle="Tıraş ve Pet Kuaför" color="text-teal-600" delay={0.6} />
                        <QuickAccessBtn icon={HeartHandshake} title="Sahiplendirme" subtitle="Ömürlük Yuva Bul" color="text-pink-500" delay={0.7} onClick={() => router.push('/topluluk?tab=radar&mode=adopt')} />
                        <QuickAccessBtn icon={Sparkles} title="AI Asistan" subtitle="Veteriner Destek" color="text-purple-500" delay={0.8} />
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

            </motion.div>

            {/* Dynamic Live Activity Card */}
            <div className="fixed bottom-24 inset-x-0 flex justify-center z-40 px-5 pointer-events-none">
                <motion.div 
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
                    className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/20 p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex items-center justify-between pointer-events-auto"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100/30">
                            <ShoppingBag className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black tracking-widest text-orange-600 uppercase">SİPARİŞ YOLDA</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            </div>
                            <h5 className="text-[11px] font-black text-gray-800 mt-0.5">Somonlu Premium Mama</h5>
                            <p className="text-[10px] text-gray-400 font-semibold">Kurye yaklaşıyor • 8 dk içinde kapıda</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pr-1 shrink-0">
                        <span className="text-[11px] font-black text-gray-800 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">8 dk</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                </motion.div>
            </div>


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
                                                    {pet.wallet.patipuan} <span className="text-xs text-yellow-400 font-bold">{pet.wallet.currency}</span>
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
                                                <h3 className="text-lg font-black text-gray-800">Mila'nın Sağlık Pasaportu</h3>
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
                                        <>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Shirt className="w-6 h-6 text-purple-500" />
                                                    <h3 className="text-lg font-black text-gray-800 dark:text-white">Pati Giydirme Stüdyosu</h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9.5px] font-black text-purple-600 bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1 rounded-full border border-purple-200/50 flex items-center gap-1 shadow-sm shadow-purple-500/5">
                                                        <Sparkles className="w-3 h-3 text-purple-500" />
                                                        Tarz Puanı: {stylePoints} SP
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Step Tracker Header */}
                                            <div className="grid grid-cols-5 gap-1 mb-4 text-center select-none bg-gray-50/40 dark:bg-black/25 p-1 rounded-2xl border border-purple-100/20">
                                                {[
                                                    { step: 'clean', label: 'Banyo 🧼' },
                                                    { step: 'dry', label: 'Kurula 💨' },
                                                    { step: 'accessorize', label: 'Süsle 🎀' },
                                                    { step: 'photo', label: 'Stüdyo 📸' },
                                                    { step: 'completed', label: 'Bitti 🏆' }
                                                ].map((item, idx) => {
                                                    const isCurrent = dressingStep === item.step;
                                                    const isPassed = ['clean', 'dry', 'accessorize', 'photo', 'completed'].indexOf(dressingStep) > idx;
                                                    return (
                                                        <div 
                                                            key={item.step}
                                                            className={cn(
                                                                "py-1.5 rounded-xl text-[9px] font-black transition-all duration-300",
                                                                isCurrent 
                                                                    ? "bg-purple-600 text-white shadow-sm scale-105"
                                                                    : isPassed 
                                                                        ? "text-purple-500/80 font-bold"
                                                                        : "text-gray-400 font-semibold"
                                                            )}
                                                        >
                                                            {item.label}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Interactive Dressing Box */}
                                            <div className="relative w-full aspect-[10/12] rounded-[24px] border border-purple-200/40 dark:border-white/5 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 overflow-hidden shadow-inner flex items-center justify-center p-3">
                                                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
                                                
                                                {/* Futuristic scanner animations only in accessorize step */}
                                                {dressingStep === 'accessorize' && (
                                                    <div className="absolute left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_8px_#a855f7] animate-pulse z-20 pointer-events-none top-1/2" />
                                                )}
                                                
                                                <div className="absolute inset-0 border border-purple-500/10 rounded-[24px] pointer-events-none z-10" />

                                                {/* Main Pet Image Frame */}
                                                <div 
                                                    onMouseMove={handlePetInteraction}
                                                    onMouseDown={handlePetInteraction}
                                                    onTouchMove={handlePetInteraction}
                                                    onTouchStart={handlePetInteraction}
                                                    className={cn(
                                                        "relative w-full h-full rounded-2xl overflow-hidden shadow-md bg-white dark:bg-black/10 select-none transition-transform duration-200 active:scale-[0.99]",
                                                        (dressingStep === 'clean' || dressingStep === 'dry') && "cursor-crosshair active:scale-100"
                                                    )}
                                                >
                                                    {/* Studio Background Backdrop */}
                                                    {['photo', 'completed'].includes(dressingStep) && (
                                                        <div className={cn(
                                                            "absolute inset-0 transition-all duration-500 z-0",
                                                            activeStudioBg === 'stage' && "bg-gradient-to-b from-yellow-500/30 via-purple-900/40 to-black/60",
                                                            activeStudioBg === 'cyber' && "bg-gradient-to-br from-purple-900/50 via-indigo-900/50 to-slate-900",
                                                            activeStudioBg === 'park' && "bg-gradient-to-b from-green-500/20 via-emerald-800/30 to-slate-900",
                                                            activeStudioBg === 'space' && "bg-gradient-to-tr from-indigo-950 via-purple-950 to-slate-950"
                                                        )}>
                                                            {/* Background animation elements */}
                                                            {activeStudioBg === 'stage' && (
                                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-full bg-yellow-400/20 blur-xl origin-top rotate-12 animate-pulse" />
                                                            )}
                                                            {activeStudioBg === 'cyber' && (
                                                                <div className="absolute inset-0 bg-grid-pattern opacity-25" />
                                                            )}
                                                            {activeStudioBg === 'space' && (
                                                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent animate-pulse" />
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Main Pet Image */}
                                                    <img 
                                                        src={pet.image} 
                                                        className={cn(
                                                            "w-full h-full object-cover relative z-10 transition-all duration-300 pointer-events-none",
                                                            dressingStep === 'clean' && "brightness-95 contrast-105",
                                                            dressingStep === 'dry' && dryProgress < 100 && "brightness-90 saturate-125 filter blur-[0.3px]"
                                                        )} 
                                                        alt="outfit-avatar" 
                                                    />

                                                    {/* Dynamic Particle Overlays (Soap Bubbles / Blow dryer breeze) */}
                                                    {particles.map((p) => (
                                                        <span
                                                            key={p.id}
                                                            className="absolute text-xl pointer-events-none select-none z-35 animate-bounce"
                                                            style={{
                                                                left: `${p.x}%`,
                                                                top: `${p.y}%`,
                                                                transform: 'translate(-50%, -50%)'
                                                            }}
                                                        >
                                                            {p.emoji}
                                                        </span>
                                                    ))}

                                                    {/* Dynamic Speech Bubble Reaction */}
                                                    <AnimatePresence>
                                                        {petSpeech && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                                                className="absolute top-[20%] left-[8%] right-[8%] bg-white/90 dark:bg-black/90 backdrop-blur-md border border-purple-250/50 dark:border-white/10 p-2.5 rounded-2xl shadow-xl z-40 text-center font-black text-[10px] text-purple-700 dark:text-purple-300 select-none flex items-center justify-center gap-1.5"
                                                            >
                                                                <span>💬</span>
                                                                <span>{petSpeech}</span>
                                                                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 dark:bg-black/90 rotate-45 border-r border-b border-purple-250/50 dark:border-white/10" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    {/* Shaking Mystery Chest Animation */}
                                                    <AnimatePresence>
                                                        {isChestOpening && (
                                                            <motion.div 
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                                className="absolute inset-0 bg-black/75 backdrop-blur-sm z-45 flex flex-col items-center justify-center text-white"
                                                            >
                                                                <motion.div
                                                                    animate={{
                                                                        rotate: [0, -10, 10, -10, 10, -5, 5, -5, 5, 0],
                                                                        scale: [1, 1.05, 0.95, 1.05, 1, 1.05, 1],
                                                                    }}
                                                                    transition={{
                                                                        repeat: Infinity,
                                                                        duration: 0.8,
                                                                        ease: "easeInOut",
                                                                    }}
                                                                    className="text-7xl mb-3"
                                                                >
                                                                    🎁
                                                                </motion.div>
                                                                <span className="text-[10px] font-black tracking-wider uppercase animate-pulse text-yellow-400">Sandık Açılıyor...</span>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    {/* Chest Result Loot Box Reward Window */}
                                                    <AnimatePresence>
                                                        {!isChestOpening && chestResult && (
                                                            <motion.div 
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                                className="absolute inset-0 bg-black/85 backdrop-blur-md z-45 flex flex-col items-center justify-center p-4 text-center"
                                                            >
                                                                <motion.div
                                                                    initial={{ scale: 0, rotate: -180 }}
                                                                    animate={{ scale: 1, rotate: 0 }}
                                                                    transition={{ type: "spring", damping: 12 }}
                                                                    className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(234,179,8,0.5)] border-2 border-white/20 mb-3"
                                                                >
                                                                    {chestResult === 'pirate' ? '🏴‍☠️' : '🎀'}
                                                                </motion.div>
                                                                <h4 className="text-[11px] font-black text-white">
                                                                    {chestResult === 'pirate' ? 'Efsanevi Korsan Göz Bandı' : 'Centilmen Papyon'}
                                                                </h4>
                                                                <p className="text-[9px] text-yellow-400 font-extrabold mt-1">
                                                                    {chestResult === 'pirate' ? '+140 SP • XP/Beğeni Artışı' : '+90 SP • Coin/XP Artışı'}
                                                                </p>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setChestResult(null);
                                                                    }}
                                                                    className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black rounded-lg cursor-pointer transition-all active:scale-95 shadow-md shadow-purple-950/20"
                                                                >
                                                                    Gardıroba Ekle 🎒
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    {/* Bubble Overlay for Cleaning Step */}
                                                    {dressingStep === 'clean' && (
                                                        <div className="absolute inset-0 z-20 pointer-events-none">
                                                            {cleanProgress < 30 && <span className="absolute top-1/4 left-1/3 text-3xl animate-bounce">🫧</span>}
                                                            {cleanProgress < 60 && <span className="absolute top-1/2 left-1/4 text-2xl animate-pulse">🫧</span>}
                                                            {cleanProgress < 85 && <span className="absolute top-1/3 right-1/4 text-4xl animate-bounce">🫧</span>}
                                                            {cleanProgress < 100 && <span className="absolute bottom-1/3 left-1/2 text-3xl animate-pulse">🫧</span>}
                                                            {isShowerActive && (
                                                                <div className="absolute inset-0 bg-blue-400/20 flex items-center justify-center transition-all">
                                                                    <span className="text-4xl animate-ping opacity-75">🚿💦</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Dryer Wind Overlay for Drying Step */}
                                                    {dressingStep === 'dry' && (
                                                        <div className="absolute inset-0 z-20 pointer-events-none">
                                                            {dryProgress < 40 && <span className="absolute top-1/4 right-1/3 text-lg animate-bounce">💧</span>}
                                                            {dryProgress < 80 && <span className="absolute bottom-1/3 left-1/3 text-lg animate-pulse">💧</span>}
                                                            {isDryerActive && (
                                                                <div className="absolute inset-0 bg-yellow-400/10 flex items-center justify-center transition-all">
                                                                    <span className="text-4xl animate-pulse opacity-75">💨🌬️</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Absolute Positioned Accessories */}
                                                    {['accessorize', 'photo', 'completed'].includes(dressingStep) && (
                                                        <div className="absolute inset-0 z-20 pointer-events-none">
                                                            {selectedAccessories.includes('glasses') && (
                                                                <motion.div 
                                                                    initial={{ scale: 0, y: -20 }}
                                                                    animate={{ scale: 1, y: 0 }}
                                                                    className="absolute top-[37%] left-[34%] w-[33%] h-[12%] text-center text-3xl select-none"
                                                                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                                                                >
                                                                    😎
                                                                </motion.div>
                                                            )}

                                                            {selectedAccessories.includes('scarf') && (
                                                                <motion.div 
                                                                    initial={{ scale: 0, y: 20 }}
                                                                    animate={{ scale: 1, y: 0 }}
                                                                    className="absolute top-[58%] left-[28%] w-[44%] h-[16%] text-center text-4xl select-none"
                                                                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}
                                                                >
                                                                    🧣
                                                                </motion.div>
                                                            )}

                                                            {selectedAccessories.includes('hat') && (
                                                                <motion.div 
                                                                    initial={{ scale: 0, y: -40, rotate: -15 }}
                                                                    animate={{ scale: 1, y: 0, rotate: -5 }}
                                                                    className="absolute top-[16%] left-[36%] w-[28%] h-[20%] text-center text-4xl select-none"
                                                                    style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))' }}
                                                                >
                                                                    🎩
                                                                </motion.div>
                                                            )}

                                                            {selectedAccessories.includes('crown') && (
                                                                <motion.div 
                                                                    initial={{ scale: 0, y: -40 }}
                                                                    animate={{ scale: 1, y: 0 }}
                                                                    className="absolute top-[13%] left-[35%] w-[30%] h-[20%] text-center text-4xl select-none animate-bounce"
                                                                    style={{ animationDuration: '2s', filter: 'drop-shadow(0 4px 10px rgba(234,179,8,0.4))' }}
                                                                >
                                                                    👑
                                                                </motion.div>
                                                            )}

                                                            {selectedAccessories.includes('pirate') && (
                                                                <motion.div 
                                                                    initial={{ scale: 0, y: -20 }}
                                                                    animate={{ scale: 1, y: 0 }}
                                                                    className="absolute top-[36%] left-[45%] w-[18%] h-[8%] text-center text-3xl select-none"
                                                                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))' }}
                                                                >
                                                                    🏴‍☠️
                                                                </motion.div>
                                                            )}

                                                            {selectedAccessories.includes('bowtie') && (
                                                                <motion.div 
                                                                    initial={{ scale: 0, y: 20 }}
                                                                    animate={{ scale: 1, y: 0 }}
                                                                    className="absolute top-[53%] left-[43%] w-[15%] h-[10%] text-center text-3xl select-none"
                                                                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}
                                                                >
                                                                    🎀
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Camera Flash Overlay */}
                                                    {isFlashActive && (
                                                        <div className="absolute inset-0 bg-white z-50 opacity-100 pointer-events-none transition-opacity duration-205" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* STEP 1: CLEANING */}
                                            {dressingStep === 'clean' && (
                                                <div className="flex flex-col gap-2 mt-2">
                                                    <p className="text-[8.5px] text-gray-500 dark:text-gray-400 font-bold leading-normal text-center bg-blue-500/5 border border-blue-500/10 p-1.5 rounded-xl select-none">
                                                        🧼 Parmağını veya fareyi sürükleyerek köpürt!
                                                    </p>

                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-between items-center text-[8.5px] font-bold text-gray-400">
                                                            <span>Temizlik Seviyesi</span>
                                                            <span className="text-blue-500 font-extrabold">{cleanProgress}%</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-gray-200/30 dark:border-white/5 shadow-inner">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-300"
                                                                style={{ width: `${cleanProgress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                                                        <button
                                                            onClick={() => {
                                                                setIsShowerActive(true);
                                                                setCleanProgress(prev => Math.min(100, prev + 15));
                                                                setTimeout(() => setIsShowerActive(false), 600);
                                                            }}
                                                            disabled={cleanProgress >= 100}
                                                            className="flex items-center justify-center gap-1.5 p-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                                        >
                                                            <span>🧼 Köpürt</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setIsShowerActive(true);
                                                                setCleanProgress(prev => Math.min(100, prev + 20));
                                                                setTimeout(() => setIsShowerActive(false), 600);
                                                            }}
                                                            disabled={cleanProgress >= 100}
                                                            className="flex items-center justify-center gap-1.5 p-2 bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                                        >
                                                            <span>🚿 Su Tut</span>
                                                        </button>
                                                    </div>

                                                    {cleanProgress >= 100 ? (
                                                        <button
                                                            onClick={() => setDressingStep('dry')}
                                                            className="w-full mt-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10.5px] font-black py-2.5 rounded-xl cursor-pointer hover:shadow-lg active:scale-98 transition-all"
                                                        >
                                                            Kurulamaya Geç 💨
                                                        </button>
                                                    ) : (
                                                        <div className="w-full text-center text-[8.5px] text-gray-400 font-bold uppercase tracking-wider py-2 border border-dashed border-gray-250 dark:border-white/5 rounded-xl bg-gray-50/50 dark:bg-black/10">
                                                            🛁 Banyoyu bitirin
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* STEP 2: DRYING */}
                                            {dressingStep === 'dry' && (
                                                <div className="flex flex-col gap-2 mt-2">
                                                    <p className="text-[8.5px] text-gray-500 dark:text-gray-400 font-bold leading-normal text-center bg-orange-500/5 border border-orange-500/10 p-1.5 rounded-xl select-none">
                                                        💨 Parmağını veya fareyi sürükleyerek kurut!
                                                    </p>

                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-between items-center text-[8.5px] font-bold text-gray-400">
                                                            <span>Kuruluk Seviyesi</span>
                                                            <span className="text-orange-500 font-extrabold">{dryProgress}%</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-gray-200/30 dark:border-white/5 shadow-inner">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-300"
                                                                style={{ width: `${dryProgress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                                                        <button
                                                            onClick={() => {
                                                                setIsDryerActive(true);
                                                                setDryProgress(prev => Math.min(100, prev + 15));
                                                                setTimeout(() => setIsDryerActive(false), 600);
                                                            }}
                                                            disabled={dryProgress >= 100}
                                                            className="flex items-center justify-center gap-1.5 p-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                                        >
                                                            <span>💨 Fönle</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setIsDryerActive(true);
                                                                setDryProgress(prev => Math.min(100, prev + 20));
                                                                setTimeout(() => setIsDryerActive(false), 600);
                                                            }}
                                                            disabled={dryProgress >= 100}
                                                            className="flex items-center justify-center gap-1.5 p-2 bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                                        >
                                                            <span>🪮 Tara</span>
                                                        </button>
                                                    </div>

                                                    {dryProgress >= 100 ? (
                                                         <button
                                                             onClick={() => setDressingStep('accessorize')}
                                                             className="w-full mt-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10.5px] font-black py-2.5 rounded-xl cursor-pointer hover:shadow-lg active:scale-98 transition-all"
                                                         >
                                                             Kurulamayı Bitir ve Süsle 🎀
                                                         </button>
                                                     ) : (
                                                         <div className="w-full text-center text-[8.5px] text-gray-400 font-bold uppercase tracking-wider py-2 border border-dashed border-gray-250 dark:border-white/5 rounded-xl bg-gray-50/50 dark:bg-black/10">
                                                             🛁 Kurulamayı bitirin
                                                         </div>
                                                     )}
                                                 </div>
                                             )}

                                             {/* STEP 3: ACCESSORIZE */}
                                             {dressingStep === 'accessorize' && (
                                                 <div className="flex flex-col gap-2 mt-2">
                                                     {/* Daily Style Challenge Banner */}
                                                     <div className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/25 flex items-center justify-between shadow-sm select-none">
                                                         <div className="flex flex-col gap-0.5">
                                                             <span className="text-[7.5px] font-black text-purple-400 uppercase tracking-widest leading-none">Bugünün Tarz Teması</span>
                                                             <h5 className="text-[10px] font-black text-white flex items-center gap-1 mt-0.5">
                                                                 🏴‍☠️ Korsan Balosu 👑
                                                             </h5>
                                                             <p className="text-[7.5px] text-gray-400 font-semibold leading-none">Gereksinim: Taç veya Korsan Bandı</p>
                                                         </div>
                                                         <div className="flex items-center">
                                                             <span className={cn(
                                                                 "text-[8px] font-black px-2 py-0.5 rounded-full border leading-none transition-all",
                                                                 (selectedAccessories.includes('crown') || selectedAccessories.includes('pirate'))
                                                                     ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                                                     : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                                                             )}>
                                                                 {(selectedAccessories.includes('crown') || selectedAccessories.includes('pirate')) ? "✓ Uygun +50🪙" : "Gereken"}
                                                             </span>
                                                         </div>
                                                     </div>

                                                     {/* Interactive Wardrobe Drawer Selection */}
                                                     <div className="flex items-center justify-between mt-1">
                                                         <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gardırop Çekmecesi</h4>
                                                         <span className="text-[8.5px] font-black text-yellow-650 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/25">Cüzdan: 🪙 {walletBalance}</span>
                                                     </div>

                                                     {/* Mystery Loot Chest Button */}
                                                     <button
                                                         onClick={handleOpenChest}
                                                         className="w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-650 hover:from-yellow-600 hover:to-yellow-700 text-white font-black text-[9.5px] py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95 hover:scale-[1.01]"
                                                     >
                                                         <span>🎁 Gizemli Tarz Sandığı Aç</span>
                                                         <span className="bg-yellow-950/20 px-1.5 py-0.5 rounded-md border border-white/10 text-[8.5px]">100 MoffiCoin</span>
                                                     </button>
                                                     
                                                     <div className="grid grid-cols-3 gap-2 mt-0.5">
                                                         {/* Accessory 1: Glasses */}
                                                         <div 
                                                             onClick={() => handleToggleAccessory('glasses')}
                                                             className={cn(
                                                                 "p-2 border-2 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer text-center relative shadow-sm transition-all active:scale-95 select-none",
                                                                 selectedAccessories.includes('glasses')
                                                                     ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/5"
                                                                     : "bg-white/40 dark:bg-black/20 border-gray-200/50 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
                                                             )}
                                                         >
                                                             <span className="text-xl">😎</span>
                                                             <span className="text-[8px] font-black text-gray-800 dark:text-gray-200 leading-none">Gözlük</span>
                                                             <span className="text-[7px] font-bold text-cyan-500 dark:text-cyan-400 leading-none mt-0.5">+15% XP</span>
                                                         </div>
 
                                                         {/* Accessory 2: Scarf */}
                                                         <div 
                                                             onClick={() => handleToggleAccessory('scarf')}
                                                             className={cn(
                                                                 "p-2 border-2 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer text-center relative shadow-sm transition-all active:scale-95 select-none",
                                                                 selectedAccessories.includes('scarf')
                                                                     ? "bg-red-500/10 border-red-500 text-red-500 shadow-md shadow-red-500/5"
                                                                     : "bg-white/40 dark:bg-black/20 border-gray-200/50 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
                                                             )}
                                                         >
                                                             <span className="text-xl">🧣</span>
                                                             <span className="text-[8px] font-black text-gray-800 dark:text-gray-200 leading-none">Boyunluk</span>
                                                             <span className="text-[7px] font-bold text-red-500 dark:text-red-400 leading-none mt-0.5">+10% Coin</span>
                                                         </div>
 
                                                         {/* Accessory 3: Retro Hat (Premium Lock) */}
                                                         <div 
                                                             onClick={() => handleToggleAccessory('hat')}
                                                             className={cn(
                                                                 "p-2 border-2 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer text-center relative shadow-sm transition-all active:scale-95 select-none",
                                                                 !unlockedAccessories.includes('hat')
                                                                     ? "bg-gray-100/50 dark:bg-black/40 border-dashed border-gray-300 dark:border-white/10"
                                                                     : selectedAccessories.includes('hat')
                                                                         ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-md shadow-purple-500/5"
                                                                         : "bg-white/40 dark:bg-black/20 border-gray-200/50 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
                                                             )}
                                                         >
                                                             <span className={cn("text-xl", !unlockedAccessories.includes('hat') && "opacity-40 filter blur-[0.5px]")}>🎩</span>
                                                             <span className="text-[8px] font-black text-gray-800 dark:text-gray-200 leading-none">Şapka</span>
                                                             
                                                             {!unlockedAccessories.includes('hat') ? (
                                                                 <span className="text-[6.5px] font-black text-purple-650 bg-purple-50/10 px-1 py-0.5 rounded border border-purple-500/20 mt-0.5 flex items-center gap-0.5 leading-none">
                                                                     <Lock className="w-1.5 h-1.5 shrink-0" /> 150
                                                                 </span>
                                                             ) : (
                                                                 <span className="text-[7px] font-bold text-purple-500 dark:text-purple-400 leading-none mt-0.5">+20% Pop</span>
                                                             )}
                                                         </div>
 
                                                         {/* Accessory 4: Royal Crown (Premium Lock) */}
                                                         <div 
                                                             onClick={() => handleToggleAccessory('crown')}
                                                             className={cn(
                                                                 "p-2 border-2 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer text-center relative shadow-sm transition-all active:scale-95 select-none",
                                                                 !unlockedAccessories.includes('crown')
                                                                     ? "bg-gray-100/50 dark:bg-black/40 border-dashed border-gray-300 dark:border-white/10"
                                                                     : selectedAccessories.includes('crown')
                                                                         ? "bg-yellow-500/10 border-yellow-500 text-yellow-400 shadow-md shadow-yellow-500/5 animate-pulse"
                                                                         : "bg-white/40 dark:bg-black/20 border-gray-200/50 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
                                                             )}
                                                         >
                                                             <span className={cn("text-xl", !unlockedAccessories.includes('crown') && "opacity-40 filter blur-[0.5px]")}>👑</span>
                                                             <span className="text-[8px] font-black text-gray-800 dark:text-gray-200 leading-none">Taç</span>
                                                             
                                                             {!unlockedAccessories.includes('crown') ? (
                                                                 <span className="text-[6.5px] font-black text-yellow-600 bg-yellow-500/10 px-1 py-0.5 rounded border border-yellow-500/20 mt-0.5 flex items-center gap-0.5 leading-none">
                                                                     <Lock className="w-1.5 h-1.5 shrink-0" /> 350
                                                                 </span>
                                                             ) : (
                                                                 <span className="text-[7px] font-bold text-yellow-500 dark:text-yellow-400 leading-none mt-0.5">+25% VIP</span>
                                                             )}
                                                         </div>

                                                         {/* Accessory 5: Pirate Patch (Sandık Gizli Drop) */}
                                                         <div 
                                                             onClick={() => {
                                                                 if (unlockedAccessories.includes('pirate')) {
                                                                     handleToggleAccessory('pirate');
                                                                 } else {
                                                                     setToastMsg("🏴‍☠️ Efsanevi Göz Bandı sadece Gizemli Sandık'tan çıkabilir! Şansını dene 🎁");
                                                                 }
                                                             }}
                                                             className={cn(
                                                                 "p-2 border-2 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer text-center relative shadow-sm transition-all active:scale-95 select-none",
                                                                 !unlockedAccessories.includes('pirate')
                                                                     ? "bg-gray-100/30 dark:bg-black/40 border-dashed border-gray-250 dark:border-white/5"
                                                                     : selectedAccessories.includes('pirate')
                                                                         ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-md shadow-amber-500/5 animate-pulse"
                                                                         : "bg-white/40 dark:bg-black/20 border-gray-200/50 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
                                                             )}
                                                         >
                                                             <span className={cn("text-xl", !unlockedAccessories.includes('pirate') && "opacity-40 filter blur-[0.5px]")}>🏴‍☠️</span>
                                                             <span className="text-[8px] font-black text-gray-800 dark:text-gray-200 leading-none">Korsan</span>
                                                             
                                                             {!unlockedAccessories.includes('pirate') ? (
                                                                 <span className="text-[6.5px] font-black text-amber-600 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 mt-0.5 flex items-center gap-0.5 leading-none">
                                                                     🎁 Sandık
                                                                 </span>
                                                             ) : (
                                                                 <span className="text-[7px] font-bold text-amber-500 dark:text-amber-400 leading-none mt-0.5">+30% XP</span>
                                                             )}
                                                         </div>

                                                         {/* Accessory 6: Bow Tie (Sandık Gizli Drop) */}
                                                         <div 
                                                             onClick={() => {
                                                                 if (unlockedAccessories.includes('bowtie')) {
                                                                     handleToggleAccessory('bowtie');
                                                                 } else {
                                                                     setToastMsg("🎀 Centilmen Papyon sadece Gizemli Sandık'tan çıkabilir! Şansını dene 🎁");
                                                                 }
                                                             }}
                                                             className={cn(
                                                                 "p-2 border-2 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer text-center relative shadow-sm transition-all active:scale-95 select-none",
                                                                 !unlockedAccessories.includes('bowtie')
                                                                     ? "bg-gray-100/30 dark:bg-black/40 border-dashed border-gray-250 dark:border-white/5"
                                                                     : selectedAccessories.includes('bowtie')
                                                                         ? "bg-pink-500/10 border-pink-500 text-pink-500 shadow-md shadow-pink-500/5 animate-pulse"
                                                                         : "bg-white/40 dark:bg-black/20 border-gray-200/50 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
                                                             )}
                                                         >
                                                             <span className={cn("text-xl", !unlockedAccessories.includes('bowtie') && "opacity-40 filter blur-[0.5px]")}>🎀</span>
                                                             <span className="text-[8px] font-black text-gray-800 dark:text-gray-200 leading-none">Papyon</span>
                                                             
                                                             {!unlockedAccessories.includes('bowtie') ? (
                                                                 <span className="text-[6.5px] font-black text-pink-650 bg-pink-50/10 px-1 py-0.5 rounded border border-pink-500/25 mt-0.5 flex items-center gap-0.5 leading-none">
                                                                     🎁 Sandık
                                                                 </span>
                                                             ) : (
                                                                 <span className="text-[7px] font-bold text-pink-500 dark:text-pink-400 leading-none mt-0.5">+20% Coin</span>
                                                             )}
                                                         </div>
                                                     </div>
                                                 </div>
                                             )}


                                            {/* STEP 4: PHOTOSHOOT */}
                                            {dressingStep === 'photo' && (
                                                <div className="flex flex-col gap-2 mt-2">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest">Stüdyo Arka Planı Seç</span>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {[
                                                                { bg: 'stage', label: '🎬 Sahne' },
                                                                { bg: 'cyber', label: '🌆 Neon' },
                                                                { bg: 'park', label: '🌳 Doğa' },
                                                                { bg: 'space', label: '🚀 Uzay' }
                                                            ].map((item) => (
                                                                <button
                                                                    key={item.bg}
                                                                    onClick={() => setActiveStudioBg(item.bg as any)}
                                                                    className={cn(
                                                                        "py-1.5 rounded-xl text-[8.5px] font-black transition-all cursor-pointer border active:scale-95",
                                                                        activeStudioBg === item.bg
                                                                            ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                                                                            : "bg-white/40 dark:bg-black/20 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-white/5 hover:bg-gray-100"
                                                                    )}
                                                                >
                                                                    {item.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setIsFlashActive(true);
                                                            setToastMsg("📸 Muhteşem bir an yakalandı!");
                                                            setTimeout(() => {
                                                                setIsFlashActive(false);
                                                                setDressingStep('completed');
                                                            }, 350);
                                                        }}
                                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-750 text-white text-[10.5px] font-black py-3 rounded-xl cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 mt-1"
                                                    >
                                                        <span>📸 FOTOĞRAF ÇEK</span>
                                                    </button>
                                                </div>
                                            )}

                                            {/* STEP 5: COMPLETED */}
                                            {dressingStep === 'completed' && (
                                                <div className="flex flex-col gap-2 mt-2">
                                                    <div className="p-2 bg-gradient-to-tr from-yellow-500/10 to-amber-500/5 border border-yellow-200/30 rounded-xl text-center">
                                                        <span className="text-[11px] font-black text-yellow-500 flex items-center justify-center gap-1.5 animate-pulse">
                                                            🏆 Moffi Fashion Card Hazır!
                                                        </span>
                                                        <p className="text-[8.5px] text-gray-500 mt-0.5 font-semibold leading-relaxed">
                                                            Kombin ve özellikler kaydedilmek için hazırlandı.
                                                        </p>
                                                    </div>

                                                    {/* Stat bonuses preview */}
                                                    <div className="grid grid-cols-3 gap-1.5 text-center">
                                                        <div className="bg-white/50 dark:bg-black/20 border border-gray-250/10 rounded-xl p-1.5 flex flex-col items-center justify-center gap-0.5">
                                                            <Coins className="w-3.5 h-3.5 text-yellow-500" />
                                                            <span className="text-[9.5px] font-black text-gray-800 dark:text-gray-200">+{activeBonus.walkCoinBonus}%</span>
                                                            <span className="text-[6px] font-bold text-gray-400 uppercase">Yürüyüş</span>
                                                        </div>
                                                        <div className="bg-white/50 dark:bg-black/20 border border-gray-250/10 rounded-xl p-1.5 flex flex-col items-center justify-center gap-0.5">
                                                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                                            <span className="text-[9.5px] font-black text-gray-800 dark:text-gray-200">+{activeBonus.xpBonus}%</span>
                                                            <span className="text-[6px] font-bold text-gray-400 uppercase">XP</span>
                                                        </div>
                                                        <div className="bg-white/50 dark:bg-black/20 border border-gray-250/10 rounded-xl p-1.5 flex flex-col items-center justify-center gap-0.5">
                                                            <Heart className="w-3.5 h-3.5 text-red-500" />
                                                            <span className="text-[9.5px] font-black text-gray-800 dark:text-gray-200">+{activeBonus.likeBoost}%</span>
                                                            <span className="text-[6px] font-bold text-gray-400 uppercase">Sosyal</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                                        <button
                                                            onClick={() => {
                                                                setCleanProgress(0);
                                                                setDryProgress(0);
                                                                setDressingStep('clean');
                                                            }}
                                                            className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-black rounded-xl transition-all cursor-pointer text-center"
                                                        >
                                                            🔄 Baştan Başla
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setDressingStep('clean');
                                                                setCleanProgress(0);
                                                                setDryProgress(0);
                                                                handleSaveOutfit();
                                                            }}
                                                            className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer text-center shadow-md shadow-purple-900/10"
                                                        >
                                                            ✨ Kombini Kaydet
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                             {/* POLAROID PHOTO ALBUM */}
                                             <div className="mt-4 pt-4 border-t border-purple-100/25 dark:border-white/5">
                                                 <div className="flex items-center justify-between mb-3 px-1">
                                                     <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                                         📂 Benim Albümüm ({photoAlbum.length})
                                                     </h4>
                                                     <span className="text-[8px] font-bold text-gray-400">Yatay Kaydırın ➔</span>
                                                 </div>

                                                 {photoAlbum.length === 0 ? (
                                                     <div className="text-center py-6 border border-dashed border-gray-200 dark:border-white/5 rounded-2xl bg-gray-50/50 dark:bg-black/10 select-none">
                                                         <span className="text-xl opacity-60 block">📸</span>
                                                         <span className="text-[9px] text-gray-400 font-bold mt-1 block">Henüz kaydedilmiş kombin fotoğrafı yok!</span>
                                                     </div>
                                                 ) : (
                                                     <div className="flex gap-4 overflow-x-auto pb-3 pt-1 px-1 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
                                                         {photoAlbum.map((photo) => (
                                                             <motion.div
                                                                 key={photo.id}
                                                                 whileHover={{ scale: 1.03, y: -2 }}
                                                                 className="w-[125px] shrink-0 bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-white/10 rounded-xl shadow-lg p-2 flex flex-col gap-1.5 select-none relative overflow-hidden"
                                                                 style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.06))' }}
                                                             >
                                                                 {/* Mini Polaroid Photo Area */}
                                                                 <div className={cn(
                                                                     "w-full aspect-[1/1] rounded-lg overflow-hidden relative border border-gray-100 dark:border-white/5 bg-cover bg-center flex items-center justify-center",
                                                                     photo.bg === 'stage' && "bg-gradient-to-b from-yellow-500/20 via-purple-900/30 to-black/50",
                                                                     photo.bg === 'cyber' && "bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-slate-900",
                                                                     photo.bg === 'park' && "bg-gradient-to-b from-green-500/10 via-emerald-800/20 to-slate-900",
                                                                     photo.bg === 'space' && "bg-gradient-to-tr from-indigo-950 via-purple-950 to-slate-950"
                                                                 )}>
                                                                     <img src={pet.image} className="w-[85%] h-[85%] object-cover select-none pointer-events-none" />
                                                                     {/* Accessory badges overlaid onto the mini photo */}
                                                                     <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 pointer-events-none">
                                                                         {photo.accessories.map((acc) => (
                                                                             <span key={acc} className="text-[9px] bg-black/50 backdrop-blur-[1px] rounded px-0.5">
                                                                                 {acc === 'glasses' && '😎'}
                                                                                 {acc === 'scarf' && '🧣'}
                                                                                 {acc === 'hat' && '🎩'}
                                                                                 {acc === 'crown' && '👑'}
                                                                                 {acc === 'pirate' && '🏴‍☠️'}
                                                                                 {acc === 'bowtie' && '🎀'}
                                                                             </span>
                                                                         ))}
                                                                     </div>
                                                                 </div>

                                                                 {/* Polaroid Label Area */}
                                                                 <div className="flex flex-col gap-0.5 text-center mt-1">
                                                                     <span className="text-[7.5px] font-black text-gray-800 dark:text-gray-200 truncate">{photo.theme}</span>
                                                                     <span className="text-[8px] font-extrabold text-purple-600 dark:text-purple-400">{photo.sp} Tarz P.</span>
                                                                     <div className="flex justify-between items-center text-[6px] text-gray-400 font-bold mt-1 border-t border-gray-100 dark:border-white/5 pt-1">
                                                                         <span>{photo.date}</span>
                                                                         <span className="uppercase text-purple-500">{photo.bg}</span>
                                                                     </div>
                                                                 </div>
                                                             </motion.div>
                                                         ))}
                                                     </div>
                                                 )}
                                             </div>
                                         </>

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

                                    {/* 7. Eşleştir (Match) Panel */}
                                    {expandedPanel === 'match' && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Flame className="w-6 h-6 text-rose-500 animate-pulse" />
                                                    <h3 className="text-lg font-black text-gray-800">Pati Flört & Eşleştirme</h3>
                                                </div>
                                                <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                                    Canlı Arama
                                                </span>
                                            </div>

                                            {isMatched ? (
                                                <motion.div 
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-rose-50 to-white rounded-[28px] border border-rose-100"
                                                >
                                                    <div className="flex items-center justify-center gap-4 mb-4">
                                                        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-md relative">
                                                            <img src={pet.image} className="w-full h-full object-cover" alt={pet.name} />
                                                        </div>
                                                        <span className="text-3xl animate-bounce">💖</span>
                                                        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-md">
                                                            <img src={MATCH_CANDIDATES[matchIndex].image} className="w-full h-full object-cover" alt="Match" />
                                                        </div>
                                                    </div>
                                                    <h4 className="text-lg font-black text-rose-800">Eşleşme Başarılı! 🎉</h4>
                                                    <p className="text-xs text-gray-500 font-semibold mt-2 leading-relaxed px-4">
                                                        **{pet.name}** ve **{MATCH_CANDIDATES[matchIndex].name}** için harika bir aura uyumu (%{MATCH_CANDIDATES[matchIndex].auraMatch}) bulundu.
                                                    </p>
                                                    <div className="mt-5 p-3.5 bg-white border border-rose-100 rounded-2xl w-full flex items-center gap-2 text-left">
                                                        <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                                                        <p className="text-[10px] text-rose-800 font-bold">
                                                            **Sohbeti Başlat:** Canlı sohbet odası aktif. İlk mesajı gönderin!
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2.5 w-full mt-6">
                                                        <button 
                                                            onClick={() => {
                                                                setIsMatched(false);
                                                                setMatchIndex((prev) => (prev + 1) % MATCH_CANDIDATES.length);
                                                            }}
                                                            className="flex-1 py-3 border border-rose-200 hover:bg-rose-50/50 text-rose-600 rounded-xl text-[11px] font-black cursor-pointer transition-all"
                                                        >
                                                            Yeni Adaylar
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setExpandedPanel(null);
                                                                setToastMsg(`💬 ${MATCH_CANDIDATES[matchIndex].name} için sohbet başlatıldı!`);
                                                            }}
                                                            className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[11px] font-black shadow-md shadow-rose-500/10 cursor-pointer transition-all"
                                                        >
                                                            Mesaj Gönder
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <div className="flex-1 flex flex-col gap-4">
                                                    {/* The Swipe Card */}
                                                    <div className="bg-white border border-gray-150 rounded-[28px] overflow-hidden shadow-sm flex flex-col relative group">
                                                        {/* Aura Match Indicator Tag */}
                                                        <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-sm z-10 flex items-center gap-1">
                                                            <Sparkles className="w-3 h-3 text-white" />
                                                            <span>AURA UYUMU %{MATCH_CANDIDATES[matchIndex].auraMatch}</span>
                                                        </div>

                                                        {/* Image */}
                                                        <div className="h-44 w-full relative">
                                                            <img 
                                                                src={MATCH_CANDIDATES[matchIndex].image} 
                                                                className="w-full h-full object-cover" 
                                                                alt={MATCH_CANDIDATES[matchIndex].name} 
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                                            <div className="absolute bottom-3 left-4 text-white">
                                                                <h4 className="text-base font-black flex items-baseline gap-1.5 leading-none">
                                                                    {MATCH_CANDIDATES[matchIndex].name}
                                                                    <span className="text-[10px] font-bold opacity-90">({MATCH_CANDIDATES[matchIndex].age})</span>
                                                                </h4>
                                                                <span className="text-[9px] font-bold opacity-80 mt-1 block">{MATCH_CANDIDATES[matchIndex].breed} • {MATCH_CANDIDATES[matchIndex].gender}</span>
                                                            </div>
                                                        </div>

                                                        {/* Card Body */}
                                                        <div className="p-4 flex flex-col gap-2.5">
                                                            <div className="flex justify-between items-center bg-gray-55 border border-gray-100 p-2 rounded-xl">
                                                                <span className="text-[9px] font-black text-gray-450 uppercase">Mizac & Aura</span>
                                                                <span className="text-[10px] font-black text-gray-800">{MATCH_CANDIDATES[matchIndex].aura}</span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                                                                {MATCH_CANDIDATES[matchIndex].bio}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex justify-center items-center gap-4 py-2">
                                                        <button 
                                                            onClick={() => {
                                                                setMatchIndex((prev) => (prev + 1) % MATCH_CANDIDATES.length);
                                                                setToastMsg("👎 Aday geçildi.");
                                                            }}
                                                            className="w-12 h-12 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shadow-sm cursor-pointer"
                                                        >
                                                            <X className="w-5 h-5" strokeWidth={2.5} />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setIsMatched(true);
                                                                setToastMsg(`💖 Eşleşme İsteği Gönderildi!`);
                                                            }}
                                                            className="w-14 h-14 bg-gradient-to-tr from-rose-500 to-pink-500 text-white rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-md shadow-rose-500/10 cursor-pointer"
                                                        >
                                                            <Heart className="w-6 h-6 fill-white" strokeWidth={2} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
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
                                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-green-400 shadow-md shrink-0 relative">
                                                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150" className="w-full h-full object-cover" alt="User Avatar" />
                                                    <div className="absolute bottom-0 right-0 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-black tracking-tight leading-tight">Merhaba, Üveys! 👋</h3>
                                                        <span className="text-[8px] font-black text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 uppercase tracking-widest flex items-center gap-0.5">
                                                            <Award className="w-2.5 h-2.5" /> GOLD
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-300 font-semibold mt-1">uv***@gmail.com • Premium Üye</p>
                                                    <div className="mt-2 text-[9px] text-green-300 font-bold bg-green-500/15 border border-green-500/25 px-2 py-0.5 rounded-md inline-block">
                                                        🧬 {pet.name}: F1 Pedigree • Safkan {pet.breed.split(' • ')[0]}
                                                    </div>
                                                </div>
                                            </div>



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
                                                                <p className="text-[10px] text-gray-400 font-semibold max-w-[200px]">Luna için eklediğiniz ürünler burada görünür.</p>
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

                                                    <button className="flex items-center justify-between p-4.5 rounded-3xl bg-white border border-gray-100 hover:bg-gray-50/80 transition-all text-left group cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
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
                            {/* Left/Right click handlers for navigation (restricted to middle height to keep header close button and footer CTA clickable) */}
                            <div className="absolute inset-x-0 top-[80px] bottom-[120px] z-10 flex">
                                <div className="w-1/2 h-full cursor-w-resize" onClick={prevStory} />
                                <div className="w-1/2 h-full cursor-e-resize" onClick={nextStory} />
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
                                                        transition: pct === 0 ? 'none' : 'width 5000ms linear'
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
                                    {activeStory.badge && (
                                        <span className="self-start text-[8px] font-black tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-450/20 px-2 py-0.5 rounded-md uppercase">
                                            {activeStory.badge}
                                        </span>
                                    )}
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
            />

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
                newPetStreak={newPetStreak}
                setNewPetStreak={setNewPetStreak}
            />

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
