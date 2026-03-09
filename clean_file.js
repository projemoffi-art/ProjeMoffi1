const fs = require('fs');
const path = 'c:\\Users\\uveys\\OneDrive\\Masaüstü\\ProjeMoffi1\\MoffiVercel\\src\\app\\community\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file might be double-encoded or have BOM issues. Let's try to fix common Turkish corrupted chars.
// But first, let's check for "Ecmascript file had an error" common causes.
// Duplicate state definitions were one. I fixed activeTab.

// Let's look for anything after the last }
const lastBrace = content.lastIndexOf('}');
if (lastBrace !== -1) {
    // Check if there's any junk after the last brace
    const junk = content.slice(lastBrace + 1).trim();
    if (junk) {
        console.log('Found junk after last brace:', junk);
        content = content.slice(0, lastBrace + 1);
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('File cleaned.');
