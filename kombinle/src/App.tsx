import React, { useState, useEffect } from 'react';
import { 
  Shirt, 
  Sparkles, 
  Trash2, 
  Coins, 
  Trophy, 
  Heart, 
  Check, 
  Lock, 
  Gamepad2, 
  BookOpen, 
  Compass, 
  Home,
  ArrowRight
} from 'lucide-react';

// Interfaces
interface ApparelState {
  body: 'sweatshirt' | 'singlet' | 'pajamas' | 'suit' | 'space_suit' | null;
  head: 'crown' | 'pirate_hat' | 'top_hat' | 'beanie' | 'detective' | 'wizard' | null;
  eyes: 'sunglasses' | 'glasses' | 'eyepatch' | 'cyber_visor' | null;
  hands: 'gloves' | 'boxing' | null;
  feet: 'sneakers' | 'boots' | null;
}

interface SavedOutfit {
  id: string;
  name: string;
  apparel: ApparelState;
  bodyColor: string;
  bg: string;
  date: string;
  sp: number;
}

// Preset wardrobe items metadata
const WARDROBE_ITEMS = {
  body: [
    { id: 'sweatshirt', label: 'Turuncu Sweatshirt', icon: '🧡', sp: 80, cost: 0, rarity: 'common' },
    { id: 'singlet', label: 'Spor Atlet', icon: '🎽', sp: 60, cost: 150, rarity: 'epic' },
    { id: 'pajamas', label: 'Çizgili Pijama', icon: '💤', sp: 70, cost: 200, rarity: 'epic' },
    { id: 'suit', label: 'Kraliyet Takımı', icon: '👔', sp: 150, cost: 400, rarity: 'legendary' },
    { id: 'space_suit', label: 'Astronot Kıyafeti', icon: '🚀', sp: 180, cost: 500, rarity: 'legendary' }
  ],
  head: [
    { id: 'beanie', label: 'Örme Bere', icon: '🧶', sp: 50, cost: 0, rarity: 'common' },
    { id: 'top_hat', label: 'Silindir Şapka', icon: '🎩', sp: 120, cost: 350, rarity: 'epic' },
    { id: 'detective', label: 'Dedektif Şapkası', icon: '🕵️', sp: 110, cost: 300, rarity: 'epic' },
    { id: 'crown', label: 'Altın Taç', icon: '👑', sp: 200, cost: 600, rarity: 'legendary' },
    { id: 'pirate_hat', label: 'Korsan Şapkası', icon: '🏴‍☠️', sp: 140, cost: 450, rarity: 'legendary' },
    { id: 'wizard', label: 'Büyücü Şapkası', icon: '🧙', sp: 190, cost: 500, rarity: 'legendary' }
  ],
  eyes: [
    { id: 'glasses', label: 'Optik Gözlük', icon: '🤓', sp: 30, cost: 0, rarity: 'common' },
    { id: 'sunglasses', label: 'Güneş Gözlüğü', icon: '😎', sp: 50, cost: 100, rarity: 'epic' },
    { id: 'cyber_visor', label: 'Siber Vizör', icon: '🕶️', sp: 120, cost: 300, rarity: 'epic' },
    { id: 'eyepatch', label: 'Göz Bandı', icon: '👁️', sp: 110, cost: 250, rarity: 'legendary' }
  ],
  hands: [
    { id: 'gloves', label: 'Sıcak Eldiven', icon: '🧤', sp: 40, cost: 0, rarity: 'common' },
    { id: 'boxing', label: 'Boks Eldiveni', icon: '🥊', sp: 90, cost: 300, rarity: 'legendary' }
  ],
  feet: [
    { id: 'sneakers', label: 'Spor Ayakkabı', icon: '👟', sp: 50, cost: 0, rarity: 'common' },
    { id: 'boots', label: 'Kışlık Bot', icon: '🥾', sp: 80, cost: 200, rarity: 'epic' }
  ]
};

const BODY_COLORS = [
  { value: '#8b5cf6', label: 'Asil Mor', color: 'bg-purple-500' },
  { value: '#ec4899', label: 'Şeker Pembe', color: 'bg-pink-500' },
  { value: '#f97316', label: 'Enerjik Turuncu', color: 'bg-orange-500' },
  { value: '#06b6d4', label: 'Buz Mavisi', color: 'bg-cyan-500' }
];

const BACKGROUNDS = [
  { id: 'stage', label: 'Stüdyo Sahnesi 🎭', sp: 10 },
  { id: 'cyber', label: 'Siber Izgara 👾', sp: 30 },
  { id: 'park', label: 'Doğa Parkı 🌳', sp: 20 },
  { id: 'space', label: 'Kozmik Uzay 🌌', sp: 40 }
];

const QUESTS_LIST = [
  {
    id: 'q-1',
    title: '🍂 Paris Sonbahar Yürüyüşü',
    desc: 'Bohem ve sıcak bir tarzla Paris sokaklarında romantik bir tur. Maskotuna mevsimlik giysiler giydir.',
    requirements: ['beanie', 'sweatshirt', 'boots'],
    reqLabels: ['Örme Bere (beanie) 🧶', 'Turuncu Sweatshirt 🧡', 'Kışlık Bot (boots) 🥾'],
    rewardCoins: 150,
    rewardXp: 50,
    tag: 'bohem',
    bg: 'park'
  },
  {
    id: 'q-2',
    title: '👾 Tokyo Siberpunk Gecesi',
    desc: 'Neon ışıklar altında siber tarzınla dikkatleri üzerine çek. Sokak stilini fütüristik ögelerle tamamla.',
    requirements: ['eyepatch', 'singlet', 'sneakers'],
    reqLabels: ['Göz Bandı (eyepatch) 👁️', 'Spor Atlet (singlet) 🎽', 'Spor Ayakkabı (sneakers) 👟'],
    rewardCoins: 200,
    rewardXp: 75,
    tag: 'siber',
    bg: 'cyber'
  },
  {
    id: 'q-3',
    title: '👑 Kraliyet Saray Balosu',
    desc: 'Sarayın görkemli salonunda en asil ve dikkat çekici tarzı sen sergile. Premium aksesuarlar kullan.',
    requirements: ['crown', 'top_hat', 'boxing'],
    reqLabels: ['Altın Taç (crown) 👑', 'Silindir Şapka (top_hat) 🎩', 'Boks Eldiveni (boxing) 🥊'],
    rewardCoins: 300,
    rewardXp: 100,
    tag: 'premium',
    bg: 'stage'
  }
];

