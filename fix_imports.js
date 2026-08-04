const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

const validHomeComponents = ['CommunitySection', 'FeatureGrid', 'Header', 'HeroCard', 'Recommendations', 'StatusCard'];

walkDir('./src', (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        
        newContent = newContent.replace(/@\/components\/home\/(.*?)(['"])/g, (match, p1, p2) => {
            const baseName = p1.split('/')[0].replace('.tsx', '');
            if (validHomeComponents.includes(baseName)) return match;
            return `@/components/community/${p1}${p2}`;
        });

        newContent = newContent.replace(/(\.\.\/)+home\/(.*?)(['"])/g, (match, prefix, p2, p3) => {
            const baseName = p2.split('/')[0].replace('.tsx', '');
            if (validHomeComponents.includes(baseName)) return match;
            return `${prefix}community/${p2}${p3}`;
        });

        newContent = newContent.replace(/components\/home\/(.*?)(['"])/g, (match, p1, p2) => {
            const baseName = p1.split('/')[0].replace('.tsx', '');
            if (validHomeComponents.includes(baseName)) return match;
            return `components/community/${p1}${p2}`;
        });

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Fixed:', filePath);
        }
    }
});
