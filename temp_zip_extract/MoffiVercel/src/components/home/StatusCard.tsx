import { Footprints, Stethoscope, Sparkles } from "lucide-react";

export function StatusCard() {
    return (
        <div className="mx-6 mt-4 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#bef7cd] via-[#dcfce7] to-[#f0fdf4] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
            {/* Decorative background circles */}
            <div className="absolute top-4 right-4 w-4 h-4 bg-white/60 rounded-full blur-[1px]" />
            <div className="absolute top-12 right-12 w-2 h-2 bg-white/40 rounded-full blur-[1px]" />
            <div className="absolute bottom-8 right-8 w-16 h-16 bg-white/20 rounded-full blur-xl" />

            {/* Header Text */}
            <div className="relative z-10 mb-6">
                <h2 className="text-2xl font-black text-moffi-text leading-tight w-3/4">
                    <Footprints className="inline-block w-6 h-6 mr-2 text-moffi-text mb-1" />
                    Bugün Mutlu Görünüyor! 🎉
                </h2>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-3 h-3 rounded-full bg-moffi-primary" />
                    <span className="text-sm font-medium text-moffi-gray">MoffiPuan: 1250 XP</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 bg-card py-3 px-4 rounded-xl shadow-moffi-card active:scale-95 transition-transform">
                    <Footprints className="w-5 h-5 text-moffi-primary" />
                    <span className="font-bold text-moffi-text text-sm whitespace-nowrap">Moffi Walk'a Başla</span>
                </button>
                <button className="flex items-center justify-center gap-2 bg-card py-3 px-4 rounded-xl shadow-moffi-card active:scale-95 transition-transform">
                    <Stethoscope className="w-5 h-5 text-teal-600" />
                    <span className="font-bold text-moffi-text text-sm whitespace-nowrap">Vet Randevusu</span>
                </button>
            </div>
        </div>
    );
}
