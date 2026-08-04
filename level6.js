const fs = require('fs');

let code = fs.readFileSync('src/components/game/PetMemoryGame.tsx', 'utf8');

// 1. Add 3 more icons to ICONS
const oldIconsEnd = `{ emoji: "🔔", glow: "drop-shadow-[0_0_20px_rgba(250,204,21,1)]" },   // Çıngırak/Tasma
];`;
const newIconsEnd = `{ emoji: "🔔", glow: "drop-shadow-[0_0_20px_rgba(250,204,21,1)]" },   // Çıngırak/Tasma
    { emoji: "🥎", glow: "drop-shadow-[0_0_20px_rgba(163,230,53,1)]" },   // Tenis Topu
    { emoji: "🛸", glow: "drop-shadow-[0_0_20px_rgba(167,139,250,1)]" },   // Frizbi (Uçan Daire)
    { emoji: "🏆", glow: "drop-shadow-[0_0_20px_rgba(251,191,36,1)]" },   // Ödül Kupası
];`;
code = code.replace(oldIconsEnd, newIconsEnd);

// 2. Add Level 6 to LEVELS
const oldLevelsEnd = `{ level: 5, cols: 6, pairs: 12, time: 70, name: "SİBER EFSANE" },     // 24 Cards
];`;
const newLevelsEnd = `{ level: 5, cols: 6, pairs: 12, time: 70, name: "SİBER EFSANE" },     // 24 Cards
    { level: 6, cols: 6, pairs: 15, time: 80, name: "BİLİNÇ ÖTESİ" },    // 30 Cards
];`;
code = code.replace(oldLevelsEnd, newLevelsEnd);

// 3. Update grid styling for Level 6
code = code.replace(
    /className=\{cn\("relative perspective-1000 w-full mx-auto", currentLevel >= 4 \? "aspect-square max-w-\[70px\] md:max-w-\[100px\]" : "aspect-\[3\/4\] max-w-\[90px\] md:max-w-\[120px\]"\)\}/g,
    'className={cn("relative perspective-1000 w-full mx-auto", currentLevel >= 6 ? "aspect-square max-w-[60px] md:max-w-[80px]" : currentLevel >= 4 ? "aspect-square max-w-[70px] md:max-w-[100px]" : "aspect-[3/4] max-w-[90px] md:max-w-[120px]")}'
);

// 4. Update the futuristic ending text to mention future updates
code = code.replace(
    /\{gameState === 'game_complete' \? 'BİLİNCİN MATRİX İLE TAMAMEN BÜTÜNLEŞTİ\.' : 'Bağlantı koptu\. Daha hızlı olmalısın\.'\}/g,
    "{gameState === 'game_complete' ? 'BİLİNCİN MATRİX İLE TAMAMEN BÜTÜNLEŞTİ. Yakında çok daha zorlu yeni modüller eklenecek, kendini geliştirmeye devam et!' : 'Bağlantı koptu. Daha hızlı olmalısın.'}"
);

fs.writeFileSync('src/components/game/PetMemoryGame.tsx', code, 'utf8');
console.log('Successfully added Level 6 and updated ending text!');
