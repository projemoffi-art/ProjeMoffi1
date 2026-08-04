const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git')) {
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
    // We will match exactly the string /community inside any quote type
    const regex = /(['"`])\/community(['"`])/g;
    if (regex.test(content)) {
        let newContent = content.replace(regex, "$1/topluluk$2");
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Updated string quotes in', file);
    }
});
