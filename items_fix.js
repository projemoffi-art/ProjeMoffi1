const fs = require('fs');

let code = fs.readFileSync('src/components/game/MoffiJumpGame.tsx', 'utf8');

// 1. Add Pet Items Array constant
const itemsConstant = `    const PLAYER_SIZE = 40;

    const PET_ITEMS = ["🦴", "🐟", "🧶", "🥩", "🐁", "🐾"];
`;
code = code.replace(/    const PLAYER_SIZE = 40;/, itemsConstant);

// 2. Add items to Virtual World State
code = code.replace(
    /const platforms = useRef<\{ id: number, x: number, y: number, type: PlatformType, dx: number, isBroken: boolean \}\[\]>\(\[\]\);/,
    `const platforms = useRef<{ id: number, x: number, y: number, type: PlatformType, dx: number, isBroken: boolean }[]>([]);
    const items = useRef<{ id: number, x: number, y: number, emoji: string, collected: boolean, platformId: number }[]>([]);`
);

// 3. Clear items in initGame
code = code.replace(
    /platforms\.current = \[\];/,
    `platforms.current = [];
            items.current = [];`
);
code = code.replace(
    /platforms\.current = platforms\.current\.filter\(p => p\.y < 0\);/,
    `platforms.current = platforms.current.filter(p => p.y < 0);
            items.current = items.current.filter(i => i.y < 0);`
);

// 4. Spawn items inside spawnPlatform
const spawnReplacement = `
        const id = Date.now() + Math.random();
        platforms.current.push({
            id, x, y, type, dx, isBroken: false
        });

        // 30% chance to spawn a pet-themed reward on a normal or moving platform
        if ((type === 'normal' || type === 'moving') && Math.random() < 0.3) {
            items.current.push({
                id: Date.now() + Math.random(),
                platformId: id,
                x: x + PLATFORM_WIDTH / 2 - 12, // Center on platform
                y: y - 25, // Resting on top
                emoji: PET_ITEMS[Math.floor(Math.random() * PET_ITEMS.length)],
                collected: false
            });
        }
    };`;
code = code.replace(
    /const x = Math\.random\(\) \* \(screenWidth - PLATFORM_WIDTH\);\s*platforms\.current\.push\(\{\s*id: Date\.now\(\) \+ Math\.random\(\),\s*x, y, type, dx, isBroken: false\s*\}\);\s*\};\s*/,
    `const x = Math.random() * (screenWidth - PLATFORM_WIDTH);` + spawnReplacement
);


// 5. Update items position (for moving platforms and camera logic)
// Inside physics loop, right after moving platforms down:
code = code.replace(
    /platforms\.current\.forEach\(p => \{\r?\n\s*p\.y \+= diff;\r?\n\s*\}\);/,
    `platforms.current.forEach(p => {
                    p.y += diff;
                });
                items.current.forEach(i => {
                    i.y += diff;
                });`
);

// Moving platforms x update for items resting on them
const platformMoveFix = `platforms.current.forEach(p => {
                if (p.type === 'moving' && !p.isBroken) {
                    p.x += p.dx;
                    if (p.x < 0 || p.x + PLATFORM_WIDTH > width) {
                        p.dx *= -1; // Bounce off walls
                    }
                    // Move the item attached to this platform
                    const attachedItem = items.current.find(i => i.platformId === p.id && !i.collected);
                    if (attachedItem) {
                        attachedItem.x += p.dx;
                    }
                }
            });`;
code = code.replace(
    /platforms\.current\.forEach\(p => \{\r?\n\s*if \(p\.type === 'moving' && !p\.isBroken\) \{\r?\n\s*p\.x \+= p\.dx;\r?\n\s*if \(p\.x < 0 \|\| p\.x \+ PLATFORM_WIDTH > width\) \{\r?\n\s*p\.dx \*= -1; \/\/ Bounce off walls\r?\n\s*\}\r?\n\s*\}\r?\n\s*\}\);/,
    platformMoveFix
);

// 6. Check Collision with Items
const itemCollision = `
            // Item Collision
            for (let i = 0; i < items.current.length; i++) {
                const item = items.current[i];
                if (item.collected) continue;

                // Simple AABB collision
                const isXHit = (player.current.x + PLAYER_SIZE > item.x) && (player.current.x < item.x + 24);
                const isYHit = (player.current.y + PLAYER_SIZE > item.y) && (player.current.y < item.y + 24);

                if (isXHit && isYHit) {
                    item.collected = true;
                    setScore(prev => prev + 150); // Bonus score for collecting pet items
                    
                    // Visual effect
                    const el = document.getElementById(\`item-\${item.id}\`);
                    if (el) {
                        el.style.transition = "all 0.3s ease-out";
                        el.style.transform = \`translate3d(\${item.x}px, \${item.y - 50}px, 0) scale(1.5)\`;
                        el.style.opacity = "0";
                    }
                }
            }
`;
code = code.replace(
    /\/\/ 6\. Cleanup invisible platforms/,
    itemCollision + "\n            // 6. Cleanup invisible platforms"
);

// Cleanup items
code = code.replace(
    /platforms\.current = platforms\.current\.filter\(p => p\.y < height \+ 50 && !p\.isBroken\);/,
    `platforms.current = platforms.current.filter(p => p.y < height + 50 && !p.isBroken);
            items.current = items.current.filter(i => i.y < height + 50 && !i.collected);`
);

// 7. Render Items via DOM
const renderItems = `
            items.current.forEach(i => {
                if (!i.collected) {
                    const iEl = document.getElementById(\`item-\${i.id}\`);
                    if (iEl) {
                        iEl.style.transform = \`translate3d(\${i.x}px, \${i.y}px, 0)\`;
                    }
                }
            });
`;
code = code.replace(
    /platforms\.current\.forEach\(p => \{\r?\n\s*const pEl = document\.getElementById\(\\\`platform-\\\$\\{p\.id\\}\\\`\);\r?\n\s*if \(pEl\) \{\r?\n\s*pEl\.style\.transform = \\\`translate3d\(\\\$\\{p\.x\\}px, \\\$\\{p\.y\\}px, 0\)\\\`;\r?\n\s*\}\r?\n\s*\}\);/,
    `platforms.current.forEach(p => {
                const pEl = document.getElementById(\`platform-\${p.id}\`);
                if (pEl) {
                    pEl.style.transform = \`translate3d(\${p.x}px, \${p.y}px, 0)\`;
                }
            });` + renderItems
);


// 8. Add Items JSX
const jsxItems = `
                    {/* Items */}
                    {items.current.map(i => !i.collected && (
                        <div
                            key={i.id}
                            id={\`item-\${i.id}\`}
                            className="absolute z-20 text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] will-change-transform"
                            style={{ width: 24, height: 24, top: 0, left: 0 }}
                        >
                            {i.emoji}
                        </div>
                    ))}
`;
code = code.replace(
    /\{\/\* Player \*\/\}/,
    jsxItems + "\n                    {/* Player */}"
);


fs.writeFileSync('src/components/game/MoffiJumpGame.tsx', code, 'utf8');
console.log('Successfully added pet-themed rewards to MoffiJumpGame platforms!');
