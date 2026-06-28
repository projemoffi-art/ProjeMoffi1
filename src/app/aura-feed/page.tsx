"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Flame, Coins, Trophy, Swords, Crown, Medal, Plus, Heart, 
    MessageCircle, Share2, Compass, Grid3X3, List, X, Send, 
    ArrowLeft, HelpCircle, User, Zap, Footprints, BadgeCheck,
    PawPrint, Sparkles, Volume2, VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Mock Data representing state
const MOCK_POSTS = [
    {
        id: "post_1",
        username: "pamuk_the_cat",
        avatar: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=150",
        media: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600",
        caption: "Günün en uykulu anı... Kediler dünyasında uyumak ciddidir 😴🐾",
        likes: 142,
        commentsCount: 23,
        audioName: "Pamuk - Mırlama Melodisi (Orijinal)",
        isLiked: false,
        petType: "cat",
        commentsList: [
            { id: 1, user: "@boncuk_kedi", text: "Yerim ya çok tatlı 😍" },
            { id: 2, user: "@duman_bey", text: "Ben de bütün gün uyudum bugün..." }
        ]
    },
    {
        id: "post_2",
        username: "tarcin_golden",
        avatar: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=150",
        media: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=600",
        caption: "Parkta frizbi kovalamaca! Havada takla atmaya çalışırken ben 🐕💨",
        likes: 389,
        commentsCount: 54,
        audioName: "Golden Beats - Park Eğlencesi",
        isLiked: false,
        petType: "dog",
        commentsList: [
            { id: 1, user: "@milo_intelligent", text: "Frizbi konusunda yarışalım mı dostum? 😉" },
            { id: 2, user: "@sarikiz_hav", text: "Harika atlayış!" }
        ]
    },
    {
        id: "post_3",
        username: "boncuk_bird",
        avatar: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=150",
        media: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600",
        caption: "Yeni kafes salıncağımda keyif yapıyorum. Şarkımı dinleyin! 🦜🎵",
        likes: 87,
        commentsCount: 12,
        audioName: "Boncuk - Şakıyan Kanatlar",
        isLiked: false,
        petType: "bird",
        commentsList: [
            { id: 1, user: "@mavi_boncuk", text: "Sesin çok güzel çıkmış kuşum!" }
        ]
    }
];

const CHAPTER_QUESTS: Record<number, any[]> = {
    1: [
        { id: "q1", title: "Kayıp Sincap 🐿️", desc: "Feed'deki gizemli orman sincabını bul ve tıkla!", reward: 15, xpReward: 30, icon: Compass, completed: false },
        { id: "q2", title: "Zehirli Mantar 🍄", desc: "Slide 1'deki mantarı bulup üstüne dokun!", reward: 10, xpReward: 25, icon: Zap, completed: false },
        { id: "q3", title: "Pati Selamı 🐾", desc: "Düello Meydanında (Slide 3) oyunu kullan!", reward: 10, xpReward: 25, icon: MessageCircle, completed: false },
        { id: "q4", title: "Sürpriz Görev 📜", desc: "Tılsımlı orman parşömenini kazı!", reward: 25, xpReward: 60, icon: HelpCircle, completed: false }
    ],
    2: [
        { id: "q1", title: "Kum Fırtınası 💨", desc: "Peti 5 kez hızlıca gıdıklayarak fırtınadan kurtar!", reward: 15, xpReward: 30, icon: Zap, completed: false },
        { id: "q2", title: "Altın Kaktüs 🌵", desc: "Slide 1'de saklı kaktüsü bulup topla!", reward: 10, xpReward: 25, icon: Compass, completed: false },
        { id: "q3", title: "Güneş Düellosu ⚔️", desc: "Kanyon düellosunda (Slide 3) oy kullan!", reward: 10, xpReward: 25, icon: MessageCircle, completed: false },
        { id: "q4", title: "Sürpriz Görev 🏜️", desc: "Kanyon sandığını kazıyarak aç!", reward: 30, xpReward: 65, icon: HelpCircle, completed: false }
    ],
    3: [
        { id: "q1", title: "Buzu Erit ❄️", desc: "Donmuş mama kutusunu ovalayarak çöz!", reward: 20, xpReward: 40, icon: Flame, completed: false },
        { id: "q2", title: "Buzul Kartopu ☃️", desc: "Slide 1'deki yuvarlanan kartopuna tıkla!", reward: 10, xpReward: 25, icon: Compass, completed: false },
        { id: "q3", title: "Zirve Oylaması 🏔️", desc: "Kış uykusu düellosunda (Slide 3) oy kullan!", reward: 10, xpReward: 25, icon: MessageCircle, completed: false },
        { id: "q4", title: "Sürpriz Görev 🧊", desc: "Zirvedeki buzul sandığını kazı!", reward: 35, xpReward: 70, icon: HelpCircle, completed: false }
    ],
    4: [
        { id: "q1", title: "Lav Baloncuğu 💥", desc: "Slide 1'de yükselen 3 lav baloncuğunu patlat!", reward: 20, xpReward: 40, icon: Zap, completed: false, current: 0, target: 3 },
        { id: "q2", title: "Közü Söndür 🔥", desc: "Slide 1'deki yosunlu/alevli közü söndür!", reward: 15, xpReward: 35, icon: Flame, completed: false },
        { id: "q3", title: "Obsidiyen Düellosu 🌋", desc: "Ateşli duruş düellosunda (Slide 3) oy kullan!", reward: 10, xpReward: 25, icon: MessageCircle, completed: false },
        { id: "q4", title: "Sürpriz Görev 🌋", desc: "Volkanik krater sandığını kazı!", reward: 40, xpReward: 80, icon: HelpCircle, completed: false }
    ]
};

const CHAPTER_STORIES: Record<number, { title: string; intro: string; outro: string; choices: { prompt: string; optionA: string; optionB: string; gameA: string; gameB: string } }> = {
    1: {
        title: "I. Perde: Pati Ormanı'nın Fısıltıları 🌲",
        intro: "Kadim Pati Tılsımı'nın kayıp olduğunu öğrendiğinde, Pamuk hemen yola çıktı. Ormanın fısıltıları, ilk ipucunun yaramaz bir sincapta saklı olduğunu söylüyor. Maceraya başlama zamanı!",
        outro: "Pamuk ormandaki antik parşömeni çözdü: 'Güneşin kavurduğu kızıl kanyon topraklarında, altın bir kaktüs sana rehberlik edecek...' Tılsımın ilk parçası cepte, şimdi kanyona doğru!",
        choices: {
            prompt: "Tapınağın girişinde iki yol var: Yosunlu sol patika karanlık ve derin, sağdaki sarmaşık köprü ise sallanıyor. Hangisinden gideceksin?",
            optionA: "Karanlık Patikaya Gir 🕯️",
            optionB: "Sarmaşık Köprüden Geç 🌉",
            gameA: "Karanlıkta meşale yakmak için ekrana 6 kez tıklamalısın!",
            gameB: "Dengeni korumak için pete 6 kez tıklamalısın!"
        }
    },
    2: {
        title: "II. Perde: Kanyonun Kayıp Tapınağı 🏜️",
        intro: "Kızıl kanyonun kurak rüzgarları Pamuk'u karşıladı. Fırtınanın ortasından geçerek kayıp kum sandığına ulaşmalı ve tılsımın ikinci parçasını kurtarmalıyız!",
        outro: "Kanyon sandığından çıkan antik rünler parıldadı: 'Ebedi karla kaplı zirveye çık. Donmuş kapıyı erittiğinde, üçüncü mühür açılacak.' Yolumuz Karlı Zirve'ye gidiyor!",
        choices: {
            prompt: "Kumların altında yarısı batmış kadim bir sandık buldun. Sandığı doğrudan zorlayacak mısın, yoksa anahtar deliğini kumdan temizleyecek misin?",
            optionA: "Sandığı Zorla 🔨",
            optionB: "Kumları Temizle 🧽",
            gameA: "Sandık kapağını kırmak için gücünü topla ve 6 kez tıkla!",
            gameB: "Kumları temizlemek için parşömene 6 kez sürterek kazı!"
        }
    },
    3: {
        title: "III. Perde: Glasiyer Tapınağı ❄️",
        intro: "Korkunç bir kış fırtınası zirveyi kaplamış durumda. Pamuk, glasiyer tapınağının buz tutmuş antik kapısını eritip üçüncü parçayı elde etmeli!",
        outro: "Üçüncü parça birleştiğinde tılsım ısınmaya başladı: 'Son parça, dünyanın kalbinde, kraterin magmasında dövüldü.' Büyük final için Volkanik Krater'e iniyoruz!",
        choices: {
            prompt: "Buzul tapınağının içinde devasa bir buz heykeli yolu kapatıyor. Ateşle heykeli eritecek misin, yoksa yanındaki gizli tüneli mi kazacaksın?",
            optionA: "Ateşle Erit 🔥",
            optionB: "Gizli Tüneli Kaz ⛏️",
            gameA: "Ateşi harlamak için ekrana 6 kez hızlıca dokun!",
            gameB: "Tüneli kazmak için pete 6 kez vurarak yolu aç!"
        }
    },
    4: {
        title: "IV. Perde: Volkanın Kalbi 🌋",
        intro: "Sıcak magma nehirleri ve obsidiyen kayalar arasındayız. Tılsımın son parçasını magmadan çekip çıkarıp karanlığı tamamen yok etme zamanı!",
        outro: "İNANILMAZ! Pamuk dört parçayı bir araya getirdi ve Pati Tılsımı'nı yeniden dövdü! Moffi dünyası kurtuldu! Ancak macera bitmedi... New Game+ modu ile daha zorlu bir serüven başlıyor!",
        choices: {
            prompt: "Magmanın ortasındaki sunakta tılsımın son parçası duruyor. Magma baloncuklarını patlatarak bir kalkan mı yapacaksın, yoksa obsidiyen köprüyü mü onaracaksın?",
            optionA: "Magma Kalkanı Yap 🛡️",
            optionB: "Köprüyü Onar 🌉",
            gameA: "Kalkanı tamamlamak için ekrana 6 kez tıklamalısın!",
            gameB: "Kaya parçalarını birleştirmek için pete 6 kez dokun!"
        }
    }
};

const CHAPTER_THEMES: Record<number, {
    title: string;
    subtitle: string;
    bgClass: string;
    sparkColor: string;
    sparkShadow: string;
    particles: string[];
    ambientGlows: React.ReactNode;
    pathStrokes: {
        fringe: string;
        bed: string;
        pebbles: string;
        active: string;
    };
}> = {
    1: {
        title: "Pati Ormanı Serüveni",
        subtitle: "Nostaljik Keşif Haritası 🏕️",
        bgClass: "from-[#18281a]/95 via-[#1f1912]/95 to-[#281c10]/95 border-[#5c4027]/40",
        sparkColor: "#f59e0b",
        sparkShadow: "0 0 8px #ea580c, 0 0 15px #f97316",
        particles: ["🍃", "🍂", "🍃"],
        ambientGlows: (
            <>
                <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-emerald-900/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-amber-900/20 rounded-full blur-[100px]" />
            </>
        ),
        pathStrokes: {
            fringe: "#0f2a15",
            bed: "#3d2612",
            pebbles: "#704e2e",
            active: "#22c55e"
        }
    },
    2: {
        title: "Kanyon Patikası",
        subtitle: "Kurak Çöl Macerası 🏜️",
        bgClass: "from-[#2b170e]/95 via-[#23150c]/95 to-[#1a0e05]/95 border-[#8c4820]/40",
        sparkColor: "#ef4444",
        sparkShadow: "0 0 8px #dc2626, 0 0 15px #f97316",
        particles: ["🌵", "💨", "🌪️"],
        ambientGlows: (
            <>
                <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-red-950/35 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-orange-950/25 rounded-full blur-[100px]" />
            </>
        ),
        pathStrokes: {
            fringe: "#3d180c",
            bed: "#230e06",
            pebbles: "#d97706",
            active: "#ea580c"
        }
    },
    3: {
        title: "Karlı Zirve",
        subtitle: "Buzul Dağ Tırmanışı ❄️",
        bgClass: "from-[#0f172a]/95 via-[#1e293b]/95 to-[#0f172a]/95 border-[#38bdf8]/35",
        sparkColor: "#38bdf8",
        sparkShadow: "0 0 8px #0284c7, 0 0 15px #06b6d4",
        particles: ["❄️", "🌨️", "❄️"],
        ambientGlows: (
            <>
                <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-sky-950/35 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-950/30 rounded-full blur-[100px]" />
            </>
        ),
        pathStrokes: {
            fringe: "#1e3a8a",
            bed: "#2b3b5c",
            pebbles: "#94a3b8",
            active: "#06b6d4"
        }
    },
    4: {
        title: "Volkanik Krater",
        subtitle: "Ateşli Lav Vadisi 🌋",
        bgClass: "from-[#1c0a0a]/95 via-[#120505]/95 to-[#080202]/95 border-[#ef4444]/45",
        sparkColor: "#ff3300",
        sparkShadow: "0 0 8px #ef4444, 0 0 15px #f97316",
        particles: ["🔥", "🌋", "☄️"],
        ambientGlows: (
            <>
                <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-red-950/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-rose-950/30 rounded-full blur-[100px]" />
            </>
        ),
        pathStrokes: {
            fringe: "#7f1d1d",
            bed: "#180505",
            pebbles: "#f97316",
            active: "#ef4444"
        }
    }
};

// Web Audio Synthesizer Engine for self-contained regional sounds and SFX
class AudioSynthEngine {
    private ctx: AudioContext | null = null;
    private ambientSource: AudioBufferSourceNode | null = null;
    private ambientGain: GainNode | null = null;
    private birdTimer: any = null;
    private bubbleTimer: any = null;
    private chimeTimer: any = null;
    private currentChapter: number = 0;
    public isMuted: boolean = true;

    constructor() {}

    private initContext() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContextClass();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public setMute(muted: boolean) {
        this.isMuted = muted;
        if (!muted) {
            this.initContext();
            this.startAmbient(this.currentChapter);
        } else {
            this.stopAmbient();
        }
    }

    public playCoin() {
        if (this.isMuted) return;
        this.initContext();
        const ctx = this.ctx!;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        
        // Classic 8-bit coin sound: two pitches (987Hz for 0.08s, then 1318Hz)
        osc.frequency.setValueAtTime(987, now);
        osc.frequency.setValueAtTime(1318, now + 0.08);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.4);
    }

    public playScratch() {
        if (this.isMuted) return;
        this.initContext();
        const ctx = this.ctx!;
        const now = ctx.currentTime;
        
        // Create short burst of white noise for scratching
        const bufferSize = ctx.sampleRate * 0.05; // 50ms burst
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, now);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(now);
        noise.stop(now + 0.06);
    }

    public playWin() {
        if (this.isMuted) return;
        this.initContext();
        const ctx = this.ctx!;
        const now = ctx.currentTime;
        
        // Quick arpeggio: C4, E4, G4, C5
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.5);
        });
    }

    public playTransition() {
        if (this.isMuted) return;
        this.initContext();
        const ctx = this.ctx!;
        const now = ctx.currentTime;
        
        // Ambient sweeping riser
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 1.2);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, now);
        filter.frequency.exponentialRampToValueAtTime(1200, now + 1.2);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 1.3);
    }

    public startAmbient(chapter: number) {
        this.currentChapter = chapter;
        if (this.isMuted) return;
        
        this.stopAmbient();
        this.initContext();
        const ctx = this.ctx!;
        
        this.ambientGain = ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0, ctx.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.5); // Fade in
        this.ambientGain.connect(ctx.destination);

        // Create noise buffer (white noise)
        const bufferSize = ctx.sampleRate * 2; // 2 seconds loop
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        this.ambientSource = noise;

        const filter = ctx.createBiquadFilter();
        noise.connect(filter);
        filter.connect(this.ambientGain);
        
        if (chapter === 1) {
            // Forest: Soft low wind + bird chirping intervals
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(450, ctx.currentTime);
            filter.Q.setValueAtTime(0.8, ctx.currentTime);
            noise.start();
            this.startBirds();
        } else if (chapter === 2) {
            // Canyon: Deeper wind howling with frequency sweeps
            filter.type = 'bandpass';
            filter.Q.setValueAtTime(2.5, ctx.currentTime);
            noise.start();
            this.howlWind(filter);
        } else if (chapter === 3) {
            // Summit: High cold breeze + ice chimes
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1800, ctx.currentTime);
            noise.start();
            this.startChimes();
        } else if (chapter === 4) {
            // Crater: Bubbling lava rumble
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(120, ctx.currentTime);
            noise.start();
            this.startBubbles();
        }
    }

    private stopAmbient() {
        if (this.ambientSource) {
            try { this.ambientSource.stop(); } catch(e) {}
            this.ambientSource = null;
        }
        if (this.ambientGain) {
            this.ambientGain.disconnect();
            this.ambientGain = null;
        }
        clearTimeout(this.birdTimer);
        clearTimeout(this.chimeTimer);
        clearTimeout(this.bubbleTimer);
    }

    private howlWind(filter: BiquadFilterNode) {
        if (!this.ctx || this.isMuted) return;
        const ctx = this.ctx;
        const sweep = () => {
            if (this.isMuted || !this.ambientSource) return;
            const now = ctx.currentTime;
            const nextTime = now + 4 + Math.random() * 4;
            const targetFreq = 200 + Math.random() * 350;
            filter.frequency.exponentialRampToValueAtTime(targetFreq, nextTime);
            this.birdTimer = setTimeout(sweep, (nextTime - now) * 1000);
        };
        sweep();
    }

    private startBirds() {
        const chirp = () => {
            if (this.isMuted || !this.ctx) return;
            const ctx = this.ctx;
            const now = ctx.currentTime;
            
            // Bird chirp synth
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            
            const startFreq = 2000 + Math.random() * 1000;
            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(startFreq - 800, now + 0.15);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.015, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);

            this.birdTimer = setTimeout(chirp, 5000 + Math.random() * 6000);
        };
        this.birdTimer = setTimeout(chirp, 2000);
    }

    private startChimes() {
        const playChime = () => {
            if (this.isMuted || !this.ctx) return;
            const ctx = this.ctx;
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2500 + Math.random() * 1500, now);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 1.3);

            this.chimeTimer = setTimeout(playChime, 6000 + Math.random() * 8000);
        };
        this.chimeTimer = setTimeout(playChime, 3000);
    }

    private startBubbles() {
        const playBubble = () => {
            if (this.isMuted || !this.ctx) return;
            const ctx = this.ctx;
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.02, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);

            this.bubbleTimer = setTimeout(playBubble, 1500 + Math.random() * 2500);
        };
        this.bubbleTimer = setTimeout(playBubble, 1000);
    }
}

const STORE_EFFECTS = [
    { id: 'neon_heart', name: 'Neon Kalp 💖', cost: 0, emoji: '💖', color: 'text-pink-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]' },
    { id: 'gold_crown', name: 'Altın Taç 👑', cost: 100, emoji: '👑', color: 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]' },
    { id: 'fire_emblem', name: 'Ateş Mührü 🔥', cost: 200, emoji: '🔥', color: 'text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]' },
    { id: 'laser_thunder', name: 'Lazer Şimşek ⚡', cost: 350, emoji: '⚡', color: 'text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]' },
    { id: 'magic_unicorn', name: 'Büyülü Aura 🦄', cost: 500, emoji: '🦄', color: 'text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.8)]' }
];

