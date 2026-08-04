const fs = require('fs');

let code = fs.readFileSync('src/components/game/MoffiJumpGame.tsx', 'utf8');

// 1. Adjust Physics for better jumps
code = code.replace(/const GRAVITY = 0\.4;/, 'const GRAVITY = 0.45;');
code = code.replace(/const JUMP_FORCE = -10;/, 'const JUMP_FORCE = -13;');
code = code.replace(/const SPRING_FORCE = -22;/, 'const SPRING_FORCE = -26;');

// 2. Fix the Initial Floor so the player doesn't fall off while sliding
const oldInitGameFloor = `            // Generate initial floor platform
            platforms.current.push({
                id: Date.now(), x: width / 2 - PLATFORM_WIDTH / 2, y: height - 50, type: 'normal', dx: 0, isBroken: false
            });`;
const newInitGameFloor = `            // Generate solid initial floor (span the entire width)
            for (let i = -PLATFORM_WIDTH; i < width + PLATFORM_WIDTH; i += (PLATFORM_WIDTH - 5)) {
                platforms.current.push({
                    id: Date.now() + i, x: i, y: height - 30, type: 'normal', dx: 0, isBroken: false
                });
            }`;
code = code.replace(oldInitGameFloor, newInitGameFloor);

// 3. Fix Impossible Jumps (Platform Spacing in Pre-fill)
const oldPrefill = `            let currentY = height - 150;
            while (currentY > -height) {
                spawnPlatform(currentY, width, 1);
                currentY -= (Math.random() * 80 + 70); // Gap between 70 and 150
            }`;
const newPrefill = `            let currentY = height - 150;
            while (currentY > -height) {
                spawnPlatform(currentY, width, 1);
                currentY -= (Math.random() * 60 + 50); // Safe reachable gap
            }`;
code = code.replace(oldPrefill, newPrefill);

// 4. Fix Impossible Jumps (Platform Spacing in Loop)
const oldLoopSpawn = /spawnPlatform\(highestPlatform - \(Math\.random\(\) \* \(80 \+ newLevel\*10\) \+ 50\), width, newLevel\);/g;
const newLoopSpawn = `spawnPlatform(highestPlatform - (Math.random() * (40 + newLevel*10) + 60), width, newLevel);`;
code = code.replace(oldLoopSpawn, newLoopSpawn);

// 5. Fix collision so player falls completely THROUGH the floor if they miss (Don't trigger hit on broken)
// Wait, isBroken already has `if (p.isBroken) continue;` which is correct.

// 6. Tweak X Friction to be more responsive
code = code.replace(/else player\.current\.vx \*= 0\.8; \/\/ friction/, 'else player.current.vx *= 0.85; // slightly smoother friction');
code = code.replace(/player\.current\.vx = -6;/g, 'player.current.vx = -7;');
code = code.replace(/player\.current\.vx = 6;/g, 'player.current.vx = 7;');


fs.writeFileSync('src/components/game/MoffiJumpGame.tsx', code, 'utf8');
console.log('Successfully optimized physics and floor generation for MoffiJumpGame!');
