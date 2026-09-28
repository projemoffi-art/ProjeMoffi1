"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getGuideArticle } from "@/data/vetGuide";

export default function VetGuideArticlePage() {
    const router = useRouter();
    const { slug } = useParams<{ slug: string }>();
    const article = getGuideArticle(slug);

    return (
        <div className="theme-vet min-h-screen bg-background text-foreground pb-32">
            <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3 flex items-center gap-3">
                <button onClick={() => router.back()} aria-label="Geri" className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-secondary">Veteriner rehberi</span>
            </header>

            {!article ? (
                <main className="px-4 max-w-2xl mx-auto py-20 text-center">
                    <p className="text-sm font-semibold text-secondary mb-4">Bu yazı bulunamadı.</p>
                    <Link href="/vet/guide" className="inline-flex h-11 px-5 items-center rounded-xl bg-accent text-white font-black text-sm">Rehbere dön</Link>
                </main>
            ) : (
                <main className="px-4 max-w-2xl mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-3xl mb-4">{article.emoji}</div>
                    <div className="text-[12px] font-bold text-accent mb-1">{article.category} · {article.readMinutes} dk okuma</div>
                    <h1 className="text-2xl font-black leading-tight mb-2">{article.title}</h1>
                    <p className="text-sm font-semibold text-secondary mb-6">{article.summary}</p>

                    <div className="space-y-6">
                        {article.sections.map(s => (
                            <section key={s.heading}>
                                <h2 className="text-base font-black mb-2">{s.heading}</h2>
                                {s.paragraphs?.map((p, i) => <p key={i} className="text-[14px] leading-relaxed text-foreground/85 mb-2">{p}</p>)}
                                {s.bullets && (
                                    <ul className="space-y-2">
                                        {s.bullets.map((b, i) => (
                                            <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-foreground/85">
                                                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />{b}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}
                    </div>

                    <div className="mt-8 bg-card border border-card-border rounded-2xl p-4">
                        <p className="text-[12px] font-semibold text-secondary leading-relaxed">
                            Bu içerik genel bilgi amaçlıdır ve veteriner muayenesinin yerini tutmaz. Evcil hayvanının durumundan endişe ediyorsan bir veteriner kliniğiyle görüş.
                        </p>
                        {article.category === 'Acil durum' && (
                            <Link href="/vet/emergency" className="mt-3 flex h-11 items-center justify-center rounded-xl bg-accent text-white font-black text-sm">Açık klinikleri gör</Link>
                        )}
                    </div>
                </main>
            )}
        </div>
    );
}
