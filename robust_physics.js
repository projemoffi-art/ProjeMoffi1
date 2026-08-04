const fs = require('fs');

let code = fs.readFileSync('src/components/game/MoffiJumpGame.tsx', 'utf8');

// The new robust fixed-timestep loop
const oldEffectStart = `    useEffect(() => {
        if (gameState !== 'playing') return;

        const loop = () => {`;

const newEffectStart = `    useEffect(() => {
        if (gameState !== 'playing') return;

        let lastTime = performance.now();
        let accumulator = 0;
        const timeStep = 1000 / 60; // 60 FPS Sabit Fizik Adımı (Fixed Timestep)

        const loop = (time: DOMHighResTimeStamp) => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            accumulator += (time - lastTime);
            lastTime = time;

            // Spiral of death koruması (Sekme/kasma olursa fizik motoru çökmesin)
            if (accumulator > 100) accumulator = 100;

            // --------------------------------------------------
            // KESİN VE NET FİZİK MOTORU (60Hz Sabit)
            // --------------------------------------------------
            while (accumulator >= timeStep) {
                // 1. Player X Movement
                if (keys.current.left) player.current.vx = -7;
                else if (keys.current.right) player.current.vx = 7;
                else player.current.vx *= 0.85;

                player.current.x += player.current.vx;

                // Screen Wrap
                if (player.current.x > width) player.current.x = -PLAYER_SIZE;
                if (player.current.x < -PLAYER_SIZE) player.current.x = width;

                // 2. Player Y Movement & Gravity
                player.current.vy += GRAVITY;
                player.current.y += player.current.vy;

                // 3. Collision Detection (Only when falling)
                if (player.current.vy > 0) {
                    for (let i = 0; i < platforms.current.length; i++) {
                        const p = platforms.current[i];
                        if (p.isBroken) continue;

                        const isXOverlap = (player.current.x + PLAYER_SIZE - 10 > p.x) && (player.current.x + 10 < p.x + PLATFORM_WIDTH);
                        const isYOverlap = (player.current.y + PLAYER_SIZE > p.y) && (player.current.y + PLAYER_SIZE < p.y + PLATFORM_HEIGHT + player.current.vy);

                        if (isXOverlap && isYOverlap) {
                            if (p.type === 'fragile') {
                                // Red platforms bounce you ONCE and then break immediately! (Solves impossible soft-locks)
                                p.isBroken = true;
                                player.current.vy = JUMP_FORCE;
                            } else if (p.type === 'spring') {
                                player.current.vy = SPRING_FORCE;
                            } else {
                                player.current.vy = JUMP_FORCE;
                            }
                            
                            const pEl = document.getElementById(\`platform-\${p.id}\`);
                            if (pEl) {
                                pEl.style.transition = 'none';
                                pEl.style.transform = \`translate3d(\${p.x}px, \${p.y + 10}px, 0)\`;
                                setTimeout(() => {
                                    if (pEl && !p.isBroken) {
                                        pEl.style.transition = 'transform 0.1s ease-out';
                                        pEl.style.transform = \`translate3d(\${p.x}px, \${p.y}px, 0)\`;
                                    }
                                }, 50);
                            }
                            break;
                        }
                    }
                }

                // 4. Camera Follow & Score
                if (player.current.y < height / 2) {
                    const diff = (height / 2) - player.current.y;
                    player.current.y += diff;
                    
                    setScore(prev => {
                        const newScore = prev + diff;
                        const newLevel = Math.min(5, Math.floor(newScore / 2000) + 1);
                        if (newLevel !== level) setLevel(newLevel);
                        return newScore;
                    });

                    platforms.current.forEach(p => { p.y += diff; });
                    items.current.forEach(i => { i.y += diff; });

                    const highestPlatform = platforms.current.reduce((min, p) => p.y < min ? p.y : min, height);
                    if (highestPlatform > 0) {
                        spawnPlatform(highestPlatform - (Math.random() * (40 + level*10) + 60), width, level);
                    }
                }

                // 5. Update Platforms (Moving)
                platforms.current.forEach(p => {
                    if (p.type === 'moving' && !p.isBroken) {
                        p.x += p.dx;
                        if (p.x < 0 || p.x + PLATFORM_WIDTH > width) {
                            p.dx *= -1;
                        }
                        const attachedItem = items.current.find(i => i.platformId === p.id && !i.collected);
                        if (attachedItem) attachedItem.x += p.dx;
                    }
                });

                // 6. Item Collision
                for (let i = 0; i < items.current.length; i++) {
                    const item = items.current[i];
                    if (item.collected) continue;

                    const isXHit = (player.current.x + PLAYER_SIZE > item.x) && (player.current.x < item.x + 24);
                    const isYHit = (player.current.y + PLAYER_SIZE > item.y) && (player.current.y < item.y + 24);

                    if (isXHit && isYHit) {
                        item.collected = true;
                        setScore(prev => prev + 150);
                        
                        const el = document.getElementById(\`item-\${item.id}\`);
                        if (el) {
                            el.style.transition = "all 0.3s ease-out";
                            el.style.transform = \`translate3d(\${item.x}px, \${item.y - 50}px, 0) scale(1.5)\`;
                            el.style.opacity = "0";
                        }
                    }
                }

                // 7. Cleanup
                platforms.current = platforms.current.filter(p => p.y < height + 50 && !p.isBroken);
                items.current = items.current.filter(i => i.y < height + 50 && !i.collected);

                // 8. Death Check
                if (player.current.y > height) {
                    gameOver();
                    return; // Break physics loop
                }

                accumulator -= timeStep;
            } // END PHYSICS WHILE LOOP

            // --------------------------------------------------
            // RENDER (DOM GÜNCELLEMESİ)
            // --------------------------------------------------
            const playerEl = document.getElementById('player-avatar');
            if (playerEl) {
                playerEl.style.transform = \`translate3d(\${player.current.x}px, \${player.current.y}px, 0)\`;
            }

            platforms.current.forEach(p => {
                const pEl = document.getElementById(\`platform-\${p.id}\`);
                if (pEl) {
                    pEl.style.transform = \`translate3d(\${p.x}px, \${p.y}px, 0)\`;
                    // Kırılan platformu görsel olarak küçültüp yok et (Opacity & Scale)
                    if (p.isBroken && p.type === 'fragile') {
                        pEl.style.transition = 'all 0.3s ease-out';
                        pEl.style.transform = \`translate3d(\${p.x}px, \${p.y + 50}px, 0) scale(0)\`;
                        pEl.style.opacity = "0";
                    }
                }
            });

            items.current.forEach(i => {
                if (!i.collected) {
                    const iEl = document.getElementById(\`item-\${i.id}\`);
                    if (iEl) {
                        iEl.style.transform = \`translate3d(\${i.x}px, \${i.y}px, 0)\`;
                    }
                }
            });

            requestRef.current = requestAnimationFrame(loop);
        };`;

