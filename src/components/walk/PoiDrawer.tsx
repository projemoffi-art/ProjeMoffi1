
import { Star, Navigation, X, MapPin, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

// Extracted UI Function for cleaner Main Component
export function showPoiDrawer(
    selectedPOI: any,
    activeTab: 'details' | 'reviews',
    setActiveTab: (tab: 'details' | 'reviews') => void,
    onNavigate: () => void,
    onClose: () => void
) {
    return (
        <div className="absolute bottom-0 w-full bg-card dark:bg-slate-900 rounded-t-[2.5rem] p-6 pt-2 shadow-[0_-10px_50px_rgba(0,0,0,0.2)] z-[60] animate-in slide-in-from-bottom duration-500">
            {/* Handle Bar */}
            <div className="w-full flex justify-center py-4 cursor-pointer" onClick={onClose}>
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-slate-800 overflow-hidden shadow-md">
                        {selectedPOI.image ? (
                            <img src={selectedPOI.image} alt={selectedPOI.name} className="w-full h-full object-cover" />
                        ) : (
                            <Star className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-foreground dark:text-white text-2xl tracking-tight">{selectedPOI.name}</h3>
                            <div className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Açık</div>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{selectedPOI.category} • {selectedPOI.distance}</p>
                        <div className="flex items-center gap-1">
                            <div className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn("w-3.5 h-3.5 fill-current", i < Math.floor(selectedPOI.rating) ? "text-yellow-500" : "text-gray-300 dark:text-foreground")} />
                                ))}
                            </div>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 ml-1">({selectedPOI.rating})</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full hover:bg-gray-100 transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-card-border dark:border-slate-800 mb-6">
                <button
                    onClick={() => setActiveTab('details')}
                    className={cn("pb-3 text-sm font-bold border-b-2 transition-all", activeTab === 'details' ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-400")}
                >
                    Hakkında
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={cn("pb-3 text-sm font-bold border-b-2 transition-all", activeTab === 'reviews' ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-400")}
                >
                    Yorumlar ({selectedPOI.reviews ? selectedPOI.reviews.length : 0})
                </button>
            </div>

            {/* Content */}
            <div className="h-32 overflow-y-auto mb-6">
                {activeTab === 'details' ? (
                    <div>
                        {selectedPOI.deal && (
                            <div className="mb-4 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 p-3 rounded-xl border border-orange-200 dark:border-orange-800 flex items-center gap-3">
                                <div className="w-8 h-8 bg-card dark:bg-black rounded-full flex items-center justify-center shadow-moffi-card">
                                    <Ticket className="w-4 h-4 text-orange-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 mb-0.5">Günün Fırsatı</div>
                                    <div className="text-sm font-bold text-foreground dark:text-white">{selectedPOI.deal}</div>
                                </div>
                            </div>
                        )}

                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            {selectedPOI.description || "Bu mekan hakkında henüz detaylı bilgi girilmemiş. Ancak kullanıcı puanları oldukça yüksek görünüyor."}
                        </p>
                        <div className="mt-4 flex gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                                <MapPin className="w-3.5 h-3.5" /> Kadıköy, İstanbul
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {selectedPOI.reviews && selectedPOI.reviews.length > 0 ? selectedPOI.reviews.map((review: any, i: number) => (
                            <div key={i} className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-foreground dark:text-white">{review.user}</span>
                                    <div className="flex text-yellow-400"><Star className="w-3 h-3 fill-current" /> <span className="text-[10px] ml-1 text-gray-500">{review.rating}</span></div>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300">{review.comment}</p>
                            </div>
                        )) : (
                            <div className="text-center text-gray-400 text-sm py-4">Henüz yorum yapılmamış.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Action */}
            <button
                onClick={onNavigate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 group"
            >
                <Navigation className="w-5 h-5 fill-current" />
                <span>Ziyaret Et & <span className="text-yellow-300">50 MP Kazan</span></span>
            </button>
        </div>
    );
}
