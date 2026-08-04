const fs = require('fs');

let code = fs.readFileSync('src/components/game/MoffiJumpGame.tsx', 'utf8');

// 1. Replace the old PET_ITEMS array
const oldPetItems = `    const PET_ITEMS = ["🦴", "🐟", "🧶", "🥩", "🐁", "🐾"];`;
const newPetItems = `    // Weighted Item System (Rarity)
    const PET_ITEMS = [
        { emoji: "🐾", score: 50, weight: 40 },   // Common
        { emoji: "🦴", score: 100, weight: 30 },  // Common
        { emoji: "🧶", score: 150, weight: 15 },  // Uncommon
        { emoji: "🐁", score: 250, weight: 10 },  // Rare
        { emoji: "🐟", score: 500, weight: 4 },   // Epic
        { emoji: "🥩", score: 1000, weight: 1 },  // Legendary
    ];`;
code = code.replace(oldPetItems, newPetItems);

// 2. Add score to the items useRef definition
code = code.replace(
    /const items = useRef<\s*\{\s*id: number, x: number, y: number, emoji: string, collected: boolean, platformId: number\s*\}\s*\[\]>\(\[\]\);/,
    `const items = useRef<{ id: number, x: number, y: number, emoji: string, collected: boolean, platformId: number, score: number }[]>([]);`
);


// 3. Update the item spawning logic in spawnPlatform
const oldSpawnLogic = `        // 60% chance to spawn a pet-themed reward on a normal or moving platform
        if ((type === 'normal' || type === 'moving') && Math.random() < 0.6) {
            items.current.push({
                id: Date.now() + Math.random(),
                platformId: id,
                x: x + PLATFORM_WIDTH / 2 - 12, // Center on platform
                y: y - 25, // Resting on top
                emoji: PET_ITEMS[Math.floor(Math.random() * PET_ITEMS.length)],
                collected: false
            });
        }`;

const newSpawnLogic = `        // 35% chance to spawn a pet-themed reward on a normal or moving platform
        if ((type === 'normal' || type === 'moving') && Math.random() < 0.35) {
            // Weighted random selection (Gacha logic)
            const randWeight = Math.random() * 100;
            let currentWeight = 0;
            let selectedItem = PET_ITEMS[0];
            for (let i = 0; i < PET_ITEMS.length; i++) {
                currentWeight += PET_ITEMS[i].weight;
                if (randWeight <= currentWeight) {
                    selectedItem = PET_ITEMS[i];
                    break;
                }
            }

            items.current.push({
                id: Date.now() + Math.random(),
                platformId: id,
                x: x + PLATFORM_WIDTH / 2 - 12,
                y: y - 25,
                emoji: selectedItem.emoji,
                score: selectedItem.score,
                collected: false
            });
        }`;

code = code.replace(oldSpawnLogic, newSpawnLogic);
// Just in case it was 30% or something else, replace via regex if direct string match fails.
if (!code.includes(newSpawnLogic)) {
    code = code.replace(
        /\/\/ 60% chance.*?if \(\(type === 'normal' \|\| type === 'moving'\) && Math\.random\(\) < 0\.6\) \{.*?\}\s*\}/s,
        newSpawnLogic
    );
}
// Try 30% just in case it didn't change correctly last time
if (!code.includes(newSpawnLogic)) {
    code = code.replace(
        /\/\/ 30% chance.*?if \(\(type === 'normal' \|\| type === 'moving'\) && Math\.random\(\) < 0\.3\) \{.*?\}\s*\}/s,
        newSpawnLogic
    );
}

// 4. Update the collision logic to use the item's score and display +SCORE floating text
const oldCollisionLogic = `                        item.collected = true;
                        setScore(prev => prev + 150);
                        
                        const el = document.getElementById(\`item-\${item.id}\`);
                        if (el) {
                            el.style.transition = "all 0.3s ease-out";
                            el.style.transform = \`translate3d(\${item.x}px, \${item.y - 50}px, 0) scale(1.5)\`;
                            el.style.opacity = "0";
                        }`;

const newCollisionLogic = `                        item.collected = true;
                        setScore(prev => prev + item.score); // Use item's dynamic score!
                        
                        const el = document.getElementById(\`item-\${item.id}\`);
                        if (el) {
                            // Professional Floating Text Effect!
                            el.innerHTML = \`<span class="text-green-400 font-black text-base drop-shadow-md">+\${item.score}</span>\`;
                            el.style.transition = "all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
                            el.style.transform = \`translate3d(\${item.x - 10}px, \${item.y - 60}px, 0) scale(1.2)\`;
                            el.style.opacity = "0";
                        }`;
code = code.replace(oldCollisionLogic, newCollisionLogic);


fs.writeFileSync('src/components/game/MoffiJumpGame.tsx', code, 'utf8');
console.log('Successfully implemented rarity-based weighted items system with floating text effect!');
