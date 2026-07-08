import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Scale, AlertCircle, Fingerprint, Lock, AlertTriangle, Stethoscope, RefreshCcw } from 'lucide-react';

interface PatiKartPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PatiKartPolicyModal({ isOpen, onClose }: PatiKartPolicyModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />

                    {/* Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[85vh] overflow-y-auto no-scrollbar bg-background border border-border rounded-[2.5rem] shadow-2xl z-[9999] text-foreground"
                    >
                        {/* Header Image / Gradient */}
                        <div className="relative w-full h-32 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                            <ShieldCheck className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)] relative z-10" />
                            
                            <button 
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-20"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8">
                            <h2 className="text-2xl font-black tracking-tight mb-2">Pati-Kart & KVKK Aydınlatma Metni</h2>
                            <p className="text-sm text-gray-500 font-medium mb-8">
                                Moffi ekosisteminde adil, şeffaf ve sürdürülebilir bir deneyim için yasal çerçeve, gizlilik standartları ve kullanım sınırları. Lütfen sistemin güvenliği için aşağıdaki koşulları dikkatlice okuyunuz.
                            </p>

                            <div className="space-y-6">
                                {/* Madde 1: Ekonomi */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 mt-1">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-1">1. PatiPuan (PP) ve Dijital Ekonomi Beyanı</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed text-justify">
                                            Platformumuzda kazanılan <strong>PatiPuan'lar (PP)</strong> hiçbir suretle reel veya itibari para (TL, USD, EUR vb.) karşılığı taşımaz ve kripto varlık (token/coin) statüsünde değildir. PatiPuan'lar sadece Moffi kapalı ekosisteminde; dijital rozet, avatar kıyafeti alımı ve Moffi mağazasındaki <strong>anlaşmalı fiziksel ürünlerde maksimum %10 oranında indirim</strong> sağlamak amacıyla kullanılabilir. Toplanan puanların devri, satışı veya nakit olarak talep edilmesi mümkün değildir. Hesap silinmesi durumunda tüm puanlar kalıcı olarak sıfırlanır. Uygulama, puanların değerini ve indirim oranlarını önceden bildirmeksizin değiştirme hakkını saklı tutar.
                                        </p>
                                    </div>
                                </div>

                                {/* Madde 2: Fair Use (AI & Kargo) */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-1">
                                        <Scale className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-1">2. Moffi Prime, AI Asistan & Kargo Adil Kullanım (Fair-Use)</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed text-justify">
                                            Moffi Prime aboneliği (aylık 299 ₺) kapsamında sunulan ayrıcalıklar, sistemin teknik sürdürülebilirliğini ve sunucu maliyetlerini optimize etmek amacıyla <strong>Adil Kullanım Kotası (Fair-Use Policy)</strong> çerçevesinde sınırlandırılmıştır:
                                            <br/><br/>
                                            • <strong>Moffi AI Asistan Sınırları:</strong> Gelişmiş dil modellerinin (LLM) yoğun kullanımından doğacak olağandışı API maliyetlerini engellemek için, bir kullanıcının aylık sorgu limiti <strong>500 mesaj</strong> ile sınırlandırılmıştır. Bu limitin aşılması durumunda, bir sonraki fatura dönemine kadar asistan temel (basic) yanıtlara geçiş yapar veya geçici olarak durdurulur. 
                                            <br/>
                                            • <strong>Stüdyo Kargo Limiti:</strong> "Sınırsız ve Ücretsiz Kargo" vaadi, suistimalleri önlemek adına <strong>ayda maksimum 3 sipariş ve sipariş başına maksimum 30 desi</strong> olarak revize edilmiştir.
                                            <br/>
                                            Hesap paylaşımı, otomatik bot kullanımı veya API'ye aşırı yük bindirecek makro yazılımların tespiti halinde, Moffi tek taraflı olarak aboneliği iptal etme ve hizmeti durdurma hakkına sahiptir.
                                        </p>
                                    </div>
                                </div>

                                {/* Madde 3: KVKK & Veri Güvenliği */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-1">
                                        <Fingerprint className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-1">3. 6698 Sayılı KVKK Kapsamında Veri İşleme Politikası</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed text-justify">
                                            Moffi, kullanıcılarının ve evcil hayvanlarının mahremiyetini en üst düzeyde tutmayı taahhüt eder. 
                                            <br/><br/>
                                            • <strong>Lokasyon Verileri:</strong> Uygulama içi yürüyüş ve SOS (Acil Durum Radar) verileri, yalnızca siz yürüyüşteyken veya acil durum ilan ettiğinizde anlık olarak işlenir. Geçmiş GPS rotaları uçtan uca şifrelenir ve pazarlama amacıyla profillenemez.
                                            <br/>
                                            • <strong>Sağlık ve Aşı Verileri:</strong> Dostunuza ait veteriner, çip, alerji ve aşı verileri, anonimleştirilerek yalnızca Moffi AI'ın size kişiselleştirilmiş sağlık tavsiyeleri sunabilmesi için kullanılır.
                                            <br/>
                                            • <strong>Üçüncü Taraf Paylaşımı:</strong> Kişisel ve finansal verileriniz <strong>hiçbir şekilde 3. taraf reklam şirketlerine (Google, Meta vb.) veri simsarlığı (data brokering) amacıyla satılmaz ve paylaşılmaz.</strong> Verileriniz yalnızca yasal makamların resmi talepleri doğrultusunda sunulabilir.
                                        </p>
                                    </div>
                                </div>

                                {/* Madde 4: NFC Kart & Finans */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 mt-1">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-1">4. Pati-Kart ve Temassız (NFC) Kullanım Şartları</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed text-justify">
                                            Moffi Pati-Kart (NFC), fiziksel veya sanal bir kredi kartı değildir; elektronik para kuruluşu veya bankacılık regülasyonlarına (BDDK vb.) tabi tutulamaz. Anlaşmalı mağazalarda (Pet-Friendly kafeler vb.) tasmanın NFC çipi ile yapılan temassız işlemler, doğrudan uygulama içi cüzdan bakiyenizden (PatiPuan) düşülerek çalışır. Çalınma, kaybolma veya yetkisiz okutulma durumlarında, kullanıcının uygulamadan "Güvenlik Kilidini" açarak kartı dondurma sorumluluğu kendisine aittir.
                                        </p>
                                    </div>
                                </div>

                                {/* Madde 5: Hile ve Anti-Cheat */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 mt-1">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-1">5. Anti-Cheat ve Görev Suistimali Politikası</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed text-justify">
                                            Moffi Quest Engine™ (Görev ve Adım Motoru) sistemi hileye karşı korunmaktadır. Sahte GPS yazılımları, adım/pedometre simülatörleri veya üçüncü parti makrolar kullanılarak haksız PatiPuan (PP) kazancı elde edildiği algoritma tarafından tespit edilirse; kullanıcıya önceden haber verilmeksizin <strong>hesap kalıcı olarak yasaklanır (Hardware BAN)</strong> ve toplanan tüm puanlar/kazanımlar iptal edilir.
                                        </p>
                                    </div>
                                </div>

                                {/* Madde 6: Tıbbi Sorumluluk Reddi */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 mt-1">
                                        <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-1">6. Tıbbi Feragatname (Medical Disclaimer)</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed text-justify">
                                            Moffi AI Vet Asistanı tarafından verilen cevaplar; evcil hayvanınızın genel iyilik hali için genel bilgilendirme amaçlıdır. <strong>Asla gerçek bir veteriner hekim teşhisinin veya tedavisinin yerini almaz.</strong> Ciddi acil durumlarda uygulamadaki tavsiyelere göre değil, doğrudan profesyonel bir veteriner kliniğine başvurmanız hayati önem taşır. Yanlış uygulamalardan doğacak sağlık sorunlarında Moffi sorumlu tutulamaz.
                                        </p>
                                    </div>
                                </div>

                                {/* Madde 7: Abonelik ve İade */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center shrink-0 mt-1">
                                        <RefreshCcw className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-1">7. Abonelik İptali ve İade Prosedürü</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed text-justify">
                                            Moffi Prime aboneliği dijital bir hizmet (SaaS) olduğundan, paket başlangıcından sonra Cayma Hakkı geçerli değildir ve <strong>ücret iadesi yapılmaz.</strong> Kullanıcı, dilediği zaman bir sonraki fatura dönemi için aboneliğini iptal edebilir; ancak o ayki kullanım hakkı dönem sonuna kadar devam eder.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex flex-col gap-3">
                                <button 
                                    onClick={onClose}
                                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-gray-900/20 hover:bg-black transition-colors"
                                >
                                    Okudum, Anladım ve Kabul Ediyorum
                                </button>
                                <p className="text-[10px] text-center text-gray-400 font-medium flex items-center justify-center gap-1">
                                    <Lock className="w-3 h-3" /> Tüm politika ve kurallar 256-bit yasal imza şifrelemesi ile kayıt altındadır.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