// Helper: draw Mascot SVG dynamically based on apparel + colors
const MascotSVG = ({ 
  apparel, 
  bodyColor = '#8b5cf6', 
  customStyle = {},
  isBlinking = false,
  isEquipTriggered = false,
  isCat = false,
  isDog = false
}: { 
  apparel: ApparelState; 
  bodyColor?: string; 
  customStyle?: React.CSSProperties;
  isBlinking?: boolean;
  isEquipTriggered?: boolean;
  isCat?: boolean;
  isDog?: boolean;
}) => {
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headOffset, setHeadOffset] = useState({ x: 0, y: 0 });
  const [animState, setAnimState] = useState<'idle' | 'giggle' | 'dizzy' | 'jump'>('idle');

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      const svgEl = document.querySelector('.mascot-svg');
      if (svgEl) {
        const rect = svgEl.getBoundingClientRect();
        const svgCenterX = rect.left + rect.width / 2;
        const svgCenterY = rect.top + rect.height / 3; // Head center level
        
        const dx = clientX - svgCenterX;
        const dy = clientY - svgCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Max offset for pupils: 6px
        const maxPupilOffset = 6;
        const pupilX = (dx / dist) * Math.min(maxPupilOffset, Math.abs(dx) * 0.05);
        const pupilY = (dy / dist) * Math.min(maxPupilOffset, Math.abs(dy) * 0.05);
        
        // Max offset for head translation: 4px
        const maxHeadOffset = 4;
        const headX = (dx / dist) * Math.min(maxHeadOffset, Math.abs(dx) * 0.02);
        const headY = (dy / dist) * Math.min(maxHeadOffset, Math.abs(dy) * 0.02);
        
        setEyeOffset({ x: pupilX, y: pupilY });
        setHeadOffset({ x: headX, y: headY });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
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
    <svg 
      viewBox="0 0 400 450" 
      className="mascot-svg"
      style={customStyle}
    >
      {/* SHADOW */}
      <ellipse cx="200" cy="415" rx="75" ry="12" fill="rgba(0,0,0,0.2)" />

      {/* TAIL (Wagging!) */}
      <path 
        d="M 125,320 Q 90,320 85,280 Q 95,260 105,280 Q 105,310 125,310" 
        fill={bodyColor} 
        className="mascot-tail-wag"
        style={{ transformOrigin: '125px 315px' }}
      />

      <g className={`mascot-breathe-group mascot-anim-${animState} ${isEquipTriggered ? 'animate-equip-bounce' : ''}`}>
        {/* LEGS (Interactive Jump) */}
        <g 
          onClick={triggerJump} 
          onTouchStart={(e) => { e.stopPropagation(); triggerJump(); }} 
          className="cursor-pointer" 
          style={{ transformOrigin: '200px 380px' }}
        >
          <rect x="135" y="360" width="30" height="40" rx="10" fill={bodyColor} />
          <rect x="235" y="360" width="30" height="40" rx="10" fill={bodyColor} />
        </g>

        {/* FEET APPAREL (Juicy Entrance Bounce) */}
        {apparel.feet && (
          <g key={apparel.feet} className="animate-cloth-equip" style={{ transformOrigin: '200px 380px' }}>
            {/* Left foot shoe */}
            {apparel.feet === 'sneakers' && (
              <path d="M 125,385 L 168,385 C 170,395 170,405 160,408 L 128,408 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
            )}
            {apparel.feet === 'boots' && (
              <path d="M 128,375 L 168,375 L 168,408 L 128,408 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            )}
            {/* Right foot shoe */}
            {apparel.feet === 'sneakers' && (
              <path d="M 225,385 L 268,385 C 270,395 270,405 260,408 L 228,408 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" style={{ transform: 'scaleX(-1)', transformOrigin: '250px 385px' }} />
            )}
            {apparel.feet === 'boots' && (
              <path d="M 228,375 L 268,375 L 268,408 L 228,408 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" style={{ transform: 'scaleX(-1)', transformOrigin: '248px 375px' }} />
            )}
          </g>
        )}

        {/* BODY & ARMS (Interactive Giggle) */}
        <g 
          onClick={triggerGiggle} 
          onTouchStart={(e) => { e.stopPropagation(); triggerGiggle(); }} 
          className="cursor-pointer" 
          style={{ transformOrigin: '200px 285px' }}
        >
          {/* Left arm */}
          <ellipse cx="90" cy="280" rx="18" ry="38" fill={bodyColor} transform="rotate(-20 90 280)" />
          {/* Right arm */}
          <ellipse cx="310" cy="280" rx="18" ry="38" fill={bodyColor} transform="rotate(20 310 280)" />

          {/* MAIN BODY */}
          <ellipse cx="200" cy="285" rx="85" ry="85" fill={bodyColor} />
          <ellipse cx="200" cy="285" rx="58" ry="52" fill="#ffedd5" />
        </g>

        {/* HANDS APPAREL (Juicy Entrance Bounce) */}
        {apparel.hands && (
          <g key={apparel.hands} className="animate-cloth-equip" style={{ transformOrigin: '200px 280px' }}>
            {/* Left glove */}
            {apparel.hands === 'gloves' && <circle cx="78" cy="305" r="16" fill="#10b981" />}
            {apparel.hands === 'boxing' && <circle cx="75" cy="308" r="21" fill="#ef4444" />}
            {/* Right glove */}
            {apparel.hands === 'gloves' && <circle cx="322" cy="305" r="16" fill="#10b981" />}
            {apparel.hands === 'boxing' && <circle cx="325" cy="308" r="21" fill="#ef4444" />}
          </g>
        )}

        {/* BODY APPAREL (Juicy Entrance Bounce) */}
        {apparel.body && (
          <g key={apparel.body} className="animate-cloth-equip" style={{ transformOrigin: '200px 285px' }}>
            {apparel.body === 'sweatshirt' && (
              <g>
                <path d="M 122,250 C 122,250 200,230 278,250 L 278,355 C 278,355 200,375 122,355 Z" fill="#f97316" />
                <polygon points="200,285 165,250 235,250" fill="#ea580c" />
                <rect x="155" y="305" width="90" height="35" rx="8" fill="#ea580c" />
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

        {/* HEAD & FACE (Interactive 3D Look-at rotation + Dizzy click) */}
        <g 
          onClick={triggerDizzy} 
          onTouchStart={(e) => { e.stopPropagation(); triggerDizzy(); }} 
          className="cursor-pointer" 
          style={{ 
            transform: `translate(${headOffset.x}px, ${headOffset.y}px)`, 
            transformOrigin: '200px 155px',
            transition: 'transform 0.1s ease-out'
          }}
        >
          {/* MAIN HEAD */}
          <circle cx="200" cy="155" r="72" fill={bodyColor} />

          {/* EARS */}
          {isCat ? (
            <g>
              {/* Left Cat Ear */}
              <polygon points="115,120 138,55 162,105" fill={bodyColor} className="mascot-left-ear" style={{ transformOrigin: '140px 100px' }} />
              <polygon points="125,114 138,68 152,102" fill="#fda4af" />
              {/* Right Cat Ear */}
              <polygon points="285,120 262,55 238,105" fill={bodyColor} className="mascot-right-ear" style={{ transformOrigin: '260px 100px' }} />
              <polygon points="275,114 262,68 248,102" fill="#fda4af" />
            </g>
          ) : isDog ? (
            <g>
              {/* Left Dog Ear */}
              <path d="M 125,90 C 105,90 95,145 125,145 C 135,145 140,115 125,90 Z" fill={bodyColor} className="mascot-left-ear" style={{ transformOrigin: '125px 90px' }} />
              <path d="M 120,100 C 110,100 105,135 120,135 Z" fill="#fda4af" />
              {/* Right Dog Ear */}
              <path d="M 275,90 C 295,90 305,145 275,145 C 265,145 260,115 275,90 Z" fill={bodyColor} className="mascot-right-ear" style={{ transformOrigin: '275px 90px' }} />
              <path d="M 280,100 C 290,100 295,135 280,135 Z" fill="#fda4af" />
            </g>
          ) : (
            <g>
              {/* Left ear */}
              <circle cx="140" cy="100" r="22" fill={bodyColor} className="mascot-left-ear" style={{ transformOrigin: '140px 100px' }} />
              <circle cx="140" cy="100" r="14" fill="#fda4af" />
              {/* Right ear */}
              <circle cx="260" cy="100" r="22" fill={bodyColor} className="mascot-right-ear" style={{ transformOrigin: '260px 100px' }} />
              <circle cx="260" cy="100" r="14" fill="#fda4af" />
            </g>
          )}

          {/* SNOUT & NOSE */}
          <ellipse cx="200" cy="178" rx="26" ry="18" fill="#fed7aa" />
          <ellipse cx="200" cy="169" rx="8" ry="5.5" fill="#1f2937" />

          {/* EYES */}
          {isBlinking || animState === 'giggle' ? (
            <g>
              {/* Closed eyelids */}
              <path d="M 157,140 Q 172,148 187,140" fill="none" stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 213,140 Q 228,148 243,140" fill="none" stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round" />
            </g>
          ) : animState === 'dizzy' ? (
            <g>
              {/* Dizzy Spiral Eyes */}
              <path d="M 162,140 Q 172,130 182,140 Q 172,150 162,140" fill="none" stroke="#1f2937" strokeWidth="3" />
              <path d="M 218,140 Q 228,130 238,140 Q 228,150 218,140" fill="none" stroke="#1f2937" strokeWidth="3" />
            </g>
          ) : (
            <g>
              {/* Left Eye (Look At Cursor) */}
              <circle cx="172" cy="140" r="15" fill="white" />
              <circle cx={174 + eyeOffset.x} cy={140 + eyeOffset.y} r="8" fill="#a855f7" />
              <circle cx={174 + eyeOffset.x} cy={140 + eyeOffset.y} r="4" fill="black" />
              {/* Right Eye (Look At Cursor) */}
              <circle cx="228" cy="140" r="15" fill="white" />
              <circle cx={226 + eyeOffset.x} cy={140 + eyeOffset.y} r="8" fill="#a855f7" />
              <circle cx={226 + eyeOffset.x} cy={140 + eyeOffset.y} r="4" fill="black" />
            </g>
          )}

          {/* 3D APPAREL: Eyes (Juicy Entrance Bounce) */}
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

          {/* 3D APPAREL: Head (Juicy Entrance Bounce) */}
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
};

export default function App() {
  // Navigation states: 'lobby' (Cinematic portal selection), 'styling', 'battle', 'lookbook', 'feed'
  const [view, setView] = useState<'lobby' | 'styling' | 'battle' | 'lookbook' | 'feed'>('lobby');

  // URL Query Parameters parsing for personalization
  const [params] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });
  
  const petName = params.get('petName') || 'Zeytin';
  const petBreed = params.get('petBreed') || 'Kayıtlı Pet';
  const isCat = petBreed.toLowerCase().includes('cat') || petBreed.toLowerCase().includes('kedi') || petBreed.toLowerCase().includes('shorthair') || petBreed.toLowerCase().includes('siamese') || petBreed.toLowerCase().includes('tekir');
  const isDog = !isCat;

  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem('moffi_kombinle_onboarded');
    if (!onboarded) {
      setShowGuideModal(true);
    }
  }, []);

  const handleReturnToMoffi = () => {
    if (document.referrer && (document.referrer.includes("localhost") || document.referrer.includes("moffi"))) {
      window.location.href = document.referrer;
    } else {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      window.location.href = isLocal ? "http://localhost:3000/community" : "/community";
    }
  };
  
  // App-wide persistent stats
  const [walletBalance, setWalletBalance] = useState(() => {
    return Number(localStorage.getItem('moffi_coins') || '1450');
  });
  const [stylingLevel, setStylingLevel] = useState(() => {
    return Number(localStorage.getItem('moffi_level') || '3');
  });
  const [stylingXP, setStylingXP] = useState(() => {
    return Number(localStorage.getItem('moffi_xp') || '40');
  });

  // Animation states
  const [isBlinking, setIsBlinking] = useState(false);
  const [isEquipTriggered, setIsEquipTriggered] = useState(false);

  // Playable Quest states
  const [activeQuest, setActiveQuest] = useState<any>(null);
  const [isQuestSuccessModal, setIsQuestSuccessModal] = useState(false);
  const [isQuestFailModal, setIsQuestFailModal] = useState(false);
  const [questRewards, setQuestRewards] = useState({ coins: 0, xp: 0 });

  // Customizer styling states
  const [bodyColor, setBodyColor] = useState(() => {
    return isCat ? '#f97316' : '#8b5cf6';
  });
  const [activeBg, setActiveBg] = useState('stage');
  const [selectedApparel, setSelectedApparel] = useState<ApparelState>({
    body: 'sweatshirt',
    head: null,
    eyes: 'glasses',
    hands: null,
    feet: null
  });
  const [activeOutfitName, setActiveOutfitName] = useState(() => {
    return `${petName}'in Harika Tarzı`;
  });

  // Gacha Chest animations and modals
  const [isShaking, setIsShaking] = useState(false);
  const [isChestOpenModal, setIsChestOpenModal] = useState(false);
  const [gachaAward, setGachaAward] = useState<any>(null);

  // Unlocked items array saved in localStorage
  const [unlockedItems, setUnlockedItems] = useState<string[]>(() => {
    const defaults = ['sweatshirt', 'beanie', 'glasses', 'gloves', 'sneakers'];
    const saved = localStorage.getItem('moffi_unlocked');
    return saved ? JSON.parse(saved) : defaults;
  });

  // Photo lookbook album saved in localStorage
  const [lookbook, setLookbook] = useState<SavedOutfit[]>(() => {
    const saved = localStorage.getItem('moffi_lookbook');
    return saved ? JSON.parse(saved) : [
      {
        id: 'outfit-default-1',
        name: 'Siber Savaşçı 🥷',
        apparel: { body: 'singlet', head: 'pirate_hat', eyes: 'eyepatch', hands: 'boxing', feet: 'boots' },
        bodyColor: '#06b6d4',
        bg: 'cyber',
        date: '05.06.2026',
        sp: 380
      }
    ];
  });

  // Active Battle competitors
  const [battleCompetitors, setBattleCompetitors] = useState<any[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedChoice, setVotedChoice] = useState<number | null>(null);

  // Active Toast notifications
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);
  const [activeWardrobeTab, setActiveWardrobeTab] = useState<keyof typeof WARDROBE_ITEMS | 'color' | 'bg'>('body');

  // Automatic eye blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 150);
    }, 4000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  const triggerEquipBounce = () => {
    setIsEquipTriggered(true);
    setTimeout(() => setIsEquipTriggered(false), 450);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('moffi_coins', walletBalance.toString());
  }, [walletBalance]);

  useEffect(() => {
    localStorage.setItem('moffi_level', stylingLevel.toString());
    localStorage.setItem('moffi_xp', stylingXP.toString());
  }, [stylingLevel, stylingXP]);

  useEffect(() => {
    localStorage.setItem('moffi_unlocked', JSON.stringify(unlockedItems));
  }, [unlockedItems]);

  useEffect(() => {
    localStorage.setItem('moffi_lookbook', JSON.stringify(lookbook));
  }, [lookbook]);

  // Show premium feedback toasts
  const triggerToast = (msg: string, icon: string = '✨') => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  };

  // Check if player gains enough XP to level up
  const addXP = (amount: number) => {
    setStylingXP(prevXP => {
      const nextXP = prevXP + amount;
      const needed = stylingLevel * 50;
      if (nextXP >= needed) {
        setStylingLevel(prevLvl => prevLvl + 1);
        triggerToast(`🎉 Tebrikler! Seviye Atladın: Seviye ${stylingLevel + 1}!`, '🏆');
        return nextXP - needed;
      }
      return nextXP;
    });
  };

  // Helper to calculate total combination points (Style Points)
  const calculateStylePoints = (apparel: ApparelState, backgroundId: string): number => {
    let total = 100; // Base points
    
    // Clothes sum
    if (apparel.body) {
      const item = WARDROBE_ITEMS.body.find(i => i.id === apparel.body);
      if (item) total += item.sp;
    }
    if (apparel.head) {
      const item = WARDROBE_ITEMS.head.find(i => i.id === apparel.head);
      if (item) total += item.sp;
    }
    if (apparel.eyes) {
      const item = WARDROBE_ITEMS.eyes.find(i => i.id === apparel.eyes);
      if (item) total += item.sp;
    }
    if (apparel.hands) {
      const item = WARDROBE_ITEMS.hands.find(i => i.id === apparel.hands);
      if (item) total += item.sp;
    }
    if (apparel.feet) {
      const item = WARDROBE_ITEMS.feet.find(i => i.id === apparel.feet);
      if (item) total += item.sp;
    }

    // BG sum
    const bgInfo = BACKGROUNDS.find(b => b.id === backgroundId);
    if (bgInfo) total += bgInfo.sp;

    return total;
  };

  const currentSP = calculateStylePoints(selectedApparel, activeBg);

  // Equip or Purchase clothes item
  const handleItemClick = (category: keyof typeof WARDROBE_ITEMS, itemId: string, cost: number, _sp: number, label: string) => {
    const isEquipped = selectedApparel[category] === itemId;
    triggerEquipBounce();
    
    // Purchase Check
    if (!unlockedItems.includes(itemId)) {
      if (walletBalance >= cost) {
        setWalletBalance(prev => prev - cost);
        setUnlockedItems(prev => [...prev, itemId]);
        setSelectedApparel(prev => ({ ...prev, [category]: itemId }));
        triggerToast(`🛍️ "${label}" satın alındı ve kuşanıldı! (-${cost} MoffiCoin)`, '💰');
        addXP(25);
      } else {
        triggerToast(`❌ Yetersiz MoffiCoin! "${label}" satın almak için ${cost} MoffiCoin gerekiyor.`, '🔒');
      }
    } else {
      setSelectedApparel(prev => ({
        ...prev,
        [category]: isEquipped ? null : itemId
      }));
      triggerToast(isEquipped ? `👕 "${label}" çıkarıldı.` : `✨ "${label}" giyildi!`, '👗');
    }
  };

  // Open Mystery Gacha Chest (Şans Modu)
  const handleOpenChest = () => {
    if (walletBalance < 100) {
      triggerToast("❌ Yetersiz MoffiCoin! Sandık açmak için 100 MoffiCoin gerekiyor.", "🔒");
      return;
    }

    // Deduct coins & start shake
    setWalletBalance(prev => prev - 100);
    setIsShaking(true);
    triggerToast("🎁 Gizemli Tarz Sandığı sallanıyor...", "✨");

    // Gather all currently locked items
    const lockedPrizes: any[] = [];
    Object.values(WARDROBE_ITEMS).forEach(category => {
      category.forEach(item => {
        if (item.cost > 0 && !unlockedItems.includes(item.id)) {
          lockedPrizes.push(item);
        }
      });
    });

    setTimeout(() => {
      setIsShaking(false);

      if (lockedPrizes.length === 0) {
        // Refund duplicate coins
        setWalletBalance(prev => prev + 250);
        setGachaAward({
          label: "Tüm Eşyalara Sahipsin!",
          icon: "💎",
          sp: 250,
          rarity: 'legendary'
        });
        triggerToast("🎉 Tüm eşyalar açık! 250 MoffiCoin iade edildi.", "🪙");
      } else {
        // Roll random prize
        const prize = lockedPrizes[Math.floor(Math.random() * lockedPrizes.length)];
        setUnlockedItems(prev => [...prev, prize.id]);
        setGachaAward(prize);
        triggerToast(`🎁 Tebrikler! "${prize.label}" kilidi açıldı!`, "🎉");
        addXP(50);
      }
      setIsChestOpenModal(true);
    }, 1200);
  };

  // Save combination to personal Lookbook
  const handleSaveOutfit = () => {
    const newOutfit: SavedOutfit = {
      id: 'outfit-' + Date.now(),
      name: activeOutfitName || 'Havalı Kombin',
      apparel: { ...selectedApparel },
      bodyColor,
      bg: activeBg,
      date: new Date().toLocaleDateString('tr-TR'),
      sp: currentSP
    };

    setLookbook(prev => [newOutfit, ...prev]);
    triggerToast(`📸 "${newOutfit.name}" başarıyla albümüne kaydedildi! (+40 XP)`, '🌟');
    addXP(40);
  };

  const handleShuffle = () => {
    const getRandomItem = (category: keyof typeof WARDROBE_ITEMS) => {
      const items = WARDROBE_ITEMS[category].filter(item => unlockedItems.includes(item.id) || item.cost === 0);
      if (items.length === 0) return null;
      if (Math.random() < 0.25) return null;
      const pick = items[Math.floor(Math.random() * items.length)];
      return pick.id;
    };

    setSelectedApparel({
      body: getRandomItem('body') as any,
      head: getRandomItem('head') as any,
      eyes: getRandomItem('eyes') as any,
      hands: getRandomItem('hands') as any,
      feet: getRandomItem('feet') as any
    });

    const randomColor = BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)].value;
    setBodyColor(randomColor);

    const randomBg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)].id;
    setActiveBg(randomBg);

    triggerToast("🎲 Rastgele kombin oluşturuldu!", "✨");
    triggerEquipBounce();
  };

  // Delete saved outfit card
  const handleDeleteOutfit = (id: string, name: string) => {
    setLookbook(prev => prev.filter(o => o.id !== id));
    triggerToast(`🗑️ "${name}" kombin kartı silindi.`, '🗑️');
  };

  // Submit Lookbook outfit to Arena
  const handleSendToArena = (outfit: SavedOutfit) => {
    localStorage.setItem('moffi_arena_queued_outfit', JSON.stringify(outfit));
    triggerToast(`⚔️ "${outfit.name}" Düello Arenası'na gönderildi! Diğer kullanıcılar tarafından oylanacak.`, '🚀');
  };

  // Generate 2 random competitors for the Battle Arena
  const generateNewBattle = () => {
    const listBody = ['sweatshirt', 'singlet', 'pajamas', null];
    const listHead = ['crown', 'pirate_hat', 'top_hat', 'beanie', null];
    const listEyes = ['sunglasses', 'glasses', 'eyepatch', null];
    const listHands = ['gloves', 'boxing', null];
    const listFeet = ['sneakers', 'boots', null];
    const colors = ['#8b5cf6', '#ec4899', '#f97316', '#06b6d4'];
    const bgs = ['stage', 'cyber', 'park', 'space'];

    const pickRandomOutfit = (): ApparelState => ({
      body: listBody[Math.floor(Math.random() * listBody.length)] as any,
      head: listHead[Math.floor(Math.random() * listHead.length)] as any,
      eyes: listEyes[Math.floor(Math.random() * listEyes.length)] as any,
      hands: listHands[Math.floor(Math.random() * listHands.length)] as any,
      feet: listFeet[Math.floor(Math.random() * listFeet.length)] as any,
    });

    const choice1Apparel = pickRandomOutfit();
    let choice2Apparel = pickRandomOutfit();
    let choice2Color = colors[Math.floor(Math.random() * colors.length)];
    let choice2Bg = bgs[Math.floor(Math.random() * bgs.length)];
    let choice2Name = 'Altın Muhafız 👑';

    // Check if player has sent an outfit to Arena
    const queuedOutfitStr = localStorage.getItem('moffi_arena_queued_outfit');
    if (queuedOutfitStr && Math.random() > 0.4) {
      try {
        const queuedOutfit = JSON.parse(queuedOutfitStr);
        choice2Apparel = queuedOutfit.apparel;
        choice2Color = queuedOutfit.bodyColor;
        choice2Bg = queuedOutfit.bg;
        choice2Name = `${queuedOutfit.name} (Senin Tasarımın)`;
      } catch (e) {
        console.error(e);
      }
    }

    const choice1Bg = bgs[Math.floor(Math.random() * bgs.length)];

    setBattleCompetitors([
      {
        id: 1,
        name: 'Neon Savaşçısı ⚡',
        apparel: choice1Apparel,
        color: colors[Math.floor(Math.random() * colors.length)],
        bg: choice1Bg,
        sp: calculateStylePoints(choice1Apparel, choice1Bg)
      },
      {
        id: 2,
        name: choice2Name,
        apparel: choice2Apparel,
        color: choice2Color,
        bg: choice2Bg,
        sp: calculateStylePoints(choice2Apparel, choice2Bg)
      }
    ]);
    setHasVoted(false);
    setVotedChoice(null);
  };

  // Load initial battle once
  useEffect(() => {
    generateNewBattle();
  }, []);

  const handleVote = (choiceId: number) => {
    if (hasVoted) return;
    setHasVoted(true);
    setVotedChoice(choiceId);
    
    // Add reward
    setWalletBalance(prev => prev + 20);
    triggerToast(`🗳️ Oyunuz kaydedildi! Düelloya katıldığınız için +20 MoffiCoin kazanıldı!`, '🗳️');
    addXP(15);
  };

  // Hikaye Görevlerini Kontrol Etme ve Teslim Etme
  const handleQuestSubmit = () => {
    if (!activeQuest) return;

    let matches = 0;
    const equipped = [
      selectedApparel.body as string | null,
      selectedApparel.head as string | null,
      selectedApparel.eyes as string | null,
      selectedApparel.hands as string | null,
      selectedApparel.feet as string | null
    ].filter((x): x is string => x !== null);

    activeQuest.requirements.forEach((req: string) => {
      if (equipped.includes(req)) {
        matches++;
      }
    });

    if (matches >= 2) {
      // Success!
      setWalletBalance(prev => prev + activeQuest.rewardCoins);
      addXP(activeQuest.rewardXp);
      setQuestRewards({ coins: activeQuest.rewardCoins, xp: activeQuest.rewardXp });
      setIsQuestSuccessModal(true);
      setActiveQuest(null);
      // Reset selected outfits
      setSelectedApparel({ body: null, head: null, eyes: null, hands: null, feet: null });
    } else {
      // Fail
      setIsQuestFailModal(true);
    }
  };

  return (
    <div className="app-container">
      {/* Header Panel */}
      <header className="app-header">
        <div className="brand" onClick={() => setView('lobby')} style={{ cursor: 'pointer' }}>
          <span className="brand-icon">🦁</span>
          <div className="brand-text">
            <h1>Moffi Kombinle</h1>
            <p>Tarz Tasarımı & Düello Arenası</p>
          </div>
        </div>

        {/* Navigation Tabs - Hidden in Lobby */}
        {view !== 'lobby' && (
          <nav className="app-nav animate-fade-in">
            <button 
              className={`nav-btn ${view === 'styling' ? 'active' : ''}`}
              onClick={() => setView('styling')}
            >
              <Shirt className="w-4 h-4" />
              <span>Tasarım Odası</span>
            </button>
            <button 
              className={`nav-btn ${view === 'battle' ? 'active' : ''}`}
              onClick={() => setView('battle')}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Tarz Düellosu</span>
            </button>
            <button 
              className={`nav-btn ${view === 'feed' ? 'active' : ''}`}
              onClick={() => setView('feed')}
            >
              <Compass className="w-4 h-4" />
              <span>Trendler & Görevler</span>
            </button>
            <button 
              className={`nav-btn ${view === 'lookbook' ? 'active' : ''}`}
              onClick={() => setView('lookbook')}
            >
              <BookOpen className="w-4 h-4" />
              <span>Kombin Defterim</span>
            </button>
          </nav>
        )}

        {/* Global Wallet & Level Stats */}
        <div className="user-stats">
          <button 
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.8 rounded-xl text-amber-400 text-xs font-black hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer mr-1"
          >
            ❓ Nasıl Oynanır?
          </button>
          <button 
            onClick={handleReturnToMoffi}
            className="return-btn"
            title="Moffi Topluluk Sayfasına Geri Dön"
          >
            🐾 Moffi'ye Dön
          </button>
          {view !== 'lobby' && (
            <button 
              onClick={() => setView('lobby')}
              className="flex items-center gap-1.5 bg-purple-950/45 border border-purple-500/25 px-3 py-1.8 rounded-xl text-purple-300 text-xs font-black hover:bg-purple-950/60 active:scale-95 transition-all cursor-pointer mr-2"
            >
              🚪 Lobi
            </button>
          )}
          <div className="stat-badge coins">
            <Coins className="w-4 h-4" />
            <span>🪙 {walletBalance}</span>
          </div>
          <div className="stat-badge level">
            <Trophy className="w-4 h-4" />
            <span>Seviye {stylingLevel} <span className="xp-text">({stylingXP}/{stylingLevel * 50} XP)</span></span>
          </div>
        </div>
      </header>

      {/* Main Body Switcher */}
      <main className="main-content">
        
        {/* VIEW LOBBY: CINEMATIC PORTAL SELECTION (3 KAPILI STİL EVRENİ) */}
        {view === 'lobby' && (
          <div className="lobby-container">
            <div className="lobby-header">
              <h2>Moffi Stil Evrenine Hoş Geldin!</h2>
              <p>Evcil hayvan tarzını oluştur, rekabet et ve gizemli sandıkları aç!</p>
            </div>

            {/* Three Portal Doors */}
            <div className="portal-doors-grid">
              
              {/* Card 1: Styling Studio */}
              <div className="portal-card styling" onClick={() => setView('styling')}>
                <div className="portal-visual">🎨</div>
                <div className="portal-details">
                  <h3>Tasarım Atölyesi</h3>
                  <p>Maskotunu mor tüy kaplamalarıyla boya, kıyafetler giydir ve tarzını kaydet.</p>
                </div>
                <button className="flex items-center gap-1 text-xs text-purple-400 font-extrabold mt-2">
                  Atölyeye Gir <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 2: Battle Arena */}
              <div className="portal-card battle" onClick={() => setView('battle')}>
                <div className="portal-visual">⚔️</div>
                <div className="portal-details">
                  <h3>Düello Arenası</h3>
                  <p>Topluluğun oluşturduğu kombinleri kapıştır, oylama yap ve MoffiCoin biriktir.</p>
                </div>
                <button className="flex items-center gap-1 text-xs text-pink-400 font-extrabold mt-2">
                  Arenaya Geç <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 3: Daily Quests / Trends */}
              <div className="portal-card quests" onClick={() => setView('feed')}>
                <div className="portal-visual">🏆</div>
                <div className="portal-details">
                  <h3>Trendler & Görevler</h3>
                  <p>Temalı günlük yarışma kurallarına göre kombin yapıp ekstra ödüller topla.</p>
                </div>
                <button className="flex items-center gap-1 text-xs text-amber-400 font-extrabold mt-2">
                  Görevleri Gör <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Interactive Gacha Chest (Şans Modu) */}
            <div className="gacha-widget">
              <div className="gacha-chest-box" onClick={handleOpenChest}>
                <span className={`chest-emoji block ${isShaking ? 'animate-shake' : ''}`}>🎁</span>
              </div>
              <div className="gacha-info">
                <h4>Gizemli Tarz Sandığı</h4>
                <p>Sandığı açarak kilitli olan sweatshirt, pijama, boks eldiveni veya taçlardan birini anında kazan!</p>
              </div>
              <button 
                onClick={handleOpenChest}
                disabled={isShaking}
                className="btn-gacha-open"
              >
                100 MoffiCoin
              </button>
            </div>

          </div>
        )}
        
        {/* TAB 1: CUSTOM STYLING STUDIO */}
        {view === 'styling' && (
          <div className="grid-studio">
            
            {/* Quest HUD Banner */}
            {activeQuest && (
              <div className="quest-hud-banner bg-amber-950/45 border border-amber-500/30 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-3 text-amber-200 w-full col-span-1 md:col-span-2">
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Aktif Görev Hedefleri</span>
                  <h4 className="text-sm font-black">{activeQuest.title}</h4>
                </div>
                <div className="flex flex-wrap gap-2.5 justify-center">
                  {activeQuest.requirements.map((req: string, idx: number) => {
                    const equipped = [
                      selectedApparel.body as string | null,
                      selectedApparel.head as string | null,
                      selectedApparel.eyes as string | null,
                      selectedApparel.hands as string | null,
                      selectedApparel.feet as string | null
                    ].filter((x): x is string => x !== null);
                    const isEquipped = equipped.includes(req);
                    return (
                      <span key={req} className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${isEquipped ? 'bg-emerald-950/65 border-emerald-500/35 text-emerald-300' : 'bg-amber-950/20 border-amber-500/15 text-amber-400'}`}>
                        {isEquipped ? '✓' : '○'} {activeQuest.reqLabels[idx]}
                      </span>
                    );
                  })}
                </div>
                <button 
                  onClick={handleQuestSubmit}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-md"
                >
                  Görevi Gönder ➔
                </button>
              </div>
            )}

            {/* Left Column: Mascot Canvas */}
            <div className="studio-viewport">
              <div className={`studio-backdrop backdrop-${activeBg}`}>
                {activeBg === 'stage' && <div className="stage-light" />}
                {activeBg === 'cyber' && <div className="cyber-grid-glow" />}
                {activeBg === 'space' && (
                  <>
                    <div className="space-star" style={{ top: '15%', left: '25%', width: '2px', height: '2px' }} />
                    <div className="space-star" style={{ top: '40%', left: '75%', width: '3px', height: '3px', animationDelay: '1s' }} />
                    <div className="space-star" style={{ top: '75%', left: '15%', width: '2px', height: '2px', animationDelay: '1.5s' }} />
                    <div className="space-star" style={{ top: '25%', left: '85%', width: '3px', height: '3px', animationDelay: '0.5s' }} />
                  </>
                )}
              </div>

              <div className="mascot-container">
                <MascotSVG apparel={selectedApparel} bodyColor={bodyColor} isBlinking={isBlinking} isEquipTriggered={isEquipTriggered} isCat={isCat} isDog={isDog} />
              </div>

              {/* Floating Style Point badge */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide flex items-center gap-1.5 z-10 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>COMBIN SCORE: <span className="text-purple-400">{currentSP} SP</span></span>
              </div>
            </div>

            {/* Right Column: Wardrobe Controls */}
            <div className="studio-drawer">
              <div className="drawer-header">
                <h3>🛍️ Gardırop Çekmeceleri</h3>
                <span>{Object.values(selectedApparel).filter(Boolean).length} Eşya Kuşandı</span>
              </div>

              {/* Category tabs */}
              <div className="drawer-tabs">
                <button 
                  className={`tab-btn ${activeWardrobeTab === 'body' ? 'active' : ''}`}
                  onClick={() => setActiveWardrobeTab('body')}
                >
                  👕 Vücut
                </button>
                <button 
                  className={`tab-btn ${activeWardrobeTab === 'head' ? 'active' : ''}`}
                  onClick={() => setActiveWardrobeTab('head')}
                >
                  👒 Başlık
                </button>
                <button 
                  className={`tab-btn ${activeWardrobeTab === 'eyes' ? 'active' : ''}`}
                  onClick={() => setActiveWardrobeTab('eyes')}
                >
                  🕶️ Gözlük
                </button>
                <button 
                  className={`tab-btn ${activeWardrobeTab === 'hands' ? 'active' : ''}`}
                  onClick={() => setActiveWardrobeTab('hands')}
                >
                  🧤 Kollar
                </button>
                <button 
                  className={`tab-btn ${activeWardrobeTab === 'feet' ? 'active' : ''}`}
                  onClick={() => setActiveWardrobeTab('feet')}
                >
                  👟 Ayaklar
                </button>
                <button 
                  className={`tab-btn ${activeWardrobeTab === 'color' ? 'active' : ''}`}
                  onClick={() => setActiveWardrobeTab('color')}
                >
                  🎨 Tüy Rengi
                </button>
                <button 
                  className={`tab-btn ${activeWardrobeTab === 'bg' ? 'active' : ''}`}
                  onClick={() => setActiveWardrobeTab('bg')}
                >
                  🖼️ Sahne
                </button>
              </div>

              {/* Items grid for selected tab */}
              <div className="items-grid">
                
                {/* WARDROBE CATEGORIES */}
                {['body', 'head', 'eyes', 'hands', 'feet'].includes(activeWardrobeTab) && 
                  WARDROBE_ITEMS[activeWardrobeTab as keyof typeof WARDROBE_ITEMS].map((item) => {
                    const isUnlocked = unlockedItems.includes(item.id);
                    const isEquipped = selectedApparel[activeWardrobeTab as keyof typeof WARDROBE_ITEMS] === item.id;
                    
                    return (
                      <div 
                        key={item.id}
                        onClick={() => handleItemClick(
                          activeWardrobeTab as keyof typeof WARDROBE_ITEMS, 
                          item.id, 
                          item.cost, 
                          item.sp, 
                          item.label
                        )}
                        className={`item-card rarity-${item.rarity} ${isEquipped ? 'selected' : ''}`}
                      >
                        {!isUnlocked && (
                          <span className="item-lock">
                            <Lock className="w-2.5 h-2.5" />
                            {item.cost}
                          </span>
                        )}
                        <span className="item-visual">{item.icon}</span>
                        <span className="item-label">{item.label}</span>
                        <span className="item-price">+{item.sp} SP</span>
                      </div>
                    );
                })}

                {/* BODY COLORS */}
                {activeWardrobeTab === 'color' && BODY_COLORS.map(color => (
                  <div 
                    key={color.value}
                    onClick={() => {
                      setBodyColor(color.value);
                      triggerToast(`🎨 Tüy rengi "${color.label}" olarak değiştirildi!`, '🖌️');
                    }}
                    className={`item-card ${bodyColor === color.value ? 'selected' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full ${color.color} border-2 border-white/20`} />
                    <span className="item-label mt-1">{color.label}</span>
                  </div>
                ))}

                {/* BACKGROUND BACKDROPS */}
                {activeWardrobeTab === 'bg' && BACKGROUNDS.map(bg => (
                  <div 
                    key={bg.id}
                    onClick={() => {
                      setActiveBg(bg.id);
                      triggerToast(`🖼️ Arka plan "${bg.label}" olarak değiştirildi!`, '🖼️');
                    }}
                    className={`item-card ${activeBg === bg.id ? 'selected' : ''}`}
                  >
                    <span className="item-visual">🖼️</span>
                    <span className="item-label">{bg.label}</span>
                    <span className="item-price">+{bg.sp} SP</span>
                  </div>
                ))}
              </div>

              {/* Text input to name output */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Kombin Adı</label>
                <input 
                  type="text" 
                  value={activeOutfitName}
                  onChange={(e) => setActiveOutfitName(e.target.value)}
                  className="w-full bg-white/3 border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                  placeholder="Kombinine havalı bir isim ver..."
                />
              </div>

              {/* Drawer actions */}
              <div className="drawer-actions">
                <button 
                  onClick={() => {
                    setSelectedApparel({ body: null, head: null, eyes: null, hands: null, feet: null });
                    setBodyColor('#8b5cf6');
                    setActiveBg('stage');
                    triggerToast('🧹 Tüm giysiler çıkarıldı.', '🧹');
                  }}
                  className="btn-action secondary"
                  title="Sıfırla"
                >
                  🧹 Sıfırla
                </button>
                <button 
                  onClick={handleShuffle}
                  className="btn-action secondary"
                  title="Sahip olduğun giysilerden rastgele kombin yap"
                >
                  🎲 Rastgele
                </button>
                <button 
                  onClick={handleSaveOutfit}
                  className="btn-action primary"
                >
                  📸 Kaydet
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: STYLE BATTLE ARENA */}
        {view === 'battle' && (
          <div className="battle-container animate-fade-in">
            <div className="battle-header">
              <h2>⚔️ Tarz Düellosu Arenası</h2>
              <p className="text-xs text-gray-400">Diğer kullanıcıların kombinlerini oyla, kazananı seç ve MoffiCoin kazan!</p>
            </div>

            {battleCompetitors.length === 2 && (
              <div className="battle-arena">
                
                {/* Competitor A */}
                <div 
                  className={`battle-card ${hasVoted && votedChoice === 1 ? 'voted' : ''}`}
                  onClick={() => handleVote(1)}
                >
                  {hasVoted && votedChoice === 1 && (
                    <span className="vote-overlay">
                      <Check className="w-3.5 h-3.5" />
                      Oyladın
                    </span>
                  )}
                  <div className="battle-mascot-box">
                    <div className={`absolute inset-0 backdrop-${battleCompetitors[0].bg} opacity-50 z-0`} />
                    <MascotSVG apparel={battleCompetitors[0].apparel} bodyColor={battleCompetitors[0].color} customStyle={{ zIndex: 1 }} />
                  </div>
                  <div className="battle-card-details">
                    <h4>{battleCompetitors[0].name}</h4>
                    <span className="sp-tag">{battleCompetitors[0].sp} Tarz Puanı</span>
                    {hasVoted && (
                      <div className="battle-results">
                        <span className="battle-percent">{Math.round((battleCompetitors[0].sp / (battleCompetitors[0].sp + battleCompetitors[1].sp)) * 100)}% Oy</span>
                        <div className="battle-bar-container">
                          <div className="battle-bar-fill left" style={{ width: `${Math.round((battleCompetitors[0].sp / (battleCompetitors[0].sp + battleCompetitors[1].sp)) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* VS Badge separator */}
                <div className="vs-badge">VS</div>

                {/* Competitor B */}
                <div 
                  className={`battle-card ${hasVoted && votedChoice === 2 ? 'voted' : ''}`}
                  onClick={() => handleVote(2)}
                >
                  {hasVoted && votedChoice === 2 && (
                    <span className="vote-overlay">
                      <Check className="w-3.5 h-3.5" />
                      Oyladın
                    </span>
                  )}
                  <div className="battle-mascot-box">
                    <div className={`absolute inset-0 backdrop-${battleCompetitors[1].bg} opacity-50 z-0`} />
                    <MascotSVG apparel={battleCompetitors[1].apparel} bodyColor={battleCompetitors[1].color} customStyle={{ zIndex: 1 }} />
                  </div>
                  <div className="battle-card-details">
                    <h4>{battleCompetitors[1].name}</h4>
                    <span className="sp-tag">{battleCompetitors[1].sp} Tarz Puanı</span>
                    {hasVoted && (
                      <div className="battle-results">
                        <span className="battle-percent">{100 - Math.round((battleCompetitors[0].sp / (battleCompetitors[0].sp + battleCompetitors[1].sp)) * 100)}% Oy</span>
                        <div className="battle-bar-container">
                          <div className="battle-bar-fill right" style={{ width: `${100 - Math.round((battleCompetitors[0].sp / (battleCompetitors[0].sp + battleCompetitors[1].sp)) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Next Battle Action */}
            {hasVoted && (
              <button 
                onClick={generateNewBattle}
                className="w-full max-w-[200px] mx-auto mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md text-center"
              >
                Yeni Düelloya Geç ➔
              </button>
            )}
          </div>
        )}

        {/* TAB 3: PERSONAL LOOKBOOK */}
        {view === 'lookbook' && (
          <div className="lookbook-view-container flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-gradient uppercase tracking-wider">📂 Benim Albümüm ({lookbook.length})</h2>
              <span className="text-[10px] text-gray-400 font-bold">Kombinlerin Polaroid Kartlarda Saklanıyor</span>
            </div>

            {lookbook.length === 0 ? (
              <div className="text-center py-12 bg-white/2 border border-dashed border-white/10 rounded-3xl">
                <span className="text-3xl opacity-50 block">📸</span>
                <p className="text-xs text-gray-400 font-bold mt-2">Henüz kaydedilmiş bir kombin fotoğrafı yok!</p>
                <button 
                  onClick={() => setView('styling')}
                  className="mt-4 bg-purple-600 text-white font-black text-[10.5px] px-4 py-2 rounded-xl"
                >
                  Kombin Tasarlamaya Başla
                </button>
              </div>
            ) : (
              <div className="lookbook-grid">
                {lookbook.map((outfit) => (
                  <div key={outfit.id} className="polaroid-card">
                    <div className="polaroid-image">
                      <div className={`absolute inset-0 backdrop-${outfit.bg} opacity-35 z-0`} />
                      <MascotSVG apparel={outfit.apparel} bodyColor={outfit.bodyColor} customStyle={{ zIndex: 1, width: '90%', height: '90%' }} />
                      <button 
                        onClick={() => handleDeleteOutfit(outfit.id, outfit.name)}
                        className="polaroid-delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="polaroid-label">
                      <span className="polaroid-title">{outfit.name}</span>
                      <span className="polaroid-date">{outfit.date}</span>
                      <span className="polaroid-sp">{outfit.sp} Tarz Puanı</span>
                      <button 
                        onClick={() => handleSendToArena(outfit)}
                        className="mt-2 w-full bg-pink-600 hover:bg-pink-700 text-white font-black text-[9px] py-1.5 rounded-lg transition-all"
                      >
                        ⚔️ Arenaya Gönder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TREND FEED & STYLE QUESTS */}
        {view === 'feed' && (
          <div className="quests-view-container flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="lobby-header text-center">
              <h2>🏆 Hikaye & Görev Odası</h2>
              <p>Temalı görevleri tamamla, tarzını kanıtla ve büyük ödüller kazan!</p>
            </div>

            <div className="quests-main-grid">
              {QUESTS_LIST.map((quest) => {
                const isActive = activeQuest?.id === quest.id;
                return (
                  <div key={quest.id} className={`quest-card ${isActive ? 'active-quest' : ''}`}>
                    <div className="flex flex-col gap-1.5 text-left">
                      <span className={`quest-tag ${quest.tag}`}>{quest.tag}</span>
                      <h4 className="text-sm font-black text-white">{quest.title}</h4>
                      <p className="text-xs text-gray-400 font-semibold leading-normal">{quest.desc}</p>
                    </div>

                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Gereksinimler</span>
                      <div className="flex flex-wrap gap-1.5">
                        {quest.reqLabels.map((lbl) => (
                          <span key={lbl} className="quest-item-badge">{lbl}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-400">🪙 {quest.rewardCoins}</span>
                        <span className="text-[10px] font-bold text-purple-400">⚡ {quest.rewardXp} XP</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          setActiveQuest(quest);
                          setView('styling');
                          setActiveBg(quest.bg);
                          triggerToast(`🎯 "${quest.title}" görevi aktif edildi! Atölyeye gidiliyor.`, '🎯');
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.8 rounded-xl text-xs font-black transition-all cursor-pointer ${isActive ? 'bg-amber-500 text-amber-950 font-black' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                      >
                        {isActive ? 'Aktif Görev' : 'Görevi Dene ➔'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Daily Trends Showcase (Original list) */}
            <div className="flex flex-col gap-4 mt-6">
              <h3 className="text-md font-black text-gradient uppercase tracking-wider text-left">🔥 Günün Trend Kombinleri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: 't-1',
                    creator: 'MoffiBoss ✨',
                    likes: 124,
                    name: 'Kozmik Korsan',
                    apparel: { body: 'singlet', head: 'pirate_hat', eyes: 'eyepatch', hands: 'boxing', feet: 'boots' },
                    color: '#06b6d4',
                    bg: 'space',
                    sp: 320
                  },
                  {
                    id: 't-2',
                    creator: 'KraliçeLuna 👑',
                    likes: 98,
                    name: 'Altın Taç Şıklığı',
                    apparel: { body: 'sweatshirt', head: 'crown', eyes: 'glasses', hands: null, feet: 'sneakers' },
                    color: '#ec4899',
                    bg: 'stage',
                    sp: 410
                  }
                ].map(post => (
                  <div key={post.id} className="bg-zinc-900/40 border border-white/5 p-4 rounded-3xl flex gap-4 items-center">
                    <div className="w-[120px] aspect-ratio-[10/12] bg-black/40 rounded-2xl overflow-hidden relative flex items-center justify-center p-2 shrink-0 shadow-inner">
                      <div className={`absolute inset-0 backdrop-${post.bg} opacity-30 z-0`} />
                      <MascotSVG apparel={post.apparel as ApparelState} bodyColor={post.color} customStyle={{ zIndex: 1 }} />
                    </div>
                    <div className="flex flex-col gap-2 flex-grow text-left">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-purple-400 font-black tracking-wide">Yaratıcı: {post.creator}</span>
                        <h4 className="text-sm font-black text-white mt-0.5">{post.name}</h4>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-bold text-gray-300">{post.sp} SP</span>
                        <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md font-bold text-purple-300">Tema Uyumlu</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-2">
                        <button className="flex items-center gap-1.5 text-pink-400 text-xs font-black bg-pink-500/10 border border-pink-500/25 px-2.5 py-1 rounded-xl active:scale-95 transition-all">
                          <Heart className="w-3.5 h-3.5" fill="currentColor" />
                          <span>{post.likes} Beğeni</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Gacha Open Reward Modal */}
      {isChestOpenModal && gachaAward && (
        <div className="modal-overlay" onClick={() => setIsChestOpenModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-gradient text-xl font-black">🎁 Sandıktan Yeni Eşya Çıktı!</h3>
            <div className="modal-chest-open">📦✨</div>
            
            <div className={`modal-award-card border-rarity-${gachaAward.rarity} aura-${gachaAward.rarity}`}>
              <span className="modal-award-visual">{gachaAward.icon}</span>
              <span className="modal-award-label">{gachaAward.label}</span>
              {gachaAward.sp > 0 && (
                <span className="modal-award-sp">+{gachaAward.sp} Tarz SP</span>
              )}
            </div>

            <p className="text-xs text-gray-400 font-semibold mb-4 leading-normal">
              Eşyanız gardıroba yerleştirildi. Hemen süsleme stüdyosuna giderek deneyebilirsin!
            </p>
            
            <button 
              onClick={() => {
                setIsChestOpenModal(false);
                setView('styling');
              }}
              className="btn-action primary w-full"
            >
              Stüdyoya Git ve Kuşan ➔
            </button>
          </div>
        </div>
      )}

      {/* Quest Success Modal */}
      {isQuestSuccessModal && (
        <div className="modal-overlay" onClick={() => setIsQuestSuccessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-emerald-400 text-xl font-black">🏆 Görev Başarıyla Tamamlandı!</h3>
            <div className="modal-chest-open">🌟👑🎉</div>
            <p className="text-xs text-gray-300 font-bold mt-2">Harika bir kombin yaptın! Tema hedeflerini tam olarak tutturdun.</p>
            <div className="modal-award-card border-rarity-legendary aura-legendary">
              <span className="modal-award-visual">🎁</span>
              <span className="modal-award-label">Görev Ödülü</span>
              <span className="modal-award-sp text-amber-400" style={{ color: '#fbbf24' }}>🪙 +{questRewards.coins} MoffiCoin</span>
              <span className="modal-award-sp text-purple-400" style={{ color: '#a78bfa' }}>⚡ +{questRewards.xp} XP</span>
            </div>
            <button 
              onClick={() => setIsQuestSuccessModal(false)}
              className="btn-action primary w-full"
            >
              Kutla ve Devam Et ➔
            </button>
          </div>
        </div>
      )}

      {/* Quest Fail Modal */}
      {isQuestFailModal && (
        <div className="modal-overlay" onClick={() => setIsQuestFailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-red-400 text-xl font-black">❌ Görev Tamamlanamadı!</h3>
            <div className="modal-chest-open">😔🧣</div>
            <p className="text-xs text-gray-300 font-bold mt-2">Tasarımın, görevin beklediği tarzı yansıtmıyor.</p>
            <p className="text-xs text-gray-400 mt-2">Lütfen istenen hedeflerden en az 2 tanesini giydiğinden emin ol ve tekrar dene!</p>
            <button 
              onClick={() => setIsQuestFailModal(false)}
              className="btn-action primary w-full mt-4"
            >
              Geri Dön ve Düzenle
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="toast-alert">
          <span className="toast-icon">{toast.icon}</span>
          <span className="toast-msg">{toast.msg}</span>
        </div>
      )}

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-btn ${view === 'lobby' ? 'active' : ''}`}
          onClick={() => setView('lobby')}
        >
          <Home className="w-5 h-5" />
          <span>Lobi</span>
        </button>
        <button 
          className={`mobile-nav-btn ${view === 'styling' ? 'active' : ''}`}
          onClick={() => setView('styling')}
        >
          <Shirt className="w-5 h-5" />
          <span>Atölye</span>
        </button>
        <button 
          className={`mobile-nav-btn ${view === 'battle' ? 'active' : ''}`}
          onClick={() => setView('battle')}
        >
          <Gamepad2 className="w-5 h-5" />
          <span>Düello</span>
        </button>
        <button 
          className={`mobile-nav-btn ${view === 'feed' ? 'active' : ''}`}
          onClick={() => setView('feed')}
        >
          <Compass className="w-5 h-5" />
          <span>Görevler</span>
        </button>
        <button 
          className={`mobile-nav-btn ${view === 'lookbook' ? 'active' : ''}`}
          onClick={() => setView('lookbook')}
        >
          <BookOpen className="w-5 h-5" />
          <span>Albüm</span>
        </button>
      </nav>

      {/* How to Play Onboarding Guide Modal */}
      {showGuideModal && (
        <div className="modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="modal-content text-left" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-gradient text-xl font-black mb-3">🐾 Moffi Kombinle Nedir?</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              Moffi Kombinle, evcil hayvanının tarzını oluşturduğun, yarışarak ve topluluktaki diğer kombinleri oylayarak **MoffiCoin kazandığın** eğlenceli bir giydirme arenasıdır!
            </p>
            <div className="flex flex-col gap-3.5 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0 text-sm">🎨</div>
                <div className="flex flex-col text-left">
                  <h4 className="text-xs font-black text-white">1. Tarzını Tasarla</h4>
                  <p className="text-[10px] text-gray-400">Atölyede petine takım elbiseler, bereler ve vizörler giydir, tarz skorunu (SP) yükselt.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/25 flex items-center justify-center text-pink-400 shrink-0 text-sm">⚔️</div>
                <div className="flex flex-col text-left">
                  <h4 className="text-xs font-black text-white">2. Düellolara Katıl</h4>
                  <p className="text-[10px] text-gray-400">Tasarımlarını Arenaya gönder. Diğer kullanıcılar tarafından oylansın, tarz liginde zirveye tırman.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 text-sm">🪙</div>
                <div className="flex flex-col text-left">
                  <h4 className="text-xs font-black text-white">3. MoffiCoin Kazan</h4>
                  <p className="text-[10px] text-gray-400">Kazandığın MoffiCoin'leri **Moffi Shop**'ta biriktirip, gerçek hayattaki pet mamanı indirimli al!</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowGuideModal(false);
                localStorage.setItem('moffi_kombinle_onboarded', 'true');
              }}
              className="btn-action primary w-full"
            >
              Hazırım, Başlayalım! ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
