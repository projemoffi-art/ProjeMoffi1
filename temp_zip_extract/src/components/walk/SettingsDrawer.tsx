"use client";

import { X, Moon, Sun, Bell, Shield, HelpCircle, LogOut } from "lucide-react";
import { useSocial } from "@/context/SocialContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
    const { theme, setTheme } = useTheme();
    const { logout } = useSocial();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="bg-card dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] p-6 pointer-events-auto relative shadow-2xl animate-in slide-in-from-bottom duration-300 transition-colors">

                {/* Handle */}
                <div className="w-full flex justify-center mb-6">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-foreground dark:text-white font-poppins">Ayarlar</h2>
                    <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4 mb-10">
                    {/* Theme Toggle Item */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-card-border dark:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", theme === 'dark' ? "bg-indigo-900/50 text-indigo-400" : "bg-orange-100 text-orange-500")}>
                                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-foreground dark:text-white">Görünüm Modu</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">{theme === 'dark' ? 'Karanlık Mod' : 'Aydınlık Mod'}</div>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={cn("w-12 h-7 rounded-full p-1 transition-colors duration-300", theme === 'dark' ? "bg-indigo-600" : "bg-gray-300")}
                        >
                            <div className={cn("w-5 h-5 bg-card rounded-full shadow-moffi-card transform transition-transform duration-300", theme === 'dark' ? "translate-x-5" : "translate-x-0")} />
                        </button>
                    </div>

                    {/* Dummy Settings for Pro Look */}
                    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                <Bell className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-foreground dark:text-gray-200">Bildirimler</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full py-4 rounded-xl text-red-500 font-bold bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                </button>

            </div>
        </div>
    );
}
