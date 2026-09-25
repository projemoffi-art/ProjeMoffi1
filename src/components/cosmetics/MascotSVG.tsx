"use client";

import { useState, useEffect } from "react";
import "./mascot-animations.css";

// Faz 22 — src/integrations-pending/kombinle/src/App.tsx'teki MascotSVG bileşeninin
// aynen taşınmış hali (tamamen saf SVG, hiçbir dış görsel dosyaya ihtiyaç duymuyor).
// Slot anahtarları artık gerçek `cosmetic_items.item_key` değerleriyle birebir
// eşleşiyor (bkz. migration add_cosmetic_wardrobe_system).
export interface ApparelState {
    body: 'sweatshirt' | 'singlet' | 'pajamas' | 'suit' | 'space_suit' | null;
    head: 'crown' | 'pirate_hat' | 'top_hat' | 'beanie' | 'detective' | 'wizard' | null;
    eyes: 'sunglasses' | 'glasses' | 'eyepatch' | 'cyber_visor' | null;
    hands: 'gloves' | 'boxing' | null;
    feet: 'sneakers' | 'boots' | null;
}

export function MascotSVG({
    apparel,
    bodyColor = '#8b5cf6',
    customStyle = {},
    isCat = false,
    isDog = true,
}: {
    apparel: ApparelState;
    bodyColor?: string;
    customStyle?: React.CSSProperties;
    isCat?: boolean;
    isDog?: boolean;
}) {
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const [headOffset, setHeadOffset] = useState({ x: 0, y: 0 });
    const [animState, setAnimState] = useState<'idle' | 'giggle' | 'dizzy' | 'jump'>('idle');

    useEffect(() => {
        const handleMove = (clientX: number, clientY: number) => {
            const svgEl = document.querySelector('.mascot-svg');
            if (svgEl) {
                const rect = svgEl.getBoundingClientRect();
                const svgCenterX = rect.left + rect.width / 2;
                const svgCenterY = rect.top + rect.height / 3;

                const dx = clientX - svgCenterX;
                const dy = clientY - svgCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                const maxPupilOffset = 6;
                const pupilX = (dx / dist) * Math.min(maxPupilOffset, Math.abs(dx) * 0.05);
                const pupilY = (dy / dist) * Math.min(maxPupilOffset, Math.abs(dy) * 0.05);

                const maxHeadOffset = 4;
                const headX = (dx / dist) * Math.min(maxHeadOffset, Math.abs(dx) * 0.02);
                const headY = (dy / dist) * Math.min(maxHeadOffset, Math.abs(dy) * 0.02);

                setEyeOffset({ x: pupilX, y: pupilY });
                setHeadOffset({ x: headX, y: headY });
            }
        };

        const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchstart', handleTouchMove, { passive: true });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchMove);
        };
    }, []);

    const triggerGiggle = () => {
        if (animState !== 'idle') return;
        setAnimState('giggle');
        setTimeout(() => setAnimState('idle'), 1000);
    };
    const triggerDizzy = () => {
        if (animState !== 'idle') return;
        setAnimState('dizzy');
        setTimeout(() => setAnimState('idle'), 1200);
    };
    const triggerJump = () => {
        if (animState !== 'idle') return;
        setAnimState('jump');
        setTimeout(() => setAnimState('idle'), 700);
    };

    return (
        <svg viewBox="0 0 400 450" className="mascot-svg" style={customStyle}>
            <ellipse cx="200" cy="415" rx="75" ry="12" fill="rgba(0,0,0,0.2)" />

            <path
                d="M 125,320 C 90,320 60,340 50,290 C 40,230 75,200 85,210 C 95,220 70,260 85,290 C 95,310 125,310 125,310"
                fill={bodyColor}
                className="mascot-tail-wag"
                style={{ transformOrigin: '125px 315px' }}
            />

            <g className={`mascot-breathe-group mascot-anim-${animState}`}>
                <g onClick={triggerJump} onTouchStart={(e) => { e.stopPropagation(); triggerJump(); }} className="cursor-pointer" style={{ transformOrigin: '200px 380px' }}>
                    <g>
                        <rect x="135" y="360" width="30" height="40" rx="10" fill={bodyColor} />
                        <ellipse cx="150" cy="398" rx="16" ry="8" fill="#ffffff" />
                    </g>
                    <g>
                        <rect x="235" y="360" width="30" height="40" rx="10" fill={bodyColor} />
                        <ellipse cx="250" cy="398" rx="16" ry="8" fill="#ffffff" />
                    </g>
                </g>

                {apparel.feet && (
                    <g key={apparel.feet} className="animate-cloth-equip" style={{ transformOrigin: '200px 380px' }}>
                        {apparel.feet === 'sneakers' && (
                            <path d="M 125,385 L 168,385 C 170,395 170,405 160,408 L 128,408 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
                        )}
                        {apparel.feet === 'boots' && (
                            <path d="M 128,375 L 168,375 L 168,408 L 128,408 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
                        )}
                        {apparel.feet === 'sneakers' && (
                            <path d="M 225,385 L 268,385 C 270,395 270,405 260,408 L 228,408 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" style={{ transform: 'scaleX(-1)', transformOrigin: '250px 385px' }} />
                        )}
                        {apparel.feet === 'boots' && (
                            <path d="M 228,375 L 268,375 L 268,408 L 228,408 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" style={{ transform: 'scaleX(-1)', transformOrigin: '248px 375px' }} />
                        )}
                    </g>
                )}

                <g onClick={triggerGiggle} onTouchStart={(e) => { e.stopPropagation(); triggerGiggle(); }} className="cursor-pointer" style={{ transformOrigin: '200px 285px' }}>
                    <g>
                        <ellipse cx="90" cy="280" rx="18" ry="38" fill={bodyColor} transform="rotate(-20 90 280)" />
                        <circle cx="80" cy="310" r="14" fill="#ffffff" transform="rotate(-20 90 280)" />
                    </g>
                    <g>
                        <ellipse cx="310" cy="280" rx="18" ry="38" fill={bodyColor} transform="rotate(20 310 280)" />
                        <circle cx="320" cy="310" r="14" fill="#ffffff" transform="rotate(20 310 280)" />
                    </g>

                    <ellipse cx="200" cy="285" rx="85" ry="85" fill={bodyColor} />
                    <ellipse cx="200" cy="285" rx="58" ry="52" fill="#ffedd5" />

                    <path d="M 124,342 C 124,342 200,358 276,342 L 276,368 C 260,372 230,372 215,368 L 215,360 L 185,360 L 185,368 C 170,372 140,372 124,368 Z" fill="#0284c7" />
                </g>

                {apparel.hands && (
                    <g key={apparel.hands} className="animate-cloth-equip" style={{ transformOrigin: '200px 280px' }}>
                        {apparel.hands === 'gloves' && <circle cx="78" cy="305" r="16" fill="#10b981" />}
                        {apparel.hands === 'boxing' && <circle cx="75" cy="308" r="21" fill="#ef4444" />}
                        {apparel.hands === 'gloves' && <circle cx="322" cy="305" r="16" fill="#10b981" />}
                        {apparel.hands === 'boxing' && <circle cx="325" cy="308" r="21" fill="#ef4444" />}
                    </g>
                )}

                {apparel.body && (
                    <g key={apparel.body} className="animate-cloth-equip" style={{ transformOrigin: '200px 285px' }}>
                        {apparel.body === 'sweatshirt' && (
                            <g>
                                <path d="M 122,250 C 122,250 200,230 278,250 L 278,355 C 278,355 200,375 122,355 Z" fill="#f97316" />
                                <path d="M 152,250 C 152,250 200,285 248,250" fill="none" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" />
                                <path d="M 175,320 L 188,285 L 200,305 L 212,285 L 225,320" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }} />
                                <path d="M 175,320 L 188,285 L 200,305 L 212,285 L 225,320" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                        )}
                        {apparel.body === 'singlet' && (
                            <g>
                                <path d="M 130,265 C 130,265 200,255 270,265 L 265,355 C 265,355 200,370 135,355 Z" fill="#0891b2" />
                                <rect x="140" y="232" width="16" height="38" rx="3" fill="#0891b2" />
                                <rect x="244" y="232" width="16" height="38" rx="3" fill="#0891b2" />
                                <polygon points="200,280 204,290 214,292 206,298 209,308 200,302 191,308 194,298 186,292 196,290" fill="#eab308" />
                            </g>
                        )}
                        {apparel.body === 'pajamas' && (
                            <g>
                                <path d="M 122,250 C 122,250 200,232 278,250 L 278,360 C 278,360 200,375 122,360 Z" fill="#10b981" />
                                <path d="M 122,275 C 122,275 200,257 278,275 L 278,285 C 278,285 200,267 122,285 Z" fill="#a7f3d0" />
                                <path d="M 122,315 C 122,315 200,297 278,315 L 278,325 C 278,325 200,307 122,325 Z" fill="#a7f3d0" />
                            </g>
                        )}
                        {apparel.body === 'suit' && (
                            <g>
                                <path d="M 122,250 C 122,250 200,230 278,250 L 278,355 C 278,355 200,375 122,355 Z" fill="#1e293b" />
                                <path d="M 175,250 L 200,310 L 225,250 Z" fill="#ffffff" />
                                <polygon points="194,270 206,270 203,310 197,310" fill="#ef4444" />
                                <path d="M 165,250 L 190,300 L 175,300 Z" fill="#0f172a" />
                                <path d="M 235,250 L 210,300 L 225,300 Z" fill="#0f172a" />
                            </g>
                        )}
                        {apparel.body === 'space_suit' && (
                            <g>
                                <path d="M 122,250 C 122,250 200,230 278,250 L 278,355 C 278,355 200,375 122,355 Z" fill="#e2e8f0" />
                                <rect x="155" y="275" width="90" height="12" rx="4" fill="#38bdf8" />
                                <circle cx="220" cy="310" r="10" fill="#f43f5e" />
                            </g>
                        )}
                    </g>
                )}

                <g
                    onClick={triggerDizzy}
                    onTouchStart={(e) => { e.stopPropagation(); triggerDizzy(); }}
                    className="cursor-pointer"
                    style={{ transform: `translate(${headOffset.x}px, ${headOffset.y}px)`, transformOrigin: '200px 155px', transition: 'transform 0.1s ease-out' }}
                >
                    <circle cx="200" cy="155" r="72" fill={bodyColor} />

                    {isCat ? (
                        <g>
                            <polygon points="115,120 138,55 162,105" fill={bodyColor} className="mascot-left-ear" style={{ transformOrigin: '140px 100px' }} />
                            <polygon points="125,114 138,68 152,102" fill="#fda4af" />
                            <polygon points="285,120 262,55 238,105" fill={bodyColor} className="mascot-right-ear" style={{ transformOrigin: '260px 100px' }} />
                            <polygon points="275,114 262,68 248,102" fill="#fda4af" />
                        </g>
                    ) : isDog ? (
                        <g>
                            <path d="M 125,90 C 105,90 95,145 125,145 C 135,145 140,115 125,90 Z" fill={bodyColor} className="mascot-left-ear" style={{ transformOrigin: '125px 90px' }} />
                            <path d="M 120,100 C 110,100 105,135 120,135 Z" fill="#fda4af" />
                            <path d="M 275,90 C 295,90 305,145 275,145 C 265,145 260,115 275,90 Z" fill={bodyColor} className="mascot-right-ear" style={{ transformOrigin: '275px 90px' }} />
                            <path d="M 280,100 C 290,100 295,135 280,135 Z" fill="#fda4af" />
                        </g>
                    ) : (
                        <g>
                            <circle cx="140" cy="100" r="22" fill={bodyColor} className="mascot-left-ear" style={{ transformOrigin: '140px 100px' }} />
                            <circle cx="140" cy="100" r="14" fill="#fda4af" />
                            <circle cx="260" cy="100" r="22" fill={bodyColor} className="mascot-right-ear" style={{ transformOrigin: '260px 100px' }} />
                            <circle cx="260" cy="100" r="14" fill="#fda4af" />
                        </g>
                    )}

                    <ellipse cx="200" cy="178" rx="26" ry="18" fill="#ffffff" />
                    <ellipse cx="200" cy="169" rx="8" ry="5.5" fill="#e11d48" />

                    {animState === 'giggle' ? (
                        <g>
                            <path d="M 157,140 Q 172,148 187,140" fill="none" stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round" />
                            <path d="M 213,140 Q 228,148 243,140" fill="none" stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round" />
                        </g>
                    ) : animState === 'dizzy' ? (
                        <g>
                            <path d="M 162,140 Q 172,130 182,140 Q 172,150 162,140" fill="none" stroke="#1f2937" strokeWidth="3" />
                            <path d="M 218,140 Q 228,130 238,140 Q 228,150 218,140" fill="none" stroke="#1f2937" strokeWidth="3" />
                        </g>
                    ) : (
                        <g>
                            <circle cx="172" cy="140" r="15" fill="white" />
                            <circle cx={174 + eyeOffset.x} cy={140 + eyeOffset.y} r="8" fill="#22c55e" />
                            <circle cx={174 + eyeOffset.x} cy={140 + eyeOffset.y} r="4" fill="black" />
                            <circle cx="228" cy="140" r="15" fill="white" />
                            <circle cx={226 + eyeOffset.x} cy={140 + eyeOffset.y} r="8" fill="#22c55e" />
                            <circle cx={226 + eyeOffset.x} cy={140 + eyeOffset.y} r="4" fill="black" />
                        </g>
                    )}

                    {apparel.eyes && (
                        <g key={apparel.eyes} className="animate-cloth-equip" style={{ transformOrigin: '200px 140px' }}>
                            {apparel.eyes === 'glasses' && (
                                <g style={{ transform: `translate(${eyeOffset.x * 0.4}px, ${eyeOffset.y * 0.4}px)` }}>
                                    <circle cx="172" cy="140" r="18" fill="none" stroke="#1f2937" strokeWidth="4" />
                                    <circle cx="228" cy="140" r="18" fill="none" stroke="#1f2937" strokeWidth="4" />
                                    <line x1="190" x2="210" y1="140" y2="140" stroke="#1f2937" strokeWidth="4.5" />
                                </g>
                            )}
                            {apparel.eyes === 'sunglasses' && (
                                <g style={{ transform: `translate(${eyeOffset.x * 0.4}px, ${eyeOffset.y * 0.4}px)` }}>
                                    <path d="M 150,135 Q 172,125 192,135 L 190,152 Q 172,160 152,152 Z" fill="#0f172a" opacity="0.95" />
                                    <path d="M 208,135 Q 228,125 248,135 L 246,152 Q 228,160 208,152 Z" fill="#0f172a" opacity="0.95" />
                                    <line x1="192" x2="208" y1="137" y2="137" stroke="#1e293b" strokeWidth="4" />
                                    <line x1="160" x2="175" y1="138" y2="148" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                                    <line x1="218" x2="233" y1="138" y2="148" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                                </g>
                            )}
                            {apparel.eyes === 'eyepatch' && (
                                <g style={{ transform: `translate(${eyeOffset.x * 0.3}px, ${eyeOffset.y * 0.3}px)` }}>
                                    <line x1="130" y1="115" x2="270" y2="160" stroke="#111827" strokeWidth="4" />
                                    <ellipse cx="228" cy="140" rx="18" ry="14" fill="#111827" />
                                </g>
                            )}
                            {apparel.eyes === 'cyber_visor' && (
                                <g style={{ transform: `translate(${eyeOffset.x * 0.5}px, ${eyeOffset.y * 0.5}px)` }}>
                                    <rect x="145" y="128" width="110" height="24" rx="6" fill="#06b6d4" opacity="0.9" stroke="#22d3ee" strokeWidth="2" />
                                    <line x1="150" x2="250" y1="140" y2="140" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
                                </g>
                            )}
                        </g>
                    )}

                    {apparel.head && (
                        <g key={apparel.head} className="animate-cloth-equip" style={{ transformOrigin: '200px 95px' }}>
                            {apparel.head === 'crown' && (
                                <path d="M 162,94 L 172,65 L 190,82 L 200,55 L 210,82 L 228,65 L 238,94 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2.5" />
                            )}
                            {apparel.head === 'pirate_hat' && (
                                <g>
                                    <path d="M 135,95 C 135,70 160,50 200,50 C 240,50 265,70 265,95 C 275,95 285,102 285,106 C 285,106 200,98 115,106 C 115,102 125,95 135,95 Z" fill="#0f172a" />
                                    <circle cx="200" cy="80" r="7" fill="white" />
                                    <path d="M 197,80 L 203,80 M 200,77 L 200,83" stroke="#000" strokeWidth="1.5" />
                                </g>
                            )}
                            {apparel.head === 'top_hat' && (
                                <g>
                                    <ellipse cx="200" cy="95" rx="52" ry="8" fill="#1e293b" />
                                    <rect x="164" y="44" width="72" height="48" rx="2" fill="#1e293b" />
                                    <rect x="164" y="82" width="72" height="10" fill="#ef4444" />
                                </g>
                            )}
                            {apparel.head === 'beanie' && (
                                <g>
                                    <path d="M 148,96 C 148,50 252,50 252,96 Z" fill="#2563eb" />
                                    <rect x="142" y="87" width="116" height="16" rx="5" fill="#1d4ed8" />
                                    <circle cx="200" cy="40" r="10" fill="#60a5fa" />
                                </g>
                            )}
                            {apparel.head === 'detective' && (
                                <g>
                                    <path d="M 140,95 Q 200,35 260,95 Z" fill="#78350f" />
                                    <path d="M 120,95 Q 200,105 280,95 Z" fill="#451a03" />
                                    <rect x="190" y="55" width="20" height="15" fill="#f59e0b" rx="2" />
                                </g>
                            )}
                            {apparel.head === 'wizard' && (
                                <g>
                                    <path d="M 140,95 Q 200,-5 260,95 Z" fill="#1e3a8a" />
                                    <ellipse cx="200" cy="95" rx="75" ry="10" fill="#1e40af" />
                                    <polygon points="195,45 200,35 205,45 200,42" fill="#fbbf24" />
                                    <polygon points="175,70 180,60 185,70 180,67" fill="#fbbf24" />
                                    <polygon points="215,70 220,60 225,70 220,67" fill="#fbbf24" />
                                </g>
                            )}
                        </g>
                    )}
                </g>
            </g>
        </svg>
    );
}
