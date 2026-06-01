import { Check, Truck, CreditCard, Share2 } from "lucide-react";
import { useEffect } from "react";

export function OrderSummary({ product, designState, onEdit }: { product: any, designState: any, onEdit: () => void }) {

    useEffect(() => {
        // Celebration logic can be added here later
    }, []);

    return (
        <div className="h-full bg-card dark:bg-black flex flex-col pt-24 px-6 pb-8 animate-in slide-in-from-bottom duration-500">

            {/* Success Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-black text-foreground dark:text-white">Harika Görünüyor! 🎨</h1>
                <p className="text-sm text-gray-500">Tasarımın üretime hazır hale getirildi.</p>
            </div>

            {/* Mockup Preview Card */}
            <div className="bg-[#F5F5FA] dark:bg-gray-900 rounded-[2rem] p-8 mb-6 relative overflow-hidden flex items-center justify-center border border-card-border dark:border-gray-800 shadow-inner">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                <img src={product.img} className="w-48 h-48 object-contain drop-shadow-2xl relative z-10" />
                {/* Visual indication of design placement */}
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-dashed border-[#5B4D9D]/30 rounded-lg flex items-center justify-center bg-white/50 backdrop-blur-sm z-20">
                    <span className="text-[10px] font-bold text-[#5B4D9D]">Senin Tasarımın</span>
                </div>
                <button onClick={onEdit} className="absolute top-4 right-4 text-xs font-bold text-gray-500 underline z-30">Düzenle</button>
            </div>

            {/* Order Details */}
            <div className="bg-card dark:bg-black rounded-2xl border border-card-border dark:border-gray-800 p-4 mb-6 shadow-moffi-card">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Ürün</span>
                    <span className="text-sm font-bold text-foreground dark:text-white">{product.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Beden</span>
                    <span className="text-sm font-bold text-foreground dark:text-white">Medium (Köpek)</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">Kargo</span>
                    <span className="text-sm font-bold text-green-600 flex items-center gap-1"><Truck className="w-3 h-3" /> Ücretsiz</span>
                </div>
                <div className="border-t border-card-border dark:border-gray-800 pt-2 flex justify-between items-center">
                    <span className="text-base font-bold text-foreground dark:text-white">Toplam</span>
                    <span className="text-xl font-black text-[#5B4D9D]">299,90 TL</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-auto">
                <button className="w-full bg-black dark:bg-card text-white dark:text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition">
                    <CreditCard className="w-5 h-5" /> Sepete Ekle
                </button>
                <button className="w-full bg-[#F0F0F5] dark:bg-gray-800 text-foreground dark:text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                    <Share2 className="w-5 h-5" /> Tasarımı Paylaş
                </button>
            </div>
        </div>
    );
}
