"use client";

import { motion } from "framer-motion";
import { Palette, PlaySquare, Upload, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const GlassCard = ({ children, className }: any) => (
    <div className={cn(
        "relative overflow-hidden bg-[#0A0A0E]/80 backdrop-blur-3xl border border-card-border rounded-[2.5rem] shadow-2xl",
        className
    )}>
        {children}
    </div>
);

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface StudioAsset {
    id: string;
    name: string;
    type: string;
    uses: number;
    is_prime: boolean;
}

export default function StudioPage() {
    const [assets, setAssets] = useState<StudioAsset[]>([]);
    
    useEffect(() => {
        async function loadAssets() {
            const { data } = await supabase.from('studio_assets').select('*').order('created_at', { ascending: false });
            if (data) setAssets(data);
        }
        loadAssets();
    }, []);
    return (
        <div className="space-y-12 pb-32 max-w-7xl mx-auto px-4 lg:px-0">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="relative flex flex-col gap-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                        <Palette className="w-8 h-8 text-fuchsia-400" />
                    </div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-none"
                    >
                        Moffi Studio
                    </motion.h1>
                </div>
                <button className="px-8 py-4 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-3">
                    <Upload className="w-5 h-5" />
                    Yeni Varlık Yükle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {assets.map((asset, i) => (
                    <GlassCard key={asset.id} className="p-6 group cursor-pointer hover:border-fuchsia-500/30 transition-colors">
                        <div className="aspect-square rounded-[1.5rem] bg-white/5 mb-6 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors relative overflow-hidden">
                            <PlaySquare className="w-8 h-8 text-white/20" />
                            {asset.is_prime && (
                                <div className="absolute top-3 right-3 bg-fuchsia-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1">
                                    <Star className="w-3 h-3" fill="currentColor" /> Prime
                                </div>
                            )}
                        </div>
                        <h4 className="text-lg font-black text-white mb-1">{asset.name}</h4>
                        <div className="flex items-center justify-between">
                            <p className="text-white/40 text-xs uppercase tracking-widest">{asset.type}</p>
                            <p className="text-white/60 text-xs font-mono">
                                {asset.uses > 1000 ? (asset.uses / 1000).toFixed(1) + 'K' : asset.uses} uses
                            </p>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
