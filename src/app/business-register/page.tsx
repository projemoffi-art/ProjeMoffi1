"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, BusinessType } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Store, Stethoscope, Scissors, GraduationCap, Heart,
    ArrowRight, ArrowLeft, Building2, User, FileText, CheckCircle,
    Mail, Lock, Phone, MapPin, CreditCard, Loader2, AlertCircle,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const BUSINESS_TYPES: { key: BusinessType; label: string; desc: string; icon: typeof Store; color: string }[] = [
    { key: 'petshop', label: 'Pet Shop', desc: 'Evcil hayvan ürünleri satışı', icon: Store, color: 'from-blue-500 to-cyan-500' },
    { key: 'vet', label: 'Veteriner Kliniği', desc: 'Sağlık hizmetleri ve muayene', icon: Stethoscope, color: 'from-emerald-500 to-green-500' },
    { key: 'grooming', label: 'Pet Kuaför', desc: 'Tıraş, banyo ve bakım', icon: Scissors, color: 'from-pink-500 to-rose-500' },
    { key: 'trainer', label: 'Eğitmen', desc: 'Evcil hayvan eğitimi', icon: GraduationCap, color: 'from-amber-500 to-orange-500' },
    { key: 'shelter', label: 'Barınak', desc: 'Sahiplendirme ve bakım', icon: Heart, color: 'from-purple-500 to-violet-500' },
];

const STEPS = [
    { label: 'İşletme Türü', icon: Building2 },
    { label: 'Temel Bilgiler', icon: User },
    { label: 'Yasal Bilgiler', icon: FileText },
    { label: 'Onay', icon: CheckCircle },
];

