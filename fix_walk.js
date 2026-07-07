const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/walk/WalkQuickSheet.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace the main wrapper bg
content = content.replace('bg-slate-100 flex flex-col overflow-hidden', 'bg-background flex flex-col overflow-hidden');

// Text colors
content = content.replace(/\btext-slate-800\b/g, 'text-slate-800 dark:text-slate-100');
content = content.replace(/\btext-slate-700\b/g, 'text-slate-700 dark:text-slate-200');
content = content.replace(/\btext-slate-600\b/g, 'text-slate-600 dark:text-slate-300');

// Slate backgrounds that need dark mode equivalents
content = content.replace(/\bbg-slate-50\b/g, 'bg-slate-50 dark:bg-white/5');
content = content.replace(/\bbg-slate-100\b/g, 'bg-slate-100 dark:bg-white/10');
content = content.replace(/\bbg-slate-200\/50\b/g, 'bg-slate-200/50 dark:bg-white/5');
content = content.replace(/\bbg-slate-200\b/g, 'bg-slate-200 dark:bg-white/10');

// Slate borders
content = content.replace(/\bborder-slate-200\/50\b/g, 'border-slate-200/50 dark:border-white/5');

// Fix potential duplicates if run multiple times
content = content.replace(/dark:text-slate-100 dark:text-slate-100/g, 'dark:text-slate-100');
content = content.replace(/dark:text-slate-200 dark:text-slate-200/g, 'dark:text-slate-200');
content = content.replace(/dark:text-slate-300 dark:text-slate-300/g, 'dark:text-slate-300');
content = content.replace(/dark:bg-white\/5 dark:bg-white\/5/g, 'dark:bg-white/5');
content = content.replace(/dark:bg-white\/10 dark:bg-white\/10/g, 'dark:bg-white/10');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed WalkQuickSheet dark mode classes.');
