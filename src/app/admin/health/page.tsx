"use client";

// Kayıp & SOS: aktif kayıp/bulundu ilanlarının izlenmesi (tek kaynak lostService, 8.47).
// Veteriner/işletme onayları burada değil, İşletme Yönetimi'nde (8.54).

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import { lostService } from "@/services/lostService";

interface SosRow { id: string; img: string | undefined; name: string; location: string | null; description: string | null; kind: string }

export default function HealthPage() {
    const [rows, setRows] = useState<SosRow[] | null>(null);

    useEffect(() => {
        let alive = true;
        lostService.list()
            .catch(() => [])
            .then(list => {
                if (!alive) return;
                setRows(list.filter(l => l.status === "active").map(l => ({
                    id: l.id, img: l.photos[0], kind: l.kind,
                    name: `${l.kind === "lost" ? "Kayıp" : "Bulundu"} · ${l.petName || "isimsiz"}`,
                    location: l.locationText, description: l.description,
                })));
            });
        return () => { alive = false; };
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-4 lg:px-0 pt-10 pb-32 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Kayıp &amp; SOS</h1>
                <p className="text-sm font-semibold text-zinc-500 max-w-xl">
                    Yayındaki kayıp ve bulundu ilanları. Veteriner ve işletme başvuruları <Link href="/admin/businesses" className="text-amber-600 font-bold">İşletme Yönetimi</Link>&apos;nde.
                </p>
            </header>

            {rows === null ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
            ) : rows.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-center">
                    <ShieldAlert className="w-12 h-12 text-zinc-300 mb-3" />
                    <p className="text-sm font-semibold text-zinc-500">Yayında kayıp ya da bulundu ilanı yok.</p>
                </div>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rows.map(r => (
                        <li key={r.id}>
                            <Link href={`/kayip/${r.id}`} className="block p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300">
                                <div className="flex items-center gap-3">
                                    <span className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-white/10 overflow-hidden shrink-0">
                                        {r.img && <img src={r.img} alt="" className="w-full h-full object-cover" />}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block font-black text-zinc-900 dark:text-white truncate">{r.name}</span>
                                        <span className={`block text-xs font-semibold truncate ${r.kind === "lost" ? "text-rose-500" : "text-emerald-600"}`}>{r.location || "konum yok"}</span>
                                    </span>
                                </div>
                                <p className="mt-2.5 text-xs font-medium text-zinc-500 line-clamp-2">{r.description || "Açıklama yok."}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
