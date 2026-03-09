"use client";

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Sparkles, ChevronRight, Menu, PawPrint, Gamepad2, Activity, Share2, Layers, Palette, ShoppingBag, Hexagon, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 1. STATE BAR (Apple Watch Style - Minimal)
const StateBar = () => (
    <div className="fixed top-0 left-0 w-full z-50 flex justify-between items-start px-6 py-4 mix-blend-difference text-white">
        <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-lg">Moffi</span>
                <span className="w-1 h-1 bg-white/50 rounded-full" />
                <span className="text-sm font-medium opacity-80">Studio</span>
            </div>
            {/* Menu Trigger (Apple Drawer Style) */}
            <button className="mt-1 -ml-1 p-1 opacity-80 hover:opacity-100 transition-opacity">
                <Menu className="w-6 h-6" strokeWidth={2} />
            </button>
        </div>
    </div>
);

// 2. STUDIO HERO (The "One Thing" - 65% height)
const StudioHero = () => {
    const router = useRouter();
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <section className="relative h-[65vh] w-full overflow-hidden flex flex-col items-center justify-center text-center px-6">

            {/* Parallax Background */}
            <motion.div style={{ y: y1 }} className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=1400"
                    className="w-full h-full object-cover opacity-90 dark:opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F7] dark:from-black via-transparent to-black/10" />
            </motion.div>

            {/* Floating Glass Interface (The "Studio" Preview) */}
            <motion.div
                style={{ opacity }}
                className="relative z-10 w-full max-w-sm aspect-[4/5] bg-white/10 dark:bg-black/20 backdrop-blur-2xl rounded-[3rem] border border-white/40 shadow-2xl flex flex-col items-center justify-between p-6 group cursor-pointer hover:scale-[1.02] transition-transform duration-500"
                onClick={() => router.push('/studio')}
            >
                {/* Floating Elements inside Glass - Fixed with Palette Icon */}
                <div className="absolute top-10 right-[-20px] w-16 h-16 bg-white/30 backdrop-blur-md rounded-2xl shadow-lg animate-bounce duration-[3000ms] flex items-center justify-center">
                    <Palette className="w-8 h-8 text-white drop-shadow-md" />
                </div>
                <div className="absolute bottom-20 left-[-15px] w-12 h-12 bg-black/20 backdrop-blur-md rounded-full shadow-lg animate-pulse" />

                {/* Content */}
                <div className="mt-8">
                    <span className="text-white/80 font-bold tracking-widest text-xs uppercase mb-2 block">Yeni Koleksiyon</span>
                    <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-xl tracking-tighter">
                        ICONIC
                        <br />
                        STYLE
                    </h1>
                </div>

                <div className="w-full space-y-3">
                    <p className="text-white/90 text-sm font-medium mb-3 leading-relaxed">
                        Sıradan olma. Moffi Studio ile kendi tarzını yarat.
                    </p>
                    <button
                        onClick={(e) => { e.stopPropagation(); router.push('/studio'); }}
                        className="w-full h-14 bg-white text-black rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        Tasarla
                    </button>
                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); router.push('/studio-sandbox-3'); }}
                            className="w-full h-11 bg-white/10 backdrop-blur-md text-white/90 border border-white/20 rounded-full font-bold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Palette className="w-4 h-4 text-purple-400" />
                            Stüdyo Demo
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); router.push('/community'); }}
                            className="w-full h-11 bg-black/60 backdrop-blur-md text-white border border-white/10 rounded-full font-bold text-sm hover:bg-black/80 transition-all flex items-center justify-center gap-2 shadow-lg mt-1"
                        >
                            <Users className="w-4 h-4 text-cyan-400" />
                            Yeni Topluluk Demo
                        </button>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

