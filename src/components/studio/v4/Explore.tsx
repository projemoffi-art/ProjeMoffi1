"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStudioContext } from "./StudioContext";
import { Source } from "./types";

export function Explore() {
    const { source, setSource, setProduct } = useStudioContext();
    const router = useRouter();

    const products = useMemo(() => {
        if (source === "MOFFI") {
            return [
                { id: "m1", title: "Moffi Hoodie — Classic", price: 499, currency: "₺", source: "MOFFI" as const },
                { id: "m2", title: "Moffi Bandana — Soft", price: 129, currency: "₺", source: "MOFFI" as const },
                { id: "m3", title: "Moffi T-Shirt — Minimal", price: 299, currency: "₺", source: "MOFFI" as const },
                { id: "m4", title: "Moffi Accessory — Clean", price: 189, currency: "₺", source: "MOFFI" as const },
            ];
        }
        return [
            { id: "s1", title: "PatiStore Hoodie — Onaylı", price: 519, currency: "₺", source: "MERCHANT" as const },
            { id: "s2", title: "KediKöpekCo Bandana — Onaylı", price: 149, currency: "₺", source: "MERCHANT" as const },
        ];
    }, [source]);

    const handlePickProduct = (p: any) => {
        setProduct(p);
        router.push('/studio/design');
    };

    return (
        <div className="max-w-6xl mx-auto p-8 font-sans">
            {/* Header */}
            <div className="flex items-end justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Stüdyo</h1>
                    <p className="text-lg text-gray-500 font-medium max-w-lg">
                        Moffi kalitesiyle veya onaylı tasarımcıların ürünleriyle başlayın.
                        Hayalinizdeki tasarımı yaratın.
                    </p>
                </div>
            </div>

            {/* Source Toggle */}
            <div className="flex gap-2 mb-8 bg-white/50 w-fit p-1.5 rounded-2xl border border-gray-200/60 backdrop-blur-sm">
                <Segment active={source === "MOFFI"} label="Resmi Moffi Ürünleri" onClick={() => setSource("MOFFI")} />
                <Segment active={source === "MERCHANT"} label="Anlaşmalı İşletmeler" onClick={() => setSource("MERCHANT")} />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                {products.map((p) => (
                    <div key={p.id} onClick={() => handlePickProduct(p)} className="group cursor-pointer">
                        <div className="aspect-[4/5] bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-4 overflow-hidden relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg">
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-200 font-black text-8xl opacity-30 select-none">
                                {p.title[0]}
                            </div>

                            {/* Overlay Badge */}
                            <div className="absolute top-4 left-4">
                                <span className={`
                                    px-3 py-1.5 rounded-full text-xs font-bold border
                                    ${p.source === "MOFFI" ? "bg-black text-white border-black" : "bg-white text-gray-900 border-gray-200"}
                                `}>
                                    {p.source === "MOFFI" ? "Moffi Original" : "Verified Partner"}
                                </span>
                            </div>

                            {/* Hover Action */}
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                    Tasarlamaya Başla
                                </button>
                            </div>
                        </div>

                        <div className="px-2">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-gray-900 leading-tight w-2/3">{p.title}</h3>
                                <div className="text-lg font-medium text-gray-900">{p.price}{p.currency}</div>
                            </div>
                            <div className="text-sm text-gray-400 font-medium mt-1">
                                {p.source === "MOFFI" ? "Premium Pamuk" : "Standart Kalite"}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Segment({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`
                px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                ${active ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-white/50"}
            `}
        >
            {label}
        </button>
    );
}