export default function BusinessRegisterPage() {
    const router = useRouter();
    const { registerBusiness } = useAuth();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form state
    const [businessType, setBusinessType] = useState<BusinessType | null>(null);
    const [businessName, setBusinessName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [taxId, setTaxId] = useState('');
    const [iban, setIban] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);

    const canProceed = () => {
        switch (step) {
            case 0: return !!businessType;
            case 1: return businessName.trim().length >= 2 && ownerName.trim().length >= 2 && email.includes('@') && password.length >= 6 && phone.length >= 10;
            case 2: return taxId.length >= 10 && iban.length >= 10 && address.trim().length >= 5;
            case 3: return agreeTerms;
            default: return false;
        }
    };

    const handleSubmit = async () => {
        if (!businessType) return;
        setLoading(true);
        setError('');

        const result = await registerBusiness({
            email, password, businessName, businessType,
            ownerName, phone, address, taxId, iban,
        });

        setLoading(false);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => router.push('/business/dashboard'), 2500);
        } else {
            setError(result.error || 'Bir hata oluştu.');
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Başvurunuz Alındı!</h2>
                    <p className="text-gray-500 mb-2">İşletmeniz incelendikten sonra paneliniz aktif olacaktır.</p>
                    <p className="text-xs text-gray-400">Yönlendiriliyorsunuz...</p>
                    <div className="mt-6 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2.5 }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between">
                <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Ana Sayfa
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-gray-900">MoffiBusiness</span>
                </div>
            </header>

            {/* Progress */}
            <div className="px-6 py-4 max-w-2xl mx-auto w-full">
                <div className="flex items-center justify-between mb-2">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                                i < step ? "bg-indigo-600 text-white" :
                                    i === step ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300" :
                                        "bg-gray-100 text-gray-400"
                            )}>
                                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={cn("text-xs font-medium hidden sm:block", i <= step ? "text-gray-700" : "text-gray-400")}>{s.label}</span>
                            {i < STEPS.length - 1 && <div className={cn("w-8 sm:w-16 h-0.5 mx-1", i < step ? "bg-indigo-600" : "bg-gray-200")} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pb-8 max-w-2xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8"
                    >
                        {/* ===== STEP 0: BUSINESS TYPE ===== */}
                        {step === 0 && (
                            <>
                                <h2 className="text-xl font-black text-gray-900 mb-1">İşletme Türünü Seçin</h2>
                                <p className="text-sm text-gray-500 mb-6">Hangi alanda hizmet veriyorsunuz?</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {BUSINESS_TYPES.map(bt => (
                                        <button
                                            key={bt.key}
                                            onClick={() => setBusinessType(bt.key)}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 text-left transition-all duration-200 group",
                                                businessType === bt.key
                                                    ? "border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100"
                                                    : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                                            )}
                                        >
                                            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", bt.color)}>
                                                <bt.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-sm">{bt.label}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{bt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ===== STEP 1: BASIC INFO ===== */}
                        {step === 1 && (
                            <>
                                <h2 className="text-xl font-black text-gray-900 mb-1">Temel Bilgiler</h2>
                                <p className="text-sm text-gray-500 mb-6">İşletme ve hesap bilgileriniz</p>
                                <div className="space-y-4">
                                    <InputField icon={Building2} label="İşletme Adı" value={businessName} onChange={setBusinessName} placeholder="örn: Paws & Claws Pet Shop" />
                                    <InputField icon={User} label="İşletme Sahibi Adı" value={ownerName} onChange={setOwnerName} placeholder="Ad Soyad" />
                                    <InputField icon={Mail} label="E-posta" type="email" value={email} onChange={setEmail} placeholder="isletme@mail.com" />
                                    <InputField icon={Lock} label="Şifre" type="password" value={password} onChange={setPassword} placeholder="En az 6 karakter" />
                                    <InputField icon={Phone} label="Telefon" type="tel" value={phone} onChange={setPhone} placeholder="0532 000 0000" />
                                </div>
                            </>
                        )}

                        {/* ===== STEP 2: LEGAL INFO ===== */}
                        {step === 2 && (
                            <>
                                <h2 className="text-xl font-black text-gray-900 mb-1">Yasal Bilgiler</h2>
                                <p className="text-sm text-gray-500 mb-6">Vergi ve ödeme bilgileri</p>
                                <div className="space-y-4">
                                    <InputField icon={FileText} label="Vergi Numarası" value={taxId} onChange={setTaxId} placeholder="10 haneli vergi no" />
                                    <InputField icon={CreditCard} label="IBAN" value={iban} onChange={setIban} placeholder="TR00 0000 0000 0000 0000 0000 00" />
                                    <InputField icon={MapPin} label="İşletme Adresi" value={address} onChange={setAddress} placeholder="İl, İlçe, Mahalle, Sokak, No" multiline />
                                </div>
                            </>
                        )}

                        {/* ===== STEP 3: CONFIRMATION ===== */}
                        {step === 3 && (
                            <>
                                <h2 className="text-xl font-black text-gray-900 mb-1">Başvuru Özeti</h2>
                                <p className="text-sm text-gray-500 mb-6">Bilgilerinizi kontrol edin</p>

                                <div className="space-y-3 mb-6">
                                    <SummaryRow label="İşletme Türü" value={BUSINESS_TYPES.find(b => b.key === businessType)?.label || '-'} />
                                    <SummaryRow label="İşletme Adı" value={businessName} />
                                    <SummaryRow label="Sahip" value={ownerName} />
                                    <SummaryRow label="E-posta" value={email} />
                                    <SummaryRow label="Telefon" value={phone} />
                                    <SummaryRow label="Vergi No" value={taxId} />
                                    <SummaryRow label="IBAN" value={iban.slice(0, 4) + ' **** **** ' + iban.slice(-4)} />
                                    <SummaryRow label="Adres" value={address} />
                                </div>

                                <label className="flex items-start gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={e => setAgreeTerms(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-gray-600 leading-relaxed">
                                        <strong>MoffiPet İşletme Sözleşmesi</strong>&apos;ni okudum ve kabul ediyorum.
                                        Platform komisyon oranları, ödeme koşulları ve işletme kurallarını onaylıyorum.
                                    </span>
                                </label>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Error */}
                {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <span className="text-sm text-red-700 font-medium">{error}</span>
                    </motion.div>
                )}

                {/* Actions */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={() => { setStep(s => s - 1); setError(''); }}
                        disabled={step === 0}
                        className={cn(
                            "px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all",
                            step === 0
                                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        <ArrowLeft className="w-4 h-4" /> Geri
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => { setStep(s => s + 1); setError(''); }}
                            disabled={!canProceed()}
                            className={cn(
                                "px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg",
                                canProceed()
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-200 hover:-translate-y-0.5"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                            )}
                        >
                            İleri <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed() || loading}
                            className={cn(
                                "px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg",
                                canProceed() && !loading
                                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-green-200 hover:-translate-y-0.5"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                            )}
                        >
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</> : <><CheckCircle className="w-4 h-4" /> Başvuru Gönder</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ========================
// SUB COMPONENTS
// ========================

function InputField({ icon: Icon, label, value, onChange, placeholder, type = 'text', multiline = false }: {
    icon: typeof Building2; label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; multiline?: boolean;
}) {
    const baseClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition";

    return (
        <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">{label}</label>
            <div className="relative">
                <Icon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                {multiline ? (
                    <textarea
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={3}
                        className={cn(baseClass, "resize-none")}
                    />
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={baseClass}
                    />
                )}
            </div>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
        </div>
    );
}