// 3. PRIORITY CARDS (Hierarchy: Walk > Game > Vet)
const PriorityGrid = () => {
    const router = useRouter();

    return (
        <section className="px-6 -mt-2 relative z-20 pb-24 space-y-4">

            {/* ROW 1: WALK (High Importance) - Vibrant Green & Shadow - WIRED TO /walk */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={() => router.push('/walk')}
                className="h-24 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-white/10 p-2 flex items-center gap-4 shadow-xl shadow-green-900/5 hover:shadow-2xl hover:shadow-green-500/10 transition-all cursor-pointer group"
            >
                <div className="h-full aspect-square relative bg-gradient-to-br from-[#4ADE80] to-[#16A34A] rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-green-500/40 group-hover:scale-95 transition-transform overflow-hidden">
                    {/* Subtle Inner Glow/Shine (Apple Glass Feel) */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                    <PawPrint className="w-10 h-10 relative z-10 drop-shadow-md text-white" strokeWidth={2} />
                    {/* Depth Shadow inside icon */}
                    <PawPrint className="w-10 h-10 absolute z-0 text-green-900 opacity-20 translate-y-1 translate-x-1 blur-[1px]" strokeWidth={2} />
                </div>
                <div className="flex-1 pr-6">
                    <h3 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white mb-0">Yürüyüş</h3>
                    <p className="text-xs text-gray-400 font-light tracking-wide">Dostun için her şey hazır.</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 opacity-30" />
                </div>
            </motion.div>

            {/* ROW 2: GAME, VET & PETSHOP (Compact Split) */}
            <div className="grid grid-cols-3 gap-3">
                {/* Game - Arctic White/Ice - WIRED TO /game */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => router.push('/game')}
                    className="h-28 relative bg-[#F8FAFC] rounded-[1.8rem] p-4 flex flex-col justify-between overflow-hidden cursor-pointer group shadow-lg shadow-slate-200/50 border border-white/60"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] opacity-100" />
                    <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/40 blur-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent opacity-50 mix-blend-overlay" />

                    <div className="relative z-10 flex justify-between items-start">
                        <Gamepad2 className="w-5 h-5 text-slate-600 drop-shadow-sm" />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-slate-800 mb-0 leading-none">Oyun</h3>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-1">Başla.</p>
                    </div>
                </motion.div>

                {/* Vet - Arctic White/Ice - WIRED TO /vet */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => router.push('/vet')}
                    className="h-28 relative bg-[#F8FAFC] rounded-[1.8rem] p-4 flex flex-col justify-between overflow-hidden cursor-pointer group shadow-lg shadow-slate-200/50 border border-white/60"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] opacity-100" />
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/40 blur-2xl pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent opacity-50 mix-blend-overlay" />

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="p-1.5 bg-white/40 backdrop-blur-md rounded-lg text-slate-600 shadow-sm border border-white/20">
                            <Activity className="w-4 h-4 text-slate-700" strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-slate-800 mb-0 leading-none">Veteriner</h3>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-1">Uzmanlara ulaş.</p>
                    </div>
                </motion.div>

                {/* PetShop - Arctic White/Ice - WIRED TO /petshop */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => router.push('/petshop')}
                    className="h-28 relative bg-[#F8FAFC] rounded-[1.8rem] p-4 flex flex-col justify-between overflow-hidden cursor-pointer group shadow-lg shadow-slate-200/50 border border-white/60"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] opacity-100" />
                    <div className="absolute -left-6 -top-6 w-32 h-32 rounded-full bg-orange-200/30 blur-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent opacity-50 mix-blend-overlay" />

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="p-1.5 bg-white/40 backdrop-blur-md rounded-lg text-orange-600 shadow-sm border border-white/20">
                            <ShoppingBag className="w-4 h-4 text-orange-700" strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-slate-800 mb-0 leading-none">PetShop</h3>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-1">Alışveriş yap.</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};



export default function StudioFirstPage() {
    return (
        <main className="min-h-screen bg-[#F5F5F7] dark:bg-black font-sans selection:bg-purple-500/30">
            <StateBar />
            <StudioHero />
            <PriorityGrid />
        </main>
    );
}
