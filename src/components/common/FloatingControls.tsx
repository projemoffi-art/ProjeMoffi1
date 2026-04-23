"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Car, Skull, AlertOctagon, Footprints, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingControls() {
    const pathname = usePathname();
    const [isDangerOpen, setIsDangerOpen] = useState(false);

    // Show Danger Button ONLY on /walk... pages (Disabled for premium cleanup as per request)
    const showDanger = false;

    // MOCK Danger Logic
    const isVet = pathname?.startsWith('/vet');

    // MOCK Danger Logic
    const DANGER_TYPES = [
        { id: 'traffic', label: 'Trafik', icon: Car, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
        { id: 'poison', label: 'Zehir', icon: Skull, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
        { id: 'glass', label: 'Cam', icon: AlertOctagon, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
        { id: 'dog', label: 'Köpek', icon: Footprints, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    ];

    const handleDangerReport = (label: string) => {
        // In a real app, this would send data to backend or map context
        console.log(`Reported: ${label}`);
        setIsDangerOpen(false);
        // Could trigger a global toast here if we had a context
        alert(`${label} bildirildi!`); // Simple feedback for now
    };

    const DangerButton = () => (
        <AnimatePresence>
            {showDanger && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="relative flex flex-col items-end gap-2"
                >
                    {/* MAIN TOGGLE (SOS/Danger) */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsDangerOpen(!isDangerOpen)}
                        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${isDangerOpen
                            ? 'bg-red-500 text-white border-red-400'
                            : 'bg-red-500 text-white border-red-400 shadow-red-500/30'
                            }`}
                    >
                        {isDangerOpen ? <X className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </motion.button>

                    {/* EXPANDED MENU */}
                    <AnimatePresence>
                        {isDangerOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 10, scale: 0.9 }}
                                className="absolute top-0 right-full mr-3 bg-black/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-2"
                            >
                                {DANGER_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleDangerReport(type.label)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${type.color}`}
                                        title={type.label}
                                    >
                                        <type.icon className="w-5 h-5" />
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={`fixed bottom-32 right-6 z-[100] flex flex-col items-center gap-3 transition-all duration-300`}>

            {/* VET PAGE: Global is enough now */}

            {/* WALK/OTHER: Danger (Bottom) only */}
            {!isVet && (
                <>
                    <DangerButton />
                </>
            )}

        </div>
    );
}
