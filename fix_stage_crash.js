const fs = require('fs');

let code = fs.readFileSync('src/components/game/MoffiRunGame.tsx', 'utf8');

const target = `          // --- STAGE-BASED SPEED (Matematiksel Pacing) ---
          const slow = d.slowActive ? SLOW_MOTION_FACTOR : 1;`;

const replacement = `          // --- STAGE & PACING ---
          const currentStage = Math.min(5, Math.floor(d.distance / 1000) + 1);
          if (currentStage !== stage) {
              onStageChange(currentStage); // Triggers re-render for colors, but safe because it's rare
          }

          // --- STAGE-BASED SPEED (Matematiksel Pacing) ---
          const slow = d.slowActive ? SLOW_MOTION_FACTOR : 1;`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/game/MoffiRunGame.tsx', code, 'utf8');
console.log('Fixed currentStage ReferenceError.');
