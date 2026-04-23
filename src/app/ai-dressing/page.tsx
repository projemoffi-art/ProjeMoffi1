"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Sparkles, Box, Camera, Info, Layers, Maximize, Wand2, Share2, Star, Zap, Scissors, Check, X, Crop, Move3d, SunMedium } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocial } from "@/context/SocialContext";

// Mock Data for Clothes - Premium Images (More items for Carousel)
const OUTFITS = [
    { id: 1, name: "Urban Hoodie", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=200&auto=format&fit=crop", type: 'top', color: "#3B82F6", price: "450₺" },
    { id: 2, name: "Rain Coat Pro", image: "https://images.unsplash.com/photo-1545636049-74e6f4a86b3e?q=80&w=200&auto=format&fit=crop", type: 'full', color: "#F59E0B", price: "620₺" },
    { id: 3, name: "Cozy Pajamas", image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=200&auto=format&fit=crop", type: 'bottom', color: "#1F2937", price: "300₺" },
    { id: 4, name: "Winter Knit", image: "https://images.unsplash.com/photo-1615266895738-11f1371cd7e5?q=80&w=200&auto=format&fit=crop", type: 'top', color: "#EF4444", price: "550₺" },
    { id: 5, name: "Space Suit", image: "https://images.unsplash.com/photo-1545249390-6bdfa2a27cce?q=80&w=200&auto=format&fit=crop", type: 'costume', color: "#6366F1", price: "1200₺" },
    { id: 6, name: "Summer Vibes", image: "https://images.unsplash.com/photo-1591871937573-74dbba515c4c?q=80&w=200&auto=format&fit=crop", type: 'top', color: "#EC4899", price: "250₺" },
];

// --- Inline Components (Replacing missing ai-dressing module imports) ---
function OutfitCarousel({ outfits, selectedId, onSelect }: { outfits: any[]; selectedId?: number; onSelect: (o: any) => void }) {
    return (
        <div className="flex gap-3 px-6 overflow-x-auto no-scrollbar pb-2">
            {outfits.map(o => (
                <button key={o.id} onClick={() => onSelect(o)}
                    className={`shrink-0 w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all ${
                        selectedId === o.id ? 'border-indigo-500 scale-105 shadow-lg' : 'border-transparent opacity-60'
                    }`}>
                    <img src={o.image} className="w-full h-full object-cover" />
                </button>
            ))}
        </div>
    );
}

function SmartSuggestions({ petName }: { petName: string }) {
    return (
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur rounded-2xl p-3">
            <p className="text-white text-xs font-bold">✨ {petName} için önerilen: Urban Hoodie</p>
        </div>
    );
}

function ResultOverlay({ resultImage, originalImage, onClose, onShare }: { resultImage: string; originalImage: string; onClose: () => void; onShare: (p: string) => void }) {
    return (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-4">
            <img src={resultImage || originalImage} className="w-64 h-64 object-cover rounded-3xl" />
            <button onClick={onClose} className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm">Kapat</button>
        </div>
    );
}

interface MiniGameProps {
    onComplete: () => void;
}

function LoadingMiniGame({ onComplete }: MiniGameProps) {
    const [score, setScore] = useState(0);
    const [bubbles, setBubbles] = useState<{ id: number, x: number, y: number, icon: any }[]>([]);

    // Spawn bubbles periodically
    useEffect(() => {
        const interval = setInterval(() => {
            const icons = [Star, Zap, Scissors, Sparkles];
            const randomIcon = icons[Math.floor(Math.random() * icons.length)];

            const newBubble = {
                id: Date.now(),
                x: Math.random() * 80 + 10,
                y: Math.random() * 60 + 20,
                icon: randomIcon
            };

            setBubbles(prev => [...prev.slice(-4), newBubble]);
        }, 600);
        return () => clearInterval(interval);
    }, []);

    const popBubble = (id: number) => {
        setBubbles(prev => prev.filter(b => b.id !== id));
        setScore(prev => prev + 1);
    };

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500">
            <div className="absolute top-10 text-center z-20 pointer-events-none">
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 animate-pulse">
                    Moffi AI Model v1.0
                </h3>
                <p className="text-white/60 text-xs mt-2 uppercase tracking-[0.2em]">Stil Hesaplanıyor...</p>
            </div>

            <div className="absolute top-24 bg-white/10 border border-white/20 rounded-full px-4 py-1 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-white font-bold font-mono text-lg">{score * 150}</span>
            </div>

            <div className="absolute inset-0 w-full h-full">
                {bubbles.map(bubble => (
                    <button
                        key={bubble.id}
                        onClick={() => popBubble(bubble.id)}
                        className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-bounce hover:scale-110 active:scale-90 transition-all cursor-pointer"
                        style={{ left: `${bubble.x}%`, top: `${bubble.y}%`, animationDuration: '3s' }}
                    >
                        <bubble.icon className="w-8 h-8 drop-shadow-lg" />
                    </button>
                ))}
            </div>

            <div className="absolute bottom-10 w-64 h-2 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[width_5s_linear_forwards]" style={{ width: '0%' }} />
            </div>
            <div className="absolute bottom-14 text-xs text-white/40 font-mono">
                %{(score * 5) + Math.floor(Math.random() * 10)} PROCESSING
            </div>
        </div>
    );
}

export default function AIDressingPage() {
    const router = useRouter();
    const { addMoffiPoints } = useSocial(); // Hook Integration

    // States
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedOutfit, setSelectedOutfit] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'2d' | '3d'>('2d');
    const [showResultOverlay, setShowResultOverlay] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Demo Image
    useEffect(() => {
        if (!selectedImage) {
            setSelectedImage("https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=600&auto=format&fit=crop");
        }
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setSelectedImage(ev.target?.result as string);
                setGeneratedResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    // --- MOCK API LAYER (Integration Point) ---
    // ENTEGRASYON İÇİN: Bu fonksiyonu backend isteğinizle değiştirin.
    const generateOutfitImage = async (userImage: string, outfitId: number): Promise<string> => {
        /*
        // --- REAL API EXAMPLE ---
        const response = await fetch('https://api.moffi.com/v1/virtual-try-on', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: userImage, // Base64 string
                outfit_id: outfitId,
                mode: 'high-quality' 
            })
        });
        
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.result_url; // Örnek: "https://cdn.moffi.com/results/abc1234.jpg"
        */

        // --- CURRENT MOCK SIMULATION ---
        return new Promise((resolve) => {
            setTimeout(() => {
                // Demo modunda, kıyafetin kendi görselini "sonuç" gibi döndürüyoruz veya flag kullanıyoruz.
                // Gerçek entegrasyonda burası URL dönmeli.
                resolve("simulated_result_active");
            }, 5000);
        });
    };

    const handleGenerate = async () => {
        if (!selectedOutfit || !selectedImage) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateOutfitImage(selectedImage, selectedOutfit.id);
            setGeneratedResult(result);

            // Award Moffi Points
            addMoffiPoints(20, "AI Stil Denemesi ✨");
            setShowResultOverlay(true);
        } catch (err) {
            console.error(err);
            setError("Bağlantı hatası. Lütfen tekrar deneyin.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper to determine which image to show
    const getDisplayImage = () => {
        if (generatedResult) {
            // If it's our demo flag, show the outfit's catalog image as a placeholder result
            if (generatedResult === "simulated_result_active") {
                return selectedOutfit?.image || selectedImage;
            }
            // If it's a real URL from a real API, show it directly
            return generatedResult;
        }
        return selectedImage || "";
    };

    return (
        <main className="h-screen bg-[#F8F9FB] dark:bg-[#050505] max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans flex flex-col">

            {/* --- TOP HEADER (Floating) --- */}
            <header className="absolute top-0 w-full z-40 px-6 py-6 flex items-center justify-between pointer-events-none">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition border border-white/20 dark:border-white/10 shadow-lg text-gray-700 dark:text-gray-200 pointer-events-auto"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center pointer-events-auto">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest bg-white/80 dark:bg-black/60 px-2 py-0.5 rounded-full backdrop-blur">Stage</span>
                    <h1 className="text-sm font-black text-gray-800 dark:text-white mt-0.5">Zeytin</h1>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    <button
                        onClick={() => { setSelectedImage(null); setGeneratedResult(null); setSelectedOutfit(null); }}
                        className="w-10 h-10 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition border border-white/20 dark:border-white/10 shadow-lg text-gray-700 dark:text-gray-200"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* --- DYNAMIC STAGE (Main Canvas) --- */}
            <div className="flex-1 relative w-full h-full overflow-hidden">

                {/* Adaptive Background Blur */}
                <div className="absolute inset-0">
                    <img src={getDisplayImage()}
                        className="w-full h-full object-cover opacity-30 dark:opacity-20 blur-[50px] scale-125 transition-all duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#F8F9FB]/80 via-transparent to-[#F8F9FB] dark:from-[#050505]/80 dark:to-[#050505]" />
                </div>

                {/* Main Image Stage */}
                <div className="absolute inset-0 flex flex-col items-center pt-24 pb-48 px-6">
                    {selectedImage ? (
                        <div
                            className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-700 group ring-8 ring-white/50 dark:ring-white/5"
                            onMouseMove={(e) => {
                                if (mode !== '3d') return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = (e.clientX - rect.left) / rect.width - 0.5;
                                const y = (e.clientY - rect.top) / rect.height - 0.5;
                                e.currentTarget.style.transform = `perspective(1000px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg)`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
                            }}
                            style={{ transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)', transformStyle: 'preserve-3d' }}
                        >
                            <img
                                src={getDisplayImage()}
                                className="w-full h-full object-cover"
                            />

                            {/* Smart Suggestions Overlay */}
                            {!generatedResult && !isGenerating && <SmartSuggestions petName="Zeytin" />}

                            {/* Demo Mode Badge */}
                            {generatedResult && (
                                <div className="absolute top-6 right-6 z-30 animate-in fade-in duration-700">
                                    <div className="bg-black/50 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                                        <Wand2 className="w-3 h-3 text-yellow-400" /> AI Generated
                                    </div>
                                </div>
                            )}

                            {/* Load Game UI */}
                            {isGenerating && <LoadingMiniGame onComplete={() => { }} />}

                            {/* Error Overlay */}
                            {error && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-8 animate-in zoom-in-95 text-white">
                                    <h3 className="font-bold text-lg mb-2">Ops!</h3>
                                    <p className="opacity-60 text-sm mb-6">{error}</p>
                                    <button onClick={() => setError(null)} className="px-6 py-2 bg-white text-black rounded-xl font-bold text-xs">Tekrar Dene</button>
                                </div>
                            )}

                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-full rounded-[2.5rem] border-4 border-dashed border-gray-300 dark:border-gray-800 bg-white/20 dark:bg-white/5 flex flex-col items-center justify-center gap-4 hover:bg-white/40 dark:hover:bg-white/10 transition"
                        >
                            <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Camera className="w-8 h-8 text-indigo-500" />
                            </div>
                            <span className="font-bold text-gray-500 dark:text-gray-400">Fotoğraf Ekle</span>
                        </button>
                    )}
                </div>

                {/* --- FLOATING AI TOOLS (Right) --- */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 py-4 z-40">
                    {[
                        { icon: Move3d, label: "3D", active: mode === '3d', onClick: () => setMode(prev => prev === '3d' ? '2d' : '3d') },
                        { icon: Crop, label: "Crop" },
                        { icon: Wand2, label: "Magic" },
                        { icon: SunMedium, label: "Light" },
                        { icon: Layers, label: "Bg" },
                    ].map((tool, i) => (
                        <div key={i} className="group relative flex items-center justify-end">
                            <span className="absolute right-12 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                {tool.label}
                            </span>
                            <button
                                onClick={tool.onClick}
                                className={cn(
                                    "w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all shadow-lg active:scale-95",
                                    tool.active
                                        ? "bg-indigo-600 border-indigo-500 text-white"
                                        : "bg-white/80 dark:bg-black/40 border-white/40 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-black hover:text-indigo-600"
                                )}
                            >
                                <tool.icon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- BOTTOM SHEET (Netflix Carousel) --- */}
            <div className="absolute bottom-0 w-full z-50 animate-in slide-in-from-bottom duration-700">
                {/* Gradient Mask */}
                <div className="h-12 w-full bg-gradient-to-t from-[#F8F9FB] to-transparent dark:from-[#050505] absolute -top-12 pointer-events-none" />

                <div className="bg-[#F8F9FB] dark:bg-[#050505] pb-6 pt-2">
                    {/* Header Controls */}
                    <div className="flex justify-between items-center px-8 mb-2">
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-200">Stil Seçimi</h2>
                        {selectedOutfit && !isGenerating && !generatedResult && (
                            <button
                                onClick={handleGenerate}
                                className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
                            >
                                <Sparkles className="w-3 h-3" /> AI ile Dene
                            </button>
                        )}
                        {generatedResult && (
                            <button
                                onClick={() => setShowResultOverlay(true)}
                                className="bg-green-500 text-white px-4 h-9 rounded-full font-bold text-xs flex items-center justify-center gap-1 hover:scale-105 shadow-green-500/30 animate-pulse"
                            >
                                <Check className="w-4 h-4" /> Sonucu Gör
                            </button>
                        )}
                    </div>

                    {/* Carousel Component */}
                    <OutfitCarousel
                        outfits={OUTFITS}
                        selectedId={selectedOutfit?.id}
                        onSelect={(outfit) => { setSelectedOutfit(outfit); setGeneratedResult(null); }}
                    />
                </div>
            </div>

            {/* --- PREMIUM RESULT OVERLAY --- */}
            {showResultOverlay && generatedResult && selectedImage && (
                <ResultOverlay
                    resultImage={generatedResult === "simulated_result_active" && selectedOutfit ? selectedOutfit.image : ""}
                    originalImage={selectedImage}
                    onClose={() => setShowResultOverlay(false)}
                    onShare={(platform) => console.log("Shared to", platform)}
                />
            )}

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
        </main>
    );
}
