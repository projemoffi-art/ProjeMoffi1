const fs = require('fs');
let code = fs.readFileSync('src/components/game/MoffiRunGame.tsx', 'utf8');

// Update player x lerp from 18 to 25 for snappier left/right transitions
code = code.replace(
    /d\.lane \* LANE_WIDTH,\s*18 \* effectiveDelta/g,
    "d.lane * LANE_WIDTH,\n            25 * effectiveDelta"
);

// Update camera lerp slightly faster for smoother follow
code = code.replace(
    /camera\.position\.x \* 0\.35, 0\.12\);/g,
    "camera.position.x * 0.35, 0.15);"
);

fs.writeFileSync('src/components/game/MoffiRunGame.tsx', code, 'utf8');
console.log('Lane transitions patched.');
