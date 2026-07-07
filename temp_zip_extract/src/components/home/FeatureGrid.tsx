import { Shirt, BrainCircuit, Navigation, Palette } from "lucide-react";
import Link from "next/link";

const features = [
    {
        title: "AI Giydir",
        icon: Shirt,
        color: "bg-green-100",
        iconColor: "text-green-600",
    },
    {
        title: "Karakter Analizi",
        icon: BrainCircuit,
        color: "bg-orange-100",
        iconColor: "text-orange-500",
    },
    {
        title: "MoffiWalk",
        icon: Navigation,
        color: "bg-blue-100",
        iconColor: "text-blue-500",
    },
    {
        title: "Stüdyo Tasarım",
        icon: Palette,
        color: "bg-purple-100",
        iconColor: "text-purple-500",
    }
];

export function FeatureGrid() {
    return (
        <div className="grid grid-cols-4 gap-4 px-6 mt-6">
            {features.map((feature, index) => (
                <Link
                    href={feature.title === "Stüdyo Tasarım" ? "/studio" : feature.title === "MoffiWalk" ? "/walk" : feature.title === "AI Giydir" ? "/ai-dressing" : "#"}
                    key={index}
                    className="flex flex-col items-center gap-2 group"
                >
                    <div className={`${feature.color} p-4 rounded-2xl w-full aspect-square flex items-center justify-center shadow-sm group-active:scale-95 transition-transform`}>
                        <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-bold text-center text-moffi-gray leading-tight px-1">
                        {feature.title}
                    </span>
                </Link>
            ))}
        </div>
    );
}
