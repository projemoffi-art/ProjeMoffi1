const fs = require('fs');

let code = fs.readFileSync('src/components/game/MoffiRunGame.tsx', 'utf8');

// 1. Update GamePhase type
code = code.replace(
    /type GamePhase = 'menu' \| 'playing' \| 'gameover';/,
    "type GamePhase = 'menu' | 'playing' | 'second_chance' | 'gameover';"
);

// 2. Update Component Props
const oldProps = `export default function MoffiRunGame({
    onClose,
    onGameEnd
}: {
    onClose: () => void;
    onGameEnd?: (result: { score: number; coins: number; missionsCompleted: number }) => void;
}) {`;

const newProps = `export default function MoffiRunGame({
    onClose,
    onGameEnd,
    userCoins = 0,
    onSpendCoins
}: {
    onClose: () => void;
    onGameEnd?: (result: { score: number; coins: number; missionsCompleted: number }) => void;
    userCoins?: number;
    onSpendCoins?: (amount: number) => boolean;
}) {`;
code = code.replace(oldProps, newProps);

// 3. Update handleCrash logic
const oldCrash = `    const handleCrash = () => {
        const completedCount = missions.filter(m => m.done).length;
        onGameEnd?.({ score: scoreRef.current, coins: coinsRef.current, missionsCompleted: completedCount });
        setPhase('gameover');
        gs.current.started = false;
    };`;

const newCrash = `    const finalizeGameOver = () => {
        const completedCount = missions.filter(m => m.done).length;
        onGameEnd?.({ score: scoreRef.current, coins: coinsRef.current, missionsCompleted: completedCount });
        setPhase('gameover');
    };

    const handleCrash = () => {
        gs.current.started = false;
        // If user has enough coins and hasn't revived yet this run (maybe limit to 1 revive?)
        // Let's allow unlimited revives for now as long as they have coins!
        if (userCoins >= 50 && onSpendCoins) {
            setPhase('second_chance');
        } else {
            finalizeGameOver();
        }
    };

    const handleRevive = () => {
        if (onSpendCoins && onSpendCoins(50)) {
            gs.current.shieldActive = true; // Auto invincible on revive
            gs.current.started = true;
            // Clear recent collisions to prevent instant death loop
            gs.current.y = 0; // reset height
            gs.current.isJumping = false;
            gs.current.isSliding = false;
            setPhase('playing');
        }
    };`;
code = code.replace(oldCrash, newCrash);

// 4. Inject Second Chance UI before GAME OVER
const secondChanceUI = `
            {/* SECOND CHANCE (MOFFI COIN) */}
            <AnimatePresence>
                {phase === 'second_chance' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl z-[210] p-8"
                    >
                        <div className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center border-4 border-cyan-400 mb-6 shadow-[0_0_50px_rgba(34,211,238,0.5)]">
                            <Zap className="w-12 h-12 text-cyan-400 animate-pulse" />
                        </div>
                        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 italic mb-4 text-center">SİNYAL<br/>KAYBEDİLDİ!</h2>
                        <p className="text-gray-300 text-center mb-10 max-w-xs text-sm font-medium">Moffi kaza yaptı! <strong className="text-cyan-400">50 Moffi Coin</strong> karşılığında kurtarma dronu çağırıp kaldığın hızdan devam etmek ister misin?</p>
                        
                        <div className="flex flex-col gap-4 w-full max-w-xs">
                            <button
                                onClick={handleRevive}
                                className="w-full bg-cyan-500 text-black py-5 rounded-2xl font-black text-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Coins className="w-6 h-6 fill-black" /> 50 COİN ÖDE
                            </button>
                            <button
                                onClick={finalizeGameOver}
                                className="w-full bg-white/10 text-white py-5 rounded-2xl font-bold text-lg hover:bg-white/20 active:scale-95 transition-all"
                            >
                                PES ET
                            </button>
                        </div>
                        <div className="mt-8 text-cyan-500/60 font-bold text-sm">Mevcut Bakiye: {userCoins} Coin</div>
                    </motion.div>
                )}
            </AnimatePresence>
`;

code = code.replace(
    /\{\/\* GAME OVER \*\/\}/,
    secondChanceUI + "\n            {/* GAME OVER */}"
);

fs.writeFileSync('src/components/game/MoffiRunGame.tsx', code, 'utf8');
console.log('Step 1 UI applied successfully.');
