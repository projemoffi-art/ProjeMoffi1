"use client";

import { useSocial } from "@/context/SocialContext";
import { Sparkles, MessageCircle, Heart } from "lucide-react";

export function HeroSection() {
    const { currentUser } = useSocial();
    const firstName = currentUser.name.split(' ')[0];

    return (
        <div className="relative w-full pt-20 pb-10 px-6 flex flex-col items-center justify-center overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute top-0 w-full h-full bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/20 dark:to-transparent pointer-events-none transition-colors duration-500" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-10 -left-10 w-40 h-40 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-2xl" />

            {/* 3D-like Avatar Container */}
            <div className="relative group cursor-pointer z-10">
                {/* Ethereal Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

                {/* Avatar Ring */}
                <div className="w-44 h-44 rounded-full p-1.5 bg-gradient-to-tr from-white to-indigo-50 dark:from-slate-700 dark:to-indigo-900 shadow-2xl relative transition-all duration-500">
                    <div className="w-full h-full rounded-full border-[4px] border-white dark:border-slate-800 overflow-hidden relative bg-card dark:bg-slate-800 transition-colors">
                        <img
                            src={currentUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Moffi"}
                            alt="Pet Avatar"
                            className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                        />
                        {/* Live Status Indicator */}
                        <div className="absolute bottom-3 right-8 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 animate-bounce" />
                    </div>

                    {/* Floating Emojis (Decoration) */}
                    <div className="absolute -right-2 top-10 bg-card dark:bg-slate-700 p-2 rounded-full shadow-lg rotate-12 animate-[bounce_3s_infinite] transition-colors">
                        <Heart className="w-4 h-4 text-red-500 fill-current" />
                    </div>
                    <div className="absolute -left-2 bottom-8 bg-card dark:bg-slate-700 p-2 rounded-full shadow-lg -rotate-12 animate-[bounce_4s_infinite] transition-colors">
                        <span className="text-sm">🦴</span>
                    </div>
                </div>
            </div>

            {/* Pet Name & Status */}
            <div className="mt-4 text-center relative z-10">
                <h1 className="text-2xl font-black text-foreground dark:text-white font-poppins transition-colors">{currentUser.name}</h1>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Golden Retriever • Mutlu 😊</p>
            </div>

        </div>
    );
}
