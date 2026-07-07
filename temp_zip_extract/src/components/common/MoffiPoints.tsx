"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Hexagon } from "lucide-react";

interface MoffiPointsProps {
    points: number;
    size?: "sm" | "md" | "lg";
    animate?: boolean;
}

export function MoffiPoints({ points, size = "md", animate = false }: MoffiPointsProps) {
    const [displayPoints, setDisplayPoints] = useState(points);
    const [isBumping, setIsBumping] = useState(false);

    useEffect(() => {
        if (points !== displayPoints) {
            setIsBumping(true);
            const timer = setTimeout(() => {
                setDisplayPoints(points);
                setIsBumping(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [points, displayPoints]);

    const sizeClasses = {
        sm: "text-xs px-2 py-1 gap-1",
        md: "text-sm px-3 py-1.5 gap-1.5",
        lg: "text-lg px-4 py-2 gap-2",
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    return (
        <div
            className={cn(
                "flex items-center font-black rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-200 border border-purple-400/30 transition-transform duration-300",
                sizeClasses[size],
                isBumping && animate ? "scale-125" : "scale-100"
            )}
        >
            <div className="relative flex items-center justify-center">
                <Hexagon className={cn("fill-yellow-400 text-yellow-600", iconSizes[size])} strokeWidth={1.5} />
                <span className="absolute text-[8px] font-bold text-yellow-900">M</span>
            </div>

            <span>{displayPoints}</span>

            {isBumping && animate && (
                <div className="absolute -top-4 -right-2 text-yellow-500 animate-bounce">
                    <Sparkles className="w-4 h-4 fill-yellow-400" />
                </div>
            )}
        </div>
    );
}
