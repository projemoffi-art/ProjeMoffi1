"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import * as SliderPrimitive from "@radix-ui/react-slider";

interface ProSliderProps {
    value: number;
    min?: number;
    max?: number;
    onChange: (val: number) => void;
    label: string;
    icon?: React.ElementType;
}

export function ProSlider({ value, min = -100, max = 100, onChange, label, icon: Icon }: ProSliderProps) {
    return (
        <div className="group space-y-3 p-3 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="flex items-center justify-between text-xs font-medium text-gray-400">
                <div className="flex items-center gap-2 group-hover:text-white transition-colors">
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{label}</span>
                </div>
                <span className={cn("font-mono tabular-nums", value !== 0 ? "text-[#5B4D9D]" : "")}>
                    {value > 0 ? '+' : ''}{value}
                </span>
            </div>

            <SliderPrimitive.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[value]}
                max={max}
                min={min}
                step={1}
                onValueChange={(vals) => onChange(vals[0])}
            >
                <SliderPrimitive.Track className="bg-gray-700 relative grow rounded-full h-[2px] overflow-hidden">
                    {/* Fill */}
                    <SliderPrimitive.Range className="absolute bg-[#5B4D9D] h-full" />

                    {/* Center Marker (if min is negative) */}
                    {min < 0 && (
                        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/20" />
                    )}
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb
                    className="block w-4 h-4 bg-white shadow-lg rounded-full border-2 border-[#5B4D9D] hover:scale-125 focus:scale-125 transition-transform outline-none cursor-pointer"
                    aria-label={label}
                />
            </SliderPrimitive.Root>
        </div>
    );
}
