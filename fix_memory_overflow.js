const fs = require('fs');

let code = fs.readFileSync('src/components/game/PetMemoryGame.tsx', 'utf8');

// Update LEVELS array
const newLevels = `
// ==============================
// 1. OYUN YAPILANDIRMASI (4 AŞAMA - Optimize)
// ==============================
const LEVELS = [
    { level: 1, cols: 4, pairs: 4, time: 30, name: "SİBER ACEMİ" },     // 8 Cards  (4x2)
    { level: 2, cols: 4, pairs: 6, time: 40, name: "MATRİX'E GİRİŞ" },  // 12 Cards (4x3)
    { level: 3, cols: 4, pairs: 8, time: 50, name: "ZİHİN HACKER'I" },  // 16 Cards (4x4)
    { level: 4, cols: 5, pairs: 10, time: 60, name: "SİBER TANRI" },    // 20 Cards (5x4)
];
`;
code = code.replace(/\/\/ ==============================\r?\n\/\/ 1\. OYUN YAPILANDIRMASI.*?\r?\n\/\/ ==============================\r?\nconst LEVELS = \[[\s\S]*?\];/m, newLevels);

// Update grid and card sizing to prevent overflow
// Find the grid container: className="grid gap-3 w-full"
code = code.replace(
    /className="grid gap-3 w-full"/g,
    'className="grid gap-2 md:gap-3 w-full h-full max-h-[70vh] place-content-center"'
);

// Find card aspect ratio: className="aspect-[3/4] relative perspective-1000"
// Change it to aspect-square or a more responsive size depending on level
code = code.replace(
    /className="aspect-\[3\/4\] relative perspective-1000"/g,
    'className={cn("relative perspective-1000 w-full max-w-[90px] md:max-w-[120px] mx-auto", currentLevel === 4 ? "aspect-square" : "aspect-[3/4]")}'
);

// Update emoji size so it doesn't break out of the card on smaller screens
code = code.replace(
    /text-5xl md:text-6xl/g,
    'text-3xl md:text-5xl'
);

fs.writeFileSync('src/components/game/PetMemoryGame.tsx', code, 'utf8');
console.log('Successfully optimized Memory Game layout and reduced to 4 stages.');
