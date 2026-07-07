export function Recommendations() {
    return (
        <div className="mt-4 px-6 mb-24"> {/* Margin bottom for nav bar */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-moffi-text">Size Özel Öneriler</h3>
                <button className="text-xs text-moffi-gray font-medium hover:text-moffi-primary">Tümünü Gör</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Card 1 */}
                <div className="rounded-2xl p-4 bg-gray-100 h-40 relative overflow-hidden flex flex-col justify-end">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <span className="relative z-10 text-xs font-bold text-moffi-text line-clamp-2">
                        AI Tasarımcı Gerçek Dönüşüyor!
                    </span>
                    <span className="relative z-10 text-[10px] text-moffi-text/80 mt-1">
                        Moffi Shop'ta Yeni Ürünler
                    </span>
                </div>

                {/* Card 2 */}
                <div className="rounded-2xl p-4 bg-moffi-green/20 h-40 relative overflow-hidden flex flex-col justify-end">
                    <div className="w-8 h-8 rounded-full bg-white/50 mb-auto flex items-center justify-center text-moffi-primary font-bold">
                        ♥
                    </div>

                    <span className="text-xs font-bold text-moffi-text leading-tight">
                        Irk Bazlı Sağlık Asistanı:
                    </span>
                    <span className="text-[10px] text-moffi-text/80 mt-1">
                        Bilgi & Öneriler
                    </span>
                </div>
            </div>
        </div>
    );
}
