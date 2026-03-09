"use client";

import { Home, ShoppingBag, User, Gamepad2, Compass, Hexagon, Utensils } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface BottomNavProps {
    active?: 'home' | 'explore' | 'community' | 'game' | 'food' | 'profile';
    className?: string;
}

// Routes where BottomNav should be hidden
const HIDDEN_ROUTES = ['/studio', '/walk', '/login', '/signup', '/register', '/business-register', '/lab', '/production-studio'];

export function BottomNav({ active, className }: BottomNavProps) {
    const pathname = usePathname();

    // Hide nav on specific pages
    if (pathname === '/' || (pathname && HIDDEN_ROUTES.some(route => pathname.startsWith(route)))) {
        return null;
    }

    // Fallback active detection if prop is not passed
    const currentActive = active || (pathname?.includes('/home') ? 'home' :
        pathname?.includes('/shop') ? 'explore' :
            pathname?.includes('/community') ? 'community' :
                pathname?.includes('/food') ? 'food' :
                    pathname?.includes('/profile') ? 'profile' : 'home');

    const navItems = [
        { id: 'home', icon: Home, label: 'Ev', path: '/home' },
        { id: 'explore', icon: Compass, label: 'Keşfet', path: '/shop' },
        { id: 'community', icon: Hexagon, label: 'Topluluk', path: '/community', isCenter: true },
        { id: 'food', icon: Utensils, label: 'Beslenme', path: '/food' },
        { id: 'profile', icon: User, label: 'Profil', path: '/profile' },
    ];

    return (
        <div className={cn("fixed bottom-4 left-4 right-4 z-50", className)}>
            {/* 
               FLOATING FROSTED GLASS BAR
               Corner Radius: 12px
            */}
            <div className="w-full h-[4.5rem] bg-[#0a0a0a]/70 backdrop-blur-[40px] border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] flex items-center justify-between px-6 rounded-[12px]">

                {navItems.map((item) => {
                    if (item.isCenter) {
                        return (
                            <div key={item.id} className="relative -top-8 group px-2">
                                <Link
                                    href={item.path}
                                    className="w-[4rem] h-[4rem] rounded-[1.5rem] bg-gradient-to-b from-[#2a2a2a] to-black flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8)] border border-white/20 transition-transform duration-300 group-hover:-translate-y-2 group-active:scale-95 relative overflow-hidden"
                                >
                                    {/* Metallic Sheen */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50 pointer-events-none" />

                                    {/* Hexagon Icon */}
                                    <Hexagon
                                        className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] relative z-10"
                                        strokeWidth={1.5}
                                    />

                                    {/* Active Pulse */}
                                    {currentActive === 'community' && (
                                        <div className="absolute inset-0 rounded-[1.5rem] border border-white/30 animate-pulse opacity-50" />
                                    )}
                                </Link>
                            </div>
                        );
                    }

                    const isActive = currentActive === item.id;

                    return (
                        <Link
                            key={item.id}
                            href={item.path}
                            className="flex flex-col items-center justify-center w-12 h-12 relative group"
                        >
                            <div className="relative">
                                <item.icon
                                    className={cn(
                                        "w-6 h-6 transition-all duration-300",
                                        isActive
                                            ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" // Glowing Metal
                                            : "text-slate-500 group-hover:text-slate-300" // Dull Metal
                                    )}
                                    strokeWidth={isActive ? 2 : 1.5}
                                />
                                {isActive && (
                                    <MotionDiv className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]" />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

// Simple internal wrapper for styling
function MotionDiv({ className }: { className: string }) {
    return <div className={className} />
}
