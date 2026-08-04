const fs = require('fs');

let code = fs.readFileSync('src/components/game/PetMemoryGame.tsx', 'utf8');

// 1. Update ICONS to Pet-Themed Emojis
const newIcons = `
// ==============================
// 2. PET-TEMALI NEON EMOJİLER (Siberpunk Hayvan Evreni)
// ==============================
const ICONS = [
    { emoji: "🐾", glow: "drop-shadow-[0_0_20px_rgba(249,115,22,1)]" },   // Pati
    { emoji: "🦴", glow: "drop-shadow-[0_0_20px_rgba(34,211,238,1)]" },   // Kemik
    { emoji: "🍖", glow: "drop-shadow-[0_0_20px_rgba(250,204,21,1)]" },   // Et
    { emoji: "🐟", glow: "drop-shadow-[0_0_20px_rgba(239,68,68,1)]" },    // Balık
    { emoji: "🪶", glow: "drop-shadow-[0_0_20px_rgba(192,132,252,1)]" },  // Tüy
    { emoji: "💩", glow: "drop-shadow-[0_0_20px_rgba(168,162,158,1)]" },  // Kaka
    { emoji: "🏠", glow: "drop-shadow-[0_0_20px_rgba(74,222,128,1)]" },   // Kulübe
    { emoji: "🛏️", glow: "drop-shadow-[0_0_20px_rgba(236,72,153,1)]" },   // Yastık
    { emoji: "🥣", glow: "drop-shadow-[0_0_20px_rgba(96,165,250,1)]" },   // Mama Kabı
    { emoji: "🧶", glow: "drop-shadow-[0_0_20px_rgba(245,158,11,1)]" },   // Yumak
    { emoji: "🐁", glow: "drop-shadow-[0_0_20px_rgba(209,213,219,1)]" },  // Oyuncak Fare
    { emoji: "🔔", glow: "drop-shadow-[0_0_20px_rgba(250,204,21,1)]" },   // Çıngırak/Tasma
];
`;
code = code.replace(/\/\/ ==============================\r?\n\/\/ 2\. NEON EMOJİLER.*?\r?\n\/\/ ==============================\r?\nconst ICONS = \[[\s\S]*?\];/m, newIcons);


// 2. Update LEVELS to 5 stages
const newLevels = `
// ==============================
// 1. OYUN YAPILANDIRMASI (5 AŞAMA - Destansı)
// ==============================
const LEVELS = [
    { level: 1, cols: 4, pairs: 4, time: 30, name: "SİBER ACEMİ" },      // 8 Cards
    { level: 2, cols: 4, pairs: 6, time: 40, name: "MATRİX'E GİRİŞ" },   // 12 Cards
    { level: 3, cols: 4, pairs: 8, time: 50, name: "SİNİR AĞI" },        // 16 Cards
    { level: 4, cols: 5, pairs: 10, time: 60, name: "ZİHİN HACKER'I" },  // 20 Cards
    { level: 5, cols: 6, pairs: 12, time: 70, name: "SİBER TANRI" },     // 24 Cards
];
`;
code = code.replace(/\/\/ ==============================\r?\n\/\/ 1\. OYUN YAPILANDIRMASI.*?\r?\n\/\/ ==============================\r?\nconst LEVELS = \[[\s\S]*?\];/m, newLevels);

// 3. Fix the grid styles for Level 5 (6 columns)
code = code.replace(
    /style=\{\{ gridTemplateColumns: `repeat\(\$\{LEVELS\[currentLevel - 1\]\.cols\}, minmax\(0, 1fr\)\)` \}\}/g,
    'style={{ gridTemplateColumns: `repeat(${LEVELS[currentLevel - 1].cols}, minmax(0, 1fr))` }}'
);

