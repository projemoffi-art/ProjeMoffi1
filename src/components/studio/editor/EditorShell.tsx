"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { StudioContextProvider } from "../v4/StudioContext";
import { InteractiveDesignCanvas } from "../InteractiveDesignCanvas";

interface EditorShellProps {
    imageUrl: string;
    onClose: () => void;
    onSave: (finalUrl: string) => void;
}

export function EditorShell({ imageUrl, onClose, onSave }: EditorShellProps) {
    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-black">
            {/* Close Button specific to Shell */}
            <button
                onClick={onClose}
                className="absolute top-6 left-6 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"
            >
                <X className="w-5 h-5" />
            </button>

            <InteractiveDesignCanvas
                productImage={imageUrl}
                onSave={(layers) => {
                    // In a real app, we'd generate a composite image here. 
                    // For now, we just pass back the original or a mock "edited" url.
                    console.log("Saving layers:", layers);
                    onSave(imageUrl);
                }}
            />
        </div>
    );
}
