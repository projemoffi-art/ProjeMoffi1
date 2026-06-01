"use client";

import { useState, useEffect } from "react";
import {
    CalendarCheck, CheckCircle2,
    User, Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BusinessSidebar as Sidebar } from "@/components/business/Sidebar";

// MOCK APPOINTMENTS (Initial State)
const INITIAL_APPOINTMENTS = [
    { id: 101, petName: "Luna", ownerName: "Ayşe Yılmaz", time: "09:30", type: "Rutin Kontrol", status: "confirmed", image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=100" },
    { id: 102, petName: "Baron", ownerName: "Mehmet Demir", time: "11:00", type: "Aşı (Kuduz)", status: "confirmed", image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100" },
];

export default function BusinessAppointmentsPage() {
    // Initialize with mock data to avoid hydration mismatch
    const [appointments, setAppointments] = useState<any[]>(INITIAL_APPOINTMENTS);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    // Simulate fetching new appointments from "Server" (Local Storage for Demo)
    useEffect(() => {
        // Safe check for browser environment
        if (typeof window === 'undefined') return;

        const checkNew = () => {
            try {
                const stored = localStorage.getItem('moffi_pending_appointments');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setPendingRequests(parsed);
                }
            } catch (e) {
                console.error("Storage Error:", e);
            }
        };

        // Poll every 2 seconds
        const interval = setInterval(checkNew, 2000);
        checkNew(); // Initial check

        return () => clearInterval(interval);
    }, []);

    const handleAction = (id: number, action: 'accept' | 'reject') => {
        const target = pendingRequests.find(r => r.id === id);
        if (!target) return;

        if (action === 'accept') {
            setAppointments(prev => [...prev, { ...target, status: 'confirmed' }].sort((a, b) => (a.time || "").localeCompare(b.time || "")));
            alert(`Randevu Onaylandı! ${target.petName} için bildirim gönderildi.`);
        }

        const updatedPending = pendingRequests.filter(r => r.id !== id);
        setPendingRequests(updatedPending);

        if (typeof window !== 'undefined') {
            localStorage.setItem('moffi_pending_appointments', JSON.stringify(updatedPending));
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FC] dark:bg-[#000000] font-sans">
            <Sidebar />

            <main className="flex-1 p-8 ml-0 md:ml-20 lg:ml-72 transition-all duration-300">
                {/* HEADER */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-foreground dark:text-white mb-2">Randevu Yönetimi</h1>
                        <p className="text-gray-500 font-medium">VetLife Global Clinic • 12 Aralık 2025</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-12 h-12 rounded-2xl bg-card dark:bg-white/5 border border-card-border dark:border-card-border flex items-center justify-center relative">
                            <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                            {pendingRequests.length > 0 && <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse" />}
                        </button>
                        <div className="hidden md:flex items-center gap-3 bg-card dark:bg-white/5 px-4 py-2 rounded-2xl border border-card-border dark:border-card-border">
                            <img src="https://images.unsplash.com/photo-1559839734-2b71ea86b48e?w=100" className="w-8 h-8 rounded-full object-cover" />
                            <span className="font-bold text-sm">Dr. Moffi</span>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT: CALENDAR & CONFIRMED LIST */}
                    <div className="flex-1 space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-card dark:bg-[#121212] p-6 rounded-3xl border border-card-border dark:border-card-border shadow-moffi-card">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-2">Bugünkü Randevular</div>
                                <div className="text-4xl font-black text-foreground dark:text-white">{appointments.length + pendingRequests.length}</div>
                            </div>
                            <div className="bg-[#5B4D9D] p-6 rounded-3xl shadow-xl shadow-purple-500/20 text-white">
                                <div className="text-white/60 text-xs font-bold uppercase mb-2">Bekleyen Onay</div>
                                <div className="text-4xl font-black">{pendingRequests.length}</div>
                            </div>
                            <div className="bg-card dark:bg-[#121212] p-6 rounded-3xl border border-card-border dark:border-card-border shadow-moffi-card">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-2">Tahmini Kazanç</div>
                                <div className="text-4xl font-black text-green-500 flex items-baseline gap-1">
                                    {(appointments.length * 650).toLocaleString()}<span className="text-sm">₺</span>
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="bg-card dark:bg-[#121212] rounded-[2.5rem] p-8 border border-card-border dark:border-card-border shadow-moffi-card min-h-[500px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl flex items-center gap-2"><CalendarCheck className="w-6 h-6 text-[#5B4D9D]" /> Program Akışı</h3>
                            </div>

                            <div className="space-y-4">
                                {appointments.length === 0 && <div className="text-center text-gray-400 py-10">Bugün için planlanmış randevu yok.</div>}
                                {appointments.map((apt) => (
                                    <div key={apt.id} className="group flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-card-border dark:hover:border-card-border">
                                        <div className="font-mono font-bold text-gray-400 min-w-[3rem] text-right">{apt.time || "--:--"}</div>
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-200 overflow-hidden">
                                                <img src={apt.image} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-[#121212] flex items-center justify-center">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-lg text-foreground dark:text-white">{apt.petName}</div>
                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                <User className="w-3 h-3" /> {apt.ownerName} • {apt.type}
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 rounded-xl border border-card-border text-sm font-bold hover:bg-black hover:text-white transition-colors invisible group-hover:visible">Detay</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: PENDING REQUESTS SIDEBAR */}
                    <div className="w-full lg:w-96">
                        <div className="sticky top-8">
                            <div className="bg-card dark:bg-[#121212] rounded-[2.5rem] p-6 border border-card-border dark:border-card-border shadow-xl shadow-indigo-500/5">
                                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-orange-500 fill-current" /> Gelen İstekler ({pendingRequests.length})
                                </h3>

                                <AnimatePresence>
                                    {pendingRequests.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-card-border dark:border-card-border">
                                            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-400 font-bold text-sm">Bekleyen istek yok</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingRequests.map(req => (
                                                <motion.div
                                                    key={req.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="bg-[#F8F9FC] dark:bg-white/5 p-4 rounded-3xl border border-indigo-100 dark:border-card-border"
                                                >
                                                    <div className="flex gap-4 mb-4">
                                                        <img src={req.image} className="w-14 h-14 rounded-2xl object-cover" />
                                                        <div>
                                                            <div className="font-black text-foreground dark:text-white text-lg">{req.petName}</div>
                                                            <div className="text-xs text-gray-500 font-bold bg-card dark:bg-black/20 px-2 py-1 rounded-md inline-block mt-1">
                                                                ⏰ {req.time || "Saatsiz"} • {req.date}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex text-xs text-gray-500 gap-2 mb-4 bg-card dark:bg-black/20 p-2 rounded-xl">
                                                        <span className="font-bold">Not:</span> {req.type || "Rutin Kontrol"}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleAction(req.id, 'reject')} className="flex-1 py-3 rounded-xl bg-card dark:bg-white/5 border border-card-border text-red-500 font-bold hover:bg-red-50 transition-colors">Reddet</button>
                                                        <button onClick={() => handleAction(req.id, 'accept')} className="flex-1 py-3 rounded-xl bg-[#5B4D9D] text-white font-bold shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform">Onayla</button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
