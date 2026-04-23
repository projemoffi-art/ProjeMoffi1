"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, Palette, Box, Sparkles, 
    Layers, Download, ShoppingBag, 
    Zap, MousePointer2, Share2, HelpCircle,
    Maximize2, RefreshCcw, Save, Type, Sliders, Wand2, ArrowLeftRight, ArrowUpDown, Upload, Globe, Smartphone, X 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { generateImageAction } from '@/app/actions/ai';
export default function ProductionStudio() {
    const router = useRouter();
    const [isGenerating, setIsGenerating] = useState(false);
    const [activePrompt, setActivePrompt] = useState('');
    const [printDesign, setPrintDesign] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [wardrobe, setWardrobe] = useState<any[]>([]);
    const [cartCount, setCartCount] = useState(0);
    const [isSuccessToast, setIsSuccessToast] = useState(false);
    
    useEffect(() => {
        const savedWardrobe = JSON.parse(localStorage.getItem('moffi_wardrobe') || '[]');
        setWardrobe(savedWardrobe);
        const savedCart = JSON.parse(localStorage.getItem('moffi_cart') || '[]');
        setCartCount(savedCart.length);
    }, []);
    
    // Left Toolbar States
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const [selectedColor, setSelectedColor] = useState('bg-white'); 
    const [selectedModel, setSelectedModel] = useState('Klasik Tişört');

    // Checkout & Order States
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState('L');
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

    // --- NEW PRODUCT CUSTOMIZATION STATES ---
    const [topText, setTopText] = useState("");
    const [bottomText, setBottomText] = useState("");
    const [textColor, setTextColor] = useState("#000000");
    const [textFont, setTextFont] = useState("font-black");
    const [textSize, setTextSize] = useState(24);
    const [printScale, setPrintScale] = useState(1);
    const [printPosition, setPrintPosition] = useState("center"); // 'center' | 'left-chest'
    const [printFilter, setPrintFilter] = useState("none");

    const colors = [
        { label: 'Beyaz (Önerilen)', hex: 'bg-white', blend: 'mix-blend-normal' },
        { label: 'Açık Gri', hex: 'bg-gray-200', blend: 'mix-blend-multiply' },
        { label: 'Krem', hex: 'bg-[#F5F5DC]', blend: 'mix-blend-multiply' },
        { label: 'Açık Mavi', hex: 'bg-blue-100', blend: 'mix-blend-multiply' }
    ];
    const models = ['Klasik Tişört', 'Polar', 'Bandana', 'Köpek Montu'];
    
    const filters = [
        { name: 'Orijinal', value: 'none' },
        { name: 'Siyah/Beyaz', value: 'grayscale(100%)' },
        { name: 'Vintage', value: 'sepia(80%) contrast(90%)' },
        { name: 'Canlı (Neon)', value: 'contrast(150%) saturate(200%)' }
    ];
    
    const fonts = [
        { name: 'Klasik Kalın', class: 'font-sans font-black' },
        { name: 'El Yazısı (İmza)', class: 'font-[cursive] italic tracking-wider' },
        { name: 'Spor / Kolej', class: 'font-[\'Impact\',_sans-serif] uppercase' },
        { name: 'Zarif İtalik', class: 'font-serif font-bold italic tracking-wide' },
        { name: 'Daktilo', class: 'font-mono uppercase tracking-widest' } 
    ];

    const generateAIModel = async () => {
        if (!activePrompt) return alert("Lütfen basılacak grafik için bir komut gir!");
        setIsGenerating(true);
        // FORCE POD LOGIC: Must be a flat vector on a pure white background so multiply blend removes the background!
        const finalPrompt = `A cute flat vector graphic illustration suitable for apparel print. Solid pure white background. Centered isolated object. No ambient scene or full body context. Theme: ${activePrompt}`;
        try {
            const res = await generateImageAction(finalPrompt);
            if (res.success && res.url) {
                setPrintDesign(res.url);
                setHistory(prev => [res.url, ...prev].slice(0, 5));
            } else {
                alert((res as any).error || "Görsel üretilemedi.");
            }
        } catch (error) {
            console.error(error);
            alert("Sistemde bir hata oluştu.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Ensure file is an image
        if (!file.type.startsWith('image/')) {
            return alert("Lütfen geçerli bir resim formatı seçiniz (PNG, JPG).");
        }

        const reader = new FileReader();
        reader.onload = (event: any) => {
            if (event.target && event.target.result) {
                setPrintDesign(event.target.result as string);
                setHistory(prev => [event.target.result as string, ...prev].slice(0, 5));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDownloadGraphic = async () => {
        if (!printDesign) return alert("İndirilecek bir grafik yok! Önce üretin veya yükleyin.");
        try {
            const response = await fetch(printDesign);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `moffi_tasarimi_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            // CORS güvenlik duvarı (Fallback)
            const link = document.createElement('a');
            link.href = printDesign;
            link.download = `moffi_tasarimi.png`;
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleSaveToWardrobe = () => {
        if (!printDesign) return alert("Kaydedilecek bir tasarım yok.");
        const currentItems = JSON.parse(localStorage.getItem('moffi_wardrobe') || '[]');
        const newItem = {
            id: Date.now(),
            image: printDesign,
            model: selectedModel,
            date: new Date().toISOString()
        };
        const updatedWardrobe = [newItem, ...currentItems].slice(0, 20); // Keep last 20
        localStorage.setItem('moffi_wardrobe', JSON.stringify(updatedWardrobe));
        setWardrobe(updatedWardrobe); // Update React State
        alert("✨ Tasarımın başarıyla Dijital Gardıroba mühürlendi! Sağ panelden istediğin zaman geri çağırabilirsin.");
    };

    const handleShareToCommunity = () => {
        if (!printDesign) return alert("Lütfen önce tasarımınızı hazırlayın!");
        const currentPosts = JSON.parse(localStorage.getItem('moffi_kesfet_posts') || '[]');
        const newPost = {
            id: `studio_post_${Date.now()}`,
            author: "Ben",
            avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=MoffiUser",
            content: `Moffi Stüdyo'da yeni bir tasarım ürettim! Model: ${selectedModel} 🚀 #MoffiStudio`,
            image: printDesign,
            likes: 0,
            comments: [],
            isLiked: false,
            timestamp: "Az önce"
        };
        localStorage.setItem('moffi_kesfet_posts', JSON.stringify([newPost, ...currentPosts]));
        alert("🚀 Tasarımın başarıyla Moffi Keşfet ağına yüklendi! Herkes görebilir.");
        setIsShareMenuOpen(false);
    };

    const handleShareToDevice = () => {
        if (!printDesign) return alert("Önce tasarımı hazırlayın!");
        if (navigator.share) {
            navigator.share({
                title: 'Moffi Stüdyo Tasarımım',
                text: `Moffi Stüdyo'da kendi kıyafetimi tasarladım. Göz atsana! 👕✨`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            alert("Cihazınız native paylaşımı desteklemiyor.");
        }
        setIsShareMenuOpen(false);
    };

    const handleSiparis = () => {
        if (!printDesign) return alert("Sipariş vermeden önce lütfen bir baskı motifi oluşturun! (Sihirli değneğe basarak AI ile üretebilirsiniz)");
        setIsCheckoutModalOpen(true);
    };

    const handleCompleteOrder = () => {
        // This is real logistics data
        const orderData = {
            id: `pod_order_${Date.now()}`,
            productId: 'moffi_custom_apparel',
            name: `Özel Üretim: ${selectedModel}`,
            price: 1499,
            quantity: 1,
            size: selectedSize,
            logistics: {
                baseGarment: selectedModel,
                baseColorHex: selectedColor,
                printGraphicUrl: printDesign,
                printAreaDimensions: printPosition === 'center' ? `${Math.round(20 * printScale)}cm x ${Math.round(20 * printScale)}cm` : '10cm x 10cm (Cep)',
                printPlacement: printPosition,
                graphicFilterApplied: printFilter,
                customTextTop: topText || null,
                customTextBottom: bottomText || null,
                customTextColor: textColor,
                customTextFont: textFont,
                customTextSize: textSize,
                productionMethod: "DTF (Direct to Film)"
            }
        };
        const cart = JSON.parse(localStorage.getItem('moffi_cart') || '[]');
        cart.push(orderData);
        localStorage.setItem('moffi_cart', JSON.stringify(cart));
        
        setCartCount(cart.length);
        setIsCheckoutModalOpen(false);
        setIsSuccessToast(true);
        setTimeout(() => setIsSuccessToast(false), 3500); // 3.5 sn sonra bildirim kaybolur
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
            
            {/* AMBIENT BACKGROUND */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] blend-overlay" />
            </div>

            {/* HEADER */}
            <header className="relative z-50 px-8 py-6 flex items-center justify-between border-b border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.push('/community')}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter uppercase italic">Moffi Stüdyo</h1>
                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em]">Yapay Zeka Tasarım Merkezi</p>
                    </div>
                </div>

                <div className="relative flex items-center gap-3">
                    <button onClick={() => setIsShareMenuOpen(!isShareMenuOpen)} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2 active:scale-95">
                        <Share2 className="w-4 h-4" /> Paylaş
                    </button>
                    
                    <AnimatePresence>
                        {isShareMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-16 right-[180px] w-64 bg-[#0a0a0a] backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 flex flex-col gap-2"
                            >
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <h4 className="text-[10px] uppercase tracking-widest text-white/50 font-black">Paylaşım Ağı</h4>
                                    <button onClick={() => setIsShareMenuOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-3 h-3" /></button>
                                </div>
                                <button onClick={handleShareToCommunity} className="w-full text-left px-4 py-4 rounded-xl hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors flex items-center gap-4 text-sm font-bold border border-transparent hover:border-cyan-500/30 group">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Globe className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-cyan-400">Moffi Keşfet</span>
                                        <span className="text-[9px] text-zinc-500 tracking-wider">Topluluk ile buluştur</span>
                                    </div>
                                </button>
                                <button onClick={handleShareToDevice} className="w-full text-left px-4 py-4 rounded-xl hover:bg-white/5 hover:text-white transition-colors flex items-center gap-4 text-sm font-bold text-zinc-400 group border border-transparent hover:border-white/10">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Smartphone className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white">Uygulamalar</span>
                                        <span className="text-[9px] text-zinc-500 tracking-wider">Whatsapp, Insta vs.</span>
                                    </div>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {cartCount > 0 && (
                        <button 
                            title="Açık Sepet"
                            onClick={() => router.push('/checkout')}
                            className="relative w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 flex items-center justify-center transition-all animate-pulse-slow"
                        >
                            <ShoppingBag className="w-5 h-5 text-cyan-400" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-[10px] font-black text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                                {cartCount}
                            </div>
                        </button>
                    )}

                    <button onClick={handleSiparis} className="px-6 py-3 rounded-xl bg-cyan-500 text-black font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95">
                        <ShoppingBag className="w-4 h-4" /> Sipariş Ver
                    </button>
                </div>
            </header>

            {/* MAIN WORKSPACE */}
            <main className="flex-1 relative flex flex-col lg:flex-row overflow-hidden">
                
                {/* 1. LEFT TOOLBAR */}
                <aside className="w-full lg:w-20 border-r border-white/5 flex lg:flex-col items-center py-8 gap-8 bg-black/20 backdrop-blur-sm z-30 overflow-x-auto lg:overflow-y-auto no-scrollbar justify-center relative">
                    <ToolbarIcon icon={Palette} active={activePanel === 'color'} label="Kumaş" onClick={() => setActivePanel(p => p === 'color' ? null : 'color')} />
                    <ToolbarIcon icon={Box} active={activePanel === 'model'} label="Model" onClick={() => setActivePanel(p => p === 'model' ? null : 'model')} />
                    
                    <div className="w-8 h-px bg-white/10 my-2 hidden lg:block" />
                    
                    <ToolbarIcon icon={Type} active={activePanel === 'text'} label="Yazı" onClick={() => setActivePanel(p => p === 'text' ? null : 'text')} />
                    <ToolbarIcon icon={Sliders} active={activePanel === 'layout'} label="Boyut" onClick={() => setActivePanel(p => p === 'layout' ? null : 'layout')} />
                    <ToolbarIcon icon={Wand2} active={activePanel === 'filter'} label="Filtre" onClick={() => setActivePanel(p => p === 'filter' ? null : 'filter')} />
                    
                </aside>

                {/* POPUP PANELS (MOVED OUTSIDE ASIDE TO PREVENT OVERFLOW CLIPPING) */}
                <AnimatePresence>
                    {activePanel && (
                        <motion.div 
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-4 lg:left-28 top-32 lg:top-16 w-72 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
                        >
                            {activePanel === 'color' && (
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Kumaş Rengi</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {colors.map((c, i) => (
                                            <button key={i} onClick={() => setSelectedColor(c.hex)} className={cn("w-full h-10 rounded-xl border-2 transition-all shadow-inner", c.hex, selectedColor === c.hex ? "border-cyan-400 scale-105" : "border-white/10 opacity-70 hover:opacity-100")} title={c.label} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activePanel === 'model' && (
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Ürün Tipi</h4>
                                    <div className="flex flex-col gap-2">
                                        {models.map(m => (
                                            <button key={m} onClick={() => setSelectedModel(m)} className={cn("text-xs font-bold p-3 rounded-xl text-left transition-all", selectedModel === m ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" : "bg-white/5 border border-white/5 text-zinc-400 hover:bg-white/10")}>{m}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activePanel === 'text' && (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-white">Yazı Atölyesi</h4>
                                        {(topText || bottomText) && <button onClick={() => {setTopText(''); setBottomText('');}} className="text-[9px] text-red-500 font-bold uppercase hover:text-red-400 transition-colors">Tümünü Sil</button>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <input 
                                            type="text" 
                                            value={topText} 
                                            onChange={e => setTopText(e.target.value)} 
                                            placeholder="Üst Metin (Örn: KRAL)..."
                                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-zinc-600"
                                        />
                                        <input 
                                            type="text" 
                                            value={bottomText} 
                                            onChange={e => setBottomText(e.target.value)} 
                                            placeholder="Alt Metin (Örn: LEO)..."
                                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-zinc-600"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Renk</span>
                                            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                                                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-0 p-0" />
                                                <span className="text-[10px] font-mono text-zinc-400">{textColor}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] text-white/40 uppercase font-black tracking-widest flex justify-between">Boyut <span className="text-cyan-400">{textSize}px</span></span>
                                            <input type="range" min="12" max="64" value={textSize} onChange={e => setTextSize(parseInt(e.target.value))} className="w-full accent-cyan-500 mt-2" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Font Stili</span>
                                            <div className="flex flex-col gap-1">
                                                {fonts.map(font => (
                                                    <button key={font.name} onClick={() => setTextFont(font.class)} className={cn("text-[10px] py-2 border rounded-lg transition-all", textFont === font.class ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold" : "border-white/10 text-white/50 hover:bg-white/5")}>{font.name}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activePanel === 'layout' && (
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-white mb-3 flex items-center justify-between">
                                            Konum (Baskı Bölgesi) <span className="text-cyan-400 text-[10px]">{printPosition.toUpperCase()}</span>
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => setPrintPosition('top-left')} className={cn("py-2 text-[9px] font-bold rounded-lg border transition-all", printPosition === 'top-left' ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' : 'border-white/10 text-white/50 hover:bg-white/5')}>Sol Üst (Cep)</button>
                                            <button onClick={() => setPrintPosition('top-right')} className={cn("py-2 text-[9px] font-bold rounded-lg border transition-all", printPosition === 'top-right' ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' : 'border-white/10 text-white/50 hover:bg-white/5')}>Sağ Üst</button>
                                            <button onClick={() => setPrintPosition('bottom-left')} className={cn("py-2 text-[9px] font-bold rounded-lg border transition-all", printPosition === 'bottom-left' ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' : 'border-white/10 text-white/50 hover:bg-white/5')}>Sol Alt</button>
                                            <button onClick={() => setPrintPosition('bottom-right')} className={cn("py-2 text-[9px] font-bold rounded-lg border transition-all", printPosition === 'bottom-right' ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' : 'border-white/10 text-white/50 hover:bg-white/5')}>Sağ Alt</button>
                                        </div>
                                        <button onClick={() => setPrintPosition('center')} className={cn("w-full mt-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all", printPosition === 'center' ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-white/10 text-white/50 hover:bg-white/5')}>
                                            Ana Merkez Göğüs
                                        </button>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-white mb-3 flex items-center justify-between">
                                            Baskı Boyutu <span className="text-cyan-400 text-[10px]">%{Math.round(printScale * 100)}</span>
                                        </h4>
                                        <input 
                                            type="range" min="0.5" max="1.5" step="0.1" 
                                            value={printScale} onChange={(e) => setPrintScale(parseFloat(e.target.value))}
                                            className="w-full accent-cyan-500"
                                            disabled={printPosition !== 'center'}
                                        />
                                        {printPosition !== 'center' && <span className="text-[9px] text-red-400 font-bold tracking-widest mt-1 block">Köşe logoları otomatize olarak %50'ye kilitlenir.</span>}
                                    </div>
                                </div>
                            )}
                            {activePanel === 'filter' && (
                                <div className="flex flex-col gap-3">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">Tasarım Filtreleri</h4>
                                    {filters.map(filter => (
                                        <button 
                                            key={filter.name} 
                                            onClick={() => setPrintFilter(filter.value)} 
                                            className={cn("text-xs font-bold p-3 rounded-xl text-left transition-all", printFilter === filter.value ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" : "bg-white/5 border border-white/5 text-zinc-400 hover:bg-white/10")}
                                        >
                                            {filter.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2. CENTER CANVAS */}
                <section className="flex-1 relative flex items-center justify-center p-8 lg:p-20">
                    <AnimatePresence mode="wait">
                        {isGenerating ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                className="flex flex-col items-center gap-6"
                            >
                                <div className="relative w-48 h-48">
                                    <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                                    <motion.div 
                                        className="absolute inset-0 border-4 border-t-cyan-500 rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-12 h-12 text-cyan-400 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">AI Renderlanıyor</h3>
                                    <p className="text-zinc-500 text-sm font-medium mt-2">Doku ve ışıklandırma hesaplanıyor...</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="main"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative w-full max-w-2xl aspect-square flex items-center justify-center"
                            >
                                {/* TEXTILE PREVIEW STAGE (The Real POD Canvas) */}
                                <div className={cn("relative w-full h-full rounded-[4rem] flex items-center justify-center overflow-hidden group shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] transition-colors duration-500", selectedColor === 'bg-white' ? 'bg-[#f0f0f0]' : selectedColor)}>
                                    
                                    {/* BLANK APPAREL MOCKUP (Folded Shirt) overlay pattern */}
                                    <img 
                                        src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200" 
                                        alt="Base Apparel"
                                        className="w-[90%] h-[90%] object-contain absolute mix-blend-multiply opacity-20 pointer-events-none"
                                    />

                                    {/* DESIGN BOUNDING BOX (For Logistical Coordinates) */}
                                    <div 
                                        className={cn("absolute border-2 border-dashed border-cyan-500/30 rounded-2xl flex flex-col items-center justify-center z-20 group-hover:border-cyan-500/80 transition-all duration-500 ease-in-out", 
                                            // The Base Size Class
                                            printPosition === 'center' ? "w-64 h-64" : "w-32 h-32",
                                            // Ensure the exact TOP and LEFT coordinates (Center base point for EVERYTHING)
                                            printPosition === 'center' ? "top-[50%] left-[50%]" : 
                                            printPosition === 'top-left' ? "top-[30%] left-[65%] sm:left-[60%]" : 
                                            printPosition === 'top-right' ? "top-[30%] left-[35%] sm:left-[40%]" : 
                                            printPosition === 'bottom-left' ? "top-[70%] left-[65%] sm:left-[60%]" : 
                                            "top-[70%] left-[35%] sm:left-[40%]" // bottom-right
                                        )}
                                        // The ONLY place we do translation so it NEVER clashes. ALWAYS translate -50% to make the above left/top coordinates act as absolute centers.
                                        style={{ 
                                            transform: `translate(-50%, -50%) scale(${printPosition === 'center' ? printScale : 0.8})`, 
                                            transformOrigin: 'center center' 
                                        }}
                                    >
                                        <div className="absolute -top-6 left-0 right-0 flex justify-between px-2 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-cyan-400 whitespace-nowrap">
                                            <span>{printPosition === 'center' ? `ALAN: ${Math.round(20 * printScale)}x${Math.round(20 * printScale)}cm` : 'ÖZEL KÖŞE LOGOSU'}</span>
                                        </div>
                                        
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2 gap-1 z-30">
                                            {/* TEXT TOP OVERLAY */}
                                            {topText && (
                                                <div 
                                                    className={cn("w-[120%] text-center mix-blend-multiply flex-shrink-0 tracking-wide break-words drop-shadow-sm", textFont)} 
                                                    style={{ color: textColor, fontSize: `${printPosition === 'center' ? textSize : textSize/2}px`, lineHeight: 1.1 }}
                                                >
                                                    {topText}
                                                </div>
                                            )}

                                            {/* AI GENERATED GRAPHIC */}
                                            {printDesign ? (
                                                <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
                                                    <img 
                                                        src={printDesign}
                                                        style={{ filter: printFilter }}
                                                        className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm transition-all"
                                                        alt="Print Graphic"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                                                    <Box className="w-6 h-6 sm:w-8 sm:h-8 mb-2 mx-auto" />
                                                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center">Henüz Grafik <br/> Üretilmedi</p>
                                                </div>
                                            )}

                                            {/* TEXT BOTTOM OVERLAY */}
                                            {bottomText && (
                                                <div 
                                                    className={cn("w-[120%] text-center mix-blend-multiply flex-shrink-0 tracking-wide break-words drop-shadow-sm", textFont)} 
                                                    style={{ color: textColor, fontSize: `${printPosition === 'center' ? textSize : textSize/2}px`, lineHeight: 1.1 }}
                                                >
                                                    {bottomText}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* HUD OVERLAY ON CANVAS */}
                                    <div className="absolute top-8 right-8 flex flex-col gap-3 z-40">
                                        <CanvasActionIcon icon={Maximize2} />
                                        <CanvasActionIcon icon={RefreshCcw} />
                                    </div>

                                    <div className="absolute bottom-8 inset-x-8 flex flex-col gap-2 z-40">
                                        <div className="self-start px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-cyan-500/30 text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-mono shadow-xl">
                                            ZON: {printPosition.toUpperCase()} | SCALE: {printScale.toFixed(1)}x
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* 3. RIGHT CONTROLS */}
                <aside className="w-full lg:w-[400px] border-l border-white/5 bg-black/20 backdrop-blur-xl p-8 flex flex-col gap-8 z-20 overflow-y-auto no-scrollbar">
                    
                    {/* LOGISTICS INFO */}
                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 flex flex-col gap-2">
                        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Layers className="w-3 h-3" /> Baskı Uyumluluğu: Hazır
                        </h4>
                        <p className="text-xs text-zinc-400">Üretilen grafik (motif) özel DTF yazıcı formatında (arkası saydam) doğrudan imalathaneye iletilecektir. Hedef alan: Göğüs Merkezi.</p>
                    </div>

                    {/* AI COMMANDS & UPLOAD */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center justify-between">
                            <span>Tasarım Oluştur</span>
                        </h4>
                        <div className="relative group">
                            <textarea 
                                value={activePrompt}
                                onChange={(e) => setActivePrompt(e.target.value)}
                                placeholder="Yapay zeka ile tasarla (Örn: Neo-noir bir kedi)..."
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none transition-all placeholder:text-zinc-600"
                            />
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            <button 
                                onClick={generateAIModel}
                                disabled={isGenerating || !activePrompt}
                                className="col-span-3 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center gap-2 group active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                <Zap className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-black uppercase text-[10px] sm:text-xs tracking-widest">AI ile Üret</span>
                            </button>

                            <input type="file" id="upload-image" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            <button 
                                onClick={() => document.getElementById('upload-image')?.click()}
                                className="col-span-2 h-12 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-colors group"
                            >
                                <Upload className="w-4 h-4 text-white/50 group-hover:text-cyan-400" />
                                <span className="text-white font-bold text-[10px] sm:text-xs text-white/70 group-hover:text-cyan-400 uppercase">Yükle</span>
                            </button>
                        </div>
                        
                        <p className="text-[9px] text-zinc-500 text-center px-4 leading-relaxed">
                            Fotoğraf yüklediğinizde dahi sistemdeki tüm Font, Filtre ve Boyutlandırma araçları kusursuz şekilde çalışmaya devam eder.
                        </p>
                    </div>

                    {/* GALLERY / RECENT HISTORY */}
                    {history.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h4 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Son Üretimler</h4>
                            <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar">
                                {history.map((url, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => setPrintDesign(url)}
                                        className="w-16 h-16 bg-white rounded-xl border border-white/10 shrink-0 overflow-hidden hover:border-cyan-400 transition-all focus:outline-none"
                                    >
                                        <img src={url} className="w-full h-full object-cover mix-blend-multiply" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* KOLEKSİYON (GARDIROP) */}
                    {wardrobe.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h4 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Koleksiyonum (Gardırop)</h4>
                            <div className="grid grid-cols-4 gap-2">
                                {wardrobe.slice(0, 4).map((item) => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => setPrintDesign(item.image)}
                                        className="aspect-square bg-white border-2 border-transparent rounded-xl shrink-0 overflow-hidden hover:border-purple-500 transition-all focus:outline-none relative group"
                                        title="Bu tasarımı tuvale geri yükle"
                                    >
                                        <img src={item.image} className="w-full h-full object-cover mix-blend-multiply" />
                                        <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/20 transition-all flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* OPTIONS */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <OptionRow icon={Download} label="Grafiği Bilgisayara İndir (.PNG)" onClick={handleDownloadGraphic} />
                        <OptionRow icon={Save} label="Gardıroba Kaydet" onClick={handleSaveToWardrobe} />
                    </div>
                </aside>

                {/* SUCCESS TOAST BILDIRIMI */}
                <AnimatePresence>
                    {isSuccessToast && (
                        <motion.div
                            initial={{ opacity: 0, y: -50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 30, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            className="fixed top-0 left-0 right-0 z-[200] flex justify-center pointer-events-none"
                        >
                            <div className="bg-green-500 text-black px-6 py-3 rounded-full font-black text-xs lg:text-sm uppercase tracking-widest flex items-center gap-3 shadow-[0_10px_40px_rgba(34,197,94,0.4)] border border-white/20">
                                <span className="w-6 h-6 bg-black/20 rounded-full flex items-center justify-center text-xs">📦</span>
                                Tasarım Üretim Sepetine Bırakıldı!
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CHECKOUT / BEDEN MODALI */}
                <AnimatePresence>
                    {isCheckoutModalOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:pl-32"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 30 }}
                                className="w-full max-w-md bg-[#0a0a0a] border border-white/10 shadow-[0_0_100px_rgba(34,211,238,0.15)] rounded-3xl overflow-hidden flex flex-col"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black italic tracking-tighter uppercase">Üretim Onayı</h3>
                                        <p className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">Lojistik Verisi Sağlanıyor</p>
                                    </div>
                                    <button onClick={() => setIsCheckoutModalOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                                        <X className="w-5 h-5 text-zinc-500" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col gap-6">
                                    {/* Preview Banner */}
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                                        <div className="w-16 h-16 bg-black/50 rounded-xl border border-white/5 overflow-hidden p-2 flex items-center justify-center">
                                            <img src={printDesign!} className="w-full h-full object-contain mix-blend-screen" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-white">{selectedModel}</h4>
                                            <p className="text-[10px] text-cyan-400 mt-1 uppercase font-black tracking-widest">
                                                {printPosition === 'center' ? 'Göğüs Merkez' : printPosition.includes('top') ? 'Cep Logosu' : 'Alt Merkez'} Baskı
                                            </p>
                                            <p className="text-[10px] text-zinc-500 mt-1">Lojistik Kalitesi: Mükemmel</p>
                                        </div>
                                    </div>

                                    {/* Sizes */}
                                    <div>
                                        <h4 className="text-xs font-black text-white/50 uppercase tracking-widest mb-3">Beden Seçimi <span className="text-red-500">*</span></h4>
                                        <div className="flex items-center gap-2">
                                            {sizes.map(size => (
                                                <button 
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={cn("flex-1 h-12 rounded-xl border-2 font-bold transition-all text-sm", selectedSize === size ? "bg-cyan-500 text-black border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]" : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-white")}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price / Action */}
                                    <div className="pt-2 border-t border-white/5 flex items-center justify-between mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Nihai Tutar</span>
                                            <span className="text-3xl font-black text-white tracking-tighter">1.499<span className="text-xl">₺</span></span>
                                        </div>
                                        <button 
                                            onClick={handleCompleteOrder}
                                            className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2"
                                        >
                                            <ShoppingBag className="w-5 h-5" /> Sepete Ekle
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}

function ToolbarIcon({ icon: Icon, active, label, onClick }: any) {
    return (
        <button onClick={onClick} className={cn(
            "w-12 h-12 flex flex-col items-center justify-center gap-1 transition-all group",
            active ? "text-cyan-400" : "text-zinc-600 hover:text-white"
        )}>
            <Icon className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
        </button>
    );
}

function CanvasActionIcon({ icon: Icon }: any) {
    return (
        <button className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/60 hover:text-white">
            <Icon className="w-5 h-5" />
        </button>
    );
}

function OptionRow({ icon: Icon, label, onClick }: any) {
    return (
        <button onClick={onClick} className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all text-zinc-400 hover:text-white group">
            <div className="flex items-center gap-3 text-sm font-bold">
                <Icon className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                <span>{label}</span>
            </div>
            <ChevronLeft className="w-4 h-4 rotate-180 opacity-20" />
        </button>
    );
}