code = code.replace(
    /className=\{cn\("relative perspective-1000 w-full max-w-\[90px\] md:max-w-\[120px\] mx-auto", currentLevel === 4 \? "aspect-square" : "aspect-\[3\/4\]"\)\}/g,
    'className={cn("relative perspective-1000 w-full mx-auto", currentLevel >= 4 ? "aspect-square max-w-[70px] md:max-w-[100px]" : "aspect-[3/4] max-w-[90px] md:max-w-[120px]")}'
);

// 4. Update the futuristic ending screen
// Find the GAME OVER / KAZANDIN screen
const oldEnding = /\{\/\* OYUN BİTTİ \(GAME OVER \/ KAZANDIN\) EKRANI \*\/\}([\s\S]*?)<\/AnimatePresence>/m;
const newEnding = `{/* OYUN BİTTİ (GAME OVER / KAZANDIN) EKRANI */}
            <AnimatePresence>
                {(gameState === 'game_complete' || gameState === 'gameover') && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(30px)' }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
                    >
                        {/* MATRIX KAPANIS EFEKTi (Fütüristik Parçacıklar) */}
                        {gameState === 'game_complete' && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {[...Array(30)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: "100vh", x: Math.random() * window.innerWidth, opacity: 0 }}
                                        animate={{ y: "-100vh", opacity: [0, 1, 0] }}
                                        transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
                                        className="absolute w-1 h-12 bg-cyan-500/50 rounded-full blur-[2px]"
                                    />
                                ))}
                            </div>
                        )}

                        <motion.div 
                            initial={{ scale: 0.5, y: 100, rotateX: 45 }} 
                            animate={{ scale: 1, y: 0, rotateX: 0 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className={cn(
                                "bg-[#111116]/80 backdrop-blur-2xl border-2 rounded-[2rem] p-8 text-center max-w-sm w-full relative overflow-hidden",
                                gameState === 'game_complete' ? "border-cyan-500/50 shadow-[0_0_100px_rgba(34,211,238,0.4)] animate-[pulse_3s_ease-in-out_Infinity]" : "border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.2)]"
                            )}
                        >
                            <div className={cn("absolute top-0 inset-x-0 h-2 bg-gradient-to-r", gameState === 'game_complete' ? "from-cyan-400 via-fuchsia-500 to-cyan-400" : "from-red-600 to-orange-600")} />

                            <div className={cn(
                                "w-32 h-32 rounded-[2rem] bg-black overflow-hidden mx-auto mb-8 border-4 relative flex items-center justify-center transition-transform", 
                                gameState === 'game_complete' ? "border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.6)] scale-110" : "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)] grayscale"
                            )}>
                                <img src="/images/robot_moffi.jpg" className="w-full h-full object-cover scale-125 mix-blend-screen" />
                            </div>

                            <h2 className={cn(
                                "text-4xl font-black uppercase tracking-tighter mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]",
                                gameState === 'game_complete' ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-400" : "text-red-500"
                            )}>
                                {gameState === 'game_complete' ? 'SİBER TANRI!' : 'SİSTEM ÇÖKTÜ'}
                            </h2>
                            <p className="text-gray-400 text-sm font-medium mb-8">
                                {gameState === 'game_complete' ? 'BİLİNCİN MATRİX İLE TAMAMEN BÜTÜNLEŞTİ.' : 'Bağlantı koptu. Daha hızlı olmalısın.'}
                            </p>

                            <div className="w-full bg-black/60 rounded-2xl p-6 border border-white/10 mb-8 shadow-inner relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 block">Toplanan Moffi Kredisi</span>
                                <div className="flex items-center justify-center gap-3">
                                    <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                                    <span className="text-6xl font-black text-white font-mono tracking-tighter drop-shadow-lg">{totalScore}</span>
                                </div>
                            </div>

                            <button onClick={() => onGameOver(totalScore)} className="w-full py-4 bg-white text-black font-black rounded-xl text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                                Ağa Geri Dön <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>`;
            
code = code.replace(oldEnding, newEnding);

fs.writeFileSync('src/components/game/PetMemoryGame.tsx', code, 'utf8');
console.log('Successfully updated emojis to pet theme, restored 5 levels and added futuristic ending.');
