"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { usePet } from '@/context/PetContext';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface PetSwitcherProps {
    className?: string;
    onAddPet?: () => void;
}

export function PetSwitcher({ className, onAddPet }: PetSwitcherProps) {
    const { pets, activePet, switchPet } = usePet();

    return (
        <div className={cn("flex items-center gap-3 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full w-fit", className)}>
            <div className="flex -space-x-1 px-1">
                {pets.map((pet) => {
                    const isActive = activePet?.id === pet.id;
                    return (
                        <motion.button
                            key={pet.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                switchPet(String(pet.id));
                            }}
                            whileTap={{ scale: 0.9 }}
                            className="relative group outline-none"
                        >
                            <div className={cn(
                                "relative w-10 h-10 rounded-full border-2 transition-all duration-500 overflow-hidden",
                                isActive ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-110 z-10" : "border-transparent opacity-40 group-hover:opacity-100"
                            )}>
                                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                                {isActive && (
                                    <motion.div 
                                        layoutId="active-glow"
                                        className="absolute inset-0 bg-emerald-500/10 pointer-events-none" 
                                    />
                                )}
                            </div>
                            
                            {/* Hover Tooltip (Optional but Premium) */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100]">
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">{pet.name}</span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {onAddPet && (
                <>
                    <div className="w-[1px] h-6 bg-white/10 mx-1" />
                    <button 
                        onClick={onAddPet}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:bg-white/20 hover:text-white transition-all active:scale-90"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </>
            )}
        </div>
    );
}
