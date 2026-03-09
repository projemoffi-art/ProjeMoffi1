const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\uveys\\OneDrive\\Masaüstü\\ProjeMoffi1\\MoffiVercel\\src\\app\\community\\page.tsx', 'utf8');

function count(str, sub) {
    let c = 0;
    let pos = 0;
    while ((pos = str.indexOf(sub, pos)) !== -1) {
        c++;
        pos += sub.length;
    }
    return c;
}

console.log('Braces {}:', count(content, '{'), count(content, '}'));
console.log('Parentheses ():', count(content, '('), count(content, ')'));
console.log('AnimatePresence:', count(content, '<AnimatePresence'), count(content, '</AnimatePresence>'));
console.log('motion.div:', count(content, '<motion.div'), count(content, '</motion.div>'));
