'use client';

// Moffi'den İlham (home-final referansı): kaydırılabilen fotoğraf + söz kartları. Sayfanın kapanış imzası.

import { useState } from 'react';
import { Heart, PawPrint } from 'lucide-react';
import { SectionHeader, ScrollDots, activeIndexOf, baloo } from './homeUI';

const SLIDES = [
    { image: '/images/ilham1.jpg', quote: 'Onların iyi olması, bizim en büyük mutluluğumuz.', position: '70% 40%' },
    { image: '/images/ilham3.jpg', quote: 'Her yürüyüş, birlikte yazılan yeni bir hikâye.', position: '60% 35%' },
    { image: '/images/ilham4.jpg', quote: 'Huzur, bir mırıltının içinde saklı.', position: '55% 50%' },
    { image: '/images/ilham2.jpg', quote: 'Küçük patiler, büyük mutluluklar bırakır.', position: '60% 40%' },
    { image: '/images/ilham5.jpg', quote: 'Merak eden gözlere keşfedilecek koca bir dünya.', position: '60% 30%' },
    { image: '/images/ilham6.jpg', quote: 'Sevgi bazen yumuşacık bir pati kadar.', position: '50% 40%' },
];

export function HomeInspiration() {
    const [active, setActive] = useState(0);
    return (
        <section>
            <SectionHeader title="Moffi'den İlham" subtitle="Daha mutlu patiler, daha güzel yarınlar ♡" />
            <div
                onScroll={e => setActive(activeIndexOf(e.currentTarget, SLIDES.length))}
                className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-5 px-5"
            >
                {SLIDES.map(s => (
                    <figure key={s.image} className="snap-center shrink-0 w-full relative h-[188px] rounded-[22px] overflow-hidden">
                        <img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover scale-[1.04]" style={{ objectPosition: s.position }} />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(20,17,13,0.72) 0%, rgba(20,17,13,0.35) 48%, rgba(20,17,13,0) 75%)' }} />
                        <Heart className="absolute top-4 right-4 w-6 h-6 text-white/90" strokeWidth={1.8} />
                        <figcaption className="relative h-full flex flex-col justify-center px-5 max-w-[64%]">
                            <p className={`${baloo.className} text-white text-[19px] leading-[1.25] font-semibold`}>“{s.quote}”</p>
                            <span className="mt-3 flex items-center gap-1.5 text-white text-[13px] font-bold">
                                <PawPrint className="w-4 h-4" fill="currentColor" strokeWidth={0} /> Moffi
                            </span>
                        </figcaption>
                    </figure>
                ))}
            </div>
            <ScrollDots count={SLIDES.length} active={active} />
        </section>
    );
}
