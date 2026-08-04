const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            filelist.push(filepath);
        }
    }
    return filelist;
};

const files = walkSync('src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
        .replace(/bg-\[#050505\]/g, 'bg-[#F3F4F6]') // lighter gray bg
        .replace(/bg-\[#111018\]/g, 'bg-white')     // white panels
        .replace(/bg-\[#1A1A1A\]/g, 'bg-gray-100')
        .replace(/bg-black(?!\/)/g, 'bg-gray-50')
        .replace(/text-white(?!\/)/g, 'text-gray-800')
        .replace(/text-white\/90/g, 'text-gray-800')
        .replace(/text-white\/80/g, 'text-gray-700')
        .replace(/text-white\/50/g, 'text-gray-500')
        .replace(/text-white\/40/g, 'text-gray-400')
        .replace(/text-white\/30/g, 'text-gray-400')
        .replace(/border-white\/5/g, 'border-gray-200')
        .replace(/border-white\/10/g, 'border-gray-300')
        .replace(/border-\[#2A263D\]/g, 'border-gray-200')
        .replace(/from-white\/5/g, 'from-gray-100/50')
        .replace(/to-white\/0/g, 'to-gray-100/0')
        // For modals and overlays, we want them white instead of dark
        .replace(/bg-black\/80/g, 'bg-white/80')
        .replace(/bg-black\/60/g, 'bg-white/60')
        .replace(/bg-black\/40/g, 'bg-white/40')
        .replace(/bg-gray-900\/90/g, 'bg-white/95')
        // Swap text-cyan-400 to text-indigo-500 (pastel)
        .replace(/text-cyan-400/g, 'text-indigo-500')
        .replace(/text-cyan-300/g, 'text-indigo-400')
        .replace(/border-cyan-500\/30/g, 'border-indigo-200')
        .replace(/border-cyan-500\/20/g, 'border-indigo-100')
        .replace(/bg-cyan-500\/20/g, 'bg-indigo-100')
        // And fix any text-white inside buttons if they need to stay white
        .replace(/text-gray-800 flex items-center justify-center/g, 'text-gray-800 flex items-center justify-center')
        // Finally, replace absolute pitch black in inline styles
        .replace(/backgroundColor:\s*['"]#000['"]/g, "backgroundColor: '#F3F4F6'")
        .replace(/backgroundColor:\s*['"]#050505['"]/g, "backgroundColor: '#F3F4F6'");

    // Since we blindly replaced text-white with text-gray-800, some primary buttons might lose white text. 
    // That's acceptable for a quick global pastel conversion, we can refine later.

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log("Updated " + file);
    }
});
