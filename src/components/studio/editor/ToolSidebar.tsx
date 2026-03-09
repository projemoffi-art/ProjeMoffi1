"use client";

import { motion } from "framer-motion";
import { Sliders, Crop, Sparkles, Type, Sticker, RotateCcw, Undo2, Redo2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePhotoEditor } from "@/hooks/usePhotoEditor";

interface ToolSidebarProps {
    activeTool: string;
    setActiveTool: (tool: string) => void;
    editor: ReturnType<typeof usePhotoEditor>;
    onSave: () => void;
}

export function ToolSidebar({ activeTool, setActiveTool, editor, onSave }: ToolSidebarProps) {
    const { undo, redo, canUndo, canRedo } = editor;

    const TOOLS = [
        { id: 'tune', label: 'Ayarlar', icon: Sliders },
        { id: 'filter', label: 'Filtreler', icon: Sparkles },
        { id: 'crop', label: 'Kırp', icon: Crop },
        { id: 'text', label: 'Metin', icon: Type, disabled: true }, // Placeholder
    ];

    return (
        <div className="w-20 h-full bg-[#1A1A1A]/95 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between py-6 z-20">

            {/* Top: Tools */}
            <div className="flex flex-col gap-6 items-center">
                {TOOLS.map(tool => (
                    <button
                        key={tool.id}
                        disabled={tool.disabled}
                        onClick={() => setActiveTool(tool.id)}
                        className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative group",
                            activeTool === tool.id
                                ? "bg-[#5B4D9D] text-white shadow-lg shadow-purple-500/20"
                                : "text-gray-400 hover:bg-white/10 hover:text-white",
                            tool.disabled && "opacity-30 cursor-not-allowed"
                        )}
                    >
                        <tool.icon className="w-5 h-5" />
                        <span className="absolute left-14 bg-black px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {tool.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Bottom: Actions */}
            <div className="flex flex-col gap-4 items-center">
                <div className="h-px w-8 bg-white/10" />

                <button disabled={!canUndo} onClick={undo} className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                    <Undo2 className="w-5 h-5" />
                </button>

                <button disabled={!canRedo} onClick={redo} className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                    <Redo2 className="w-5 h-5" />
                </button>

                <button onClick={onSave} className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg mt-2">
                    <Download className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
