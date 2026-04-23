"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, CreditCard, MapPin, ShieldCheck, 
    Truck, Sparkles, AlertCircle, ShoppingBag, Terminal, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckoutPage() {
    const router = useRouter();
    const [cart, setCart] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);

    // Form States
    const [address, setAddress] = useState({ name: "", surname: "", phone: "", detail: "" });
    const [card, setCard] = useState({ number: "", expiry: "", cvc: "", holder: "" });
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem('moffi_cart') || '[]');
        setCart(savedCart);
        setIsLoading(false);
    }, []);

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = cartTotal > 0 ? 0 : 0; 

    const handleConfirmPayment = () => {
        const newErrors = [];
        // Strict Validation
        if (!address.name || !address.surname || !address.phone || !address.detail) {
            newErrors.push("Lütfen tüm teslimat adresi bilgilerini eksiksiz doldurun.");
        }
        if (!card.number || card.number.length < 16) {
            newErrors.push("Geçerli bir 16 haneli kart numarası giriniz.");
        }
        if (!card.expiry || !card.cvc || !card.holder) {
            newErrors.push("Tüm kart bilgileri (Tarih, CVC, İsim) zorunludur.");
        }

        if (newErrors.length > 0) {
            setErrors(newErrors);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setErrors([]);
        setIsCheckingOut(true);
        setTimeout(() => {
            setIsCheckingOut(false);
            setOrderComplete(true);
            localStorage.setItem('moffi_cart', '[]');
            // (We no longer redirect immediately. We show an embedded success screen).
        }, 2000);
    };

    if (isLoading) {
        return <div className="min-h-screen bg-[#05050A] flex items-center justify-center"><Sparkles className="w-8 h-8 text-cyan-500 animate-spin" /></div>;
    }

    if (orderComplete) {
        return (
            <main className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full" />
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-32 h-32 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mb-8 relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.4)]"
                >
                    <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-6 relative z-10">Sipariş Alındı!</h1>
                <p className="text-emerald-400 font-bold mb-2">Ödeme Başarılı - Üretim Başlıyor</p>
                <p className="text-gray-400 max-w-sm mb-12 relative z-10 leading-relaxed font-medium">Satın aldığınız kurgusal POD tasarımları başarıyla sisteme aktarıldı. Gerçek baskı testlerini aşınca elinizde olacak.</p>
                <button 
                    onClick={() => router.push('/studio')}
                    className="px-10 py-5 rounded-[2rem] bg-white text-black font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] relative z-10"
                >
                    Yeni Tasarımlara Dön
                </button>
            </main>
        );
    }

    if (cart.length === 0) {
        return (
            <main className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center text-center p-6">
                <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-8">
                    <ShoppingBag className="w-12 h-12 text-white/20" />
                </div>
                <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Sepetiniz Boş</h1>
                <p className="text-gray-500 max-w-sm mx-auto mb-10">Moffi Stüdyo'da yeni tasarımlar yaratarak tarzınızı sokağa taşıyabilirsiniz.</p>
                <button 
                    onClick={() => router.push('/studio')}
                    className="px-10 py-5 rounded-[2rem] bg-cyan-500 text-black font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                >
                    Stüdyoya Dön
                </button>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#05050A] text-white p-6 md:p-12 font-sans selection:bg-cyan-500/30">
            {/* Ambient Backgrounds */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 blur-[150px] opacity-50" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] opacity-40" />
            </div>

            <header className="relative z-10 max-w-6xl mx-auto flex items-center justify-between mb-12">
                <button 
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-4">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Güvenli Ödeme</span>
                </div>
            </header>

            <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
                
                {/* Left Side - Checkout Form */}
                <div className="lg:col-span-7 flex flex-col gap-10">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter uppercase mb-2">Kasa</h1>
                        <p className="text-gray-400 font-medium">Sipariş verilerini tamamla ve üretim bandına gönder.</p>
                    </div>

                    {errors.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6">
                            <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Lütfen Hataları Düzeltin:</h3>
                            <ul className="list-disc pl-5 space-y-1 text-red-300 text-sm font-medium">
                                {errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    )}

                    <div className="flex flex-col gap-8">
                        {/* Teslimat Adresi */}
                        <section className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
                            <div className="flex items-center gap-4 mb-8 text-cyan-400">
                                <div className="p-3 bg-cyan-500/10 rounded-xl"><MapPin className="w-6 h-6" /></div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-white">Teslimat Adresi</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Adınız" value={address.name} onChange={e=>setAddress({...address, name:e.target.value})} className="col-span-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium" />
                                <input type="text" placeholder="Soyadınız" value={address.surname} onChange={e=>setAddress({...address, surname:e.target.value})} className="col-span-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium" />
                                <input type="tel" placeholder="Telefon Numarası" value={address.phone} onChange={e=>setAddress({...address, phone:e.target.value})} className="col-span-2 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium" />
                                <textarea rows={3} placeholder="Açık Adres" value={address.detail} onChange={e=>setAddress({...address, detail:e.target.value})} className="col-span-2 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium resize-none"></textarea>
                            </div>
                        </section>

                        {/* Ödeme Yöntemi */}
                        <section className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
                            <div className="flex items-center gap-4 text-cyan-400 mb-8">
                                <div className="p-3 bg-purple-500/10 rounded-xl"><CreditCard className="w-6 h-6 text-purple-400" /></div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-white">Ödeme Bilgileri</h2>
                            </div>
                            <div className="space-y-4">
                                <input type="text" maxLength={16} placeholder="Kart Numarası (16 Hane)" value={card.number} onChange={e=>setCard({...card, number:e.target.value.replace(/\D/g,'')})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono tracking-widest text-lg" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" maxLength={5} placeholder="AA/YY" value={card.expiry} onChange={e=>setCard({...card, expiry:e.target.value})} className="col-span-1 bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono tracking-widest text-lg" />
                                    <input type="text" maxLength={3} placeholder="CVC" value={card.cvc} onChange={e=>setCard({...card, cvc:e.target.value.replace(/\D/g,'')})} className="col-span-1 bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono tracking-widest text-lg" />
                                </div>
                                <input type="text" placeholder="Kart Üzerindeki İsim" value={card.holder} onChange={e=>setCard({...card, holder:e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium uppercase" />
                            </div>
                        </section>
                    </div>
                </div>

                {/* Right Side - Order Summary */}
                <div className="lg:col-span-5">
                    <div className="sticky top-12 bg-white/[0.03] border border-white/10 rounded-[3rem] p-8 backdrop-blur-2xl">
                        <h2 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3"><Terminal className="w-5 h-5 text-cyan-400" />Sipariş Özeti</h2>
                        
                        <div className="flex flex-col gap-6 mb-8 mt-4">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-3xl bg-black/30 border border-white/5 relative overflow-hidden group">
                                    <div className="w-24 h-24 rounded-2xl bg-white/10 relative shrink-0 overflow-hidden border border-white/10 flex items-center justify-center p-2">
                                        {/* Fallback pattern in case image is missing */}
                                        {item.garmentImage ? (
                                            <img src={item.garmentImage} className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-50" alt="Garment" />
                                        ) : (
                                            <ShoppingBag className="w-8 h-8 text-white/20 absolute" />
                                        )}
                                        
                                        {item.printDesign && (
                                            <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
                                                <img src={item.printDesign} className={cn(
                                                    "w-full h-full object-contain mb-2",
                                                    item.printPosition === 'top-left' && "scale-50 -translate-x-4 -translate-y-4",
                                                    item.printPosition === 'top-right' && "scale-50 translate-x-4 -translate-y-4",
                                                    item.printPosition === 'bottom-center' && "scale-75 translate-y-6"
                                                )} alt="Print" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center flex-1">
                                        <h3 className="font-bold text-white text-base truncate">Moffi Özel Üretim</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded font-black text-[10px] uppercase">BEDEN: {item.size}</span>
                                        </div>
                                        <p className="mt-3 font-mono font-black text-white/80">{Number(item.price).toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 pt-8 border-t border-white/10 mb-8">
                            <div className="flex justify-between text-gray-400 text-sm font-semibold"><span>Ara Toplam</span><span>{cartTotal.toLocaleString('tr-TR')} ₺</span></div>
                            <div className="flex justify-between text-white text-xl font-black tracking-widest pt-4 uppercase"><span>Toplam</span><span>{cartTotal.toLocaleString('tr-TR')} ₺</span></div>
                        </div>

                        <button 
                            disabled={isCheckingOut}
                            onClick={handleConfirmPayment}
                            className="w-full py-6 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isCheckingOut ? <Sparkles className="w-6 h-6 animate-spin" /> : <>Ödemeyi Tamamla <ArrowLeft className="w-5 h-5 rotate-180" /></>}
                        </button>

                        {/* --- DEVELOPER NOTE FOR PHASE 2 --- */}
                        <button 
                            onClick={() => alert("FAZ-2 İYZİCO (GERÇEK ÖDEME) ENTEGRASYON PLANI:\n\n1) Resmi Şahıs veya Limited Şirketi aktif edilecek.\n2) İyzico platformuna başvurulup 'API_KEY' ve 'SECRET_KEY' alınacak.\n3) Geliştirici YZ'ye 'Şifreleri aldım, hadi İyzico'yu kuralım!' denilecek.\n4) Kasa sistemi Supabase veritabanı ile bağlanıp saatler içinde canlı E-Ticaret aktif edilecek. 🚀")}
                            className="w-full mt-4 py-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <ShieldCheck className="w-4 h-4" /> Faz-2 İYZİCO Entegrasyon Notu
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
