const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules')) {
                results = results.concat(walk(file));
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("'/community'") || content.includes('"/community"')) {
        let newContent = content.replace(/'\/community'/g, "'/topluluk'").replace(/"\/community"/g, '"/topluluk"');
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Updated', file);
    }
});
