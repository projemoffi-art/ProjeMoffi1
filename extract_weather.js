const fs = require('fs');
const content = fs.readFileSync('src/components/walk/WalkQuickSheet.tsx', 'utf-8');
const startStr = '// ─── Weather Sphere Effect';
const endStr = '// ─── Double Ring Dome';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find markers');
    process.exit(1);
}

// Find the exact PineTree function start
const functionStartStr = 'function PineTree';
const pineIdx = content.lastIndexOf(functionStartStr, startIdx > -1 ? startIdx + 100 : startIdx);
const realStart = pineIdx > -1 ? pineIdx : startIdx;

const weatherCode = content.substring(realStart, endIdx);

const newContent = `import React from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

${weatherCode}
export { WeatherSphereEffect };
`;

fs.writeFileSync('src/components/walk/WeatherSphereEffect.tsx', newContent);

// Remove from WalkQuickSheet
const updatedSheet = content.substring(0, realStart) + content.substring(endIdx);
fs.writeFileSync('src/components/walk/WalkQuickSheet.tsx', updatedSheet);

console.log('Success');
