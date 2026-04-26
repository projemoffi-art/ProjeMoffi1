"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export const GlobalAuraBackground = React.memo(function GlobalAuraBackground() {
    const { user } = useAuth();
    
    // Safely get aura settings
    const auraStyle = user?.settings?.appearance?.auraStyle || 'minimal';
    const auraIntensity = user?.settings?.appearance?.auraIntensity || 100;
    const accentColor = user?.settings?.appearance?.accentColor || 'cyan';

    const renderAuraCircles = useMemo(() => {
        const baseOpacity = (auraIntensity / 100);
        
        const colors: Record<string, string> = {
            cyan: '#06b6d4',
            purple: '#a855f7',
            orange: '#f97316',
            emerald: '#10b981',
            rose: '#fb7185',
            violet: '#8b5cf6',
            default: '#6366f1',
            midnight: '#1e293b',
            ocean: '#0ea5e9'
        };

        const activeColor = colors[accentColor] || colors.default;

        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none transform-gpu">
                {/* Style-Specific Foundation Layer */}
                <div className={cn(
                    "absolute inset-0 transition-opacity duration-1000",
                    auraStyle === 'neon' ? "opacity-20" : "opacity-0"
                )}>
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
                </div>

                {/* Layer 1: The Core Nebula - Simplified & Lighter Blur */}
                <motion.div 
                    animate={{ 
                        opacity: [baseOpacity * 0.15, baseOpacity * 0.25, baseOpacity * 0.15],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] rounded-full blur-[60px] transform-gpu"
                    style={{ 
                        background: `radial-gradient(circle at center, ${activeColor}33 0%, transparent 70%)`,
                        willChange: 'transform, opacity'
                    }}
                />

                {/* Style-Specific Overlays - Static for Performance */}
                {auraStyle === 'metal' && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5 mix-blend-overlay" />
                )}

                {auraStyle === 'glass' && (
                    <div className="absolute inset-0 backdrop-blur-[2px] bg-white/[0.01]" />
                )}
            </div>
        );
    }, [accentColor, auraIntensity, auraStyle]);

    return (
        <div className={cn(
            "fixed inset-0 z-[-1] transition-colors duration-1000 transform-gpu bg-background",
        )}>
            {/* Global Deep Shadow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />
            
            <div className="absolute inset-0">
                {renderAuraCircles}
            </div>

            {/* Micro-Grain for Texture - Lower opacity */}
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
        </div>
    );
});


