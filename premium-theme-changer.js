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
    
    // Core Layout Backgrounds
    content = content.replace(/bg-\[#050505\]/g, 'bg-slate-50/50'); 
    content = content.replace(/bg-black(?!\/)/g, 'bg-slate-50/50');
    
    // Cards and Panels (Needs shadow and borders for light mode!)
    content = content.replace(/bg-\[#111018\]/g, 'bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/60 backdrop-blur-xl');
    content = content.replace(/bg-\[#1A1A1A\]/g, 'bg-white shadow-sm border border-slate-100');
    content = content.replace(/bg-\[#1E1E1E\]/g, 'bg-white shadow-sm border border-slate-100');
    
    // Text colors
    content = content.replace(/text-white\/90/g, 'text-slate-800');
    content = content.replace(/text-white\/80/g, 'text-slate-700');
    content = content.replace(/text-white\/70/g, 'text-slate-600');
    content = content.replace(/text-white\/60/g, 'text-slate-500');
    content = content.replace(/text-white\/50/g, 'text-slate-500');
    content = content.replace(/text-white\/40/g, 'text-slate-400');
    content = content.replace(/text-white\/30/g, 'text-slate-400');
    content = content.replace(/text-white\/20/g, 'text-slate-300');
    
    // Borders
    content = content.replace(/border-white\/5/g, 'border-slate-200/60');
    content = content.replace(/border-white\/10/g, 'border-slate-200');
    content = content.replace(/border-white\/20/g, 'border-slate-300');
    content = content.replace(/border-\[#2A263D\]/g, 'border-slate-200');
    
    // Gradients
    content = content.replace(/from-black\/[0-9]+/g, 'from-white/80');
    content = content.replace(/from-black(?!\/)/g, 'from-white');
    content = content.replace(/to-black\/[0-9]+/g, 'to-white/0');
    content = content.replace(/to-black(?!\/)/g, 'to-white');
    content = content.replace(/from-\[#050505\]/g, 'from-slate-50/50');
    content = content.replace(/to-\[#050505\]/g, 'to-slate-50/50');
    content = content.replace(/from-\[#111018\]/g, 'from-white');
    content = content.replace(/to-\[#111018\]/g, 'to-white');
    
    // Overlays / Modals
    content = content.replace(/bg-black\/40/g, 'bg-white/40 backdrop-blur-md');
    content = content.replace(/bg-black\/60/g, 'bg-white/60 backdrop-blur-lg');
    content = content.replace(/bg-black\/80/g, 'bg-white/80 backdrop-blur-xl');
    content = content.replace(/bg-black\/90/g, 'bg-white/90 backdrop-blur-2xl');
    
    // Accents: make neon colors pastel
    content = content.replace(/text-cyan-400/g, 'text-indigo-500');
    content = content.replace(/text-cyan-500/g, 'text-indigo-600');
    content = content.replace(/bg-cyan-500\/10/g, 'bg-indigo-500/10');
    content = content.replace(/bg-cyan-500\/20/g, 'bg-indigo-500/20');
    content = content.replace(/border-cyan-500\/20/g, 'border-indigo-500/20');
    content = content.replace(/border-cyan-500\/30/g, 'border-indigo-500/30');
    content = content.replace(/from-cyan-400/g, 'from-indigo-300');
    content = content.replace(/via-purple-500/g, 'via-purple-300');
    content = content.replace(/to-fuchsia-500/g, 'to-rose-300');
    
    // Replace text-white safely
    content = content.replace(/className="([^"]*)text-white([^"]*)"/g, (match, p1, p2) => {
        if (/bg-(purple|indigo|blue|green|red|orange|pink|cyan|emerald|fuchsia|rose|teal|sky)-[56789]00/.test(match)) {
            return match;
        }
        if (/from-(purple|indigo|blue|green)-[56789]00/.test(match)) {
            return match;
        }
        return `className="${p1}text-slate-800${p2}"`;
    });

    if (content !== fs.readFileSync(file, 'utf8')) {
        fs.writeFileSync(file, content, 'utf8');
        console.log("Updated " + file);
    }
});