const DUELLO_THEMES: Record<number, {
    topic: string;
    leftName: string;
    leftLoc: string;
    leftImg: string;
    rightName: string;
    rightLoc: string;
    rightImg: string;
    primaryColor: string;
    primaryGradient: string;
    badgeBg: string;
    vsBorder: string;
    accentLeft: string;
    accentRight: string;
    glowColor: string;
}> = {
    1: {
        topic: "Konu: En tatlı orman kaşifi 🌲",
        leftName: "Köfte 🐕",
        leftLoc: "Orman Patikası",
        leftImg: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300",
        rightName: "Mila 🐈",
        rightLoc: "Çayır Köşesi",
        rightImg: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=300",
        primaryColor: "text-emerald-400",
        primaryGradient: "from-emerald-500 to-teal-600",
        badgeBg: "bg-emerald-950/40 border-emerald-800 text-emerald-400",
        vsBorder: "border-emerald-500",
        accentLeft: "text-emerald-400",
        accentRight: "text-teal-400",
        glowColor: "rgba(16,185,129,0.35)"
    },
    2: {
        topic: "Konu: En havalı güneşlenme pozu ☀️",
        leftName: "Felix 🐈",
        leftLoc: "Kanyon Geçidi",
        leftImg: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=300",
        rightName: "Duman 🐈",
        rightLoc: "Kızıl Kumsal",
        rightImg: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=300",
        primaryColor: "text-amber-400",
        primaryGradient: "from-amber-500 to-orange-600",
        badgeBg: "bg-amber-950/40 border-amber-800 text-amber-400",
        vsBorder: "border-amber-500",
        accentLeft: "text-amber-400",
        accentRight: "text-orange-400",
        glowColor: "rgba(245,158,11,0.35)"
    },
    3: {
        topic: "Konu: En pofuduk kış uykusu ❄️",
        leftName: "Gofret 🐕",
        leftLoc: "Karlı Tepe",
        leftImg: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=300",
        rightName: "Tarçın 🐱",
        rightLoc: "Buzul Evi",
        rightImg: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=300",
        primaryColor: "text-cyan-400",
        primaryGradient: "from-cyan-400 to-sky-600",
        badgeBg: "bg-cyan-950/40 border-cyan-800 text-cyan-400",
        vsBorder: "border-cyan-500",
        accentLeft: "text-cyan-400",
        accentRight: "text-sky-400",
        glowColor: "rgba(6,182,212,0.35)"
    },
    4: {
        topic: "Konu: En ateşli duruş 🌋",
        leftName: "Ateş 🐕",
        leftLoc: "Magma Çanağı",
        leftImg: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=300",
        rightName: "Gece 🐈",
        rightLoc: "Obsidiyen Kale",
        rightImg: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=300",
        primaryColor: "text-rose-400",
        primaryGradient: "from-rose-500 to-red-600",
        badgeBg: "bg-rose-950/40 border-rose-800 text-rose-400",
        vsBorder: "border-rose-500",
        accentLeft: "text-rose-400",
        accentRight: "text-red-400",
        glowColor: "rgba(239,68,68,0.35)"
    }
};
export default function AuraFeedSandbox() {
    const router = useRouter();

    const [isStoreOpen, setIsStoreOpen] = useState(false);
    const [purchasedEffects, setPurchasedEffects] = useState(['neon_heart']);
    const [selectedEffect, setSelectedEffect] = useState('neon_heart');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedPurchased = localStorage.getItem('moffi_purchased_effects');
            const savedSelected = localStorage.getItem('moffi_selected_effect');
            const savedChronicles = localStorage.getItem('moffi_adventure_chronicles');
            const savedNgLoop = localStorage.getItem('moffi_adventure_ng_loop');
            const savedLastIntro = localStorage.getItem('moffi_last_read_intro');
            if (savedPurchased) {
                try { setPurchasedEffects(JSON.parse(savedPurchased)); } catch(e) {}
            }
            if (savedSelected) {
                setSelectedEffect(savedSelected);
            }
            if (savedChronicles) {
                try { setChronicles(JSON.parse(savedChronicles)); } catch(e) {}
            }
            if (savedNgLoop) {
                try { setNgLoop(parseInt(savedNgLoop)); } catch(e) {}
            }
            if (savedLastIntro) {
                try { setLastReadIntroChapter(parseInt(savedLastIntro)); } catch(e) {}
            }
        }
    }, []);

    useEffect(() => {
        const engine = new AudioSynthEngine();
        synthRef.current = engine;
        engine.setMute(isMuted);
        engine.startAmbient(activeChapter);
        
        return () => {
            engine.setMute(true);
        };
    }, []);
    const [viewMode, setViewMode] = useState<'aura' | 'grid'>('aura');
    const [coinBalance, setCoinBalance] = useState(250);
    const [streak, setStreak] = useState(4);
    
    // Level & XP States
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [xpNeeded, setXpNeeded] = useState(100);
    const [levelUpModalOpen, setLevelUpModalOpen] = useState(false);

    const getLevelTitle = (lvl: number) => {
        if (lvl === 1) return "Acemi Kaşif 🐾";
        if (lvl === 2) return "İzci Pati 🥾";
        if (lvl === 3) return "Orman Yoldaşı 🌲";
        if (lvl === 4) return "Kamp Muhafızı 🔥";
        return "Pati Efsanesi 👑";
    };

    const getStoneClass = (idx: number, isCompleted: boolean, isSelected: boolean) => {
        if (isSelected) {
            return "from-[#b59570] to-[#7c634a] bg-gradient-to-b border-[#eab308] border-b-[#3d2f21] text-[#fffbeb] shadow-[0_5px_15px_rgba(234,179,8,0.3)] scale-110";
        }
        
        if (isCompleted) {
            if (activeChapter === 1) return "from-[#387a5c] to-[#143d28] bg-gradient-to-b border-[#52b788] border-b-[#0b2417] text-[#d8f3dc] shadow-[0_5px_12px_rgba(0,0,0,0.6)]";
            if (activeChapter === 2) return "from-[#c2410c] to-[#7c2d12] bg-gradient-to-b border-[#ea580c] border-b-[#431407] text-[#ffedd5] shadow-[0_5px_12px_rgba(0,0,0,0.6)]";
            if (activeChapter === 3) return "from-[#0891b2] to-[#0e7490] bg-gradient-to-b border-[#06b6d4] border-b-[#083344] text-[#ecfeff] shadow-[0_5px_12px_rgba(0,0,0,0.6)]";
            return "from-[#ef4444] to-[#7f1d1d] bg-gradient-to-b border-[#f87171] border-b-[#450a0a] text-white shadow-[0_5px_15px_rgba(239,68,68,0.55),_inset_0_1.5px_2px_rgba(255,255,255,0.45)]";
        }
        
        // Uncompleted normal stones
        if (activeChapter === 1) return "from-[#606060] to-[#3a3a3a] bg-gradient-to-b border-[#8e8e8e] border-b-[#1e1e1e] text-[#cccccc] hover:border-[#a0a0a0] shadow-[0_5px_10px_rgba(0,0,0,0.6)]";
        if (activeChapter === 2) return "from-[#502419] to-[#2b0f0a] bg-gradient-to-b border-[#8c3d2a] border-b-[#140502] text-[#e28c74] hover:border-[#a85842] shadow-[0_5px_10px_rgba(0,0,0,0.6)]";
        if (activeChapter === 3) return "from-[#203a5c] to-[#0f1f36] bg-gradient-to-b border-[#38bdf8]/40 border-b-[#030912] text-[#93c5fd] hover:border-[#38bdf8]/70 shadow-[0_5px_10px_rgba(0,0,0,0.6)]";
        return "from-[#2e0c0c] to-[#120303] bg-gradient-to-b border-[#ef4444]/40 border-b-[#050000] text-[#f87171] hover:border-[#ef4444]/70 shadow-[0_5px_10px_rgba(0,0,0,0.8)]";
    };

    const getRockStyle = (idx: number, chapter: number) => {
        if (chapter === 1) {
            // Smooth river pebbles (Forest)
            const map = [
                { borderRadius: "50% 50% 50% 50% / 50% 50% 50% 50%" },
                { borderRadius: "55% 45% 50% 50% / 50% 60% 40% 50%" },
                { borderRadius: "45% 55% 60% 40% / 40% 50% 50% 60%" },
                { borderRadius: "48% 52% 50% 48% / 48% 50% 50% 52%" }
            ];
            return map[idx] || map[0];
        } else if (chapter === 2) {
            // Sharp sandstone rock shards / slabs (Canyon)
            const map = [
                { borderRadius: "6px 14px 4px 12px / 12px 4px 14px 6px" },
                { borderRadius: "14px 4px 18px 6px / 6px 18px 4px 14px" },
                { borderRadius: "4px 18px 8px 16px / 16px 8px 18px 4px" },
                { borderRadius: "8px 8px 18px 18px / 6px 6px 20px 20px" }
            ];
            return map[idx] || map[0];
        } else if (chapter === 3) {
            // Ice crystals / diamond cuts (Summit)
            const map = [
                { borderRadius: "20px 4px 20px 4px / 20px 4px 20px 4px" },
                { borderRadius: "4px 20px 4px 20px / 4px 20px 4px 20px" },
                { borderRadius: "15px 5px 15px 5px / 15px 5px 15px 5px" },
                { borderRadius: "10px 10px 20px 20px / 8px 8px 22px 22px" }
            ];
            return map[idx] || map[0];
        } else {
            // Sharp obsidian fragments (Volcanic Crater)
            const map = [
                { borderRadius: "8px 2px 14px 4px / 6px 12px 4px 10px" },
                { borderRadius: "3px 12px 4px 15px / 10px 4px 15px 3px" },
                { borderRadius: "10px 10px 3px 3px / 8px 8px 4px 4px" },
                { borderRadius: "6px 6px 16px 16px / 4px 4px 18px 18px" }
            ];
            return map[idx] || map[0];
        }
    };

    // Chapter State
    const [activeChapter, setActiveChapter] = useState(1);
    const [isMuted, setIsMuted] = useState(true);
    const synthRef = useRef<any>(null);
    const [quests, setQuests] = useState(CHAPTER_QUESTS[1]);
    const [posts, setPosts] = useState(MOCK_POSTS);

    // Adventure mode mini-game states
    const [isMapItemCollected, setIsMapItemCollected] = useState(false);
    const [petClickCount, setPetClickCount] = useState(0);
    const [meltClicks, setMeltClicks] = useState(0);
    const [poppedBubbles, setPoppedBubbles] = useState(0);
    const [bubbles, setBubbles] = useState<any[]>([]);

    // Realism state extensions
    const [petSpeech, setPetSpeech] = useState<string | null>(null);
    const [chronicles, setChronicles] = useState<string[]>([]);
    const [isChronicleOpen, setIsChronicleOpen] = useState(false);
    const [explosions, setExplosions] = useState<{ id: number; left: number; bottom: number }[]>([]);

    // Story and Choice Engine States
    const [ngLoop, setNgLoop] = useState(1);
    const [isActIntroOpen, setIsActIntroOpen] = useState(false);
    const [isActOutroOpen, setIsActOutroOpen] = useState(false);
    const [lastReadIntroChapter, setLastReadIntroChapter] = useState(0);
    const [activeChoice, setActiveChoice] = useState<'A' | 'B' | null>(null);
    const [choiceClickCount, setChoiceClickCount] = useState(0);

    // Walking Simulator States
    const [walkingQuestId, setWalkingQuestId] = useState<string | null>(null);
    const [walkPercent, setWalkPercent] = useState(0);

    const triggerPetSpeech = (text: string) => {
        setPetSpeech(text);
    };

    // Auto-clear speech bubble
    useEffect(() => {
        if (!petSpeech) return;
        const timer = setTimeout(() => {
            setPetSpeech(null);
        }, 3000);
        return () => clearTimeout(timer);
    }, [petSpeech]);

    // Clear oldest explosion particle ring
    useEffect(() => {
        if (explosions.length === 0) return;
        const timer = setTimeout(() => {
            setExplosions(prev => prev.slice(1));
        }, 800);
        return () => clearTimeout(timer);
    }, [explosions]);

    const addChronicleEntry = (questId: string) => {
        let entry = "";
        const petName = activeChapter === 1 ? "Pamuk" : activeChapter === 2 ? "Fıstık" : activeChapter === 3 ? "Pati" : "Ateş";
        if (activeChapter === 1) {
            if (questId === 'q1') entry = `${petName} ormanın derinliklerinde saklanan gizemli sincabı 🐿️ buldu ve onunla arkadaş oldu!`;
            if (questId === 'q2') entry = `${petName} yolun ortasında duran tehlikeli zehirli mantarı 🍄 temizleyerek ormanı kurtardı!`;
            if (questId === 'q3') entry = `${petName} orman düellosunda ⚔️ en sevdiği orman sakinine pati selamı verdi!`;
            if (questId === 'q4') entry = `${petName} tılsımlı parşömendeki 📜 gizli orman rünlerini çözdü!`;
        } else if (activeChapter === 2) {
            if (questId === 'q1') entry = `${petName} şiddetli kanyon kum fırtınasını 💨 gıdıklanarak atlattı!`;
            if (questId === 'q2') entry = `${petName} kayalıklar arasına gizlenmiş parıldayan altın kaktüsü 🌵 bulup getirdi!`;
            if (questId === 'q3') entry = `${petName} kanyon düellosunda ⚔️ güneşlenen patilere oy verdi!`;
            if (questId === 'q4') entry = `${petName} çöl kumlarına gömülü kanyon sandığını 🏜️ kazarak açtı!`;
        } else if (activeChapter === 3) {
            if (questId === 'q1') entry = `${petName} buz gibi havada donmuş olan lezzetli mamasını ❄️ ovalayarak çözdü!`;
            if (questId === 'q2') entry = `${petName} zirveden aşağı yuvarlanan koca bir çığ kartopunu ☃️ patisiyle durdurdu!`;
            if (questId === 'q3') entry = `${petName} kış uykusu oylamasında 🏔️ en pofuduk kış uykusu adayını seçti!`;
            if (questId === 'q4') entry = `${petName} buzul sandığını 🧊 kazıyarak altındaki antik rünleri ortaya çıkardı!`;
        } else if (activeChapter === 4) {
            if (questId === 'q1') entry = `${petName} krater sıcağında havaya yükselen tehlikeli lav baloncuklarını 💥 patlattı!`;
            if (questId === 'q2') entry = `${petName} yolunu kapatan alev alev yanan volkanik közleri 🔥 süpürdü!`;
            if (questId === 'q3') entry = `${petName} obsidiyen arenasında 🌋 ateşli duruş düellosuna oy verdi!`;
            if (questId === 'q4') entry = `${petName} volkanik krater sandığını 🌋 kazıyarak içindeki magma kitabelerini okudu!`;
        }

        if (entry) {
            setChronicles(prev => {
                const updated = [entry, ...prev].slice(0, 30);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('moffi_adventure_chronicles', JSON.stringify(updated));
                }
                return updated;
            });
        }
    };

    // Countdown Timer State
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    // Load quests on chapter change
    const prevChapterRef = useRef(activeChapter);
    useEffect(() => {
        setQuests(CHAPTER_QUESTS[activeChapter].map(q => ({ ...q, completed: false })));
        setIsScratchScratched(false); // Reset scratch card state
        setSelectedPathIndex(0); // Reset stone path selection
        setDuelVote(null); // Reset voting for new chapter
        
        // Reset mini-game states
        setIsMapItemCollected(false);
        setPetClickCount(0);
        setMeltClicks(0);
        setPoppedBubbles(0);
        setBubbles([]);
        setActiveChoice(null);
        setChoiceClickCount(0);

        const baseVotes = activeChapter === 1 ? 142 : activeChapter === 2 ? 84 : activeChapter === 3 ? 116 : 95;
        setLeftVotes(baseVotes + Math.floor(Math.random() * 20));
        setRightVotes(baseVotes + Math.floor(Math.random() * 20));

        if (synthRef.current) {
            if (activeChapter > prevChapterRef.current) {
                synthRef.current.playWin();
                synthRef.current.playTransition();
            }
            synthRef.current.startAmbient(activeChapter);
        }
        
        // Trigger themed intro speech bubble
        let speechMsg = "";
        if (activeChapter === 1) speechMsg = "Ormanda garip kokular alıyorum... 🌲";
        if (activeChapter === 2) speechMsg = "Dostum burası çok esiyor, gıdıklanıyorum! 💨";
        if (activeChapter === 3) speechMsg = "Patilerim dondu, buzu eritmeme yardım et! 🥶";
        if (activeChapter === 4) speechMsg = "Ooo sıcak lav balonları, patlat bunları! 💥";
        if (speechMsg) {
            triggerPetSpeech(speechMsg);
        }

        // Trigger story intro modal if it hasn't been read for the current chapter
        if (activeChapter !== lastReadIntroChapter) {
            setIsActIntroOpen(true);
            setLastReadIntroChapter(activeChapter);
            if (typeof window !== 'undefined') {
                localStorage.setItem('moffi_last_read_intro', activeChapter.toString());
            }
        }

        prevChapterRef.current = activeChapter;
    }, [activeChapter, lastReadIntroChapter]);

    // Bubble generator for Chapter 4
    useEffect(() => {
        if (activeChapter !== 4) return;
        const q1 = quests.find(q => q.id === 'q1');
        if (q1?.completed) {
            setBubbles([]);
            return;
        }
        
        const interval = setInterval(() => {
            setBubbles(prev => {
                if (prev.length >= 4) return prev;
                return [...prev, {
                    id: Math.random(),
                    left: Math.random() * 70 + 15,
                    bottom: -15,
                    speed: Math.random() * 1.5 + 0.8
                }];
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [activeChapter, quests]);

    // Bubble floating effect loop
    useEffect(() => {
        if (bubbles.length === 0) return;
        const frame = requestAnimationFrame(() => {
            setBubbles(prev => 
                prev.map(b => ({ ...b, bottom: b.bottom + b.speed }))
                    .filter(b => b.bottom < 110)
            );
        });
        return () => cancelAnimationFrame(frame);
    }, [bubbles]);

    // Midnight Countdown Timer Effect
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0); // next midnight
            const diffMs = midnight.getTime() - now.getTime();
            
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            
            setTimeLeft({ hours, minutes, seconds });
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    const [confettiParticles, setConfettiParticles] = useState<{ id: number; x: number; y: number; rotate: number; emoji: string; scale: number }[]>([]);
    const [isChestOpened, setIsChestOpened] = useState(false);
    const [isScratchScratched, setIsScratchScratched] = useState(false);
    const [selectedPathIndex, setSelectedPathIndex] = useState(0);

    const triggerConfetti = () => {
        const newParticles = Array.from({ length: 60 }).map((_, i) => ({
            id: i + Date.now(),
            x: Math.random() * 100, // percentage of viewport width
            y: -20, // start above screen
            rotate: Math.random() * 360,
            emoji: ["🪙", "✨", "🎉", "🌟", "🐾", "🦴"][Math.floor(Math.random() * 6)],
            scale: Math.random() * 0.8 + 0.6
        }));
        setConfettiParticles(newParticles);
        setTimeout(() => {
            setConfettiParticles([]);
        }, 4000);
    };

    // Duel State
    const [duelVote, setDuelVote] = useState<'left' | 'right' | null>(null);
    const [leftVotes, setLeftVotes] = useState(42);
    const [rightVotes, setRightVotes] = useState(38);

    // Coin gain animation floating elements
    const [coinRewards, setCoinRewards] = useState<{ id: number; amount: number; x: number; y: number }[]>([]);

    // Floating heart double tap animation
    const [doubleTapHearts, setDoubleTapHearts] = useState<{ id: number; x: number; y: number; petType: string }[]>([]);

    // Comments bottom sheet
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [commentInput, setCommentInput] = useState('');

    const getAIQuickReplies = (type: string) => {
        if (type === 'cat') {
            return ["Çok tatlı! 🐾", "Yerim seni 😻", "Uykucu 😴", "Asil kedi! ✨"];
        }
        if (type === 'dog') {
            return ["Harika koşuyor! 🐕", "Aferin oğluma 🦴", "Çok enerjik! ⚡", "Koş pati koş! 💨"];
        }
        if (type === 'bird') {
            return ["Şarkısı çok güzel! 🦜", "Tatlı cıvıltı 🎵", "Harika renkler 🌈", "Minik kuş 💫"];
        }
        return ["Çok sevimli! ❤️", "Harika paylaşım! ✨", "Bayıldım! 😍"];
    };

    // Trigger floating coin rewards
    const triggerCoinReward = (amount: number, e?: React.MouseEvent) => {
        const x = e ? e.clientX : window.innerWidth / 2;
        const y = e ? e.clientY : window.innerHeight / 2;
        const id = Date.now();
        setCoinRewards(prev => [...prev, { id, amount, x, y }]);
        setCoinBalance(prev => prev + amount);

        if (synthRef.current) {
            synthRef.current.playCoin();
        }

        setTimeout(() => {
            setCoinRewards(prev => prev.filter(item => item.id !== id));
        }, 1200);
    };

    // Trigger double tap heart
    const handleDoubleTap = (postId: string, e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        const post = posts.find(p => p.id === postId);
        const petType = post?.petType || 'other';

        setDoubleTapHearts(prev => [...prev, { id, x, y, petType }]);
        
        // Auto-like
        setPosts(prev => prev.map(post => {
            if (post.id === postId && !post.isLiked) {
                triggerCoinReward(5, e);
                return { ...post, isLiked: true, likes: post.likes + 1 };
            }
            return post;
        }));

        setTimeout(() => {
            setDoubleTapHearts(prev => prev.filter(h => h.id !== id));
        }, 800);
    };

    // Quest click trigger
    const completeQuest = (id: string, reward: number, xpReward: number, e?: React.MouseEvent) => {
        setQuests(prev => {
            const updated = prev.map(q => q.id === id ? { ...q, completed: true } : q);
            if (updated.every(q => q.completed)) {
                setStreak(s => s < 7 ? s + 1 : s);
            }
            return updated;
        });
        triggerCoinReward(reward, e);

        // Record entry to adventure diary
        addChronicleEntry(id);

        // Trigger quest-success speech message
        let speechMsg = "Başardık! 🎉";
        if (id === 'q1' && activeChapter === 1) speechMsg = "Aha sincabı bulduk! Çok sevimli! 🐿️";
        if (id === 'q2' && activeChapter === 1) speechMsg = "Zehirli mantarı temizledik! Güvendeyiz! 🍄";
        if (id === 'q3' && activeChapter === 1) speechMsg = "Pati selamı verildi! 🐾";
        if (id === 'q4' && activeChapter === 1) speechMsg = "Orman parşömeni kazındı! 📜";

        if (id === 'q1' && activeChapter === 2) speechMsg = "Fıstık fırtınayı gıdıklayarak atlattı! 😂";
        if (id === 'q2' && activeChapter === 2) speechMsg = "Altın kaktüsü buldum! Pırıl pırıl! 🌵";
        if (id === 'q3' && activeChapter === 2) speechMsg = "Kanyon düellosunda oy verdik! ⚔️";
        if (id === 'q4' && activeChapter === 2) speechMsg = "Kanyon sandığını kazıdık! 🏜️";

        if (id === 'q1' && activeChapter === 3) speechMsg = "Oley buz eridi! Sonunda! 🎉";
        if (id === 'q2' && activeChapter === 3) speechMsg = "Kartopunu yakaladım! ☃️";
        if (id === 'q3' && activeChapter === 3) speechMsg = "Kış uykusu oylaması yapıldı! 🏔️";
        if (id === 'q4' && activeChapter === 3) speechMsg = "Buzul sandığını kazıdık! 🧊";

        if (id === 'q1' && activeChapter === 4) speechMsg = "Bütün balonlar bitti! Süperiz! 🔥";
        if (id === 'q2' && activeChapter === 4) speechMsg = "Sıcak közü söndürdüm, patim güvende! ☄️";
        if (id === 'q3' && activeChapter === 4) speechMsg = "Obsidiyen düellosunda oy verdik! 🌋";
        if (id === 'q4' && activeChapter === 4) speechMsg = "Magma sandığını kazıdık! 🌋";

        triggerPetSpeech(speechMsg);

        // Add XP reward and handle level up
        setXp(currentXp => {
            const nextXp = currentXp + xpReward;
            if (nextXp >= xpNeeded) {
                const excessXp = nextXp - xpNeeded;
                setLevel(prevLvl => prevLvl + 1);
                setXpNeeded(prevNeeded => Math.round(prevNeeded * 1.5));
                setTimeout(() => {
                    setLevelUpModalOpen(true);
                    triggerConfetti();
                    triggerCoinReward(100); // Seviye atlama bonusu!
                }, 600);
                return excessXp;
            }
            return nextXp;
        });
    };

    const getQuestTargetEmoji = (chap: number, qIdx: number) => {
        if (chap === 1) return qIdx === 0 ? "🐿️" : qIdx === 1 ? "🍄" : qIdx === 2 ? "🐾" : "📜";
        if (chap === 2) return qIdx === 0 ? "🌪️" : qIdx === 1 ? "🌵" : qIdx === 2 ? "⚔️" : "🏜️";
        if (chap === 3) return qIdx === 0 ? "🧊" : qIdx === 1 ? "☃️" : qIdx === 2 ? "🏔️" : "🧊";
        return qIdx === 0 ? "💥" : qIdx === 1 ? "🔥" : qIdx === 2 ? "🌋" : "🌋";
    };

    const startWalkingSim = (questId: string, reward: number, xpReward: number, e?: React.MouseEvent) => {
        setWalkingQuestId(questId);
        setWalkPercent(0);
        
        let currentPercent = 0;
        const interval = setInterval(() => {
            currentPercent += 5;
            setWalkPercent(currentPercent);
            
            // Play footstep sound using scratch synthesis
            if (synthRef.current) {
                synthRef.current.playScratch();
            }
            
            if (currentPercent >= 85) {
                clearInterval(interval);
                completeQuest(questId, reward, xpReward, e);
                setWalkingQuestId(null);
                setWalkPercent(0);
            }
        }, 150);
    };

    // Podium Vote trigger
    const [podiumVotes, setPodiumVotes] = useState<Record<string, number>>({ "1": 342, "2": 218, "3": 115 });
    const [votedPodium, setVotedPodium] = useState<Set<string>>(new Set());

    const handlePodiumVote = (id: string, e: React.MouseEvent) => {
        if (votedPodium.has(id)) return;
        setVotedPodium(prev => new Set(prev).add(id));
        setPodiumVotes(prev => ({ ...prev, [id]: prev[id] + 1 }));
        triggerCoinReward(10, e);
    };

    return (
        <div className="fixed inset-0 bg-[#0d0a1b] text-white overflow-hidden flex flex-col font-sans select-none">
            
            {/* AMBIENT LIGHTS */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] bg-purple-600/20 blur-[150px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[50%] bg-cyan-500/15 blur-[150px] rounded-full mix-blend-screen" />
            </div>

            {/* CONFETTI RAIN EFFECT */}
            <AnimatePresence>
                {confettiParticles.map(p => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 1, y: "-10vh", x: `${p.x}vw`, rotate: 0, scale: p.scale }}
                        animate={{ 
                            opacity: [1, 1, 0.8, 0], 
                            y: "110vh", 
                            rotate: p.rotate + 720,
                            x: `${p.x + (Math.random() * 20 - 10)}vw`
                        }}
                        transition={{ duration: Math.random() * 2 + 2, ease: "linear" }}
                        className="fixed z-[999] text-3xl pointer-events-none select-none"
                    >
                        {p.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* FLOATING COIN ANIMATIONS CONTAINER */}
            <div className="fixed inset-0 z-[999] pointer-events-none">
                {coinRewards.map(reward => (
                    <motion.div
                        key={reward.id}
                        initial={{ opacity: 1, scale: 0.5, x: reward.x - 20, y: reward.y - 20 }}
                        animate={{ opacity: 0, scale: 1.5, y: reward.y - 120, x: reward.x - 20 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="absolute flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full px-3 py-1 text-black font-black text-xs shadow-lg border border-amber-300"
                    >
                        <Coins className="w-3.5 h-3.5" />
                        +{reward.amount} 🪙
                    </motion.div>
                ))}
            </div>

            {/* HEADER STICKY OVERLAY */}
            <header className="absolute top-0 left-0 right-0 z-50 px-6 pt-12 pb-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/topluluk')}
                        className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-90 transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-sm font-black tracking-widest uppercase bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">Aura Feed</h1>
                        <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Geliştirme Paneli (Sandbox)</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Coin display with glow */}
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-2xl border border-amber-500/30 rounded-full px-3.5 py-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
                        <span className="text-xs font-black text-amber-300 tracking-wider">{coinBalance} 🪙</span>
                    </div>

                    {/* SOUND MUTE/UNMUTE CONTROL */}
                    <button 
                        onClick={() => {
                            const newMuted = !isMuted;
                            setIsMuted(newMuted);
                            synthRef.current?.setMute(newMuted);
                        }}
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl border transition active:scale-95 cursor-pointer shadow-md",
                            isMuted 
                                ? "bg-white/5 border-white/10 text-white/40 hover:text-white/70" 
                                : "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-emerald-500/20"
                        )}
                        title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
                    >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
                    </button>

                    {/* COIN STORE BUTTON */}
                    <button 
                        onClick={() => setIsStoreOpen(true)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-400 text-white hover:shadow-lg hover:shadow-amber-500/20 transition active:scale-95 cursor-pointer shadow-md animate-pulse"
                        style={{ animationDuration: '3s' }}
                        title="Aura Mağazası"
                    >
                        <Crown className="w-4 h-4" />
                    </button>

                    {/* VIEW MODE TOGGLE BUTTON */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-1 flex">
                        <button 
                            onClick={() => setViewMode('aura')}
                            className={cn(
                                "p-2 rounded-full transition active:scale-95",
                                viewMode === 'aura' ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white/70"
                            )}
                            title="Aura Feed (Kaydırılabilir)"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-full transition active:scale-95",
                                viewMode === 'grid' ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white/70"
                            )}
                            title="Bento Grid Keşfet"
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* SCROLLABLE MAIN SLIDE FRAME CONTAINER */}
            <main className="flex-1 w-full h-full relative z-10">
                <AnimatePresence mode="wait">
                    {viewMode === 'aura' ? (
                        <motion.div
                            key="aura-scroll-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full w-full overflow-y-scroll scroll-smooth no-scrollbar"
                        >
                            {/* SLIDE 1: DAILY QUESTS */}
                            <section className="min-h-screen w-full flex items-center justify-center pt-28 pb-12 px-6 relative">
                                {/* CSS Keyframe Animations for Forest Sparks & Leaves */}
                                <style>{`
                                    @keyframes sparkRise {
                                        0% { transform: translateY(120px) translateX(0) scale(0.6); opacity: 0; }
                                        15% { opacity: 0.8; }
                                        85% { opacity: 0.6; }
                                        100% { transform: translateY(-160px) translateX(30px) scale(0.3); opacity: 0; }
                                    }
                                    @keyframes leafFall {
                                        0% { transform: translateY(-40px) rotate(0deg) translateX(0); opacity: 0; }
                                        20% { opacity: 0.7; }
                                        80% { opacity: 0.4; }
                                        100% { transform: translateY(220px) rotate(270deg) translateX(-40px); opacity: 0; }
                                    }
                                    .spark-ember {
                                        position: absolute;
                                        bottom: 0;
                                        width: 4px;
                                        height: 4px;
                                        background-color: #f59e0b;
                                        border-radius: 50%;
                                        box-shadow: 0 0 8px #ea580c, 0 0 15px #f97316;
                                        animation: sparkRise 4.5s infinite linear;
                                        pointer-events: none;
                                        z-index: 1;
                                    }
                                    .leaf-drift {
                                        position: absolute;
                                        top: 0;
                                        font-size: 10px;
                                        animation: leafFall 7s infinite linear;
                                        pointer-events: none;
                                        z-index: 1;
                                    }
                                `}</style>

                                {/* Local Theme Ambient Glows */}
                                <div className="absolute inset-0 pointer-events-none z-0 transition-all duration-1000">
                                    {CHAPTER_THEMES[activeChapter].ambientGlows}
                                </div>

                                <div className={cn(
                                    "w-full max-w-md bg-gradient-to-b backdrop-blur-2xl border rounded-[2.5rem] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col gap-4 mt-6 relative overflow-hidden z-10 transition-all duration-1000 ease-in-out",
                                    CHAPTER_THEMES[activeChapter].bgClass
                                )}>
                                    <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#8c6239]/50 to-transparent" />
                                    
                                    {/* KANYON KUM FIRTINASI TOZ BULUTU VFX */}
                                    {activeChapter === 2 && !quests[0].completed && (
                                        <div 
                                            className="absolute inset-0 bg-amber-900/10 backdrop-blur-[0.5px] pointer-events-none z-10 transition-opacity duration-500 overflow-hidden"
                                            style={{ opacity: Math.max(0.05, 1 - (petClickCount / 5)) }}
                                        >
                                            {/* Floating wind drift lines */}
                                            <div className="absolute inset-0 flex flex-col justify-around opacity-30 select-none pointer-events-none">
                                                <span className="text-[8px] animate-pulse translate-x-2 text-amber-900/40">💨 💨 💨</span>
                                                <span className="text-[8px] animate-pulse -translate-x-4 text-amber-900/40">💨 💨</span>
                                                <span className="text-[8px] animate-pulse translate-x-8 text-amber-900/40">💨 💨 💨</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* BUBBLE EXPLOSIONS */}
                                    {explosions.map(exp => (
                                        <motion.div
                                            key={exp.id}
                                            style={{ left: `${exp.left}%`, bottom: `${exp.bottom}px` }}
                                            initial={{ scale: 0.5, opacity: 1 }}
                                            animate={{ scale: 2.2, opacity: 0 }}
                                            transition={{ duration: 0.6 }}
                                            className="absolute w-8 h-8 rounded-full border-2 border-orange-500 bg-orange-500/20 pointer-events-none z-30 flex items-center justify-center"
                                        >
                                            <span className="text-[10px]">💥</span>
                                        </motion.div>
                                    ))}
                                    
                                    {/* Dynamic Chapter SVG Texture Overlay */}
                                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay z-0">
                                        <svg width="100%" height="100%">
                                            <defs>
                                                {/* 1. Oak Wood Grain Pattern (Forest) */}
                                                <pattern id="wood-grain-pattern" width="120" height="24" patternUnits="userSpaceOnUse">
                                                    <path d="M 0 6 Q 60 18 120 6 M 0 12 Q 60 24 120 12 M 0 18 Q 60 6 120 18 M 0 0 Q 60 12 120 0" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                                                </pattern>
                                                
                                                {/* 2. Cracked Clay / Dry Mud Desert Pattern (Canyon) */}
                                                <pattern id="cracked-earth-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                                                    <path d="M 0 0 L 15 15 L 30 10 L 45 25 L 60 20 M 15 15 L 10 35 L 25 45 L 20 60 M 30 10 L 40 30 L 60 35 M 45 25 L 50 50 L 60 55 M 25 45 L 45 40 L 50 50 M 10 35 L 0 45 L 5 60 M 40 30 L 45 25" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                                                </pattern>

                                                {/* 3. Frost / Ice Crystals Pattern (Summit) */}
                                                <pattern id="frost-crystal-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
                                                    <path d="M 25 0 L 25 50 M 0 25 L 50 25 M 10 10 L 40 40 M 10 40 L 40 10 M 25 15 L 20 10 M 25 15 L 30 10 M 25 35 L 20 40 M 25 35 L 30 40 M 15 25 L 10 20 M 15 25 L 10 30 M 35 25 L 40 20 M 35 25 L 40 30" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.75" />
                                                </pattern>
                                            </defs>
                                            <rect 
                                                width="100%" 
                                                height="100%" 
                                                fill={activeChapter === 1 
                                                    ? "url(#wood-grain-pattern)" 
                                                    : activeChapter === 2 
                                                        ? "url(#cracked-earth-pattern)" 
                                                        : "url(#frost-crystal-pattern)"} 
                                            />
                                        </svg>
                                    </div>

                                    {/* Ambient Flying Sparks Emitters (Dynamic Color/Shadows) */}
                                    <div className="spark-ember" style={{ left: '15%', animationDelay: '0.2s', animationDuration: '3.8s', backgroundColor: CHAPTER_THEMES[activeChapter].sparkColor, boxShadow: CHAPTER_THEMES[activeChapter].sparkShadow }} />
                                    <div className="spark-ember" style={{ left: '35%', animationDelay: '1.5s', animationDuration: '4.8s', backgroundColor: CHAPTER_THEMES[activeChapter].sparkColor, boxShadow: CHAPTER_THEMES[activeChapter].sparkShadow }} />
                                    <div className="spark-ember" style={{ left: '65%', animationDelay: '0.7s', animationDuration: '4.2s', backgroundColor: CHAPTER_THEMES[activeChapter].sparkColor, boxShadow: CHAPTER_THEMES[activeChapter].sparkShadow }} />
                                    <div className="spark-ember" style={{ left: '85%', animationDelay: '2.2s', animationDuration: '3.5s', backgroundColor: CHAPTER_THEMES[activeChapter].sparkColor, boxShadow: CHAPTER_THEMES[activeChapter].sparkShadow }} />

                                    {/* Ambient Falling Leaves / Sand / Snow Emitters */}
                                    <div className="leaf-drift text-emerald-500/30" style={{ left: '25%', animationDelay: '0.5s' }}>{CHAPTER_THEMES[activeChapter].particles[0]}</div>
                                    <div className="leaf-drift text-amber-600/20" style={{ left: '55%', animationDelay: '3.2s' }}>{CHAPTER_THEMES[activeChapter].particles[1]}</div>
                                    <div className="leaf-drift text-emerald-400/25" style={{ left: '75%', animationDelay: '1.8s' }}>{CHAPTER_THEMES[activeChapter].particles[2]}</div>

                                    {/* Widget Header */}
                                    <div className="flex justify-between items-center relative z-10 gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d97706] to-[#92400e] flex items-center justify-center shadow-lg shadow-[#d97706]/15">
                                                <Flame className="w-4 h-4 text-amber-100 animate-pulse" />
                                            </div>
                                            <div>
                                                <h2 className="text-xs font-black uppercase tracking-widest text-[#f5e6d3] truncate max-w-[120px]">{CHAPTER_THEMES[activeChapter].title}</h2>
                                                <p className="text-[9px] text-[#22c55e] font-bold uppercase tracking-wider">{CHAPTER_THEMES[activeChapter].subtitle}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Map Switcher Header Toolbar (100% visible & accessible) */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1 bg-[#1a0e05]/60 border border-[#8c6239]/30 p-0.5 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                                                <button 
                                                    onClick={() => setActiveChapter(1)}
                                                    className={cn(
                                                        "w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] transition active:scale-90 cursor-pointer", 
                                                        activeChapter === 1 
                                                            ? "bg-gradient-to-b from-emerald-600 to-emerald-800 text-white shadow border border-emerald-500" 
                                                            : "opacity-45 hover:opacity-100 text-white"
                                                    )}
                                                    title="Pati Ormanı"
                                                >
                                                    🌲
                                                </button>
                                                <button 
                                                    onClick={() => setActiveChapter(2)}
                                                    className={cn(
                                                        "w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] transition active:scale-90 cursor-pointer", 
                                                        activeChapter === 2 
                                                            ? "bg-gradient-to-b from-amber-600 to-amber-800 text-white shadow border border-amber-500" 
                                                            : "opacity-45 hover:opacity-100 text-white"
                                                    )}
                                                    title="Kanyon Patikası"
                                                >
                                                    🏜️
                                                </button>
                                                <button 
                                                    onClick={() => setActiveChapter(3)}
                                                    className={cn(
                                                        "w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] transition active:scale-90 cursor-pointer", 
                                                        activeChapter === 3 
                                                            ? "bg-gradient-to-b from-sky-600 to-sky-800 text-white shadow border border-sky-500" 
                                                            : "opacity-45 hover:opacity-100 text-white"
                                                    )}
                                                    title="Karlı Zirve"
                                                >
                                                    ❄️
                                                </button>
                                                <button 
                                                    onClick={() => setActiveChapter(4)}
                                                    className={cn(
                                                        "w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] transition active:scale-90 cursor-pointer", 
                                                        activeChapter === 4 
                                                            ? "bg-gradient-to-b from-rose-600 to-rose-800 text-white shadow border border-rose-500" 
                                                            : "opacity-45 hover:opacity-100 text-white"
                                                    )}
                                                    title="Volkanik Krater"
                                                >
                                                    🌋
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => setIsChronicleOpen(true)}
                                                className="w-5.5 h-5.5 rounded-full flex items-center justify-center bg-amber-800/40 border border-amber-600/30 text-amber-300 hover:bg-amber-800/60 transition active:scale-90 cursor-pointer text-[10px]"
                                                title="Serüven Günlüğü"
                                            >
                                                📜
                                            </button>
                                            <HelpCircle className="w-3.5 h-3.5 text-[#f5e6d3]/20 hover:text-[#f5e6d3]/50 cursor-pointer" />
                                        </div>
                                    </div>

                                    {/* XP LEVEL PROGRESS BAR (Realistic Weathered Wooden Board style) */}
                                    <div className="w-full relative z-10 flex flex-col gap-2 px-5 py-4 select-none min-h-[76px] justify-between">
                                         {/* Inline Themed Board SVG Background (Changes shape and texture based on chapter) */}
                                         {activeChapter === 1 && (
                                             <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_5px_8px_rgba(0,0,0,0.65)] z-0" viewBox="0 0 350 76" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                                 <defs>
                                                     <linearGradient id="wornWoodBg" x1="0%" y1="0%" x2="0%" y2="100%">
                                                         <stop offset="0%" stopColor="#784824" />
                                                         <stop offset="30%" stopColor="#5c3618" />
                                                         <stop offset="100%" stopColor="#3d200a" />
                                                     </linearGradient>
                                                     <linearGradient id="wornWoodHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                                                         <stop offset="0%" stopColor="#ebd6b8" stopOpacity="0.12" />
                                                         <stop offset="100%" stopColor="#000000" stopOpacity="0.38" />
                                                     </linearGradient>
                                                     <clipPath id="woodClip">
                                                         <path d="M 16 6 L 6 16 Q 9 34 5 44 L 2 48 L 8 52 L 15 69 Q 175 66 334 69 L 344 59 L 341 45 L 347 41 L 342 36 L 334 6 Q 175 9 16 6 Z" />
                                                     </clipPath>
                                                 </defs>
                                                 <path d="M 16 6 L 6 16 Q 9 34 5 44 L 2 48 L 8 52 L 15 69 Q 175 66 334 69 L 344 59 L 341 45 L 347 41 L 342 36 L 334 6 Q 175 9 16 6 Z" fill="url(#wornWoodBg)" stroke="#8c6239" strokeWidth="2.5" strokeLinejoin="round" />
                                                 <path d="M 16 6 L 6 16 Q 9 34 5 44 L 2 48 L 8 52 L 15 69 Q 175 66 334 69 L 344 59 L 341 45 L 347 41 L 342 36 L 334 6 Q 175 9 16 6 Z" fill="url(#wornWoodHighlight)" pointerEvents="none" />
                                                 <g clipPath="url(#woodClip)">
                                                     <rect width="100%" height="100%" fill="url(#wood-grain-pattern)" opacity="0.09" style={{ mixBlendMode: 'overlay' }} />
                                                 </g>
                                                 <path d="M 20 10 L 11 19 Q 13 34 10 44 L 8 46 L 13 49 L 19 63 Q 175 60 330 63 L 338 55 L 335 45 L 340 42 L 336 38 L 329 10 Q 175 13 20 10 Z" fill="none" stroke="#2a1707" strokeWidth="1.2" opacity="0.5" strokeDasharray="4 3" />
                                             </svg>
                                         )}
                                         {activeChapter === 2 && (
                                             <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_5px_8px_rgba(0,0,0,0.65)] z-0" viewBox="0 0 350 76" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                                 <defs>
                                                     <linearGradient id="canyonClayBg" x1="0%" y1="0%" x2="0%" y2="100%">
                                                         <stop offset="0%" stopColor="#b45309" />
                                                         <stop offset="40%" stopColor="#9a3412" />
                                                         <stop offset="100%" stopColor="#7c2d12" />
                                                     </linearGradient>
                                                     <clipPath id="canyonClip">
                                                         <path d="M 12 8 L 4 20 L 8 42 L 2 50 L 12 68 Q 175 64 338 68 L 348 50 L 342 38 L 346 22 L 338 8 Q 175 10 12 8 Z" />
                                                     </clipPath>
                                                 </defs>
                                                 <path d="M 12 8 L 4 20 L 8 42 L 2 50 L 12 68 Q 175 64 338 68 L 348 50 L 342 38 L 346 22 L 338 8 Q 175 10 12 8 Z" fill="url(#canyonClayBg)" stroke="#c2410c" strokeWidth="2.5" strokeLinejoin="round" />
                                                 <g clipPath="url(#canyonClip)">
                                                     <rect width="100%" height="100%" fill="url(#cracked-earth-pattern)" opacity="0.12" style={{ mixBlendMode: 'overlay' }} />
                                                     <path d="M 10 24 Q 175 18 340 24 M 5 44 Q 175 38 345 44" stroke="#431407" strokeWidth="1.2" opacity="0.35" fill="none" />
                                                 </g>
                                             </svg>
                                         )}
                                         {activeChapter === 3 && (
                                             <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_5px_10px_rgba(56,189,248,0.35)] z-0" viewBox="0 0 350 76" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                                 <defs>
                                                     <linearGradient id="glacierIceBg" x1="0%" y1="0%" x2="0%" y2="100%">
                                                         <stop offset="0%" stopColor="#ecfeff" />
                                                         <stop offset="35%" stopColor="#bae6fd" />
                                                         <stop offset="100%" stopColor="#0284c7" />
                                                     </linearGradient>
                                                     <clipPath id="iceClip">
                                                         <path d="M 18 10 L 10 18 L 8 48 L 18 66 L 332 66 L 342 48 L 340 18 L 332 10 Z" />
                                                     </clipPath>
                                                 </defs>
                                                 <path d="M 18 10 L 10 18 L 8 48 L 18 66 L 332 66 L 342 48 L 340 18 L 332 10 Z" fill="url(#glacierIceBg)" stroke="#38bdf8" strokeWidth="2.2" strokeLinejoin="miter" />
                                                 <g clipPath="url(#iceClip)">
                                                     <rect width="100%" height="100%" fill="url(#frost-crystal-pattern)" opacity="0.16" />
                                                     <polygon points="18,10 175,18 332,10 332,25 175,32 18,25" fill="#ffffff" opacity="0.32" />
                                                     <path d="M 10 18 L 340 18 M 18 66 L 175 58 L 332 66" stroke="#ffffff" strokeWidth="1" opacity="0.5" fill="none" />
                                                 </g>
                                             </svg>
                                         )}
                                         {activeChapter === 4 && (
                                             <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_6px_12px_rgba(220,38,38,0.45)] z-0" viewBox="0 0 350 76" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                                 <defs>
                                                     <linearGradient id="volcanicCrustBg" x1="0%" y1="0%" x2="0%" y2="100%">
                                                         <stop offset="0%" stopColor="#1e1916" />
                                                         <stop offset="60%" stopColor="#120c0a" />
                                                         <stop offset="100%" stopColor="#090504" />
                                                     </linearGradient>
                                                 </defs>
                                                 <path d="M 15 6 L 5 22 L 9 40 L 3 52 L 11 70 Q 175 66 339 70 L 347 52 L 341 40 L 345 22 L 335 6 Z" fill="url(#volcanicCrustBg)" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="miter" />
                                                 <path d="M 15 25 L 60 22 L 80 28 M 120 18 L 190 22 L 230 15 M 260 28 L 310 24" stroke="#f97316" strokeWidth="1.5" opacity="0.75" fill="none" className="animate-pulse" />
                                                 <path d="M 40 45 L 90 48 L 140 43 M 180 52 L 250 49 L 290 54" stroke="#ef4444" strokeWidth="1.2" opacity="0.8" fill="none" className="animate-pulse" />
                                             </svg>
                                         )}

                                        {/* Relative z-10 Content overlay */}
                                        <div className="relative z-10 w-full h-full flex flex-col gap-2 justify-between">
                                            <div className="flex justify-between items-center px-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-[#fef3c7] uppercase tracking-wider leading-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]">
                                                        {getLevelTitle(level)}
                                                    </span>
                                                    <span className="text-[7px] text-[#f5e6d3]/60 uppercase mt-0.5 font-bold tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">Seviye {level}</span>
                                                </div>
                                                
                                                {/* Test controls */}
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => {
                                                            setXp(currentXp => {
                                                                const nextXp = currentXp + 50;
                                                                if (nextXp >= xpNeeded) {
                                                                    const excessXp = nextXp - xpNeeded;
                                                                    setLevel(prevLvl => prevLvl + 1);
                                                                    setXpNeeded(prevNeeded => Math.round(prevNeeded * 1.5));
                                                                    setTimeout(() => {
                                                                        setLevelUpModalOpen(true);
                                                                        triggerConfetti();
                                                                        triggerCoinReward(100);
                                                                    }, 300);
                                                                    return excessXp;
                                                                }
                                                                return nextXp;
                                                            });
                                                        }}
                                                        className="text-[8px] font-black text-[#4ade80] bg-[#14532d]/40 border border-[#22c55e]/30 px-1.5 py-0.5 rounded hover:bg-[#14532d]/60 transition active:scale-95 cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                                                        title="Hile: +50 TP ekle"
                                                    >
                                                        TP Ekle 🧪
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setLevel(prevLvl => prevLvl + 1);
                                                            setXpNeeded(prevNeeded => Math.round(prevNeeded * 1.5));
                                                            setXp(0);
                                                            setTimeout(() => {
                                                                    setLevelUpModalOpen(true);
                                                                    triggerConfetti();
                                                                    triggerCoinReward(100);
                                                            }, 300);
                                                        }}
                                                        className="text-[8px] font-black text-amber-300 bg-[#78350f]/40 border border-[#d97706]/30 px-1.5 py-0.5 rounded hover:bg-[#78350f]/60 transition active:scale-95 cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                                                        title="Hile: Seviye atlat"
                                                    >
                                                        Seviye Atla 🧪
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Progress bar container (Carved groove in the wood) */}
                                            <div className="w-full h-4 bg-[#1a0e05] rounded-full border border-[#2a1707] overflow-hidden relative flex items-center justify-center shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)]">
                                                <motion.div 
                                                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#22c55e] via-[#10b981] to-[#047857] rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(xp / xpNeeded) * 100}%` }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    style={{ boxShadow: "0 0 8px rgba(34,197,94,0.4)" }}
                                                />
                                                {/* Reflective shine overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/12 to-transparent pointer-events-none" />
                                                {/* XP text indicator */}
                                                <span className="relative z-10 text-[8px] font-black text-[#fffbeb] tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                                                    {xp} / {xpNeeded} TP
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* STREAK CHEST BAR (Item 2 - Nostalgic Campfire) */}
                                    <div className="bg-[#130b06]/60 border border-[#3e2c1c]/40 rounded-2xl p-3 flex flex-col gap-2.5 relative z-10">
                                         <div className="flex justify-between items-center px-1">
                                             <div className="flex flex-col gap-1">
                                                 <h3 className="text-[10px] font-black text-amber-500 flex items-center gap-1.5 leading-none">
                                                     <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse animate-duration-1000" />
                                                     {streak} Günlük Kamp Ateşi 🔥
                                                 </h3>
                                                 
                                                 {/* Weekly Map Change Indicator (Harita Değişim Göstergesi) */}
                                                 <div className="text-[7.5px] font-bold text-amber-400/90 bg-[#78350f]/15 px-1.5 py-0.5 rounded flex items-center gap-1 self-start select-none mt-0.5 border border-amber-500/10">
                                                     <span>Harita Değişimine:</span>
                                                     <span className="text-white font-mono">{7 - streak > 0 ? `${7 - streak} Gün` : "Hazır! 🔓"}</span>
                                                     {7 - streak > 0 ? (
                                                         <span className="text-[7px] text-[#f5e6d3]/40">({activeChapter === 1 ? "🏜️ Kanyon" : activeChapter === 2 ? "❄️ Zirve" : activeChapter === 3 ? "🌋 Krater" : "⏳ Bitiş"})</span>
                                                     ) : null}
                                                 </div>
                                             </div>
                                             
                                             {streak < 7 && (
                                                 <button
                                                     onClick={() => setStreak(7)}
                                                     className="text-[8px] font-black text-[#f5e6d3] bg-[#8c6239]/30 border border-[#8c6239]/50 px-2 py-0.5 rounded-lg hover:bg-[#8c6239]/50 transition active:scale-95 cursor-pointer shadow-md"
                                                 >
                                                     Seriyi 7 Yap 🧪
                                                 </button>
                                             )}
                                         </div>

                                        {/* 7 Days chest path */}
                                        <div className="flex justify-between items-center bg-[#0d0703]/50 rounded-xl p-2 border border-[#3e2c1c]/30">
                                            {Array.from({ length: 7 }).map((_, i) => {
                                                const dayNum = i + 1;
                                                const isCompleted = dayNum <= streak;
                                                const isChest = dayNum === 7;
                                                
                                                return (
                                                    <div key={dayNum} className="flex flex-col items-center gap-1 flex-1">
                                                        {isChest ? (
                                                            <button
                                                                disabled={!isCompleted || isChestOpened}
                                                                onClick={() => {
                                                                    setIsChestOpened(true);
                                                                    triggerConfetti();
                                                                    triggerCoinReward(50);
                                                                }}
                                                                className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-base border transition-all duration-300 relative",
                                                                    isChestOpened
                                                                        ? "bg-emerald-950/20 border-emerald-800 text-emerald-500 cursor-default"
                                                                        : isCompleted
                                                                            ? "bg-gradient-to-tr from-[#854d0e] to-[#a16207] border-[#ca8a04] text-amber-200 shadow-[0_0_15px_rgba(234,179,8,0.4)] animate-bounce cursor-pointer hover:scale-105"
                                                                            : "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                                                                )}
                                                                title={isCompleted ? "Ahşap Hazineyi Aç!" : "7. Gün Kilidi Kapalı"}
                                                            >
                                                                {isChestOpened ? "🎁" : "📦"}
                                                                {isCompleted && !isChestOpened && (
                                                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <div 
                                                                className={cn(
                                                                    "w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black border transition",
                                                                    isCompleted
                                                                        ? "bg-amber-800/15 border-amber-800/30 text-amber-400"
                                                                        : "bg-white/5 border-white/5 text-white/20"
                                                                )}
                                                            >
                                                                🌰
                                                            </div>
                                                        )}
                                                        <span className="text-[7.5px] font-black text-[#f5e6d3]/40">{isChest ? "Sandık" : `${dayNum}.G`}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* PATI YOLU GAME ROADMAP (Item 3 - Winding Dirt/Moss/Snow Trail) */}
                                    <div className="relative h-24 my-2 w-full overflow-hidden z-10 flex items-center">
                                        {/* SCROLLING CAMERA ENGINE MOTION CONTAINER (Spring camera centered on active stone) */}
                                        <motion.div 
                                            className="w-[170%] h-full relative px-6 flex items-center justify-between pointer-events-auto"
                                            animate={{ 
                                                x: `-${Math.min(70, quests.filter(q => q.completed).length * 21)}%` 
                                            }}
                                            transition={{ type: "spring", stiffness: 80, damping: 15 }}
                                        >
                                        {/* Wavy Dotted Path SVG */}
                                        <svg className="absolute inset-x-6 top-0 h-full w-[calc(100%-3rem)] pointer-events-none overflow-visible z-0" viewBox="0 0 300 96" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="earthyPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#8c6239" />
                                                    <stop offset="50%" stopColor="#15803d" />
                                                    <stop offset="100%" stopColor="#166534" />
                                                </linearGradient>
                                            </defs>
                                            
                                            {/* Dynamic Canyon Cliff Gorge Walls */}
                                            {activeChapter === 2 && (
                                                <>
                                                    {/* Left Cliff Shadow */}
                                                    <path d="M -20 -10 Q 55 20, 35 48 T 55 106 L -20 106 Z" fill="#1b0a04" opacity="0.45" />
                                                    {/* Left Cliff Wall (Red sandstone with jagged lines) */}
                                                    <path d="M -20 -10 Q 45 20, 25 48 T 45 106 L -20 106 Z" fill="#542617" stroke="#7c3a22" strokeWidth="2.5" />
                                                    <path d="M 0 15 L 20 25 M 5 45 L 20 40 M 8 75 L 30 80" stroke="#33140a" strokeWidth="1.2" opacity="0.6" />
                                                    
                                                    {/* Right Cliff Shadow */}
                                                    <path d="M 320 -10 Q 245 20, 265 48 T 245 106 L 320 106 Z" fill="#1b0a04" opacity="0.45" />
                                                    {/* Right Cliff Wall */}
                                                    <path d="M 320 -10 Q 255 20, 275 48 T 255 106 L 320 106 Z" fill="#542617" stroke="#7c3a22" strokeWidth="2.5" />
                                                    <path d="M 300 20 L 280 30 M 295 50 L 275 45 M 290 70 L 265 65" stroke="#33140a" strokeWidth="1.2" opacity="0.6" />
                                                </>
                                            )}

                                            {/* Dynamic Snowy Mountain Piles / Glacier Blocks */}
                                            {activeChapter === 3 && (
                                                <>
                                                    {/* Far Background Mountain Peaks (Karlı Dağ Zirveleri Silüeti) */}
                                                    <g opacity="0.18">
                                                        <path d="M 0 96 L 35 30 L 65 58 L 115 15 L 165 55 L 215 10 L 255 50 L 300 25 L 300 96 Z" fill="#475569" />
                                                        {/* White Snow Caps on Peaks */}
                                                        <path d="M 35 30 L 28 42 L 42 42 Z M 115 15 L 102 30 L 128 30 Z M 215 10 L 202 25 L 228 25 Z" fill="#ffffff" />
                                                    </g>
                                                    
                                                    {/* Background Ocean / Frozen Sea Bay (Donmuş Deniz Körfezi) */}
                                                    <g opacity="0.3">
                                                        {/* Sea water */}
                                                        <path d="M 0 62 Q 150 72 300 62 L 300 96 L 0 96 Z" fill="#0891b2" />
                                                        {/* Ice floes / Floating Ice sheets in water */}
                                                        <path d="M 45 74 L 58 74 L 52 77 Z" fill="#e2e8f0" />
                                                        <path d="M 125 80 L 138 80 L 132 83 Z" fill="#e2e8f0" />
                                                        <path d="M 230 76 L 242 76 L 236 79 Z" fill="#e2e8f0" />
                                                    </g>

                                                    {/* Left Glacial Cliff Wall (3D Ice/Snow Block on the left) */}
                                                    <path d="M -20 -10 Q 45 20, 30 48 T 45 106 L -20 106 Z" fill="#0f172a" opacity="0.45" />
                                                    <path d="M -20 -10 Q 35 20, 20 48 T 35 106 L -20 106 Z" fill="#e2e8f0" stroke="#93c5fd" strokeWidth="2.5" />
                                                    {/* Shaded Fold/Shadow Slope on the left mountain (Yandaki karlı dağlara hafif gölgelik) */}
                                                    <path d="M -20 -10 Q 25 15, 10 38 T 15 106 L -20 106 Z" fill="#94a3b8" opacity="0.45" />
                                                    {/* Glacial highlights */}
                                                    <path d="M 35 20 L 20 48 M 20 48 L 35 106" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
                                                    
                                                    {/* Right Glacial Cliff Wall (3D Ice/Snow Block on the right) */}
                                                    <path d="M 320 -10 Q 255 20, 270 48 T 255 106 L 320 106 Z" fill="#0f172a" opacity="0.45" />
                                                    <path d="M 320 -10 Q 265 20, 280 48 T 265 106 L 320 106 Z" fill="#e2e8f0" stroke="#93c5fd" strokeWidth="2.5" />
                                                    {/* Shaded Fold/Shadow Slope on the right mountain */}
                                                    <path d="M 320 -10 Q 280 20, 290 48 T 280 106 L 320 106 Z" fill="#94a3b8" opacity="0.45" />
                                                    {/* Glacial highlights */}
                                                    <path d="M 265 20 L 280 48 M 280 48 L 265 106" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
                                                </>
                                            )}

                                            {/* Dynamic Volcanic Crater Lava Flows & Basalt Cliffs */}
                                            {activeChapter === 4 && (
                                                <>
                                                    {/* Molten Lava River Background */}
                                                    <path d="M 0 65 Q 150 50 300 65 L 300 96 L 0 96 Z" fill="#7f1d1d" opacity="0.3" />
                                                    {/* Flowing lava veins inside river */}
                                                    <path d="M 0 75 Q 150 62 300 75" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="10 15" opacity="0.8" className="animate-pulse" />
                                                    <path d="M 10 88 Q 150 78 290 88" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="8 20" opacity="0.7" />

                                                    {/* Left Volcanic Basalt Cliff shadow */}
                                                    <path d="M -20 -10 Q 45 20, 30 48 T 45 106 L -20 106 Z" fill="#080202" opacity="0.5" />
                                                    {/* Left Volcanic Basalt Cliff Wall (crusty black rock) */}
                                                    <path d="M -20 -10 Q 35 20, 20 48 T 35 106 L -20 106 Z" fill="#260f0f" stroke="#450a0a" strokeWidth="2.5" />
                                                    {/* Lava glows on rock cracks */}
                                                    <path d="M 10 15 L 22 22 M 5 45 L 18 42" stroke="#ef4444" strokeWidth="1" opacity="0.85" />
                                                    
                                                    {/* Right Volcanic Basalt Cliff shadow */}
                                                    <path d="M 320 -10 Q 255 20, 270 48 T 255 106 L 320 106 Z" fill="#080202" opacity="0.5" />
                                                    {/* Right Volcanic Basalt Cliff Wall */}
                                                    <path d="M 320 -10 Q 265 20, 280 48 T 265 106 L 320 106 Z" fill="#260f0f" stroke="#450a0a" strokeWidth="2.5" />
                                                    {/* Lava glows on rock cracks */}
                                                    <path d="M 290 20 L 278 28 M 295 50 L 282 45" stroke="#ef4444" strokeWidth="1" opacity="0.85" />
                                                </>
                                            )}

                                            {/* Wide moss/grass/snow shadow fringe border */}
                                            <path 
                                                d="M 15 28 C 60 28, 40 68, 95 68 C 150 68, 140 28, 195 28 C 250 28, 240 68, 285 68" 
                                                fill="none" 
                                                stroke={CHAPTER_THEMES[activeChapter].pathStrokes.fringe} 
                                                strokeWidth="18" 
                                                strokeLinecap="round"
                                                opacity="0.5"
                                                className="transition-colors duration-1000"
                                            />
                                            
                                            {/* Wide Trodden Soil Path Bed */}
                                            <path 
                                                d="M 15 28 C 60 28, 40 68, 95 68 C 150 68, 140 28, 195 28 C 250 28, 240 68, 285 68" 
                                                fill="none" 
                                                stroke={CHAPTER_THEMES[activeChapter].pathStrokes.bed} 
                                                strokeWidth="10" 
                                                strokeLinecap="round"
                                                opacity="0.7"
                                                className="transition-colors duration-1000"
                                            />
                                            
                                            {/* Small pebbles/sand scattered along the dirt path bed */}
                                            <path 
                                                d="M 15 28 C 60 28, 40 68, 95 68 C 150 68, 140 28, 195 28 C 250 28, 240 68, 285 68" 
                                                fill="none" 
                                                stroke={CHAPTER_THEMES[activeChapter].pathStrokes.pebbles} 
                                                strokeWidth="8" 
                                                strokeDasharray="2 12" 
                                                strokeLinecap="round"
                                                opacity="0.8"
                                                className="transition-colors duration-1000"
                                            />
 
                                            {/* Walking Footprints Center Line (Patika İçi Ayak/Pati İzleri) */}
                                            <path 
                                                d="M 15 28 C 60 28, 40 68, 95 68 C 150 68, 140 28, 195 28 C 250 28, 240 68, 285 68" 
                                                fill="none" 
                                                stroke="#1c120a" 
                                                strokeWidth="2.5" 
                                                strokeDasharray="1 8" 
                                                strokeLinecap="round"
                                            />
                                            
                                            {/* Glowing Active Themed Footprint overlay */}
                                            <path 
                                                d="M 15 28 C 60 28, 40 68, 95 68 C 150 68, 140 28, 195 28 C 250 28, 240 68, 285 68" 
                                                fill="none" 
                                                stroke={CHAPTER_THEMES[activeChapter].pathStrokes.active} 
                                                strokeWidth="4" 
                                                strokeDasharray="1 8" 
                                                strokeLinecap="round"
                                                className="transition-all duration-1000 ease-out"
                                                style={{
                                                    strokeDasharray: "1 8",
                                                    strokeDashoffset: 300 - (quests.filter(q => q.completed).length * 100),
                                                    transition: "stroke-dashoffset 0.8s ease-in-out, stroke 1s ease-in-out"
                                                }}
                                            />
                                        </svg>

                                        {/* Dynamic Map Decorators & Interactive Entities */}
                                        {activeChapter === 1 && (
                                            <>
                                                {/* Zehirli Mantar Quest Item */}
                                                {!isMapItemCollected && !quests[1].completed ? (
                                                    <button 
                                                        onClick={() => {
                                                            setIsMapItemCollected(true);
                                                            completeQuest('q2', quests[1].reward, quests[1].xpReward);
                                                        }}
                                                        className="absolute left-[7%] top-[12%] text-base cursor-pointer hover:scale-125 transition z-20 animate-bounce select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                                    >
                                                        🍄
                                                    </button>
                                                ) : (
                                                    <div className="absolute left-[7%] top-[12%] text-[10px] pointer-events-none select-none opacity-20 z-10">🍄</div>
                                                )}
                                                <div className="absolute right-[12%] top-[25%] text-[10px] pointer-events-none select-none z-10">🌸</div>
                                                <div className="absolute left-[38%] bottom-[8%] text-[9px] pointer-events-none select-none z-10">🍀</div>
                                            </>
                                        )}
                                        {activeChapter === 2 && (
                                            <>
                                                {/* Altın Kaktüs Quest Item */}
                                                {!isMapItemCollected && !quests[1].completed ? (
                                                    <button 
                                                        onClick={() => {
                                                            setIsMapItemCollected(true);
                                                            completeQuest('q2', quests[1].reward, quests[1].xpReward);
                                                        }}
                                                        className="absolute left-[7%] top-[10%] text-base cursor-pointer hover:scale-125 transition z-20 animate-bounce select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                                    >
                                                        🌵
                                                    </button>
                                                ) : (
                                                    <div className="absolute left-[7%] top-[10%] text-[10px] pointer-events-none select-none opacity-20 z-10">🌵</div>
                                                )}
                                                <div className="absolute right-[8%] top-[28%] text-[10px] pointer-events-none select-none z-10">💀</div>
                                                <div className="absolute left-[40%] bottom-[12%] text-[10px] pointer-events-none select-none z-10">🦂</div>
                                            </>
                                        )}
                                        {activeChapter === 3 && (
                                            <>
                                                {/* Buzul Kartopu Quest Item */}
                                                {!isMapItemCollected && !quests[1].completed ? (
                                                    <button 
                                                        onClick={() => {
                                                            setIsMapItemCollected(true);
                                                            completeQuest('q2', quests[1].reward, quests[1].xpReward);
                                                        }}
                                                        className="absolute left-[8%] top-[15%] text-base cursor-pointer hover:scale-125 transition z-20 animate-bounce select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                                    >
                                                        ☃️
                                                    </button>
                                                ) : (
                                                    <div className="absolute left-[8%] top-[15%] text-[10px] pointer-events-none select-none opacity-20 z-10">❄️</div>
                                                )}
                                                <div className="absolute right-[10%] top-[22%] text-[10px] pointer-events-none select-none z-10">🏔️</div>
                                                <div className="absolute left-[37%] bottom-[8%] text-[10px] pointer-events-none select-none z-10">🐧</div>
                                            </>
                                        )}
                                        {activeChapter === 4 && (
                                            <>
                                                {/* Közü Söndür Quest Item */}
                                                {!isMapItemCollected && !quests[1].completed ? (
                                                    <button 
                                                        onClick={() => {
                                                            setIsMapItemCollected(true);
                                                            completeQuest('q2', quests[1].reward, quests[1].xpReward);
                                                        }}
                                                        className="absolute left-[41%] bottom-[8%] text-base cursor-pointer hover:scale-125 transition z-20 animate-bounce select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                                    >
                                                        🔥
                                                    </button>
                                                ) : (
                                                    <div className="absolute left-[41%] bottom-[8%] text-[10px] pointer-events-none select-none opacity-20 z-10">🔥</div>
                                                )}
                                                <div className="absolute left-[7%] top-[12%] text-[10px] pointer-events-none select-none z-10">🔥</div>
                                                <div className="absolute right-[10%] top-[28%] text-[10px] pointer-events-none select-none z-10">🌋</div>
                                            </>
                                        )}

                                        {/* CHAPTER 4 LAVA BUBBLES */}
                                        {activeChapter === 4 && bubbles.map(b => (
                                            <motion.button
                                                key={b.id}
                                                onClick={() => {
                                                    setBubbles(prev => prev.filter(x => x.id !== b.id));
                                                    setExplosions(prev => [...prev, { id: Math.random(), left: b.left, bottom: b.bottom }]);
                                                    synthRef.current?.playCoin(); // pop sound!
                                                    setPoppedBubbles(current => {
                                                        const next = current + 1;
                                                        if (next < 3) {
                                                            const messages = [
                                                                "Harika atış! Patladı! 💥",
                                                                "Bir tane daha patladı! 💥"
                                                            ];
                                                            triggerPetSpeech(messages[next - 1]);
                                                        }
                                                        setQuests(prevQuests => prevQuests.map(q => {
                                                            if (q.id === 'q1') {
                                                                const newCurrent = q.current + 1;
                                                                const isCompleted = newCurrent >= q.target;
                                                                if (isCompleted) {
                                                                    setTimeout(() => {
                                                                        completeQuest('q1', q.reward, q.xpReward);
                                                                    }, 10);
                                                                }
                                                                return { ...q, current: newCurrent, completed: isCompleted };
                                                            }
                                                            return q;
                                                        }));
                                                        return next;
                                                    });
                                                }}
                                                style={{ left: `${b.left}%`, bottom: `${b.bottom}px` }}
                                                className="absolute w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500/80 to-red-600/80 border border-orange-400 flex items-center justify-center text-xs z-30 cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                                                animate={{ y: [0, -10, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                            >
                                                💥
                                            </motion.button>
                                        ))}
 
                                        {/* Path node buttons (Stepping Stones / Kaya Parçaları) */}
                                        {quests.map((quest, idx) => {
                                            const isCompleted = quest.completed;
                                            const isSelected = selectedPathIndex === idx;
                                            const staggerClass = idx % 2 === 0 ? "-translate-y-4" : "translate-y-4";
                                            
                                            const rockStyle = getRockStyle(idx, activeChapter);
                                            const isScrollNode = idx === 3;
                                            const sizeClasses = isScrollNode 
                                                ? "w-12 h-12 border-t-2 border-x border-b-[6px] active:translate-y-[4px] active:border-b-2" 
                                                : "w-9.5 h-9.5 border-t border-x border-b-[4px] active:translate-y-[3px] active:border-b-2";
 
                                            return (
                                                <div key={quest.id} className={cn("relative flex flex-col items-center z-10 transition-transform duration-500", staggerClass)}>
                                                    <button
                                                        onClick={() => setSelectedPathIndex(idx)}
                                                        style={rockStyle}
                                                        className={cn(
                                                            "flex items-center justify-center transition-all duration-300 relative z-10 cursor-pointer overflow-hidden",
                                                            sizeClasses,
                                                            getStoneClass(idx, isCompleted, isSelected)
                                                        )}
                                                    >
                                                        {/* Stone top highlight to catch sunlight (3D bevel highlight) */}
                                                        <div className="absolute inset-x-1.5 top-0.5 h-1 bg-white/25 rounded-full blur-[0.5px] pointer-events-none z-10" />
 
                                                        {/* Frosted Ice 3D gloss shine refraction (Zirve only) */}
                                                        {activeChapter === 3 && (
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/12 to-white/40 pointer-events-none z-10" />
                                                        )}

                                                        {/* Restored Vector Stone Hairline Cracks & Granite Speckles */}
                                                        <div className="absolute inset-0 pointer-events-none z-0">
                                                            {activeChapter === 3 ? (
                                                                <svg width="100%" height="100%" viewBox="0 0 40 40" className="opacity-[0.65] mix-blend-overlay">
                                                                    {/* Facet polygon shading (Top & Right) */}
                                                                    <polygon points="0,10 15,16 30,8 40,12 40,0 0,0" fill="#ffffff" opacity="0.3" />
                                                                    <polygon points="15,16 40,12 40,40 15,40" fill="#000000" opacity="0.18" />
                                                                    {/* Chiseled 3D ice block facet lines */}
                                                                    <path d="M 0 10 L 15 16 L 40 12 M 15 16 L 15 40 M 15 16 L 30 8" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
                                                                    <path d="M 4 22 L 10 24 M 28 20 L 34 23" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
                                                                </svg>
                                                            ) : activeChapter === 4 ? (
                                                                <svg width="100%" height="100%" viewBox="0 0 40 40" className="opacity-[0.75] mix-blend-overlay">
                                                                    {/* Volcanic magma cracks inside obsidian rock */}
                                                                    <path d="M 6 14 L 16 18 L 12 30 M 34 8 L 28 18 L 30 32" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                                                                    <path d="M 16 18 L 28 18" fill="none" stroke="#f97316" strokeWidth="1.2" opacity="0.8" />
                                                                    <circle cx="14" cy="24" r="1.2" fill="#ef4444" />
                                                                    <circle cx="26" cy="14" r="1" fill="#f97316" />
                                                                </svg>
                                                            ) : (
                                                                <svg width="100%" height="100%" viewBox="0 0 40 40" className="opacity-[0.22] mix-blend-overlay">
                                                                    {/* Tectonic crack lines */}
                                                                    <path d="M 6 14 L 16 18 L 12 30 M 34 8 L 28 18 L 30 32" fill="none" stroke="#ffffff" strokeWidth="1.2" />
                                                                    {/* Light mineral speckles */}
                                                                    <circle cx="10" cy="18" r="1" fill="#ffffff" />
                                                                    <circle cx="28" cy="12" r="1.2" fill="#ffffff" />
                                                                    <circle cx="22" cy="28" r="1" fill="#ffffff" />
                                                                    {/* Dark mineral speckles */}
                                                                    <circle cx="15" cy="8" r="1.2" fill="#000000" />
                                                                    <circle cx="32" cy="24" r="1.5" fill="#000000" />
                                                                    <circle cx="8" cy="28" r="1.2" fill="#000000" />
                                                                </svg>
                                                            )}
                                                        </div>
 
                                                        {/* Moss/Grass/Snow overlay fuzzy patch for completed rocks */}
                                                        {isCompleted && (
                                                            <div className={cn(
                                                                "absolute top-0 inset-x-0 h-3 pointer-events-none z-10",
                                                                activeChapter === 1 
                                                                    ? "bg-gradient-to-b from-[#52b788]/50 to-transparent" 
                                                                    : activeChapter === 2
                                                                        ? "bg-gradient-to-b from-[#ea580c]/40 to-transparent"
                                                                        : "bg-gradient-to-b from-white/70 to-transparent"
                                                            )} />
                                                        )}

                                                        <span className="relative z-20 font-black text-sm drop-shadow-md">
                                                            {idx === 3 ? (
                                                                <span className="text-xs">📜</span>
                                                            ) : isCompleted ? (
                                                                <span className="text-xs font-black text-emerald-400 drop-shadow-[0_2px_4px_rgba(16,185,129,0.4)]">🐾</span>
                                                            ) : (
                                                                <span>{idx + 1}</span>
                                                            )}
                                                        </span>
                                                    </button>

                                                    {/* Bouncing pet indicator */}
                                                    {quests.filter(q => q.completed).length === idx && (
                                                         <motion.div 
                                                             layoutId="activePetNode"
                                                             className="absolute -top-7 z-20 flex flex-col items-center"
                                                             transition={{ type: "spring", stiffness: 180, damping: 15 }}
                                                         >
                                                             {/* PET SPEECH BUBBLE */}
                                                             <AnimatePresence>
                                                                 {petSpeech && (
                                                                     <motion.div
                                                                         initial={{ scale: 0.8, opacity: 0, y: 10 }}
                                                                         animate={{ scale: 1, opacity: 1, y: 0 }}
                                                                         exit={{ scale: 0.8, opacity: 0, y: -10 }}
                                                                         className="absolute bottom-10 bg-white text-slate-800 text-[8px] font-black px-2 py-1 rounded-xl shadow-lg border border-slate-200 whitespace-nowrap z-50 flex items-center gap-1 select-none"
                                                                         style={{ left: '50%', transform: 'translateX(-50%)' }}
                                                                     >
                                                                         {petSpeech}
                                                                         <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-slate-200 rotate-45" />
                                                                     </motion.div>
                                                                 )}
                                                             </AnimatePresence>

                                                             <div 
                                                                 onClick={() => {
                                                                     if (activeChapter === 2) {
                                                                         const q1 = quests.find(q => q.id === 'q1');
                                                                         if (q1 && !q1.completed) {
                                                                             const nextCount = petClickCount + 1;
                                                                             setPetClickCount(nextCount);
                                                                             synthRef.current?.playCoin(); // tickle sound feedback!
                                                                             const targetTicks = ngLoop > 1 ? 10 : 5;
                                                                             if (nextCount >= targetTicks) {
                                                                                 completeQuest('q1', q1.reward, q1.xpReward);
                                                                             } else {
                                                                                 const msgs = [
                                                                                     "Ahaha dur gıdıklanıyorum! 😂",
                                                                                     "Gıdıklama dostum! 🐾",
                                                                                     "Heehee kanyon rüzgarı gıdıklıyor! 💨",
                                                                                     "Gıdıklamaya devam et! 🤪"
                                                                                 ];
                                                                                 triggerPetSpeech(msgs[(nextCount - 1) % msgs.length]);
                                                                             }
                                                                         }
                                                                     }
                                                                 }}
                                                                 className={cn(
                                                                     "w-6 h-6 rounded-full flex items-center justify-center border shadow-lg animate-bounce text-xs relative cursor-pointer select-none",
                                                                     activeChapter === 1 ? "bg-emerald-950/90 border-emerald-500 shadow-emerald-500/20" :
                                                                     activeChapter === 2 ? "bg-amber-950/90 border-amber-500 shadow-amber-500/20" :
                                                                     activeChapter === 3 ? "bg-cyan-950/90 border-cyan-500 shadow-cyan-500/20" :
                                                                     "bg-rose-950/90 border-rose-500 shadow-rose-500/20"
                                                                 )}
                                                             >
                                                                 <motion.span
                                                                     animate={{ 
                                                                         rotate: [0, -6, 6, 0],
                                                                         y: [0, -2, 0]
                                                                     }}
                                                                     transition={{ 
                                                                         repeat: Infinity, 
                                                                         duration: 1.6, 
                                                                         ease: "easeInOut" 
                                                                     }}
                                                                     className="block"
                                                                 >
                                                                     {activeChapter === 1 ? "🐱" : activeChapter === 2 ? "🐈" : activeChapter === 3 ? "🐶" : "🦊"}
                                                                 </motion.span>
                                                                 <span className={cn(
                                                                     "absolute inset-0 rounded-full border opacity-75 animate-ping",
                                                                     activeChapter === 1 ? "border-emerald-400" :
                                                                     activeChapter === 2 ? "border-amber-400" :
                                                                     activeChapter === 3 ? "border-cyan-400" :
                                                                     "border-rose-400"
                                                                 )} />
                                                             </div>
                                                             <span className="text-[6px] font-black text-white/50 tracking-wider bg-black/60 px-1 rounded-full uppercase mt-0.5 select-none">
                                                                 {activeChapter === 2 && !quests.find(q => q.id === 'q1')?.completed
                                                                     ? `Gıdıkla: ${petClickCount}/${ngLoop > 1 ? 10 : 5}`
                                                                     : "Şimdi"}
                                                             </span>
                                                         </motion.div>
                                                     )}
                                                </div>
                                            );
                                        })}
                                        </motion.div>
                                    </div>

                                    {/* DETAIL CARD & MYSTERY SCRATCH (Item 1 - Old Map Scroll) */}
                                    <div className="flex-1 flex flex-col justify-center relative z-10">
                                        {selectedPathIndex === 3 ? (
                                            /* Mystery Card Scratch Game */
                                            <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-[#5c4027]/40 bg-white/[0.01]">
                                                <AnimatePresence>
                                                    {!isScratchScratched ? (
                                                        <motion.div 
                                                            key="scratch-cover"
                                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                            transition={{ duration: 0.4 }}
                                                            onClick={() => { setIsScratchScratched(true); if (synthRef.current) { synthRef.current.playScratch(); } }}
                                                            className="absolute inset-0 bg-gradient-to-tr from-[#653f1c] via-[#8c6239] to-[#452910] border border-[#3e2c1c] flex flex-col items-center justify-center p-4 cursor-pointer z-20 group shadow-lg shadow-black/40"
                                                        >
                                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                            <div className="w-10 h-10 rounded-full bg-[#f5e6d3]/10 backdrop-blur-sm flex items-center justify-center shadow-lg border border-[#f5e6d3]/20 mb-2 group-hover:scale-110 transition duration-300">
                                                                <span className="text-base">🧽</span>
                                                            </div>
                                                            <h4 className="text-[10px] font-black uppercase tracking-wider text-[#fef3c7] drop-shadow-md">ESKİ HARİTAYI KAZI</h4>
                                                            <p className="text-[8px] text-[#fef3c7]/70 font-bold uppercase tracking-widest mt-1">Haritayı açmak için Dokun</p>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div 
                                                            key="scratch-content"
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className={cn(
                                                                "absolute inset-0 p-4 flex flex-col justify-between border-2 rounded-2xl transition-colors duration-1000",
                                                                activeChapter === 1 
                                                                    ? "bg-[#f5e6d3] border-[#8c6239] text-[#3e2715] shadow-[inset_0_0_20px_rgba(101,63,28,0.25)]" 
                                                                    : activeChapter === 2
                                                                        ? "bg-[#fbe9e7] border-[#d84315] text-[#4e0d00] shadow-[inset_0_0_20px_rgba(194,65,12,0.18)]"
                                                                        : "bg-[#ecfeff] border-[#0891b2] text-[#083444] shadow-[inset_0_0_20px_rgba(6,182,212,0.15)]"
                                                            )}
                                                            style={{ borderRadius: "20px 16px 24px 18px" }} // Wavy rough-cut edges
                                                        >
                                                            {!quests[3].completed && !activeChoice ? (
                                                                /* choice selection screen */
                                                                <div className="flex flex-col gap-2 h-full justify-between select-none">
                                                                    <div>
                                                                        <span className={cn(
                                                                            "text-[7px] font-black border px-2 py-0.5 rounded uppercase tracking-widest",
                                                                            activeChapter === 1 ? "text-[#8c6239] bg-[#8c6239]/10 border-[#8c6239]/30" :
                                                                            activeChapter === 2 ? "text-[#d84315] bg-[#d84315]/10 border-[#d84315]/30" :
                                                                            "text-[#0891b2] bg-[#0891b2]/10 border-[#0891b2]/30"
                                                                        )}>
                                                                            Dönüm Noktası (Hikaye Seçimi)
                                                                        </span>
                                                                        <p className="text-[9px] leading-relaxed font-semibold font-serif italic text-slate-800 mt-2">
                                                                            {CHAPTER_STORIES[activeChapter]?.choices.prompt}
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={() => {
                                                                                setActiveChoice('A');
                                                                                setChoiceClickCount(0);
                                                                                synthRef.current?.playCoin();
                                                                            }}
                                                                            className="flex-1 py-1.5 px-2 bg-amber-800 text-white rounded-xl text-[8.5px] font-black uppercase border border-amber-600 hover:bg-amber-900 transition active:scale-95 cursor-pointer leading-tight text-center"
                                                                        >
                                                                            {CHAPTER_STORIES[activeChapter]?.choices.optionA}
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => {
                                                                                setActiveChoice('B');
                                                                                setChoiceClickCount(0);
                                                                                synthRef.current?.playCoin();
                                                                            }}
                                                                            className="flex-1 py-1.5 px-2 bg-[#8c6239] text-[#f5e6d3] rounded-xl text-[8.5px] font-black uppercase border border-[#704b28] hover:bg-[#704b28] transition active:scale-95 cursor-pointer leading-tight text-center"
                                                                        >
                                                                            {CHAPTER_STORIES[activeChapter]?.choices.optionB}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : !quests[3].completed && activeChoice ? (
                                                                /* choice micro-game task */
                                                                <div className="flex flex-col gap-2 h-full justify-between select-none">
                                                                    <div>
                                                                        <span className={cn(
                                                                            "text-[7px] font-black border px-2 py-0.5 rounded uppercase tracking-widest",
                                                                            activeChapter === 1 ? "text-[#8c6239] bg-[#8c6239]/10 border-[#8c6239]/30" :
                                                                            activeChapter === 2 ? "text-[#d84315] bg-[#d84315]/10 border-[#d84315]/30" :
                                                                            "text-[#0891b2] bg-[#0891b2]/10 border-[#0891b2]/30"
                                                                        )}>
                                                                            Hikaye Görevi: Seçim {activeChoice}
                                                                        </span>
                                                                        <p className="text-[9px] leading-relaxed font-bold text-slate-800 mt-2">
                                                                            {activeChoice === 'A' 
                                                                                ? CHAPTER_STORIES[activeChapter]?.choices.gameA 
                                                                                : CHAPTER_STORIES[activeChapter]?.choices.gameB}
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex flex-col gap-1 items-center">
                                                                        <button 
                                                                            onClick={(e) => {
                                                                                const targetClicks = ngLoop > 1 ? 12 : 6;
                                                                                const next = choiceClickCount + 1;
                                                                                setChoiceClickCount(next);
                                                                                synthRef.current?.playScratch();
                                                                                
                                                                                if (next < targetClicks) {
                                                                                    triggerPetSpeech(`İlerleme: ${next}/${targetClicks} ⚡`);
                                                                                } else {
                                                                                    completeQuest('q4', 25, 60, e);
                                                                                    const choiceText = activeChoice === 'A' 
                                                                                        ? CHAPTER_STORIES[activeChapter]?.choices.optionA 
                                                                                        : CHAPTER_STORIES[activeChapter]?.choices.optionB;
                                                                                    const petName = activeChapter === 1 ? "Pamuk" : activeChapter === 2 ? "Fıstık" : activeChapter === 3 ? "Pati" : "Ateş";
                                                                                    const decisionEntry = `${petName} seçimini yaptı: ${choiceText}. Görevi tamamlayarak tılsımın parçasını kurtardı!`;
                                                                                    setChronicles(prev => [decisionEntry, ...prev]);
                                                                                }
                                                                            }}
                                                                            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl text-[9px] font-black uppercase border border-emerald-500 hover:shadow-md transition active:scale-95 cursor-pointer text-center"
                                                                        >
                                                                            {activeChoice === 'A' ? "MEŞALEYİ YAK 🕯️" : "DENGEYİ KORU ⚖️"} ({choiceClickCount}/{ngLoop > 1 ? 12 : 6})
                                                                        </button>
                                                                        
                                                                        <button 
                                                                            onClick={() => setActiveChoice(null)}
                                                                            className="text-[7.5px] font-black uppercase text-slate-400 hover:text-slate-600 transition tracking-widest cursor-pointer mt-1"
                                                                        >
                                                                            ↩️ SEÇİMİ DEĞİŞTİR
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                /* quest completed state */
                                                                <div className="flex flex-col gap-2 h-full justify-between select-none">
                                                                    <div>
                                                                        <div className="flex justify-between items-start">
                                                                            <span className={cn(
                                                                                "text-[7px] font-black border px-2 py-0.5 rounded uppercase tracking-widest",
                                                                                activeChapter === 1 ? "text-emerald-700 bg-emerald-100 border-emerald-300" :
                                                                                activeChapter === 2 ? "text-[#d84315] bg-[#d84315]/10 border-[#d84315]/30" :
                                                                                "text-[#0891b2] bg-[#0891b2]/10 border-[#0891b2]/30"
                                                                            )}>
                                                                                Perde Görevi Tamamlandı 🎉
                                                                            </span>
                                                                            <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+25 🪙 / +60 TP</span>
                                                                        </div>
                                                                        <h4 className="text-xs font-black mt-2 text-slate-800">
                                                                            {quests[3]?.title}
                                                                        </h4>
                                                                        <p className="text-[9px] leading-relaxed text-slate-600 mt-1 italic">
                                                                            {CHAPTER_STORIES[activeChapter]?.outro}
                                                                        </p>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => {
                                                                            if (quests.every(q => q.completed)) {
                                                                                if (streak === 7 && isChestOpened) {
                                                                                    setIsActOutroOpen(true);
                                                                                }
                                                                            }
                                                                        }}
                                                                        disabled={!quests.every(q => q.completed) || !(streak === 7 && isChestOpened)}
                                                                        className={cn(
                                                                            "w-full py-2.5 rounded-xl text-xs font-black uppercase transition active:scale-98 cursor-pointer shadow-md text-center",
                                                                            quests.every(q => q.completed)
                                                                                ? (streak === 7 && isChestOpened)
                                                                                    ? "bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400 text-white animate-pulse"
                                                                                    : "bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed"
                                                                                : "bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default"
                                                                        )}
                                                                    >
                                                                        {quests.every(q => q.completed)
                                                                            ? streak < 7
                                                                                ? `GÜNLÜK SERÜVEN TAMAMLANDI! 🔥 (${streak}/7)`
                                                                                : !isChestOpened
                                                                                    ? "Haftalık Sandığı Aç! 🎁"
                                                                                    : activeChapter === 4 
                                                                                        ? "TILSIMI BİRLEŞTİR (BÜYÜK FİNAL) 🔮"
                                                                                        : `Perde Sonu Kapanışını Oku 📜`
                                                                            : "BÖLÜMÜN DİĞER GÖREVLERİNİ BİTİR"}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            /* Standard Path Quest Details */
                                            <div className="relative bg-[#130b06]/60 border border-[#3e2c1c]/40 rounded-2xl p-4 flex flex-col justify-between h-40 overflow-hidden">
                                                {/* ICE SHEET OVERLAY FOR MELTING QUEST (Chapter 3, Quest 1) */}
                                                {activeChapter === 3 && selectedPathIndex === 0 && !quests[0].completed && walkingQuestId !== quests[0].id && (
                                                    <motion.div 
                                                        className="absolute inset-0 bg-cyan-200/30 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20 cursor-pointer select-none"
                                                        onClick={() => {
                                                            const targetClicks = ngLoop > 1 ? 16 : 8;
                                                            const nextClicks = meltClicks + 1;
                                                            setMeltClicks(nextClicks);
                                                            synthRef.current?.playScratch(); // ice scrape sound!
                                                            if (nextClicks >= targetClicks) {
                                                                completeQuest('q1', quests[0].reward, quests[0].xpReward);
                                                            } else {
                                                                const messages = [
                                                                    "Buzlar çok soğuk! 🥶",
                                                                    "Buzları kır, mama kabıma ulaştır! 🍖",
                                                                    "Çatırdıyor sanki! 🧊",
                                                                    "Biraz daha hızlan! ⚡",
                                                                    "Az kaldı dostum! 🐾",
                                                                    "Buz tabakası çatlıyor! ❄️",
                                                                    "Neredeyse erittik! 🔥"
                                                                ];
                                                                triggerPetSpeech(messages[(nextClicks - 1) % messages.length]);
                                                            }
                                                        }}
                                                    >
                                                        {/* DYNAMIC ICE CRACK SVG OVERLAY */}
                                                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70" viewBox="0 0 300 160">
                                                            {meltClicks >= 1 && (
                                                                <path d="M 150 80 L 130 60 M 150 80 L 170 90 M 150 80 L 140 100" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                                            )}
                                                            {meltClicks >= 3 && (
                                                                <path d="M 130 60 L 100 50 M 170 90 L 200 110 M 140 100 L 120 130" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                                            )}
                                                            {meltClicks >= 5 && (
                                                                <path d="M 100 50 L 70 55 M 200 110 L 230 100 M 120 130 L 130 150 M 150 80 L 190 50" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                                            )}
                                                            {meltClicks >= 7 && (
                                                                <path d="M 70 55 L 40 45 M 230 100 L 260 120 M 190 50 L 220 30 M 150 80 L 100 110" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                                            )}
                                                        </svg>

                                                        <div className="absolute inset-2 border border-white/40 rounded-xl pointer-events-none" />
                                                        <span className="text-4xl animate-pulse">🧊</span>
                                                        <span className="text-[10px] font-black text-white uppercase mt-2 tracking-wider drop-shadow-md">Buzu Eritmek İçin Tıkla!</span>
                                                        <div className="w-2/3 h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden border border-white/15">
                                                            <div 
                                                                className="h-full bg-cyan-400 transition-all duration-200" 
                                                                style={{ width: `${(meltClicks / (ngLoop > 1 ? 16 : 8)) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[8px] font-bold text-cyan-200 mt-1">{meltClicks}/{ngLoop > 1 ? 16 : 8} Tıklama</span>
                                                    </motion.div>
                                                )}

                                                <div className="flex justify-between items-start select-none">
                                                    <div>
                                                        <span className="text-[8px] font-black text-[#b45309] bg-[#d97706]/10 border border-[#d97706]/20 px-2 py-0.5 rounded uppercase tracking-wider">SERÜVEN {selectedPathIndex + 1}</span>
                                                        <h4 className="text-xs font-black text-[#f5e6d3] mt-1">{quests[selectedPathIndex]?.title}</h4>
                                                    </div>
                                                    <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full flex gap-1">
                                                        <span>+{quests[selectedPathIndex]?.reward} 🪙</span>
                                                        <span className="border-l border-amber-400/30 pl-1">+{quests[selectedPathIndex]?.xpReward} TP</span>
                                                    </span>
                                                </div>

                                                {/* Walking Path Line track */}
                                                <div className="relative w-full h-8 bg-black/40 border border-amber-950/40 rounded-xl my-2 flex items-center px-4 overflow-hidden">
                                                    <div className="absolute inset-x-0 h-[1px] border-b border-dashed border-amber-900/30 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    
                                                    {/* Walking Pet */}
                                                    <motion.div 
                                                        className="absolute text-lg select-none"
                                                        style={{ left: `${walkingQuestId === quests[selectedPathIndex]?.id ? walkPercent : (quests[selectedPathIndex]?.completed ? 85 : 5)}%` }}
                                                        animate={walkingQuestId === quests[selectedPathIndex]?.id ? {
                                                            rotate: [0, -10, 10, 0],
                                                            y: [0, -4, 0]
                                                        } : {}}
                                                        transition={walkingQuestId === quests[selectedPathIndex]?.id ? {
                                                            repeat: Infinity,
                                                            duration: 0.4,
                                                            ease: "easeInOut"
                                                        } : {}}
                                                    >
                                                        {activeChapter === 1 ? "🐱" : activeChapter === 2 ? "🐈" : activeChapter === 3 ? "🐶" : "🦊"}
                                                    </motion.div>

                                                    {/* Target item */}
                                                    <div className="absolute right-4 text-lg select-none">
                                                        {quests[selectedPathIndex]?.completed ? "💥" : getQuestTargetEmoji(activeChapter, selectedPathIndex)}
                                                    </div>
                                                </div>

                                                {quests[selectedPathIndex]?.completed ? (
                                                    <div className="w-full py-2 bg-emerald-950/40 border border-emerald-800/30 rounded-xl text-center text-[10px] font-black uppercase text-emerald-400 select-none">
                                                        TAMAMLANDI! PETİN HEDEFE ULAŞTI 🐾
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            startWalkingSim(
                                                                quests[selectedPathIndex].id, 
                                                                quests[selectedPathIndex].reward, 
                                                                quests[selectedPathIndex].xpReward || 25, 
                                                                e
                                                            );
                                                        }}
                                                        disabled={walkingQuestId !== null}
                                                        className={cn(
                                                            "w-full py-2 rounded-xl text-[10px] font-black uppercase transition active:scale-98 cursor-pointer shadow-md select-none",
                                                            walkingQuestId !== null
                                                                ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                                                                : "bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 border border-amber-600 text-amber-50"
                                                        )}
                                                    >
                                                        {walkingQuestId === quests[selectedPathIndex]?.id ? "YOLCULUK BAŞLADI... 🐾" : "Görevi Yürüt ve Tamamla 🐾"}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Countdown Timer & Chapter Switcher */}
                                    <div className="flex flex-col gap-2 relative z-10 mt-1 shrink-0">
                                        <div className="text-center text-[9px] font-black text-amber-500/80 bg-[#1a0e05]/30 border border-[#3e2c1c]/30 px-3 py-1 rounded-full flex items-center justify-center gap-1.5 max-w-[240px] mx-auto shadow-inner">
                                            <span>Yeni serüvene kalan süre:</span>
                                            <span className="font-mono text-amber-400">
                                                {String(timeLeft.hours).padStart(2, '0')}sa {String(timeLeft.minutes).padStart(2, '0')}dk {String(timeLeft.seconds).padStart(2, '0')}sn
                                            </span>
                                            <span>⏱️</span>
                                        </div>
                                        
                                        {/* Chapter complete / advance button if all 4 quests are completed */}
                                        {quests.every(q => q.completed) && (
                                            <motion.button
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                whileTap={{ scale: (streak === 7 && isChestOpened && activeChapter < 4) ? 0.97 : 1 }}
                                                disabled={!(streak === 7 && isChestOpened) || activeChapter === 4}
                                                onClick={() => {
                                                    if (streak === 7 && isChestOpened) {
                                                        if (activeChapter < 4) {
                                                            triggerConfetti();
                                                            setCoinBalance(prev => prev + 150); // chapter completion bonus!
                                                            setActiveChapter(prev => prev + 1);
                                                            setStreak(0);
                                                            setIsChestOpened(false);
                                                            setQuests(prev => prev.map(q => ({ ...q, completed: false })));
                                                        }
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg",
                                                    (streak === 7 && isChestOpened && activeChapter < 4)
                                                        ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-[#f5e6d3] border-2 border-amber-500 shadow-amber-950/40 animate-pulse"
                                                        : "bg-[#1e293b] border-2 border-slate-700 text-slate-500 cursor-not-allowed"
                                                )}
                                            >
                                                {activeChapter === 4 
                                                    ? "YENİ SEZON ÇOK YAKINDA! ⏳" 
                                                    : streak < 7
                                                        ? `GÜNLÜK SERÜVEN TAMAMLANDI! 🔥 (${streak}/7)`
                                                        : !isChestOpened
                                                            ? "HAFTALIK SANDIĞI AÇ! 🎁"
                                                            : `BÖLÜM ${activeChapter + 1}'E İLERLE (${activeChapter === 1 ? "KANYON 🏜️" : activeChapter === 2 ? "ZİRVE ❄️" : "KRATER 🌋"})`}
                                            </motion.button>
                                        )}

                                        {/* Manual Test/Cheat Chapter Switcher */}
                                        <div className="flex justify-center gap-2 mt-0.5 select-none">
                                            <button 
                                                onClick={() => setActiveChapter(1)}
                                                className={cn("text-[7.5px] font-black px-2 py-0.5 rounded border transition active:scale-95 cursor-pointer", activeChapter === 1 ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" : "bg-white/5 border-white/5 text-white/30")}
                                            >
                                                Orman 🌲
                                            </button>
                                            <button 
                                                onClick={() => setActiveChapter(2)}
                                                className={cn("text-[7.5px] font-black px-2 py-0.5 rounded border transition active:scale-95 cursor-pointer", activeChapter === 2 ? "bg-amber-950/40 border-amber-800 text-amber-400" : "bg-white/5 border-white/5 text-white/30")}
                                            >
                                                Kanyon 🏜️
                                            </button>
                                            <button 
                                                onClick={() => setActiveChapter(3)}
                                                className={cn("text-[7.5px] font-black px-2 py-0.5 rounded border transition active:scale-95 cursor-pointer", activeChapter === 3 ? "bg-sky-950/40 border-sky-800 text-sky-400" : "bg-white/5 border-white/5 text-white/30")}
                                            >
                                                Zirve ❄️
                                            </button>
                                            <button 
                                                onClick={() => setActiveChapter(4)}
                                                className={cn("text-[7.5px] font-black px-2 py-0.5 rounded border transition active:scale-95 cursor-pointer", activeChapter === 4 ? "bg-rose-950/40 border-rose-800 text-rose-400" : "bg-white/5 border-white/5 text-white/30")}
                                            >
                                                Krater 🌋
                                            </button>
                                            <button 
                                                onClick={() => setQuests(prev => prev.map(q => ({ ...q, completed: false })))}
                                                className="text-[7.5px] font-black px-2 py-0.5 rounded border border-purple-500/30 bg-purple-950/40 text-purple-400 hover:bg-purple-950/60 transition active:scale-95 cursor-pointer"
                                                title="Günü Geçir: Görevleri sıfırlayarak seriyi devam ettirmeni sağlar"
                                            >
                                                Günü Geç 🧪
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="text-center text-[8px] text-[#f5e6d3]/20 italic relative z-10">Kaydırmaya devam et ⬇️</div>
                                </div>
                            </section>

                            {/* SLIDE 2: HAFTALIK PODYUM */}
                            <section className="min-h-screen w-full flex items-center justify-center pt-28 pb-12 px-6 relative">
                                <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                                    
                                    {/* Header */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                                                <Trophy className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black uppercase tracking-widest text-white/90">Haftalık Podyum</h2>
                                                <p className="text-[10px] text-amber-400 font-bold tracking-wider">Haftanın Lider Evcil Hayvanları</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Podium Columns */}
                                    <div className="flex justify-between items-end gap-3 mt-4 h-48 px-2">
                                        
                                        {/* Rank 2 - Silver */}
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <div className="relative">
                                                <img 
                                                    src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=150" 
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-300 shadow-lg" 
                                                    alt="silver"
                                                />
                                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-300 text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">2</div>
                                            </div>
                                            <div className="w-full bg-slate-400/10 border border-slate-300/20 rounded-t-2xl py-2 flex flex-col items-center gap-0.5 h-20 justify-center">
                                                <span className="text-[10px] font-black text-slate-300">Pamuk 🐈</span>
                                                <span className="text-[9px] text-white/40">{podiumVotes["2"]} Oy</span>
                                                <button
                                                    onClick={(e) => handlePodiumVote("2", e)}
                                                    disabled={votedPodium.has("2")}
                                                    className={cn(
                                                        "text-[8px] font-black uppercase px-2.5 py-1 rounded-full mt-1.5 border transition",
                                                        votedPodium.has("2") 
                                                            ? "bg-slate-500/20 border-slate-500/30 text-white/40 cursor-default" 
                                                            : "bg-slate-300 hover:bg-white text-black border-white active:scale-95"
                                                    )}
                                                >
                                                    {votedPodium.has("2") ? "OY VERİLDİ" : "OY VER (+10)"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Rank 1 - Gold */}
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <div className="relative">
                                                <Crown className="w-6 h-6 text-yellow-400 absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] animate-bounce" />
                                                <img 
                                                    src="https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=150" 
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]" 
                                                    alt="gold"
                                                />
                                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">1</div>
                                            </div>
                                            <div className="w-full bg-yellow-400/10 border border-yellow-400/20 rounded-t-2xl py-2 flex flex-col items-center gap-0.5 h-24 justify-center">
                                                <span className="text-[11px] font-black text-yellow-400">Tarçın 🐕</span>
                                                <span className="text-[9px] text-white/40">{podiumVotes["1"]} Oy</span>
                                                <button
                                                    onClick={(e) => handlePodiumVote("1", e)}
                                                    disabled={votedPodium.has("1")}
                                                    className={cn(
                                                        "text-[8px] font-black uppercase px-2.5 py-1 rounded-full mt-1.5 border transition",
                                                        votedPodium.has("1") 
                                                            ? "bg-yellow-500/20 border-yellow-500/30 text-white/40 cursor-default" 
                                                            : "bg-yellow-400 hover:bg-white text-black border-white active:scale-95"
                                                    )}
                                                >
                                                    {votedPodium.has("1") ? "OY VERİLDİ" : "OY VER (+10)"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Rank 3 - Bronze */}
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <div className="relative">
                                                <img 
                                                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=150" 
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-600 shadow-lg" 
                                                    alt="bronze"
                                                />
                                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-600 text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">3</div>
                                            </div>
                                            <div className="w-full bg-amber-600/10 border border-amber-600/20 rounded-t-2xl py-2 flex flex-col items-center gap-0.5 h-16 justify-center">
                                                <span className="text-[10px] font-black text-amber-600">Boncuk 🦜</span>
                                                <span className="text-[9px] text-white/40">{podiumVotes["3"]} Oy</span>
                                                <button
                                                    onClick={(e) => handlePodiumVote("3", e)}
                                                    disabled={votedPodium.has("3")}
                                                    className={cn(
                                                        "text-[8px] font-black uppercase px-2.5 py-1 rounded-full mt-1.5 border transition",
                                                        votedPodium.has("3") 
                                                            ? "bg-amber-500/20 border-amber-500/30 text-white/40 cursor-default" 
                                                            : "bg-amber-600 hover:bg-white text-black border-white active:scale-95"
                                                    )}
                                                >
                                                    {votedPodium.has("3") ? "OY VERİLDİ" : "OY VER (+10)"}
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                    
                                    <div className="text-center text-[10px] text-white/30 italic">Kaydırmaya devam et ⬇️</div>
                                </div>
                            </section>

                            {/* SLIDE 3: DUELLO ARENASI */}
                            <section className="min-h-screen w-full flex items-center justify-center pt-28 pb-12 px-6 relative">
                                {(() => {
                                    const curDuel = DUELLO_THEMES[activeChapter] || DUELLO_THEMES[1];
                                    return (
                                        <div 
                                            style={{ boxShadow: `0 25px 50px -12px ${curDuel.glowColor}` }}
                                            className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-1000"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                            
                                            {/* Header */}
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-1000",
                                                        activeChapter === 1 ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20" :
                                                        activeChapter === 2 ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20" :
                                                        activeChapter === 3 ? "bg-gradient-to-br from-cyan-400 to-sky-600 shadow-cyan-500/20" :
                                                        "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20"
                                                    )}>
                                                        <Swords className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-sm font-black uppercase tracking-widest text-white/90">Düello Arenası</h2>
                                                        <p className={cn("text-[10px] font-black tracking-wider transition-colors duration-1000", curDuel.primaryColor)}>
                                                            Hangisi Daha Tatlı? ⚔️
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Topic Badge */}
                                            <div className={cn(
                                                "border rounded-full px-4 py-1.5 self-center text-xs font-black tracking-wider transition-all duration-1000 shadow-inner",
                                                curDuel.badgeBg
                                            )}>
                                                {curDuel.topic}
                                            </div>

                                            {/* VS Split Screen Voting */}
                                            <div className="flex relative rounded-3xl overflow-hidden h-56 border border-white/10 mt-2">
                                                
                                                {/* Challenger Left */}
                                                <div 
                                                    onClick={(e) => {
                                                        if (duelVote) return;
                                                        setDuelVote('left');
                                                        setLeftVotes(v => v + 1);
                                                        triggerCoinReward(15, e);
                                                        completeQuest('q3', quests[2].reward, quests[2].xpReward, e);
                                                    }}
                                                    className={cn(
                                                        "w-1/2 h-full relative cursor-pointer overflow-hidden transition-all group",
                                                        duelVote === 'left' && `border-r-4 ${curDuel.vsBorder}`
                                                    )}
                                                >
                                                    <img src={curDuel.leftImg} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                    
                                                    <div className="absolute bottom-4 left-4 right-4 flex flex-col items-center">
                                                        <span className="text-[10px] font-black text-white">{curDuel.leftName}</span>
                                                        <span className="text-[9px] text-white/40">{curDuel.leftLoc}</span>
                                                        
                                                        {duelVote && (
                                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={cn("mt-2 text-xl font-black transition-colors duration-1000", curDuel.accentLeft)}>
                                                                {Math.round((leftVotes / (leftVotes + rightVotes)) * 100)}%
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* VS Center Badge */}
                                                <div className={cn(
                                                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-[#0d0a1b] border-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-1000",
                                                    activeChapter === 1 ? "border-emerald-500 text-emerald-400" :
                                                    activeChapter === 2 ? "border-amber-500 text-amber-400" :
                                                    activeChapter === 3 ? "border-cyan-500 text-cyan-400" :
                                                    "border-rose-500 text-rose-400"
                                                )}>
                                                    <span className="text-xs font-black">VS</span>
                                                </div>

                                                {/* Opponent Right */}
                                                <div 
                                                    onClick={(e) => {
                                                        if (duelVote) return;
                                                        setDuelVote('right');
                                                        setRightVotes(v => v + 1);
                                                        triggerCoinReward(15, e);
                                                        completeQuest('q3', quests[2].reward, quests[2].xpReward, e);
                                                    }}
                                                    className={cn(
                                                        "w-1/2 h-full relative cursor-pointer overflow-hidden transition-all group",
                                                        duelVote === 'right' && `border-l-4 ${curDuel.vsBorder}`
                                                    )}
                                                >
                                                    <img src={curDuel.rightImg} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                    
                                                    <div className="absolute bottom-4 left-4 right-4 flex flex-col items-center">
                                                        <span className="text-[10px] font-black text-white">{curDuel.rightName}</span>
                                                        <span className="text-[9px] text-white/40">{curDuel.rightLoc}</span>
                                                        
                                                        {duelVote && (
                                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={cn("mt-2 text-xl font-black transition-colors duration-1000", curDuel.accentRight)}>
                                                                {Math.round((rightVotes / (leftVotes + rightVotes)) * 100)}%
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="text-center min-h-[40px] flex items-center justify-center">
                                                {!duelVote ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <p className="text-[9px] text-white/40 font-medium">Favorini seçmek için fotoğrafın üzerine dokun 👆</p>
                                                        <span className="text-[8px] text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full shadow-inner animate-pulse">Oy için +15 🪙</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs font-black text-emerald-400 drop-shadow-[0_2px_4px_rgba(16,185,129,0.2)]">Oyunuz başarıyla kaydedildi! +15 🪙 kazandınız 🎉</p>
                                                )}
                                            </div>
                                            
                                            <div className="text-center text-[10px] text-white/30 italic mt-0.5 select-none">Kaydırmaya devam et ⬇️</div>
                                        </div>
                                    );
                                })()}
                            </section>
                            {/* SLIDES 4+: POSTS (IMMERSIVE TICKTOK STYLE) */}
                            {posts.map((post) => (
                                <section key={post.id} className="h-screen w-full relative flex items-center justify-center p-0">
                                    <div 
                                        onDoubleClick={(e) => handleDoubleTap(post.id, e)}
                                        className="relative w-full h-full max-w-lg mx-auto bg-black overflow-hidden"
                                    >
                                        {/* Fullscreen cover media */}
                                        <img src={post.media} className="absolute inset-0 w-full h-full object-cover z-0" alt="post" />

                                        {/* Ambient Gradients overlay */}
                                        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none z-10" />
                                        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

                                        {/* GİZEMLİ SİNCAP GÖREVİ (Chapter 1, Quest 1) */}
                                        {activeChapter === 1 && !quests[0].completed && post.id === "post_2" && (
                                            <motion.button 
                                                onClick={(e) => {
                                                    completeQuest('q1', quests[0].reward, quests[0].xpReward, e);
                                                    triggerConfetti();
                                                }}
                                                className="absolute top-28 right-8 z-30 text-2xl cursor-pointer hover:scale-125 transition select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] bg-transparent border-none outline-none"
                                                initial={{ scale: 0.8, opacity: 0.7 }}
                                                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.7, 1, 0.7] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                            >
                                                🐿️
                                            </motion.button>
                                        )}

                                        {/* DOUBLE TAP HEART POPUP ANIMATION */}
                                        <AnimatePresence>
                                            {doubleTapHearts.map(h => {
                                                const activeEffect = STORE_EFFECTS.find(e => e.id === selectedEffect) || STORE_EFFECTS[0];
                                                return (
                                                    <motion.div
                                                        key={h.id}
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0], opacity: 1 }}
                                                        exit={{ scale: 0.3, opacity: 0, y: -40 }}
                                                        transition={{ duration: 0.5 }}
                                                        style={{ left: h.x - 40, top: h.y - 40 }}
                                                        className="absolute z-40 flex items-center justify-center pointer-events-none"
                                                    >
                                                        <span className={cn("text-7xl select-none", activeEffect.color)}>
                                                            {activeEffect.emoji}
                                                        </span>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>

                                        {/* Left text Details (Author & Caption) inside a glass card */}
                                        <div className="absolute bottom-24 left-4 right-20 z-20 bg-black/40 backdrop-blur-md border border-white/10 rounded-[1.8rem] p-4 shadow-2xl">
                                            <div className="flex items-center gap-2">
                                                <img src={post.avatar} className="w-9 h-9 rounded-full border border-white/20 object-cover" />
                                                <div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs font-black tracking-wide text-white">@{post.username}</span>
                                                        <BadgeCheck className="w-3.5 h-3.5 text-cyan-400 fill-black" />
                                                    </div>
                                                    <span className="text-[8px] text-white/50 font-bold uppercase tracking-wider">Halkın Favorisi</span>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-white/90 leading-relaxed mt-2">{post.caption}</p>
                                            <div className="flex items-center gap-1.5 text-cyan-300 mt-2">
                                                <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{post.audioName}</span>
                                            </div>
                                        </div>

                                        {/* Right Sidebar actions */}
                                        <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-4 items-center">
                                            
                                            {/* Heart Button */}
                                            <button 
                                                onClick={(e) => {
                                                    setPosts(prev => prev.map(p => {
                                                        if (p.id === post.id) {
                                                            const newIsLiked = !p.isLiked;
                                                            if (newIsLiked) triggerCoinReward(5, e);
                                                            return { ...p, isLiked: newIsLiked, likes: newIsLiked ? p.likes + 1 : p.likes - 1 };
                                                        }
                                                        return p;
                                                    }));
                                                }}
                                                className="flex flex-col items-center gap-1 group active:scale-90 transition"
                                            >
                                                <div className={cn(
                                                    "w-12 h-12 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all",
                                                    post.isLiked 
                                                        ? "bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                                                        : "bg-black/40 border-white/10 text-white/80 group-hover:bg-white/15"
                                                )}>
                                                    <Heart className={cn("w-5 h-5", post.isLiked && "fill-current")} />
                                                </div>
                                                <span className="text-[10px] font-bold text-white/70">{post.likes}</span>
                                            </button>

                                            {/* Comment Button */}
                                            <button 
                                                onClick={() => setActiveCommentPostId(post.id)}
                                                className="flex flex-col items-center gap-1 group active:scale-90 transition"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/80 group-hover:bg-white/15">
                                                    <MessageCircle className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-bold text-white/70">{post.commentsCount}</span>
                                            </button>

                                            {/* Share Button */}
                                            <button className="flex flex-col items-center gap-1 group active:scale-90 transition">
                                                <div className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/80 group-hover:bg-white/15">
                                                    <Share2 className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-bold text-white/70">Paylaş</span>
                                            </button>

                                        </div>

                                    </div>
                                </section>
                            ))}

                        </motion.div>
                    ) : (
                        /* BENTO GRID EXPLORE VIEW MODE */
                        <motion.div
                            key="grid-explore-view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-full w-full overflow-y-auto no-scrollbar pt-28 px-4 pb-20 max-w-lg mx-auto"
                        >
                            <h2 className="text-lg font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4 uppercase tracking-widest px-2">Keşfet Bento Grid</h2>
                            
                            <div className="grid grid-cols-2 gap-4">
                                
                                {/* Bento Big Card 1 */}
                                <div className="col-span-2 rounded-[2.5rem] bg-gradient-to-tr from-cyan-500/20 to-purple-500/10 border border-cyan-500/20 p-5 relative overflow-hidden flex flex-col justify-between h-48 shadow-lg shadow-cyan-950/20">
                                    <div className="absolute -inset-10 bg-cyan-400/5 blur-3xl rounded-full" />
                                    <div className="flex justify-between items-start z-10">
                                        <div className="bg-cyan-500/25 border border-cyan-400/30 rounded-full px-3 py-1 text-[10px] font-bold text-cyan-300">Öne Çıkan Seri</div>
                                        <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
                                    </div>
                                    <div className="z-10">
                                        <h3 className="text-lg font-black">Seriyi Sürdür, Hediye Kazan!</h3>
                                        <p className="text-xs text-white/50 mt-1">7. günde size özel 50 🪙 serbest bırakılacak.</p>
                                    </div>
                                </div>

                                {/* Bento Grid Items (Mock Posts) */}
                                {posts.map((post, idx) => (
                                    <div 
                                        key={post.id} 
                                        onClick={() => {
                                            setViewMode('aura');
                                            // Scroll transition mock
                                        }}
                                        className={cn(
                                            "rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] overflow-hidden cursor-pointer relative group flex flex-col justify-end transition-all shadow-md",
                                            idx === 1 ? "h-64" : "h-52" // Bento asymmetric height logic
                                        )}
                                    >
                                        <img src={post.media} className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                        
                                        <div className="p-4 z-20">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <img src={post.avatar} className="w-5 h-5 rounded-full object-cover" />
                                                <span className="text-[10px] font-bold text-white/80">@{post.username}</span>
                                            </div>
                                            <p className="text-[10px] text-white/60 line-clamp-2 leading-relaxed">{post.caption}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Bento Duel Card */}
                                <div className="col-span-2 rounded-[2.5rem] bg-gradient-to-tr from-fuchsia-500/20 to-purple-500/10 border border-fuchsia-500/20 p-5 relative overflow-hidden flex justify-between items-center h-28 shadow-lg shadow-fuchsia-950/20">
                                    <div>
                                        <h3 className="text-sm font-black text-fuchsia-300 uppercase tracking-widest">Düello Meydanı</h3>
                                        <p className="text-xs text-white/60 mt-1">Katıl, oy ver ve 15 🪙 cüzdanına gelsin!</p>
                                    </div>
                                    <button 
                                        onClick={() => setViewMode('aura')}
                                        className="bg-fuchsia-500 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg hover:bg-fuchsia-600 transition active:scale-95 shrink-0"
                                    >
                                        GİT ⚔️
                                    </button>
                                </div>

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* FLOATING COMMENTS DRAWER (APPLE STYLE) */}
            <AnimatePresence>
                {activeCommentPostId && (
                    <div className="fixed inset-0 z-[100] flex items-end">
                        {/* Backdrop Blur */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveCommentPostId(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Sliding Panel */}
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg mx-auto h-[60vh] bg-[#120f26]/95 border-t border-white/10 rounded-t-[2.5rem] flex flex-col overflow-hidden z-20 shadow-[0_-15px_30px_rgba(0,0,0,0.5)]"
                        >
                            {/* Panel Drag bar indicator */}
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-3 shrink-0" />

                            <div className="flex justify-between items-center px-6 py-2 border-b border-white/5">
                                <h3 className="text-sm font-black uppercase tracking-wider text-purple-300">Yorumlar</h3>
                                <button 
                                    onClick={() => setActiveCommentPostId(null)}
                                    className="p-1 text-white/40 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Comment list container */}
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar">
                                {posts.find(p => p.id === activeCommentPostId)?.commentsList.map(comment => (
                                    <div key={comment.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-300">
                                            {comment.user.substring(1, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-xs font-bold text-white/90">{comment.user}</span>
                                                <span className="text-[9px] text-white/30">Şimdi</span>
                                            </div>
                                            <p className="text-xs text-white/70 mt-1 leading-relaxed">{comment.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* AI Quick Replies */}
                            {activeCommentPostId && (
                                <div className="px-4 py-2.5 bg-[#0d0a1b]/60 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth shrink-0 items-center">
                                    <span className="text-[8px] font-black text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-1 rounded-lg tracking-wider uppercase shrink-0">
                                        ⚡ Hızlı Yanıt
                                    </span>
                                    {getAIQuickReplies(posts.find(p => p.id === activeCommentPostId)?.petType || "").map((replyText, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setPosts(prev => prev.map(p => {
                                                    if (p.id === activeCommentPostId) {
                                                        return {
                                                            ...p,
                                                            commentsCount: p.commentsCount + 1,
                                                            commentsList: [...p.commentsList, {
                                                                id: Date.now(),
                                                                user: "@sen",
                                                                text: replyText
                                                            }]
                                                        };
                                                    }
                                                    return p;
                                                }));
                                                triggerCoinReward(5);
                                            }}
                                            className="bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-full px-3 py-1.5 text-[9px] font-bold text-white/80 transition-all shrink-0"
                                        >
                                            {replyText}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Comment Input Field */}
                            <div className="p-4 bg-[#0d0a1b] border-t border-white/5 flex gap-2 items-center">
                                <input 
                                    type="text" 
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    placeholder="Bir yorum ekle..." 
                                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400/50"
                                />
                                <button 
                                    onClick={() => {
                                        if (!commentInput.trim()) return;
                                        setPosts(prev => prev.map(p => {
                                            if (p.id === activeCommentPostId) {
                                                return {
                                                    ...p,
                                                    commentsCount: p.commentsCount + 1,
                                                    commentsList: [...p.commentsList, {
                                                        id: Date.now(),
                                                        user: "@sen",
                                                        text: commentInput
                                                    }]
                                                };
                                            }
                                            return p;
                                        }));
                                        setCommentInput('');
                                    }}
                                    className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white active:scale-95 transition"
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* LEVEL-UP CELEBRATION MODAL */}
            <AnimatePresence>
                {levelUpModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            className="w-[340px] h-[400px] text-[#4a2c11] relative flex flex-col items-center justify-between p-7 select-none"
                        >
                            {/* Inline 3D Parchment Scroll SVG Background (0 KB Image weight, perfect vectors) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-2xl z-0" viewBox="0 0 340 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="scrollBg" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#cfa574" />
                                        <stop offset="8%" stopColor="#ebd6b8" />
                                        <stop offset="92%" stopColor="#ebd6b8" />
                                        <stop offset="100%" stopColor="#b48a53" />
                                    </linearGradient>
                                    <linearGradient id="scrollSide" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#653f1c" stopOpacity="0.25" />
                                        <stop offset="6%" stopColor="#ebd6b8" stopOpacity="0" />
                                        <stop offset="94%" stopColor="#ebd6b8" stopOpacity="0" />
                                        <stop offset="100%" stopColor="#653f1c" stopOpacity="0.3" />
                                    </linearGradient>
                                    <linearGradient id="waxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#a62c2c" />
                                        <stop offset="100%" stopColor="#4a0000" />
                                    </linearGradient>
                                    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
                                    </filter>
                                </defs>

                                {/* Hanging cords for Wax Seal */}
                                <path d="M 23 25 L 14 110 M 27 25 L 18 110" stroke="#3d2612" strokeWidth="1.5" opacity="0.85" />
                                {/* Hanging cord tails below seal */}
                                <path d="M 14 128 L 11 145 M 18 128 L 15 142" stroke="#3d2612" strokeWidth="1.5" opacity="0.85" />

                                {/* Main scroll body with physical vector rips */}
                                <path 
                                    d="M 30 20 
                                       Q 170 10 310 20 
                                       Q 306 50 310 80 L 317 85 L 309 90 Q 306 120 310 150 Q 307 180 310 210 L 318 215 L 309 220 Q 306 250 311 280 L 316 285 L 308 290 Q 312 320 310 375 
                                       Q 170 365 26 375 
                                       Q 25 350 26 320 L 14 315 L 22 310 Q 25 280 21 250 L 12 245 L 24 240 Q 26 210 22 180 Q 25 150 22 120 L 15 115 L 23 110 Q 26 80 25 50 
                                       Z" 
                                    fill="url(#scrollBg)" 
                                    stroke="#5c3e21" 
                                    strokeWidth="2.5" 
                                    strokeLinejoin="round"
                                />

                                {/* Dotted calligraphy inner frame */}
                                <path 
                                    d="M 38 30 
                                       Q 170 20 302 30 
                                       Q 298 50 302 80 L 307 85 L 301 90 Q 298 120 302 150 Q 299 180 302 210 L 308 215 L 301 220 Q 298 250 303 280 L 307 285 L 300 290 Q 304 320 302 365 
                                       Q 170 355 36 365 
                                       Q 35 340 36 320 L 26 315 L 32 310 Q 35 280 31 250 L 24 245 L 34 240 Q 36 210 32 180 Q 35 150 32 120 L 27 115 L 33 110 Q 36 80 35 50 
                                       Z" 
                                    fill="none" 
                                    stroke="#b48a53" 
                                    strokeWidth="1.2" 
                                    strokeDasharray="3 3" 
                                    opacity="0.8"
                                />

                                {/* Side shading gradient layer */}
                                <path 
                                    d="M 30 20 
                                       Q 170 10 310 20 
                                       Q 306 50 310 80 L 317 85 L 309 90 Q 306 120 310 150 Q 307 180 310 210 L 318 215 L 309 220 Q 306 250 311 280 L 316 285 L 308 290 Q 312 320 310 375 
                                       Q 170 365 26 375 
                                       Q 25 350 26 320 L 14 315 L 22 310 Q 25 280 21 250 L 12 245 L 24 240 Q 26 210 22 180 Q 25 150 22 120 L 15 115 L 23 110 Q 26 80 25 50 
                                       Z" 
                                    fill="url(#scrollSide)" 
                                    pointer-events="none"
                                />

                                {/* Top Wooden Rod Handles */}
                                <path d="M 22 15 Q 170 20 318 15" stroke="#3d2612" strokeWidth="6" strokeLinecap="round" />
                                <rect x="18" y="10" width="8" height="15" rx="3" fill="#25160a" stroke="#100803" strokeWidth="1" />
                                <rect x="314" y="10" width="8" height="15" rx="3" fill="#25160a" stroke="#100803" strokeWidth="1" />

                                {/* Top Left Spiral Paper End Profile */}
                                <ellipse cx="32" cy="20" rx="7" ry="10" fill="#d2b48c" stroke="#5c3e21" strokeWidth="1.5" />
                                <path d="M 32 25 A 4 6 0 1 1 35 20 A 2 4 0 1 1 32 21" stroke="#5c3e21" strokeWidth="1" fill="none" />

                                {/* Top paper roll overlap */}
                                <path d="M 28 20 Q 170 12 312 20 C 315 26 310 30 305 30 Q 170 22 35 30 C 30 30 25 26 28 20 Z" fill="#cfa574" stroke="#5c3e21" strokeWidth="1" />

                                {/* Bottom Scroll Cylinder Curl (Forward wrap) */}
                                <path d="M 20 368 Q 170 358 320 368 C 325 385 315 395 305 395 Q 170 385 35 395 C 25 395 15 385 20 368 Z" fill="url(#scrollBg)" stroke="#5c3e21" strokeWidth="2.2" />

                                {/* Bottom Left Concentric Spiral paper roll ends */}
                                <ellipse cx="25" cy="381" rx="8" ry="12" fill="#d2b48c" stroke="#5c3e21" strokeWidth="1.5" />
                                <path d="M 25 387 A 5 7 0 1 1 29 381 A 3 5 0 1 1 25 383" stroke="#5c3e21" strokeWidth="1.2" fill="none" />

                                {/* Wax Seal stamp */}
                                <circle cx="16" cy="115" r="13" fill="url(#waxGradient)" stroke="#4a0000" strokeWidth="1.5" filter="url(#dropShadow)" />
                                <circle cx="16" cy="115" r="9" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.4" />
                                <text x="16" y="119" fill="#f59e0b" fontSize="11" fontWeight="900" fontFamily="serif" textAnchor="middle" opacity="0.85">M</text>
                            </svg>

                            {/* Relative z-10 Content overlay */}
                            <div className="relative z-10 w-full h-full flex flex-col items-center justify-between pt-6 pb-9 px-6 gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d97706] to-[#92400e] flex items-center justify-center shadow-md border-2 border-[#8c6239] animate-bounce mt-2 shrink-0">
                                    <Trophy className="w-6 h-6 text-amber-100" />
                                </div>

                                <div className="text-center">
                                    <span className="text-[9px] font-black tracking-widest text-[#8c6239] uppercase bg-[#8c6239]/10 px-2.5 py-0.5 rounded-full border border-[#8c6239]/20">SEVİYE ATLADIN! 🎉</span>
                                    <h2 className="text-xl font-black mt-1 text-[#3e2715] tracking-tight font-serif">Tebrikler Dostum!</h2>
                                    <p className="text-[10px] text-[#3e2715]/80 font-medium font-serif italic leading-none mt-0.5">Evcil hayvanın başarıyla seviye atladı!</p>
                                </div>

                                {/* Unlocked Level and Title */}
                                <div className="w-full bg-[#f0e1cb]/50 border border-[#b48a53]/25 rounded-lg p-2.5 flex flex-col items-center gap-0.5 shadow-inner">
                                    <span className="text-[7px] font-black text-[#8c6239]/70 tracking-wider uppercase">Yeni Kazanılan Unvan</span>
                                    <span className="text-xs font-black text-[#3e2715] tracking-wide">{getLevelTitle(level)}</span>
                                    <span className="text-[9px] font-black text-amber-100 bg-[#92400e] border border-[#92400e]/30 px-1.5 py-0.5 rounded mt-1 shadow-sm">
                                        Seviye {level}
                                    </span>
                                </div>

                                {/* Rewards summary */}
                                <div className="text-center flex flex-col items-center gap-0.5 shrink-0">
                                    <span className="text-[7px] font-black text-[#3e2715]/65 tracking-wider uppercase">Seviye Ödülü</span>
                                    <div className="flex items-center gap-1 bg-[#8c6239]/10 border border-[#8c6239]/20 px-2.5 py-0.5 rounded-full text-xs font-black text-[#3e2715]">
                                        <span>+100 Jeton</span>
                                        <span>🪙</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setLevelUpModalOpen(false)}
                                    className="w-full py-2 rounded-lg bg-[#653f1c] hover:bg-[#4d3014] text-[#f5e6d3] font-black text-[10px] uppercase tracking-wider transition active:scale-95 shadow-md shadow-amber-950/20 cursor-pointer"
                                >
                                    Serüvene Devam Et 🏕️
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AURA MAĞAZASI MODAL */}
            <AnimatePresence>
                {isStoreOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-gradient-to-b from-[#181124] to-[#0a0512] border border-amber-500/20 rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative flex flex-col gap-5 overflow-hidden"
                        >
                            {/* Glowing header accents */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#f59e0b]/50 to-transparent" />
                            
                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-amber-400" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Aura Mağazası</h3>
                                </div>
                                <button 
                                    onClick={() => setIsStoreOpen(false)}
                                    className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white transition active:scale-90"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Player coin balance */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex justify-between items-center shadow-inner">
                                <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-wider">Cüzdan Bakiyen:</span>
                                <div className="flex items-center gap-1.5 font-black text-sm text-amber-300">
                                    <span>{coinBalance}</span>
                                    <span>🪙</span>
                                </div>
                            </div>

                            {/* Effects List */}
                            <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
                                {STORE_EFFECTS.map(effect => {
                                    const isPurchased = purchasedEffects.includes(effect.id);
                                    const isActive = selectedEffect === effect.id;
                                    return (
                                        <div 
                                            key={effect.id}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-2xl border transition-all",
                                                isActive 
                                                    ? "bg-amber-500/10 border-amber-500/40 shadow-inner" 
                                                    : "bg-white/5 border-white/10 hover:bg-white/[0.08]"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl select-none">{effect.emoji}</span>
                                                <div>
                                                    <h4 className="text-xs font-black text-white">{effect.name}</h4>
                                                    <p className="text-[8px] text-white/50 font-bold uppercase tracking-widest mt-0.5">
                                                        {isPurchased ? "AURA EFEKTİ" : `Maliyet: ${effect.cost} 🪙`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                {isPurchased ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedEffect(effect.id);
                                                            if (typeof window !== 'undefined') {
                                                                localStorage.setItem('moffi_selected_effect', effect.id);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "text-[8px] font-black uppercase px-3 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer",
                                                            isActive 
                                                                ? "bg-amber-500 text-black border-amber-400 shadow-md"
                                                                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                                                        )}
                                                    >
                                                        {isActive ? "SEÇİLDİ" : "SEÇ"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            if (coinBalance >= effect.cost) {
                                                                setCoinBalance(prev => prev - effect.cost);
                                                                const updated = [...purchasedEffects, effect.id];
                                                                setPurchasedEffects(updated);
                                                                setSelectedEffect(effect.id);
                                                                if (typeof window !== 'undefined') {
                                                                    localStorage.setItem('moffi_purchased_effects', JSON.stringify(updated));
                                                                    localStorage.setItem('moffi_selected_effect', effect.id);
                                                                }
                                                                synthRef.current?.playWin();
                                                            } else {
                                                                alert("Yetersiz Moffi Coin! 🪙");
                                                            }
                                                        }}
                                                        disabled={coinBalance < effect.cost}
                                                        className={cn(
                                                            "text-[8px] font-black uppercase px-3 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer",
                                                            coinBalance >= effect.cost
                                                                ? "bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400 text-white shadow-md"
                                                                : "bg-[#1e293b]/50 border-slate-800 text-slate-500 cursor-not-allowed"
                                                        )}
                                                    >
                                                        AL
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SERÜVEN GÜNLÜĞÜ MODAL (PARŞÖMEN) */}
            <AnimatePresence>
                {isChronicleOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-[#f2e2ca] border-[4px] border-[#8c6239] rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative flex flex-col gap-4 overflow-hidden text-[#3e2715] font-serif"
                        >
                            {/* Parchment background borders and lines */}
                            <div className="absolute inset-0 bg-[radial-gradient(#f9f1e3_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
                            
                            {/* Header */}
                            <div className="flex justify-between items-center border-b border-[#8c6239]/30 pb-3 relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">📜</span>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#3e2715]">Serüven Günlüğü</h3>
                                </div>
                                <button 
                                    onClick={() => setIsChronicleOpen(false)}
                                    className="w-7 h-7 rounded-full bg-[#8c6239]/10 border border-[#8c6239]/30 flex items-center justify-center hover:bg-[#8c6239]/20 text-[#3e2715] transition active:scale-90"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Chronicle list */}
                            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1 relative z-10 py-1">
                                {chronicles.length === 0 ? (
                                    <div className="text-center py-10 flex flex-col items-center gap-2">
                                        <span className="text-3xl opacity-40">📭</span>
                                        <p className="text-[10px] font-bold text-[#3e2715]/50 uppercase tracking-widest">Henüz hiçbir günlük kaydı yok.</p>
                                        <p className="text-[9px] text-[#3e2715]/40 leading-relaxed italic px-6">Harita üzerindeki serüvenleri tamamlayarak evcil hayvanının günlük maceralarını burada biriktirebilirsin!</p>
                                    </div>
                                ) : (
                                    chronicles.map((entry, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="flex gap-2.5 items-start bg-[#eeddc3] border border-[#8c6239]/25 rounded-2xl p-3 shadow-sm"
                                        >
                                            <span className="text-base select-none mt-0.5">🐾</span>
                                            <div className="flex-1">
                                                <p className="text-[10px] leading-relaxed font-medium font-serif italic text-[#3e2715]/95">{entry}</p>
                                                <span className="text-[6.5px] font-black text-[#8c6239]/65 tracking-wider uppercase mt-1 block">KAYIT #{chronicles.length - idx}</span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HİKAYE GİRİŞ MODAL (ACT INTRO) */}
            <AnimatePresence>
                {isActIntroOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="w-full max-w-sm bg-[#eeddc3] border-[6px] border-[#8c6239] rounded-[2.5rem] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95)] relative flex flex-col gap-5 overflow-hidden text-[#3e2715] font-serif"
                        >
                            {/* Parchment background borders and lines */}
                            <div className="absolute inset-0 bg-[radial-gradient(#f9f1e3_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
                            <div className="absolute inset-1 border-2 border-[#8c6239]/20 rounded-[2.2rem] pointer-events-none" />
                            
                            <div className="text-center relative z-10 pt-4">
                                <span className="text-4xl block animate-bounce mb-3">📜</span>
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#8c6239]">
                                    {CHAPTER_STORIES[activeChapter]?.title}
                                </h3>
                                {ngLoop > 1 && (
                                    <span className="inline-block text-[8px] font-black text-amber-100 bg-[#92400e] px-2 py-0.5 rounded-full mt-1.5 uppercase tracking-widest">
                                        Döngü #{ngLoop} (New Game+)
                                    </span>
                                )}
                            </div>

                            <p className="text-[10.5px] leading-relaxed text-[#3e2715]/90 font-medium italic text-center px-4 font-serif relative z-10 py-1 border-y border-[#8c6239]/15">
                                "{CHAPTER_STORIES[activeChapter]?.intro}"
                            </p>

                            <button 
                                onClick={() => {
                                    setIsActIntroOpen(false);
                                    synthRef.current?.playWin();
                                }}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 border border-amber-600 text-white font-black text-[10px] uppercase tracking-wider transition active:scale-95 shadow-md shadow-amber-950/40 cursor-pointer relative z-10 text-center"
                            >
                                Macerayı Başlat 🏕️
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HİKAYE KAPANIŞ MODAL (ACT OUTRO) */}
            <AnimatePresence>
                {isActOutroOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="w-full max-w-sm bg-[#eeddc3] border-[6px] border-[#8c6239] rounded-[2.5rem] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95)] relative flex flex-col gap-5 overflow-hidden text-[#3e2715] font-serif"
                        >
                            {/* Parchment background borders and lines */}
                            <div className="absolute inset-0 bg-[radial-gradient(#f9f1e3_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
                            <div className="absolute inset-1 border-2 border-[#8c6239]/20 rounded-[2.2rem] pointer-events-none" />
                            
                            <div className="text-center relative z-10 pt-4">
                                <span className="text-4xl block animate-bounce mb-3">🔮</span>
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#8c6239]">
                                    {activeChapter === 4 ? "Büyük Kapanış (Tılsım Tamamlandı)" : "Perde Sonu Kapanış"}
                                </h3>
                            </div>

                            <p className="text-[10.5px] leading-relaxed text-[#3e2715]/90 font-medium italic text-center px-4 font-serif relative z-10 py-1 border-y border-[#8c6239]/15">
                                "{CHAPTER_STORIES[activeChapter]?.outro}"
                            </p>

                            <button 
                                onClick={() => {
                                    if (activeChapter < 4) {
                                        // Advance to next chapter
                                        triggerConfetti();
                                        setCoinBalance(prev => prev + 150);
                                        setActiveChapter(prev => prev + 1);
                                        setStreak(0);
                                        setIsChestOpened(false);
                                        setIsActOutroOpen(false);
                                    } else {
                                        // Trigger New Game+ loop!
                                        triggerConfetti();
                                        const nextLoop = ngLoop + 1;
                                        setNgLoop(nextLoop);
                                        if (typeof window !== 'undefined') {
                                            localStorage.setItem('moffi_adventure_ng_loop', nextLoop.toString());
                                        }
                                        setActiveChapter(1);
                                        setStreak(0);
                                        setIsChestOpened(false);
                                        setIsActOutroOpen(false);
                                        
                                        // Reset read intro chapter to trigger new act intro scroll
                                        setLastReadIntroChapter(0);
                                        if (typeof window !== 'undefined') {
                                            localStorage.removeItem('moffi_last_read_intro');
                                        }
                                        
                                        // Add entry to chronicles
                                        setChronicles(prev => [
                                            `DÖNGÜ #${nextLoop} BAŞLADI! 🔮 Karanlık güçler daha güçlü hedeflerle ormanı tekrar kuşattı...`,
                                            ...prev
                                        ]);
                                    }
                                    synthRef.current?.playWin();
                                }}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 border border-emerald-600 text-white font-black text-[10px] uppercase tracking-wider transition active:scale-95 shadow-md shadow-emerald-950/40 cursor-pointer relative z-10 text-center"
                            >
                                {activeChapter === 4 ? "Tılsımı Birleştir ve NG+ Başlat 🔄" : `Sonraki Bölüme İlerle 🗺️`}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
