'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            const { data, error } = await supabase.auth.getSession();
            
            if (data?.session) {
                // Başarılı giriş sonrası ana sayfaya yönlendir
                // page.tsx zaten kullanıcıyı setup'a mı yoksa topluluğa mı atacağını kontrol edecek
                router.replace('/');
            } else {
                console.error('OAuth callback error:', error);
                router.replace('/?error=oauth_failed');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0A0A0E] flex flex-col items-center justify-center p-10 text-center">
            <div className="relative mb-8">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-cyan-500/30"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" />
                </div>
            </div>
            
            <div className="space-y-4">
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Güvenli Bağlantı Kuruluyor</h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] animate-pulse">Moffi Evrenine Giriş Onaylanıyor...</p>
                <div className="flex justify-center mt-6">
                    <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                </div>
            </div>
        </div>
    );
}
