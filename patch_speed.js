const fs = require('fs');

let code = fs.readFileSync('src/components/game/MoffiRunGame.tsx', 'utf8');

const oldSpeedLogic = `        // --- SPEED CURVE (GDD spec: non-linear) ---
        const slow = d.slowActive ? SLOW_MOTION_FACTOR : 1;
        // Hız eğrisini stage'e bağlayalım, stage arttıkça baz hız sıçrar.
        const stageBaseSpeed = SPEED_INITIAL + ((currentStage - 1) * 8); 
        const targetSpeed = stageBaseSpeed + Math.pow(elapsed, 1.2) * 0.25;
        d.speed = Math.min(SPEED_MAX * slow, Math.max(d.speed, targetSpeed));
        levelGen.currentSpeed = d.speed;`;

const newSpeedLogic = `        // --- STAGE-BASED SPEED (Matematiksel Pacing) ---
        const slow = d.slowActive ? SLOW_MOTION_FACTOR : 1;
        
        // Hız, ZAMANLA değil, AŞAMA İLE (Stage) belirlenir.
        // Stage 1: 12
        // Stage 2: 21
        // Stage 3: 30
        // Stage 4: 39
        // Stage 5: 48
        const stageTargetSpeed = SPEED_INITIAL + ((currentStage - 1) * 9); 
        
        // Aşama atlandığında hızı aniden fırlatmak yerine yumuşak geçiş (Lerp) ile hedefe ulaştırırız.
        d.speed = THREE.MathUtils.lerp(d.speed, stageTargetSpeed * slow, 0.5 * delta);
        
        // Güvenlik sınırı
        d.speed = Math.min(SPEED_MAX * slow, d.speed);
        levelGen.currentSpeed = d.speed;`;

code = code.replace(oldSpeedLogic, newSpeedLogic);

fs.writeFileSync('src/components/game/MoffiRunGame.tsx', code, 'utf8');
console.log('Stage-based speed applied.');
