"use client";

import { useTranslation } from "@/context/LanguageContext";
import { ArrowLeft, Cookie, ShieldCheck, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CookiesPage() {
    const { t, language, setLanguage } = useTranslation();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#0A0A0E] text-white p-8 md:p-20 font-sans selection:bg-orange-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
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
                        className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('legal.back_to_app')}</span>
                    </button>

                    <button 
                        onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                        className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                    >
                        <Globe className="w-4 h-4 text-orange-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'tr' ? 'English' : 'Türkçe'}</span>
                    </button>
                </div>

                {/* Title Section */}
                <div className="mb-20">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-8">
                        <Cookie className="w-4 h-4 text-orange-400" />
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Cookie Compliance</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none mb-8">
                        {t('legal.title_cookies')}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-500">
                        <div className="h-px w-12 bg-gray-800" />
                        <p className="text-[10px] font-black uppercase tracking-widest">{t('legal.last_updated')}: 06.05.2024</p>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-16 text-gray-400 leading-relaxed text-sm md:text-base">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Çerezler Nedir? / What are Cookies?</h2>
                        <p>
                            {language === 'tr' 
                                ? "Çerezler, deneyiminizi iyileştirmek için tarayıcınızda saklanan küçük veri dosyalarıdır. Moffi, size özel bir deneyim sunmak için bu teknolojiyi kullanır."
                                : "Cookies are small data files stored in your browser to improve your experience. Moffi uses this technology to offer you a customized experience."}
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Kullandığımız Çerezler / Cookies We Use</h2>
                        <ul className="space-y-4 list-disc pl-5">
                            <li><strong>{language === 'tr' ? "Zorunlu Çerezler:" : "Essential Cookies:"}</strong> {language === 'tr' ? "Oturum yönetimi ve güvenlik için gereklidir." : "Required for session management and security."}</li>
                            <li><strong>{language === 'tr' ? "Performans Çerezleri:" : "Performance Cookies:"}</strong> {language === 'tr' ? "Sitemizin nasıl kullanıldığını anlamamıza yardımcı olur." : "Help us understand how our site is used."}</li>
                            <li><strong>{language === 'tr' ? "Dil Çerezleri:" : "Language Cookies:"}</strong> {language === 'tr' ? "Dil tercihinizi hatırlar." : "Remember your language preference."}</li>
                        </ul>
                    </section>

                    <section className="space-y-6 p-10 bg-white/5 border border-white/10 rounded-[3rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <ShieldCheck className="w-12 h-12 text-orange-400/20" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Kontrol Sizde</h2>
                        <p>
                            {language === 'tr'
                                ? "Tarayıcı ayarlarınız üzerinden çerezleri istediğiniz zaman silebilir veya engelleyebilirsiniz. Ancak bu durumda bazı özellikler çalışmayabilir."
                                : "You can delete or block cookies through your browser settings at any time. However, some features may not work in this case."}
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-40 pt-20 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.5em] mb-10">Moffi Labs Ecosystem © 2024</p>
                </div>
            </motion.div>
        </div>
    );
}
