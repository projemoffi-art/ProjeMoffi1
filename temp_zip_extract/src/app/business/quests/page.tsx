"use client";

import { useState } from "react";
import { Plus, Search, Trophy, TrendingUp, Users, Target } from "lucide-react";
import { QuestCard } from "@/components/business/QuestCard";
import { Quest } from "@/types/game";
import { motion } from "framer-motion";

// Mock Data
const MOCK_QUESTS: Quest[] = [
    {
        id: "1",
        title: "5 Kez Ziyaret Et, Kahve Kazan",
        description: "Mağazamıza 5 farklı günde check-in yap, ücretsiz filtre kahve kazan!",
        reward: "Ücretsiz Kahve",
        type: "visit",
        status: "active",
        participants: 124,
        completions: 45,
        targetCount: 5,
        startDate: "2024-01-01",
        endDate: "2024-02-01"
    },
    {
        id: "2",
        title: "Hafta Sonu Alışveriş Şenliği",
        description: "Bu hafta sonu yapacağın 500TL üzeri alışverişte %20 indirim.",
        reward: "%20 İndirim",
        type: "purchase",
        status: "active",
        participants: 89,
        completions: 12,
        targetCount: 1,
        startDate: "2024-01-12",
        endDate: "2024-01-14"
    },
    {
        id: "3",
        title: "Arkadaşını Getir",
        description: "MoffiPet kullanan bir arkadaşınla gel, ikiniz de sürpriz ödül kazanın.",
        reward: "Sürpriz Ödül",
        type: "interaction",
        status: "draft",
        participants: 0,
        completions: 0,
        targetCount: 1,
        startDate: "2024-02-01",
        endDate: "2024-02-28"
    }
];

export default function BusinessQuestsPage() {
    const [quests, setQuests] = useState<Quest[]>(MOCK_QUESTS);

    return (
        <div className="min-h-screen bg-[#F8F9FC] p-6 lg:p-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-foreground mb-2">Walk Quest Yönetimi</h1>
                    <p className="text-gray-500 font-medium">Müşterilerinizi oyunlaştırılmış görevlerle işletmenize çekin.</p>
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200">
                    <Plus className="w-5 h-5" />
                    Yeni Görev Oluştur
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {[
                    { title: "Aktif Katılımcı", value: "213", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                    { title: "Tamamlanan Görev", value: "57", icon: Target, color: "text-green-500", bg: "bg-green-50" },
                    { title: "Kazanılan Etkileşim", value: "%24", icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-50" }
                ].map((stat, i) => (
                    <div key={i} className="bg-card p-6 rounded-3xl border border-card-border flex items-center gap-4 shadow-moffi-card">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.title}</div>
                            <div className="text-3xl font-black text-foreground">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Görevlerde ara..."
                        className="w-full pl-12 pr-4 py-3 bg-card border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                </div>
                <div className="flex gap-2">
                    <select className="bg-card border border-card-border rounded-xl px-4 py-3 font-bold text-gray-600 focus:outline-none">
                        <option>Tüm Durumlar</option>
                        <option>Aktif</option>
                        <option>Taslak</option>
                        <option>Biten</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quests.map((quest) => (
                    <QuestCard key={quest.id} quest={quest} />
                ))}

                {/* Add New Placeholer Card */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex flex-col items-center justify-center gap-4 bg-gray-50 border-2 border-dashed border-card-border rounded-3xl min-h-[300px] hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer"
                >
                    <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center text-gray-300 group-hover:text-indigo-500 group-hover:shadow-lg transition-all">
                        <Plus className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">Hızlı Görev Ekle</span>
                </motion.button>
            </div>
        </div>
    );
}
