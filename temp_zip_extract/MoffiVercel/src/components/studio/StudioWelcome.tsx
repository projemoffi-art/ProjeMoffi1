
import { ArrowRight, Shirt, Dog, Package, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";

const RECENT_DESIGNS = [
    { id: 1, img: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=200", name: "Max Hoodie" },
    { id: 2, img: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=200", name: "Bandana" },
];

export function StudioWelcome({ onStart }: { onStart: () => void }) {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col pt-12 px-6 pb-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => router.back()} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition">İptal</button>
                <div className="text-xs font-bold text-[#5B4D9D] uppercase tracking-[0.2em]">Moffi Studio</div>
            </div>

            {/* Hero Title */}
            <div className="mb-8">
                <h1 className="text-4xl font-black text-foreground dark:text-white leading-[1.1] mb-4">
                    Hayalindeki <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B4D9D] to-purple-400">Tasarımı</span> <br /> Yarat.
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    Profesyonel araçlarla köpeğin için tamamen benzersiz ürünler tasarla. Limitsiz yaratıcılık.
                </p>
            </div>

            {/* Hero Visual */}
            <div className="bg-card dark:bg-gray-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden mb-8 h-64 flex items-center justify-center group cursor-pointer" onClick={onStart}>
                <div className="absolute inset-0 bg-gradient-to-br from-[#F5F5FA] to-white dark:from-gray-800 dark:to-black opacity-50" />
                <img
                    src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=600&auto=format&fit=crop"
                    className="w-48 h-48 object-cover rounded-2xl shadow-2xl relative z-10 rotate-[-5deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-500"
                    alt="Hero"
                />
                <div className="absolute bottom-6 right-6 bg-black text-white p-3 rounded-full z-20 shadow-lg group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-5 h-5" />
                </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                    { name: "Sweatshirt", icon: Shirt, color: "bg-blue-50 text-blue-600" },
                    { name: "Bandana", icon: Ticket, color: "bg-orange-50 text-orange-600" },
                    { name: "Mama Kabı", icon: Package, color: "bg-green-50 text-green-600" },
                    { name: "Tasma", icon: Dog, color: "bg-pink-50 text-pink-600" }
                ].map((cat, i) => (
                    <button key={i} onClick={onStart} className="bg-card dark:bg-gray-900 p-4 rounded-2xl shadow-moffi-card border border-card-border dark:border-gray-800 flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all text-left">
                        <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}>
                            <cat.icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-foreground dark:text-gray-200">{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Previous Designs */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Son Tasarımlar</h3>
                <div className="flex gap-4">
                    {RECENT_DESIGNS.map(design => (
                        <div key={design.id} className="w-20 h-20 rounded-2xl overflow-hidden relative shadow-md border-2 border-white dark:border-gray-700">
                            <img src={design.img} className="w-full h-full object-cover" />
                        </div>
                    ))}
                    <button onClick={onStart} className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <span className="text-xs font-bold">+ Yeni</span>
                    </button>
                </div>
            </div>

            {/* Start Button */}
            <button onClick={() => { console.log('Start Clicked'); onStart(); }} className="mt-8 w-full bg-[#5B4D9D] text-white py-4 rounded-[1.5rem] font-bold text-lg shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                Hemen Başla <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    );
}
