"use client";

import { useTranslation } from "@/context/LanguageContext";
import { ArrowLeft, ShieldCheck, Fingerprint, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PrivacyPage() {
    const { t, language, setLanguage } = useTranslation();
    const router = useRouter();

    return (
        <div className="min-h-screen p-8 md:p-20 font-sans selection:bg-purple-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
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
                        className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-card-border rounded-2xl hover:bg-white/10 transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('legal.back_to_app')}</span>
                    </button>

                    <button 
                        onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                        className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-card-border rounded-2xl hover:bg-white/10 transition-all"
                    >
                        <Globe className="w-4 h-4 text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'tr' ? 'English' : 'Türkçe'}</span>
                    </button>
                </div>

                {/* Title Section */}
                <div className="mb-20">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8">
                        <Fingerprint className="w-4 h-4 text-purple-400" />
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Data Protection Protocol</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none mb-8">
                        {t('legal.title_privacy')}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-500">
                        <div className="h-px w-12 bg-gray-800" />
                        <p className="text-[10px] font-black uppercase tracking-widest">{t('legal.last_updated')}: 06.05.2024</p>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-16 text-gray-400 leading-relaxed text-sm md:text-base">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Veri İşleme Sorumlusu / Data Controller</h2>
                        <p>
                            {language === 'tr' 
                                ? `${t('company.name')}, KVKK ve GDPR kapsamında veri sorumlusu olarak hareket eder. Verileriniz en yüksek güvenlik standartlarında korunmaktadır.`
                                : `${t('company.name')} acts as the data controller under KVKK and GDPR. Your data is protected under the highest security standards.`}
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Hangi Verileri Topluyoruz? / What Data We Collect?</h2>
                        <ul className="space-y-4 list-disc pl-5">
                            <li>{language === 'tr' ? "Kimlik bilgileri (Ad, Kullanıcı Adı)" : "Identity information (Name, Username)"}</li>
                            <li>{language === 'tr' ? "İletişim bilgileri (E-posta)" : "Contact information (Email)"}</li>
                            <li>{language === 'tr' ? "Pet profilleri ve sağlık verileri" : "Pet profiles and health data"}</li>
                            <li>{language === 'tr' ? "Konum verileri (Onayınız dahilinde)" : "Location data (With your consent)"}</li>
                        </ul>
                    </section>

                    <section className="space-y-6 p-10 bg-white/5 border border-card-border rounded-[3rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <ShieldCheck className="w-12 h-12 text-purple-400/20" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">KVKK & GDPR Haklarınız</h2>
                        <p>
                            {language === 'tr'
                                ? `Verilerinizin silinmesini talep etme, işlenmesine itiraz etme ve veri taşınabilirliği haklarına sahipsiniz. Talepleriniz için ${t('company.email')} adresine ulaşabilirsiniz.`
                                : `You have the right to request deletion, object to processing, and data portability. Contact ${t('company.email')} for your requests.`}
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-40 pt-20 border-t border-card-border text-center">
                    <p className="text-[10px] text-foreground font-black uppercase tracking-[0.5em] mb-10">Secured by Moffi Cipher Engine © 2024</p>
                </div>
            </motion.div>
        </div>
    );
}
