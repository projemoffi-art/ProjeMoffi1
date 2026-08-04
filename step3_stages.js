const fs = require('fs');

let code = fs.readFileSync('src/components/game/MoffiRunGame.tsx', 'utf8');

// 1. Add stage state to MoffiRunGame
const gsRefMatch = /const coinsRef = useRef\(0\);/;
const gsRefNew = `const coinsRef = useRef(0);\n    const [stage, setStage] = useState(1);`;
code = code.replace(gsRefMatch, gsRefNew);

// 2. Stage Theme Configuration
const stageThemesStr = `
// =====================================================
// STAGE THEMES (Cyberpunk Progression)
// =====================================================
const STAGE_THEMES: Record<number, { bg: string, fogDist: number, dlColor: string, plColor: string }> = {
    1: { bg: '#0f172a', fogDist: 120, dlColor: '#ffffff', plColor: '#06b6d4' }, // Cyber City
    2: { bg: '#1e1b4b', fogDist: 100, dlColor: '#ff00aa', plColor: '#ff00aa' }, // Neon Tunnels
    3: { bg: '#022c22', fogDist: 80, dlColor: '#00f6ff', plColor: '#00f6ff' },  // Data Stream
    4: { bg: '#4c0519', fogDist: 50, dlColor: '#ffea00', plColor: '#ff0000' },  // Plasma Storm
    5: { bg: '#000000', fogDist: 60, dlColor: '#a855f7', plColor: '#ffffff' }   // Quantum Void
};
`;

code = code.replace(
    /export default function MoffiRunGame/,
    stageThemesStr + "\nexport default function MoffiRunGame"
);

// 3. Reset stage on start
code = code.replace(
    /setPhase\('playing'\);/,
    "setPhase('playing');\n        setStage(1);"
);

// 4. Update Canvas environment based on stage
const canvasMatch = /<Canvas[\s\S]*?<color attach="background" args=\{\['#12231a'\]\} \/>[\s\S]*?<ambientLight intensity=\{1\.0\} \/>[\s\S]*?<directionalLight position=\{\[5, 15, 8\]\} intensity=\{1\.8\} castShadow shadow-mapSize=\{\[1024, 1024\]\} \/>[\s\S]*?<pointLight position=\{\[-5, 8, 5\]\} intensity=\{1\.2\} color="#88ffaa" \/>[\s\S]*?<fog attach="fog" args=\{\['#12231a', 22, 100\]\} \/>[\s\S]*?<Stars radius=\{150\} count=\{2500\} factor=\{3\} \/>/;

const canvasNew = `<Canvas
                shadows
                dpr={[1, 2]}
                camera={{ fov: 60, position: [0, 5, 10], near: 0.1, far: 500 }}
            >
                <color attach="background" args={[STAGE_THEMES[stage]?.bg || '#0f172a']} />
                <ambientLight intensity={1.2} />
                <directionalLight position={[5, 15, 8]} intensity={1.8} color={STAGE_THEMES[stage]?.dlColor || '#ffffff'} castShadow shadow-mapSize={[1024, 1024]} />
                <pointLight position={[-5, 8, 5]} intensity={1.5} color={STAGE_THEMES[stage]?.plColor || '#06b6d4'} />
                <fog attach="fog" args={[STAGE_THEMES[stage]?.bg || '#0f172a', 20, STAGE_THEMES[stage]?.fogDist || 100]} />
                <Stars radius={150} count={stage === 5 ? 5000 : 2500} factor={stage >= 4 ? 6 : 3} fade />`;

code = code.replace(canvasMatch, canvasNew);

// 5. Pass onStageChange to GameScene and update its signature
const gameSceneUsageMatch = `<GameScene
                    gs={gs}
                    phase={phase}
                    onCrash={handleCrash}
                    onCoin={handleCoin}
                    onPowerUp={handlePowerUp}
                    onScore={handleScore}
                />`;

const gameSceneUsageNew = `<GameScene
                    gs={gs}
                    phase={phase}
                    onCrash={handleCrash}
                    onCoin={handleCoin}
                    onPowerUp={handlePowerUp}
                    onScore={handleScore}
                    onStageChange={setStage}
                    stage={stage}
                />`;

code = code.replace(gameSceneUsageMatch, gameSceneUsageNew);

const gameSceneSigMatch = /function GameScene\(\{ gs, phase, onCrash, onCoin, onPowerUp, onScore \}: any\) \{/;
const gameSceneSigNew = `function GameScene({ gs, phase, onCrash, onCoin, onPowerUp, onScore, onStageChange, stage }: any) {`;
code = code.replace(gameSceneSigMatch, gameSceneSigNew);

// 6. Detect Stage Change in useFrame
const speedLogicMatch = `        // --- SPEED CURVE (GDD spec: non-linear) ---
        const slow = d.slowActive ? SLOW_MOTION_FACTOR : 1;
        const targetSpeed = SPEED_INITIAL + Math.pow(elapsed, 1.3) * 0.35;
        d.speed = Math.min(SPEED_MAX * slow, Math.max(d.speed, targetSpeed));
        levelGen.currentSpeed = d.speed;`;

const speedLogicNew = `        // --- STAGE & PACING ---
        const currentStage = Math.min(5, Math.floor(d.distance / 1000) + 1);
        if (currentStage !== stage) {
            onStageChange(currentStage); // Triggers re-render for colors, but safe because it's rare
        }

        // --- SPEED CURVE (GDD spec: non-linear) ---
        const slow = d.slowActive ? SLOW_MOTION_FACTOR : 1;
        // Hız eğrisini stage'e bağlayalım, stage arttıkça baz hız sıçrar.
        const stageBaseSpeed = SPEED_INITIAL + ((currentStage - 1) * 8); 
        const targetSpeed = stageBaseSpeed + Math.pow(elapsed, 1.2) * 0.25;
        d.speed = Math.min(SPEED_MAX * slow, Math.max(d.speed, targetSpeed));
        levelGen.currentSpeed = d.speed;`;

code = code.replace(speedLogicMatch, speedLogicNew);

// 7. Pass stage to RoadSegment
const roadMatch = /<RoadSegment length=\{4000\} zPos=\{-2000\} \/>/;
const roadNew = `<RoadSegment length={8000} zPos={-4000} level={stage} />`;
code = code.replace(roadMatch, roadNew);

// 8. Add Stage text to HUD
const hudCoinsMatch = `<div className="bg-black/60 backdrop-blur px-5 py-2.5 rounded-2xl border border-card-border flex items-center gap-3">
                                <Coins className="text-yellow-400 w-5 h-5" />`;

const hudStageNew = `
                            <div className="bg-cyan-900/60 backdrop-blur px-5 py-1.5 rounded-xl border border-cyan-500/50 flex items-center gap-2 mb-1">
                                <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">Aşama {stage}</span>
                            </div>
                            <div className="bg-black/60 backdrop-blur px-5 py-2.5 rounded-2xl border border-card-border flex items-center gap-3">
                                <Coins className="text-yellow-400 w-5 h-5" />`;
                                
code = code.replace(hudCoinsMatch, hudStageNew);

fs.writeFileSync('src/components/game/MoffiRunGame.tsx', code, 'utf8');
console.log('Step 3: Stage Progression System applied successfully.');
