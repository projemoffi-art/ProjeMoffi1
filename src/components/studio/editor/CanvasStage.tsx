"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { usePhotoEditor, generateFilterString } from "@/hooks/usePhotoEditor";

interface CanvasStageProps {
    imageUrl: string;
    editor: ReturnType<typeof usePhotoEditor>;
}

export function CanvasStage({ imageUrl, editor }: CanvasStageProps) {
    const { state } = editor;
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const filterString = generateFilterString(state);

    return (
        <div
            ref={containerRef}
            className="flex-1 h-full relative overflow-hidden bg-[#121212] flex items-center justify-center p-12 select-none"
        // In pro app, we would add Zoom/Pan logic here (useDrag)
        >
            {/* Background Grid for Transparency */}
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'conic-gradient(#333 90deg, transparent 90deg)',
                backgroundSize: '20px 20px'
            }} />

            <motion.div
                className="relative shadow-2xl shadow-black/50"
                initial={false}
                animate={{
                    // In a real canvas implementation, rotate/scale would be handled by CSS transform here
                    rotate: state.rotation,
                    scale: state.scale
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Editing"
                    className="max-h-[80vh] max-w-[100%] object-contain"
                    style={{
                        filter: filterString,
                        transition: 'filter 0.1s ease-out' // Fast transition for real-time feel
                    }}
                />
            </motion.div>

            {/* Overlay Info (Debug/Pro) */}
            <div className="absolute bottom-6 left-6 text-[10px] text-white/30 font-mono">
                {state.filter !== 'none' && `FILTER: ${state.filter.toUpperCase()} • `}
                ZOOM: {Math.round(state.scale * 100)}%
            </div>
        </div>
    );
}