// We must strip everything from `useEffect(() => { ...` to the end of the `useEffect` block and replace it.
// To do this cleanly, we use string splitting or regex matching accurately.
// Since the loop is huge, we can just replace the entire physics block.

let startIdx = code.indexOf("useEffect(() => {\r\n        if (gameState !== 'playing') return;\r\n\r\n        const loop = () => {");
if (startIdx === -1) startIdx = code.indexOf("useEffect(() => {\n        if (gameState !== 'playing') return;\n\n        const loop = () => {");

let endIdx = code.indexOf("requestRef.current = requestAnimationFrame(loop);\n        return () => cancelAnimationFrame(requestRef.current!);\n    }, [gameState, score, level]);");
if (endIdx === -1) endIdx = code.indexOf("requestRef.current = requestAnimationFrame(loop);\r\n        return () => cancelAnimationFrame(requestRef.current!);\r\n    }, [gameState, score, level]);");

if (startIdx !== -1 && endIdx !== -1) {
    const endStr = "requestRef.current = requestAnimationFrame(loop);\n        return () => cancelAnimationFrame(requestRef.current!);\n    }, [gameState, score, level]);";
    const fullEndIdx = endIdx + endStr.length;
    
    const before = code.substring(0, startIdx);
    const after = code.substring(fullEndIdx);
    
    const finalCode = before + newEffectStart + "\n        return () => cancelAnimationFrame(requestRef.current!);\n    }, [gameState, level]);" + after;
    
    fs.writeFileSync('src/components/game/MoffiJumpGame.tsx', finalCode, 'utf8');
    console.log('Successfully applied fixed-timestep physics and fragile platform bounce fix!');
} else {
    console.log('Failed to find physics block boundaries.');
}

