"use client";

import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-[#0A0A0E] flex flex-col items-center justify-center text-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center"
            >
                <AlertTriangle className="w-24 h-24 text-indigo-500 mb-8 animate-pulse" />
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase mb-4">
                    Sistem Bakımda
                </h1>
                <p className="text-gray-400 max-w-lg mx-auto text-lg leading-relaxed">
                    Size daha iyi bir deneyim sunabilmek için Moffi üzerinde güncellemeler yapıyoruz. Kısa süre içinde tekrar yayında olacağız. Anlayışınız için teşekkür ederiz.
                </p>
            </motion.div>
        </div>
    );
}
