const fs = require('fs');

let code = fs.readFileSync('src/components/game/MoffiRunGame.tsx', 'utf8');

// 1. Reset startTime on triggerStart
const triggerStartMatch = /gs\.current = \{[\s\S]*?missionsProgress: \{ coin: 0, slide: 0, powerup: 0, distance: 0 \},\r?\n\s*\};/;
if (code.match(triggerStartMatch)) {
    code = code.replace(
        triggerStartMatch,
        "$&" + "\n        startTime.current = 0;"
    );
} else {
    console.log("triggerStart match failed");
}

// 2. Fix the speed logic robustly using regex
const speedRegex = /\/\/ --- SPEED CURVE \(GDD spec: non-linear\) ---[\s\S]*?levelGen\.currentSpeed = d\.speed;/;

const newSpeedLogic = `// --- STAGE-BASED SPEED (Matematiksel Pacing) ---
        const slow = d.slowActive ? SLOW_MOTION_FACTOR : 1;
        
        // Hız, ZAMANLA değil, AŞAMA İLE (Stage) belirlenir.
        const stageTargetSpeed = SPEED_INITIAL + ((currentStage - 1) * 9); 
        
        // Yumuşak geçiş (Lerp) ile hedefe ulaştırırız.
        d.speed = THREE.MathUtils.lerp(d.speed, stageTargetSpeed * slow, 0.5 * delta);
        
        // Güvenlik sınırı
        d.speed = Math.min(SPEED_MAX * slow, d.speed);
        levelGen.currentSpeed = d.speed;`;

if (code.match(speedRegex)) {
    code = code.replace(speedRegex, newSpeedLogic);
} else {
    console.log("speed regex match failed");
}

fs.writeFileSync('src/components/game/MoffiRunGame.tsx', code, 'utf8');
console.log('Speed issues and startTime reset patched.');
