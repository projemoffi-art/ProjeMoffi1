const fs = require('fs');

let code = fs.readFileSync('src/components/game/MoffiJumpGame.tsx', 'utf8');

// 1. Update spawnPlatform logic to use relative X generation (Zig-zag, max distance, min distance)
const oldSpawnX = /const x = Math\.random\(\) \* \(screenWidth - PLATFORM_WIDTH\);/;

const newSpawnX = `
        let x = 0;
        if (platforms.current.length === 0) {
            x = Math.random() * (screenWidth - PLATFORM_WIDTH);
        } else {
            // Find the highest platform (the last one generated before this one)
            const highestP = platforms.current.reduce((highest, p) => p.y < highest.y ? p : highest, platforms.current[0]);
            
            // Yönü rastgele belirle (Sağa veya Sola)
            let dir = Math.random() > 0.5 ? 1 : -1;
            
            // X ekseninde en az 50, en fazla 140 piksel kaydır (Üst üste binmeyi engeller, ulaşılabilir tutar)
            let shift = Math.random() * 90 + 50; 
            x = highestP.x + (dir * shift);

            // Ekran dışına çıkarsa geri yansıt (Sektirme mantığı)
            if (x < 10) x = shift + 10;
            if (x > screenWidth - PLATFORM_WIDTH - 10) {
                x = screenWidth - PLATFORM_WIDTH - shift - 10;
            }
        }`;

code = code.replace(oldSpawnX, newSpawnX);

// 2. Add an on-screen tip for Screen Wrapping 
// Replace "Cihazını sağa sola yatır veya ekrandaki butonları kullan." with info about screen wrap
code = code.replace(
    /Cihazını sağa sola yatır veya ekrandaki butonları kullan\./,
    "İpucu: Ekranın sağından çıkarsan solundan girersin! Cihazını sağa/sola yatır."
);

fs.writeFileSync('src/components/game/MoffiJumpGame.tsx', code, 'utf8');
console.log('Successfully updated level generation to prevent stacking and unreachable platforms.');
