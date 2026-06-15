"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';

interface MacroChartProps {
    macros?: {
        protein: number;
        fat: number;
        carbs: number;
    };
}

export function MacroChart({ macros = { protein: 30, fat: 20, carbs: 50 } }: MacroChartProps) {
    const list = [
        { label: "Protein", percent: macros.protein, color: "bg-purple-500", textColor: "text-purple-600 dark:text-purple-400", grams: `${Math.round(macros.protein * 1.5)}g`, desc: "Kas ve Doku Sağlığı" },
        { label: "Yağ", percent: macros.fat, color: "bg-yellow-500", textColor: "text-yellow-600 dark:text-yellow-400", grams: `${Math.round(macros.fat * 0.7)}g`, desc: "Eklem ve Parlak Tüyler" },
        { label: "Karbonhidrat", percent: macros.carbs, color: "bg-sky-500", textColor: "text-sky-600 dark:text-sky-400", grams: `${Math.round(macros.carbs * 2.2)}g`, desc: "Günlük Enerji Deposu" }
    ];

    return (
        <div className="w-full bg-white dark:bg-white/5 rounded-3xl border border-gray-150 dark:border-white/5 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-5">
                <div>
                    <h3 className="font-black text-[16px] text-gray-800 dark:text-white flex items-center gap-2">
                        Makro Dengesi 📊
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Bugünkü Besin Dağılımı</p>
                </div>
            </div>

            <div className="space-y-4">
                {list.map((macro, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                            <div className="flex flex-col">
                                <span className="font-black text-gray-850 dark:text-white">{macro.label}</span>
                                <span className="text-[8.5px] text-gray-400 font-bold mt-0.5">{macro.desc}</span>
                            </div>
                            <span className="font-bold text-gray-500">
                                <strong className="text-gray-800 dark:text-white">{macro.grams}</strong> ({macro.percent}%)
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${macro.color}`} style={{ width: `${macro.percent}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 p-3 rounded-2xl bg-purple-500/[0.03] border border-purple-500/10 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="text-[9.5px] font-bold text-purple-700 dark:text-purple-400 leading-snug">
                    Evcil hayvanınız için dengeli protein ve tüy koruyucu yağ oranları hedeflenmektedir.
                </span>
            </div>
        </div>
    );
}
