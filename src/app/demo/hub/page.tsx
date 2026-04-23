'use client';

import React, { useState } from 'react';
import { SocialPostCard } from '@/components/community/SocialPostCard';
import { CommandCenterDemo } from '@/components/hub/CommandCenterDemo';
import { Plus, Search, Heart, MessageCircle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HubDemoPage() {
    const [isHubOpen, setIsHubOpen] = useState(false);

    const mockPosts = [
        {
            user: { name: 'Milo & Uveys', avatar: '', location: 'Beşiktaş/Sahil' },
            content: { 
                image: '🐕', 
                caption: 'Bugün harika bir yürüyüş yaptık! Sahil havası Milo\'ya çok iyi geldi. 🌊', 
                hashtags: ['doglife', 'walkies', 'moffi'],
                likes: 128,
                comments: 12
            }
        },
        {
            user: { name: 'Luna the Cat', avatar: '', location: 'Nişantaşı' },
            content: { 
                image: '🐈', 
                caption: 'Pencere kenarında güneşlenmek en büyük hobim... ☀️', 
                hashtags: ['catsofmoffi', 'chill'],
                likes: 84,
                comments: 5
            }
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            {/* Mobile Frame Simulation */}
            <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header Simulation */}
                <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center justify-between">
                    <h1 className="text-2xl font-black italic tracking-tighter text-[#5B4D9D]">MOFFI</h1>
                    <div className="flex gap-4">
                        <Search className="text-gray-400" size={24} />
                        <Heart className="text-gray-400" size={24} />
                    </div>
                </div>

                {/* Feed Simulation */}
                <div className="flex-1 overflow-y-auto pb-24">
                    {/* Welcome Banner */}
                    <div className="p-6 bg-gradient-to-br from-[#5B4D9D] to-[#8B5CF6] text-white">
                        <h2 className="text-2xl font-black italic tracking-tight">KOMUTA MERKEZİ DEMOSU</h2>
                        <p className="text-xs font-medium opacity-80 mt-2">Aşağıdaki Artı ikonuna basarak yeni "Command Center" vizyonunu deneyimleyin.</p>
                    </div>

                    {mockPosts.map((post, idx) => (
                        <SocialPostCard key={idx} {...(post as any)} />
                    ))}

                    <div className="p-10 text-center text-gray-300">
                        <p className="text-xs font-black uppercase tracking-[0.3em]">Daha fazla içerik için kaydırın</p>
                    </div>
                </div>

                {/* Floating Plus Button (The Trigger) */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
                    <motion.button
                        onClick={() => setIsHubOpen(true)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-16 h-16 bg-[#5B4D9D] rounded-full flex items-center justify-center text-white shadow-[0_10px_40px_rgba(91,77,157,0.5)] border-4 border-white"
                    >
                        <Plus size={32} />
                    </motion.button>
                </div>

                {/* Bottom Navigation Simulation */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 px-8 flex items-center justify-between pointer-events-none opacity-40">
                    <div className="w-8 h-8 rounded-lg bg-gray-200" />
                    <div className="w-8 h-8 rounded-lg bg-gray-200" />
                    <div className="w-10 h-10" /> {/* Spacer for Plus */}
                    <div className="w-8 h-8 rounded-lg bg-gray-200" />
                    <div className="w-8 h-8 rounded-lg bg-gray-200" />
                </div>

                {/* COMMAND CENTER OVERLAY */}
                <CommandCenterDemo isOpen={isHubOpen} onClose={() => setIsHubOpen(false)} />

            </div>
        </div>
    );
}
