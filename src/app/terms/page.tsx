"use client";

import { useTranslation } from "@/context/LanguageContext";
import { ArrowLeft, ShieldCheck, ScrollText, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function TermsPage() {
    const { t, language, setLanguage } = useTranslation();
    const router = useRouter();

    return (
        <div className="min-h-screen p-8 md:p-20 font-sans selection:bg-cyan-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto relative z-10"
            >
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-16">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-card-border rounded-2xl hover:bg-white/10 transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('legal.back_to_app')}</span>
                    </button>

                    <button 
                        onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                        className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-card-border rounded-2xl hover:bg-white/10 transition-all"
                    >
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'tr' ? 'English' : 'Türkçe'}</span>
                    </button>
                </div>

                {/* Title Section */}
                <div className="mb-20">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-8">
                        <ScrollText className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Moffi Legal Protocol</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none mb-8">
                        {t('legal.title_terms')}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-500">
                        <div className="h-px w-12 bg-gray-800" />
                        <p className="text-[10px] font-black uppercase tracking-widest">{t('legal.last_updated')}: 06.05.2024</p>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-16 text-gray-400 leading-relaxed text-sm md:text-base">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">1. Giriş / Introduction</h2>
                        <p>
                            {language === 'tr' 
                                ? "Moffi platformuna hoş geldiniz. Bu Kullanım Şartları, platformumuzdaki tüm dijital hizmetlerin kullanımını düzenler. Kaydolarak bu şartları kabul etmiş sayılırsınız."
                                : "Welcome to the Moffi platform. These Terms of Service govern the use of all digital services on our platform. By signing up, you agree to these terms."}
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">2. Hizmet Kapsamı / Service Scope</h2>
                        <p>
                            {language === 'tr'
                                ? "Moffi, evcil hayvan sahipleri için dijital kimlik, sosyal etkileşim ve veteriner randevu hizmetleri sunan bir ekosistemdir. Elite ve Pro üyelikler ek özellikler içerir."
                                : "Moffi is an ecosystem offering digital identity, social interaction, and veterinary appointment services for pet owners. Elite and Pro memberships include additional features."}
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">3. Kullanıcı Sorumlulukları / User Responsibilities</h2>
                        <ul className="space-y-4 list-disc pl-5">
                            <li>{language === 'tr' ? "Hesap bilgilerinin gizliliğini korumak." : "Maintaining account confidentiality."}</li>
                            <li>{language === 'tr' ? "Platform içinde etik ve saygılı davranmak." : "Behaving ethically and respectfully within the platform."}</li>
                            <li>{language === 'tr' ? "Yanıltıcı veya sahte pet profili oluşturmamak." : "Avoiding misleading or fake pet profiles."}</li>
                        </ul>
                    </section>

                    <section className="space-y-6 p-10 bg-white/5 border border-card-border rounded-[3rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <ShieldCheck className="w-12 h-12 text-cyan-400/20" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Fikri Mülkiyet / Intellectual Property</h2>
                        <p>
                            {language === 'tr'
                                ? `Moffi logosu, tasarımı ve yazılımı ${t('company.name')}'e aittir. İzinsiz kopyalanması veya ticari amaçla kullanılması yasaktır.`
                                : `The Moffi logo, design, and software belong to ${t('company.name')}. Unauthorized copying or commercial use is prohibited.`}
                        </p>
                    </section>
                </div>

                {/* Footer Footer */}
                <div className="mt-40 pt-20 border-t border-card-border text-center">
                    <p className="text-[10px] text-foreground font-black uppercase tracking-[0.5em] mb-10">{t('company.name')} Ecosystem © 2024</p>
                </div>
            </motion.div>
        </div>
    );
}
