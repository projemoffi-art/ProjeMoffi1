const fs = require('fs');

// 1. UPDATE GAME PAGE (Parent)
let pageCode = fs.readFileSync('src/app/game/page.tsx', 'utf8');

// We need to pass userCoins and onSpendCoins to PetMemoryGame
pageCode = pageCode.replace(
    /<PetMemoryGame onGameOver=\{handleGameOver\} onClose=\{\(\) => setActiveMiniGame\(null\)\} \/>/,
    `<PetMemoryGame 
                                onGameOver={handleGameOver} 
                                onClose={() => setActiveMiniGame(null)} 
                                userCoins={localCoins}
                                onSpendCoins={(amount) => {
                                    if (localCoins >= amount) {
                                        setLocalCoins(prev => prev - amount);
                                        return true;
                                    }
                                    return false;
                                }}
                            />`
);

fs.writeFileSync('src/app/game/page.tsx', pageCode, 'utf8');


// 2. UPDATE PET MEMORY GAME (Child)
let gameCode = fs.readFileSync('src/components/game/PetMemoryGame.tsx', 'utf8');

// Update GameProps
gameCode = gameCode.replace(
    /interface GameProps \{\r?\n\s*onGameOver: \(score: number\) => void;\r?\n\s*onClose: \(\) => void;\r?\n\}/,
    `interface GameProps {
    onGameOver: (score: number) => void;
    onClose: () => void;
    userCoins?: number;
    onSpendCoins?: (amount: number) => boolean;
}`
);

// Destructure new props
gameCode = gameCode.replace(
    /export default function PetMemoryGame\(\{ onGameOver, onClose \}: GameProps\) \{/,
    `export default function PetMemoryGame({ onGameOver, onClose, userCoins = 0, onSpendCoins }: GameProps) {`
);

// Add 'second_chance' to game state type
gameCode = gameCode.replace(
    /const \[gameState, setGameState\] = useState\<'playing' \| 'level_complete' \| 'game_complete' \| 'gameover'\>\('playing'\);/,
    `const [gameState, setGameState] = useState<'playing' | 'level_complete' | 'game_complete' | 'gameover' | 'second_chance'>('playing');`
);

// Timer logic update (from gameover to second_chance)
gameCode = gameCode.replace(
    /if \(prev <= 1\) \{\r?\n\s*setGameState\('gameover'\);\r?\n\s*return 0;\r?\n\s*\}/,
    `if (prev <= 1) {
                    setGameState('second_chance');
                    return 0;
                }`
);

// Add the Second Chance UI in the AnimatePresence block
const secondChanceUI = `
            {/* İKİNCİ HAK (SECOND CHANCE) EKRANI */}
            <AnimatePresence>
                {gameState === 'second_chance' && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-[#111116] border border-orange-500/30 rounded-[2rem] p-8 text-center max-w-sm w-full shadow-[0_0_60px_rgba(249,115,22,0.2)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400" />

                            <div className="w-24 h-24 rounded-[1rem] bg-black overflow-hidden mx-auto mb-6 border-2 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.4)] relative flex items-center justify-center">
                                <Timer className="w-12 h-12 text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,1)] animate-pulse" />
                            </div>

                            <h2 className="text-2xl font-black text-orange-400 uppercase tracking-tighter mb-2">BAĞLANTI KOPUYOR!</h2>
                            <p className="text-gray-400 text-sm font-medium mb-6">
                                Süren doldu ama verileri kurtarabiliriz. <strong className="text-white">50 Moffi Coin</strong> karşılığında sisteme ek <strong className="text-cyan-400">30 saniye</strong> enjekte et ve kaldığın yerden devam et!
                            </p>

                            <div className="w-full bg-black/40 rounded-2xl p-4 border border-white/5 mb-6 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mevcut Bakiye</span>
                                <div className="flex items-center gap-1.5">
                                    <Coins className="w-4 h-4 text-amber-400" />
                                    <span className={cn("text-lg font-black font-mono", userCoins < 50 ? "text-red-500" : "text-white")}>{userCoins}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => {
                                        if (onSpendCoins && onSpendCoins(50)) {
                                            setTimeLeft(30);
                                            setGameState('playing');
                                            addFloatingText('SÜRE UZATILDI!', 'text-cyan-400');
                                        }
                                    }}
                                    disabled={userCoins < 50}
                                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-xl text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                >
                                    50 Coin Öde & Devam Et <Zap className="w-5 h-5 fill-white" />
                                </button>
                                <button 
                                    onClick={() => setGameState('gameover')} 
                                    className="w-full py-4 bg-white/5 text-gray-400 font-bold rounded-xl text-sm hover:bg-white/10 transition-colors"
                                >
                                    Vazgeç ve Çık
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
`;

// Insert the Second Chance UI before the GAME OVER screen
gameCode = gameCode.replace(
    /\{\/\* OYUN BİTTİ \(GAME OVER \/ KAZANDIN\) EKRANI \*\/\}/,
    secondChanceUI + '\n            {/* OYUN BİTTİ (GAME OVER / KAZANDIN) EKRANI */}'
);

// We need to import Coins from lucide-react if not imported
if (!gameCode.includes('Coins')) {
    gameCode = gameCode.replace(
        /import \{\s*Trophy, Timer, X, ArrowRight, Flame\s*\} from "lucide-react";/,
        'import { Trophy, Timer, X, ArrowRight, Flame, Coins, Zap } from "lucide-react";'
    );
}

fs.writeFileSync('src/components/game/PetMemoryGame.tsx', gameCode, 'utf8');
console.log('Successfully implemented Second Chance mechanic with Moffi Coins!');
