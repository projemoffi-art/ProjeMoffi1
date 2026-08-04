const fs = require('fs');

let code = fs.readFileSync('src/components/game/PetMemoryGame.tsx', 'utf8');

// Remove Lucide icons that cause Turbopack panic
code = code.replace(
    /import \{\s*Trophy, Timer, X, ArrowRight, Flame,\s*Zap, Star, Rocket, Target, Heart,\s*Crown, Ghost, Gem, Diamond, Cpu, Gamepad2\s*\} from "lucide-react";/g,
    'import { Trophy, Timer, X, ArrowRight } from "lucide-react";'
);

// Replace ICONS array with Emojis
const newIcons = `
// ==============================
// 2. NEON EMOJİLER (Turbopack Crash Fix)
// ==============================
const ICONS = [
    { emoji: "🔥", glow: "drop-shadow-[0_0_20px_rgba(249,115,22,1)]" },
    { emoji: "⚡", glow: "drop-shadow-[0_0_20px_rgba(34,211,238,1)]" },
    { emoji: "⭐", glow: "drop-shadow-[0_0_20px_rgba(250,204,21,1)]" },
    { emoji: "🚀", glow: "drop-shadow-[0_0_20px_rgba(239,68,68,1)]" },
    { emoji: "🎯", glow: "drop-shadow-[0_0_20px_rgba(74,222,128,1)]" },
    { emoji: "💖", glow: "drop-shadow-[0_0_20px_rgba(236,72,153,1)]" },
    { emoji: "👑", glow: "drop-shadow-[0_0_20px_rgba(245,158,11,1)]" },
    { emoji: "👻", glow: "drop-shadow-[0_0_20px_rgba(192,132,252,1)]" },
    { emoji: "💎", glow: "drop-shadow-[0_0_20px_rgba(96,165,250,1)]" },
    { emoji: "🛡️", glow: "drop-shadow-[0_0_20px_rgba(45,212,191,1)]" },
    { emoji: "🕹️", glow: "drop-shadow-[0_0_20px_rgba(232,121,249,1)]" },
    { emoji: "🧿", glow: "drop-shadow-[0_0_20px_rgba(129,140,248,1)]" },
];
`;

code = code.replace(/\/\/ ==============================\r?\n\/\/ 2\. NEON İKONLAR.*?\r?\n\/\/ ==============================\r?\nconst ICONS = \[[\s\S]*?\];/m, newIcons);

// Update render logic in handleCardClick
code = code.replace(/card1\.iconData\.icon === card2\.iconData\.icon/g, 'card1.iconData.emoji === card2.iconData.emoji');

// Update render logic in map
code = code.replace(
    /const IconComponent = card\.iconData\?\.icon;\r?\n\s*return \(/g,
    'const emoji = card.iconData?.emoji;\n                        return ('
);

code = code.replace(
    /\{IconComponent && \(\r?\n\s*<IconComponent className=\{cn\("w-12 h-12 md:w-16 md:h-16", card\.iconData\.color, card\.iconData\.glow\)\} \/>\r?\n\s*\)\}/g,
    '{emoji && (\n                                            <span className={cn("text-5xl md:text-6xl", card.iconData.glow)}>{emoji}</span>\n                                        )}'
);

fs.writeFileSync('src/components/game/PetMemoryGame.tsx', code, 'utf8');
console.log('Successfully switched to Emojis to fix Turbopack crash.');
