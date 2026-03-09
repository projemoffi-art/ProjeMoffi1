"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Contrast, Droplet, Palette, Thermometer, Maximize, Zap } from "lucide-react";
import { ProSlider } from "./Slider";
import { usePhotoEditor, Adjustments } from "@/hooks/usePhotoEditor";

interface InspectorPanelProps {
    editor: ReturnType<typeof usePhotoEditor>;
}

export function InspectorPanel({ editor }: InspectorPanelProps) {
    const { state, setAdjustment } = editor;

    // Categorized adjustments
    const LIGHT = [
        { key: 'exposure', label: 'Pozlama', icon: Sun, min: -100, max: 100 },
        { key: 'brightness', label: 'Parlaklık', icon: Zap, min: -100, max: 100 },
        { key: 'contrast', label: 'Kontrast', icon: Contrast, min: -100, max: 100 },
        { key: 'highlights', label: 'Parlak Alanlar', icon: Maximize, min: -100, max: 100 },
        { key: 'shadows', label: 'Gölgeler', icon: Moon, min: -100, max: 100 },
    ];

    const COLOR = [
        { key: 'saturation', label: 'Doygunluk', icon: Droplet, min: -100, max: 100 },
        { key: 'warmth', label: 'Sıcaklık', icon: Thermometer, min: -100, max: 100 },
        { key: 'tint', label: 'Ton', icon: Palette, min: -100, max: 100 },
    ];

    return (
        <div className="w-80 h-full flex flex-col bg-[#1A1A1A]/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto custom-scrollbar">

            {/* Header */}
            <div className="p-4 border-b border-white/10 sticky top-0 bg-[#1A1A1A]/95 z-10 backdrop-blur">
                <h3 className="text-white font-bold text-sm tracking-wide uppercase opacity-70">Ayarlar</h3>
            </div>

            {/* LIGHT SECTION */}
            <div className="p-4 space-y-1">
                <div className="text-xs font-bold text-[#5B4D9D] uppercase mb-3 px-2">Işık</div>
                {LIGHT.map(item => (
                    <ProSlider
                        key={item.key}
                        label={item.label}
                        icon={item.icon}
                        value={state.adjustments[item.key as keyof Adjustments]}
                        min={item.min}
                        max={item.max}
                        onChange={(v) => setAdjustment(item.key as keyof Adjustments, v)}
                    />
                ))}
            </div>

            <div className="h-[1px] bg-white/5 mx-4 my-2" />

            {/* COLOR SECTION */}
            <div className="p-4 space-y-1">
                <div className="text-xs font-bold text-[#5B4D9D] uppercase mb-3 px-2">Renk</div>
                {COLOR.map(item => (
                    <ProSlider
                        key={item.key}
                        label={item.label}
                        icon={item.icon}
                        value={state.adjustments[item.key as keyof Adjustments]}
                        min={item.min}
                        max={item.max}
                        onChange={(v) => setAdjustment(item.key as keyof Adjustments, v)}
                    />
                ))}
            </div>

        </div>
    );
}
