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

walkDir('./src', (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        
        // 1. /community -> /home
        let newContent = content.replace(/'\/community'/g, "'/home'");
        newContent = newContent.replace(/"\/community"/g, '"/home"');
        newContent = newContent.replace(/\/community/g, '/home');
        
        newContent = newContent.replace(/'\/community\?/g, "'/home?");
        newContent = newContent.replace(/"\/community\?/g, '"/home?');
        newContent = newContent.replace(/\/community\?/g, '/home?');
        
        // 2. /topluluk -> /community
        newContent = newContent.replace(/'\/topluluk'/g, "'/community'");
        newContent = newContent.replace(/"\/topluluk"/g, '"/community"');
        newContent = newContent.replace(/\/topluluk/g, '/community');
        
        newContent = newContent.replace(/'\/topluluk\?/g, "'/community?");
        newContent = newContent.replace(/"\/topluluk\?/g, '"/community?');
        newContent = newContent.replace(/\/topluluk\?/g, '/community?');

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated:', filePath);
        }
    }
});
